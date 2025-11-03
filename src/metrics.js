/**
 * In-memory telemetry registry and metrics engine for Crashless.
 * Provides Prometheus-like metrics collection with rolling time windows.
 *
 * @module metrics
 */

/**
 * Default configuration for metrics collection
 */
const METRICS_CONFIG = {
  windowDuration: 60 * 60 * 1000, // 1 hour rolling window
  maxBuckets: 60,
  bucketDuration: 60 * 1000, // 1-minute buckets
};

/**
 * In-memory metrics registry
 * @private
 */
const registry = {
  requests: new Map(), // key: "METHOD /path"
  errors: new Map(), // key: "ERROR_CODE"
  latencies: new Map(), // key: "METHOD /path"
  recentErrors: [],

  uptime: {
    startTime: Date.now(),
    totalRequests: 0,
    totalErrors: 0,
  },
};

/* ------------------- Private Helpers -------------------- */
function getRequestCounter(method, path) {
  const key = `${method} ${path}`;
  if (!registry.requests.has(key)) {
    registry.requests.set(key, {
      total: 0,
      statusCounts: {},
      firstSeen: Date.now(),
      lastSeen: Date.now(),
    });
  }
  return registry.requests.get(key);
}

function getLatencyHistogram(method, path) {
  const key = `${method} ${path}`;
  if (!registry.latencies.has(key)) {
    registry.latencies.set(key, {
      buckets: [],
      currentBucket: { startTime: Date.now(), values: [] },
    });
  }
  return registry.latencies.get(key);
}

function percentile(sortedValues, p) {
  if (sortedValues.length === 0) return 0;
  const index = Math.ceil(sortedValues.length * p) - 1;
  return sortedValues[Math.max(0, index)];
}

