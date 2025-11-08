# Architecture

Technical overview of how Crashless works internally.

## Zero Dependencies Explained

### What "Zero Dependencies" Means

- ✅ **No npm packages** - Uses only Node.js built-in modules
- ✅ **CDN resources for dashboard** - UI libraries loaded from CDN
- ✅ **Pure JavaScript** - All logic implemented in vanilla JS

### Dashboard UI Resources

The dashboard uses CDN-hosted libraries:

- **Tailwind CSS** - Utility-first CSS framework (via CDN)
- **Alpine.js** - Minimal JavaScript framework (via CDN)
- **ECharts** - Charting library (via CDN)

**Why CDN?**
- No npm dependencies to install
- Smaller package size
- Faster installation
- No dependency conflicts

**Trade-off:**
- Requires internet connection for dashboard to work
- CDN resources loaded on each dashboard visit

---

## Error Handling Architecture

### Automatic Error Catching

Crashless uses Express's error handling middleware pattern:

```javascript
// 4-argument function = error handler
function crashlessWrapper(err, req, res, next) {
  if (typeof next === 'function') {
    // Error handler
    return crashlessErrorHandler(err, req, res, next);
  }
  // 3-argument function = request tracker
  return requestTracker(err, req, res);
}
```

### Async Error Handling

Async errors are caught via Express Layer patching:

```javascript
// Patches Express Router Layer to catch async errors
Layer.prototype.handle_request = function (req, res, next) {
  const result = fn(req, res, next);
  if (result && typeof result.then === 'function') {
    return result.catch(next); // Auto-catch promises
  }
  return result;
};
```

**How it works:**
- Patches Express's internal `Layer` class
- Wraps route handlers to catch promise rejections
- Automatically calls `next(err)` when promise rejects

---

## Metrics Collection Architecture

### In-Memory Storage

Metrics are stored in memory using Maps:

```javascript
const registry = {
  requests: new Map(),    // Route -> { total, statusCounts, firstSeen, lastSeen }
  errors: new Map(),      // ErrorCode -> { count, firstSeen, lastSeen, sample }
  latencies: new Map(),   // Route -> { buckets: [], current: { p50, p95, p99 } }
  recentErrors: []        // Array of recent errors
};
```

### Rolling Time Windows

- **Window duration:** 1 hour (configurable)
- **Bucket duration:** 1 minute (60 buckets max)
- **Automatic eviction:** Old buckets removed when window expires

### Latency Percentiles

Calculated using sorted arrays within time buckets:
- **p50** - Median latency
- **p95** - 95th percentile
- **p99** - 99th percentile

---

## Distributed Tracing Architecture

### Trace Context Propagation

Uses `AsyncLocalStorage` for context propagation:

```javascript
const traceContext = new AsyncLocalStorage();

// Store context
traceContext.run(context, () => {
  // All code here has access to context
});

// Retrieve context
const context = traceContext.getStore();
```

### Span Management

Spans are stored in memory:

```javascript
const traceRegistry = {
  traces: new Map(),  // traceId -> Trace
  spans: new Map()    // spanId -> Span
};
```

### Sampling

Sampling decision made before trace creation:

```javascript
function shouldSampleTrace() {
  if (samplingRate <= 1) {
    return Math.random() < samplingRate; // Percentage-based
  }
  return Math.random() * samplingRate < 1; // Count-based
}
```

---

## Auto-Patching

### fetch() Patching

```javascript
const originalFetch = global.fetch;
global.fetch = function(...args) {
  const span = startSpan('fetch', { kind: 'client' });
  return originalFetch(...args)
    .then(response => {
      span.setAttributes({ 'http.status': response.status });
      span.end();
      return response;
    })
    .catch(err => {
      span.setStatus('error', err);
      throw err;
    });
};
```

### fs.readFile() Patching

```javascript
const originalReadFile = fs.readFile;
fs.readFile = function(...args) {
  const span = startSpan('fs.readFile', { kind: 'internal' });
  return originalReadFile(...args)
    .then(data => {
      span.end();
      return data;
    })
    .catch(err => {
      span.setStatus('error', err);
      throw err;
    });
};
```

---

## Performance Optimizations

### Efficient Data Structures

- **Maps** for O(1) lookups
- **Rolling windows** to limit memory
- **Lazy span creation** (only when sampled)
- **Debounced cleanup** to avoid overhead

### Memory Management

- Automatic cleanup of old traces
- Configurable `maxStored` limits
- Time-based eviction
- Efficient bucket management

---

## Next Steps

- [Performance Guide](performance.md) - Performance optimizations
- [Limitations](limitations.md) - Known limitations

