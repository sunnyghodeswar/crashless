/**
 * 🚀 Crashless Custom Exporters Example
 *
 * Demonstrates custom telemetry exporters (Sentry, Datadog, custom logging, etc.)
 *
 * Run: node examples/example-exporters.js
 */

import express from "express";
import crashless from "../src/crashless.js";

const PORT = 3006;
const app = express();

app.use(express.json());

// Register custom exporters BEFORE creating middleware
crashless.registerExporter("sentry", (err, meta) => {
  // Simulate Sentry export
  console.log(`📡 [SENTRY] Error captured:`, {
    message: err.message,
    code: err.code,
    status: meta.status,
    path: meta.path,
    method: meta.method,
    timestamp: meta.timestamp,
  });
});

crashless.registerExporter("datadog", (err, meta) => {
  // Simulate Datadog export
  console.log(`📊 [DATADOG] Metrics sent:`, {
    error_count: 1,
    error_code: err.code,
    http_status: meta.status,
    endpoint: meta.path,
  });
});

crashless.registerExporter("custom-logger", (err, meta) => {
  // Custom structured logging
  console.log(
    `📝 [CUSTOM LOGGER]`,
    JSON.stringify(
      {
        level: "error",
        error: {
          message: err.message,
          code: err.code,
          stack: err.stack?.split("\n").slice(0, 3).join("\n"),
        },
        request: {
          method: meta.method,
          path: meta.path,
          status: meta.status,
          timestamp: meta.timestamp,
        },
      },
      null,
      2
    )
  );
});

crashless.registerExporter("metrics-aggregator", (err, meta) => {
  // Simulate sending to metrics aggregator
  console.log(`📈 [METRICS]`, {
    metric: "crashless.errors",
    tags: {
      code: err.code,
      status: meta.status,
      path: meta.path,
    },
    value: 1,
  });
});

// One-liner setup with custom exporters
app.use(crashless({
  log: true,
  maskMessages: false,
  appName: 'Custom Exporters API',
  telemetry: {
    engine: "builtin",
    dashboard: true,
    route: "/_crashless",
    exportInterval: 5000,
  },
  // Custom telemetry callback
  onTelemetry: (err, meta) => {
    console.log(`🔔 [ON-TELEMETRY] Custom callback:`, {
      error: err.message,
      code: err.code,
      path: meta.path,
    });
  },
}));

// Routes
app.get("/", (req, res) => {
  res.json({
    message: "Custom exporters example",
    exporters: ["sentry", "datadog", "custom-logger", "metrics-aggregator"],
    endpoints: {
      dashboard: `http://localhost:${PORT}/_crashless`,
      metrics: `http://localhost:${PORT}/metrics.json`,
    },
  });
});

app.get("/users/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (id === 404) {
    throw crashless.createError("User not found", 404, "USER_NOT_FOUND");
  }
  res.json({ id, name: `User ${id}` });
});

app.post("/users", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    throw crashless.createError("Email required", 422, "VALIDATION_ERROR");
  }
  res.status(201).json({ id: Math.random(), email });
});

app.get("/db-error", async (req, res) => {
  throw crashless.createError("Database connection failed", 500, "DB_ERROR");
});

app.get("/auth-error", async (req, res) => {
  throw crashless.createError("Unauthorized", 401, "AUTH_ERROR");
});

app.listen(PORT, () => {
  console.log(`\n🚀 Custom Exporters Example - http://localhost:${PORT}`);
  console.log(`   Dashboard: http://localhost:${PORT}/_crashless`);
  console.log(`   Metrics: http://localhost:${PORT}/metrics.json\n`);
  console.log("Registered exporters:");
  console.log("  - sentry (simulated)");
  console.log("  - datadog (simulated)");
  console.log("  - custom-logger (JSON logging)");
  console.log("  - metrics-aggregator (simulated)\n");
  console.log("Watch console for exporter output when errors occur!\n");
});

// Test different error types
setTimeout(() => {
  console.log("\n🧪 Testing exporters...\n");

  setTimeout(
    () => fetch(`http://localhost:${PORT}/users/404`).catch(() => {}),
    500
  );
  setTimeout(
    () => fetch(`http://localhost:${PORT}/db-error`).catch(() => {}),
    1000
  );
  setTimeout(
    () => fetch(`http://localhost:${PORT}/auth-error`).catch(() => {}),
    1500
  );
  setTimeout(() => {
    fetch(`http://localhost:${PORT}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "No Email" }),
    }).catch(() => {});
  }, 2000);
}, 2000);
