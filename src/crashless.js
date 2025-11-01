/**
 * Crashless — stability, security, and smart logging for Express & Vegaa.
 * Zero-dependency middleware that prevents servers from crashing on errors.
 *
 * @module crashless
 *
 * @example
 * import crashless from 'crashless';
 *
 * const app = express();
 * crashless.handleAsync(app);  // Optional: enable async error handling
 * app.use(crashless());        // Required: mount error middleware (last)
 */

/**
 * Default configuration options
 * @private
 */
const DEFAULTS = {
  handleAsync: false,
  maskMessages: true,
  showStack: process.env.NODE_ENV !== 'production',
  log: true,
  defaultStatus: 500,
};

/**
 * Global registry of telemetry exporters
 * @private
 */
const exporters = new Map();

/**
 * Register a global telemetry exporter function.
 * Exporter will be called asynchronously for every error that occurs.
 *
 * @param {string} name - Unique name for the exporter
 * @param {Function} fn - Exporter function (err, meta) => void
 * @throws {Error} If exporter is not a function
 *
 * @example
 * crashless.registerExporter('sentry', (err, meta) => {
 *   Sentry.captureException(err, { tags: { path: meta.path } });
 * });
 */
function registerExporter(name, fn) {
  if (typeof fn !== 'function') {
    throw new Error('exporter must be a function');
  }
  exporters.set(name, fn);
}

/**
 * Invoke all registered exporters asynchronously.
 * Errors in exporters are silently swallowed to prevent cascading failures.
 *
 * @param {Error} err - The error object
 * @param {Object} meta - Request metadata
 * @private
 */
function callExporters(err, meta) {
  for (const fn of exporters.values()) {
    try {
      // Fire-and-forget: non-blocking, errors in exporters don't crash the app
      setImmediate(() => {
        try {
          fn(err, meta);
        } catch (e) {
          // Silently swallow exporter errors to prevent cascading failures
        }
      });
    } catch (e) {
      // Silently swallow synchronous errors
    }
  }
}

/**
 * Normalize error object for consistent logging and telemetry.
 * Extracts standardized fields from any error type.
 *
 * @param {Error|Object|null} err - Error object to normalize
 * @returns {Object} Normalized error with name, message, code, status, details
 * @private
 */
function normalizeError(err) {
  const normalized = {
    name: err && err.name ? String(err.name) : 'Error',
    message: err && err.message ? String(err.message) : 'Unknown error',
  };
  
  // Only include optional fields if they exist to avoid undefined clutter
  if (err && err.code) normalized.code = String(err.code);
  if (err && typeof err.status === 'number') normalized.status = err.status;
  if (err && err.details !== undefined) normalized.details = err.details;
  
  return normalized;
}

/**
 * Create a standardized HTTP error object with status code and error code.
 *
 * @param {string} message - Error message
 * @param {number} [status=500] - HTTP status code
 * @param {string} [code='ERR_INTERNAL'] - Machine-readable error code
 * @param {*} [details] - Optional additional error details
 * @returns {Error} Error object with status, code, and optional details properties
 *
 * @example
 * throw crashless.createError('User not found', 404, 'USER_NOT_FOUND');
 * throw crashless.createError('Validation failed', 422, 'VALIDATION_ERROR', { field: 'email' });
 */
function createError(message, status = 500, code = 'ERR_INTERNAL', details = undefined) {
  const e = new Error(message);
  e.status = status;
  e.code = code;
  if (details !== undefined) e.details = details;
  return e;
}

/**
 * Patch Express/Vegaa app to automatically catch async route handler errors.
 * Wraps async route handlers so promise rejections are forwarded to error middleware.
 *
 * @param {Function} app - Express or Vegaa app instance
 * @param {Object} [options={}] - Configuration options
 * @param {string[]} [options.methods] - HTTP methods to patch (default: all common methods)
 * @throws {Error} If app is not a valid Express/Vegaa instance
 *
 * @example
 * crashless.handleAsync(app);
 * crashless.handleAsync(app, { methods: ['get', 'post'] });
 */
function handleAsync(app, options = {}) {
  if (!app || typeof app !== 'function') {
    throw new Error('handleAsync requires an Express or Vegaa app instance');
  }
  
  // Prevent double-patching
  if (app.__crashlessPatched) return;
  
  const methods = options.methods || ['get', 'post', 'put', 'delete', 'patch', 'all', 'use'];
  
  for (const m of methods) {
    // Some apps might not have all methods (e.g., Vegaa), skip safely
    if (!app[m]) continue;
    
    const original = app[m].bind(app);
    
    // Replace method with wrapper that auto-catches async errors
    app[m] = function (...args) {
      const wrapped = args.map(fn => {
        // Skip non-function arguments (e.g., route paths)
        if (typeof fn !== 'function') return fn;
        
        // Skip if already wrapped to prevent double-wrapping
        if (fn.__crashlessWrapped) return fn;
        
        // Detect async functions by constructor name
        const isAsync = fn.constructor && fn.constructor.name === 'AsyncFunction';
        if (!isAsync) return fn;
        
        // Wrap async function to catch promise rejections
        const wrappedFn = function (req, res, next) {
          Promise.resolve(fn(req, res, next)).catch(next);
        };
        
        // Mark as wrapped to prevent double-wrapping
        wrappedFn.__crashlessWrapped = true;
        return wrappedFn;
      });
      
      return original(...wrapped);
    };
  }
  
  // Mark app as patched to prevent double-patching
  Object.defineProperty(app, '__crashlessPatched', {
    value: true,
    configurable: false,
    enumerable: false,
    writable: false,
  });
}

