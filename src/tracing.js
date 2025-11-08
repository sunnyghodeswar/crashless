/**
 * Distributed Tracing System for Crashless
 * Uses AsyncLocalStorage for automatic trace context propagation
 * Provides zero-config tracing with OTLP-compatible export
 *
 * @module tracing
 */

import { AsyncLocalStorage } from 'async_hooks';
import { randomBytes } from 'crypto';

/**
 * Trace context stored in AsyncLocalStorage
 * @typedef {Object} TraceContext
 * @property {string} traceId - Unique trace identifier
 * @property {string} spanId - Current span identifier
 * @property {Array<string>} spanStack - Stack of parent span IDs
 */

/**
 * Span data structure
 * @typedef {Object} Span
 * @property {string} traceId - Trace identifier
 * @property {string} spanId - Unique span identifier
 * @property {string} parentSpanId - Parent span ID (null for root)
 * @property {string} name - Span name (e.g., "GET /api/users", "db.query")
 * @property {number} startTime - Start timestamp in milliseconds
 * @property {number} duration - Duration in milliseconds
 * @property {string} kind - Span kind: "server", "client", "internal"
 * @property {string} status - "ok", "error", "unset"
 * @property {Object} attributes - Key-value metadata
 * @property {Array<Object>} events - Array of events (e.g., "db.findUser", "fetch.postsAPI")
 * @property {Error} error - Error object if status is "error"
 */

/**
 * Event structure within a span
 * @typedef {Object} SpanEvent
 * @property {string} name - Event name (e.g., "db.findUser")
 * @property {number} timeUnixNano - Event timestamp in nanoseconds
 * @property {Array<Object>} attributes - Event attributes
 */

// AsyncLocalStorage for trace context propagation
const traceContext = new AsyncLocalStorage();

/**
 * In-memory trace storage
 * @private
 */
const traceRegistry = {
  traces: new Map(), // traceId -> { traceId, spans: [], startTime, endTime, rootSpanId }
  spans: new Map(), // spanId -> Span
  completedTraces: [], // Array of completed traces for export
  maxTraces: 1000, // Maximum number of traces to keep
  maxAge: 60 * 60 * 1000, // 1 hour
  samplingRate: 10, // Sample 1 in 10 requests (1 = sample all, 10 = sample 1 in 10)
  enabled: true, // Tracing enabled/disabled
};

// Optimized: Debounce cleanup to avoid running on every trace start
let cleanupScheduled = false;
let cleanupTimer = null;
const CLEANUP_DEBOUNCE_MS = 5000; // Run cleanup at most once every 5 seconds
const CLEANUP_TRACE_THRESHOLD = 10; // Only schedule cleanup if we have many traces

/**
 * Generate a unique trace/span ID (32-char hex string)
 * Optimized: Use faster ID generation (crypto.randomBytes is faster than UUID)
 */
function generateId() {
  // Use crypto.randomBytes for faster ID generation (avoid UUID string manipulation)
  return randomBytes(16).toString('hex'); // 32-char hex string
}

/**
 * Get or create trace context from AsyncLocalStorage
 * Optimized: Cache context in request object after first lookup to avoid repeated AsyncLocalStorage calls
 * @param {Object} req - Optional request object to cache context
 * @returns {TraceContext|null}
 */
export function getTraceContext(req = null) {
  // If request object provided and context already cached, return cached
  if (req && req.__crashlessTraceContext !== undefined) {
    return req.__crashlessTraceContext;
  }
  
  const context = traceContext.getStore() || null;
  
  // Cache in request object if provided
  if (req) {
    req.__crashlessTraceContext = context;
  }
  
  return context;
}

/**
 * Run a callback within a trace context
 * @param {TraceContext} context - Trace context
 * @param {Function} callback - Function to execute
 * @returns {*} Result of callback
 */
export function runInTraceContext(context, callback) {
  return traceContext.run(context, callback);
}

/**
 * Check if a trace should be sampled (fast check without creating objects)
 * @returns {boolean} True if should sample
 */
