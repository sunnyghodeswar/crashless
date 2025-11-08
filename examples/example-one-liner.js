/**
 * 🚀 Crashless One-Liner Example
 * 
 * The simplest possible setup - everything auto-configured!
 * Just one line: app.use(crashless())
 * 
 * Run: node examples/example-one-liner.js
 */

import express from 'express';
import crashless from '../src/index.js';

const PORT = 3010;
const app = express();

app.use(express.json());

// 🪄 ONE LINE SETUP - That's it! Everything is auto-configured!
app.use(crashless());

// Your routes - async errors are automatically caught!
app.get('/', (req, res) => {
  res.json({ 
    message: 'One-liner setup example',
    features: 'Full observability with ZERO configuration!',
    dashboard: `http://localhost:${PORT}/_crashless`,
    metrics: `http://localhost:${PORT}/metrics.json`,
  });
});

app.get('/users/:id', async (req, res) => {
  await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
  const id = parseInt(req.params.id);
  if (id === 404) {
    throw crashless.createError('User not found', 404, 'USER_NOT_FOUND');
  }
  res.json({ id, name: `User ${id}` });
});

app.post('/api/data', async (req, res) => {
  await new Promise(resolve => setTimeout(resolve, 50));
  res.json({ success: true, data: req.body });
});

app.get('/error', async (req, res) => {
  throw new Error('Test error - check the dashboard!');
});

// That's it! crashless() automatically gives you EVERYTHING:
// ✅ Async error handling (auto-wraps all routes defined after it)
// ✅ Request tracking & metrics collection  
// ✅ Dashboard auto-mounted at /_crashless
// ✅ Metrics auto-mounted at /metrics.json
// ✅ Error handling (4-arg middleware signature)
// ✅ One line setup, maximum observability!

app.listen(PORT, () => {
  console.log(`\n🚀 One-Liner Setup Example`);
  console.log(`   http://localhost:${PORT}`);
  console.log(`\n📊 Dashboard (Auto-enabled):`);
  console.log(`   http://localhost:${PORT}/_crashless`);
  console.log(`\n📈 Metrics:`);
  console.log(`   JSON: http://localhost:${PORT}/metrics.json`);
  console.log(`   Prometheus: http://localhost:${PORT}/metrics`);
  console.log(`\n✨ Features enabled by default:`);
  console.log(`   ✅ Async error handling (auto-wraps routes)`);
  console.log(`   ✅ Error handling & standardized responses`);
  console.log(`   ✅ Live dashboard at /_crashless`);
  console.log(`   ✅ Metrics collection & exports`);
  console.log(`   ✅ Request tracking & latency`);
  console.log(`   ✅ App name: "Crashless API"`);
  console.log(`\n💡 Just ONE line of setup:`);
  console.log(`   app.use(crashless())`);
  console.log(`   That's it! Everything is automatic!\n`);
});

// Automatic simulation - no manual route calling required
async function startSimulation() {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log('\n🔄 Starting automatic simulation...\n');
  
  // Simulate various requests
  setInterval(async () => {
    const userId = Math.floor(Math.random() * 10);
    try {
      await fetch(`http://localhost:${PORT}/users/${userId}`);
    } catch {}
  }, 2000);
  
  setInterval(async () => {
    try {
      await fetch(`http://localhost:${PORT}/`);
    } catch {}
  }, 3000);
  
  setInterval(async () => {
    try {
      await fetch(`http://localhost:${PORT}/api/data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: 'data' })
      });
    } catch {}
  }, 4000);
  
  setInterval(async () => {
    if (Math.random() > 0.7) {
      try {
        await fetch(`http://localhost:${PORT}/error`);
      } catch {}
    }
  }, 5000);
  
  console.log('✅ Simulation running - check the dashboard at http://localhost:' + PORT + '/_crashless\n');
}

startSimulation();

