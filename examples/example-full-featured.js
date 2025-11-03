/**
 * 🚀 Crashless Full-Featured Example
 * 
 * Complete example showcasing all features:
 * - All error types
 * - Custom errors with details
 * - Multiple routes with different latencies
 * - Authentication simulation
 * - Validation
 * - Telemetry integration
 * 
 * Run: node examples/example-full-featured.js
 */

import express from 'express';
import crashless from '../src/crashless.js';

const PORT = 3007;
const app = express();

app.use(express.json());

// Register exporters
crashless.registerExporter('analytics', (err, meta) => {
  console.log(`📊 Analytics: ${meta.method} ${meta.path} - ${err.code} (${meta.status})`);
});

// One-liner setup with full configuration
app.use(crashless({
  log: true,
  maskMessages: process.env.NODE_ENV === 'production',
  appName: 'Full-Featured Demo API',
  telemetry: {
    engine: 'builtin',
    dashboard: true,
    route: '/_crashless',
    exportInterval: 5000,
  },
  onTelemetry: (err, meta) => {
    // Additional telemetry processing
    if (meta.status >= 500) {
      console.log(`🚨 Critical error on ${meta.method} ${meta.path}`);
    }
  },
}));

// Simulate database
const users = [
  { id: 1, email: 'alice@example.com', name: 'Alice', role: 'admin' },
  { id: 2, email: 'bob@example.com', name: 'Bob', role: 'user' },
  { id: 3, email: 'charlie@example.com', name: 'Charlie', role: 'user' },
];

// Authentication helper
function authenticate(req) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token || token !== 'secret-token-123') {
    throw crashless.createError('Invalid or missing token', 401, 'AUTH_REQUIRED');
  }
  return { id: 1, email: 'alice@example.com', role: 'admin' };
}

function requireAdmin(user) {
  if (user.role !== 'admin') {
    throw crashless.createError('Admin access required', 403, 'FORBIDDEN');
  }
}

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Full-featured Crashless example',
    features: {
      errorHandling: 'enabled',
      telemetry: 'enabled',
      dashboard: 'enabled',
      exporters: 'enabled',
    },
    endpoints: {
      dashboard: `http://localhost:${PORT}/_crashless`,
      metrics: `http://localhost:${PORT}/metrics.json`,
      prometheus: `http://localhost:${PORT}/metrics`,
    }
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Public routes
app.get('/users', async (req, res) => {
  await new Promise(resolve => setTimeout(resolve, 50));
  res.json({ users: users.map(u => ({ id: u.id, name: u.name })) });
});

app.get('/users/:id', async (req, res) => {
  await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
  const user = users.find(u => u.id === parseInt(req.params.id));
  if (!user) {
    throw crashless.createError('User not found', 404, 'USER_NOT_FOUND', {
      requestedId: req.params.id,
    });
  }
  res.json(user);
});

app.post('/users', async (req, res) => {
  authenticate(req);
  
  await new Promise(resolve => setTimeout(resolve, 100));
  const { email, name } = req.body;
  
  if (!email) {
    throw crashless.createError('Email required', 422, 'VALIDATION_ERROR', {
      field: 'email',
      rule: 'required',
    });
  }
  
  if (!email.includes('@')) {
    throw crashless.createError('Invalid email format', 422, 'VALIDATION_ERROR', {
      field: 'email',
      rule: 'format',
    });
  }
  
  const newUser = {
    id: users.length + 1,
    email,
    name: name || 'Unknown',
    role: 'user',
  };
  users.push(newUser);
  
  res.status(201).json(newUser);
});

app.put('/users/:id', async (req, res) => {
  authenticate(req);
  
  await new Promise(resolve => setTimeout(resolve, 80));
  const user = users.find(u => u.id === parseInt(req.params.id));
  if (!user) {
    throw crashless.createError('User not found', 404, 'USER_NOT_FOUND');
  }
  
  Object.assign(user, req.body);
  res.json(user);
});

app.delete('/users/:id', async (req, res) => {
  const currentUser = authenticate(req);
  requireAdmin(currentUser);
  
  await new Promise(resolve => setTimeout(resolve, 60));
  const index = users.findIndex(u => u.id === parseInt(req.params.id));
  
  if (index === -1) {
    throw crashless.createError('User not found', 404, 'USER_NOT_FOUND');
  }
  
  if (users[index].id === currentUser.id) {
    throw crashless.createError('Cannot delete your own account', 400, 'SELF_DELETE_FORBIDDEN');
  }
  
  users.splice(index, 1);
  res.json({ message: 'User deleted' });
});