export function shouldSampleTrace() {
  if (!traceRegistry.enabled) return false;
  
  const rate = traceRegistry.samplingRate;
  
  // Handle percentage-based sampling (0-1): 0.1 = 10%, 0.2 = 20%, 1.0 = 100%
  if (rate > 0 && rate <= 1) {
    return Math.random() < rate;
  }
  
  // Handle count-based sampling (> 1): sample 1 in N requests
  // e.g., samplingRate = 10 means sample 1 in 10 requests
  if (rate > 1) {
    return Math.random() * rate < 1;
  }
  
  // Invalid or zero sampling rate - don't sample
  return false;
}

/**
 * Start a new trace for a request
 * @param {Object} options - Trace options
 * @param {string} options.name - Trace/span name
 * @param {Object} options.attributes - Initial attributes
 * @param {boolean} options.shouldSample - Whether to sample this trace (deprecated, use shouldSampleTrace() first)
 * @returns {TraceContext} Trace context
 */
export function startTrace({ name, attributes = {}, shouldSample = true }) {
  // Note: Sampling should be checked BEFORE calling this function via shouldSampleTrace()
  // This check is kept for backward compatibility but should be optimized away
  // Only perform redundant check if shouldSample is true and samplingRate > 1 (count-based)
  if (shouldSample && traceRegistry.samplingRate > 1) {
    if (Math.random() * traceRegistry.samplingRate >= 1) {
      return null; // Not sampled
    }
  }
  // For percentage-based sampling (0-1), shouldSampleTrace() already handled it

  const traceId = generateId();
  const spanId = generateId();
  const startTime = Date.now();

  const context = {
    traceId,
    spanId,
    spanStack: [],
    sampled: true,
  };

  // Create root span
  // Optimized: Reuse attributes object directly instead of Object.assign (faster)
  const span = {
    traceId,
    spanId,
    parentSpanId: null,
    name,
    startTime,
    duration: null, // Will be set when span ends
    kind: 'server',
    status: 'unset',
    // Optimized: Use attributes directly if it's already an object, otherwise create new
    attributes: attributes && typeof attributes === 'object' && !Array.isArray(attributes) 
      ? attributes 
      : Object.assign({}, attributes),
    events: [], // Events within this span (e.g., "db.findUser", "fetch.postsAPI")
    error: null,
  };

  // Store span
  traceRegistry.spans.set(spanId, span);

  // Create trace entry
  const trace = {
    traceId, // Store traceId in the trace object
    spans: [spanId],
    startTime,
    endTime: null,
    rootSpanId: spanId,
  };
  traceRegistry.traces.set(traceId, trace);

  // Optimized: Debounce cleanup - only schedule if we have many traces and not already scheduled
  if (traceRegistry.traces.size > CLEANUP_TRACE_THRESHOLD && !cleanupScheduled) {
    cleanupScheduled = true;
    if (cleanupTimer) clearTimeout(cleanupTimer);
    cleanupTimer = setTimeout(() => {
      cleanupScheduled = false;
      cleanupOldTraces();
    }, CLEANUP_DEBOUNCE_MS);
  }

  return context;
}

/**
 * Add an event to the current span (event-based approach instead of nested spans)
 * @param {Object} options - Event options
 * @param {string} options.name - Event name (e.g., "db.findUser", "fetch.postsAPI")
 * @param {Object} options.attributes - Event attributes
 * @returns {boolean} True if event was added
 */
export function addSpanEvent({ name, attributes = {} }) {
  const context = getTraceContext();
  if (!context || !context.sampled) return false;

  const span = traceRegistry.spans.get(context.spanId);
  if (!span) return false;

  // Convert attributes to OTLP format
  const convertAttribute = (key, value) => {
    if (typeof value === 'number') {
      if (Number.isInteger(value)) {
        return { key, value: { intValue: value } };
      }
      return { key, value: { doubleValue: value } };
    }
    if (typeof value === 'boolean') {
      return { key, value: { boolValue: value } };
    }
    return { key, value: { stringValue: String(value) } };
  };

  const event = {
    name,
    timeUnixNano: Date.now() * 1000000, // Convert to nanoseconds
    attributes: Object.entries(attributes).map(([key, value]) => convertAttribute(key, value)),
  };

  span.events.push(event);
  return true;
}

