/**
 * Crashless Automatic Tracing Example
 * 
 * Fully automatic tracing - one line of code!
 * 
 * Run: node examples/example-automatic-tracing.js
 * Visit: http://localhost:3000/traces.json?format=otlp
 */

import express from 'express';
import crashless from '../src/index.js';

const app = express();

// Enable metrics + tracing + dashboard - ONE LINE!
app.use(crashless({
  telemetry: {
    engine: 'builtin',
    dashboard: true,
    traces: {
      enabled: true,
      samplingRate: 0.2,   // capture 20% of requests
      maxStored: 500,      // keep latest 500 traces
    }
  }
}));

app.get('/', (req, res) => {
  res.send('Hello from Crashless 👋');
});

app.get('/error', () => {
  throw new Error('Simulated crash for tracing test');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/_crashless`);
  console.log(`🔍 Traces (OTLP): http://localhost:${PORT}/traces.json?format=otlp`);
});

