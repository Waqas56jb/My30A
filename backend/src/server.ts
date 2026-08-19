import express from 'express';
import { createServer } from 'node:http';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { createApp } from './app.js';

function boot() {
  try {
    return createApp();
  } catch (error) {
    logger.error({ err: error }, 'createApp failed');
    const app = express();
    const body = {
      status: 'crash',
      service: 'my30a-host-backend',
      message: error instanceof Error ? error.message : String(error),
    };
    app.use((_req, res) => {
      res.status(500).json(body);
    });
    return app;
  }
}

const app = boot();

if (!process.env.VERCEL) {
  void startLocal(app);
}

async function startLocal(appInstance: ReturnType<typeof boot>) {
  const { attachSockets } = await import('./sockets/io.js');
  const { verifyOpenAiModel } = await import('./integrations/openai/openai.js');
  const { verifyEmail } = await import('./integrations/email/emailService.js');
  const { ensureWebPush } = await import('./services/pushService.js');
  const { startJobs } = await import('./jobs/scheduler.js');

  const server = createServer(appInstance);
  attachSockets(server);
  server.listen(env.PORT, async () => {
    logger.info({ port: env.PORT }, 'My30A Host backend listening');
    await verifyOpenAiModel();
    await verifyEmail();
    await ensureWebPush().catch((error) => logger.warn({ err: error }, 'web push setup skipped'));
    startJobs();
  });
}