/**
 * Start a new child span (for manual instrumentation)
 * @param {Object} options - Span options
 * @param {string} options.name - Span name
 * @param {string} options.kind - Span kind: "server", "client", "internal"
 * @param {Object} options.attributes - Span attributes
 * @returns {string|null} Span ID or null if no active trace
 */
export function startSpan({ name, kind = 'internal', attributes = {} }) {
  const context = getTraceContext();
  if (!context || !context.sampled) return null;

  const spanId = generateId();
  const parentSpanId = context.spanId;
  const startTime = Date.now();

  const span = {
    traceId: context.traceId,
    spanId,
    parentSpanId,
    name,
    startTime,
    duration: null,
    kind,
    status: 'unset',
    // Optimized: Use Object.assign instead of spread
    attributes: Object.assign({}, attributes),
    events: [],
    error: null,
  };

  // Store span
  traceRegistry.spans.set(spanId, span);

  // Add to trace
  const trace = traceRegistry.traces.get(context.traceId);
  if (trace) {
    trace.spans.push(spanId);
  }

  // Update context
  context.spanStack.push(context.spanId);
  context.spanId = spanId;

  return spanId;
}

/**
 * End the current span
 * @param {Object} options - End span options
 * @param {string} options.spanId - Span ID (if not current span)
 * @param {string} options.status - Span status: "ok", "error", "unset"
 * @param {Error} options.error - Error if status is "error"
 * @param {Object} options.attributes - Additional attributes to set
 */
export function endSpan({ spanId = null, status = 'ok', error = null, attributes = {} }) {
  const context = getTraceContext();
  if (!context || !context.sampled) return;

  const targetSpanId = spanId || context.spanId;
  const span = traceRegistry.spans.get(targetSpanId);
  if (!span) return;

  const endTime = Date.now();
  span.duration = endTime - span.startTime;
  span.status = error ? 'error' : status;
  if (error) {
    span.error = error;
    span.attributes.error = true;
    span.attributes['error.message'] = error.message;
    span.attributes['error.code'] = error.code || 'UNKNOWN';
  }
  Object.assign(span.attributes, attributes);

  // Update trace end time if this is the root span
  const trace = traceRegistry.traces.get(context.traceId);
  if (trace && trace.rootSpanId === targetSpanId) {
    trace.endTime = endTime;
  }

  // Restore parent span if this was the current span
  if (targetSpanId === context.spanId && context.spanStack.length > 0) {
    context.spanId = context.spanStack.pop();
  }
}

/**
 * End the entire trace
 * @param {string} traceId - Trace ID
 */
export function endTrace(traceId) {
  const trace = traceRegistry.traces.get(traceId);
  if (!trace) return;

  // Ensure all spans have durations
  trace.spans.forEach(spanId => {
    const span = traceRegistry.spans.get(spanId);
    if (span && span.duration === null) {
      span.duration = (trace.endTime || Date.now()) - span.startTime;
      if (span.status === 'unset') {
        span.status = 'ok';
      }
    }
  });

  if (!trace.endTime) {
    trace.endTime = Date.now();
  }

  // Move to completed traces and cleanup
  if (!traceRegistry.completedTraces) {
    traceRegistry.completedTraces = [];
  }
  
  // Add trace with traceId for easy lookup
  // Optimized: Use Object.assign instead of spread
  const completedTrace = Object.assign({}, trace, {
    traceId: traceId, // Ensure traceId is set
  });
  traceRegistry.completedTraces.push(completedTrace);
  
  // Keep only the most recent traces
  if (traceRegistry.completedTraces.length > traceRegistry.maxTraces) {
    traceRegistry.completedTraces.shift();
  }
  
  // Remove from active traces
  traceRegistry.traces.delete(traceId);
}

/**
 * Add attributes to the current span
 * @param {Object} attributes - Attributes to add
 */
export function addSpanAttributes(attributes) {
  const context = getTraceContext();
  if (!context || !context.sampled) return;

  const span = traceRegistry.spans.get(context.spanId);
  if (span) {
    Object.assign(span.attributes, attributes);
  }
}

