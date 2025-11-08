/**
 * Dashboard Tests
 * Tests for dashboard endpoint and HTML generation
 */

import { expect } from 'chai';
import express from 'express';
import request from 'supertest';
import crashless from '../src/index.js';

describe('Dashboard', () => {
  describe('Dashboard Endpoint', () => {
    it('should serve dashboard HTML when enabled', async () => {
      const app = express();
      app.use(crashless({
        telemetry: {
          engine: 'builtin',
          dashboard: true,
          route: '/_crashless'
        }
      }));

      const response = await request(app)
        .get('/_crashless')
        .expect(200)
        .expect('Content-Type', /html/);

      expect(response.text).to.include('Crashless');
      expect(response.text).to.include('dashboard');
    });

    it('should serve dashboard with custom app name', async () => {
      const app = express();
      app.use(crashless({
        appName: 'My Custom App',
        telemetry: {
          engine: 'builtin',
          dashboard: true
        }
      }));

      const response = await request(app)
        .get('/_crashless')
        .expect(200);

      expect(response.text).to.include('My Custom App');
    });

    it('should return 404 when dashboard is disabled', async () => {
      const app = express();
      app.use(crashless({
        telemetry: {
          dashboard: false
        }
      }));

      await request(app)
        .get('/_crashless')
        .expect(404);
    });

    it('should serve dashboard at custom route', async () => {
      const app = express();
      app.use(crashless({
        telemetry: {
          engine: 'builtin',
          dashboard: true,
          route: '/custom-dashboard'
        }
      }));

      await request(app)
        .get('/custom-dashboard')
        .expect(200);

      await request(app)
        .get('/_crashless')
        .expect(404);
    });
  });

  describe('Dashboard Views', () => {
    it('should serve system dashboard view', async () => {
      const app = express();
      app.use(crashless({
        telemetry: {
          engine: 'builtin',
          dashboard: true
        }
      }));

      const response = await request(app)
        .get('/_crashless/system')
        .expect(200);

      expect(response.text).to.include('Crashless');
    });

    it('should serve errors dashboard view', async () => {
      const app = express();
      app.use(crashless({
        telemetry: {
          engine: 'builtin',
          dashboard: true
        }
      }));

      const response = await request(app)
        .get('/_crashless/crashes')
        .expect(200);

      expect(response.text).to.include('Crashless');
    });

    it('should serve traces dashboard view when tracing enabled', async () => {
      const app = express();
      app.use(crashless({
        telemetry: {
          engine: 'builtin',
          dashboard: true,
          traces: {
            enabled: true,
            samplingRate: 1,
            maxStored: 100
          }
        }
      }));

      const response = await request(app)
        .get('/_crashless/traces')
        .expect(200);

      expect(response.text).to.include('Crashless');
    });
  });

  describe('Dashboard Data Endpoints', () => {
    it('should serve metrics JSON for dashboard', async () => {
      const app = express();
      app.use(crashless({
        telemetry: {
          engine: 'builtin',
          dashboard: true
        }
      }));

      app.get('/test', (req, res) => res.json({ ok: true }));
      await request(app).get('/test').expect(200);

      const response = await request(app)
        .get('/metrics.json')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).to.have.property('requestsTotal');
      expect(response.body).to.have.property('errorsTotal');
    });

    it('should serve traces JSON for dashboard', async () => {
      const app = express();
      app.use(crashless({
        telemetry: {
          engine: 'builtin',
          dashboard: true,
          traces: {
            enabled: true,
            samplingRate: 1,
            maxStored: 100
          }
        }
      }));

      app.get('/test', (req, res) => res.json({ ok: true }));
      await request(app).get('/test').expect(200);

      await new Promise(resolve => setTimeout(resolve, 100));

      const response = await request(app)
        .get('/traces.json')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).to.have.property('traces');
      expect(response.body).to.have.property('stats');
    });
  });

  describe('Dashboard Content', () => {
    it('should include Alpine.js for reactivity', async () => {
      const app = express();
      app.use(crashless({
        telemetry: {
          engine: 'builtin',
          dashboard: true
        }
      }));

      const response = await request(app)
        .get('/_crashless')
        .expect(200);

      expect(response.text).to.include('alpine');
      expect(response.text).to.include('x-data');
    });

    it('should include ECharts for visualizations', async () => {
      const app = express();
      app.use(crashless({
        telemetry: {
          engine: 'builtin',
          dashboard: true
        }
      }));

      const response = await request(app)
        .get('/_crashless')
        .expect(200);

      expect(response.text).to.include('echarts');
      expect(response.text).to.include('chart');
    });

    it('should include Tailwind CSS for styling', async () => {
      const app = express();
      app.use(crashless({
        telemetry: {
          engine: 'builtin',
          dashboard: true
        }
      }));

      const response = await request(app)
        .get('/_crashless')
        .expect(200);

      expect(response.text).to.include('tailwind');
    });
  });
});

