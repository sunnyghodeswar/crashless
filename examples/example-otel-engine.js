/**
 * 🚀 Crashless OpenTelemetry Engine Example
 * 
 * Using OpenTelemetry export engine
 * 
 * Run: node examples/example-otel-engine.js
 */

import express from 'express';
import crashless from '../src/crashless.js';

const PORT = 3005;
const app = express();

app.use(express.json());

// One-liner setup with OpenTelemetry engine
app.use(crashless({
  log: true,
  maskMessages: false,
  appName: 'OpenTelemetry API',
  telemetry: {
    engine: 'otel',  // OpenTelemetry export mode
    dashboard: true,
    route: '/_crashless',
    exportInterval: 5000,
  },
}));

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'OpenTelemetry engine example',
    endpoints: {
      dashboard: `http://localhost:${PORT}/_crashless`,
      metrics: `http://localhost:${PORT}/metrics.json`,
      otel: `http://localhost:${PORT}/metrics/otel`,
    }
  });
});

app.get('/api/products/:id', async (req, res) => {
  await new Promise(resolve => setTimeout(resolve, Math.random() * 200));
  const id = parseInt(req.params.id);
  if (id === 404) {
    throw crashless.createError('Product not found', 404, 'PRODUCT_NOT_FOUND');
  }
  res.json({ id, name: `Product ${id}`, price: Math.random() * 100 });
});

app.post('/api/products', async (req, res) => {
  await new Promise(resolve => setTimeout(resolve, 120));
  const { name, price } = req.body;
  if (!name || !price) {
    throw crashless.createError('Name and price required', 422, 'VALIDATION_ERROR');
  }
  res.status(201).json({ id: Math.random(), name, price });
});

app.listen(PORT, () => {
  console.log(`\n🚀 OpenTelemetry Engine Example - http://localhost:${PORT}`);
  console.log(`   Dashboard: http://localhost:${PORT}/_crashless`);
  console.log(`   OpenTelemetry Metrics: http://localhost:${PORT}/metrics/otel`);
  console.log(`   JSON Metrics: http://localhost:${PORT}/metrics.json\n`);
});

// Generate load
setInterval(() => {
  fetch(`http://localhost:${PORT}/api/products/${Math.floor(Math.random() * 5)}`).catch(() => {});
}, 2000);