function formatUptime(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
  if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

/* ------------------- Public API -------------------- */

/**
 * Record a request
 * @param {string} method - HTTP method
 * @param {string} path - Request path
 * @param {number} status - HTTP status code
 * @param {number} latency - Request latency in milliseconds
 * @param {boolean} skipErrorRecording - If true, skip auto-recording errors (for explicit error handling)
 */
export function recordRequest(method, path, status, latency, skipErrorRecording = false) {
  const now = Date.now();

  const counter = getRequestCounter(method, path);
  counter.total++;
  counter.statusCounts[status] = (counter.statusCounts[status] || 0) + 1;
  counter.lastSeen = now;

  const histogram = getLatencyHistogram(method, path);
  histogram.currentBucket.values.push(latency);

  const bucketAge = now - histogram.currentBucket.startTime;
  if (bucketAge >= METRICS_CONFIG.bucketDuration) {
    const values = histogram.currentBucket.values.sort((a, b) => a - b);
    const count = values.length;
    if (count > 0) {
      histogram.buckets.push({
        time: histogram.currentBucket.startTime,
        p50: percentile(values, 0.5),
        p95: percentile(values, 0.95),
        p99: percentile(values, 0.99),
        min: values[0],
        max: values[values.length - 1],
        count,
      });
    }
    const cutoff = now - METRICS_CONFIG.windowDuration;
    histogram.buckets = histogram.buckets.filter(b => b.time >= cutoff);
    histogram.currentBucket = { startTime: now, values: [] };
  }

  registry.uptime.totalRequests++;

  // CRITICAL: Only auto-record errors if skipErrorRecording is false
  // When error handler explicitly calls recordError(), it passes skipErrorRecording=true
  // to prevent double counting
  // Only record server errors (500+) automatically, not client errors (400-499)
  if (!skipErrorRecording && status >= 500) {
    queueMicrotask(() => {
      try {
        // For non-explicit error handling paths (e.g., middleware errors)
        recordError(new Error(`HTTP ${status}`), { method, path, status });
      } catch (_) {}
    });
  }
}

/**
 * Record an error - bulletproof implementation with no double counting
 * @param {Error} error - Error object
 * @param {Object} meta - Request metadata
 */
export function recordError(error, meta = {}) {
  if (!error) return; // Guard against null/undefined errors
  
  const now = Date.now();
  const code = String(error.code || error.status || `ERR_${meta.status || 500}`);

  // Error registry bookkeeping - atomic operation
  if (!registry.errors.has(code)) {
    registry.errors.set(code, {
      count: 0,
      firstSeen: now,
      lastSeen: now,
      sample: {
        message: error.message || 'Unknown error',
        status: meta.status || 500,
        path: meta.path || 'unknown',
        method: meta.method || 'UNKNOWN',
      },
    });
  }

  const entry = registry.errors.get(code);
  entry.count++;
  entry.lastSeen = now;

  // Track recent errors (keep last 100)
  registry.recentErrors.unshift({
    code,
    message: error.message || 'Unknown error',
    status: meta.status || 500,
    path: meta.path || 'unknown',
    method: meta.method || 'UNKNOWN',
    timestamp: new Date(now).toISOString(),
    stack: error.stack,
  });
  if (registry.recentErrors.length > 100) {
    registry.recentErrors = registry.recentErrors.slice(0, 100);
  }

  // CRITICAL: Increment global error counter (only once per error)
  registry.uptime.totalErrors++;
  
  // Note: Route-level error count is already handled by recordRequest() statusCounts
  // No need to duplicate here - that would cause double counting
}

/**
 * Get metrics snapshot
 */
export function getMetrics() {
  const now = Date.now();
  const uptime = now - registry.uptime.startTime;

  const finalizedLatencies = new Map();
  for (const [key, histogram] of registry.latencies.entries()) {
    const current = histogram.currentBucket.values;
    if (current.length > 0) {
      const sorted = [...current].sort((a, b) => a - b);
      finalizedLatencies.set(key, {
        buckets: [...histogram.buckets],
        current: {
          time: histogram.currentBucket.startTime,
          p50: percentile(sorted, 0.5),
          p95: percentile(sorted, 0.95),
          p99: percentile(sorted, 0.99),
          min: sorted[0],
          max: sorted[sorted.length - 1],
          count: sorted.length,
        },
      });
    } else {
      finalizedLatencies.set(key, { buckets: [...histogram.buckets], current: null });
    }
  }

  // Average latency across all routes
  let totalLatency = 0;
  let totalCount = 0;
  for (const hist of finalizedLatencies.values()) {
    if (hist.current) {
      totalLatency += hist.current.p50 * hist.current.count;
      totalCount += hist.current.count;
    }
  }
  const avgLatencyMs = totalCount > 0 ? totalLatency / totalCount : 0;

  // Routes summary
  const routes = Array.from(registry.requests.entries()).map(([key, val]) => {
    const latency = finalizedLatencies.get(key);
    const avg = latency?.current ? latency.current.p50 : 0;
    const errorCount = Object.entries(val.statusCounts)
      .filter(([s]) => parseInt(s) >= 400)
      .reduce((sum, [, c]) => sum + c, 0);
    return { path: key, requests: val.total, errors: errorCount, avgLatency: avg };
  });

  return {
    requestsTotal: registry.uptime.totalRequests,
    errorsTotal: registry.uptime.totalErrors,
    avgLatencyMs: Math.round(avgLatencyMs * 100) / 100,
    uptimeSec: Math.floor(uptime / 1000),
    routes,
    _extended: {
      timestamp: new Date(now).toISOString(),
      uptime: {
        seconds: Math.floor(uptime / 1000),
        milliseconds: uptime,
        humanReadable: formatUptime(uptime),
      },
      requests: {
        total: registry.uptime.totalRequests,
        byRoute: Object.fromEntries(
          Array.from(registry.requests.entries()).map(([key, val]) => [
            key,
            {
              total: val.total,
              statusCounts: { ...val.statusCounts },
              firstSeen: new Date(val.firstSeen).toISOString(),
              lastSeen: new Date(val.lastSeen).toISOString(),
            },
          ])
        ),
      },
      errors: {
        total: registry.uptime.totalErrors,
        byCode: Object.fromEntries(
          Array.from(registry.errors.entries()).map(([code, val]) => [
            code,
            {
              count: val.count,
              firstSeen: new Date(val.firstSeen).toISOString(),
              lastSeen: new Date(val.lastSeen).toISOString(),
              sample: val.sample,
            },
          ])
        ),
        recent: registry.recentErrors.slice(0, 50),
      },
      latencies: Object.fromEntries(finalizedLatencies),
    },
  };
}

/**
 * Export Prometheus format
 */
export function exportPrometheus() {
  const m = getMetrics();
  const ext = m._extended;
  const lines = [];

  lines.push(`# HELP crashless_uptime_seconds Server uptime in seconds`);
  lines.push(`# TYPE crashless_uptime_seconds gauge`);
  lines.push(`crashless_uptime_seconds ${m.uptimeSec || 0}`);

  lines.push(`# HELP crashless_requests_total Total requests`);
  lines.push(`# TYPE crashless_requests_total counter`);
  lines.push(`crashless_requests_total ${m.requestsTotal || 0}`);

  if (ext.requests && ext.requests.byRoute) {
    for (const [route, data] of Object.entries(ext.requests.byRoute)) {
      for (const [status, count] of Object.entries(data.statusCounts || {})) {
        const r = route.replace(/"/g, '\\"');
        lines.push(`crashless_requests_total{route="${r}",status="${status}"} ${count}`);
      }
    }
  }

  lines.push(`# HELP crashless_errors_total Total errors`);
  lines.push(`# TYPE crashless_errors_total counter`);
  lines.push(`crashless_errors_total ${m.errorsTotal || 0}`);

  if (ext.errors && ext.errors.byCode) {
    for (const [code, data] of Object.entries(ext.errors.byCode)) {
      const safe = code.replace(/"/g, '\\"');
      lines.push(`crashless_errors_total{code="${safe}"} ${data.count || 0}`);
    }
  }

  lines.push(`# HELP crashless_avg_latency_ms Average latency`);
  lines.push(`# TYPE crashless_avg_latency_ms gauge`);
  lines.push(`crashless_avg_latency_ms ${m.avgLatencyMs || 0}`);

  return lines.join('\n') + '\n';
}

/**
 * Export OpenTelemetry format
 */
export function exportOpenTelemetry() {
  const metrics = getMetrics();
  const ext = metrics._extended || {};
  const now = Date.now();
  const otel = [];

  otel.push({
    name: 'crashless.uptime',
    description: 'Server uptime in seconds',
    unit: 's',
    gauge: { dataPoints: [{ timeUnixNano: now * 1e6, asInt: metrics.uptimeSec || 0 }] },
  });
  otel.push({
    name: 'crashless.requests.total',
    description: 'Total requests',
    unit: '1',
    sum: {
      dataPoints: [{ timeUnixNano: now * 1e6, asInt: metrics.requestsTotal || 0 }],
      aggregationTemporality: 2,
      isMonotonic: true,
    },
  });
  otel.push({
    name: 'crashless.errors.total',
    description: 'Total errors',
    unit: '1',
    sum: {
      dataPoints: [{ timeUnixNano: now * 1e6, asInt: metrics.errorsTotal || 0 }],
      aggregationTemporality: 2,
      isMonotonic: true,
    },
  });

  return {
    resourceMetrics: [
      {
        resource: {
          attributes: [
            { key: 'service.name', value: { stringValue: 'crashless' } },
            { key: 'service.version', value: { stringValue: '0.3.0' } },
          ],
        },
        scopeMetrics: [{ scope: { name: 'crashless', version: '0.3.0' }, metrics: otel }],
      },
    ],
  };
}

/**
 * Reset all metrics
 */
export function resetMetrics() {
  registry.requests.clear();
  registry.errors.clear();
  registry.latencies.clear();
  registry.recentErrors = [];
  registry.uptime = {
    startTime: Date.now(),
    totalRequests: 0,
    totalErrors: 0,
  };
}