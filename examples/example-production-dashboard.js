/**
 * 🚀 Production Dashboard Example
 * 
 * Shows how to enable dashboard in PRODUCTION with proper security.
 * 
 * Dashboard is disabled by default in production for security,
 * but can be enabled with IP whitelist + token authentication.
 * 
 * This is the recommended setup for production environments where
 * you need real-time observability but want to secure access.
 * 
 * Run:
 * NODE_ENV=production \
 * DASHBOARD_ALLOWED_IPS="10.0.0.1,192.168.1.100" \
 * DASHBOARD_SECRET="your-production-secret" \
 * node examples/example-production-dashboard.js
 */

import express from 'express';
import crashless from '../src/index.js';

const PORT = process.env.PORT || 3000;
const app = express();

app.use(express.json());

// Production configuration with dashboard enabled
// IMPORTANT: You MUST provide security (IP whitelist or token) in production
app.use(crashless({
  appName: 'Production API',
  enableDashboard: true, // Explicitly enable dashboard in production
  
  // Security: IP whitelist + token authentication
  dashboardAuth: (req) => {
    const clientIP = req.ip || 
                     req.connection?.remoteAddress || 
                     req.socket?.remoteAddress || 
                     'unknown';
    
    // Check IP whitelist from environment variable
    if (process.env.DASHBOARD_ALLOWED_IPS) {
      const allowedIPs = process.env.DASHBOARD_ALLOWED_IPS.split(',').map(ip => ip.trim());
      if (allowedIPs.includes(clientIP)) {
        return true;
      }
    }
    
    // Check token authentication
    const token = req.headers['x-dashboard-token'];
    if (token && token === process.env.DASHBOARD_SECRET) {
      return true;
    }
    
    // Deny by default
    return false;
  },
  
  // Production-safe error handling
  maskMessages: true, // Hide sensitive error messages
  showStack: false,   // Hide stack traces in production
  
  // Telemetry configuration
  telemetry: {
    engine: 'prometheus', // Use Prometheus for external monitoring
    dashboard: true,      // Enable dashboard (with security above)
    traces: {
      enabled: true,
      samplingRate: 0.1,  // Sample 10% in production to reduce overhead
      maxStored: 500
    }
  }
}));

// Your API routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Production API with Secure Dashboard',
    dashboard: `http://localhost:${PORT}/_crashless`,
    note: 'Dashboard requires IP whitelist or token authentication'
  });
});

app.get('/api/users', async (req, res) => {
  // Simulate database query
  await new Promise(resolve => setTimeout(resolve, 50));
  res.json({ users: [{ id: 1, name: 'John' }] });
});

app.get('/api/orders/:id', async (req, res) => {
  // Simulate external API call
  await new Promise(resolve => setTimeout(resolve, 100));
  res.json({ order: { id: req.params.id, status: 'completed' } });
});

app.listen(PORT, () => {
  console.log('\n🚀 Production API with Secure Dashboard');
  console.log(`   Server: http://localhost:${PORT}`);
  console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  console.log(`\n📊 Dashboard Access:`);
  console.log(`   URL: http://localhost:${PORT}/_crashless`);
  console.log(`\n🔒 Security Configuration:`);
  
  if (process.env.DASHBOARD_ALLOWED_IPS) {
    console.log(`   ✅ IP Whitelist: ${process.env.DASHBOARD_ALLOWED_IPS}`);
  } else {
    console.log(`   ⚠️  No IP whitelist set`);
  }
  
  if (process.env.DASHBOARD_SECRET) {
    console.log(`   ✅ Token Auth: Enabled`);
    console.log(`   ℹ️  Use header: x-dashboard-token: ${process.env.DASHBOARD_SECRET}`);
  } else {
    console.log(`   ⚠️  No token secret set`);
  }
  
  console.log(`\n💡 Production Usage:`);
  console.log(`   Dashboard is ENABLED with security`);
  console.log(`   Access requires:`);
  console.log(`   - IP from whitelist, OR`);
  console.log(`   - Valid token in x-dashboard-token header`);
  console.log(`\n📈 Metrics Export:`);
  console.log(`   Prometheus: http://localhost:${PORT}/metrics`);
  console.log(`   JSON: http://localhost:${PORT}/metrics.json`);
  console.log(`   Traces: http://localhost:${PORT}/traces.json`);
  console.log('');
});

// Automatic simulation for testing
async function startSimulation() {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log('🔄 Starting automatic simulation...\n');
  
  const endpoints = [
    '/',
    '/api/users',
    '/api/orders/123',
    '/api/orders/456',
  ];
  
  setInterval(async () => {
    const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
    try {
      await fetch(`http://localhost:${PORT}${endpoint}`);
    } catch {}
  }, 2000);
  
  // Occasionally trigger errors
  setInterval(async () => {
    if (Math.random() > 0.9) {
      try {
        await fetch(`http://localhost:${PORT}/api/error`);
      } catch {}
    }
  }, 5000);
}

startSimulation();

