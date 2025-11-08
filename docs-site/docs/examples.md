# Examples

Real-world examples and patterns for using Crashless.

## Basic Setup

### One-Liner Setup

```javascript
import express from 'express';
import crashless from 'crashless';

const app = express();
app.use(crashless()); // That's it!

app.get('/users/:id', async (req, res) => {
  const user = await db.getUser(req.params.id);
  res.json(user);
});

app.listen(3000);
```

---

## Error Handling Examples

### Using createError

```javascript
import crashless, { createError } from 'crashless';

app.use(crashless());

app.get('/users/:id', async (req, res) => {
  const user = await db.getUser(req.params.id);
  
  if (!user) {
    throw createError('User not found', 404, 'USER_NOT_FOUND');
  }
  
  res.json(user);
});
```

### Custom Error Codes

```javascript
app.post('/users', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    throw createError('Email and password required', 400, 'VALIDATION_ERROR');
  }
  
  if (await db.userExists(email)) {
    throw createError('User already exists', 409, 'USER_EXISTS');
  }
  
  const user = await db.createUser({ email, password });
  res.json(user);
});
```

---

## Configuration Examples

### Minimal (Error Handling Only)

```javascript
app.use(crashless({
  telemetry: { engine: 'none' }
}));
```

### Standard Production

```javascript
app.use(crashless({
  log: true,
  maskMessages: true,
  enableDashboard: false,
  telemetry: {
    engine: 'builtin'
  }
}));
```

### Production with Dashboard

```javascript
app.use(crashless({
  enableDashboard: true,
  dashboardAuth: (req) => {
    const ip = req.ip;
    const token = req.headers['x-dashboard-token'];
    return ip === '127.0.0.1' || token === process.env.DASHBOARD_SECRET;
  },
  telemetry: {
    engine: 'builtin',
    traces: {
      enabled: true,
      samplingRate: 0.2
    }
  }
}));
```

### Development/Staging

```javascript
app.use(crashless({
  log: true,
  maskMessages: false,
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

---

## Tracing Examples

### Automatic Tracing

```javascript
app.use(crashless({
  telemetry: {
    traces: { enabled: true, samplingRate: 0.2 }
  }
}));

// HTTP requests are automatically traced
app.get('/api/users', async (req, res) => {
  const users = await db.getUsers(); // Automatically traced
  res.json(users);
});
```

### Manual Span Creation

```javascript
import { trace } from 'crashless';

app.get('/orders/:id', async (req, res) => {
  const span = trace.startSpan('getOrder', {
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

### Database Operation Tracing

```javascript
import { trace } from 'crashless';

async function findUser(id) {
  const span = trace.startSpan('db.findUser', {
    kind: 'client',
    attributes: { 'db.operation': 'find', 'db.collection': 'users' }
  });
  
  try {
    const user = await db.users.findOne({ id });
    span.setAttributes({ 'db.result': user ? 'found' : 'not_found' });
    span.end();
    return user;
  } catch (err) {
    span.setStatus('error', err);
    throw err;
  }
}
```

---

## Error Exporters

### Sentry Integration

```javascript
import crashless from 'crashless';
import * as Sentry from '@sentry/node';

crashless.registerExporter('sentry', (err, meta) => {
  Sentry.captureException(err, {
    tags: {
      path: meta.path,
      method: meta.method,
      status: meta.status
    },
    extra: meta
  });
});

app.use(crashless());
```

### Custom Logger

```javascript
import crashless from 'crashless';

crashless.registerExporter('logger', (err, meta) => {
  logger.error('Error occurred', {
    message: err.message,
    stack: err.stack,
    path: meta.path,
    method: meta.method,
    timestamp: meta.timestamp
  });
});

app.use(crashless());
```

### Multiple Exporters

```javascript
import crashless from 'crashless';

// Register multiple exporters
crashless.registerExporter('sentry', (err, meta) => {
  Sentry.captureException(err);
});

crashless.registerExporter('logger', (err, meta) => {
  logger.error(err);
});

crashless.registerExporter('metrics', (err, meta) => {
  metrics.increment('errors', { path: meta.path });
});

app.use(crashless());
```

---

## Production Patterns

### IP Whitelist Dashboard

```javascript
app.use(crashless({
  enableDashboard: true,
  dashboardAuth: (req) => {
    const ip = req.ip || req.connection?.remoteAddress;
    const allowedIPs = process.env.DASHBOARD_ALLOWED_IPS?.split(',') || [];
    return allowedIPs.includes(ip);
  }
}));
```

### Token-Based Dashboard Auth

```javascript
app.use(crashless({
  enableDashboard: true,
  dashboardAuth: (req) => {
    const token = req.headers['x-dashboard-token'];
    return token === process.env.DASHBOARD_SECRET;
  }
}));
```

### Combined Authentication

```javascript
app.use(crashless({
  enableDashboard: true,
  dashboardAuth: (req) => {
    const ip = req.ip;
    const token = req.headers['x-dashboard-token'];
    
    // Allow localhost
    if (ip === '127.0.0.1' || ip === '::1') return true;
    
    // Check token
    if (token === process.env.DASHBOARD_SECRET) return true;
    
    // Deny by default
    return false;
  }
}));
```

---

## Metrics Export

### Prometheus Integration

```javascript
app.use(crashless({
  telemetry: { engine: 'prometheus' }
}));

// Metrics available at /metrics/prometheus
```

### OpenTelemetry Integration

```javascript
app.use(crashless({
  telemetry: { engine: 'otel' }
}));

// Metrics available at /metrics/otel
```

### Custom Metrics Endpoint

```javascript
app.get('/custom-metrics', (req, res) => {
  const metrics = getMetrics(); // Get Crashless metrics
  // Combine with your own metrics
  res.json({
    crashless: metrics,
    custom: getCustomMetrics()
  });
});
```

---

## Next Steps

- [API Reference](/docs/api-reference) - Complete API documentation
- [Configuration Guide](/docs/configuration) - All configuration options
- [Performance Guide](/docs/performance) - Optimization strategies

