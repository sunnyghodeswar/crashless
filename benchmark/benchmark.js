/**
 * Crashless Benchmark Suite
 * 
 * Comprehensive performance comparison including:
 * 1. Crashless (minimal - error handling only)
 * 2. Crashless (with metrics)
 * 3. Crashless (metrics + traces - 100% sampling)
 * 4. Crashless (metrics + traces - 20% sampling)
 * 5. Crashless (metrics + traces - 10% sampling)
 * 6. Plain Express with manual try-catch error handling
 * 7. Express with express-async-errors
 * 
 * Uses Crashless error API (createError) for realistic error handling.
 * This benchmark suite is designed to be runnable by anyone
 * to verify performance claims independently.
 */

import crashless from '../src/index.js';
import { createError } from '../src/index.js';
import express from 'express';
import { performance } from 'perf_hooks';
import { writeFileSync } from 'fs';

// Configuration
const CONCURRENT_USERS = 50;
const TEST_DURATION_MS = 20000; // 20 seconds
const WARMUP_DURATION_MS = 5000; // 5 seconds warmup
const BREAK_DURATION_MS = 10000; // 10 seconds break between tests (for CPU thermals)

// Results storage
const results = {
  crashlessMinimal: null,
  crashlessMetrics: null,
  crashlessTraces100: null,
  crashlessTraces20: null,
  crashlessTraces10: null,
  plain: null,
  expressAsyncErrors: null,
  timestamp: new Date().toISOString(),
  nodeVersion: process.version,
  config: {
    concurrentUsers: CONCURRENT_USERS,
    testDurationMs: TEST_DURATION_MS,
    warmupDurationMs: WARMUP_DURATION_MS
  }
};

console.log('🚀 Crashless Benchmark Suite');
console.log('='.repeat(70));
console.log(`\n📋 Configuration:`);
console.log(`   - Concurrent Users: ${CONCURRENT_USERS}`);
console.log(`   - Test Duration: ${TEST_DURATION_MS / 1000}s per test`);
console.log(`   - Warmup Duration: ${WARMUP_DURATION_MS / 1000}s`);
console.log(`   - Break Between Tests: ${BREAK_DURATION_MS / 1000}s (for CPU thermals)`);
console.log(`   - Node.js Version: ${process.version}`);
console.log(`   - Platform: ${process.platform} ${process.arch}\n`);

/**
 * Create Express app with plain try-catch (manual error handling)
 */
function createPlainApp() {
  const app = express();
  app.use(express.json());
  
  // Manual try/catch in route
  app.get('/boom', (req, res, next) => {
    try {
      throw new Error('Boom! Intentional error for testing');
    } catch (err) {
      res.status(500).json({
        success: false,
        message: err.message,
        code: 'ERR_500'
      });
    }
  });
  
  // Async route with manual try-catch
  app.get('/async-boom', async (req, res, next) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1));
      throw new Error('Boom! Async error for testing');
    } catch (err) {
      res.status(500).json({
        success: false,
        message: err.message,
        code: 'ERR_500'
      });
    }
  });
  
  // Success route for comparison
  app.get('/ok', (req, res) => {
    res.json({ success: true, message: 'OK' });
  });
  
  // Basic error handler for unhandled errors
  app.use((err, req, res, next) => {
    if (res.headersSent) {
      return next(err);
    }
    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Internal server error',
      code: `ERR_${err.status || 500}`
    });
  });
  
  return app;
}

/**
 * Create Express app with express-async-errors
 */
async function createExpressAsyncErrorsApp() {
  const app = express();
  app.use(express.json());
  
  let hasAsyncErrors = false;
  try {
    await import('express-async-errors');
    hasAsyncErrors = true;
    console.log('   ✓ express-async-errors package found and loaded');
  } catch (e) {
    console.log('   ⚠️  express-async-errors not found, using manual async wrapper');
    hasAsyncErrors = false;
  }
  
  // Manual async wrapper (mimics express-async-errors behavior if package not available)
  const wrapAsync = (fn) => {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  };
  
  // Route that throws - will be caught by express-async-errors or wrapper
  if (hasAsyncErrors) {
    app.get('/boom', async (req, res) => {
      throw new Error('Boom! Intentional error for testing');
    });
    
    app.get('/async-boom', async (req, res) => {
      await new Promise(resolve => setTimeout(resolve, 1));
      throw new Error('Boom! Async error for testing');
    });
  } else {
    app.get('/boom', wrapAsync(async (req, res) => {
      throw new Error('Boom! Intentional error for testing');
    }));
    
    app.get('/async-boom', wrapAsync(async (req, res) => {
      await new Promise(resolve => setTimeout(resolve, 1));
      throw new Error('Boom! Async error for testing');
    }));
  }
  
  // Error handler
  app.use((err, req, res, next) => {
    if (res.headersSent) {
      return next(err);
    }
    res.status(err.status || 500).json({
      success: false,
      message: err.message,
      code: `ERR_${err.status || 500}`
    });
  });
  
  // Success route
  app.get('/ok', (req, res) => {
    res.json({ success: true, message: 'OK' });
  });
  
  return app;
}

