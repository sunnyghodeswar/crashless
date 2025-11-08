/**
 * 🚀 Crashless Built-in Engine Example
 * 
 * Using built-in telemetry engine with dashboard
 * 
 * Run: node examples/example-builtin-engine.js
 */

import express from 'express';
import crashless from '../src/index.js';

const PORT = 3003;
const app = express();

app.use(express.json());

// One-liner setup with built-in telemetry
app.use(crashless({
  log: true,
  maskMessages: false,
  appName: 'Built-in Engine API',
  telemetry: {
    engine: 'builtin',  // Built-in metrics engine
    dashboard: true,
    route: '/_crashless',
    exportInterval: 5000,
  },
}));

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Built-in engine example',
    endpoints: {
      dashboard: `http://localhost:${PORT}/_crashless`,
      metrics: `http://localhost:${PORT}/metrics.json`,
      prometheus: `http://localhost:${PORT}/metrics`,
    }
  });
});

app.get('/users/:id', async (req, res) => {
  await new Promise(resolve => setTimeout(resolve, Math.random() * 200));
  const id = parseInt(req.params.id);
  if (id === 404) {
    throw crashless.createError('User not found', 404, 'USER_NOT_FOUND');
  }
  res.json({ id, name: `User ${id}` });
});

app.post('/users', async (req, res) => {
  await new Promise(resolve => setTimeout(resolve, 100));
  const { email } = req.body;
  if (!email) {
    throw crashless.createError('Email required', 422, 'VALIDATION_ERROR');
  }
  res.status(201).json({ id: Math.random(), email });
});

app.get('/slow', async (req, res) => {
  await new Promise(resolve => setTimeout(resolve, 800));
  res.json({ message: 'Slow response' });
});

app.get('/error', async (req, res) => {
  throw new Error('Regular error');
});


app.listen(PORT, () => {
  console.log(`\n🚀 Built-in Engine Example - http://localhost:${PORT}`);
  console.log(`   Dashboard: http://localhost:${PORT}/_crashless`);
  console.log(`   Metrics JSON: http://localhost:${PORT}/metrics.json`);
  console.log(`   Prometheus: http://localhost:${PORT}/metrics\n`);
});

// Automatic simulation - no manual route calling required
async function startSimulation() {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log('🔄 Starting automatic simulation...\n');
  
  setInterval(async () => {
    try {
      await fetch(`http://localhost:${PORT}/users/${Math.floor(Math.random() * 5)}`);
    } catch {}
  }, 2000);
  
  setInterval(async () => {
    try {
      await fetch(`http://localhost:${PORT}/slow`);
    } catch {}
  }, 5000);
  
  setInterval(async () => {
    try {
      await fetch(`http://localhost:${PORT}/`, {
        method: 'GET'
      });
    } catch {}
  }, 3000);
  
  setInterval(async () => {
    if (Math.random() > 0.8) {
      try {
        await fetch(`http://localhost:${PORT}/error`);
      } catch {}
    }
  }, 4000);
  
  setInterval(async () => {
    try {
      await fetch(`http://localhost:${PORT}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: `user${Math.random()}@example.com` })
      });
    } catch {}
  }, 6000);
}

startSimulation();