/**
 * Set span status
 * @param {string} status - "ok", "error", "unset"
 * @param {Error} [error] - Error object if status is "error"
 */
export function setSpanStatus(status, error = null) {
  const context = getTraceContext();
  if (!context || !context.sampled) return;

  const span = traceRegistry.spans.get(context.spanId);
  if (span) {
    span.status = status;
    if (error) {
      span.error = error;
      span.attributes.error = true;
      span.attributes['error.message'] = error.message;
      span.attributes['error.code'] = error.code || 'UNKNOWN';
    }
  }
}

/**
 * Cleanup old traces based on age and count
 * @private
 */
function cleanupOldTraces() {
  const now = Date.now();
  const tracesToRemove = [];

  // Remove traces older than maxAge
  for (const [traceId, trace] of traceRegistry.traces.entries()) {
    if (trace.endTime && (now - trace.endTime) > traceRegistry.maxAge) {
      tracesToRemove.push(traceId);
    }
  }

  // If still too many traces, remove oldest completed traces
  if (traceRegistry.traces.size - tracesToRemove.length > traceRegistry.maxTraces) {
    const sortedTraces = Array.from(traceRegistry.traces.entries())
      .filter(([id]) => !tracesToRemove.includes(id))
      .map(([id, trace]) => ({ id, endTime: trace.endTime || now }))
      .sort((a, b) => (b.endTime || 0) - (a.endTime || 0));

    const excess = traceRegistry.traces.size - traceRegistry.maxTraces;
    for (let i = 0; i < excess; i++) {
      if (sortedTraces[i]) {
        tracesToRemove.push(sortedTraces[i].id);
      }
    }
  }

  // Remove traces and their spans
  tracesToRemove.forEach(traceId => {
    const trace = traceRegistry.traces.get(traceId);
    if (trace) {
      trace.spans.forEach(spanId => {
        traceRegistry.spans.delete(spanId);
      });
    }
    traceRegistry.traces.delete(traceId);
  });
}

/**
 * Get all traces for export
 * @param {Object} options - Export options
 * @param {number} options.limit - Maximum number of traces to return
 * @param {number} options.maxAge - Maximum age of traces in milliseconds
 * @returns {Array<Object>} Array of trace objects
 */
export function getTraces({ limit = 100, maxAge = null } = {}) {
  const now = Date.now();
  const traces = [];
  const maxAgeToUse = maxAge || traceRegistry.maxAge;

  // Helper to process a trace and add it to traces array
  const processTrace = (traceId, trace) => {
    // Skip incomplete traces (no endTime)
    if (!trace.endTime) return;

    // Skip old traces if maxAge is specified
    if (maxAgeToUse && (now - trace.endTime) > maxAgeToUse) return;

    // Collect spans - handle both spanId strings and span objects
    const spans = trace.spans
      .map(spanId => {
        if (typeof spanId === 'string') {
          return traceRegistry.spans.get(spanId);
        }
        return spanId; // Already a span object
      })
      .filter(Boolean)
      .map(span => ({
        traceId: span.traceId,
        spanId: span.spanId,
        parentSpanId: span.parentSpanId,
        name: span.name,
        startTime: span.startTime,
        duration: span.duration || 0,
        kind: span.kind,
        status: span.status,
        attributes: span.attributes || {},
        events: span.events || [],
        ...(span.error && {
          error: {
            message: span.error.message,
            code: span.error.code || 'UNKNOWN',
            stack: span.error.stack,
          },
        }),
      }));

    if (spans.length > 0) {
      traces.push({
        traceId,
        spans,
        startTime: trace.startTime,
        endTime: trace.endTime,
        duration: trace.endTime - trace.startTime,
      });
    }
  };

  // Include completed traces first
  if (traceRegistry.completedTraces && Array.isArray(traceRegistry.completedTraces)) {
    for (const trace of traceRegistry.completedTraces) {
      processTrace(trace.traceId, trace);
    }
  }

  // Include active traces that have ended
  for (const [traceId, trace] of traceRegistry.traces.entries()) {
    processTrace(traceId, trace);
  }

  // Sort by end time (newest first) and limit
  return traces
    .sort((a, b) => (b.endTime || 0) - (a.endTime || 0))
    .slice(0, limit);
}

