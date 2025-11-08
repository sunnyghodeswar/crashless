/**
 * 🎬 Crashless Dashboard Demo - Full Traffic Simulation
 * 
 * Comprehensive example that simulates realistic traffic patterns to showcase
 * all dashboard features including:
 * - System metrics (requests, errors, latency)
 * - Error tracking (4xx, 5xx)
 * - Latency distributions
 * - Route performance
 * - Distributed tracing
 * 
 * Perfect for taking screenshots of all dashboard views!
 * 
 * Run: node examples/example-dashboard-demo.js
 * 
 * Then visit: http://localhost:3012/_crashless
 * 
 * Let it run for a few minutes to generate realistic data for screenshots.
 */

import express from 'express';
import crashless from '../src/index.js';

const PORT = 3012;
const app = express();

app.use(express.json());

// Full-featured setup with all observability enabled
app.use(crashless({
  log: false, // Reduce console noise for cleaner screenshots
  maskMessages: false,
  appName: 'Dashboard Demo - Traffic Simulation',
  telemetry: {
    engine: 'builtin',
    dashboard: true,
    route: '/_crashless',
    exportInterval: 5000,
    traces: {
      enabled: true,
      samplingRate: 1.0, // Capture 100% for demo
      maxStored: 1000,   // Keep more traces for demo
    }
  },
  onTelemetry: (err, meta) => {
    // Silent - just collect data
  },
}));

// Simulate database delay
function simulateDbQuery(delay = 50) {
  return new Promise(resolve => setTimeout(resolve, delay + Math.random() * 100));
}

// Simulate external API call
async function simulateExternalApi(name, delay = 100) {
  await new Promise(resolve => setTimeout(resolve, delay + Math.random() * 150));
  // Simulate occasional failures
  if (Math.random() < 0.1) {
    throw new Error(`External API ${name} timeout`);
  }
  return { success: true, data: `Response from ${name}` };
}

// Simulate cache lookup
async function simulateCacheLookup(key) {
  await new Promise(resolve => setTimeout(resolve, Math.random() * 20));
  if (Math.random() < 0.3) {
    return null; // Cache miss
  }
  return { cached: true, value: `cached-${key}` };
}

// ========== Routes with Different Characteristics ==========

// Fast route - high throughput
app.get('/api/health', async (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Normal route - medium latency
app.get('/api/users', async (req, res) => {
  await simulateDbQuery(50);
  const users = Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    name: `User ${i + 1}`,
    email: `user${i + 1}@example.com`
  }));
  res.json({ users });
});

// Slow route - high latency (for latency charts)
app.get('/api/users/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  
  // Simulate complex operations
  await simulateDbQuery(100);
  const cache = await simulateCacheLookup(`user-${id}`);
  
  if (!cache) {
    await simulateDbQuery(150); // Cache miss penalty
  }
  
  // Simulate external API call
  try {
    await simulateExternalApi('user-profile-api', 80);
  } catch (err) {
    // Log but continue
  }
  
  if (id === 999) {
    throw crashless.createError('User not found', 404, 'USER_NOT_FOUND');
  }
  
  res.json({ 
    id, 
    name: `User ${id}`, 
    email: `user${id}@example.com`,
    cached: !!cache
  });
});

// Very slow route - for latency percentiles
app.get('/api/reports', async (req, res) => {
  await simulateDbQuery(200);
  await simulateDbQuery(150);
  await simulateExternalApi('analytics-api', 200);
  res.json({ 
    reports: [
      { id: 1, name: 'Daily Report' },
      { id: 2, name: 'Weekly Summary' }
    ]
  });
});

// Route with varying latency
app.get('/api/products', async (req, res) => {
  const delay = Math.random() * 300; // 0-300ms
  await simulateDbQuery(delay);
  res.json({ products: [{ id: 1, name: 'Product 1' }] });
});

// Route that sometimes errors (5xx)
app.get('/api/orders', async (req, res) => {
  await simulateDbQuery(100);
  
  // Simulate 10% error rate
  if (Math.random() < 0.1) {
    throw crashless.createError(
      'Database connection failed',
      500,
      'DB_CONNECTION_ERROR'
    );
  }
  
  res.json({ orders: [{ id: 1, total: 99.99 }] });
});

// Route with validation errors (4xx)
app.post('/api/users', async (req, res) => {
  const { email, name } = req.body;
  
  if (!email) {
    throw crashless.createError('Email required', 422, 'VALIDATION_ERROR', {
      field: 'email',
      rule: 'required'
    });
  }
  
  if (!email.includes('@')) {
    throw crashless.createError('Invalid email format', 422, 'VALIDATION_ERROR', {
      field: 'email',
      rule: 'format'
    });
  }
  
  await simulateDbQuery(80);
  res.status(201).json({ id: Math.random(), email, name });
});

// Route with authentication errors (401)
app.get('/api/admin/stats', async (req, res) => {
  const token = req.headers.authorization;
  
  if (!token || token !== 'Bearer admin-token-123') {
    throw crashless.createError('Unauthorized', 401, 'AUTH_ERROR');
  }
  
  await simulateDbQuery(120);
  res.json({ stats: { totalUsers: 1000 } });
});

