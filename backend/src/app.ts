import express from 'express';
import cors from 'cors';
import helmetImport from 'helmet';
import rateLimitImport from 'express-rate-limit';
import { resolve } from 'node:path';
import { env, envIssues, envReady, hasServiceRole, isAllowedOrigin } from './config/env.js';
import { requestId } from './middleware/requestId.js';
import { errorHandler } from './middleware/errorHandler.js';
import { pingDatabase } from './config/db.js';
import { openaiHealth } from './integrations/openai/openai.js';
import { emailVerified } from './integrations/email/emailService.js';
import { middlewareFactory } from './utils/middlewareFactory.js';

const helmet = middlewareFactory(helmetImport);
const rateLimit = middlewareFactory(rateLimitImport);

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  if (process.env.VERCEL || env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
  }
  app.use(requestId);
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors({ origin: (origin, cb) => cb(null, isAllowedOrigin(origin)), credentials: true }));
  app.use('/uploads', express.static(resolve(process.cwd(), 'uploads')));
  app.use('/api/v1/admin/me/avatar', express.json({ limit: '6mb' }));
  app.use(express.json({ limit: '1mb' }));
  app.use(
    rateLimit({
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      max: env.RATE_LIMIT_MAX,
      standardHeaders: true,
      legacyHeaders: false,
      validate: { xForwardedForHeader: false },
    }),
  );
  app.use(
    '/api/v1/auth',
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 40,
      standardHeaders: true,
      legacyHeaders: false,
      validate: { xForwardedForHeader: false },
    }),
  );
  app.use(
    '/api/v1/vitoria',
    rateLimit({
      windowMs: 60 * 1000,
      max: 20,
      standardHeaders: true,
      legacyHeaders: false,
      validate: { xForwardedForHeader: false },
    }),
  );

  app.get('/', (_req, res) => {
    res.json({
      service: 'my30a-host-backend',
      health: '/health',
      ready: envReady,
      issues: envIssues,
    });
  });

  app.get('/health', async (_req, res) => {
    if (!envReady) {
      res.status(503).json({
        status: 'misconfigured',
        service: 'my30a-host-backend',
        issues: envIssues,
        version: '1.0.0',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const database = (await pingDatabase()) ? 'connected' : 'down';
    const openai = openaiHealth();
    const email = emailVerified() ? 'verified' : 'unverified';
    const storage = hasServiceRole ? 'configured' : 'service_role_missing';
    const realtime = process.env.VERCEL ? 'not_started' : 'unknown';
    const ok = database === 'connected';
    res.status(ok ? 200 : 503).json({
      status: ok && openai.status !== 'unavailable' && hasServiceRole ? 'ok' : 'degraded',
      service: 'my30a-host-backend',
      database,
      openai: openai.status === 'ok' ? 'reachable' : openai.status === 'unavailable' ? 'model_unavailable' : 'unknown',
      openaiModel: openai.configured,
      email,
      storage,
      realtime,
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  });

  if (!envReady) {
    app.use('/api/v1', (_req, res) => {
      res.status(503).json({
        success: false,
        error: {
          code: 'MISCONFIGURED',
          message: 'Backend environment is incomplete. Set the missing keys on Vercel and redeploy.',
          details: envIssues,
        },
      });
    });
  } else {
    app.use('/api/v1', (req, res, next) => {
      void import('./routes/v1.js')
        .then(({ v1 }) => v1(req, res, next))
        .catch(next);
    });
  }

  app.use(errorHandler);
  return app;
}