/**
 * Export traces in OTLP format
 * @param {Object} options - Export options
 * @returns {Object} OTLP-compatible trace export
 */
export function exportOTLP({ limit = 100, serviceName = 'Crashless API' } = {}) {
  const traces = getTraces({ limit });
  
  // Convert to OTLP format with events
  const resourceSpans = traces.map(trace => {
    // Get root span (first span or span with no parent)
    const rootSpan = trace.spans.find(s => !s.parentSpanId) || trace.spans[0];
    const childSpans = trace.spans.filter(s => s.parentSpanId && s.spanId !== rootSpan?.spanId);
    
    // Convert attributes to OTLP format
    const convertAttribute = (key, value) => {
      if (typeof value === 'number') {
        // Check if it's an integer
        if (Number.isInteger(value)) {
          return { key, value: { intValue: value } };
        }
        return { key, value: { doubleValue: value } };
      }
      if (typeof value === 'boolean') {
        return { key, value: { boolValue: value } };
      }
      return { key, value: { stringValue: String(value) } };
    };

    // Build spans array - root span first, then children
    const allSpans = rootSpan ? [rootSpan, ...childSpans] : trace.spans;
    
    const spans = allSpans.map(span => {
      // Calculate end time
      const endTime = span.startTime + (span.duration || 0);
      
      return {
        traceId: span.traceId.substring(0, 32), // OTLP uses 16-byte hex strings
        spanId: span.spanId.substring(0, 16),
        parentSpanId: span.parentSpanId ? span.parentSpanId.substring(0, 16) : '',
        name: span.name,
        kind: getOTLPSpanKind(span.kind),
        startTimeUnixNano: span.startTime * 1000000, // Convert ms to nanoseconds
        endTimeUnixNano: endTime * 1000000,
        attributes: Object.entries(span.attributes || {}).map(([key, value]) => 
          convertAttribute(key, value)
        ),
        events: (span.events || []).map(event => ({
          name: event.name,
          timeUnixNano: event.timeUnixNano || (Date.now() * 1000000),
          attributes: event.attributes || [],
        })),
        status: {
          code: getOTLPStatus(span.status),
          ...(span.error && {
            message: span.error.message || 'Unknown error',
          }),
        },
      };
    });

    return {
      resource: {
        attributes: [
          { key: 'service.name', value: { stringValue: serviceName } },
        ],
      },
      scopeSpans: [{
        scope: {
          name: 'Crashless AutoTracer',
          version: '0.3.0',
        },
        spans,
      }],
    };
  });

  return {
    resourceSpans,
  };
}

/**
 * Convert span kind to OTLP span kind (numeric code)
 * @private
 */
function getOTLPSpanKind(kind) {
  const kinds = {
    server: 1, // SPAN_KIND_SERVER
    client: 2, // SPAN_KIND_CLIENT
    internal: 1, // SPAN_KIND_INTERNAL (treated as server)
    producer: 4, // SPAN_KIND_PRODUCER
    consumer: 5, // SPAN_KIND_CONSUMER
  };
  return kinds[kind] || 1; // Default to INTERNAL (1)
}

/**
 * Convert status to OTLP status code (numeric)
 * @private
 */
function getOTLPStatus(status) {
  const statuses = {
    ok: 1, // STATUS_CODE_OK
    error: 2, // STATUS_CODE_ERROR
    unset: 0, // STATUS_CODE_UNSET
  };
  return statuses[status] || 0; // Default to UNSET (0)
}

/**
 * Configure tracing settings
 * @param {Object} config - Configuration
 * @param {boolean} config.enabled - Enable/disable tracing
 * @param {number} config.maxTraces - Maximum number of traces to keep (also accepts maxStored)
 * @param {number} config.maxAge - Maximum age of traces in milliseconds
 * @param {number} config.samplingRate - Sampling rate: number > 1 = 1 in N, 0-1 = percentage (also accepts samplingRate as number or percentage)
 */
