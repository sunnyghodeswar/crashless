# Crashless Documentation

Welcome to Crashless—production-ready observability for Node.js with zero npm dependencies.

## 🚀 Quick Start

```bash
npm install crashless
```

```javascript
import express from 'express';
import crashless from 'crashless';

const app = express();
app.use(crashless()); // That's it!

app.listen(3000);
// Dashboard: http://localhost:3000/_crashless
```

**[▶️ Try Interactive Examples](https://stackblitz.com/github/sunnyghodeswar/crashless-examples)**

---

## ✨ Key Features

### 🛡️ Automatic Error Handling
Catch all errors automatically—no try-catch needed. Prevents server crashes from unhandled errors.

```javascript
app.use(crashless());

// Async errors - automatically caught
app.get('/data', async (req, res) => {
  const data = await fetchData(); // 🛡️ Safe
  res.json(data);
});
```

### 📊 Built-in Dashboard
Real-time observability dashboard with three powerful views:
- **System Dashboard** - Request metrics, throughput, latency, route performance
- **Errors Dashboard** - Error frequency, top failing routes, live error stream
- **Traces Dashboard** - Request traces with waterfall visualization

**Access:** `http://localhost:3000/_crashless`

### 🔍 Distributed Tracing
Automatic tracing for HTTP requests, `fetch()` calls, and `fs.readFile()` operations.

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

**Export traces:** `GET /traces.json?format=otlp` - OpenTelemetry OTLP format

### 📈 OpenTelemetry Support
Full OpenTelemetry compatibility for metrics and traces.

```javascript
app.use(crashless({
  telemetry: {
    engine: 'otel' // OpenTelemetry format
  }
}));
```

**Endpoints:**
- `GET /metrics/otel` - OpenTelemetry metrics
- `GET /traces.json?format=otlp` - OTLP trace export

### 📊 Prometheus Metrics
Prometheus-compatible metrics export for Grafana integration.

```javascript
app.use(crashless({
  telemetry: {
    engine: 'prometheus'
  }
}));
```

**Endpoint:** `GET /metrics` - Prometheus format

### 🔌 Custom Exporters
Integrate with Sentry, Datadog, or any monitoring service.

```javascript
app.use(crashless({
  exporters: [
    {
      name: 'sentry',
      onError: (error, metadata) => {
        Sentry.captureException(error, { extra: metadata });
      }
    }
  ]
}));
```

### ⚡ Zero Dependencies
Uses only Node.js built-ins. No external npm dependencies.

### 🔐 Production-Safe
- Sensitive data masked automatically
- IP whitelist & token authentication
- Dashboard disabled in production by default
- Configurable overhead (2-30%)

---

## 🎮 Try It Live

**Interactive Examples:**

- **[🚀 One-Liner Setup](https://stackblitz.com/github/sunnyghodeswar/crashless-examples?file=examples%2Fexample-one-liner.js)** - Simplest possible setup
- **[📊 Full Featured Demo](https://stackblitz.com/github/sunnyghodeswar/crashless-examples?file=examples%2Fexample-full-featured.js)** - All features enabled
- **[🔍 OpenTelemetry Integration](https://stackblitz.com/github/sunnyghodeswar/crashless-examples?file=examples%2Fexample-otel-engine.js)** - OTel metrics & traces
- **[📈 Prometheus Export](https://stackblitz.com/github/sunnyghodeswar/crashless-examples?file=examples%2Fexample-prometheus-engine.js)** - Prometheus-compatible metrics
- **[🔌 Custom Exporters](https://stackblitz.com/github/sunnyghodeswar/crashless-examples?file=examples%2Fexample-exporters.js)** - Sentry, Datadog, custom integrations
- **[🛡️ Production Dashboard](https://stackblitz.com/github/sunnyghodeswar/crashless-examples?file=examples%2Fexample-production-dashboard.js)** - Secure production setup

---

## 📚 Documentation

### Getting Started
- [Installation & Setup](getting-started) - Step-by-step guide
- [Configuration](configuration) - All configuration options
- [API Reference](api-reference) - Complete API documentation

### Features & Integrations
- [OpenTelemetry Integration](examples#opentelemetry-integration) - OTel setup guide
- [Prometheus Export](examples#prometheus-integration) - Prometheus setup
- [Custom Exporters](examples#custom-exporters) - Sentry, Datadog, etc.
- [Distributed Tracing](examples#distributed-tracing) - Trace configuration

### Advanced Topics
- [Performance](performance) - Benchmarks and optimization
- [Security](security) - Security best practices
- [Architecture](architecture) - How Crashless works internally
- [Limitations](limitations) - Trade-offs and limitations

---

## 🎯 Common Use Cases

### Minimal Setup (Error Handling Only)
```javascript
app.use(crashless({
  telemetry: { engine: 'none' }
}));
```
**Overhead:** ~3% | **Use case:** High-traffic apps needing only error handling

### Standard Production
```javascript
app.use(crashless({
  telemetry: { engine: 'builtin' }
}));
```
**Overhead:** ~20% | **Use case:** Standard production with metrics

### Production + Observability
```javascript
app.use(crashless({
  telemetry: {
    engine: 'builtin',
    traces: { enabled: true, samplingRate: 0.2 }
  }
}));
```
**Overhead:** ~27% | **Use case:** Full observability with distributed tracing

### OpenTelemetry Integration
```javascript
app.use(crashless({
  telemetry: {
    engine: 'otel',
    traces: { enabled: true }
  }
}));
```
**Use case:** Integration with OTel collectors (Jaeger, Tempo, etc.)

### Prometheus + Grafana
```javascript
app.use(crashless({
  telemetry: {
    engine: 'prometheus'
  }
}));
```
**Use case:** Prometheus scraping for Grafana dashboards

---

## 📊 Performance

Crashless is designed for performance:

- **Minimal config:** ~3% overhead vs plain Express
- **With metrics:** ~20% overhead
- **Full observability:** ~27% overhead (with 20% sampling)
- **2.2x faster** than express-async-errors

See [Performance Guide](performance) for detailed benchmarks and optimization strategies.

---

## 🔗 Resources

- 📦 [npm Package](https://www.npmjs.com/package/crashless)
- 💻 [GitHub Repository](https://github.com/sunnyghodeswar/crashless)
- 🎮 [Examples Repository](https://github.com/sunnyghodeswar/crashless-examples)
- 🐛 [Report Issues](https://github.com/sunnyghodeswar/crashless/issues)
- 💬 [Discussions](https://github.com/sunnyghodeswar/crashless/discussions)

---

## Next Steps

- [Getting Started Guide](getting-started) - Step-by-step setup
- [Configuration Options](configuration) - Customize Crashless
- [Examples](examples) - Real-world usage patterns
- [API Reference](api-reference) - Complete API documentation
