# Security Guide

Security best practices for using Crashless in production.

## Dashboard Security

### Default Behavior

**Development:**
- Dashboard enabled by default
- Accessible at `/_crashless`
- No authentication required

**Production:**
- Dashboard **disabled by default** (`NODE_ENV=production`)
- Must be explicitly enabled
- Should always use authentication

### Security Best Practices

#### 1. Never Expose Dashboard Publicly

❌ **Bad:**
```javascript
app.use(crashless({
  enableDashboard: true // Accessible to anyone
}));
```

✅ **Good:**
```javascript
app.use(crashless({
  enableDashboard: true,
  dashboardAuth: (req) => {
    return req.ip === '127.0.0.1';
  }
}));
```

#### 2. Use IP Whitelist

```bash
# Set allowed IPs via environment variable
export DASHBOARD_ALLOWED_IPS="127.0.0.1,10.0.0.1,192.168.1.100"
```

```javascript
app.use(crashless({
  dashboardAuth: (req) => {
    const ip = req.ip || req.connection?.remoteAddress;
    const allowedIPs = process.env.DASHBOARD_ALLOWED_IPS?.split(',') || [];
    return allowedIPs.includes(ip);
  }
}));
```

#### 3. Use Token Authentication

```javascript
app.use(crashless({
  enableDashboard: true,
  dashboardAuth: (req) => {
    const token = req.headers['x-dashboard-token'];
    return token === process.env.DASHBOARD_SECRET;
  }
}));
```

#### 4. Use Reverse Proxy

```nginx
# Nginx configuration
location /_crashless {
  allow 10.0.0.0/8;  # Internal network
  deny all;
  proxy_pass http://localhost:3000;
}
```

---

## Error Message Security

### Production Mode

**Automatic masking:**
- Sensitive error messages hidden
- Stack traces not exposed
- Generic error messages shown

```javascript
// Production mode (NODE_ENV=production)
app.use(crashless({
  maskMessages: true  // Automatically true
}));

// User sees:
// {
//   "success": false,
//   "message": "Internal server error",
//   "code": "ERR_500"
// }
```

### Development Mode

**Full details:**
- Error messages visible
- Stack traces exposed
- Detailed debugging info

```javascript
// Development mode
app.use(crashless({
  maskMessages: false  // Automatically false
}));

// Developer sees:
// {
//   "success": false,
//   "message": "Database connection failed: postgres://...",
//   "code": "DB_ERROR",
//   "stack": "Error: Database connection..."
// }
```

---

## Data Exposure Risks

### What Dashboard Exposes

**If accessed:**
- Internal API structure (routes, paths)
- Error patterns and frequencies
- Performance bottlenecks
- Request/response patterns
- Stack traces (if enabled)

### Mitigation

1. **Disable dashboard in production**
2. **Use authentication**
3. **Restrict network access**
4. **Use metrics export instead**

---

## Security Configuration Examples

### Example 1: IP Whitelist

```javascript
app.use(crashless({
  dashboardAuth: (req) => {
    const ip = req.ip || req.connection?.remoteAddress;
    const allowedIPs = ['127.0.0.1', '10.0.0.1'];
    return allowedIPs.includes(ip);
  }
}));
```

### Example 2: Token Authentication

```javascript
app.use(crashless({
  dashboardAuth: (req) => {
    const token = req.headers['x-dashboard-token'];
    return token === process.env.DASHBOARD_SECRET;
  }
}));
```

### Example 3: Combined Auth

```javascript
app.use(crashless({
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
```

---

## Recommendations

### For Development

- Dashboard enabled is fine
- No authentication needed
- Full error details helpful

### For Staging

- Use IP whitelist
- Restrict to internal network
- Monitor access

### For Production

- Disable dashboard by default
- Use metrics export endpoints
- If dashboard needed, use strong authentication
- Consider reverse proxy authentication

---

## Next Steps

- [Configuration Guide](/docs/configuration) - Security configuration options
- [Examples](/docs/examples) - Security-focused examples

