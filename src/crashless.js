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
  autoPatchFs,
  shouldSampleTrace
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
    dashboard: process.env.NODE_ENV !== 'production', // Disabled in production by default
    route: '/_crashless',
    exportInterval: 5000,
    version: 'v2',
  },
  // Dashboard security: function that returns true if request is allowed
  dashboardAuth: null, // null = no auth, function(req) => boolean = custom auth
};

/**
 * Check if a path is an internal observability endpoint
 * These should be excluded from metrics and tracing
 * @param {string} path - Request path
 * @returns {boolean} True if path is internal
 */
// Optimized: Use Set for O(1) exact match lookup, then check prefixes
const INTERNAL_EXACT_PATHS = new Set([
  '/metrics.json',
  '/traces.json',
  '/metrics',
  '/metrics/otel',
  '/_crashless',
  '/health',
]);
const INTERNAL_PREFIXES = ['/_crashless/', '/metrics/', '/health/'];

function isInternalEndpoint(path) {
  if (!path) return false;
  // Fast exact match check
  if (INTERNAL_EXACT_PATHS.has(path)) return true;
  // Check prefixes (only for paths that need it)
  for (const prefix of INTERNAL_PREFIXES) {
    if (path.startsWith(prefix)) return true;
  }
  return false;
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
        // Express Layer module not found - async patching unavailable
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
  } catch (err) {
    // Async patching failed - errors will still be caught by error handler
  }
})();

