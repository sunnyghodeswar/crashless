# Crashless Test Suite

Comprehensive test suite for Crashless observability middleware.

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (if available)
npm test -- --watch

# Run specific test file
npm test -- test/core.test.js

# Run with coverage (if configured)
npm test -- --coverage
```

## Test Structure

### `setup.js`
Test environment configuration and global setup/teardown.

### Test Files

- **`core.test.js`** - Core middleware functionality, mounting, request handling
- **`error-handling.test.js`** - Error creation, normalization, handling, masking
- **`metrics.test.js`** - Metrics collection, aggregation, Prometheus/OTLP export
- **`tracing.test.js`** - Distributed tracing, span creation, OTLP export
- **`dashboard.test.js`** - Dashboard endpoints, HTML generation, views
- **`exporters.test.js`** - Custom exporter registration and invocation
- **`configuration.test.js`** - Configuration options, edge cases, environment variables

## Test Coverage

### Core Functionality
- ✅ Middleware mounting and configuration
- ✅ Request processing and routing
- ✅ Async route handling
- ✅ Internal endpoint filtering

### Error Handling
- ✅ Error creation with `createError`
- ✅ Error normalization (string, null, undefined, Error objects)
- ✅ HTTP status code handling
- ✅ Error masking in production
- ✅ Stack trace visibility
- ✅ Client messages

### Metrics
- ✅ Request tracking and counting
- ✅ Latency measurement
- ✅ Route-level metrics
- ✅ Error tracking
- ✅ Prometheus export format
- ✅ OpenTelemetry export format
- ✅ Metrics JSON format

### Tracing
- ✅ Automatic trace creation
- ✅ Manual span creation
- ✅ Span attributes
- ✅ Trace sampling
- ✅ OTLP export format
- ✅ Trace statistics

### Dashboard
- ✅ Dashboard HTML generation
- ✅ Custom app name display
- ✅ Multiple dashboard views (System, Errors, Traces)
- ✅ Dashboard data endpoints

### Exporters
- ✅ Exporter registration
- ✅ Exporter invocation on errors
- ✅ Metadata passing
- ✅ Multiple exporters
- ✅ Error handling in exporters

### Configuration
- ✅ All configuration options
- ✅ Edge cases
- ✅ Environment variables
- ✅ Concurrent requests
- ✅ Multiple middleware instances

## Writing New Tests

When adding new features, follow these guidelines:

1. **Test Structure**: Use describe blocks for grouping related tests
2. **Isolation**: Each test should be independent - use beforeEach/afterEach for setup
3. **Assertions**: Use Chai's expect syntax for clear assertions
4. **Async Handling**: Use async/await for async operations
5. **Naming**: Use descriptive test names that explain what is being tested

### Example Test

```javascript
describe('Feature Name', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(crashless());
  });

  it('should do something specific', async () => {
    app.get('/test', (req, res) => {
      res.json({ ok: true });
    });

    const response = await request(app)
      .get('/test')
      .expect(200);

    expect(response.body).to.have.property('ok', true);
  });
});
```

## Test Dependencies

- **Mocha** - Test framework
- **Chai** - Assertion library
- **Supertest** - HTTP assertion library for Express
- **Express** - Web framework (for test apps)

## Continuous Integration

Tests should pass before:
- Creating pull requests
- Publishing to npm
- Merging to main branch

## Known Limitations

- Some tests may have timing dependencies (traces, async operations)
- Tests assume clean state between runs (use beforeEach for cleanup)
- Some features may require specific environment variables

