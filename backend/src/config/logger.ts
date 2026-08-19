import pino from 'pino';
import { env } from './env.js';

const onVercel = Boolean(process.env.VERCEL);
const pretty = !onVercel && env.NODE_ENV !== 'production';

export const logger = pino({
  level: env.NODE_ENV === 'production' || onVercel ? 'info' : 'debug',
  transport: pretty
    ? {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: 'SYS:standard' },
      }
    : undefined,
  redact: [
    'JWT_SECRET',
    'SESSION_SECRET',
    'SMTP_PASSWORD',
    'SUPABASE_SERVICE_ROLE_KEY',
    'SUPABASE_DB_PASSWORD',
    'OPENAI_API_KEY',
    'req.headers.authorization',
  ],
});
