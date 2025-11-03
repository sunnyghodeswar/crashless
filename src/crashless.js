/*
 * Crashless — stability, security, and smart logging for Express & Vegaa.
 * Zero-dependency middleware that prevents servers from crashing on errors.
 * Now with built-in observability, metrics, and automatic async error handling.
 *
 * @module crashless
 */

import {
  recordRequest,
  recordError,
  getMetrics,
  exportPrometheus,
  exportOpenTelemetry
} from './metrics.js';
import { getDashboardHTML } from './dashboard.js';
import {
  startTrace,
  endTrace,
  startSpan,
  endSpan,
  runInTraceContext,
  addSpanAttributes,
  setSpanStatus,
  getTraces,
  exportOTLP,
  configureTracing,
  getTracingStats,
  autoPatchFetch,
  autoPatchFs
} from './tracing.js';

/* ------------------------ Defaults & Globals --------------------------- */
const DEFAULTS = {
  handleAsync: true,
  maskMessages: false,
  showStack: process.env.NODE_ENV !== 'production',
  log: true,
  defaultStatus: 500,
  appName: 'Crashless API',
  telemetry: {
    engine: 'builtin',
    dashboard: true,
    route: '/_crashless',
    exportInterval: 5000,
    version: 'v2',
  },
};

/**
 * Check if a path is an internal observability endpoint
 * These should be excluded from metrics and tracing
 * @param {string} path - Request path
 * @returns {boolean} True if path is internal
 */
function isInternalEndpoint(path) {
  if (!path) return false;
  const internalPatterns = [
    '/metrics.json',
    '/traces.json',
    '/metrics',
    '/metrics/otel',
    '/_crashless',
    '/health', // Optional: remove if you want to track health checks
  ];
  return internalPatterns.some(pattern => path === pattern || path.startsWith(pattern + '/'));
}

let globalTelemetryConfig = { ...DEFAULTS.telemetry };
const exporters = new Map();

/* ------------------------ Helpers: exporters --------------------------- */
function registerExporter(name, fn) {
  if (typeof fn !== 'function') throw new Error('exporter must be a function');
  exporters.set(name, fn);
}

function callExporters(err, meta) {
  for (const fn of exporters.values()) {
    try {
      queueMicrotask(() => {
        try {
          fn(err, meta);
        } catch (_) {}
      });
    } catch (_) {}
  }
}

/* ------------------------ Helpers: errors ------------------------------ */
function normalizeError(err) {
  if (err === null || err === undefined) return { name: 'Error', message: 'Unknown error' };
  if (typeof err === 'string') return { name: 'Error', message: err };
  if (typeof err === 'number') return { name: 'Error', message: `Error code: ${err}` };
  if (typeof err === 'boolean') return { name: 'Error', message: `Error: ${err}` };

  const normalized = {
    name: err.name ? String(err.name) : 'Error',
    message: err.message ? String(err.message) : String(err),
  };
  if (err.code) normalized.code = String(err.code);
  if (typeof err.status === 'number') normalized.status = err.status;
  if (err.details !== undefined) normalized.details = err.details;
  return normalized;
}

function createError(message, status = 500, code = 'ERR_INTERNAL', details = undefined) {
  const e = new Error(message);
  e.name = 'CrashlessError';
  e.status = status;
  e.code = code;
  e.isCrashless = true;
  if (details !== undefined) e.details = details;
  return e;
}

/* ------------------------ Auto-patch Express --------------------------- */
(async function tryPatchExpressGlobal() {
  try {
    const expressMod = await import('express').catch(() => null);
    if (!expressMod) return;
    const express = expressMod.default || expressMod;
    if (!express || !express.application) return;

    const appProto = express.application;
    if (appProto.__crashlessUsePatched) return;

    const originalUse = appProto.use;
    appProto.use = function (...args) {
      for (const mw of args) {
        if (mw && mw.__isCrashlessMiddleware) {
          try {
            mw.mountRoutes && mw.mountRoutes(this);
          } catch (_) {}
          break;
        }
      }
      return originalUse.apply(this, args);
    };

    Object.defineProperty(appProto, '__crashlessUsePatched', {
      value: true,
      configurable: false,
      enumerable: false,
      writable: false,
    });
  } catch (_) {}
})();

/* ------------------------------------------------------------------
 * Crashless Express Async Auto-Patch
 * Automatically catches async route errors globally.
 * ------------------------------------------------------------------ */