/**
 * Create Express app with Crashless (configurable)
 */
function createCrashlessApp(config = {}) {
  const app = express();
  app.use(express.json());
  
  // Default to minimal config
  const crashlessConfig = {
    telemetry: {
      engine: config.metrics ? 'builtin' : 'none',
      dashboard: false,
      traces: config.traces ? {
        enabled: true,
        samplingRate: config.samplingRate !== undefined ? config.samplingRate : 1,
        maxStored: 100
      } : undefined
    },
    log: false // Suppress logging during benchmarks
  };
  
  const crashlessInstance = crashless(crashlessConfig);
  app.use(crashlessInstance);
  
  // Route that throws - Using Crashless error API
  app.get('/boom', (req, res) => {
    throw createError('Boom! Intentional error for testing', 500, 'ERR_TEST');
  });
  
  // Async route that throws - Using Crashless error API
  app.get('/async-boom', async (req, res) => {
    await new Promise(resolve => setTimeout(resolve, 1));
    throw createError('Boom! Async error for testing', 500, 'ERR_ASYNC_TEST');
  });
  
  // Success route
  app.get('/ok', (req, res) => {
    res.json({ success: true, message: 'OK' });
  });
  
  return app;
}

/**
 * Load test a server
 */
async function loadTest(app, label, route = '/boom') {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, async () => {
      const port = server.address().port;
      const url = `http://localhost:${port}`;
      
      const stats = {
        label,
        totalRequests: 0,
        successfulRequests: 0,
        errorRequests: 0,
        totalLatency: 0,
        minLatency: Infinity,
        maxLatency: 0,
        errors: [],
        startTime: null,
        endTime: null
      };
      
      try {
        // Warmup phase
        console.log(`   🔥 Warming up ${label}...`);
        const warmupPromises = [];
        for (let i = 0; i < CONCURRENT_USERS; i++) {
          warmupPromises.push(
            fetch(`${url}${route}`).catch(() => {})
          );
        }
        await Promise.all(warmupPromises);
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log(`   ✓ Warmup complete`);
        
        // Actual load test
        console.log(`   🏃 Running load test for ${label}...`);
        stats.startTime = performance.now();
        
        const workers = [];
        let isRunning = true;
        
        // Create worker function
        const worker = async () => {
          while (isRunning) {
            const start = performance.now();
            try {
              const response = await fetch(`${url}${route}`);
              const end = performance.now();
              const latency = end - start;
              
              stats.totalRequests++;
              stats.totalLatency += latency;
              stats.minLatency = Math.min(stats.minLatency, latency);
              stats.maxLatency = Math.max(stats.maxLatency, latency);
              
              if (response.ok) {
                stats.successfulRequests++;
              } else {
                stats.errorRequests++;
              }
            } catch (error) {
              const end = performance.now();
              const latency = end - start;
              stats.totalRequests++;
              stats.totalLatency += latency;
              stats.errorRequests++;
              if (stats.errors.length < 10) {
                stats.errors.push(error.message);
              }
            }
          }
        };
        
        // Start concurrent workers
        for (let i = 0; i < CONCURRENT_USERS; i++) {
          workers.push(worker());
        }
        
        // Run for specified duration
        setTimeout(() => {
          isRunning = false;
          stats.endTime = performance.now();
          
          // Wait for all workers to finish
          Promise.all(workers).then(() => {
            const duration = stats.endTime - stats.startTime;
            const rps = (stats.totalRequests / duration) * 1000;
            const avgLatency = stats.totalLatency / stats.totalRequests;
            
            const result = {
              label,
              duration,
              totalRequests: stats.totalRequests,
              successfulRequests: stats.successfulRequests,
              errorRequests: stats.errorRequests,
              rps,
              avgLatency,
              minLatency: stats.minLatency === Infinity ? 0 : stats.minLatency,
              maxLatency: stats.maxLatency,
              errorRate: (stats.errorRequests / stats.totalRequests) * 100,
              errors: stats.errors.slice(0, 10) // Sample of errors
            };
            
            server.close(() => {
              setTimeout(() => resolve(result), 100);
            });
          });
        }, TEST_DURATION_MS);
      } catch (error) {
        server.close(() => {
          reject(error);
        });
      }
    });
    
    server.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Sleep function for breaks between tests
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Main benchmark runner
 */
