// crashless.js
/**
 * Crashless — stability, security, and smart logging for Express.
 * Author: Sunny Ghodeswar
 */

function crashless(options = {}) {
  const { handleAsync = false, maskMessages = true, log = true, onTelemetry } = options;

  // One-time async wrapping (only if handleAsync true)
  if (handleAsync && !global.__crashlessPatched) {
    global.__crashlessPatched = true;
    patchExpressApp(require.main.exports?.app);
  }

  return function (err, req, res, next) {
    if (res.headersSent) return next(err);
    const status = err.status || 500;
    const message =
      maskMessages && process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message;

    const response = {
      success: false,
      message,
      code: err.code || 'ERR_INTERNAL',
    };

    res.status(status).json(response);

    if (log) console.error(`[Crashless] ${err.stack || err.message}`);

    if (onTelemetry) {
      setImmediate(() =>
        onTelemetry(err, {
          method: req.method,
          path: req.path,
          status,
          timestamp: new Date().toISOString(),
        })
      );
    }
  };
}

// optional helper to create consistent errors
crashless.createError = function (message, status = 500, code = 'ERR_INTERNAL', details = {}) {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  err.details = details;
  return err;
};

// placeholder for async patch logic
function patchExpressApp(app) {
  if (!app) return;
  const methods = ['get', 'post', 'put', 'delete', 'patch', 'all'];
  for (const method of methods) {
    const original = app[method];
    app[method] = function (...args) {
      const last = args[args.length - 1];
      if (typeof last === 'function' && last.constructor.name === 'AsyncFunction') {
        args[args.length - 1] = (req, res, next) => {
          Promise.resolve(last(req, res, next)).catch(next);
        };
      }
      return original.apply(this, args);
    };
  }
}

export default crashless;