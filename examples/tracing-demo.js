/**
 * Crashless Automatic Tracing Demo
 * 
 * This example demonstrates fully automatic distributed tracing with Crashless.
 * No manual instrumentation needed - tracing happens automatically for HTTP requests,
 * fetch() calls, and file operations. Manual spans are optional.
 * 
 * Run: node examples/tracing-demo.js
 * Then visit:
 *   - http://localhost:3000/api/users/123 (automatic tracing with fetch simulation)
 *   - http://localhost:3000/api/users/123/orders (nested operations)
 *   - http://localhost:3000/api/users/123/error (error tracing)
 *   - http://localhost:3000/_crashless (dashboard)
 *   - http://localhost:3000/traces.json?format=otlp (OTLP format)
 */

import express from 'express';
import crashless from '../src/index.js';

const app = express();
app.use(express.json());

// Initialize Crashless with automatic tracing enabled
app.use(crashless({
  telemetry: {
    engine: 'builtin',
    dashboard: true,
    showlogs: false,
    maskMessages: false,
        traces: {
      enabled: true,
      samplingRate: 1,   // Capture 20% of requests
      maxStored: 500,      // Keep latest 500 traces
    }
  },
  appName: 'Tracing Demo App 2',
}));

// Simulate database query (automatically traced via events)
async function simulateDbQuery(query, params) {
  // Simulate DB latency
  await new Promise(resolve => setTimeout(resolve, Math.random() * 50 + 10));
  
  // Simulate occasional errors
  if (Math.random() < 0.1) {
    throw new Error('Database connection timeout');
  }
  
  return { id: params[0], name: 'John Doe', email: 'john@example.com' };
}

// Simulate external API call (automatically traced via fetch() patch)
async function simulateExternalApi(url) {
  // Use fetch which is automatically patched
  const response = await fetch(url || 'https://api.example.com/data');
  if (!response.ok) {
    throw new Error(`API returned ${response.status}`);
  }
  return response.json();
}

// Simulate file operation (automatically traced via fs patch)
async function simulateFileRead(filepath) {
  // Simulate file I/O latency
  await new Promise(resolve => setTimeout(resolve, Math.random() * 30 + 5));
  
  return { content: 'File content here...', size: 1024 };
}

// Route 1: Simple user lookup (automatically traced)
app.get('/api/users/:id', async (req, res) => {
  const userId = req.params.id;
  
  // This operation is automatically traced - no manual instrumentation needed!
  // The trace will include events for any fetch() calls or fs operations
  const user = await simulateDbQuery('SELECT * FROM users WHERE id = ?', [userId]);
  
  res.json({ success: true, user });
});

// Route 2: Complex operation with automatic tracing
app.get('/api/users/:id/orders', async (req, res) => {
  const userId = req.params.id;
  
  try {
    // All of these operations are automatically traced
    const user = await simulateDbQuery('SELECT * FROM users WHERE id = ?', [userId]);
    
    await new Promise(resolve => setTimeout(resolve, Math.random() * 40 + 15));
    const orders = [
      { id: 1, amount: 99.99 },
      { id: 2, amount: 149.99 },
    ];
    
    // External API call is automatically traced via fetch() patch
    let shippingInfo = null;
    try {
      shippingInfo = await simulateExternalApi(`https://api.shipping.com/track/${orders[0].id}`);
    } catch (err) {
      // Errors are automatically captured in the trace
    }
    
    // File operation would be automatically traced if we used fs.readFile
    const config = await simulateFileRead('./config.json');
    
    res.json({ 
      success: true, 
      user, 
      orders,
      shipping: shippingInfo,
      config: config ? 'loaded' : 'default',
    });
  } catch (error) {
    // Error is automatically captured in trace
    throw error;
  }
});

// Route 3: Error simulation (automatically traced)
app.get('/api/users/:id/error', async (req, res) => {
  const userId = req.params.id;
  
  // Simulate a DB query that might fail
  await simulateDbQuery('SELECT * FROM users WHERE id = ?', [userId]);
  
  // Throw an error - it will be automatically captured in the trace
  throw new Error('Simulated error for tracing demo');
});

// Route 4: Complex route with multiple async operations (automatically traced)
app.get('/api/users/:id/profile', async (req, res) => {
  const userId = req.params.id;
  
  try {
    // Multiple async operations that will be automatically traced
    
    // 1. Simulate fetching user data from database
    const user = await simulateDbQuery('SELECT * FROM users WHERE id = ?', [userId]);
    
    // 2. Simulate fetching user preferences (another DB query)
    await new Promise(resolve => setTimeout(resolve, Math.random() * 30 + 10));
    
    // 3. Fetch user's avatar from CDN (external HTTP call - automatically traced via fetch)
    let avatarUrl = null;
    try {
      const avatarResponse = await fetch(`https://api.example.com/avatars/${userId}`);
      if (avatarResponse.ok) {
        const avatarData = await avatarResponse.json();
        avatarUrl = avatarData.url;
      }
    } catch (err) {
      // Errors are automatically captured in trace
      console.log('Avatar fetch failed (expected in demo)');
    }
    

    // 4. Fetch user's posts from external API (another fetch call - automatically traced)
    let posts = [];
    try {
      const postsResponse = await fetch(`https://api.example.com/users/${userId}/posts`);
      if (postsResponse.ok) {
        posts = await postsResponse.json();
      }
    } catch (err) {
      console.log('Posts fetch failed (expected in demo)');
    }
    
    // 5. Fetch user's followers count (another external API call)
    let followersCount = 0;
    try {
      const followersResponse = await fetch(`https://api.example.com/users/${userId}/followers`);
      if (followersResponse.ok) {
        const followersData = await followersResponse.json();
        followersCount = followersData.count || 0;
      }
    } catch (err) {
      console.log('Followers fetch failed (expected in demo)');
    }
    
    // 6. Simulate reading a config file (would be automatically traced if using fs.readFile)
    const config = await simulateFileRead('./user-config.json');
    
    // 7. Simulate another database query for user settings
    await new Promise(resolve => setTimeout(resolve, Math.random() * 20 + 5));
    
    // All of these operations are automatically traced as events in the span!
    // Check /traces.json?format=otlp to see all the fetch events captured
    
    res.json({
      success: true,
      user: {
        ...user,
        avatarUrl,
        postsCount: posts.length,
        followersCount,
        config: config ? 'loaded' : 'default',
      },
    });
  } catch (error) {
    // Error is automatically captured in trace
    throw error;
  }
});

// Route 5: Simple health check (minimal trace)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Tracing Demo Server running on http://localhost:${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/_crashless`);
  console.log(`🔍 Traces: http://localhost:${PORT}/traces.json`);
  console.log(`📈 Metrics: http://localhost:${PORT}/metrics.json`);
  console.log(`\nTry these endpoints:`);
  console.log(`  - GET http://localhost:${PORT}/api/users/123`);
  console.log(`  - GET http://localhost:${PORT}/api/users/123/orders`);
  console.log(`  - GET http://localhost:${PORT}/api/users/123/profile (multiple async ops)`);
  console.log(`  - GET http://localhost:${PORT}/api/users/123/error`);
  console.log(`\n💡 Make requests and check /traces.json?format=otlp to see automatic tracing!`);
});

