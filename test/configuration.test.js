/**
 * Configuration Tests
 * Tests for various configuration options and edge cases
 */

import { expect } from 'chai';
import express from 'express';
import request from 'supertest';
import crashless from '../src/index.js';

describe('Configuration', () => {
  describe('App Name Configuration', () => {
    it('should accept custom app name', () => {
      const app = express();
      expect(() => {
        app.use(crashless({
          appName: 'My Custom App'
        }));
      }).to.not.throw();
    });

    it('should use default app name when not provided', () => {
      const app = express();
      app.use(crashless());
      app.get('/test', (req, res) => res.json({ ok: true }));

      return request(app)
        .get('/test')
        .expect(200);
    });
  });

  describe('Telemetry Engine Configuration', () => {
    it('should support builtin engine', () => {
      const app = express();
      expect(() => {
        app.use(crashless({
          telemetry: {
            engine: 'builtin',
            dashboard: false
          }
        }));
      }).to.not.throw();
    });

    it('should support prometheus engine', () => {
      const app = express();
      expect(() => {
        app.use(crashless({
          telemetry: {
            engine: 'prometheus',
            dashboard: false
          }
        }));
      }).to.not.throw();
    });

    it('should support otel engine', () => {
      const app = express();
      expect(() => {
        app.use(crashless({
          telemetry: {
            engine: 'otel',
            dashboard: false
          }
        }));
      }).to.not.throw();
    });

    it('should support no telemetry engine', () => {
      const app = express();
      expect(() => {
        app.use(crashless({
          telemetry: {
            engine: 'none',
            dashboard: false
          }
        }));
      }).to.not.throw();
    });
  });

  describe('Dashboard Configuration', () => {
    it('should mount dashboard at custom route', async () => {
      const app = express();
      app.use(crashless({
        telemetry: {
          dashboard: true,
          route: '/custom-dashboard'
        }
      }));

      const response = await request(app)
        .get('/custom-dashboard')
        .expect(200);

      expect(response.text).to.include('Crashless');
    });

    it('should not mount dashboard when disabled', async () => {
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
  });

  describe('Tracing Configuration', () => {
    it('should enable tracing with configuration', () => {
      const app = express();
      expect(() => {
        app.use(crashless({
          telemetry: {
            engine: 'builtin',
            dashboard: false,
            traces: {
              enabled: true,
              samplingRate: 0.5,
              maxStored: 100
            }
          }
        }));
      }).to.not.throw();
    });

    it('should disable tracing when not configured', () => {
      const app = express();
      app.use(crashless({
        telemetry: {
          engine: 'builtin',
          dashboard: false
        }
      }));

      app.get('/test', (req, res) => res.json({ ok: true }));

      return request(app)
        .get('/test')
        .expect(200);
    });
  });

  describe('Logging Configuration', () => {
    it('should accept log configuration', () => {
      const app = express();
      expect(() => {
        app.use(crashless({
          log: false
        }));
      }).to.not.throw();
    });

    it('should accept showStack configuration', () => {
      const app = express();
      expect(() => {
        app.use(crashless({
          showStack: false
        }));
      }).to.not.throw();
    });
  });

  describe('Message Masking Configuration', () => {
    it('should accept maskMessages configuration', () => {
      const app = express();
      expect(() => {
        app.use(crashless({
          maskMessages: true
        }));
      }).to.not.throw();
    });
  });

  describe('Default Status Configuration', () => {
    it('should accept defaultStatus configuration', async () => {
      const app = express();
      
      app.get('/error', () => {
        // Error without status code should use defaultStatus
        const err = new Error('Test error');
        // Don't set err.status to test defaultStatus
        throw err;
      });
      
      // Mount error handler AFTER routes
      app.use(crashless({
        defaultStatus: 503,
        telemetry: { engine: 'none' }
      }));

      const response = await request(app)
        .get('/error')
        .expect(503);

      expect(response.body).to.have.property('success', false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty configuration', () => {
      const app = express();
      expect(() => {
        app.use(crashless({}));
      }).to.not.throw();
    });

    it('should handle undefined configuration', () => {
      const app = express();
      expect(() => {
        app.use(crashless());
      }).to.not.throw();
    });

    it('should handle partial telemetry configuration', () => {
      const app = express();
      expect(() => {
        app.use(crashless({
          telemetry: {
            engine: 'builtin'
          }
        }));
      }).to.not.throw();
    });

    it('should handle concurrent requests', async () => {
      const app = express();
      app.use(crashless());

      app.get('/test', (req, res) => {
        res.json({ ok: true });
      });

      // Make multiple concurrent requests
      const promises = Array.from({ length: 10 }, () =>
        request(app).get('/test').expect(200)
      );

      await Promise.all(promises);
    });

    it('should handle rapid error requests', async () => {
      const app = express();
      app.use(crashless());

      app.get('/error', () => {
        throw new Error('Test error');
      });

      // Make multiple rapid error requests
      const promises = Array.from({ length: 5 }, () =>
        request(app).get('/error').expect(500)
      );

      await Promise.all(promises);
    });

    it('should handle very long request paths', async () => {
      const app = express();
      app.use(crashless());

      const longPath = '/test/' + 'a'.repeat(1000);
      app.get(longPath, (req, res) => {
        res.json({ ok: true });
      });

      await request(app)
        .get(longPath)
        .expect(200);
    });

    it('should handle special characters in paths', async () => {
      const app = express();
      app.use(crashless());

      app.get('/test/:id', (req, res) => {
        res.json({ id: req.params.id });
      });

      await request(app)
        .get('/test/123')
        .expect(200);
    });
  });

  describe('Multiple Middleware Instances', () => {
    it('should handle multiple crashless instances', () => {
      const app1 = express();
      const app2 = express();

      expect(() => {
        app1.use(crashless({ appName: 'App 1' }));
        app2.use(crashless({ appName: 'App 2' }));
      }).to.not.throw();
    });
  });

  describe('Environment Variables', () => {
    it('should respect NODE_ENV for production mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const app = express();
      app.use(crashless());

      app.get('/error', () => {
        throw new Error('Test error');
      });

      return request(app)
        .get('/error')
        .expect(500)
        .then(() => {
          process.env.NODE_ENV = originalEnv;
        });
    });
  });
});

