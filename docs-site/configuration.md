# Configuration Guide

Complete guide to configuring Crashless for your needs.

## Basic Configuration

```javascript
app.use(crashless({
  // Configuration options
}));
```

---

## Configuration Options

### Error Handling

#### `log` (boolean, default: `true`)

Enable console error logging.

```javascript
app.use(crashless({
  log: true // Log errors to console
}));
```

#### `maskMessages` (boolean, default: `false`, auto: `true` in production)

Hide sensitive error messages in production.

```javascript
app.use(crashless({
  maskMessages: true // Hide error details in production
}));
```

**Production mode:** Automatically `true` when `NODE_ENV=production`

#### `appName` (string, default: `'Crashless API'`)

Application name displayed in dashboard.

```javascript
app.use(crashless({
  appName: 'My Awesome API'
}));
```

---

### Dashboard

#### `enableDashboard` (boolean, default: `true`, auto: `false` in production)

Enable the observability dashboard.

```javascript
app.use(crashless({
  enableDashboard: true // Enable dashboard
}));
```

**Production mode:** Automatically `false` when `NODE_ENV=production`

#### `dashboardPath` (string, default: `'/_crashless'`)

Dashboard URL path.

```javascript
app.use(crashless({
  dashboardPath: '/admin/metrics' // Custom path
}));
```

#### `dashboardAuth` (function, default: `null`)

Authentication function for dashboard access.

```javascript
app.use(crashless({
  dashboardAuth: (req) => {
    const ip = req.ip || req.connection?.remoteAddress;
    const token = req.headers['x-dashboard-token'];
    
    // IP whitelist
    if (ip === '127.0.0.1' || ip === '::1') return true;
    
    // Token authentication
    if (token === process.env.DASHBOARD_SECRET) return true;
    
    return false;
  }
}));
```

**Environment Variables:**
- `DASHBOARD_ALLOWED_IPS` - Comma-separated IP whitelist
- `DASHBOARD_SECRET` - Authentication token

---

### Telemetry

#### `telemetry.engine` (string, default: `'builtin'`)

Telemetry engine type.

**Options:**
- `'none'` - Disable telemetry (error handling only)
- `'builtin'` - Built-in metrics collection
- `'prometheus'` - Prometheus-compatible export
- `'otel'` - OpenTelemetry-compatible export

```javascript
app.use(crashless({
  telemetry: {
    engine: 'builtin' // Use built-in metrics
  }
}));
```

#### `telemetry.traces.enabled` (boolean, default: `false`)

Enable distributed tracing.

```javascript
app.use(crashless({
  telemetry: {
    traces: {
      enabled: true
    }
  }
}));
```

#### `telemetry.traces.samplingRate` (number, default: `1.0`)

Trace sampling rate.

- `0.1` = Sample 10% of requests
- `0.2` = Sample 20% of requests
- `1.0` = Sample 100% of requests

```javascript
app.use(crashless({
  telemetry: {
    traces: {
      enabled: true,
      samplingRate: 0.2 // Sample 20% of requests
    }
  }
}));
```

#### `telemetry.traces.maxStored` (number, default: `500`)

Maximum number of traces to keep in memory.

```javascript
app.use(crashless({
  telemetry: {
    traces: {
      enabled: true,
      maxStored: 100 // Keep only 100 traces
    }
  }
}));
```

---

## Configuration Examples

### Minimal (Error Handling Only)

```javascript
app.use(crashless({
  telemetry: { engine: 'none' }
}));
```

**Use case:** High-traffic applications needing only error handling  
**Overhead:** ~3% vs plain Express

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

**Use case:** Standard production setup  
**Overhead:** ~20% vs plain Express

### Production with Observability

```javascript
app.use(crashless({
  log: true,
  maskMessages: true,
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
      samplingRate: 0.2,
      maxStored: 100
    }
  }
}));
```

**Use case:** Production with observability  
**Overhead:** ~27% vs plain Express

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
      samplingRate: 1.0, // Sample all requests
      maxStored: 1000
    }
  }
}));
```

**Use case:** Development and staging  
**Overhead:** ~32% vs plain Express

---

## Complete Configuration Reference

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `log` | boolean | `true` | Console error logging |
| `maskMessages` | boolean | `false` (auto: `true` in prod) | Hide sensitive data |
| `appName` | string | `'Crashless API'` | Dashboard app name |
| `enableDashboard` | boolean | `true` (auto: `false` in prod) | Enable dashboard |
| `dashboardPath` | string | `'/_crashless'` | Dashboard URL path |
| `dashboardAuth` | function | `null` | Auth: `(req) => boolean` |
| `telemetry.engine` | string | `'builtin'` | Engine type |
| `telemetry.traces.enabled` | boolean | `false` | Enable tracing |
| `telemetry.traces.samplingRate` | number | `1.0` | Sample rate (0-1) |
| `telemetry.traces.maxStored` | number | `500` | Max traces stored |

---

## Environment Variables

Crashless respects these environment variables:

- `NODE_ENV` - When set to `'production'`, dashboard is disabled and messages are masked by default
- `DASHBOARD_ALLOWED_IPS` - Comma-separated IP whitelist for dashboard
- `DASHBOARD_SECRET` - Authentication token for dashboard

---

## Next Steps

- [API Reference](api-reference.md) - Complete API documentation
- [Examples](examples.md) - Configuration examples
- [Performance Guide](performance.md) - Optimization strategies