export function configureTracing(config) {
  if (config.enabled !== undefined) {
    traceRegistry.enabled = config.enabled;
  }
  if (config.maxTraces !== undefined) {
    traceRegistry.maxTraces = config.maxTraces;
  }
  if (config.maxStored !== undefined) {
    traceRegistry.maxTraces = config.maxStored;
  }
  if (config.maxAge !== undefined) {
    traceRegistry.maxAge = config.maxAge;
  }
  if (config.samplingRate !== undefined) {
    traceRegistry.samplingRate = config.samplingRate;
  }
}

/**
 * Get tracing statistics
 * @returns {Object} Statistics about traces
 */
export function getTracingStats() {
  const now = Date.now();
  let totalSpans = 0;
  let activeTraces = 0;
  let completedTraces = 0;

  for (const trace of traceRegistry.traces.values()) {
    totalSpans += trace.spans.length;
    if (trace.endTime) {
      completedTraces++;
    } else {
      activeTraces++;
    }
  }

  return {
    totalTraces: traceRegistry.traces.size,
    activeTraces,
    completedTraces,
    totalSpans,
    maxTraces: traceRegistry.maxTraces,
    maxAge: traceRegistry.maxAge,
    samplingRate: traceRegistry.samplingRate,
  };
}

/**
 * Helper: Wrap an async function with automatic span creation
 * @param {Function} fn - Async function to wrap
 * @param {Object} options - Span options
 * @param {string} options.name - Span name
 * @param {string} options.kind - Span kind
 * @param {Object} options.attributes - Span attributes
 * @returns {Function} Wrapped function
 */
export function traceAsync(fn, { name, kind = 'internal', attributes = {} } = {}) {
  return async function (...args) {
    const context = getTraceContext();
    if (!context || !context.sampled) {
      return fn.apply(this, args);
    }

    const spanName = name || fn.name || 'anonymous';
    const spanId = startSpan({ name: spanName, kind, attributes });
    
    if (!spanId) {
      return fn.apply(this, args);
    }

    try {
      const result = await fn.apply(this, args);
      endSpan({ status: 'ok' });
      return result;
    } catch (error) {
      endSpan({ status: 'error', error });
      throw error;
    }
  };
}

/**
 * Helper: Wrap a synchronous function with automatic span creation
 * @param {Function} fn - Function to wrap
 * @param {Object} options - Span options
 * @param {string} options.name - Span name
 * @param {string} options.kind - Span kind
 * @param {Object} options.attributes - Span attributes
 * @returns {Function} Wrapped function
 */
export function traceSync(fn, { name, kind = 'internal', attributes = {} } = {}) {
  return function (...args) {
    const context = getTraceContext();
    if (!context || !context.sampled) {
      return fn.apply(this, args);
    }

    const spanName = name || fn.name || 'anonymous';
    const spanId = startSpan({ name: spanName, kind, attributes });
    
    if (!spanId) {
      return fn.apply(this, args);
    }

    try {
      const result = fn.apply(this, args);
      endSpan({ status: 'ok' });
      return result;
    } catch (error) {
      endSpan({ status: 'error', error });
      throw error;
    }
  };
}

/**
 * Auto-patch global fetch() for automatic HTTP client tracing
 * Creates child spans for better waterfall visualization
 * @private
 */
