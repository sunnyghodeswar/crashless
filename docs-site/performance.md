# Performance Guide

Complete performance analysis, benchmarks, and optimization strategies for Crashless.

## Verified Benchmarks

**Averaged over 5 sequential runs** to ensure reliability:

| Configuration | Throughput | Avg Latency | Overhead vs Plain Express | vs express-async-errors |
|--------------|------------|-------------|---------------------------|-------------------------|
| **Crashless (minimal)** | 15,406 req/s | 3.25ms | **2.3% overhead** | **2.2x FASTER** |
| **Crashless (with metrics)** | 13,082 req/s | 3.82ms | **20.5% overhead** | **1.9x FASTER** |
| **Crashless (metrics + traces 100%)** | 11,963 req/s | 4.18ms | **31.8% overhead** | **1.7x FASTER** |
| **Crashless (metrics + traces 20%)** | 12,390 req/s | 4.04ms | **27.2% overhead** | **1.8x FASTER** |
| **Crashless (metrics + traces 10%)** | 12,383 req/s | 4.04ms | **27.3% overhead** | **1.8x FASTER** |
| **Plain Express (try-catch)** | 15,761 req/s | 3.17ms | Baseline | **2.3x FASTER** |
| **express-async-errors** | 6,919 req/s | 7.23ms | **127.8% overhead** | Baseline |

**Benchmark Methodology:**
- 50 concurrent users
- 20 seconds load test per configuration
- Node.js v24.3.0, Express v4.21
- Error-throwing routes using Crashless error API
- 5 seconds warmup, 10 seconds cooldown between tests
- Results averaged over 5 sequential runs

**Run benchmarks yourself:**
```bash
git clone https://github.com/sunnyghodeswar/crashless.git
cd crashless
npm install
node benchmark/benchmark.js
```

---

## Performance Breakdown

### Minimal Configuration

**Configuration:** Error handling only, no telemetry

```javascript
app.use(crashless({
  telemetry: { engine: 'none' }
}));
```

**Performance:**
- Throughput: 15,406 req/s
- Average Latency: 3.25ms
- Overhead: 2.3% vs plain Express
- Speedup: 2.2x faster than express-async-errors

**Use Case:** High-traffic applications needing only error handling

---

### With Metrics

**Configuration:** Error handling + built-in metrics

```javascript
app.use(crashless({
  telemetry: { engine: 'builtin' }
}));
```

**Performance:**
- Throughput: 13,082 req/s
- Average Latency: 3.82ms
- Overhead: 20.5% vs plain Express
- Additional Overhead: +17.8% vs minimal (+0.58ms)

**Use Case:** Standard production setup requiring metrics

---

### With Metrics + Traces (100% Sampling)

**Configuration:** Full observability with 100% trace sampling

```javascript
app.use(crashless({
  telemetry: {
    engine: 'builtin',
    traces: { enabled: true, samplingRate: 1.0 }
  }
}));
```

**Performance:**
- Throughput: 11,963 req/s
- Average Latency: 4.18ms
- Overhead: 31.8% vs plain Express
- Additional Overhead: +28.8% vs minimal (+0.93ms)

**Use Case:** Development/staging or debugging production issues

---

### With Metrics + Traces (20% Sampling)

**Configuration:** Full observability with 20% trace sampling (recommended)

```javascript
app.use(crashless({
  telemetry: {
    engine: 'builtin',
    traces: { enabled: true, samplingRate: 0.2 }
  }
}));
```

**Performance:**
- Throughput: 12,390 req/s
- Average Latency: 4.04ms
- Overhead: 27.2% vs plain Express
- Additional Overhead: +24.4% vs minimal (+0.79ms)
- **Benefit:** 4.4% less overhead than 100% sampling

**Use Case:** Production environments requiring observability

---

### With Metrics + Traces (10% Sampling)

**Configuration:** Full observability with 10% trace sampling

```javascript
app.use(crashless({
  telemetry: {
    engine: 'builtin',
    traces: { enabled: true, samplingRate: 0.1 }
  }
}));
```

**Performance:**
- Throughput: 12,383 req/s
- Average Latency: 4.04ms
- Overhead: 27.3% vs plain Express
- Additional Overhead: +24.4% vs minimal (+0.79ms)

**Use Case:** High-traffic production applications

---

## Overhead Analysis

