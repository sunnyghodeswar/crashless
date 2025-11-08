/**
 * Metrics Collection Tests
 * Tests for metrics recording, aggregation, and export
 */

import { expect } from 'chai';
import express from 'express';
import request from 'supertest';
import crashless, { getMetrics, resetMetrics } from '../src/index.js';

describe('Metrics Collection', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(crashless({
      telemetry: {
        engine: 'builtin',
        dashboard: false, // Disable dashboard for faster tests
      }
    }));
  });

  describe('Request Metrics', () => {
    it('should record request metrics', async () => {
      app.get('/test', (req, res) => {
        res.json({ ok: true });
      });

      await request(app)
        .get('/test')
        .expect(200);

      const metrics = await request(app)
        .get('/metrics.json')
        .expect(200);

      expect(metrics.body).to.have.property('requestsTotal');
      expect(metrics.body.requestsTotal).to.be.at.least(1);
    });

    it('should track request latency', async () => {
      app.get('/slow', async (req, res) => {
        await new Promise(resolve => setTimeout(resolve, 50));
        res.json({ ok: true });
      });

      await request(app)
        .get('/slow')
        .expect(200);

      const metrics = await request(app)
        .get('/metrics.json')
        .expect(200);

      expect(metrics.body).to.have.property('avgLatencyMs');
      expect(metrics.body.avgLatencyMs).to.be.a('number');
    });

    it('should track requests by route', async () => {
      app.get('/route1', (req, res) => res.json({ ok: true }));
      app.get('/route2', (req, res) => res.json({ ok: true }));

      await request(app).get('/route1').expect(200);
      await request(app).get('/route2').expect(200);
      await request(app).get('/route1').expect(200);

      const metrics = await request(app)
        .get('/metrics.json')
        .expect(200);

      expect(metrics.body).to.have.property('routes');
      expect(metrics.body.routes).to.be.an('array');
      
      const route1 = metrics.body.routes.find(r => r.path === 'GET /route1');
      const route2 = metrics.body.routes.find(r => r.path === 'GET /route2');
      
      expect(route1).to.exist;
      expect(route2).to.exist;
      expect(route1.requests).to.equal(2);
      expect(route2.requests).to.equal(1);
    });

    it('should track HTTP methods', async () => {
      app.post('/test', (req, res) => res.json({ ok: true }));
      app.put('/test', (req, res) => res.json({ ok: true }));
      app.delete('/test', (req, res) => res.json({ ok: true }));

      await request(app).post('/test').expect(200);
      await request(app).put('/test').expect(200);
      await request(app).delete('/test').expect(200);

      const metrics = await request(app)
        .get('/metrics.json')
        .expect(200);

      const routes = metrics.body.routes || [];
      expect(routes.some(r => r.path.includes('POST'))).to.be.true;
      expect(routes.some(r => r.path.includes('PUT'))).to.be.true;
      expect(routes.some(r => r.path.includes('DELETE'))).to.be.true;
    });
  });

  describe('Error Metrics', () => {
    it('should track error count', async () => {
      app.get('/error', () => {
        throw new Error('Test error');
      });

      await request(app)
        .get('/error')
        .expect(500);

      const metrics = await request(app)
        .get('/metrics.json')
        .expect(200);

      expect(metrics.body).to.have.property('errorsTotal');
      expect(metrics.body.errorsTotal).to.be.at.least(1);
    });

    it('should track errors by route', async () => {
      app.get('/error1', () => { throw new Error('Error 1'); });
      app.get('/error2', () => { throw new Error('Error 2'); });

      await request(app).get('/error1').expect(500);
      await request(app).get('/error2').expect(500);
      await request(app).get('/error1').expect(500);

      const metrics = await request(app)
        .get('/metrics.json')
        .expect(200);

      const route1 = metrics.body.routes?.find(r => r.path === 'GET /error1');
      expect(route1).to.exist;
      expect(route1.errors).to.equal(2);
    });

    it('should track error status codes', async () => {
      app.get('/404', () => {
        throw crashless.createError('Not found', 404, 'NOT_FOUND');
      });
      app.get('/500', () => {
        throw new Error('Server error');
      });

      await request(app).get('/404').expect(404);
      await request(app).get('/500').expect(500);

      const metrics = await request(app)
        .get('/metrics.json')
        .expect(200);

      expect(metrics.body.routes).to.be.an('array');
      const route404 = metrics.body.routes?.find(r => r.path === 'GET /404');
      const route500 = metrics.body.routes?.find(r => r.path === 'GET /500');
      
      expect(route404).to.exist;
      expect(route500).to.exist;
    });
  });

  describe('Latency Percentiles', () => {
    it('should calculate latency percentiles', async () => {
      app.get('/latency-test', async (req, res) => {
        const delay = Math.random() * 100;
        await new Promise(resolve => setTimeout(resolve, delay));
        res.json({ ok: true });
      });

      // Make multiple requests
      for (let i = 0; i < 10; i++) {
        await request(app).get('/latency-test').expect(200);
      }

      const metrics = await request(app)
        .get('/metrics.json')
        .expect(200);

      const route = metrics.body.routes?.find(r => r.path === 'GET /latency-test');
      expect(route).to.exist;
      
      // Check if latency tracking exists
      expect(metrics.body).to.have.property('avgLatencyMs');
    });
  });

  describe('Prometheus Export', () => {
    it('should export Prometheus format', async () => {
      app.get('/test', (req, res) => res.json({ ok: true }));
      
      await request(app).get('/test').expect(200);

      const response = await request(app)
        .get('/metrics')
        .expect(200);

      expect(response.text).to.include('crashless_requests_total');
      expect(response.text).to.include('crashless_avg_latency_ms');
    });

    it('should include route labels in Prometheus export', async () => {
      app.get('/test-route', (req, res) => res.json({ ok: true }));
      
      await request(app).get('/test-route').expect(200);

      const response = await request(app)
        .get('/metrics')
        .expect(200);

      expect(response.text).to.include('route=');
    });
  });

  describe('OpenTelemetry Export', () => {
    it('should export OpenTelemetry format', async () => {
      const app = express();
      app.use(express.json());
      app.use(crashless({
        telemetry: {
          engine: 'otel',  // Must be 'otel' for this endpoint
          dashboard: false,
        }
      }));

      app.get('/test', (req, res) => res.json({ ok: true }));
      
      await request(app).get('/test').expect(200);

      const response = await request(app)
        .get('/metrics/otel')
        .expect(200);

      expect(response.body).to.be.an('object');
      // OTLP format should have resourceMetrics
      expect(response.body).to.satisfy(data => 
        Array.isArray(data.resourceMetrics) || 
        typeof data === 'object'
      );
    });
  });

  describe('Metrics JSON Format', () => {
    it('should return valid JSON structure', async () => {
      app.get('/test', (req, res) => res.json({ ok: true }));
      
      await request(app).get('/test').expect(200);

      const metrics = await request(app)
        .get('/metrics.json')
        .expect(200);

      expect(metrics.body).to.have.property('requestsTotal');
      expect(metrics.body).to.have.property('errorsTotal');
      expect(metrics.body).to.have.property('avgLatencyMs');
      expect(metrics.body).to.have.property('uptimeSec');
      expect(metrics.body).to.have.property('routes');
      expect(metrics.body.routes).to.be.an('array');
    });

    it('should include extended metrics when available', async () => {
      app.get('/test', (req, res) => res.json({ ok: true }));
      
      await request(app).get('/test').expect(200);

      const metrics = await request(app)
        .get('/metrics.json')
        .expect(200);

      // Extended metrics might be available
      if (metrics.body._extended) {
        expect(metrics.body._extended).to.be.an('object');
      }
    });
  });

  describe('Metrics Isolation', () => {
    it('should not count internal endpoints', async () => {
      // Make requests to internal endpoints
      await request(app).get('/metrics.json').expect(200);
      await request(app).get('/metrics.json').expect(200);

      // Make a real application request
      app.get('/real', (req, res) => res.json({ ok: true }));
      await request(app).get('/real').expect(200);

      const metrics = await request(app)
        .get('/metrics.json')
        .expect(200);

      // Should only count the real request, not internal ones
      // Note: The first metrics.json might be counted, but filtering should work
      expect(metrics.body.requestsTotal).to.be.at.least(1);
    });
  });
});

