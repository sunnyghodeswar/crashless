/**
 * 🚀 Crashless Basic Example
 * 
 * Minimal setup - just error handling, no telemetry
 * 
 * Run: node examples/example-basic.js
 */

import express from 'express';
import crashless from '../src/index.js';

const PORT = 3001;
const app = express();

app.use(express.json());

// One-liner setup with no telemetry
app.use(crashless({
  log: true,
  maskMessages: false,
  appName: 'Basic Example API',
  telemetry: {
    engine: 'none',
    dashboard: false,
  },
}));

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Basic example - no telemetry' });
});

app.get('/error', async (req, res) => {
  throw crashless.createError('Test error', 500, 'TEST_ERROR');
});

app.get('/users/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  if (id === 999) {
    throw crashless.createError('User not found', 404, 'USER_NOT_FOUND');
  }
  res.json({ id, name: `User ${id}` });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Basic Example - http://localhost:${PORT}`);
  console.log('   No telemetry, no dashboard\n');
});

// Automatic simulation
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
      await fetch(`http://localhost:${PORT}/error`);
    } catch {}
  }, 4000);
}

startSimulation();

