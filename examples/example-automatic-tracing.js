/**
 * Crashless Automatic Tracing Example
 * 
 * Fully automatic tracing - one line of code!
 * All operations are automatically traced - no manual instrumentation needed.
 * 
 * Run: node examples/example-automatic-tracing.js
 * Visit: http://localhost:3000/traces.json?format=otlp
 */

import express from 'express';
import crashless from '../src/index.js';

const app = express();
app.use(express.json());

// Enable metrics + tracing + dashboard - ONE LINE!
app.use(crashless({
  appName: 'Automatic Tracing Demo',
  telemetry: {
    engine: 'builtin',
    dashboard: true,
    traces: {
      enabled: true,
      samplingRate: 1,   // capture 100% of requests (for demo)
      maxStored: 500,    // keep latest 500 traces
    }
  }
}));

// Simulate async operations (automatically traced)
async function simulateDbQuery(query) {
  await new Promise(resolve => setTimeout(resolve, Math.random() * 50 + 10));
  return { id: 1, name: 'John Doe' };
}

async function simulateExternalApi() {
  // fetch() is automatically patched and traced
  try {
    const response = await fetch('https://api.example.com/data');
    return response.ok;
  } catch {
    // Expected to fail in demo - that's okay!
    return false;
  }
}

app.get('/', async (req, res) => {
  // All operations are automatically traced
  const user = await simulateDbQuery('SELECT * FROM users');
  const apiOk = await simulateExternalApi();
  
  res.json({ 
    message: 'Hello from Crashless 👋',
    user,
    apiStatus: apiOk ? 'ok' : 'failed (expected)'
  });
});

app.get('/api/users/:id', async (req, res) => {
  await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
  
  // Simulate DB query (automatically traced)
  const user = await simulateDbQuery(`SELECT * FROM users WHERE id = ${req.params.id}`);
  
  // Simulate external API call (automatically traced via fetch)
  await simulateExternalApi();
  
  res.json({ success: true, user });
});

app.get('/error', async () => {
  // Simulate some operations before error
  await simulateDbQuery('SELECT * FROM users');
  throw new Error('Simulated crash for tracing test');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/_crashless`);
  console.log(`🔍 Traces (OTLP): http://localhost:${PORT}/traces.json?format=otlp`);
  console.log(`📈 Metrics: http://localhost:${PORT}/metrics.json\n`);
});

// Automatic simulation - no manual route calling required
async function startSimulation() {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log('🔄 Starting automatic simulation...\n');
  
  setInterval(async () => {
    try {
      await fetch(`http://localhost:${PORT}/`);
    } catch {}
  }, 2000);
  
  setInterval(async () => {
    try {
      await fetch(`http://localhost:${PORT}/api/users/${Math.floor(Math.random() * 5)}`);
    } catch {}
  }, 3000);
  
  setInterval(async () => {
    if (Math.random() > 0.7) {
      try {
        await fetch(`http://localhost:${PORT}/error`);
      } catch {}
    }
  }, 5000);
  
  console.log('✅ Simulation running - check the dashboard!\n');
}

startSimulation();

