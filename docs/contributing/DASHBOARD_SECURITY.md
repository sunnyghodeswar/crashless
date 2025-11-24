# Dashboard Security Examples

## Overview

Crashless provides multiple ways to secure dashboard access:

1. **IP Whitelist** - Via environment variable `DASHBOARD_ALLOWED_IPS`
2. **Token Authentication** - Via `DASHBOARD_SECRET` environment variable
3. **Custom Auth Function** - Via `dashboardAuth` option
4. **Production Mode** - Dashboard disabled by default, but CAN be enabled with security

**Important:** Dashboard is **disabled by default in production** (`NODE_ENV=production`) for security, but **CAN be enabled in production** by setting `enableDashboard: true` along with proper security (IP whitelist and/or token authentication).

---

## Production Usage

### Enabling Dashboard in Production

**Dashboard CAN work in production** when properly secured. This is the recommended approach when you need real-time observability in production.

```javascript
import express from 'express';
import crashless from 'crashless';

const app = express();

app.use(crashless({
  enableDashboard: true, // Explicitly enable (required in production)
  dashboardAuth: (req) => {
    // Provide security (IP whitelist + token)
    const ip = req.ip || req.connection?.remoteAddress;
    if (ip === '127.0.0.1') return true;
    
    const token = req.headers['x-dashboard-token'];
    return token === process.env.DASHBOARD_SECRET;
  }
}));

app.listen(3000);
```

**Run in production:**
```bash
NODE_ENV=production \
DASHBOARD_ALLOWED_IPS="10.0.0.1,192.168.1.100" \
DASHBOARD_SECRET="your-secret" \
node app.js
```

**See:** [example-production-dashboard.js](example-production-dashboard.js) for complete production example.

---

## Example 1: IP Whitelist (Environment Variable)

### Setup

```bash
# Set allowed IPs
export DASHBOARD_ALLOWED_IPS="127.0.0.1,10.0.0.1,192.168.1.100"
```

### Code

```javascript
import express from 'express';
import crashless from 'crashless';

const app = express();

// Automatically uses DASHBOARD_ALLOWED_IPS if set
app.use(crashless({
  enableDashboard: true
}));

app.listen(3000);
```

### Test

```bash
# Start server
DASHBOARD_ALLOWED_IPS="127.0.0.1" node examples/example-dashboard-security.js

# Access from allowed IP (should work)
curl http://localhost:3000/_crashless

# Access from disallowed IP (should return 403)
# curl -H "X-Forwarded-For: 192.168.1.200" http://localhost:3000/_crashless
```

---

## Example 2: Custom Auth Function

### Code

```javascript
import express from 'express';
import crashless from 'crashless';

const app = express();

app.use(crashless({
  enableDashboard: true,
  dashboardAuth: (req) => {
    // Check IP
    const ip = req.ip || req.connection?.remoteAddress;
    if (ip === '127.0.0.1' || ip === '::1') return true;
    
    // Check token
    const token = req.headers['x-dashboard-token'];
    if (token === process.env.DASHBOARD_SECRET) return true;
    
    // Deny by default
    return false;
  }
}));

app.listen(3000);
```

### Test

```bash
# Start server
DASHBOARD_SECRET="my-secret-token" node examples/example-dashboard-security.js

# Access without token (should return 403)
curl http://localhost:3000/_crashless

# Access with wrong token (should return 403)
curl -H "x-dashboard-token: wrong-token" http://localhost:3000/_crashless

# Access with correct token (should work)
curl -H "x-dashboard-token: my-secret-token" http://localhost:3000/_crashless
```

---

## Example 3: Production Mode (Dashboard Disabled)

### Code

```javascript
import express from 'express';
import crashless from 'crashless';

const app = express();

// Dashboard automatically disabled in production
app.use(crashless({
  enableDashboard: true, // Will be overridden by NODE_ENV=production
}));

app.listen(3000);
```

### Test

```bash
# Start in production mode
NODE_ENV=production node examples/example-dashboard-security.js

# Try to access dashboard (should return 404 or not exist)
curl http://localhost:3000/_crashless
```

---

## Example 4: Combined Security

### Code

```javascript
import express from 'express';
import crashless from 'crashless';

const app = express();

app.use(crashless({
  enableDashboard: true,
  dashboardAuth: (req) => {
    // Priority 1: Check IP whitelist from env var
    if (process.env.DASHBOARD_ALLOWED_IPS) {
      const allowedIPs = process.env.DASHBOARD_ALLOWED_IPS.split(',').map(ip => ip.trim());
      const clientIP = req.ip || req.connection?.remoteAddress;
      if (allowedIPs.includes(clientIP)) return true;
    }
    
    // Priority 2: Check localhost
    const ip = req.ip || req.connection?.remoteAddress;
    if (ip === '127.0.0.1' || ip === '::1') return true;
    
    // Priority 3: Check token
    const token = req.headers['x-dashboard-token'];
    if (token === process.env.DASHBOARD_SECRET) return true;
    
    // Deny by default
    return false;
  }
}));

app.listen(3000);
```

### Test

```bash
# Start with both IP whitelist and token
DASHBOARD_ALLOWED_IPS="127.0.0.1" \
DASHBOARD_SECRET="my-secret" \
node examples/example-dashboard-security.js

# Test from localhost (should work)
curl http://localhost:3000/_crashless

# Test with token (should work)
curl -H "x-dashboard-token: my-secret" http://localhost:3000/_crashless
```

---

## Running Security Tests

### Automated Test Script

```bash
# Run Node.js test script
npm run test:security

# Or run bash test script
npm run test:security:bash

# Or directly
./scripts/test-dashboard-security.sh
node scripts/test-dashboard-security.js
```

### Manual Testing

```bash
# 1. Start server with IP whitelist
DASHBOARD_ALLOWED_IPS="127.0.0.1" node examples/example-dashboard-security.js

# 2. In another terminal, test access
curl -v http://localhost:3011/_crashless

# 3. Test with token
DASHBOARD_SECRET="test123" node examples/example-dashboard-security.js
curl -H "x-dashboard-token: test123" http://localhost:3011/_crashless

# 4. Test production mode
NODE_ENV=production node examples/example-dashboard-security.js
curl http://localhost:3011/_crashless  # Should return 404
```

---

## Security Best Practices

1. **Always use authentication in production**
2. **Use IP whitelist for internal networks**
3. **Use token authentication for external access**
4. **Consider reverse proxy authentication**
5. **Disable dashboard in production if not needed**
6. **Use metrics export endpoints instead of dashboard in production**

---

## Environment Variables

- `DASHBOARD_ALLOWED_IPS` - Comma-separated list of allowed IPs
- `DASHBOARD_SECRET` - Secret token for dashboard access
- `NODE_ENV` - Set to `production` to disable dashboard by default

---

For more details, see [SECURITY.md](../SECURITY.md).

## Related Documentation

- [Security Guide](../SECURITY.md) - Complete security documentation
- [Examples Guide](EXAMPLES.md) - Example usage and configurations

