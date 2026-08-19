import { createServer } from 'node:http';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { createApp } from './app.js';
import { attachSockets } from './sockets/io.js';
import { verifyOpenAiModel } from './integrations/openai/openai.js';
import { verifyEmail } from './integrations/email/emailService.js';
import { ensureWebPush } from './services/pushService.js';
import { startJobs } from './jobs/scheduler.js';

const app = createApp();
const server = createServer(app);
attachSockets(server);

server.listen(env.PORT, async () => {
  logger.info({ port: env.PORT }, 'My30A Host backend listening');
  await verifyOpenAiModel();
  await verifyEmail();
  await ensureWebPush().catch((error) => logger.warn({ err: error }, 'web push setup skipped'));
  startJobs();
});
