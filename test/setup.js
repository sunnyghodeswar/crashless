/**
 * Test Setup File
 * Configures test environment for Crashless
 */

// Set test environment
process.env.NODE_ENV = 'test';

// Reset modules state between tests
import { resetMetrics } from '../src/metrics.js';
import { configureTracing, getTraces } from '../src/tracing.js';

// Note: Mocha provides beforeEach/afterEach globally in test files
// This file is for environment setup only

// Set default timeout for all tests (10 seconds)
if (typeof global !== 'undefined') {
  // Mocha will handle timeouts via --timeout flag or in test files
}