// Route with permission errors (403)
app.delete('/api/users/:id', async (req, res) => {
  const token = req.headers.authorization;
  
  if (!token) {
    throw crashless.createError('Unauthorized', 401, 'AUTH_ERROR');
  }
  
  if (token !== 'Bearer admin-token-123') {
    throw crashless.createError('Forbidden', 403, 'PERMISSION_ERROR');
  }
  
  await simulateDbQuery(60);
  res.json({ message: 'User deleted' });
});

// Route with complex tracing (multiple async operations)
app.get('/api/users/:id/profile', async (req, res) => {
  const userId = req.params.id;
  
  // Multiple async operations for tracing demo
  await simulateDbQuery(50);
  const cache = await simulateCacheLookup(`profile-${userId}`);
  
  // External API calls (automatically traced via fetch)
  let avatar = null;
  try {
    const avatarRes = await fetch(`https://api.example.com/avatars/${userId}`);
    if (avatarRes.ok) {
      avatar = await avatarRes.json();
    }
  } catch (err) {
    // Expected to fail in demo
  }
  
  let posts = [];
  try {
    const postsRes = await fetch(`https://api.example.com/users/${userId}/posts`);
    if (postsRes.ok) {
      posts = await postsRes.json();
    }
  } catch (err) {
    // Expected to fail
  }
  
  await simulateDbQuery(30);
  
  res.json({
    user: { id: userId, name: `User ${userId}` },
    avatar: avatar?.url || null,
    postsCount: posts.length,
    cached: !!cache
  });
});

// Route that throws errors occasionally
app.get('/api/data', async (req, res) => {
  await simulateDbQuery(70);
  
  if (Math.random() < 0.15) {
    throw crashless.createError('Internal server error', 500, 'INTERNAL_ERROR');
  }
  
  res.json({ data: 'Success' });
});

// Route with multiple async errors - perfect for waterfall view
app.get('/api/complex/:id', async (req, res) => {
  const id = req.params.id;
  const errors = [];
  
  try {
    // Step 1: Initial DB query (success)
    await simulateDbQuery(50);
    
    // Step 2: Cache lookup (may fail)
    try {
      const cache = await simulateCacheLookup(`complex-${id}`);
      if (!cache && Math.random() < 0.3) {
        throw new Error('Cache lookup timeout');
      }
    } catch (err) {
      errors.push({ step: 'cache', error: err.message });
    }
    
    // Step 3: External API call #1 (may fail)
    try {
      await simulateExternalApi('user-service', 100);
    } catch (err) {
      errors.push({ step: 'user-service', error: err.message });
    }
    
    // Step 4: External API call #2 (may fail)
    try {
      await simulateExternalApi('payment-service', 120);
    } catch (err) {
      errors.push({ step: 'payment-service', error: err.message });
    }
    
    // Step 5: Another DB query (may fail)
    try {
      await simulateDbQuery(80);
      if (Math.random() < 0.2) {
        throw crashless.createError('Database transaction failed', 500, 'DB_TRANSACTION_ERROR');
      }
    } catch (err) {
      errors.push({ step: 'db-transaction', error: err.message });
    }
    
    // Step 6: Fetch external data (may fail)
    try {
      const response = await fetch(`https://api.example.com/data/${id}`);
      if (!response.ok) {
        throw new Error(`External API returned ${response.status}`);
      }
      await response.json();
    } catch (err) {
      errors.push({ step: 'external-fetch', error: err.message });
    }
    
    // Step 7: Final processing (may fail)
    try {
      await simulateDbQuery(60);
      if (Math.random() < 0.15 && id === '999') {
        throw crashless.createError('Processing failed', 500, 'PROCESSING_ERROR');
      }
    } catch (err) {
      errors.push({ step: 'processing', error: err.message });
    }
    
    // If we have too many errors, fail the whole request
    if (errors.length >= 3) {
      throw crashless.createError(
        `Multiple operations failed: ${errors.map(e => e.step).join(', ')}`,
        500,
        'MULTIPLE_ERRORS',
        { errors }
      );
    }
    
    // Success response with error summary
    res.json({
      success: true,
      id,
      errors: errors.length > 0 ? errors : undefined,
      message: errors.length > 0 
        ? `Completed with ${errors.length} partial error(s)` 
        : 'All operations successful'
    });
    
  } catch (err) {
    // Final error - will be captured in trace with all previous errors
    throw err;
  }
});

// Start server
app.listen(PORT, () => {
  console.log('\n🎬 Dashboard Demo - Traffic Simulation');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`\n🚀 Server: http://localhost:${PORT}`);
  console.log(`\n📊 Dashboard: http://localhost:${PORT}/_crashless`);
  console.log(`\n📈 Available Views:`);
  console.log(`   - System Dashboard: http://localhost:${PORT}/_crashless`);
  console.log(`   - Errors Dashboard: http://localhost:${PORT}/_crashless/crashes`);
  console.log(`   - Traces Dashboard: http://localhost:${PORT}/_crashless/traces`);
  console.log(`\n💡 Let this run for 5-10 minutes to generate realistic data`);
  console.log(`   Then take screenshots of all dashboard views!`);
  console.log(`\n🔄 Traffic simulation starting...\n`);
});

