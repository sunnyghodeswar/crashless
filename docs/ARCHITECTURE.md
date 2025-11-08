# Crashless Architecture

## Technical Overview

Crashless is built with a focus on **zero npm dependencies** and **lightweight performance**. This document explains how it works under the hood.

---

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

```javascript
// Calculate percentiles
p50 = sortedValues[Math.floor(count * 0.5)]
p95 = sortedValues[Math.floor(count * 0.95)]
p99 = sortedValues[Math.floor(count * 0.99)]
```

---

## Distributed Tracing Architecture

### Trace Context Propagation

Uses Node.js `AsyncLocalStorage` for context propagation:

```javascript
import { AsyncLocalStorage } from 'async_hooks';

const traceContext = new AsyncLocalStorage();

// Store context
traceContext.run(context, () => {
  // All code here has access to context
  const currentContext = traceContext.getStore();
});
```

**How it works:**
- Creates trace context at request start
- Stores in `AsyncLocalStorage`
- Automatically available in all async operations
- No manual context passing needed

### Auto-Instrumentation

#### HTTP Requests

All Express routes are automatically traced:

```javascript
function requestTracker(req, res, next) {
  const traceContext = startTrace({
    name: `${method} ${path}`,
    attributes: { 'http.method': method, 'http.path': path }
  });
  
  runInTraceContext(traceContext, () => {
    // Request handler runs here
    // All operations have access to trace context
  });
}
```

#### fetch() Patching

Monkey-patches global `fetch()`:

```javascript
const originalFetch = globalThis.fetch;
globalThis.fetch = function (...args) {
  const context = getTraceContext();
  if (!context) return originalFetch(...args);
  
  // Create child span
  const spanId = startSpan({
    name: `fetch ${method} ${url}`,
    kind: 'client'
  });
  
  return originalFetch(...args).then(response => {
    endSpan({ spanId, status: 'ok' });
    return response;
  });
};
```

**Limitations:**
- Only works for global `fetch()`
- Doesn't work with local imports or alternatives
- May not work with all bundlers

#### fs.readFile() Patching

Monkey-patches `fs.readFile()`:

```javascript
const originalReadFile = fs.promises.readFile;
fs.promises.readFile = async function (...args) {
  const context = getTraceContext();
  if (!context) return originalReadFile(...args);
  
  const spanId = startSpan({
    name: `fs.readFile ${path}`,
    kind: 'internal'
  });
  
  try {
    const result = await originalReadFile(...args);
    endSpan({ spanId, status: 'ok' });
    return result;
  } catch (err) {
    endSpan({ spanId, status: 'error', error: err });
    throw err;
  }
};
```

**Limitations:**
- Only patches `fs.readFile()` (not other fs methods)
- May not work with all fs usage patterns

---

## Memory Management

### Trace Storage

```javascript
const traceRegistry = {
  traces: new Map(),           // Active traces
  spans: new Map(),            // All spans
  completedTraces: [],         // Completed traces for export
  maxTraces: 1000,            // Maximum traces to keep
  maxAge: 60 * 60 * 1000      // 1 hour
};
```

### Cleanup Strategy

1. **Age-based cleanup:** Remove traces older than `maxAge`
2. **Count-based cleanup:** Remove oldest traces when limit reached
3. **Automatic:** Cleanup runs periodically (should be implemented)

### Memory Usage Estimate

- **Each trace:** ~5-20KB (depends on spans/attributes)
- **500 traces:** ~2.5-10MB
- **Metrics:** ~1-5MB (rolling windows)
- **Total:** ~5-20MB typical

---

## Performance Characteristics

### Overhead Breakdown

**Error handling only:**
- Minimal overhead (~1-2%)
- Just middleware function calls
- No async operations

**With metrics:**
- Additional overhead (~2-4%)
- Map lookups and updates
- Latency calculations

**With tracing:**
- Higher overhead (~5-10%)
- AsyncLocalStorage operations
- Span creation and storage
- Auto-patching overhead

**Optimization:**
- Use sampling (10-20% sample rate)
- Reduces tracing overhead significantly

### Bottlenecks

1. **AsyncLocalStorage.getStore()** - Called frequently
2. **Span creation** - Object allocation overhead
3. **Metrics aggregation** - Percentile calculations
4. **Memory allocations** - Trace storage

---

## Security Architecture

### Dashboard Security

**Default behavior:**
- Development: Dashboard enabled
- Production: Dashboard disabled (`NODE_ENV=production`)

**Authentication options:**
1. **IP whitelist** - Environment variable `DASHBOARD_ALLOWED_IPS`
2. **Custom auth function** - `dashboardAuth: (req) => boolean`
3. **Express middleware** - Mount dashboard behind auth middleware

### Error Message Masking

**Production mode:**
- Sensitive messages masked
- Stack traces hidden
- Generic error messages shown

**Development mode:**
- Full error messages
- Stack traces visible
- Detailed debugging info

---

## Limitations

### Auto-Instrumentation

**What works:**
- ✅ HTTP requests (Express routes)
- ✅ Global `fetch()` calls
- ✅ `fs.readFile()` calls

**What doesn't:**
- ❌ Database libraries (Prisma, Sequelize, Mongoose)
- ❌ Redis clients
- ❌ Message queues
- ❌ Custom HTTP clients (axios, got)
- ❌ Other fs methods

### Technical Limitations

1. **Monkey-patching is fragile** - Can break with native modules
2. **CDN dependency** - Dashboard requires internet
3. **Memory limits** - Traces stored in memory
4. **Limited OTLP support** - Subset of OpenTelemetry features

---

## Future Improvements

1. **Automatic cleanup scheduler** - Periodic trace/metric cleanup
2. **Better auto-instrumentation** - Support more libraries
3. **Offline dashboard** - Bundle UI resources
4. **More OTLP features** - Full OpenTelemetry compatibility

---

This architecture prioritizes simplicity, zero dependencies, and ease of use over comprehensive feature coverage. It's designed for teams who want observability without the complexity of full APM solutions.

