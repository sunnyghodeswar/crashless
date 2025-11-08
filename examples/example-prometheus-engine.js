/**
 * 🚀 Crashless Prometheus Engine Example
 * 
 * Using Prometheus export engine
 * 
 * Run: node examples/example-prometheus-engine.js
 */

import express from 'express';
import crashless from '../src/index.js';

const PORT = 3004;
const app = express();

app.use(express.json());

// One-liner setup with Prometheus engine
app.use(crashless({
  log: true,
  maskMessages: false,
  appName: 'Prometheus Metrics API',
  telemetry: {
    engine: 'prometheus',  // Prometheus export mode
    dashboard: true,
    route: '/_crashless',
    exportInterval: 5000,
  },
}));

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Prometheus engine example',
    endpoints: {
      dashboard: `http://localhost:${PORT}/_crashless`,
      metrics: `http://localhost:${PORT}/metrics.json`,
      prometheus: `http://localhost:${PORT}/metrics`, // Main endpoint
    },
    note: 'Use /metrics endpoint for Prometheus scraping'
  });
});

app.get('/api/users/:id', async (req, res) => {
  await new Promise(resolve => setTimeout(resolve, Math.random() * 150));
  const id = parseInt(req.params.id);
  if (id === 999) {
    throw crashless.createError('User not found', 404, 'USER_NOT_FOUND');
  }
  res.json({ id, name: `User ${id}` });
});

app.post('/api/users', async (req, res) => {
  await new Promise(resolve => setTimeout(resolve, 100));
  const { email } = req.body;
  if (!email) {
    throw crashless.createError('Email required', 422, 'VALIDATION_ERROR');
  }
  res.status(201).json({ id: Math.random(), email });
});

app.get('/api/orders', async (req, res) => {
  await new Promise(resolve => setTimeout(resolve, 50));
  res.json({ orders: [{ id: 1 }, { id: 2 }] });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Prometheus Engine Example - http://localhost:${PORT}`);
  console.log(`   Dashboard: http://localhost:${PORT}/_crashless`);
  console.log(`   Prometheus Metrics: http://localhost:${PORT}/metrics`);
  console.log(`   JSON Metrics: http://localhost:${PORT}/metrics.json\n`);
  console.log('Prometheus scrape config:');
  console.log(`  scrape_configs:`);
  console.log(`    - job_name: 'crashless'`);
  console.log(`      static_configs:`);
  console.log(`        - targets: ['localhost:${PORT}']`);
  console.log(`      metrics_path: '/metrics'\n`);
});

// Automatic simulation - no manual route calling required
async function startSimulation() {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log('🔄 Starting automatic simulation...\n');
  
  setInterval(async () => {
    try {
      await fetch(`http://localhost:${PORT}/api/users/${Math.floor(Math.random() * 5)}`);
    } catch {}
  }, 2500);
  
  setInterval(async () => {
    try {
      await fetch(`http://localhost:${PORT}/api/orders`);
    } catch {}
  }, 3000);
  
  setInterval(async () => {
    try {
      await fetch(`http://localhost:${PORT}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: `user${Math.random()}@example.com` })
      });
    } catch {}
  }, 4500);
  
  setInterval(async () => {
    if (Math.random() > 0.85) {
      try {
        await fetch(`http://localhost:${PORT}/api/users/999`);
      } catch {}
    }
  }, 5000);
}

startSimulation();