/**
 * Factory function that creates Express error-handling middleware.
 * Middleware must be mounted last in the middleware stack.
 *
 * @param {Object} [opts={}] - Configuration options
 * @param {boolean} [opts.maskMessages=true] - Mask sensitive messages in production
 * @param {boolean} [opts.log=true] - Enable console error logging
 * @param {number} [opts.defaultStatus=500] - Default HTTP status for errors without status
 * @param {Function} [opts.onTelemetry] - Callback for telemetry (err, meta) => void
 * @returns {Function} Express error-handling middleware (err, req, res, next)
 *
 * @example
 * app.use(crashless());
 * app.use(crashless({ log: false, maskMessages: true }));
 */
function crashlessFactory(opts = {}) {
  const options = Object.assign({}, DEFAULTS, opts);

  /**
   * Express error-handling middleware (4-arg signature required by Express)
   * @param {Error} err - Error object
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  function crashless(err, req, res, next) {
    // If response headers already sent, forward to default error handler
    if (res.headersSent) {
      return next(err);
    }

    const normalized = normalizeError(err || {});
    const status = normalized.status || options.defaultStatus || 500;
    
    // Check environment at request time for dynamic stack trace control
    const exposeStack = options.showStack && process.env.NODE_ENV !== 'production';

    // Mask sensitive messages in production unless clientMessage is provided
    let clientMessage = normalized.message || 'Internal server error';
    if (options.maskMessages && process.env.NODE_ENV === 'production') {
      clientMessage = (err && err.clientMessage) 
        ? String(err.clientMessage) 
        : 'Internal server error';
    }

    // Build standardized error response payload
    const payload = {
      success: false,
      message: clientMessage,
      code: normalized.code || `ERR_${String(status)}`,
    };

    // Include stack trace only in non-production environments
    if (exposeStack && err && err.stack) {
      payload.stack = err.stack;
    }

    // Send error response (with fallback for edge cases)
    try {
      res.status(Number(status)).json(payload);
    } catch (e) {
      // Fallback to plain text if JSON serialization fails
      try {
        res.status(500).send('Internal server error');
      } catch (e2) {
        // Silently fail if response cannot be sent
      }
    }

    // Async logging & telemetry (non-blocking, fire-and-forget)
    if (options.log) {
      setImmediate(() => {
        try {
          const meta = {
            method: req && req.method,
            path: req && req.path,
            status,
            timestamp: new Date().toISOString(),
          };
          
          // Include optional metadata if available
          if (req && req.id) meta.requestId = req.id;
          if (req && req.get) {
            const ua = req.get('user-agent');
            if (ua) meta.userAgent = ua;
          }
          
          // Log error with full context
          console.error('[Crashless] Error:', normalized, { stack: err && err.stack }, meta);
          
          // Invoke registered exporters
          callExporters(err, meta);
          
          // Invoke user-provided telemetry callback
          if (typeof options.onTelemetry === 'function') {
            try {
              options.onTelemetry(err, meta);
            } catch (e) {
              // Silently ignore telemetry callback errors
            }
          }
        } catch (e) {
          // Silently swallow logger errors to prevent cascading failures
        }
      });
    } else {
      // Even without logging, call exporters if they exist (telemetry-only mode)
      if (exporters.size > 0 || typeof options.onTelemetry === 'function') {
        setImmediate(() => {
          const meta = {
            method: req && req.method,
            path: req && req.path,
            status,
            timestamp: new Date().toISOString(),
          };
          
          // Include optional metadata if available
          if (req && req.id) meta.requestId = req.id;
          if (req && req.get) {
            const ua = req.get('user-agent');
            if (ua) meta.userAgent = ua;
          }
          
          try {
            callExporters(err, meta);
          } catch (_) {
            // Silently ignore exporter errors
          }
          
          try {
            if (typeof options.onTelemetry === 'function') {
              options.onTelemetry(err, meta);
            }
          } catch (_) {
            // Silently ignore telemetry callback errors
          }
        });
      }
    }
  }

  // Attach helper methods to middleware for convenience
  crashless.createError = createError;
  crashless.registerExporter = registerExporter;
  crashless.handleAsync = handleAsync;

  return crashless;
}

/**
 * Default export: factory function with helper methods attached.
 * This allows both `crashless()` and `crashless.createError()` usage patterns.
 */
function defaultCrashless(opts) {
  return crashlessFactory(opts);
}

// Attach helper methods to factory function for convenience API
defaultCrashless.createError = createError;
defaultCrashless.registerExporter = registerExporter;
defaultCrashless.handleAsync = handleAsync;

export default defaultCrashless;
export { crashlessFactory, createError, handleAsync, registerExporter };