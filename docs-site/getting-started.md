# Getting Started

This guide will help you get started with Crashless in minutes.

## Installation

```bash
npm install crashless
```

## Basic Setup

The simplest way to use Crashless is with default settings:

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

That's it! Your server is now protected from crashes.

**Access Dashboard:** `http://localhost:3000/_crashless`

---

## What Happens Now?

### Automatic Error Handling

All errors are caught automatically:

```javascript
// Async errors - automatically caught
app.get('/data', async (req, res) => {
  const data = await fetchData(); // If this throws, Crashless catches it
  res.json(data);
});

// Sync errors - also caught
app.get('/test', (req, res) => {
  throw new Error('Test error'); // Automatically handled
});
```

### Standardized Error Responses

Errors are returned in a consistent format:

```json
{
  "success": false,
  "message": "Error message",
  "code": "ERR_500"
}
```

### Built-in Dashboard

Visit `http://localhost:3000/_crashless` to see:

- Real-time request metrics
- Error analytics
- Performance insights
- Distributed traces

---

## Common Configurations

### Minimal (Error Handling Only)

For high-traffic applications needing only error handling:

```javascript
app.use(crashless({
  telemetry: { engine: 'none' }
}));
```

**Overhead:** ~3% vs plain Express

### Standard Production

For most production applications:

```javascript
app.use(crashless({
  telemetry: { engine: 'builtin' }
}));
```

**Overhead:** ~20% vs plain Express

### Full Observability

For debugging and development:

```javascript
app.use(crashless({
  telemetry: {
    engine: 'builtin',
    traces: {
      enabled: true,
      samplingRate: 0.2 // Sample 20% of requests
    }
  }
}));
```

**Overhead:** ~27% vs plain Express

---

## Next Steps

- [Configuration Guide](configuration.md) - Customize Crashless
- [API Reference](api-reference.md) - Complete API docs
- [Examples](examples.md) - Real-world patterns
- [Performance Guide](performance.md) - Optimization tips

