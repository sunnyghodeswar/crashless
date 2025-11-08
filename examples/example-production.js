/**
 * 🚀 Crashless Production Example
 * 
 * Production-ready configuration with:
 * - Message masking enabled
 * - Dashboard disabled (or only accessible internally)
 * - Proper error sanitization
 * 
 * Run: NODE_ENV=production node examples/example-production.js
 */

import express from 'express';
import crashless from '../src/index.js';

const PORT = 3002;
const app = express();

app.use(express.json());

// One-liner setup with production config
app.use(crashless({
  log: true,
  maskMessages: true,  // Mask sensitive data in production
  appName: 'Production API (Secure Mode)',
  telemetry: {
    engine: 'builtin',
    dashboard: false,  // Disable dashboard in production
    route: '/_crashless',
    exportInterval: 5000,
  },
}));

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Production mode',
    env: process.env.NODE_ENV || 'development',
    features: {
      errorMasking: 'enabled',
      stackTraces: 'hidden',
      dashboard: 'disabled'
    }
  });
});

app.get('/users/:id', async (req, res) => {
  await new Promise(resolve => setTimeout(resolve, 50));
  
  const id = parseInt(req.params.id);
  if (id === 404) {
    // This error message will be masked in production
    throw crashless.createError(
      'Database connection failed: postgres://user:secret@localhost/db',
      500,
      'DB_ERROR'
    );
  }
  
  res.json({ id, name: `User ${id}` });
});

app.post('/users', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    throw crashless.createError('Email required', 422, 'VALIDATION_ERROR');
  }
  res.status(201).json({ id: Math.random(), email });
});

app.get('/sensitive-error', async (req, res) => {
  // This exposes sensitive info - will be masked in production
  throw crashless.createError(
    'Failed to connect: mongodb://admin:password123@cluster.mongodb.net/db',
    500,
    'CONNECTION_ERROR'
  );
});

app.get('/safe-error', async (req, res) => {
  // Using clientMessage for production-safe error
  const err = crashless.createError(
    'Database connection failed: postgres://user:secret@localhost/db',
    500,
    'DB_ERROR'
  );
  err.clientMessage = 'Service temporarily unavailable. Please try again later.';
  throw err;
});

app.listen(PORT, () => {
  console.log(`\n🚀 Production Example - http://localhost:${PORT}`);
  console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Message masking: ${process.env.NODE_ENV === 'production' ? 'enabled' : 'disabled'}`);
  console.log(`   Dashboard: disabled`);
  console.log(`   Metrics: http://localhost:${PORT}/metrics.json\n`);
  
  console.log('Test endpoints:');
  console.log('  GET  /users/1 (success)');
  console.log('  GET  /users/404 (error)');
  console.log('  GET  /sensitive-error (will be masked in production)');
  console.log('  GET  /safe-error (uses clientMessage)\n');
});

// Automatic simulation - no manual route calling required
async function startSimulation() {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log('🔄 Starting automatic simulation...\n');
  
  setInterval(async () => {
    try {
      await fetch(`http://localhost:${PORT}/users/${Math.floor(Math.random() * 5)}`);
    } catch {}
  }, 2500);
  
  setInterval(async () => {
    try {
      await fetch(`http://localhost:${PORT}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: `user${Math.random()}@example.com` })
      });
    } catch {}
  }, 4000);
  
  setInterval(async () => {
    if (Math.random() > 0.7) {
      try {
        await fetch(`http://localhost:${PORT}/sensitive-error`);
      } catch {}
    }
  }, 5000);
  
  setInterval(async () => {
    if (Math.random() > 0.8) {
      try {
        await fetch(`http://localhost:${PORT}/safe-error`);
      } catch {}
    }
  }, 6000);
}

startSimulation();