### Incremental Overhead Breakdown

| Feature | Overhead vs Minimal | Additional Latency | Cumulative |
|---------|---------------------|-------------------|------------|
| **Minimal (baseline)** | 0% | 0ms | 3.25ms |
| **+ Metrics** | +17.8% | +0.58ms | 3.82ms |
| **+ Traces (100% sampling)** | +28.8% | +0.93ms | 4.18ms |
| **+ Traces (20% sampling)** | +24.4% | +0.79ms | 4.04ms |
| **+ Traces (10% sampling)** | +24.4% | +0.79ms | 4.04ms |

### Key Insights

1. **Metrics add 17.8% overhead** - Reasonable for comprehensive metrics
2. **Traces add 24-29% overhead** - Depends on sampling rate
3. **20% sampling is optimal** - 4.4% less overhead than 100% sampling
4. **10% sampling shows similar overhead** - Sampling check overhead balances trace creation overhead

---

## Comparison with Alternatives

### vs Plain Express (Manual try-catch)

| Configuration | Performance | Verdict |
|--------------|-------------|---------|
| Crashless (minimal) | 2.3% overhead | ✅ Minimal overhead |
| Crashless (with metrics) | 20.5% overhead | ✅ Reasonable for features |
| Crashless (traces 20%) | 27.2% overhead | ✅ Good balance |

**Conclusion:** Crashless minimal has minimal overhead (2.3%) while providing automatic error handling.

### vs express-async-errors

| Configuration | Speedup Factor | Performance Gain |
|--------------|----------------|-----------------|
| Crashless (minimal) | **2.2x faster** | 55.1% faster |
| Crashless (with metrics) | **1.9x faster** | 47.1% faster |
| Crashless (traces 20%) | **1.8x faster** | 44.2% faster |

**Conclusion:** All Crashless configurations are significantly faster than express-async-errors while providing more features.

---

## Optimization Strategies

### 1. Use Minimal Config for High-Traffic

```javascript
app.use(crashless({
  telemetry: { engine: 'none' }
}));
```

**Impact:** Only 2.3% overhead vs plain Express

### 2. Use Sampling for Tracing

```javascript
app.use(crashless({
  telemetry: {
    engine: 'builtin',
    traces: {
      enabled: true,
      samplingRate: 0.2 // 20% sampling
    }
  }
}));
```

**Impact:** 4.4% less overhead than 100% sampling

### 3. Disable Dashboard in Production

```javascript
app.use(crashless({
  enableDashboard: false
}));
```

**Impact:** Eliminates dashboard route overhead

### 4. Reduce Max Stored Traces

```javascript
app.use(crashless({
  telemetry: {
    traces: {
      enabled: true,
      maxStored: 100 // Reduce from default 500
    }
  }
}));
```

**Impact:** Lower memory usage

---

## Memory Usage

- **Error handling only:** ~1-2MB
- **With metrics:** ~3-5MB
- **With tracing (500 traces):** ~5-20MB
- **With tracing (100 traces):** ~2-5MB

---

## Production Recommendations

### High-Traffic Applications

```javascript
app.use(crashless({
  enableDashboard: false,
  telemetry: { engine: 'none' }
}));
```

**Overhead:** ~2.3%  
**Throughput:** ~15,400 req/s

### Standard Production

```javascript
app.use(crashless({
  enableDashboard: false,
  telemetry: { engine: 'builtin' }
}));
```

**Overhead:** ~20.5%  
**Throughput:** ~13,000 req/s

### Production with Observability

```javascript
app.use(crashless({
  enableDashboard: false,
  telemetry: {
    engine: 'builtin',
    traces: {
      enabled: true,
      samplingRate: 0.2,
      maxStored: 100
    }
  }
}));
```

**Overhead:** ~27.2%  
**Throughput:** ~12,400 req/s

### Development/Staging

```javascript
app.use(crashless({
  enableDashboard: true,
  telemetry: {
    engine: 'builtin',
    traces: {
      enabled: true,
      samplingRate: 1.0,
      maxStored: 1000
    }
  }
}));
```

**Overhead:** ~31.8%  
**Throughput:** ~12,000 req/s

---

## Next Steps

- [Configuration Guide](configuration.md) - Optimize your setup
- [Examples](examples.md) - Performance-focused examples
- [API Reference](api-reference.md) - Complete API docs

