# Examples

Real-world examples and patterns for using Crashless. **[▶️ Try these live on StackBlitz](https://stackblitz.com/github/sunnyghodeswar/crashless-examples)**

---

## 🚀 Quick Start Examples

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
// Dashboard: http://localhost:3000/_crashless
```

**[▶️ Try this example](https://stackblitz.com/github/sunnyghodeswar/crashless-examples?file=examples%2Fexample-one-liner.js)**

---

## 🔍 OpenTelemetry Integration

Full OpenTelemetry compatibility for metrics and traces.

### Basic OTel Setup

```javascript
import express from 'express';
import crashless from 'crashless';

const app = express();

app.use(crashless({
  telemetry: {
    engine: 'otel', // OpenTelemetry format
    traces: {
      enabled: true,
      samplingRate: 0.2 // Sample 20% of requests
    }
  }
}));

app.listen(3000);
```

**Endpoints:**
- `GET /metrics/otel` - OpenTelemetry metrics
- `GET /traces.json?format=otlp` - OTLP trace export

**[▶️ Try OTel example](https://stackblitz.com/github/sunnyghodeswar/crashless-examples?file=examples%2Fexample-otel-engine.js)**

### Exporting to OTel Collector

```javascript
app.use(crashless({
  telemetry: {
    engine: 'otel',
    traces: { enabled: true }
  }
}));

// Export traces to OTel collector
app.get('/export-traces', async (req, res) => {
  const traces = await fetch('http://localhost:4318/v1/traces', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      resourceSpans: [/* traces from /traces.json?format=otlp */]
    })
  });
  res.json({ exported: true });
});
```

---

## 📊 Prometheus Integration

Prometheus-compatible metrics export for Grafana integration.

### Basic Prometheus Setup

```javascript
import express from 'express';
import crashless from 'crashless';

const app = express();

app.use(crashless({
  telemetry: {
    engine: 'prometheus' // Prometheus format
  }
}));

app.listen(3000);
```

**Endpoint:** `GET /metrics` - Prometheus format

**[▶️ Try Prometheus example](https://stackblitz.com/github/sunnyghodeswar/crashless-examples?file=examples%2Fexample-prometheus-engine.js)**

### Grafana Scraping Configuration

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'crashless'
    scrape_interval: 15s
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/metrics'
```

---

## 🔌 Custom Exporters

Integrate with Sentry, Datadog, or any monitoring service.

### Sentry Integration

```javascript
import express from 'express';
import crashless from 'crashless';
import * as Sentry from '@sentry/node';

// Register exporter BEFORE creating middleware
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

const app = express();
app.use(crashless());
```

**[▶️ Try exporters example](https://stackblitz.com/github/sunnyghodeswar/crashless-examples?file=examples%2Fexample-exporters.js)**

### Datadog Integration

```javascript
import crashless from 'crashless';
import { StatsD } from 'hot-shots';

const statsd = new StatsD();

crashless.registerExporter('datadog', (err, meta) => {
  statsd.increment('errors.total', 1, {
    tags: [
      `path:${meta.path}`,
      `method:${meta.method}`,
      `status:${meta.status}`
    ]
  });
  
  statsd.event('Error occurred', err.message, {
    alert_type: 'error',
    tags: [`code:${err.code}`]
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
  logger.error('Error occurred', {
    message: err.message,
    stack: err.stack,
    path: meta.path,
    method: meta.method,
    timestamp: meta.timestamp
  });
});

crashless.registerExporter('metrics', (err, meta) => {
  metrics.increment('errors', { path: meta.path });
});

app.use(crashless());
```

---

## 🔍 Distributed Tracing

Automatic and manual tracing capabilities.

### Automatic Tracing

```javascript
app.use(crashless({
  telemetry: {
    traces: {
      enabled: true,
      samplingRate: 0.2 // Sample 20% of requests
    }
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

## 🛡️ Error Handling Examples

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

## ⚙️ Configuration Examples

### Minimal (Error Handling Only)

```javascript
app.use(crashless({
  telemetry: { engine: 'none' }
}));
```

**Overhead:** ~3% | **Use case:** High-traffic apps needing only error handling

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

**Overhead:** ~20% | **Use case:** Standard production with metrics

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

**[▶️ Try production dashboard example](https://stackblitz.com/github/sunnyghodeswar/crashless-examples?file=examples%2Fexample-production-dashboard.js)**

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

## 🔐 Production Security Patterns

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

## 📈 Metrics Export

### Prometheus Integration

```javascript
app.use(crashless({
  telemetry: { engine: 'prometheus' }
}));

// Metrics available at /metrics
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

## 🎮 Try All Examples

**[▶️ Full Featured Demo](https://stackblitz.com/github/sunnyghodeswar/crashless-examples?file=examples%2Fexample-full-featured.js)** - All features enabled

**[▶️ Browse All Examples](https://github.com/sunnyghodeswar/crashless-examples)**

---

## Next Steps

- [API Reference](api-reference) - Complete API documentation
- [Configuration Guide](configuration) - All configuration options
- [Performance Guide](performance) - Optimization strategies
- [Security Guide](security) - Security best practices
