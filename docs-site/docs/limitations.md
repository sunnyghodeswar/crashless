# Limitations & Trade-offs

Honest documentation of what Crashless does and doesn't do.

## What Crashless Does

✅ **Error Handling** - Comprehensive and reliable  
✅ **HTTP Request Tracking** - All Express routes automatically instrumented  
✅ **Metrics Collection** - Efficient in-memory storage  
✅ **Basic Tracing** - Works for HTTP requests and `fetch()`/`fs.readFile()`  
✅ **Built-in Dashboard** - Real-time observability UI  

## What Crashless Doesn't Do

### Auto-Instrumentation Limitations

❌ **Database Libraries** - Prisma, Sequelize, Mongoose, TypeORM, etc. require manual instrumentation  
❌ **Redis Clients** - node-redis, ioredis require manual wrapping  
❌ **Message Queues** - RabbitMQ, Kafka, AWS SQS require manual instrumentation  
❌ **Custom HTTP Clients** - axios, got, node-fetch alternatives require manual instrumentation  
❌ **Other fs Methods** - Only `fs.readFile()` is auto-patched, not `writeFile`, `readdir`, etc.  

**Note:** HTTP requests (Express routes) **are** automatically instrumented. Only operations **within** those requests need manual instrumentation if they use libraries not covered by auto-patching.

### Technical Limitations

#### 1. Monkey-Patching

- **What it is:** Modifying global functions (`fetch()`, `fs.readFile()`)
- **Why it's fragile:** Can break with native modules, bundlers, or custom implementations
- **Impact:** May not work in all environments

#### 2. CDN Dependency

- **What it is:** Dashboard UI loads from CDN (Tailwind, Alpine.js, ECharts)
- **Why it's a limitation:** Requires internet connection
- **Impact:** Dashboard won't work offline

#### 3. Memory Storage

- **What it is:** All data stored in memory
- **Why it's a limitation:** Lost on server restart
- **Impact:** No persistence, limited by available memory

#### 4. Limited OTLP Support

- **What it is:** OpenTelemetry Protocol compatibility
- **Why it's limited:** Subset of OTLP features
- **Impact:** May not work with all OpenTelemetry tools

### Performance Limitations

- **Overhead:** 2-30% depending on configuration (not less than 1% as sometimes claimed)
- **Memory:** ~5-20MB typical usage
- **Scalability:** Not designed for extremely high traffic (>1000 req/s per instance)

---

## When to Use Crashless

### Ideal Use Cases

✅ **Small to medium applications** - Good fit for most APIs  
✅ **Development/staging** - Excellent for debugging  
✅ **Teams wanting simplicity** - No complex setup required  
✅ **Projects needing quick observability** - Get started fast  
✅ **Zero-dependency requirement** - No npm dependencies  

### Not Ideal For

❌ **Large-scale enterprise applications** - May need more features  
❌ **Applications requiring full OpenTelemetry** - Limited OTLP support  
❌ **Applications needing database auto-instrumentation** - Requires manual work  
❌ **Offline environments** - Dashboard requires CDN access  
❌ **Applications with strict less than 1% overhead requirement** - Typical overhead is 2-30%  

---

## Comparison with Alternatives

### vs Manual Error Handling

**Crashless provides:**
- Automatic error catching
- Consistent error format
- Built-in observability
- Less boilerplate code

**Manual approach:**
- Full control
- No overhead
- More code to maintain

### vs OpenTelemetry

**Crashless provides:**
- Simpler setup
- Built-in dashboard
- Zero dependencies
- Less configuration

**OpenTelemetry provides:**
- Industry standard
- Full library support
- More instrumentation options
- Better for enterprise

### vs Other Error Handling Libraries

**Crashless provides:**
- Built-in observability
- Dashboard and metrics
- Distributed tracing
- More features

**Other libraries provide:**
- Just error handling
- Smaller footprint
- Fewer features

---

## Known Issues

### 1. Auto-Patching May Fail

**Issue:** Monkey-patching can fail silently  
**Impact:** Tracing may not work for some operations  
**Workaround:** Use manual instrumentation  

### 2. Memory Growth

**Issue:** Memory can grow if cleanup isn't called  
**Impact:** Potential memory leaks  
**Workaround:** Ensure cleanup runs periodically (should be automatic)  

### 3. Dashboard CDN Dependency

**Issue:** Dashboard requires internet connection  
**Impact:** Won't work offline  
**Workaround:** Use metrics export endpoints instead  

---

## Future Improvements

1. **Better auto-instrumentation** - Support more libraries
2. **Offline dashboard** - Bundle UI resources
3. **Automatic cleanup** - Scheduled cleanup tasks
4. **More OTLP features** - Full OpenTelemetry compatibility
5. **Database instrumentation** - Auto-patch common DB libraries

---

## Transparency

This document provides honest limitations and trade-offs. Crashless prioritizes **simplicity** and **ease of use** over comprehensive feature coverage. It's designed for teams who want observability without the complexity of full APM solutions.

If you need:
- Full OpenTelemetry compatibility → Use OpenTelemetry SDK
- Database auto-instrumentation → Use specialized APM tools
- Less than 1% overhead → Use minimal configuration or manual error handling
- Offline dashboard → Use metrics export with custom dashboard

Crashless is a **pragmatic solution** that balances features, simplicity, and performance. It's not trying to replace enterprise APM tools, but rather provide a simple, zero-dependency alternative for teams who want observability without the complexity.

---

## Next Steps

- [Architecture](/docs/architecture) - How Crashless works
- [Performance Guide](/docs/performance) - Performance characteristics
- [Examples](/docs/examples) - Workarounds and patterns

