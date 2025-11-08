/**
 * 🔒 Crashless Dashboard Security Example
 * 
 * Demonstrates dashboard security features for PRODUCTION use:
 * - IP whitelist via environment variable
 * - Token authentication
 * - Custom auth function
 * - Production mode with explicit enablement
 * 
 * IMPORTANT: Dashboard is disabled by default in production for security,
 * but CAN be enabled in production with proper security (IP whitelist + token).
 * 
 * Run: node examples/example-dashboard-security.js
 * 
 * Production Usage:
 * NODE_ENV=production \
 * DASHBOARD_ALLOWED_IPS="10.0.0.1,192.168.1.100" \
 * DASHBOARD_SECRET="your-secret-token" \
 * node examples/example-dashboard-security.js
 */

import express from 'express';
import crashless from '../src/index.js';

const PORT = process.env.PORT || 3011;
const app = express();

app.use(express.json());

// Example 1: IP Whitelist via Environment Variable
// Set: export DASHBOARD_ALLOWED_IPS="127.0.0.1,10.0.0.1"
console.log('\n📋 Dashboard Security Configuration:');
console.log('   DASHBOARD_ALLOWED_IPS:', process.env.DASHBOARD_ALLOWED_IPS || 'not set');
console.log('   NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('');

// Configure Crashless with security
app.use(crashless({
  appName: 'Secure Dashboard Demo',
  // Only enable dashboard in production if explicitly requested AND security is provided
  enableDashboard: process.env.NODE_ENV === 'production' 
    ? (!!process.env.DASHBOARD_ALLOWED_IPS || !!process.env.DASHBOARD_SECRET)
    : true,
  // dashboardAuth will be automatically set from DASHBOARD_ALLOWED_IPS if present
  // Or you can provide custom function:
  dashboardAuth: (req) => {
    const clientIP = req.ip || 
                     req.connection?.remoteAddress || 
                     req.socket?.remoteAddress || 
                     'unknown';
    
    // If DASHBOARD_SECRET is set, require token authentication (even for localhost)
    if (process.env.DASHBOARD_SECRET) {
      const token = req.headers['x-dashboard-token'];
      if (token === process.env.DASHBOARD_SECRET) {
        return true; // Valid token
      }
      // No valid token - deny access (even localhost)
      return false;
    }
    
    // If DASHBOARD_ALLOWED_IPS is set, check IP whitelist
    if (process.env.DASHBOARD_ALLOWED_IPS) {
      const allowedIPs = process.env.DASHBOARD_ALLOWED_IPS.split(',').map(ip => ip.trim());
      
      // Normalize IP for comparison (handle IPv4-mapped IPv6 addresses)
      const normalizedClientIP = clientIP.replace(/^::ffff:/, '');
      
      // Check if client IP matches any allowed IP
      if (allowedIPs.includes(clientIP) || allowedIPs.includes(normalizedClientIP)) {
        return true;
      }
      
      // Also check if localhost variants are allowed
      const isLocalhost = clientIP === '127.0.0.1' || 
                          clientIP === '::1' || 
                          clientIP === '::ffff:127.0.0.1' ||
                          normalizedClientIP === '127.0.0.1';
      
      if (isLocalhost && (allowedIPs.includes('127.0.0.1') || allowedIPs.includes('localhost'))) {
        return true;
      }
      
      // IP not in whitelist - deny
      return false;
    }
    
    // No security configured - allow localhost only (development mode)
    if (clientIP === '127.0.0.1' || clientIP === '::1' || clientIP === '::ffff:127.0.0.1') {
      return true;
    }
    
    // Deny by default
    return false;
  },
  telemetry: {
    traces: {
      enabled: true,
      samplingRate: 1.0, // Sample all for demo
      maxStored: 100
    }
  }
}));

// Test routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Dashboard Security Demo',
    dashboard: `http://localhost:${PORT}/_crashless`,
    security: {
      ipWhitelist: process.env.DASHBOARD_ALLOWED_IPS || 'not set',
      clientIP: req.ip || req.connection?.remoteAddress || 'unknown',
      hasToken: !!req.headers['x-dashboard-token']
    }
  });
});

app.get('/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Test endpoint',
    clientIP: req.ip || req.connection?.remoteAddress || 'unknown'
  });
});

app.get('/error', (req, res) => {
  throw crashless.createError('Test error', 500, 'TEST_ERROR');
});

app.listen(PORT, () => {
  console.log(`\n🚀 Dashboard Security Demo`);
  console.log(`   Server: http://localhost:${PORT}`);
  console.log(`\n📊 Dashboard Access:`);
  console.log(`   URL: http://localhost:${PORT}/_crashless`);
  console.log(`\n🔒 Security Status:`);
  
  if (process.env.NODE_ENV === 'production') {
    console.log(`   ⚠️  Dashboard DISABLED by default (NODE_ENV=production)`);
    console.log(`   ℹ️  To enable in production, set enableDashboard: true + security`);
    console.log(`   ℹ️  Example: enableDashboard: true + DASHBOARD_ALLOWED_IPS + DASHBOARD_SECRET`);
  } else {
    console.log(`   ✅ Dashboard ENABLED`);
    
    if (process.env.DASHBOARD_ALLOWED_IPS) {
      console.log(`   🔐 IP Whitelist: ${process.env.DASHBOARD_ALLOWED_IPS}`);
      console.log(`   ℹ️  Only IPs in whitelist can access dashboard`);
    } else {
      console.log(`   ⚠️  No IP whitelist set - using custom auth function`);
    }
    
    if (process.env.DASHBOARD_SECRET) {
      console.log(`   🔑 Token auth ENABLED (use header: x-dashboard-token)`);
      console.log(`   ℹ️  Set header: x-dashboard-token: ${process.env.DASHBOARD_SECRET}`);
    } else {
      console.log(`   ℹ️  No DASHBOARD_SECRET set - token auth disabled`);
      console.log(`   ℹ️  Localhost access allowed by default`);
    }
  }
  
  console.log(`\n💡 Testing:`);
  console.log(`   1. Try accessing dashboard from localhost (should work)`);
  console.log(`   2. Set DASHBOARD_ALLOWED_IPS to test IP whitelist`);
  console.log(`   3. Set DASHBOARD_SECRET to test token auth`);
  console.log(`   4. Set NODE_ENV=production to see dashboard disabled\n`);
});

// Automatic simulation
async function startSimulation() {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log('🔄 Starting automatic simulation...\n');
  
  setInterval(async () => {
    try {
      await fetch(`http://localhost:${PORT}/test`);
    } catch {}
  }, 2000);
  
  setInterval(async () => {
    try {
      await fetch(`http://localhost:${PORT}/`);
    } catch {}
  }, 3000);
  
  setInterval(async () => {
    if (Math.random() > 0.8) {
      try {
        await fetch(`http://localhost:${PORT}/error`);
      } catch {}
    }
  }, 5000);
  
  console.log('✅ Simulation running - test dashboard access!\n');
}

startSimulation();

