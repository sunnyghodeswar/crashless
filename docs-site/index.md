# Crashless Documentation

Welcome to the Crashless documentation. This guide will help you understand, install, configure, and use Crashless in your Express.js applications.

## What is Crashless?

Crashless is a zero-dependency Express middleware that provides:

- **Automatic error handling** - Prevents your server from crashing on unhandled errors
- **Built-in observability** - Real-time dashboard with metrics, errors, and traces
- **Distributed tracing** - See the complete lifecycle of every request
- **Production-ready** - Secure defaults, configurable overhead, and optimized performance

## Quick Navigation

- [Getting Started](getting-started.md) - Installation and basic setup
- [API Reference](api-reference.md) - Complete API documentation
- [Configuration](configuration.md) - All configuration options
- [Performance](performance.md) - Benchmarks and optimization
- [Examples](examples.md) - Code examples for common scenarios
- [Security](security.md) - Security best practices
- [Architecture](architecture.md) - How Crashless works internally
- [Limitations](limitations.md) - Honest trade-offs and limitations

---

## Installation

```bash
npm install crashless
```

## Basic Usage

```javascript
import express from 'express';
import crashless from 'crashless';

const app = express();

// One line setup
app.use(crashless());

// Your routes - errors automatically caught
app.get('/users/:id', async (req, res) => {
  const user = await db.getUser(req.params.id);
  res.json(user);
});

app.listen(3000);
```

**Access Dashboard:** `http://localhost:3000/_crashless`

---

## Key Features

### 1. Automatic Error Handling

All errors are caught automatically—sync, async, and promises:

```javascript
app.use(crashless());

// Async errors - caught automatically
app.get('/data', async (req, res) => {
  const data = await fetchData(); // 🛡️ Safe
  res.json(data);
});

// Sync errors - also caught
app.get('/test', (req, res) => {
  throw new Error('Oops'); // 🛡️ Safe
});
```

### 2. Built-in Dashboard

Real-time observability dashboard with three powerful views:

- **System Dashboard** - Request metrics, throughput, latency, route performance
- **Errors Dashboard** - Error frequency, top failing routes, live error stream
- **Traces Dashboard** - Request traces with waterfall visualization

### 3. Distributed Tracing

Automatic tracing for HTTP requests, `fetch()` calls, and `fs.readFile()` operations:

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

### 4. Metrics Export

Export metrics in multiple formats:

- `GET /metrics.json` - JSON format
- `GET /metrics/prometheus` - Prometheus format
- `GET /metrics/otel` - OpenTelemetry format

---

## Performance

Crashless is designed for performance:

- **Minimal config:** ~3% overhead vs plain Express
- **With metrics:** ~20% overhead
- **Full observability:** ~27% overhead (with 20% sampling)
- **2.2x faster** than express-async-errors

See [Performance Guide](performance.md) for detailed benchmarks and optimization strategies.

---

## Next Steps

- [Getting Started Guide](getting-started.md) - Step-by-step setup
- [Configuration Options](configuration.md) - Customize Crashless
- [Examples](examples.md) - Real-world usage patterns
- [API Reference](api-reference.md) - Complete API documentation

---

## Support

- 🐛 [Report Issues](https://github.com/sunnyghodeswar/crashless/issues)
- 💬 [Discussions](https://github.com/sunnyghodeswar/crashless/discussions)
- 📚 [Examples Repository](https://github.com/sunnyghodeswar/crashless-examples)