// ========== Traffic Simulation ==========

async function startTrafficSimulation() {
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log('📊 Generating traffic patterns...\n');
  
  // Pattern 1: High-frequency health checks (every 1s)
  setInterval(async () => {
    try {
      await fetch(`http://localhost:${PORT}/api/health`);
    } catch {}
  }, 1000);
  
  // Pattern 2: User list requests (every 2s)
  setInterval(async () => {
    try {
      await fetch(`http://localhost:${PORT}/api/users`);
    } catch {}
  }, 2000);
  
  // Pattern 3: Individual user requests with varying IDs (every 2.5s)
  setInterval(async () => {
    const userId = Math.floor(Math.random() * 100) + 1;
    try {
      await fetch(`http://localhost:${PORT}/api/users/${userId}`);
    } catch {}
  }, 2500);
  
  // Pattern 4: Products endpoint (every 3s) - varying latency
  setInterval(async () => {
    try {
      await fetch(`http://localhost:${PORT}/api/products`);
    } catch {}
  }, 3000);
  
  // Pattern 5: Orders endpoint (every 4s) - sometimes errors
  setInterval(async () => {
    try {
      await fetch(`http://localhost:${PORT}/api/orders`);
    } catch {}
  }, 4000);
  
  // Pattern 6: Slow reports endpoint (every 8s)
  setInterval(async () => {
    try {
      await fetch(`http://localhost:${PORT}/api/reports`);
    } catch {}
  }, 8000);
  
  // Pattern 7: User creation with validation errors (every 5s)
  setInterval(async () => {
    const hasError = Math.random() < 0.3; // 30% error rate
    try {
      await fetch(`http://localhost:${PORT}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          hasError 
            ? { name: 'Test User' } // Missing email
            : { email: `user${Math.random()}@example.com`, name: 'Test User' }
        )
      });
    } catch {}
  }, 5000);
  
  // Pattern 8: Admin stats (unauthorized) (every 6s)
  setInterval(async () => {
    try {
      await fetch(`http://localhost:${PORT}/api/admin/stats`);
    } catch {}
  }, 6000);
  
  // Pattern 9: Delete user (forbidden) (every 7s)
  setInterval(async () => {
    const userId = Math.floor(Math.random() * 10) + 1;
    try {
      await fetch(`http://localhost:${PORT}/api/users/${userId}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': Math.random() > 0.5 ? 'Bearer wrong-token' : 'Bearer user-token'
        }
      });
    } catch {}
  }, 7000);
  
  // Pattern 10: Complex profile route with tracing (every 10s)
  setInterval(async () => {
    const userId = Math.floor(Math.random() * 50) + 1;
    try {
      await fetch(`http://localhost:${PORT}/api/users/${userId}/profile`);
    } catch {}
  }, 10000);
  
  // Pattern 11: Data endpoint with occasional errors (every 3.5s)
  setInterval(async () => {
    try {
      await fetch(`http://localhost:${PORT}/api/data`);
    } catch {}
  }, 3500);
  
  // Pattern 12: Complex route with multiple async errors (every 12s)
  setInterval(async () => {
    const id = Math.floor(Math.random() * 100) + 1;
    try {
      await fetch(`http://localhost:${PORT}/api/complex/${id}`);
    } catch {}
  }, 12000);
  
  // Pattern 13: Burst traffic every 30 seconds
  setInterval(() => {
    console.log('💥 Burst traffic simulation...');
    for (let i = 0; i < 20; i++) {
      setTimeout(async () => {
        try {
          const endpoint = [
            '/api/health',
            '/api/users',
            '/api/products',
            '/api/orders',
            '/api/data',
            `/api/complex/${Math.floor(Math.random() * 100)}`
          ][Math.floor(Math.random() * 6)];
          await fetch(`http://localhost:${PORT}${endpoint}`);
        } catch {}
      }, i * 50); // Stagger requests
    }
  }, 30000);
  
  console.log('✅ Traffic simulation running!');
  console.log('\n📸 Dashboard Views to Screenshot:');
  console.log('   1. System Dashboard - Overview & Metrics');
  console.log('   2. Errors Dashboard - Error Tracking');
  console.log('   3. Traces Dashboard - Distributed Tracing (Waterfall with errors)');
  console.log('\n💡 Special Route: /api/complex/:id');
  console.log('   - Shows multiple async operations with errors');
  console.log('   - Perfect for waterfall view in traces dashboard');
  console.log('   - Demonstrates error propagation in distributed traces');
  console.log('\n⏱️  Wait 5-10 minutes for data to accumulate, then take screenshots!\n');
}

startTrafficSimulation();