export function autoPatchFetch() {
  // Only patch if fetch exists and hasn't been patched
  if (typeof globalThis.fetch === 'undefined' || globalThis.fetch.__crashlessPatched) {
    return;
  }

  const originalFetch = globalThis.fetch;
  globalThis.fetch = function (...args) {
    const context = getTraceContext();
    if (!context || !context.sampled) {
      return originalFetch.apply(this, args);
    }

    const url = args[0]?.toString() || 'unknown';
    const method = (args[1]?.method || 'GET').toUpperCase();
    const startTime = Date.now();

    // Extract URL path for display name
    let urlPath = url;
    try {
      if (url.startsWith('http://') || url.startsWith('https://')) {
        urlPath = new URL(url).pathname;
      } else if (url.startsWith('/')) {
        urlPath = url;
      } else {
        // Try to parse as relative URL
        try {
          urlPath = new URL(url, 'http://localhost').pathname;
        } catch {
          urlPath = url.substring(0, 50); // Fallback to first 50 chars
        }
      }
    } catch {
      urlPath = url.substring(0, 50);
    }

    // Create a child span for the fetch operation (better for waterfall view)
    const spanId = startSpan({
      name: `fetch ${method} ${urlPath}`,
      kind: 'client',
      attributes: {
        'http.url': url,
        'http.method': method,
      },
    });

    return originalFetch.apply(this, args).then(
      response => {
        const duration = Date.now() - startTime;
        addSpanAttributes({
          'http.status_code': response.status,
          'http.status_text': response.statusText || '',
          'duration_ms': duration,
        });
        endSpan({ spanId, status: response.status >= 400 ? 'error' : 'ok' });
        return response;
      },
      error => {
        const duration = Date.now() - startTime;
        addSpanAttributes({
          'error': true,
          'error.message': error.message || 'Fetch failed',
          'duration_ms': duration,
        });
        endSpan({ spanId, status: 'error', error });
        throw error;
      }
    );
  };

  globalThis.fetch.__crashlessPatched = true;
}

/**
 * Auto-patch fs operations for automatic file I/O tracing
 * @private
 */
export async function autoPatchFs() {
  // Dynamic import for fs module
  try {
    const fs = await import('fs');
    if (!fs || fs.default?.readFile?.__crashlessPatched || fs.readFile?.__crashlessPatched) return;
    
    const fsModule = fs.default || fs;

    // Patch fs.readFile
    const originalReadFile = fsModule.promises?.readFile || fsModule.readFile;
    if (originalReadFile) {
      // Patch promise-based readFile
      if (fsModule.promises && fsModule.promises.readFile) {
        const original = fsModule.promises.readFile;
        fsModule.promises.readFile = function (...args) {
          const context = getTraceContext();
          if (!context || !context.sampled) {
            return original.apply(this, args);
          }

          const filepath = args[0]?.toString() || 'unknown';
          const startTime = Date.now();

          addSpanEvent({
            name: 'fs.readFile',
            attributes: {
              'file.path': filepath,
            },
          });

          return original.apply(this, args).then(
            data => {
              const duration = Date.now() - startTime;
              addSpanEvent({
                name: 'fs.readFile.complete',
                attributes: {
                  'duration_ms': duration,
                  'file.size': data?.length || 0,
                },
              });
              return data;
            },
            error => {
              const duration = Date.now() - startTime;
              addSpanEvent({
                name: 'fs.readFile.error',
                attributes: {
                  'error': true,
                  'error.message': error.message || 'Read failed',
                  'duration_ms': duration,
                },
              });
              throw error;
            }
          );
        };
        fsModule.promises.readFile.__crashlessPatched = true;
      }

      // Patch callback-based readFile
      if (fsModule.readFile && typeof fsModule.readFile === 'function') {
        const original = fsModule.readFile;
        fsModule.readFile = function (...args) {
          const context = getTraceContext();
          if (!context || !context.sampled) {
            return original.apply(this, args);
          }

          const filepath = args[0]?.toString() || 'unknown';
          const startTime = Date.now();

          addSpanEvent({
            name: 'fs.readFile',
            attributes: {
              'file.path': filepath,
            },
          });

          const callback = args[args.length - 1];
          if (typeof callback === 'function') {
            const wrappedCallback = function (err, data) {
              const duration = Date.now() - startTime;
              if (err) {
                addSpanEvent({
                  name: 'fs.readFile.error',
                  attributes: {
                    'error': true,
                    'error.message': err.message || 'Read failed',
                    'duration_ms': duration,
                  },
                });
              } else {
                addSpanEvent({
                  name: 'fs.readFile.complete',
                  attributes: {
                    'duration_ms': duration,
                    'file.size': data?.length || 0,
                  },
                });
              }
              callback(err, data);
            };
            return original.apply(this, [...args.slice(0, -1), wrappedCallback]);
          }
          return original.apply(this, args);
        };
        fsModule.readFile.__crashlessPatched = true;
      }
    }
  } catch (_) {
    // fs module not available or already patched
  }
}

