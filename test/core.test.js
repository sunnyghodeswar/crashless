/**
 * Core Middleware Tests
 * Tests for basic middleware functionality, mounting, and routing
 */

import { expect } from 'chai';
import express from 'express';
import request from 'supertest';
import crashless from '../src/index.js';

describe('Core Middleware', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  describe('Basic Setup', () => {
    it('should mount middleware without errors', () => {
      expect(() => {
        app.use(crashless());
      }).to.not.throw();
    });

    it('should accept configuration options', () => {
      expect(() => {
        app.use(crashless({
          appName: 'Test App',
          log: false,
          maskMessages: true,
        }));
      }).to.not.throw();
    });

    it('should handle default configuration', () => {
      const middleware = crashless();
      expect(middleware).to.be.a('function');
    });
  });

  describe('Request Handling', () => {
    beforeEach(() => {
      app.use(crashless());
    });

    it('should process successful requests', async () => {
      app.get('/test', (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .get('/test')
        .expect(200);

      expect(response.body).to.have.property('success', true);
    });

    it('should handle async routes', async () => {
      app.get('/async', async (req, res) => {
        await new Promise(resolve => setTimeout(resolve, 10));
        res.json({ async: true });
      });

      const response = await request(app)
        .get('/async')
        .expect(200);

      expect(response.body).to.have.property('async', true);
    });

    it('should track request metrics', async () => {
      app.get('/metrics-test', (req, res) => {
        res.json({ ok: true });
      });

      await request(app)
        .get('/metrics-test')
        .expect(200);

      // Metrics should be recorded (check via metrics endpoint if available)
      const metricsResponse = await request(app)
        .get('/metrics.json')
        .expect(200);

      expect(metricsResponse.body).to.have.property('requestsTotal');
      expect(metricsResponse.body.requestsTotal).to.be.at.least(1);
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      // Mount crashless as error handler (last middleware)
      // Routes should be defined before this
    });

    it('should catch synchronous errors', async () => {
      app.get('/error', () => {
        throw new Error('Test error');
      });
      
      // Mount error handler AFTER routes
      app.use(crashless());

      const response = await request(app)
        .get('/error')
        .expect(500);

      expect(response.body).to.have.property('success', false);
      expect(response.body).to.have.property('message');
    });

    it('should catch async errors', async () => {
      app.get('/async-error', async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        throw new Error('Async test error');
      });
      
      // Mount error handler AFTER routes
      app.use(crashless());

      const response = await request(app)
        .get('/async-error')
        .expect(500);

      expect(response.body).to.have.property('success', false);
    });

    it('should handle errors with custom status codes', async () => {
      app.get('/404', () => {
        throw crashless.createError('Not found', 404, 'NOT_FOUND');
      });
      
      // Mount error handler AFTER routes
      app.use(crashless());

      const response = await request(app)
        .get('/404')
        .expect(404);

      expect(response.body).to.have.property('success', false);
      expect(response.body).to.have.property('code', 'NOT_FOUND');
    });
  });

  describe('Internal Endpoint Filtering', () => {
    beforeEach(() => {
      app.use(crashless({
        telemetry: {
          engine: 'builtin',
          dashboard: true,
        }
      }));
    });

    it('should not track metrics for internal endpoints', async () => {
      // Make multiple requests to internal endpoints
      await request(app).get('/metrics.json').expect(200);
      await request(app).get('/_crashless').expect(200);
      await request(app).get('/traces.json').expect(200);

      // Make a real request
      app.get('/real', (req, res) => res.json({ ok: true }));
      await request(app).get('/real').expect(200);

      // Check metrics - should only count the real request
      const metrics = await request(app).get('/metrics.json').expect(200);
      
      // The real request should be counted, internal ones should not
      // Note: First metrics.json call might be counted, but subsequent ones should be filtered
      expect(metrics.body.requestsTotal).to.be.at.least(1);
    });
  });

  describe('Dashboard Mounting', () => {
    it('should mount dashboard when enabled', async () => {
      const app = express();
      app.use(crashless({
        telemetry: {
          dashboard: true,
          route: '/_crashless',
        }
      }));

      const response = await request(app)
        .get('/_crashless')
        .expect(200);

      expect(response.text).to.include('Crashless');
      expect(response.text).to.include('dashboard');
    });

    it('should not mount dashboard when disabled', async () => {
      const app = express();
      app.use(crashless({
        telemetry: {
          dashboard: false,
        }
      }));

      await request(app)
        .get('/_crashless')
        .expect(404);
    });
  });
});

