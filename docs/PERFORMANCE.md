# Performance Guide

## Performance Overhead

### Realistic Benchmarks

**Configuration scenarios:**

| Configuration | Overhead | Use Case |
|--------------|----------|----------|
| Error handling only | ~1-2% | Minimal setup |
| Error + metrics | ~2-4% | Standard setup |
| Error + metrics + tracing (100% sample) | ~5-10% | Full observability |
| Error + metrics + tracing (20% sample) | ~2-5% | Production recommended |
| Error + metrics + tracing (10% sample) | ~1-3% | High-traffic production |

**Methodology:**
- Benchmarked on Node.js v20
- Express.js v4.21
- Average of 1000 requests
- Overhead measured vs. baseline Express app

---

## Optimization Strategies

### 1. Use Sampling for Tracing

**Recommended production configuration:**

```javascript
app.use(crashless({
  telemetry: {
    traces: {
      enabled: true,
      samplingRate: 0.1,  // Sample 10% of requests
      maxStored: 200       // Reduce stored traces
    }
  }
}));
```

**Impact:**
- Reduces overhead from ~5-10% to ~1-3%
- Still provides good observability
- 10% sample rate is sufficient for most use cases

### 2. Disable Dashboard in Production

```javascript
app.use(crashless({
  enableDashboard: false, // Disabled in production
  // Use metrics export endpoints instead
}));
```

**Impact:**
- Eliminates dashboard route overhead
- Reduces memory usage
- Metrics export endpoints are lightweight

### 3. Minimal Configuration

```javascript
app.use(crashless({
  telemetry: {
    engine: 'none',  // Disable all telemetry
    dashboard: false
  }
}));
```

**Impact:**
- Minimal overhead (~1-2%)
- Only error handling active
- Still prevents crashes

### 4. Reduce Memory Usage

```javascript
app.use(crashless({
  telemetry: {
    traces: {
      enabled: true,
      maxStored: 100,      // Reduce from default 500
      samplingRate: 0.05   // Sample only 5%
    }
  }
}));
```

**Impact:**
- Lower memory usage
- Still provides tracing insights
- Suitable for constrained environments

---

## Performance Bottlenecks

### 1. AsyncLocalStorage Operations

**Impact:** Medium
**Mitigation:** Use sampling to reduce trace context operations

### 2. Span Creation

**Impact:** Medium
**Mitigation:** Sample fewer requests, reduce span attributes

### 3. Metrics Aggregation

**Impact:** Low
**Mitigation:** Use rolling windows, reduce bucket count

### 4. Memory Allocations

**Impact:** Low
**Mitigation:** Reduce `maxStored`, use shorter `maxAge`

---

## Memory Usage

### Typical Usage

- **Error handling only:** ~1-2MB
- **With metrics:** ~3-5MB
- **With tracing (500 traces):** ~5-20MB
- **With tracing (100 traces):** ~2-5MB

### Memory Breakdown

**Per trace:** ~5-20KB
- Depends on number of spans
- Depends on attributes stored
- Depends on error details

**Metrics:** ~1-5MB
- Rolling time windows
- Route-specific histograms
- Error storage

---

## Production Recommendations

### High-Traffic Applications

```javascript
app.use(crashless({
  enableDashboard: false,
  telemetry: {
    engine: 'prometheus', // Use Prometheus for external monitoring
    traces: {
      enabled: true,
      samplingRate: 0.05, // Sample 5% of requests
      maxStored: 100       // Keep only 100 traces
    }
  }
}));
```

### Low-Traffic Applications

```javascript
app.use(crashless({
  enableDashboard: true,
  telemetry: {
    traces: {
      enabled: true,
      samplingRate: 0.2,   // Sample 20% of requests
      maxStored: 500       // Keep 500 traces
    }
  }
}));
```

### Development/Staging

```javascript
app.use(crashless({
  enableDashboard: true,
  telemetry: {
    traces: {
      enabled: true,
      samplingRate: 1.0,    // Sample all requests
      maxStored: 1000      // Keep more traces for debugging
    }
  }
}));
```

---

## Monitoring Performance

### Check Memory Usage

```javascript
const metrics = getMetrics();
console.log('Memory usage:', process.memoryUsage());
console.log('Traces stored:', getTracingStats().totalTraces);
```

### Check Overhead

Use performance monitoring tools:
- Node.js `perf_hooks`
- External APM tools
- Application metrics

---

## When Performance Matters

**Consider alternatives if:**
- You need <1% overhead (use minimal configuration)
- You have very high traffic (>1000 req/s)
- You need full OpenTelemetry compatibility
- You need database auto-instrumentation

**Crashless is ideal if:**
- You want simplicity and ease of use
- You can accept 2-5% overhead with sampling
- You want built-in dashboard
- You want zero npm dependencies

---

This performance guide provides realistic expectations and optimization strategies. Use sampling and appropriate configuration for your use case.