// Admin routes
app.get('/admin/stats', async (req, res) => {
  const user = authenticate(req);
  requireAdmin(user);
  
  await new Promise(resolve => setTimeout(resolve, 120));
  res.json({
    totalUsers: users.length,
    totalRequests: 1000,
    uptime: Date.now(),
  });
});

app.get('/admin/logs', async (req, res) => {
  const user = authenticate(req);
  requireAdmin(user);
  
  // Simulate file read error
  const fsError = new Error('ENOENT: no such file or directory, open \'/var/log/app.log\'');
  fsError.code = 'FILE_NOT_FOUND';
  throw fsError;
});

// Test endpoints
app.get('/slow', async (req, res) => {
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
  res.json({ message: 'Slow response completed' });
});

app.get('/fast', async (req, res) => {
  res.json({ message: 'Fast response' });
});

app.get('/error-500', async (req, res) => {
  throw crashless.createError('Internal server error', 500, 'INTERNAL_ERROR');
});

app.get('/error-404', async (req, res) => {
  throw crashless.createError('Not found', 404, 'NOT_FOUND');
});

app.get('/error-422', async (req, res) => {
  throw crashless.createError('Validation failed', 422, 'VALIDATION_ERROR', {
    fields: ['email', 'password'],
    errors: ['Email is invalid', 'Password too short'],
  });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Full-Featured Example - http://localhost:${PORT}`);
  console.log(`   Dashboard: http://localhost:${PORT}/_crashless`);
  console.log(`   Metrics: http://localhost:${PORT}/metrics.json`);
  console.log(`   Prometheus: http://localhost:${PORT}/metrics\n`);
  
  console.log('📋 API Endpoints:\n');
  console.log('Public:');
  console.log('  GET  /health');
  console.log('  GET  /users');
  console.log('  GET  /users/:id');
  console.log('  POST /users (requires auth)');
  console.log('  PUT  /users/:id (requires auth)');
  console.log('  DELETE /users/:id (requires admin)\n');
  console.log('Admin:');
  console.log('  GET  /admin/stats (requires admin)');
  console.log('  GET  /admin/logs (requires admin)\n');
  console.log('Test:');
  console.log('  GET  /slow');
  console.log('  GET  /fast');
  console.log('  GET  /error-500');
  console.log('  GET  /error-404');
  console.log('  GET  /error-422\n');
  console.log('Auth: Use header "Authorization: Bearer secret-token-123"\n');
});

// Comprehensive test suite
async function runTests() {
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  console.log('\n🧪 Running comprehensive tests...\n');
  
  // Success cases
  await testRoute('GET', '/health');
  await testRoute('GET', '/users');
  await testRoute('GET', '/users/1');
  await testRoute('GET', '/fast');
  
  // Error cases
  await testRoute('GET', '/users/999');
  await testRoute('GET', '/error-404');
  await testRoute('GET', '/error-500');
  await testRoute('GET', '/error-422');
  
  // Auth required
  await testRoute('POST', '/users', { email: 'test@example.com' });
  await testRoute('GET', '/admin/stats');
  
  // Auth with token
  await testRoute('POST', '/users', { email: 'test2@example.com' }, {
    'Authorization': 'Bearer secret-token-123'
  });
  
  // Slow endpoint
  await testRoute('GET', '/slow');
  
  console.log('\n✅ Test suite completed!\n');
  console.log('🔄 Starting continuous load simulation...\n');
  
  startContinuousLoad();
}

async function testRoute(method, path, body = null, headers = {}) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`http://localhost:${PORT}${path}`, options);
    const text = await response.text();
    
    try {
      const json = JSON.parse(text);
      console.log(`✅ ${method} ${path} - ${response.status}`, json.success === false ? `(${json.code})` : '');
    } catch {
      console.log(`✅ ${method} ${path} - ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ ${method} ${path} - Error: ${error.message}`);
  }
  
  await new Promise(resolve => setTimeout(resolve, 300));
}

function startContinuousLoad() {
  setInterval(() => {
    fetch(`http://localhost:${PORT}/users/${Math.floor(Math.random() * 5)}`).catch(() => {});
  }, 2000);
  
  setInterval(() => {
    fetch(`http://localhost:${PORT}/fast`).catch(() => {});
  }, 1500);
  
  setInterval(() => {
    fetch(`http://localhost:${PORT}/slow`).catch(() => {});
  }, 6000);
  
  setInterval(() => {
    if (Math.random() > 0.7) {
      fetch(`http://localhost:${PORT}/error-500`).catch(() => {});
    }
  }, 4000);
}

setTimeout(runTests, 1000);

