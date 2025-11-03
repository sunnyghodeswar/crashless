# Crashless Examples

This directory contains comprehensive examples demonstrating different Crashless configurations and use cases.

## 📋 Available Examples

### 1. Basic Example (`example-basic.js`)
**Minimal setup** - Error handling only, no telemetry.

```bash
node examples/example-basic.js
```

- Port: `3001`
- App Name: `Basic Example API`
- Features: Basic error handling, no dashboard, no metrics
- Use case: Simple apps that just need error catching

---

### 2. Production Example (`example-production.js`)
**Production-ready** configuration with security features.

```bash
NODE_ENV=production node examples/example-production.js
```

- Port: `3002`
- App Name: `Production API (Secure Mode)`
- Features:
  - Message masking enabled
  - Stack traces hidden
  - Dashboard disabled
  - Production-safe error messages
- Use case: Production deployments

---

### 3. Built-in Engine (`example-builtin-engine.js`)
**Built-in telemetry** with dashboard.

```bash
node examples/example-builtin-engine.js
```

- Port: `3003`
- App Name: `Built-in Engine API`
- Features:
  - Built-in metrics engine
  - Live dashboard at `/_crashless` with app name displayed
  - JSON and Prometheus exports
- Use case: Development and staging environments

---

### 4. Prometheus Engine (`example-prometheus-engine.js`)
**Prometheus export** mode for monitoring integration.

```bash
node examples/example-prometheus-engine.js
```

- Port: `3004`
- App Name: `Prometheus Metrics API`
- Features:
  - Prometheus-compatible `/metrics` endpoint
  - Dashboard included with branded app name
  - Ready for Grafana scraping
- Use case: Integration with Prometheus/Grafana stack

---

### 5. OpenTelemetry Engine (`example-otel-engine.js`)
**OpenTelemetry export** mode.

```bash
node examples/example-otel-engine.js
```

- Port: `3005`
- App Name: `OpenTelemetry API`
- Features:
  - OpenTelemetry format export
  - Dashboard included with app branding
  - Ready for OTel collectors
- Use case: Integration with OpenTelemetry observability platforms

---

### 6. Custom Exporters (`example-exporters.js`)
**Custom telemetry exporters** (Sentry, Datadog, etc.).

```bash
node examples/example-exporters.js
```

- Port: `3006`
- App Name: `Custom Exporters API`
- Features:
  - Multiple custom exporters
  - Sentry simulation
  - Datadog simulation
  - Custom logging
  - Metrics aggregation
  - Dashboard with custom branding
- Use case: Integration with existing monitoring tools

---

### 7. Full-Featured (`example-full-featured.js`)
**Complete example** showcasing all features.

```bash
node examples/example-full-featured.js
```

- Port: `3007`
- App Name: `Full-Featured Demo API`
- Features:
  - All error types
  - Authentication/authorization
  - Validation
  - Multiple routes
  - Custom errors with details
  - Dashboard with branded app name
  - Comprehensive test suite
- Use case: Reference implementation

---

## 🚀 Quick Start

Run all examples simultaneously to test different configurations:

```bash
# Terminal 1
node examples/example-basic.js

# Terminal 2
NODE_ENV=production node examples/example-production.js

# Terminal 3
node examples/example-builtin-engine.js

# Terminal 4
node examples/example-prometheus-engine.js

# Terminal 5
node examples/example-otel-engine.js

# Terminal 6
node examples/example-exporters.js

# Terminal 7
node examples/example-full-featured.js
```

Then visit:
- Basic: `http://localhost:3001`
- Production: `http://localhost:3002`
- Built-in: `http://localhost:3003/_crashless`
- Prometheus: `http://localhost:3004/_crashless`
- OpenTelemetry: `http://localhost:3005/_crashless`
- Exporters: `http://localhost:3006/_crashless`
- Full-Featured: `http://localhost:3007/_crashless`

---

## 📊 Testing Production Mode

To test production message masking:

```bash
NODE_ENV=production node examples/example-production.js
```

Visit:
- `/users/404` - Will show masked error message
- `/sensitive-error` - Will hide sensitive connection strings
- `/safe-error` - Will show custom client-safe message

---

## 🔍 Testing Exporters

The exporters example logs to console. Watch for output like:

```
📡 [SENTRY] Error captured: ...
📊 [DATADOG] Metrics sent: ...
📝 [CUSTOM LOGGER] ...
📈 [METRICS] ...
```

---

## 📈 Testing Prometheus Integration

1. Run `example-prometheus-engine.js`
2. Visit `http://localhost:3004/metrics`
3. You'll see Prometheus-formatted metrics
4. Configure Prometheus to scrape this endpoint

---

## 🎯 What Each Example Demonstrates

| Example | Error Handling | Dashboard | Metrics | Exporters | Production Mode |
|---------|---------------|-----------|---------|-----------|----------------|
| Basic | ✅ | ❌ | ❌ | ❌ | ❌ |
| Production | ✅ | ❌ | ✅ | ❌ | ✅ |
| Built-in | ✅ | ✅ | ✅ | ❌ | ❌ |
| Prometheus | ✅ | ✅ | ✅ | ❌ | ❌ |
| OpenTelemetry | ✅ | ✅ | ✅ | ❌ | ❌ |
| Exporters | ✅ | ✅ | ✅ | ✅ | ❌ |
| Full-Featured | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 💡 Tips

- Each example runs on a different port to avoid conflicts
- All examples include automatic test execution
- Check console output for detailed logging
- Dashboard auto-refreshes every 3 seconds
- Metrics are collected in-memory (reset on restart)
- Each example displays a custom app name on the dashboard (v0.3.0+)
- Light/Dark theme toggle persists in localStorage
- All charts show interactive tooltips on hover

---

## 🆕 New Features (v0.3.0)

### App Name Branding
All examples now demonstrate the `appName` feature. When you open the dashboard, you'll see:

```
[Your App Name]           ← Custom branding
Crashless Dashboard       ← Main title
```

To use in your app:
```javascript
const crashless = require('crashless')({
  appName: 'My Awesome API',  // ← Your branding
  telemetry: {
    engine: 'builtin',
    dashboard: true,
  }
});
```

### Interactive Dashboard Features
- **Hover tooltips** on all 8 charts
- **Light/Dark theme toggle** with localStorage persistence
- **Smart insights** - auto-detects latency spikes, slow routes, frequent errors
- **Advanced filtering** - search by route, status, error type
- **Auto summaries** - "Latency ↑ 20% since last refresh"
- **8 visualization types** - line, area, bar, pie, heatmap charts

### All Examples Updated
Every example now includes:
- Custom `appName` parameter
- Latest dashboard v2 features
- Enhanced console logging
- Auto-refresh every 3 seconds

