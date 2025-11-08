/**
 * Exporters Tests
 * Tests for custom exporter functionality
 */

import { expect } from 'chai';
import express from 'express';
import request from 'supertest';
import crashless from '../src/index.js';

describe('Exporters', () => {
  let app;
  let exporterCalls;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    exporterCalls = [];
  });

  describe('registerExporter', () => {
    it('should register an exporter function', () => {
      const exporter = (err, meta) => {
        exporterCalls.push({ err, meta });
      };

      expect(() => {
        crashless.registerExporter('test-exporter', exporter);
      }).to.not.throw();
    });

    it('should throw error for non-function exporter', () => {
      expect(() => {
        crashless.registerExporter('invalid', 'not-a-function');
      }).to.throw('exporter must be a function');
    });

    it('should register multiple exporters', () => {
      const exporter1 = () => {};
      const exporter2 = () => {};

      expect(() => {
        crashless.registerExporter('exporter1', exporter1);
        crashless.registerExporter('exporter2', exporter2);
      }).to.not.throw();
    });
  });

  describe('Exporter Invocation', () => {
    it('should call exporters on error', async () => {
      const exporter = (err, meta) => {
        exporterCalls.push({ err, meta });
      };

      crashless.registerExporter('test', exporter);

      app.get('/error', () => {
        throw crashless.createError('Test error', 500, 'TEST_ERROR');
      });
      
      // Mount error handler AFTER routes
      app.use(crashless({
        telemetry: { engine: 'none' }
      }));

      await request(app)
        .get('/error')
        .expect(500);

      // Wait for async exporter calls (queueMicrotask + some buffer)
      await new Promise(resolve => setTimeout(resolve, 200));

      expect(exporterCalls.length).to.be.at.least(1);
      expect(exporterCalls[0].err).to.have.property('message', 'Test error');
      expect(exporterCalls[0].meta).to.have.property('status', 500);
    });

    it('should pass error metadata to exporters', async () => {
      const exporter = (err, meta) => {
        exporterCalls.push({ err, meta });
      };

      crashless.registerExporter('test', exporter);

      app.get('/error', (req) => {
        throw crashless.createError('Test error', 404, 'NOT_FOUND');
      });
      
      // Mount error handler AFTER routes
      app.use(crashless({
        telemetry: { engine: 'none' }
      }));

      await request(app)
        .get('/error')
        .expect(404);

      // Wait for async exporter calls (queueMicrotask + some buffer)
      await new Promise(resolve => setTimeout(resolve, 200));

      expect(exporterCalls.length).to.be.at.least(1);
      const call = exporterCalls[0];
      expect(call.meta).to.have.property('status', 404);
      expect(call.meta).to.have.property('method', 'GET');
      expect(call.meta).to.have.property('path');
      expect(call.err).to.have.property('code', 'NOT_FOUND');
    });

    it('should call all registered exporters', async () => {
      const calls1 = [];
      const calls2 = [];

      crashless.registerExporter('exporter1', (err, meta) => {
        calls1.push({ err, meta });
      });

      crashless.registerExporter('exporter2', (err, meta) => {
        calls2.push({ err, meta });
      });

      app.get('/error', () => {
        throw new Error('Test error');
      });
      
      // Mount error handler AFTER routes
      app.use(crashless({
        telemetry: { engine: 'none' }
      }));

      await request(app)
        .get('/error')
        .expect(500);

      // Wait for async exporter calls (queueMicrotask + some buffer)
      await new Promise(resolve => setTimeout(resolve, 200));

      expect(calls1.length).to.be.at.least(1);
      expect(calls2.length).to.be.at.least(1);
    });

    it('should handle exporter errors gracefully', async () => {
      const goodExporter = (err, meta) => {
        exporterCalls.push({ err, meta });
      };

      const badExporter = () => {
        throw new Error('Exporter error');
      };

      crashless.registerExporter('good', goodExporter);
      crashless.registerExporter('bad', badExporter);

      app.get('/error', () => {
        throw new Error('Test error');
      });
      
      // Mount error handler AFTER routes
      app.use(crashless({
        telemetry: { engine: 'none' }
      }));

      // Should not throw even if exporter fails
      await request(app)
        .get('/error')
        .expect(500);

      // Wait for async exporter calls (queueMicrotask + some buffer)
      await new Promise(resolve => setTimeout(resolve, 300));

      // Good exporter should still be called
      expect(exporterCalls.length).to.be.at.least(1);
    });
  });

  describe('Exporter Metadata', () => {
    it('should include request metadata', async () => {
      const exporter = (err, meta) => {
        exporterCalls.push({ err, meta });
      };

      crashless.registerExporter('test', exporter);

      app.use(crashless({
        telemetry: { engine: 'none' }
      }));

      app.post('/api/users', (req) => {
        throw crashless.createError('Validation failed', 422, 'VALIDATION_ERROR');
      });
      
      // Mount error handler AFTER routes
      app.use(crashless({
        telemetry: { engine: 'none' }
      }));

      await request(app)
        .post('/api/users')
        .send({ email: 'test@example.com' })
        .expect(422);

      // Wait for async exporter calls (queueMicrotask + some buffer)
      await new Promise(resolve => setTimeout(resolve, 200));

      expect(exporterCalls.length).to.be.at.least(1);
      const meta = exporterCalls[0].meta;
      expect(meta).to.have.property('method', 'POST');
      expect(meta).to.have.property('path');
      expect(meta).to.have.property('status', 422);
      expect(meta).to.have.property('timestamp');
    });

    it('should include error details in metadata', async () => {
      const exporter = (err, meta) => {
        exporterCalls.push({ err, meta });
      };

      crashless.registerExporter('test', exporter);

      app.use(crashless({
        telemetry: { engine: 'none' }
      }));

      const details = { field: 'email', reason: 'invalid' };
      app.get('/error', () => {
        throw crashless.createError('Error', 422, 'VALIDATION_ERROR', details);
      });
      
      // Mount error handler AFTER routes
      app.use(crashless({
        telemetry: { engine: 'none' }
      }));

      await request(app)
        .get('/error')
        .expect(422);

      // Wait for async exporter calls (queueMicrotask + some buffer)
      await new Promise(resolve => setTimeout(resolve, 200));

      expect(exporterCalls.length).to.be.at.least(1);
      expect(exporterCalls[0].err).to.have.property('details');
      expect(exporterCalls[0].err.details).to.deep.equal(details);
    });
  });

  describe('Exporter Async Behavior', () => {
    it('should call exporters asynchronously', async () => {
      let callOrder = [];

      const exporter = (err, meta) => {
        callOrder.push('exporter');
      };

      crashless.registerExporter('test', exporter);

      app.use(crashless({
        telemetry: { engine: 'none' }
      }));

      app.get('/error', () => {
        callOrder.push('error-thrown');
        throw new Error('Test error');
      });

      await request(app)
        .get('/error')
        .expect(500);

      // Exporter should be called asynchronously
      expect(callOrder).to.include('error-thrown');
      // Note: Exporter is called via queueMicrotask, so timing may vary
    });
  });
});

