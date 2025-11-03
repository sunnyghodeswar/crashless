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

// Re-export from crashless.js (main implementation)
export {
  default,
  crashlessFactory,
  createError,
  handleAsync,
  registerExporter
} from './crashless.js';

// Re-export metrics utilities
export {
  getMetrics,
  exportPrometheus,
  exportOpenTelemetry,
  resetMetrics
} from './metrics.js';

// Re-export dashboard HTML generator
export { getDashboardHTML } from './dashboard.js';
