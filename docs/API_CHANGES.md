# API Changes Analysis

## Summary: ✅ No Breaking Changes to Public API

The core Crashless API remains **100% backward compatible**. All existing usage patterns continue to work exactly as before.

## Internal Change (Not Breaking)

### Error Handler Detection Logic

**Changed:** Internal error handler detection method in `crashlessWrapper` function

**Before:**
```javascript
function crashlessWrapper(err, req, res, next) {
  // 4-arg signature = error handler
  if (err instanceof Error || (err && err.message)) {
    return crashlessErrorHandler(err, req, res, next);
  }
  // ... rest
}
```

**After:**
```javascript
function crashlessWrapper(err, req, res, next) {
  // 4-arg signature = error handler (next is function)
  if (typeof next === 'function') {
    return crashlessErrorHandler(err, req, res, next);
  }
  // ... rest
}
```

**Impact:**
- ✅ **No breaking changes** - This is an internal implementation detail
- ✅ **More reliable** - Uses Express standard pattern for detecting error handlers
- ✅ **Better compatibility** - Now correctly handles string errors, null errors, etc.

**Why this change?**
- The previous logic (`err instanceof Error`) could fail for non-Error values (strings, null, etc.)
- Express standard: 4-arg function = error handler (detected by `typeof next === 'function'`)
- This fix ensures all error types are properly handled

## Public API (Unchanged)

### ✅ Main Usage - No Changes
```javascript
// Still works exactly the same
import crashless from 'crashless';

const app = express();
app.use(crashless()); // ✅ Works as before
```

### ✅ Configuration - No Changes
```javascript
// All configuration options remain the same
app.use(crashless({
  appName: 'My App',
  log: true,
  maskMessages: false,
  defaultStatus: 500,
  telemetry: {
    engine: 'builtin',
    dashboard: true,
    traces: {
      enabled: true,
      samplingRate: 0.5,
      maxStored: 500
    }
  }
})); // ✅ Works as before
```

### ✅ Error Creation - No Changes
```javascript
// createError API unchanged
throw crashless.createError('Error message', 404, 'NOT_FOUND'); // ✅ Works as before
```

### ✅ Exporters - No Changes
```javascript
// registerExporter API unchanged
crashless.registerExporter('sentry', (err, meta) => {
  // ... handle error
}); // ✅ Works as before
```

### ✅ Mounting Pattern - No Changes
```javascript
// Express error handler pattern (mount LAST)
app.get('/route', ...);
app.use(crashless()); // ✅ Still must be last (Express requirement, not Crashless)
```

## New Features (Additive, Not Breaking)

### ✅ Tracing Configuration (New, Optional)
```javascript
// NEW: Tracing configuration (optional)
app.use(crashless({
  telemetry: {
    traces: {
      enabled: true,      // NEW
      samplingRate: 0.2,  // NEW
      maxStored: 500      // NEW
    }
  }
}));
```

**Impact:** ✅ Optional feature - existing code without tracing config works unchanged

### ✅ Manual Tracing API (New, Optional)
```javascript
// NEW: Manual span creation (optional)
import { trace } from 'crashless';

const span = trace.startSpan('custom-operation');
// ... do work
span.end();
```

**Impact:** ✅ Optional feature - existing code without manual tracing works unchanged

## Migration Guide

### ✅ No Migration Required

**All existing code continues to work without changes:**

```javascript
// ✅ v0.2.0 code
app.use(crashless());

// ✅ Still works in v0.3.0
app.use(crashless());
```

```javascript
// ✅ v0.2.0 code
throw crashless.createError('Error', 500);

// ✅ Still works in v0.3.0
throw crashless.createError('Error', 500);
```

```javascript
// ✅ v0.2.0 code
crashless.registerExporter('my-exporter', (err, meta) => {});

// ✅ Still works in v0.3.0
crashless.registerExporter('my-exporter', (err, meta) => {});
```

## What Changed Internally

### 1. Error Handler Detection (Internal)
- **Before:** Checked if `err instanceof Error`
- **After:** Checks if `typeof next === 'function'` (Express standard)
- **Impact:** More reliable, handles edge cases better
- **Breaking:** ❌ No

### 2. Internal Endpoint Filtering (Internal)
- **New:** Automatically filters `/metrics.json`, `/traces.json`, `/_crashless/*` from metrics
- **Impact:** Cleaner metrics, no self-introspection noise
- **Breaking:** ❌ No (improves behavior)

### 3. Tracing System (New Feature)
- **New:** Automatic distributed tracing with `telemetry.traces` config
- **Impact:** Optional feature - opt-in only
- **Breaking:** ❌ No

## Backward Compatibility Matrix

| Feature | v0.2.0 | v0.3.0 | Status |
|---------|--------|--------|--------|
| `app.use(crashless())` | ✅ | ✅ | ✅ Compatible |
| `crashless.createError()` | ✅ | ✅ | ✅ Compatible |
| `crashless.registerExporter()` | ✅ | ✅ | ✅ Compatible |
| Configuration options | ✅ | ✅ | ✅ Compatible |
| Error response format | ✅ | ✅ | ✅ Compatible |
| Dashboard mounting | ✅ | ✅ | ✅ Compatible |
| Metrics export | ✅ | ✅ | ✅ Compatible |
| Tracing (new) | ❌ | ✅ | ✅ New feature |

## Conclusion

✅ **Zero Breaking Changes**  
✅ **100% Backward Compatible**  
✅ **All existing code works unchanged**  
✅ **Internal improvements only**  
✅ **New optional features available**

The API change (error handler detection) is an **internal improvement** that makes the library more robust and follows Express conventions. It does not affect how users write their code.

**Recommendation:** Safe to upgrade from v0.2.0 to v0.3.0 without code changes.

