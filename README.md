# ⚡ Crashless

> **Zero-dependency middleware that prevents Express servers from crashing on errors**  
> No try/catch. No `next(err)`. No crashes. Just stability.

[![npm version](https://img.shields.io/npm/v/crashless)](https://www.npmjs.com/package/crashless)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🎯 What is Crashless?

**Crashless** is a lightweight middleware that automatically catches **all errors** in your Express app—whether they're async rejections, thrown errors, or promise failures. Your server will never crash from unhandled errors again.

### The Problem It Solves

❌ **Without Crashless:**
```js
app.get('/users/:id', async (req, res) => {
  const user = await db.getUser(req.params.id); // 💥 CRASHES if this fails!
  res.json(user);
});
```

✅ **With Crashless:**
```js
app.get('/users/:id', async (req, res) => {
  const user = await db.getUser(req.params.id); // 🛡️ Safely caught!
  res.json(user);
});
```

---

## 🚀 Quick Start

### Installation

```bash
npm install crashless
```

### Basic Setup

```js
import express from 'express';
import crashless from 'crashless';

const app = express();

// Enable async error handling (optional but recommended)
crashless.handleAsync(app);

// Add error middleware (MUST be last)
app.use(crashless());

// Your routes - no try/catch needed!
app.get('/users/:id', async (req, res) => {
  const user = await db.getUser(req.params.id);
  res.json(user);
});

app.listen(3000);
```

That's it! Your app is now crashless. 🎉

### Try It Online

🚀 **[Try on StackBlitz](https://stackblitz.com/github/sunnyghodeswar/node-express-crashless?file=server.js)**  
💻 **[Try on CodeSandbox](https://codesandbox.io/p/github/sunnyghodeswar/node-express-crashless?file=server.js)**  
📚 **[View Full Examples Repository](https://github.com/sunnyghodeswar/node-express-crashless)** - Complete examples showcasing all features

---


## ✨ Features

### 1. 🧠 Automatic Async Error Handling

**What it does:** Automatically catches errors in async/await routes without try/catch blocks.

**How it works:** Call `crashless.handleAsync(app)` once at startup. It wraps all async route handlers to catch any errors.

```js
crashless.handleAsync(app);

app.get('/data', async (req, res) => {
  // If this throws an error, Crashless catches it automatically!
  const data = await fetchDataFromAPI();
  res.json(data);
});
```

**Why it's useful:** You can write clean async code without wrapping everything in try/catch blocks.

---

### 2. 🪄 One-Liner Setup

**What it does:** Just add `app.use(crashless())` and you're done.

**Simple setup:**
```js
app.use(crashless()); // That's it!
```

**With options:**
```js
app.use(crashless({
  log: true,
  maskMessages: true
}));
```

**Why it's useful:** Minimal setup, maximum protection.

---

### 3. 🧰 Standardized Error Creation

**What it does:** Provides `createError()` helper to create consistent error objects with status codes and error codes.

**How to use:**
```js
throw crashless.createError(
  'User not found',    // Message
  404,                 // HTTP status code
  'USER_NOT_FOUND',    // Error code
  { userId: 123 }      // Optional details
);
```

**Response format:**
```json
{
  "success": false,
  "message": "User not found",
  "code": "USER_NOT_FOUND"
}
```

**Why it's useful:** Consistent error format across your entire API, making it easier for clients to handle errors.

---

### 4. 🔒 Production-Safe Error Messages

**What it does:** Automatically masks sensitive error messages in production to prevent information leaks.

**Development mode:**
```json
{
  "success": false,
  "message": "Database connection failed: postgres://user:password@localhost/db",
  "code": "DB_ERROR",
  "stack": "Error: Database connection failed\n    at..."
}
```

**Production mode:**
```json
{
  "success": false,
  "message": "Internal server error",
  "code": "DB_ERROR"
}
```

**Why it's useful:** Prevents exposing sensitive information (passwords, file paths, stack traces) to potential attackers.

---

### 5. 📜 Smart Stack Trace Exposure

**What it does:** Shows stack traces in development for debugging, hides them in production for security.

**Development:** Full stack traces visible  
**Production:** Stack traces hidden

**Why it's useful:** Helps you debug during development while keeping production secure.

---

### 6. 🪶 Intelligent Logging

**What it does:** Automatically logs errors with request metadata (method, path, timestamp, user-agent, etc.).

**Log output:**
```
[Crashless] Error: {
  name: 'Error',
  message: 'User not found',
  code: 'USER_NOT_FOUND',
  status: 404
} {
  stack: 'Error: User not found\n    at...'
} {
  method: 'GET',
  path: '/users/123',
  status: 404,
  timestamp: '2024-01-15T10:30:00.000Z',
  userAgent: 'Mozilla/5.0...'
}
```

**Why it's useful:** All the context you need to debug issues, automatically included.

---

### 7. 📡 Built-in Telemetry Hooks

**What it does:** Provides hooks to send errors to monitoring services like Sentry, Prometheus, or custom systems.

**Using `onTelemetry` callback:**
```js
app.use(crashless({
  onTelemetry: (err, meta) => {
    // Send to Sentry
    Sentry.captureException(err, {
      tags: { path: meta.path, method: meta.method }
    });
    
    // Or send to Prometheus
    errorCounter.inc({ code: err.code, status: meta.status });
  }
}));
```

**Using `registerExporter`:**
```js
// Register once, use everywhere
crashless.registerExporter('sentry', (err, meta) => {
  Sentry.captureException(err);
});

crashless.registerExporter('metrics', (err, meta) => {
  trackError(meta.path, meta.status);
});
```

**Why it's useful:** Integrate with your existing monitoring infrastructure without changing your code.

---

### 8. 🧩 Works Seamlessly with Express & Vegaa

**What it does:** Same simple API works with both Express and Vegaa frameworks.

**Express:**
```js
import express from 'express';
const app = express();
crashless.handleAsync(app);
app.use(crashless());
```

**Vegaa:**
```js
import Vegaa from 'vegaa';
const app = new Vegaa();
crashless.handleAsync(app);
app.use(crashless());
```

**Why it's useful:** Same code, same reliability, works with both frameworks.

---

### 9. 🚀 Minimal Performance Overhead

**What it does:** Designed for <1% performance overhead. Zero dependencies.

**Why it's useful:** Production-ready performance without sacrificing speed.

---

## 📖 Detailed Usage

### Basic Error Handling

```js
import express from 'express';
import crashless from 'crashless';

const app = express();
crashless.handleAsync(app);

// Regular async route - errors are caught automatically
app.get('/users/:id', async (req, res) => {
  const user = await db.getUser(req.params.id);
  if (!user) {
    throw crashless.createError('User not found', 404, 'USER_NOT_FOUND');
  }
  res.json(user);
});

// Regular error - also caught automatically
app.get('/data', (req, res) => {
  throw new Error('Something went wrong');
});

app.use(crashless()); // MUST be last
```

### Creating Custom Errors

```js
// Simple error
throw crashless.createError('Invalid input', 400, 'INVALID_INPUT');

// Error with details
throw crashless.createError(
  'Validation failed',
  422,
  'VALIDATION_ERROR',
  {
    field: 'email',
    rule: 'must be a valid email'
  }
);

// Error with custom client message (for production)
const err = crashless.createError(
  'Database connection failed: postgres://...',
  500,
  'DB_ERROR'
);
err.clientMessage = 'Service temporarily unavailable';
throw err;
```

### Telemetry Integration

```js
// Option 1: Using onTelemetry callback
app.use(crashless({
  onTelemetry: (err, meta) => {
    console.log(`Error on ${meta.method} ${meta.path}: ${err.message}`);
    // Send to your monitoring service
  }
}));

// Option 2: Using registerExporter (global)
crashless.registerExporter('sentry', (err, meta) => {
  Sentry.captureException(err, {
    contexts: {
      request: {
        method: meta.method,
        url: meta.path,
        headers: { 'user-agent': meta.userAgent }
      }
    }
  });
});

// Both work simultaneously!
```

### Production Configuration

```js
// Production setup with all safety features
app.use(crashless({
  maskMessages: true,        // Hide sensitive info (default in production)
  log: true,                 // Enable logging
  defaultStatus: 500,        // Default status for errors without status
  onTelemetry: (err, meta) => {
    // Send to monitoring
  }
}));
```

---

## ⚙️ Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `maskMessages` | `boolean` | `true` (in production) | Hide sensitive error messages in production |
| `log` | `boolean` | `true` | Enable console error logging |
| `defaultStatus` | `number` | `500` | Default HTTP status code for errors without status |
| `onTelemetry` | `function` | `undefined` | Callback function for telemetry (err, meta) => void |

**Note:** Stack traces are automatically hidden in production (`NODE_ENV=production`).

---

## 🔧 API Reference

### `crashless(options?)`

Returns Express error-handling middleware.

```js
app.use(crashless()); // Use defaults
app.use(crashless({ log: false })); // With options
```

### `crashless.handleAsync(app, options?)`

Patches Express app to automatically catch async route errors.

```js
crashless.handleAsync(app); // Patch all methods
crashless.handleAsync(app, { methods: ['get', 'post'] }); // Custom methods
```

### `crashless.createError(message, status?, code?, details?)`

Creates a standardized error object.

```js
crashless.createError('Error message', 400, 'ERROR_CODE', { extra: 'data' });
```

### `crashless.registerExporter(name, fn)`

Registers a global telemetry exporter.

```js
crashless.registerExporter('my-exporter', (err, meta) => {
  // Handle error
});
```

---

## 📝 Error Response Format

All errors return a consistent JSON structure:

```json
{
  "success": false,
  "message": "Error message here",
  "code": "ERROR_CODE",
  "stack": "Error stack trace..." // Only in development
}
```

---

## 💡 Examples

> 📚 **📁 Full Examples Repository:** Check out the **[crashless-examples](https://github.com/sunnyghodeswar/crashless-examples)** repository for comprehensive examples including REST APIs, authentication, database integration, telemetry setup, and more production-ready patterns.  
> 📁 **Quick Example:** See [`example.js`](./example.js) for a basic example in this repository.

### Example 1: API with Database

```js
import express from 'express';
import crashless from 'crashless';

const app = express();
crashless.handleAsync(app);

app.get('/users/:id', async (req, res) => {
  const user = await db.getUser(req.params.id);
  if (!user) {
    throw crashless.createError('User not found', 404, 'USER_NOT_FOUND');
  }
  res.json(user);
});

app.post('/users', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    throw crashless.createError('Email required', 422, 'VALIDATION_ERROR');
  }
  const user = await db.createUser(req.body);
  res.status(201).json(user);
});

app.use(crashless());
```

### Example 2: With Sentry Integration

```js
import crashless from 'crashless';
import * as Sentry from '@sentry/node';

// Register Sentry exporter
crashless.registerExporter('sentry', (err, meta) => {
  Sentry.captureException(err, {
    tags: {
      path: meta.path,
      method: meta.method,
      status: meta.status
    }
  });
});

app.use(crashless({
  onTelemetry: (err, meta) => {
    console.log(`[${meta.method}] ${meta.path} - ${err.message}`);
  }
}));
```

### Example 3: Custom Error Handling

```js
app.get('/protected', async (req, res) => {
  const token = req.headers.authorization;
  
  if (!token) {
    throw crashless.createError('Missing token', 401, 'AUTH_MISSING');
  }
  
  const user = await validateToken(token);
  if (!user) {
    const err = crashless.createError('Invalid token', 401, 'AUTH_INVALID');
    err.clientMessage = 'Please login again';
    throw err;
  }
  
  res.json({ user });
});
```

---

## 🤔 FAQ

### Do I need to use `handleAsync`?

**Recommended:** Yes, if you use async/await in your routes. Without it, async errors might not be caught properly.

### Do I need try/catch blocks?

**No!** Crashless handles all errors automatically. You can still use try/catch if you need custom error handling logic.

### Can I use multiple exporters?

**Yes!** Call `registerExporter` multiple times. All exporters will be called when errors occur.

### Does it work with existing error handlers?

**Yes!** Crashless is just Express middleware. You can combine it with other middleware, but make sure Crashless is mounted **last**.

### What about errors thrown in middleware?

**They're caught too!** As long as you've called `handleAsync(app)` and mounted Crashless middleware, all errors are handled.

---

## 🎯 Why Choose Crashless?

### vs. Existing Solutions

Other packages like `express-async-handler` and `express-async-errors` catch async errors, but that's only 20% of the problem. Crashless solves the full picture:

| Feature | express-async-handler | express-async-errors | Crashless |
|---------|----------------------|---------------------|-----------|
| Catches async errors | ✅ (manual wrap each route) | ✅ | ✅ |
| Automatic (no wrapping) | ❌ | ✅ | ✅ |
| Catches sync errors | ✅ | ✅ | ✅ |
| Standardized error format | ❌ | ❌ | ✅ |
| Production message masking | ❌ | ❌ | ✅ |
| Telemetry/monitoring hooks | ❌ | ❌ | ✅ |
| Request context logging | ❌ | ❌ | ✅ |
| Custom error creation helper | ❌ | ❌ | ✅ |
| Security-first defaults | ❌ | ❌ | ✅ |

**The Difference:**

- **express-async-errors** = Catches errors (20% of the solution)
- **Crashless** = Catches errors + Professional handling + Monitoring + Security (100% solution)

**What you get with Crashless that others don't provide:**

🎯 Consistent JSON error responses across your entire API  
🔒 Automatic sanitization of sensitive data in production  
📊 Built-in telemetry integration for Sentry, Datadog, etc.  
📝 Automatic request context logging (method, path, timestamp, user-agent)  
🛡️ Production-safe by default (masks passwords, database URLs, stack traces)

---

### vs. Manual Error Handling

| Challenge | Without Crashless | With Crashless |
|-----------|------------------|----------------|
| **Server crashes from async errors** | ❌ Need try/catch everywhere or risk crashes | ✅ Automatically caught - never crash |
| **Sensitive info leaked to users** | ❌ Stack traces expose passwords, paths | ✅ Auto-masked in production |
| **Inconsistent error responses** | ❌ Every endpoint returns different format | ✅ Unified JSON structure |
| **No visibility into production errors** | ❌ Manual logging, no alerts | ✅ Built-in telemetry hooks |
| **Verbose, repetitive code** | ❌ Try/catch blocks clutter every route | ✅ Clean, minimal code |
| **Hard to debug production issues** | ❌ No context when errors occur | ✅ Automatic request metadata logging |
| **Security vulnerabilities** | ❌ Easy to accidentally expose secrets | ✅ Production-safe by default |
| **Team onboarding** | ❌ New devs forget error handling | ✅ Safety net catches mistakes |

---

## 🧱 Why Crashless?

| Problem | Without Crashless | With Crashless |
|---------|------------------|----------------|
| **Async errors crash server** | ❌ Need try/catch everywhere | ✅ Automatically caught |
| **Sensitive info leaked** | ❌ Expose stack traces/paths | ✅ Masked in production |
| **Inconsistent error format** | ❌ Different formats everywhere | ✅ Unified JSON structure |
| **No error tracking** | ❌ Manual logging required | ✅ Built-in telemetry hooks |
| **Verbose code** | ❌ Try/catch blocks everywhere | ✅ Clean, minimal code |

---

## 📄 License

MIT © [Sunny Ghodeswar](https://github.com/sunnyghodeswar)

---

## 🙏 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📚 Related

- [Express.js](https://expressjs.com/) - Web framework
- [Vegaa](https://github.com/vegaa/vegaa) - Alternative framework

---

Made with ❤️ for the Node.js community