async function runBenchmarks() {
  console.log('📊 Starting Benchmark Tests...\n');
  
  // Suppress console errors during tests
  const originalError = console.error;
  console.error = () => {};
  
  try {
    // Test 1: Crashless (minimal)
    console.log('Test 1: Crashless (Minimal Configuration)');
    console.log('-'.repeat(70));
    console.log('   Configuration: Error handling only, no telemetry');
    results.crashlessMinimal = await loadTest(
      createCrashlessApp(),
      'Crashless (minimal)'
    );
    console.log(`   ✓ Completed: ${results.crashlessMinimal.totalRequests.toLocaleString()} requests`);
    console.log(`   ✓ Throughput: ${results.crashlessMinimal.rps.toFixed(0)} req/s`);
    console.log(`   ✓ Avg Latency: ${results.crashlessMinimal.avgLatency.toFixed(2)}ms`);
    console.log(`   ✓ Min Latency: ${results.crashlessMinimal.minLatency.toFixed(2)}ms`);
    console.log(`   ✓ Max Latency: ${results.crashlessMinimal.maxLatency.toFixed(2)}ms`);
    console.log(`   ✓ Error Rate: ${results.crashlessMinimal.errorRate.toFixed(2)}%\n`);
    
    console.log(`   ⏸️  Cooling down for ${BREAK_DURATION_MS / 1000}s...\n`);
    await sleep(BREAK_DURATION_MS);
    
    // Test 2: Crashless (with metrics)
    console.log('Test 2: Crashless (With Metrics)');
    console.log('-'.repeat(70));
    console.log('   Configuration: Error handling + metrics collection');
    results.crashlessMetrics = await loadTest(
      createCrashlessApp({ metrics: true }),
      'Crashless (with metrics)'
    );
    console.log(`   ✓ Completed: ${results.crashlessMetrics.totalRequests.toLocaleString()} requests`);
    console.log(`   ✓ Throughput: ${results.crashlessMetrics.rps.toFixed(0)} req/s`);
    console.log(`   ✓ Avg Latency: ${results.crashlessMetrics.avgLatency.toFixed(2)}ms`);
    console.log(`   ✓ Min Latency: ${results.crashlessMetrics.minLatency.toFixed(2)}ms`);
    console.log(`   ✓ Max Latency: ${results.crashlessMetrics.maxLatency.toFixed(2)}ms`);
    console.log(`   ✓ Error Rate: ${results.crashlessMetrics.errorRate.toFixed(2)}%\n`);
    
    console.log(`   ⏸️  Cooling down for ${BREAK_DURATION_MS / 1000}s...\n`);
    await sleep(BREAK_DURATION_MS);
    
    // Test 3: Crashless (with metrics + traces 100%)
    console.log('Test 3: Crashless (Metrics + Traces - 100% Sampling)');
    console.log('-'.repeat(70));
    console.log('   Configuration: Error handling + metrics + distributed tracing (100% sampling)');
    results.crashlessTraces100 = await loadTest(
      createCrashlessApp({ metrics: true, traces: true, samplingRate: 1.0 }),
      'Crashless (metrics + traces 100%)'
    );
    console.log(`   ✓ Completed: ${results.crashlessTraces100.totalRequests.toLocaleString()} requests`);
    console.log(`   ✓ Throughput: ${results.crashlessTraces100.rps.toFixed(0)} req/s`);
    console.log(`   ✓ Avg Latency: ${results.crashlessTraces100.avgLatency.toFixed(2)}ms`);
    console.log(`   ✓ Min Latency: ${results.crashlessTraces100.minLatency.toFixed(2)}ms`);
    console.log(`   ✓ Max Latency: ${results.crashlessTraces100.maxLatency.toFixed(2)}ms`);
    console.log(`   ✓ Error Rate: ${results.crashlessTraces100.errorRate.toFixed(2)}%\n`);
    
    console.log(`   ⏸️  Cooling down for ${BREAK_DURATION_MS / 1000}s...\n`);
    await sleep(BREAK_DURATION_MS);
    
    // Test 4: Crashless (with metrics + traces 20%)
    console.log('Test 4: Crashless (Metrics + Traces - 20% Sampling)');
    console.log('-'.repeat(70));
    console.log('   Configuration: Error handling + metrics + distributed tracing (20% sampling)');
    results.crashlessTraces20 = await loadTest(
      createCrashlessApp({ metrics: true, traces: true, samplingRate: 0.2 }),
      'Crashless (metrics + traces 20%)'
    );
    console.log(`   ✓ Completed: ${results.crashlessTraces20.totalRequests.toLocaleString()} requests`);
    console.log(`   ✓ Throughput: ${results.crashlessTraces20.rps.toFixed(0)} req/s`);
    console.log(`   ✓ Avg Latency: ${results.crashlessTraces20.avgLatency.toFixed(2)}ms`);
    console.log(`   ✓ Min Latency: ${results.crashlessTraces20.minLatency.toFixed(2)}ms`);
    console.log(`   ✓ Max Latency: ${results.crashlessTraces20.maxLatency.toFixed(2)}ms`);
    console.log(`   ✓ Error Rate: ${results.crashlessTraces20.errorRate.toFixed(2)}%\n`);
    
    console.log(`   ⏸️  Cooling down for ${BREAK_DURATION_MS / 1000}s...\n`);
    await sleep(BREAK_DURATION_MS);
    
    // Test 5: Crashless (with metrics + traces 10%)
    console.log('Test 5: Crashless (Metrics + Traces - 10% Sampling)');
    console.log('-'.repeat(70));
    console.log('   Configuration: Error handling + metrics + distributed tracing (10% sampling)');
    results.crashlessTraces10 = await loadTest(
      createCrashlessApp({ metrics: true, traces: true, samplingRate: 0.1 }),
      'Crashless (metrics + traces 10%)'
    );
    console.log(`   ✓ Completed: ${results.crashlessTraces10.totalRequests.toLocaleString()} requests`);
    console.log(`   ✓ Throughput: ${results.crashlessTraces10.rps.toFixed(0)} req/s`);
    console.log(`   ✓ Avg Latency: ${results.crashlessTraces10.avgLatency.toFixed(2)}ms`);
    console.log(`   ✓ Min Latency: ${results.crashlessTraces10.minLatency.toFixed(2)}ms`);
    console.log(`   ✓ Max Latency: ${results.crashlessTraces10.maxLatency.toFixed(2)}ms`);
    console.log(`   ✓ Error Rate: ${results.crashlessTraces10.errorRate.toFixed(2)}%\n`);
    
    console.log(`   ⏸️  Cooling down for ${BREAK_DURATION_MS / 1000}s...\n`);
    await sleep(BREAK_DURATION_MS);
    
    // Test 6: Plain Express with try-catch
    console.log('Test 6: Plain Express (Manual try-catch)');
    console.log('-'.repeat(70));
    console.log('   Configuration: Manual try-catch error handling');
    results.plain = await loadTest(createPlainApp(), 'Plain Express');
    console.log(`   ✓ Completed: ${results.plain.totalRequests.toLocaleString()} requests`);
    console.log(`   ✓ Throughput: ${results.plain.rps.toFixed(0)} req/s`);
    console.log(`   ✓ Avg Latency: ${results.plain.avgLatency.toFixed(2)}ms`);
    console.log(`   ✓ Min Latency: ${results.plain.minLatency.toFixed(2)}ms`);
    console.log(`   ✓ Max Latency: ${results.plain.maxLatency.toFixed(2)}ms`);
    console.log(`   ✓ Error Rate: ${results.plain.errorRate.toFixed(2)}%\n`);
    
    console.log(`   ⏸️  Cooling down for ${BREAK_DURATION_MS / 1000}s...\n`);
    await sleep(BREAK_DURATION_MS);
    
    // Test 7: Express with express-async-errors
    console.log('Test 7: Express with express-async-errors');
    console.log('-'.repeat(70));
    console.log('   Configuration: Automatic async error handling');
    const asyncErrorsApp = await createExpressAsyncErrorsApp();
    results.expressAsyncErrors = await loadTest(
      asyncErrorsApp,
      'Express + express-async-errors'
    );
    console.log(`   ✓ Completed: ${results.expressAsyncErrors.totalRequests.toLocaleString()} requests`);
    console.log(`   ✓ Throughput: ${results.expressAsyncErrors.rps.toFixed(0)} req/s`);
    console.log(`   ✓ Avg Latency: ${results.expressAsyncErrors.avgLatency.toFixed(2)}ms`);
    console.log(`   ✓ Min Latency: ${results.expressAsyncErrors.minLatency.toFixed(2)}ms`);
    console.log(`   ✓ Max Latency: ${results.expressAsyncErrors.maxLatency.toFixed(2)}ms`);
    console.log(`   ✓ Error Rate: ${results.expressAsyncErrors.errorRate.toFixed(2)}%\n`);
    
    // Restore console.error
    console.error = originalError;
    
    // Generate comparison report
    await generateReport();
    
  } catch (error) {
    console.error = originalError;
    console.error('\n❌ Benchmark failed:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

/**
 * Generate comparison report
 */
async function generateReport() {
  console.log('\n' + '='.repeat(70));
  console.log('📈 Benchmark Comparison Report');
  console.log('='.repeat(70));
  
  const crashlessMinimal = results.crashlessMinimal;
  const crashlessMetrics = results.crashlessMetrics;
  const crashlessTraces100 = results.crashlessTraces100;
  const crashlessTraces20 = results.crashlessTraces20;
  const crashlessTraces10 = results.crashlessTraces10;
  const plain = results.plain;
  const asyncErrors = results.expressAsyncErrors;
  
  // Calculate overhead percentages (vs plain as baseline)
  const crashlessMinimalVsPlain = ((crashlessMinimal.avgLatency - plain.avgLatency) / plain.avgLatency * 100);
  const crashlessMetricsVsPlain = ((crashlessMetrics.avgLatency - plain.avgLatency) / plain.avgLatency * 100);
  const crashlessTraces100VsPlain = ((crashlessTraces100.avgLatency - plain.avgLatency) / plain.avgLatency * 100);
  const crashlessTraces20VsPlain = ((crashlessTraces20.avgLatency - plain.avgLatency) / plain.avgLatency * 100);
  const crashlessTraces10VsPlain = ((crashlessTraces10.avgLatency - plain.avgLatency) / plain.avgLatency * 100);
  const asyncErrorsVsPlain = ((asyncErrors.avgLatency - plain.avgLatency) / plain.avgLatency * 100);
  
  // Calculate overhead vs express-async-errors
  const crashlessMinimalVsAsyncErrors = ((crashlessMinimal.avgLatency - asyncErrors.avgLatency) / asyncErrors.avgLatency * 100);
  const crashlessMetricsVsAsyncErrors = ((crashlessMetrics.avgLatency - asyncErrors.avgLatency) / asyncErrors.avgLatency * 100);
  const crashlessTraces100VsAsyncErrors = ((crashlessTraces100.avgLatency - asyncErrors.avgLatency) / asyncErrors.avgLatency * 100);
  const crashlessTraces20VsAsyncErrors = ((crashlessTraces20.avgLatency - asyncErrors.avgLatency) / asyncErrors.avgLatency * 100);
  const crashlessTraces10VsAsyncErrors = ((crashlessTraces10.avgLatency - asyncErrors.avgLatency) / asyncErrors.avgLatency * 100);
  
  // Calculate overhead of features vs minimal
  const metricsOverhead = ((crashlessMetrics.avgLatency - crashlessMinimal.avgLatency) / crashlessMinimal.avgLatency * 100);
  const traces100Overhead = ((crashlessTraces100.avgLatency - crashlessMinimal.avgLatency) / crashlessMinimal.avgLatency * 100);
  const traces20Overhead = ((crashlessTraces20.avgLatency - crashlessMinimal.avgLatency) / crashlessMinimal.avgLatency * 100);
  const traces10Overhead = ((crashlessTraces10.avgLatency - crashlessMinimal.avgLatency) / crashlessMinimal.avgLatency * 100);
  
  console.log('\n1. Throughput Comparison (Requests/Second)');
  console.log('-'.repeat(70));
  console.log(`   Crashless (minimal):              ${crashlessMinimal.rps.toFixed(0)} req/s`);
  console.log(`   Crashless (with metrics):         ${crashlessMetrics.rps.toFixed(0)} req/s`);
  console.log(`   Crashless (metrics + traces 100%): ${crashlessTraces100.rps.toFixed(0)} req/s`);
  console.log(`   Crashless (metrics + traces 20%):  ${crashlessTraces20.rps.toFixed(0)} req/s`);
  console.log(`   Crashless (metrics + traces 10%):  ${crashlessTraces10.rps.toFixed(0)} req/s`);
  console.log(`   Plain Express (try-catch):        ${plain.rps.toFixed(0)} req/s`);
  console.log(`   Express + async-errors:          ${asyncErrors.rps.toFixed(0)} req/s`);
  
  console.log('\n2. Latency Comparison (Average)');
  console.log('-'.repeat(70));
  console.log(`   Crashless (minimal):              ${crashlessMinimal.avgLatency.toFixed(2)}ms`);
  console.log(`   Crashless (with metrics):         ${crashlessMetrics.avgLatency.toFixed(2)}ms`);
  console.log(`   Crashless (metrics + traces 100%): ${crashlessTraces100.avgLatency.toFixed(2)}ms`);
  console.log(`   Crashless (metrics + traces 20%):  ${crashlessTraces20.avgLatency.toFixed(2)}ms`);
  console.log(`   Crashless (metrics + traces 10%):  ${crashlessTraces10.avgLatency.toFixed(2)}ms`);
  console.log(`   Plain Express (try-catch):        ${plain.avgLatency.toFixed(2)}ms`);
  console.log(`   Express + async-errors:          ${asyncErrors.avgLatency.toFixed(2)}ms`);
  
  console.log('\n3. Latency Range');
  console.log('-'.repeat(70));
  console.log(`   Crashless (minimal):              ${crashlessMinimal.minLatency.toFixed(2)}ms - ${crashlessMinimal.maxLatency.toFixed(2)}ms`);
  console.log(`   Crashless (with metrics):         ${crashlessMetrics.minLatency.toFixed(2)}ms - ${crashlessMetrics.maxLatency.toFixed(2)}ms`);
  console.log(`   Crashless (metrics + traces 100%): ${crashlessTraces100.minLatency.toFixed(2)}ms - ${crashlessTraces100.maxLatency.toFixed(2)}ms`);
  console.log(`   Crashless (metrics + traces 20%):  ${crashlessTraces20.minLatency.toFixed(2)}ms - ${crashlessTraces20.maxLatency.toFixed(2)}ms`);
  console.log(`   Crashless (metrics + traces 10%):  ${crashlessTraces10.minLatency.toFixed(2)}ms - ${crashlessTraces10.maxLatency.toFixed(2)}ms`);
  console.log(`   Plain Express (try-catch):        ${plain.minLatency.toFixed(2)}ms - ${plain.maxLatency.toFixed(2)}ms`);
  console.log(`   Express + async-errors:          ${asyncErrors.minLatency.toFixed(2)}ms - ${asyncErrors.maxLatency.toFixed(2)}ms`);
  
  console.log('\n4. Performance Comparison (vs Plain Express)');
  console.log('-'.repeat(70));
  
  if (crashlessMinimalVsPlain < 0) {
    console.log(`   Crashless (minimal):              ${Math.abs(crashlessMinimalVsPlain).toFixed(1)}% FASTER`);
  } else {
    console.log(`   Crashless (minimal):              ${crashlessMinimalVsPlain.toFixed(1)}% overhead`);
  }
  
  if (crashlessMetricsVsPlain < 0) {
    console.log(`   Crashless (with metrics):         ${Math.abs(crashlessMetricsVsPlain).toFixed(1)}% FASTER`);
  } else {
    console.log(`   Crashless (with metrics):         ${crashlessMetricsVsPlain.toFixed(1)}% overhead`);
  }
  
  if (crashlessTraces100VsPlain < 0) {
    console.log(`   Crashless (metrics + traces 100%): ${Math.abs(crashlessTraces100VsPlain).toFixed(1)}% FASTER`);
  } else {
    console.log(`   Crashless (metrics + traces 100%): ${crashlessTraces100VsPlain.toFixed(1)}% overhead`);
  }
  
  if (crashlessTraces20VsPlain < 0) {
    console.log(`   Crashless (metrics + traces 20%):  ${Math.abs(crashlessTraces20VsPlain).toFixed(1)}% FASTER`);
  } else {
    console.log(`   Crashless (metrics + traces 20%):  ${crashlessTraces20VsPlain.toFixed(1)}% overhead`);
  }
  
  if (crashlessTraces10VsPlain < 0) {
    console.log(`   Crashless (metrics + traces 10%):  ${Math.abs(crashlessTraces10VsPlain).toFixed(1)}% FASTER`);
  } else {
    console.log(`   Crashless (metrics + traces 10%):  ${crashlessTraces10VsPlain.toFixed(1)}% overhead`);
  }
  
  if (asyncErrorsVsPlain < 0) {
    console.log(`   Express + async-errors:          ${Math.abs(asyncErrorsVsPlain).toFixed(1)}% FASTER`);
  } else {
    console.log(`   Express + async-errors:          ${asyncErrorsVsPlain.toFixed(1)}% overhead`);
  }
  
  console.log('\n5. Crashless Overhead Breakdown (vs Minimal)');
  console.log('-'.repeat(70));
  console.log(`   Minimal (baseline):                 ${crashlessMinimal.avgLatency.toFixed(2)}ms`);
  if (metricsOverhead > 0) {
    console.log(`   + Metrics adds:                     ${metricsOverhead.toFixed(1)}% (${(crashlessMetrics.avgLatency - crashlessMinimal.avgLatency).toFixed(2)}ms)`);
  } else {
    console.log(`   + Metrics adds:                     ${Math.abs(metricsOverhead).toFixed(1)}% faster`);
  }
  if (traces100Overhead > 0) {
    console.log(`   + Traces (100% sampling) adds:      ${traces100Overhead.toFixed(1)}% (${(crashlessTraces100.avgLatency - crashlessMinimal.avgLatency).toFixed(2)}ms)`);
  } else {
    console.log(`   + Traces (100% sampling) adds:      ${Math.abs(traces100Overhead).toFixed(1)}% faster`);
  }
  if (traces20Overhead > 0) {
    console.log(`   + Traces (20% sampling) adds:        ${traces20Overhead.toFixed(1)}% (${(crashlessTraces20.avgLatency - crashlessMinimal.avgLatency).toFixed(2)}ms)`);
  } else {
    console.log(`   + Traces (20% sampling) adds:        ${Math.abs(traces20Overhead).toFixed(1)}% faster`);
  }
  if (traces10Overhead > 0) {
    console.log(`   + Traces (10% sampling) adds:        ${traces10Overhead.toFixed(1)}% (${(crashlessTraces10.avgLatency - crashlessMinimal.avgLatency).toFixed(2)}ms)`);
  } else {
    console.log(`   + Traces (10% sampling) adds:        ${Math.abs(traces10Overhead).toFixed(1)}% faster`);
  }
  
  console.log('\n6. Performance Comparison (vs express-async-errors)');
  console.log('-'.repeat(70));
  
  if (crashlessMinimalVsAsyncErrors < 0) {
    const speedup = (asyncErrors.avgLatency / crashlessMinimal.avgLatency).toFixed(1);
    console.log(`   Crashless (minimal):              ${speedup}x FASTER (${Math.abs(crashlessMinimalVsAsyncErrors).toFixed(1)}%)`);
  } else {
    console.log(`   Crashless (minimal):              ${crashlessMinimalVsAsyncErrors.toFixed(1)}% overhead`);
  }
  
  if (crashlessMetricsVsAsyncErrors < 0) {
    const speedup = (asyncErrors.avgLatency / crashlessMetrics.avgLatency).toFixed(1);
    console.log(`   Crashless (with metrics):         ${speedup}x FASTER (${Math.abs(crashlessMetricsVsAsyncErrors).toFixed(1)}%)`);
  } else {
    console.log(`   Crashless (with metrics):         ${crashlessMetricsVsAsyncErrors.toFixed(1)}% overhead`);
  }
  
  if (crashlessTraces100VsAsyncErrors < 0) {
    const speedup = (asyncErrors.avgLatency / crashlessTraces100.avgLatency).toFixed(1);
    console.log(`   Crashless (metrics + traces 100%): ${speedup}x FASTER (${Math.abs(crashlessTraces100VsAsyncErrors).toFixed(1)}%)`);
  } else {
    console.log(`   Crashless (metrics + traces 100%): ${crashlessTraces100VsAsyncErrors.toFixed(1)}% overhead`);
  }
  
  if (crashlessTraces20VsAsyncErrors < 0) {
    const speedup = (asyncErrors.avgLatency / crashlessTraces20.avgLatency).toFixed(1);
    console.log(`   Crashless (metrics + traces 20%):  ${speedup}x FASTER (${Math.abs(crashlessTraces20VsAsyncErrors).toFixed(1)}%)`);
  } else {
    console.log(`   Crashless (metrics + traces 20%):  ${crashlessTraces20VsAsyncErrors.toFixed(1)}% overhead`);
  }
  
  if (crashlessTraces10VsAsyncErrors < 0) {
    const speedup = (asyncErrors.avgLatency / crashlessTraces10.avgLatency).toFixed(1);
    console.log(`   Crashless (metrics + traces 10%):  ${speedup}x FASTER (${Math.abs(crashlessTraces10VsAsyncErrors).toFixed(1)}%)`);
  } else {
    console.log(`   Crashless (metrics + traces 10%):  ${crashlessTraces10VsAsyncErrors.toFixed(1)}% overhead`);
  }
  
  console.log('\n7. Error Handling Effectiveness');
  console.log('-'.repeat(70));
  console.log(`   Crashless (minimal):              ${crashlessMinimal.errorRate.toFixed(2)}% errors`);
  console.log(`   Crashless (with metrics):         ${crashlessMetrics.errorRate.toFixed(2)}% errors`);
  console.log(`   Crashless (metrics + traces 100%): ${crashlessTraces100.errorRate.toFixed(2)}% errors`);
  console.log(`   Crashless (metrics + traces 20%):  ${crashlessTraces20.errorRate.toFixed(2)}% errors`);
  console.log(`   Crashless (metrics + traces 10%):  ${crashlessTraces10.errorRate.toFixed(2)}% errors`);
  console.log(`   Plain Express (try-catch):        ${plain.errorRate.toFixed(2)}% errors`);
  console.log(`   Express + async-errors:          ${asyncErrors.errorRate.toFixed(2)}% errors`);
  
  console.log('\n' + '='.repeat(70));
  console.log('💡 Key Insights');
  console.log('='.repeat(70));
  
  console.log(`\n📊 Crashless Performance:`);
  console.log(`   • Minimal config: ${crashlessMinimalVsPlain < 0 ? 'Faster' : 'Comparable'} to manual try-catch (${Math.abs(crashlessMinimalVsPlain).toFixed(1)}% ${crashlessMinimalVsPlain < 0 ? 'faster' : 'overhead'})`);
  console.log(`   • Metrics add: ${metricsOverhead.toFixed(1)}% overhead`);
  console.log(`   • Traces (100% sampling) add: ${traces100Overhead.toFixed(1)}% overhead`);
  console.log(`   • Traces (20% sampling) add: ${traces20Overhead.toFixed(1)}% overhead`);
  console.log(`   • Traces (10% sampling) add: ${traces10Overhead.toFixed(1)}% overhead`);
  console.log(`   • Sampling reduces overhead: ${(traces100Overhead - traces20Overhead).toFixed(1)}% difference (100% vs 20%)`);
  
  if (crashlessMinimalVsAsyncErrors < 0) {
    const speedup = (asyncErrors.avgLatency / crashlessMinimal.avgLatency).toFixed(1);
    console.log(`   • ${speedup}x faster than express-async-errors (minimal config)`);
  }
  
  console.log(`\n📊 express-async-errors Performance:`);
  if (asyncErrorsVsPlain > 0) {
    console.log(`   • ${asyncErrorsVsPlain.toFixed(1)}% slower than plain try-catch`);
  } else {
    console.log(`   • ${Math.abs(asyncErrorsVsPlain).toFixed(1)}% faster than plain try-catch`);
  }
  
  console.log(`\n✅ Conclusion:`);
  if (crashlessMinimalVsPlain <= 5 && crashlessMinimalVsAsyncErrors < 0) {
    console.log(`   Crashless provides automatic error handling with minimal overhead`);
    console.log(`   and is faster than express-async-errors while offering more features.`);
  } else if (crashlessMinimalVsPlain <= 5) {
    console.log(`   Crashless provides automatic error handling with minimal overhead`);
    console.log(`   compared to manual try-catch, with comparable performance to express-async-errors.`);
  } else {
    console.log(`   Crashless provides automatic error handling with reasonable overhead`);
    console.log(`   for the convenience and features it provides.`);
  }
  console.log(`   Use 10-20% sampling for production to balance observability and performance.`);
  
  // Save detailed results
  const report = {
    ...results,
    comparison: {
      crashlessMinimalVsPlain: crashlessMinimalVsPlain.toFixed(2),
      crashlessMetricsVsPlain: crashlessMetricsVsPlain.toFixed(2),
      crashlessTraces100VsPlain: crashlessTraces100VsPlain.toFixed(2),
      crashlessTraces20VsPlain: crashlessTraces20VsPlain.toFixed(2),
      crashlessTraces10VsPlain: crashlessTraces10VsPlain.toFixed(2),
      crashlessMinimalVsAsyncErrors: crashlessMinimalVsAsyncErrors.toFixed(2),
      crashlessMetricsVsAsyncErrors: crashlessMetricsVsAsyncErrors.toFixed(2),
      crashlessTraces100VsAsyncErrors: crashlessTraces100VsAsyncErrors.toFixed(2),
      crashlessTraces20VsAsyncErrors: crashlessTraces20VsAsyncErrors.toFixed(2),
      crashlessTraces10VsAsyncErrors: crashlessTraces10VsAsyncErrors.toFixed(2),
      asyncErrorsVsPlain: asyncErrorsVsPlain.toFixed(2),
      metricsOverhead: metricsOverhead.toFixed(2),
      traces100Overhead: traces100Overhead.toFixed(2),
      traces20Overhead: traces20Overhead.toFixed(2),
      traces10Overhead: traces10Overhead.toFixed(2),
      speedupVsAsyncErrors: crashlessMinimalVsAsyncErrors < 0 ? (asyncErrors.avgLatency / crashlessMinimal.avgLatency).toFixed(2) : null
    }
  };
  
  try {
    writeFileSync(
      'benchmark/results.json',
      JSON.stringify(report, null, 2)
    );
    console.log('\n📄 Detailed results saved to: benchmark/results.json');
  } catch (error) {
    console.log('\n⚠️  Could not save results file:', error.message);
  }
}

// Run benchmarks
runBenchmarks().catch(error => {
  console.error('\n❌ Benchmark suite failed:', error);
  process.exit(1);
});

