import { createServer } from 'node:http';
import { env, hasServiceRole } from './config/env.js';
import { logger } from './config/logger.js';
import { createApp } from './app.js';
import { attachSockets } from './sockets/io.js';
import { verifyOpenAiModel } from './integrations/openai/openai.js';
import { verifyEmail } from './integrations/email/emailService.js';
import { startJobs } from './jobs/scheduler.js';

if (!hasServiceRole) {
  logger.error(
    'SUPABASE_SERVICE_ROLE_KEY is empty. Add the service_role key from Supabase Dashboard → Project Settings → API. Storage signed URLs and privileged Supabase admin calls will fail. The API will still start so Postgres-backed routes can be verified.',
  );
}

const app = createApp();
const server = createServer(app);
attachSockets(server);

server.listen(env.PORT, async () => {
  logger.info({ port: env.PORT }, 'My30A Host backend listening');
  await verifyOpenAiModel();
  await verifyEmail();
  startJobs();
});
