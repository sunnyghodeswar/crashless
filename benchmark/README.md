# Crashless Benchmark Suite

This benchmark suite compares **Crashless** (minimal configuration) against alternative error handling approaches for Express.js applications.

## What's Being Tested

The benchmark compares three approaches:

1. **Crashless (minimal)** - Automatic error handling with no telemetry overhead
2. **Plain Express (try-catch)** - Manual try-catch error handling
3. **Express + express-async-errors** - Popular library for automatic async error handling

## Prerequisites

- Node.js 18+ (for native `fetch` support)
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone https://github.com/sunnyghodeswar/crashless.git
cd crashless
```

2. Install dependencies:
```bash
npm install
```

3. (Optional) Install express-async-errors for comparison:
```bash
npm install express-async-errors --save-dev
```

## Running the Benchmark

### Quick Start

```bash
node benchmark/benchmark.js
```

### What the Benchmark Does

The benchmark performs load testing with:
- **50 concurrent users** making requests
- **20 seconds** of load per test
- **5 seconds** of warmup before each test
- **10 seconds** break between tests (for CPU thermals)

Each test simulates error scenarios by throwing errors in route handlers, which is the primary use case for error handling middleware.

### Expected Duration

The full benchmark suite takes approximately **1-2 minutes** to complete:
- Test 1 (Crashless): ~20s + warmup + break
- Test 2 (Plain Express): ~20s + warmup + break  
- Test 3 (express-async-errors): ~20s + warmup

## Understanding the Results

The benchmark measures:

- **Throughput** (req/s) - Requests per second
- **Average Latency** - Mean response time
- **Min/Max Latency** - Latency range
- **Error Rate** - Percentage of failed requests (should be 0% for proper error handling)

### Performance Comparison

The report shows:
- **Overhead percentages** - How much slower/faster each approach is
- **Speedup factors** - Multiplicative performance differences
- **Key insights** - Summary of findings

## Results Output

Results are saved to:
- **Console** - Real-time progress and final report
- **benchmark/results.json** - Detailed JSON results for analysis

### Example Output

```
📈 Benchmark Comparison Report
======================================================================

1. Throughput Comparison (Requests/Second)
----------------------------------------------------------------------
   Crashless (minimal):        15,143 req/s
   Plain Express (try-catch):  15,085 req/s
   Express + async-errors:     6,333 req/s

2. Latency Comparison (Average)
----------------------------------------------------------------------
   Crashless (minimal):        3.30ms
   Plain Express (try-catch):  3.32ms
   Express + async-errors:     7.91ms

3. Performance Comparison
----------------------------------------------------------------------
   Crashless vs Plain Express:     0.6% overhead
   Crashless vs express-async-errors: 58.3% FASTER
```

## Interpreting Results

### Good Performance Indicators

- **Low overhead** (< 5%) vs plain try-catch indicates minimal performance impact
- **Negative overhead** means the approach is faster than the baseline
- **Consistent latency** (small min-max range) indicates stable performance

### What to Look For

1. **Crashless vs Plain Express**: Should show minimal overhead (0-5%)
2. **Crashless vs express-async-errors**: Should show significant speedup (often 2x+ faster)
3. **Error Rate**: Should be 0% for all approaches (all errors properly handled)

## Troubleshooting

### express-async-errors Not Found

If you see a warning about `express-async-errors` not being found:
```bash
npm install express-async-errors --save-dev
```

The benchmark will still run using a manual async wrapper that mimics express-async-errors behavior.

### High Variance in Results

If you see inconsistent results:
- Close other applications to reduce system load
- Run on a dedicated machine if possible
- Ensure CPU is not throttling (check temperature)
- Run multiple times and average results

### Port Already in Use

If you get port errors:
- Wait a few seconds between runs
- Check for other Node.js processes: `ps aux | grep node`
- Kill any hanging processes

## Contributing Results

If you run the benchmark and get interesting results, we'd love to see them! Please:

1. Include your system specs (OS, Node.js version, CPU)
2. Share the console output or results.json
3. Note any unusual conditions (high system load, etc.)

## Methodology

### Test Configuration

- **Concurrent Users**: 50
- **Test Duration**: 20 seconds per test
- **Warmup**: 5 seconds before each test
- **Break**: 10 seconds between tests (for CPU thermals)

### Test Routes

All tests use error-throwing routes:
- `/boom` - Synchronous error
- `/async-boom` - Asynchronous error

This focuses on error handling performance, which is the primary use case.

### Crashless Configuration

Crashless is tested with **minimal configuration**:
- Error handling: Enabled (automatic)
- Metrics: Disabled (`engine: 'none'`)
- Tracing: Disabled
- Dashboard: Disabled
- Logging: Disabled (during benchmarks)

This represents the lightest possible Crashless setup, focusing purely on error handling performance.

## Why This Benchmark Matters

Error handling is critical for production applications. This benchmark helps you understand:

1. **Performance cost** of automatic error handling vs manual approaches
2. **Comparison** with popular alternatives like express-async-errors
3. **Real-world impact** under concurrent load

The results help you make informed decisions about error handling strategies for your Express.js applications.

## License

This benchmark suite is part of the Crashless project and is licensed under the MIT License.
