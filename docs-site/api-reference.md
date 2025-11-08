# API Reference

Complete API documentation for Crashless.

## `crashless(options?)`

Main middleware function. Returns Express middleware.

### Parameters

**`options`** (Object, optional) - Configuration options

See [Configuration Guide](configuration.md) for all available options.

### Returns

Express middleware function.

### Example

```javascript
import crashless from 'crashless';

// Default configuration
app.use(crashless());

// With options
app.use(crashless({
  log: false,
  telemetry: {
    engine: 'builtin',
    traces: { enabled: true }
  }
}));
```

---

## `crashless.createError(message, status?, code?, details?)`

Creates a standardized error object that Crashless will handle properly.

### Parameters

- **`message`** (string, required) - Error message
- **`status`** (number, optional, default: 500) - HTTP status code
- **`code`** (string, optional, default: 'ERR_INTERNAL') - Error code
- **`details`** (any, optional) - Additional error details

### Returns

Error object with `status`, `code`, and `isCrashless` properties.

### Example

```javascript
import crashless, { createError } from 'crashless';

app.get('/users/:id', async (req, res) => {
  const user = await db.getUser(req.params.id);
  
  if (!user) {
    throw createError('User not found', 404, 'USER_NOT_FOUND');
  }
  
  res.json(user);
});
```

**Response:**
```json
{
  "success": false,
  "message": "User not found",
  "code": "USER_NOT_FOUND"
}
```

---

## `crashless.registerExporter(name, fn)`

Registers a global error exporter that will be called for every error.

### Parameters

- **`name`** (string, required) - Exporter name
- **`fn`** (function, required) - Exporter function: `(error, metadata) => void`

### Example

```javascript
import crashless from 'crashless';

// Register Sentry exporter
crashless.registerExporter('sentry', (err, meta) => {
  Sentry.captureException(err, {
    tags: {
      path: meta.path,
      method: meta.method
    }
  });
});

// Register custom logger
crashless.registerExporter('logger', (err, meta) => {
  console.error('Error:', err.message, meta);
});
```

---

## `trace.startSpan(name, options?)`

Starts a manual span within the current trace context.

### Parameters

- **`name`** (string, required) - Span name
- **`options`** (Object, optional):
  - `kind` (string) - Span kind: 'server', 'client', 'internal' (default: 'internal')
  - `attributes` (Object) - Span attributes

### Returns

Span object with methods:
- `end()` - End the span
- `setStatus(status, error?)` - Set span status
- `setAttributes(attributes)` - Add attributes

### Example

```javascript
import { trace } from 'crashless';

app.get('/orders/:id', async (req, res) => {
  const span = trace.startSpan('getOrder', {
    kind: 'server',
    attributes: { 'order.id': req.params.id }
  });
  
  try {
    const order = await db.getOrder(req.params.id);
    span.setAttributes({ 'order.status': order.status });
    span.end();
    res.json(order);
  } catch (err) {
    span.setStatus('error', err);
    throw err;
  }
});
```

---

## `trace.getContext()`

Gets the current trace context.

### Returns

Trace context object or `null` if no active trace.

### Example

```javascript
import { trace } from 'crashless';

app.get('/data', async (req, res) => {
  const context = trace.getContext();
  if (context) {
    console.log('Trace ID:', context.traceId);
  }
  // ...
});
```

---

## Error Response Format

All errors handled by Crashless return a standardized format:

```json
{
  "success": false,
  "message": "Error message",
  "code": "ERROR_CODE"
}
```

### Status Codes

- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error (default)

### Error Codes

- `ERR_400`, `ERR_401`, `ERR_403`, `ERR_404`, `ERR_500` - Default codes
- Custom codes can be set using `createError()`

---

## Dashboard Endpoints

### `GET /_crashless`

Main dashboard interface. Shows real-time metrics, errors, and traces.

### `GET /metrics.json`

Export metrics in JSON format.

### `GET /metrics/prometheus`

Export metrics in Prometheus format.

### `GET /metrics/otel`

Export metrics in OpenTelemetry format.

### `GET /traces.json`

Export traces in JSON format.

---

## Configuration Options

See [Configuration Guide](configuration.md) for complete documentation of all configuration options.

---

## TypeScript Support

Crashless includes TypeScript definitions:

```typescript
import crashless, { createError } from 'crashless';

app.use(crashless({
  log: true,
  telemetry: {
    engine: 'builtin',
    traces: {
      enabled: true,
      samplingRate: 0.2
    }
  }
}));
```

---

## Next Steps

- [Configuration Guide](configuration.md) - All configuration options
- [Examples](examples.md) - Real-world usage patterns
- [Performance Guide](performance.md) - Optimization strategies