/* ------------------------ Middleware Factory --------------------------- */
function crashlessFactory(opts = {}) {
  // Optimized: Use Object.assign instead of spread for better performance
  const telemetryConfig = Object.assign({}, DEFAULTS.telemetry, globalTelemetryConfig, opts.telemetry || {});
  
  // Handle dashboard auth - support IP whitelist via environment variable
  let dashboardAuth = opts.dashboardAuth;
  if (!dashboardAuth && process.env.DASHBOARD_ALLOWED_IPS) {
    const allowedIPs = process.env.DASHBOARD_ALLOWED_IPS.split(',').map(ip => ip.trim());
    dashboardAuth = (req) => {
      const clientIP = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || 'unknown';
      return allowedIPs.includes(clientIP) || clientIP === '127.0.0.1' || clientIP === '::1';
    };
  }
  
  // If enableDashboard is explicitly set to true, also enable telemetry.dashboard
  // This allows dashboard to work in production when explicitly enabled with security
  if (opts.enableDashboard === true && telemetryConfig.dashboard === false) {
    telemetryConfig.dashboard = true;
  }
  
  // Optimized: Use Object.assign instead of spread for better performance
  const options = Object.assign({}, DEFAULTS, opts, {
    telemetry: telemetryConfig,
    enableMetrics: opts.enableMetrics !== undefined ? opts.enableMetrics : telemetryConfig.engine !== 'none',
    enableDashboard: opts.enableDashboard !== undefined ? opts.enableDashboard : telemetryConfig.dashboard,
    dashboardPath: opts.dashboardPath || telemetryConfig.route,
    metricsPath: opts.metricsPath || '/metrics.json',
    dashboardAuth: dashboardAuth !== undefined ? dashboardAuth : DEFAULTS.dashboardAuth,
  });

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
    // Optimized: Cache Date.now() once per request
    const requestStartTime = Date.now();
    req.__crashlessStartTime = requestStartTime;
    
    // Optimized: Extract and cache path once per request
    const path = req.route ? req.route.path : req.path || req.originalUrl || 'unknown';
    req.__crashlessPath = path; // Cache for reuse
    
    // Skip internal observability endpoints - don't track metrics or traces for these
    if (isInternalEndpoint(path)) {
      return next(); // Skip all instrumentation for internal endpoints
    }
    
    if (!options.enableMetrics || options.telemetry.engine === 'none') return next();

    if (res.__crashlessEndWrapped) return next();
    res.__crashlessEndWrapped = true;
    res.__crashlessRequestRecorded = false; // Flag to prevent double counting

    // Optimized: Check sampling FIRST before creating any objects
    const method = req.method || 'UNKNOWN';
    let traceContext = null;
    
    // Only check tracing if it's enabled (check config, not registry directly)
    const tracingEnabled = telemetryConfig.traces?.enabled !== false;
    if (tracingEnabled && shouldSampleTrace()) {
      // Only collect expensive attributes if we're actually sampling
      // Optimized: Cache expensive property accesses to avoid repeated lookups
      const originalUrl = req.originalUrl || req.url || path;
      const protocol = req.protocol || 'http';
      const host = req.get?.('host') || req.hostname || 'unknown';
      const userAgent = req.get?.('user-agent') || '';
      const requestId = req.id || '';
      
      traceContext = startTrace({
        name: `${method} ${path}`,
        attributes: {
          'http.method': method,
          'http.path': path,
          'http.route': path,
          'http.target': originalUrl,
          'http.scheme': protocol,
          'http.host': host,
          'http.user_agent': userAgent,
          'http.request_id': requestId,
        },
        shouldSample: true,
      });
    }

    // If tracing is disabled or not sampled, continue without trace context
    if (!traceContext) {
      const originalEnd = res.end.bind(res);
      res.end = function (...args) {
        if (res.__crashlessErrorHandled && res.__crashlessRequestRecorded) {
          return originalEnd(...args);
        }
        // Optimized: Use cached start time and pass timestamp to avoid Date.now()
        const endTime = Date.now();
        const latency = endTime - requestStartTime;
        const status = res.statusCode || 200;
        if (!res.__crashlessErrorHandled) {
          queueMicrotask(() => {
            try {
              recordRequest(method, path, status, latency, false, endTime);
            } catch (_) {}
          });
        }
        return originalEnd(...args);
      };
      return next();
    }

    // Store trace context in request for error handler
    req.__crashlessTraceId = traceContext.traceId;
    // Optimized: Cache trace context in request to avoid AsyncLocalStorage lookups
    req.__crashlessTraceContext = traceContext;

    // Run request in trace context
    runInTraceContext(traceContext, () => {
      const originalEnd = res.end.bind(res);
      res.end = function (...args) {
        // CRITICAL: If error handler already recorded this request, skip to prevent double counting
        if (res.__crashlessErrorHandled && res.__crashlessRequestRecorded) {
          // Optimized: Batch trace end in single microtask
          queueMicrotask(() => {
            try {
              endTrace(traceContext.traceId);
            } catch (_) {}
          });
          return originalEnd(...args);
        }
        
        // Optimized: Use cached start time and pass timestamp to avoid Date.now()
        const endTime = Date.now();
        const latency = endTime - requestStartTime;
        const status = res.statusCode || 200;
        
        // Update span with final attributes
        addSpanAttributes({
          'http.status_code': status,
          'http.status_text': res.statusMessage || '',
        });
        
        // End span with appropriate status
        const spanStatus = status >= 500 ? 'error' : status >= 400 ? 'unset' : 'ok';
        endSpan({ status: spanStatus });
        
        // Optimized: Batch all async operations in single microtask
        queueMicrotask(() => {
          try {
            endTrace(traceContext.traceId);
            // Only record if error handler hasn't already done it
            if (!res.__crashlessErrorHandled) {
              recordRequest(method, path, status, latency, false, endTime);
            }
          } catch (_) {}
        });
        
        return originalEnd(...args);
      };
      next();
    });
  }

  function crashlessErrorHandler(err, req, res, next) {
    if (res.headersSent) return next(err);

    // Optimized: Use cached path if available
    const path = req.__crashlessPath || req.path || (req.route && req.route.path) || req.originalUrl || 'unknown';
    
    // Skip internal observability endpoints - don't track errors for these
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

    // Optimized: Use cached start time if available
    const requestStartTime = req.__crashlessStartTime || Date.now();
    const latency = Date.now() - requestStartTime;

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
          // Optimized: Batch trace operations in single microtask
          queueMicrotask(() => {
            try {
              // Optimized: Use cached trace context from request
              const context = getTraceContext(req);
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

    // Optimized: Batch all async operations (logging, exporters, telemetry) in single microtask
    queueMicrotask(() => {
      // Don't log or export errors for internal endpoints (path already checked above, but extra safety)
      if (isInternalEndpoint(path)) {
        return;
      }

      // Optimized: Cache Date.now() result for timestamp
      const now = Date.now();
      const meta = {
        method: req.method,
        path: req.path,
        status,
        timestamp: new Date(now).toISOString(),
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
    // 4-arg signature = error handler (next is function)
    if (typeof next === 'function') {
      return crashlessErrorHandler(err, req, res, next);
    }
    
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
        // Routes mounting failed - dashboard/metrics endpoints may not be available
        // This is non-fatal, error handling will still work
      }
    }
    
    return requestTracker(actualReq, actualRes, actualNext);
  }

  crashlessWrapper.createError = createError;
  crashlessWrapper.registerExporter = registerExporter;
  crashlessWrapper.__isCrashlessMiddleware = true;

  // Optimized: Cache auth check function per middleware instance to avoid repeated checks
  const checkDashboardAccess = (() => {
    // If no auth function, return a simple function that always returns true
    if (!options.dashboardAuth) {
      return () => true;
    }
    
    // If auth is explicitly false, return a function that always returns false
    if (options.dashboardAuth === false) {
      return () => false;
    }
    
    // If auth is a function, cache it and return wrapper
    if (typeof options.dashboardAuth === 'function') {
      const authFn = options.dashboardAuth;
      return (req) => {
        try {
          return authFn(req) === true;
        } catch (err) {
          // If auth function throws, deny access for security
          return false;
        }
      };
    }
    
    // Fallback
    return () => true;
  })();

  crashlessWrapper.mountRoutes = function (app) {
    try {
      // Dashboard enabled if: enableDashboard is true AND telemetry.dashboard is true
      // Note: In production, telemetry.dashboard defaults to false for security,
      // but can be explicitly enabled with enableDashboard: true + security (IP whitelist/token)
      if (options.enableDashboard && options.telemetry.dashboard) {
        const basePath = options.dashboardPath || '/_crashless';
        
        // Optimized: Create reusable auth middleware to avoid code duplication
        const FORBIDDEN_RESPONSE = { 
          success: false, 
          message: 'Forbidden: Dashboard access denied',
          code: 'DASHBOARD_FORBIDDEN'
        };
        
        const requireDashboardAuth = (req, res, next) => {
          if (!checkDashboardAccess(req)) {
            res.status(403).json(FORBIDDEN_RESPONSE);
            return;
          }
          next();
        };
        
        // Dashboard route handlers
        const dashboardHandler = (req, res) => {
          res.send(getDashboardHTML(basePath, options.maskMessages, options.appName));
        };
        
        const systemHandler = (req, res) => {
          res.send(getDashboardHTML(`${basePath}/system`, options.maskMessages, options.appName));
        };
        
        const crashesHandler = (req, res) => {
          res.send(getDashboardHTML(`${basePath}/crashes`, options.maskMessages, options.appName));
        };
        
        const tracesHandler = (req, res) => {
          res.send(getDashboardHTML(`${basePath}/traces`, options.maskMessages, options.appName));
        };
        
        // Main dashboard (defaults to system overview) - Optimized: Use auth middleware
        app.get(basePath, requireDashboardAuth, dashboardHandler);
        app.get(`${basePath}/system`, requireDashboardAuth, systemHandler);
        app.get(`${basePath}/crashes`, requireDashboardAuth, crashesHandler);
        app.get(`${basePath}/errors`, requireDashboardAuth, crashesHandler);
        app.get(`${basePath}/traces`, requireDashboardAuth, tracesHandler);
        app.get(`${basePath}/performance`, requireDashboardAuth, systemHandler);
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
  // Optimized: Use Object.assign instead of spread
  if (config) globalTelemetryConfig = Object.assign({}, globalTelemetryConfig, config);
  return globalTelemetryConfig;
};
crashlessFactory.getDashboardHTML = (opts) => {
  return getDashboardHTML(opts?.route || '/_crashless', opts?.maskMessages || false, opts?.appName || 'Crashless API');
};

export default crashlessFactory;
export { createError, registerExporter };