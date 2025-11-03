feat: Implement complete observability system with automatic tracing and redesigned dashboards

## 🚀 Core Features

### Automatic Distributed Tracing System
- Zero-configuration distributed tracing using AsyncLocalStorage for transparent context propagation
- Automatic trace creation for all HTTP requests with hierarchical span structure
- Child spans for nested operations (fetch calls, DB queries, async operations)
- Event-based span annotations for lightweight operation tracking
- In-memory trace storage with configurable sampling and retention
- OTLP-compatible trace export for integration with Tempo, Jaeger, and other observability tools

### Auto-Instrumentation
- Automatic patching of global `fetch()` API to create child spans for HTTP client calls
- Automatic patching of `fs.readFile()` for file I/O operation tracking
- Transparent trace context propagation across async boundaries using AsyncLocalStorage
- No manual instrumentation required - fully automatic tracing

### Three-Dashboard Architecture
- **System Dashboard**: High-level overview with metrics cards, performance charts, route tables, and system stats
- **Errors & Crashes Dashboard**: Error summary, timeline charts, top failing routes, and live error stream with stack traces
- **Traces Dashboard**: Trace list, hierarchical waterfall view, and attribute inspector
- Unified header bar with theme toggle, auto-refresh controls, and dashboard switcher
- Single-page application with in-view dashboard switching (no navigation)

### Metrics & Observability
- Real-time request/error tracking with atomic operations to prevent double counting
- Latency percentiles (p50, p95, p99) per route with histogram tracking
- Error rate calculation and trend analysis
- Route-level performance metrics with status code breakdown
- Prometheus-compatible metrics export
- OpenTelemetry metrics export

### Smart Filtering
- Middleware-level exclusion of internal observability endpoints
- Automatic filtering of `/metrics.json`, `/traces.json`, `/_crashless/*`, and other internal routes
- Mathematically accurate metrics reflecting only real application traffic
- Cleaner dashboards without self-introspection noise

## 📊 Dashboard Improvements

### Header Controls
- Theme toggle (Light/Dark mode) with persistence
- Auto-refresh toggle with configurable intervals (5s, 10s, 30s, 60s)
- Manual refresh button with text label
- App name display in header (replaces "Observability Hub")
- Sticky header for always-visible controls

### System Dashboard
- Overview cards: Total Requests, Errors, Avg Latency, Uptime
- Performance charts: Throughput, Error Rate Timeline, Latency Over Time
- Latency Percentiles by Route (interactive chart)
- Route Performance table with p50/p95/p99, status codes, and request counts
- System & Process Stats placeholder

### Errors Dashboard
- Error summary: Total, 4xx vs 5xx breakdown, error rate
- Error Frequency Timeline chart
- Top Failing Routes visualization
- Live Error Stream with expandable stack traces
- Advanced filtering: status code, error type, search

### Traces Dashboard
- Recent traces list with trace ID, route, duration, span count, status
- Hierarchical Waterfall View showing nested spans with proper indentation
- Color-coded spans by kind (client=blue, internal=green, server=gray)
- Event display within spans (DB calls, fetch operations)
- Attribute Inspector for detailed span metadata
- Automatic filtering of internal endpoints

### Chart Improvements
- Fixed grid alignments (increased margins: left 10%, right 8%)
- Better label visibility with proper spacing
- Consistent chart styling across all dashboards
- Responsive design for mobile and desktop

## 🔧 Technical Improvements

### Trace Structure
- Root span for HTTP requests with automatic naming
- Child spans for async operations (fetch, DB, file I/O)
- Event annotations for lightweight operation tracking
- Proper parent-child relationships in span hierarchy
- Trace sampling support (rate-based or percentage-based)

### API Enhancements
- One-line API: `app.use(crashless({ telemetry: { traces: { enabled: true } } }))`
- Manual span creation API: `trace.startSpan()` from `crashless/trace-context.js`
- Trace export endpoints: `/traces.json` (Crashless format) and `/traces.json?format=otlp` (OTLP format)
- Configurable tracing: sampling rate, max traces, max age

### Code Organization
- Modular dashboard architecture: `dashboard-template.js`, `dashboard-component.js`, `dashboard-helpers.js`
- Separated concerns: HTML template, Alpine.js component, helper utilities
- Clean separation of tracing logic in `tracing.js`

### Error Handling
- Atomic error recording to prevent double counting
- Automatic error correlation with traces
- Error span status marking in trace context
- Comprehensive error metadata capture

## 📝 Examples & Documentation

- Complete tracing demo (`examples/tracing-demo.js`) with multiple async operations
- Automatic tracing example (`examples/example-automatic-tracing.js`) showing one-line setup
- Updated examples demonstrating automatic fetch() and fs patching

## 🎯 Performance

- Near-zero overhead with asynchronous operations using microtask queues
- In-memory storage for low latency
- Optional sampling to reduce overhead (configurable 1 in N requests)
- Efficient trace storage with automatic cleanup

This update transforms Crashless from a basic error handler into a complete, production-ready observability platform with automatic tracing, comprehensive metrics, and beautiful dashboards.