(async function crashlessAsyncLayerPatch() {
  try {
    const expressMod = await import('express').catch(() => null);
    if (!expressMod) return;
    const express = expressMod.default || expressMod;
    if (!express || !express.Router) return;

    let Layer;
    try {
      const mod = await import('express/lib/router/layer.js');
      Layer = mod.default || mod;
    } catch {
      try {
        Layer = (await import('express/lib/router/layer')).default;
      } catch {
        console.warn('⚠️ Crashless async patch: cannot find express Layer');
        return;
      }
    }

    if (!Layer || Layer.__crashlessPatched) return;

    const originalHandleRequest = Layer.prototype.handle_request;
    Layer.prototype.handle_request = function (req, res, next) {
      const fn = this.handle;
      if (!fn) return originalHandleRequest.call(this, req, res, next);
      try {
        const result = fn(req, res, next);
        if (result && typeof result.then === 'function') {
          return result.catch(next);
        }
        return result;
      } catch (err) {
        next(err);
      }
    };

    Layer.__crashlessPatched = true;
    console.log('✅ Crashless async support enabled (Layer patch)');
  } catch (err) {
    console.warn('⚠️ Crashless async patch failed:', err.message);
  }
})();

/* ------------------------ Middleware Factory --------------------------- */
function crashlessFactory(opts = {}) {
  const telemetryConfig = { ...DEFAULTS.telemetry, ...globalTelemetryConfig, ...(opts.telemetry || {}) };
  const options = {
    ...DEFAULTS,
    ...opts,
    telemetry: telemetryConfig,
    enableMetrics: opts.enableMetrics !== undefined ? opts.enableMetrics : telemetryConfig.engine !== 'none',
    enableDashboard: opts.enableDashboard !== undefined ? opts.enableDashboard : telemetryConfig.dashboard,
    dashboardPath: opts.dashboardPath || telemetryConfig.route,
    metricsPath: opts.metricsPath || '/metrics.json',
  };

  // Configure tracing if telemetry.traces is provided
  if (telemetryConfig.traces) {
    const tracesConfig = telemetryConfig.traces;
    configureTracing({
      enabled: tracesConfig.enabled !== false, // Default to true
      maxTraces: tracesConfig.maxStored || tracesConfig.maxTraces,
      samplingRate: tracesConfig.samplingRate,
    });
  }

  // Auto-patch global fetch() and fs if tracing is enabled
  if (options.enableMetrics && telemetryConfig.traces?.enabled !== false) {
    autoPatchFetch();
    autoPatchFs().catch(() => {}); // Ignore errors
  }

  function requestTracker(req, res, next) {
    req.__crashlessStartTime = Date.now();
    
    // Skip internal observability endpoints - don't track metrics or traces for these
    const path = req.route ? req.route.path : req.path || req.originalUrl || 'unknown';
    if (isInternalEndpoint(path)) {
      return next(); // Skip all instrumentation for internal endpoints
    }
    
    if (!options.enableMetrics || options.telemetry.engine === 'none') return next();

    if (res.__crashlessEndWrapped) return next();
    res.__crashlessEndWrapped = true;
    res.__crashlessRequestRecorded = false; // Flag to prevent double counting

    // Start trace for this request
    const method = req.method || 'UNKNOWN';
    const traceContext = startTrace({
      name: `${method} ${path}`,
      attributes: {
        'http.method': method,
        'http.path': path,
        'http.route': path,
        'http.target': req.originalUrl || req.url || path,
        'http.scheme': req.protocol || 'http',
        'http.host': req.get?.('host') || req.hostname || 'unknown',
        'http.user_agent': req.get?.('user-agent') || '',
        'http.request_id': req.id || '',
      },
      shouldSample: true,
    });

    // If tracing is disabled or not sampled, continue without trace context
    if (!traceContext) {
      const originalEnd = res.end.bind(res);
      res.end = function (...args) {
        if (res.__crashlessErrorHandled && res.__crashlessRequestRecorded) {
          return originalEnd(...args);
        }
        const latency = Date.now() - req.__crashlessStartTime;
        const status = res.statusCode || 200;
        if (!res.__crashlessErrorHandled) {
          queueMicrotask(() => {
            try {
              recordRequest(method, path, status, latency);
            } catch (_) {}
          });
        }
        return originalEnd(...args);
      };
      return next();
    }

    // Store trace context in request for error handler
    req.__crashlessTraceId = traceContext.traceId;

    // Run request in trace context
    runInTraceContext(traceContext, () => {
      const originalEnd = res.end.bind(res);
      res.end = function (...args) {
        // CRITICAL: If error handler already recorded this request, skip to prevent double counting
        if (res.__crashlessErrorHandled && res.__crashlessRequestRecorded) {
          // Still end the trace
          queueMicrotask(() => {
            try {
              endTrace(traceContext.traceId);
            } catch (_) {}
          });
          return originalEnd(...args);
        }
        
        const latency = Date.now() - req.__crashlessStartTime;
        const status = res.statusCode || 200;
        
        // Update span with final attributes
        addSpanAttributes({
          'http.status_code': status,
          'http.status_text': res.statusMessage || '',
        });
        
        // End span with appropriate status
        const spanStatus = status >= 500 ? 'error' : status >= 400 ? 'unset' : 'ok';
        endSpan({ status: spanStatus });
        
        // End trace
        queueMicrotask(() => {
          try {
            endTrace(traceContext.traceId);
          } catch (_) {}
        });
        
        // Only record if error handler hasn't already done it
        if (!res.__crashlessErrorHandled) {
          queueMicrotask(() => {
            try {
              recordRequest(method, path, status, latency);
            } catch (_) {}
          });
        }
        
        return originalEnd(...args);
      };
      next();
    });
  }

  function crashlessErrorHandler(err, req, res, next) {
    if (res.headersSent) return next(err);

    // Skip internal observability endpoints - don't track errors for these
    const path = req.path || (req.route && req.route.path) || req.originalUrl || 'unknown';
    if (isInternalEndpoint(path)) {
      // Still handle the error, but don't instrument it
      return next(err);
    }

    res.__crashlessErrorHandled = true;
    const traceId = req.__crashlessTraceId;

    const normalized = normalizeError(err || {});
    const status = normalized.status || options.defaultStatus || 500;
    const exposeStack = options.showStack && process.env.NODE_ENV !== 'production';

    let clientMessage = normalized.message || 'Internal server error';
    if (options.maskMessages && process.env.NODE_ENV === 'production') {
      clientMessage = err && err.clientMessage ? String(err.clientMessage) : 'Internal server error';
    }

    const payload = {
      success: false,
      message: clientMessage,
      code: normalized.code || `ERR_${String(status)}`
    };
    if (exposeStack && err && err.stack) payload.stack = err.stack;

    const latency = req.__crashlessStartTime ? Date.now() - req.__crashlessStartTime : 0;

    if (options.enableMetrics && options.telemetry.engine !== 'none') {
      const errorCode = normalized.code || `ERR_${String(status)}`;

      // ATOMIC OPERATION: Record request and error together to prevent double counting
      // Mark request as recorded BEFORE calling recordRequest to prevent res.end() from recording again
      res.__crashlessRequestRecorded = true;
      
      try {
        // Record the request (this will NOT auto-record error due to skipErrorRecording flag)
        recordRequest(req.method || 'UNKNOWN', path, status, latency, true); // true = skipErrorRecording

        // Record the error explicitly with proper error object
        let errorInstance = err instanceof Error ? err : new Error(normalized.message || 'Unknown error');
        errorInstance.name = normalized.name || errorInstance.name || 'Error';
        errorInstance.code = errorCode;
        errorInstance.status = normalized.status || status;
        if (!errorInstance.stack && err && err.stack) errorInstance.stack = err.stack;

        recordError(errorInstance, {
          method: req.method,
          path,
          status,
          timestamp: new Date().toISOString(),
        });

        // Update trace span with error details if trace exists
        if (traceId) {
          queueMicrotask(() => {
            try {
              const context = getTraceContext();
              if (context && context.traceId === traceId) {
                addSpanAttributes({
                  'http.status_code': status,
                  'http.status_text': res.statusMessage || '',
                  'error.type': err.constructor?.name || 'Error',
                  'error.code': errorCode,
                });
                endSpan({ status: 'error', error: errorInstance });
                endTrace(traceId);
              } else if (traceId) {
                // Trace exists but we're not in context - end it anyway
                endTrace(traceId);
              }
            } catch (_) {}
          });
        }
      } catch (e) {
        console.error('[Crashless] Failed to record error:', e);
      }
    }

    try {
      res.status(Number(status)).json(payload);
    } catch {
      try {
        res.status(500).send('Internal server error');
      } catch {}
    }

    queueMicrotask(() => {
      // Don't log or export errors for internal endpoints (path already checked above, but extra safety)
      if (isInternalEndpoint(path)) {
        return;
      }

      const meta = {
        method: req.method,
        path: req.path,
        status,
        timestamp: new Date().toISOString(),
        latency,
        app: { name: options.appName, env: process.env.NODE_ENV || 'development' },
        telemetry: { engine: options.telemetry.engine, version: 'v1.0' },
      };
      if (req.id) meta.requestId = req.id;
      if (req.get) {
        const ua = req.get('user-agent');
        if (ua) meta.userAgent = ua;
      }

      if (options.log) console.error('[Crashless] Error:', normalized, { stack: err && err.stack }, meta);
      callExporters(err, meta);
      if (typeof options.onTelemetry === 'function') {
        try {
          options.onTelemetry(err, meta);
        } catch (_) {}
      }
    });
  }

  let routesMounted = false;

  function crashlessWrapper(err, req, res, next) {
    // 4-arg signature = error handler
    if (err instanceof Error || (err && err.message)) return crashlessErrorHandler(err, req, res, next);
    
    // 3-arg signature = regular middleware (request tracker)
    const actualReq = err;
    const actualRes = req;
    const actualNext = res;
    
    // Auto-mount routes on first request
    if (!routesMounted && actualReq.app) {
      routesMounted = true;
      try {
        crashlessWrapper.mountRoutes(actualReq.app);
      } catch (e) {
        console.warn('[Crashless] Failed to auto-mount routes:', e.message);
      }
    }
    
    return requestTracker(actualReq, actualRes, actualNext);
  }

  crashlessWrapper.createError = createError;
  crashlessWrapper.registerExporter = registerExporter;
  crashlessWrapper.__isCrashlessMiddleware = true;

  crashlessWrapper.mountRoutes = function (app) {
    try {
      if (options.enableDashboard && options.telemetry.dashboard) {
        const basePath = options.dashboardPath || '/_crashless';
        
        // Main dashboard (defaults to system overview)
        app.get(basePath, (req, res) =>
          res.send(getDashboardHTML(basePath, options.maskMessages, options.appName))
        );
        app.get(`${basePath}/system`, (req, res) =>
          res.send(getDashboardHTML(`${basePath}/system`, options.maskMessages, options.appName))
        );
        app.get(`${basePath}/crashes`, (req, res) =>
          res.send(getDashboardHTML(`${basePath}/crashes`, options.maskMessages, options.appName))
        );
        app.get(`${basePath}/errors`, (req, res) =>
          res.send(getDashboardHTML(`${basePath}/crashes`, options.maskMessages, options.appName))
        );
        app.get(`${basePath}/traces`, (req, res) =>
          res.send(getDashboardHTML(`${basePath}/traces`, options.maskMessages, options.appName))
        );
        app.get(`${basePath}/performance`, (req, res) =>
          res.send(getDashboardHTML(`${basePath}/system`, options.maskMessages, options.appName))
        );
      }
        if (options.enableMetrics && options.telemetry.engine !== 'none') {
          app.get(options.metricsPath || '/metrics.json', (req, res) => {
            try {
              res.json(getMetrics());
            } catch {
              res.status(500).json({ error: 'Failed to get metrics' });
            }
          });
          if (['prometheus', 'builtin'].includes(options.telemetry.engine)) {
            app.get('/metrics', (req, res) => {
              try {
                res.setHeader('Content-Type', 'text/plain; version=0.0.4');
                res.send(exportPrometheus());
              } catch {
                res.status(500).send('# Error generating Prometheus metrics\\n');
              }
            });
          }
          if (options.telemetry.engine === 'otel') {
            app.get('/metrics/otel', (req, res) => {
              try {
                res.json(exportOpenTelemetry());
              } catch {
                res.status(500).json({ error: 'Failed to export OpenTelemetry metrics' });
              }
            });
          }
          // Traces endpoint
          app.get('/traces.json', (req, res) => {
            try {
              const format = req.query.format || 'crashless';
              const limit = parseInt(req.query.limit || '100', 10);
              
              if (format === 'otlp') {
                res.json(exportOTLP({ limit, serviceName: options.appName }));
              } else {
                res.json({
                  traces: getTraces({ limit }),
                  stats: getTracingStats(),
                });
              }
            } catch (err) {
              res.status(500).json({ error: 'Failed to get traces', message: err.message });
            }
          });
        }
    } catch (_) {}
  };

  return crashlessWrapper;
}

/* ------------------------ Attach Helpers --------------------------- */
crashlessFactory.createError = createError;
crashlessFactory.registerExporter = registerExporter;
crashlessFactory.telemetry = (config) => {
  if (config) globalTelemetryConfig = { ...globalTelemetryConfig, ...config };
  return globalTelemetryConfig;
};
crashlessFactory.getDashboardHTML = (opts) => {
  return getDashboardHTML(opts?.route || '/_crashless', opts?.maskMessages || false, opts?.appName || 'Crashless API');
};

export default crashlessFactory;
export { createError, registerExporter };