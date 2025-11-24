<div align="center">

![Crashless Banner](https://raw.githubusercontent.com/sunnyghodeswar/crashless/main/docs-site/static/img/banner.png)

# ⚡ Crashless

> **Production-Ready Observability for Node.js**  
> Zero npm-dependency middleware that prevents Express servers from crashing and provides built-in monitoring — all from a single line of code.

[![npm version](https://img.shields.io/npm/v/crashless)](https://www.npmjs.com/package/crashless)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)

</div>

---

## 🚀 Quick Start

```bash
npm install crashless
```

```javascript
import express from 'express';
import crashless from 'crashless';

const app = express();
app.use(crashless()); // 🎉 That's it!

app.get('/users/:id', async (req, res) => {
  const user = await db.getUser(req.params.id); // 🛡️ Errors safely caught
  res.json(user);
});

app.listen(3000);
```

**🖥️ Dashboard:** [http://localhost:3000/_crashless](http://localhost:3000/_crashless)

---

## 🎮 Try It Live | 📚 Documentation

<table>
<tr>
<td width="50%">

### 🎮 Interactive Examples

**[▶️ One-Liner Setup](https://stackblitz.com/github/sunnyghodeswar/crashless-examples?file=examples%2Fexample-one-liner.js)**  
Simplest possible setup

**[▶️ Full Featured Demo](https://stackblitz.com/github/sunnyghodeswar/crashless-examples?file=examples%2Fexample-full-featured.js)**  
All features enabled

**[▶️ OpenTelemetry](https://stackblitz.com/github/sunnyghodeswar/crashless-examples?file=examples%2Fexample-otel-engine.js)**  
OTel metrics & traces

**[▶️ Prometheus Export](https://stackblitz.com/github/sunnyghodeswar/crashless-examples?file=examples%2Fexample-prometheus-engine.js)**  
Prometheus-compatible metrics

**[▶️ Custom Exporters](https://stackblitz.com/github/sunnyghodeswar/crashless-examples?file=examples%2Fexample-exporters.js)**  
Sentry, Datadog integrations

**[▶️ Production Dashboard](https://stackblitz.com/github/sunnyghodeswar/crashless-examples?file=examples%2Fexample-production-dashboard.js)**  
Secure production setup

**Or clone locally:**
```bash
git clone https://github.com/sunnyghodeswar/crashless-examples.git
cd crashless-examples && npm install
```

</td>
<td width="50%">

### 📚 Documentation

**[📖 Complete Docs](https://sunnyghodeswar.github.io/crashless/)**  
Full documentation site

**[🚀 Getting Started](https://sunnyghodeswar.github.io/crashless/getting-started)**  
Installation & setup guide

**[⚙️ Configuration](https://sunnyghodeswar.github.io/crashless/configuration)**  
All configuration options

**[📋 API Reference](https://sunnyghodeswar.github.io/crashless/api-reference)**  
Complete API documentation

**[💡 Examples](https://sunnyghodeswar.github.io/crashless/examples)**  
Common use cases & patterns

**[⚡ Performance](https://sunnyghodeswar.github.io/crashless/performance)**  
Benchmarks & optimization

</td>
</tr>
</table>

---

## ✨ Key Features

### 🛡️ **Automatic Error Handling**
Catch all errors automatically—sync, async, and promises. No try-catch needed.

```javascript
app.use(crashless());

// Async errors - automatically caught
app.get('/data', async (req, res) => {
  const data = await fetchData(); // 🛡️ Safe
  res.json(data);
});

// Sync errors - also caught
app.get('/test', (req, res) => {
  throw new Error('Oops'); // 🛡️ Safe
});
```

### 📊 **Built-in Dashboard**
Real-time observability dashboard with three powerful views:
- **System Dashboard** - Request metrics, throughput, latency, route performance
- **Errors Dashboard** - Error frequency, top failing routes, live error stream  
- **Traces Dashboard** - Request traces with waterfall visualization

**Access:** `http://localhost:3000/_crashless`

### 🔍 **Distributed Tracing**
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

### 📈 **OpenTelemetry Support**
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

### 📊 **Prometheus Metrics**
Prometheus-compatible metrics export for Grafana integration.

```javascript
app.use(crashless({
  telemetry: {
    engine: 'prometheus'
  }
}));
```

**Endpoint:** `GET /metrics` - Prometheus format

### 🔌 **Custom Exporters**
Integrate with Sentry, Datadog, or any monitoring service.

```javascript
app.use(crashless({
  exporters: [
    {
      name: 'sentry',
      onError: (error, metadata) => {
        Sentry.captureException(error, { extra: metadata });
      }
    },
    {
      name: 'datadog',
      onError: (error, metadata) => {
        datadogClient.sendError(error, metadata);
      }
    }
  ]
}));
```

### ⚡ **Zero Dependencies**
Uses only Node.js built-ins. No external npm dependencies.

### 🔐 **Production-Safe**
- Sensitive data masked automatically
- IP whitelist & token authentication
- Dashboard disabled in production by default
- Configurable overhead (2-30%)

---

## 🎯 Use Cases & Examples

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

### Custom Monitoring Integration
```javascript
app.use(crashless({
  exporters: [
    {
      name: 'sentry',
      onError: (error, metadata) => Sentry.captureException(error)
    }
  ]
}));
```
**Use case:** Integration with existing monitoring tools

---

## 🎨 Dashboard Preview

### System Overview
![System Overview](https://raw.githubusercontent.com/sunnyghodeswar/crashless-examples/main/screenshots/system-overview.png)

### Route Performance
![Route Performance](https://raw.githubusercontent.com/sunnyghodeswar/crashless-examples/main/screenshots/route-level-performance.png)

### Error Analytics
![Error Analytics](https://raw.githubusercontent.com/sunnyghodeswar/crashless-examples/main/screenshots/error-analytics.png)

### Distributed Tracing (Waterfall View)
![Distributed Tracing](https://raw.githubusercontent.com/sunnyghodeswar/crashless-examples/refs/heads/main/screenshots/distributed-tracing-waterfall-view.png)

---

## 📊 Performance

**Verified benchmarks** (Node.js v24.3.0, M3 Pro, 50 concurrent users):

| Configuration | Throughput (req/s) | Overhead |
|--------------|-------------------|----------|
| **Plain Express** | 15,761 | — |
| **Crashless (minimal)** | 15,406 | +2.3% |
| **Crashless (+metrics)** | 13,082 | +20.5% |
| **Crashless (+traces 20%)** | 12,390 | +27.2% |
| **express-async-errors** | 6,919 | +127.8% |

**Key Insight:** Crashless is **~2.2× faster** than express-async-errors with full observability.

[Run benchmarks yourself →](docs/contributing/BENCHMARKS.md)

---

## ⚖️ Comparison

| Feature | Crashless | express-async-errors | APM Tools |
|---------|-----------|----------------------|-----------|
| Async error handling | ✅ | ✅ | ⚠️ Config |
| Server crash prevention | ✅ | ⚠️ Partial | ⚠️ External |
| Built-in dashboard | ✅ | ❌ | ✅ Remote |
| **OpenTelemetry support** | ✅ | ❌ | ✅ |
| **Prometheus export** | ✅ | ❌ | ✅ |
| **Custom exporters** | ✅ | ❌ | ⚠️ Limited |
| **Distributed tracing** | ✅ | ❌ | ✅ |
| Zero dependencies | ✅ | ❌ | ❌ |
| Local metrics | ✅ | ❌ | ⚠️ Cloud |
| Free & open source | ✅ | ✅ | ❌ |
| Avg overhead | ~3-27% | ~130% | ~40-70% |

---

## 💡 Why Crashless?

### The Problem
```javascript
// ❌ WITHOUT CRASHLESS - Server crashes
app.get('/users/:id', async (req, res) => {
  const user = await db.getUser(req.params.id); // 💥 Unhandled rejection = crash
  res.json(user);
});
```

### The Solution
```javascript
// ✅ WITH CRASHLESS - Server stays alive
app.use(crashless());

app.get('/users/:id', async (req, res) => {
  const user = await db.getUser(req.params.id); // 🛡️ Caught & logged
  res.json(user);
});
```

### What You Get

- 🛡️ **Automatic error handling** - Never crash from unhandled errors
- 📊 **Built-in dashboard** - Real-time metrics, errors, and traces
- 🔍 **Distributed tracing** - See exactly what happens in every request
- 📈 **OpenTelemetry** - Full OTel compatibility
- 📊 **Prometheus** - Native Prometheus export
- 🔌 **Custom exporters** - Integrate with any monitoring tool
- 🔐 **Production-safe** - Sensitive data masked automatically
- ⚡ **Zero npm dependencies** - Uses only Node.js built-ins

---

## 🔗 Links

- 📦 [npm Package](https://www.npmjs.com/package/crashless)
- 📚 [Documentation](https://sunnyghodeswar.github.io/crashless/)
- 💻 [GitHub Repository](https://github.com/sunnyghodeswar/crashless)
- 🎮 [Examples Repository](https://github.com/sunnyghodeswar/crashless-examples)
- 🖼️ [Screenshots](https://github.com/sunnyghodeswar/crashless-examples/tree/main/screenshots)
- 🐛 [Issues](https://github.com/sunnyghodeswar/crashless/issues)
- 💬 [Discussions](https://github.com/sunnyghodeswar/crashless/discussions)

---

## 📄 License

MIT © [Sunny Ghodeswar](https://github.com/sunnyghodeswar)

---

<div align="center">

**Production-ready observability without the complexity.**

[Get Started](https://www.npmjs.com/package/crashless) • [Documentation](https://sunnyghodeswar.github.io/crashless/) • [Try Demo](https://stackblitz.com/github/sunnyghodeswar/crashless-examples)

</div>
