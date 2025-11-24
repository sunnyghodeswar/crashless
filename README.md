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

## 📚 Documentation

**[📖 Complete Documentation](https://sunnyghodeswar.github.io/crashless/)**

**Quick Links:**

- [Getting Started](https://sunnyghodeswar.github.io/crashless/getting-started) - Installation & first steps
- [Configuration Guide](https://sunnyghodeswar.github.io/crashless/configuration) - All configuration options
- [API Reference](https://sunnyghodeswar.github.io/crashless/api-reference) - Complete API docs
- [Performance Guide](https://sunnyghodeswar.github.io/crashless/performance) - Optimization tips
- [Examples](https://sunnyghodeswar.github.io/crashless/examples) - Common use cases

---

## ✨ Features

| Category | Features |
|----------|----------|
| **Error Handling** | Automatic async + sync error catching, no try-catch needed |
| **Observability** | Built-in dashboard, Prometheus metrics, distributed tracing |
| **Performance** | Minimal overhead (~3%), faster than express-async-errors |
| **Security** | Production-safe by default, IP whitelist + token auth |
| **Integration** | Zero dependencies, plug & play with any Express app |

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
- 🔐 **Production-safe** - Sensitive data masked automatically
- ⚡ **Zero npm dependencies** - Uses only Node.js built-ins

---

## 🎨 Dashboard

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

**Verified benchmarks** (Node.js v24.3.0, M3 Pro, 50 concurrent users, averaged over 5 runs):

| Configuration | Throughput (req/s) | Overhead |
|--------------|-------------------|----------|
| **Plain Express** | 15,761 | — |
| **Crashless (minimal)** | 15,406 | +2.3% |
| **Crashless (+metrics)** | 13,082 | +20.5% |
| **Crashless (+traces 100%)** | 11,963 | +31.8% |
| **Crashless (+traces 20%)** | 12,390 | +27.2% |
| **express-async-errors** | 6,919 | +127.8% |

**Key Insight:** Crashless is **~2.2× faster** than express-async-errors with full observability.

[Run benchmarks yourself →](docs/contributing/BENCHMARKS.md)

---

## 🧠 Recommended Configs

| Environment | Configuration | Overhead |
|-------------|---------------|----------|
| **High-Traffic** | `telemetry: { engine: 'none' }` | ~2-3% |
| **Production** | `telemetry: { engine: 'builtin' }` | ~18-21% |
| **Debugging** | `traces: { samplingRate: 0.1 }` | ~24-27% |
| **Development** | `traces: { enabled: true }` | ~30-32% |

### Examples

**High-Traffic Production:**

```javascript
app.use(crashless({
  telemetry: { engine: 'none' }
}));
```

**Standard Production:**

```javascript
app.use(crashless({
  telemetry: { engine: 'builtin' }
}));
```

**Production + Observability:**

```javascript
app.use(crashless({
  telemetry: {
    engine: 'builtin',
    traces: { enabled: true, samplingRate: 0.2 }
  }
}));
```

---

## ⚖️ Comparison

| Feature | Crashless | express-async-errors | APM Tools |
|---------|-----------|----------------------|-----------|
| Async error handling | ✅ | ✅ | ⚠️ Config |
| Server crash prevention | ✅ | ⚠️ Partial | ⚠️ External |
| Built-in dashboard | ✅ | ❌ | ✅ Remote |
| Distributed tracing | ✅ | ❌ | ✅ |
| Zero dependencies | ✅ | ❌ | ❌ |
| Local metrics | ✅ | ❌ | ⚠️ Cloud |
| Free & open source | ✅ | ✅ | ❌ |
| Avg overhead | ~3-27% | ~130% | ~40-70% |

---

## 🎮 Try It Live

**StackBlitz Examples:**

- [Interactive Demo](https://stackblitz.com/github/sunnyghodeswar/crashless-examples)
- [One-Liner Setup](https://stackblitz.com/github/sunnyghodeswar/crashless-examples?file=examples%2Fexample-one-liner.js)
- [Full Featured](https://stackblitz.com/github/sunnyghodeswar/crashless-examples?file=examples%2Fexample-full-featured.js)

---

## 🔗 Links

- 📦 [npm Package](https://www.npmjs.com/package/crashless)
- 📚 [Documentation](https://sunnyghodeswar.github.io/crashless/)
- 💻 [GitHub Repository](https://github.com/sunnyghodeswar/crashless)
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
