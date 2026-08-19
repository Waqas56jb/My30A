import dotenv from 'dotenv';
import { z } from 'zod';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const envPath = existsSync(resolve(process.cwd(), '.env'))
  ? resolve(process.cwd(), '.env')
  : resolve(process.cwd(), 'backend/.env');

dotenv.config({ path: envPath });

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  APP_URL: z.string().default('http://localhost:4000'),
  CORS_ORIGINS: z.string().default(
    'http://localhost:5173,http://localhost:5180,http://localhost:5185,http://localhost:5190',
  ),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  HOST_URL: z.string().default('http://localhost:5180'),
  PARTNER_URL: z.string().default('http://localhost:5185'),
  ADMIN_URL: z.string().default('http://localhost:5190'),
  SOCKET_CORS_ORIGIN: z.string().optional(),

  SUPABASE_URL: z.string().min(1),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional().default(''),

  SUPABASE_DB_URL: z.string().min(1),
  SUPABASE_POOLER_URL: z.string().min(1),

  OPENAI_API_KEY: z.string().min(1),
  OPENAI_MODEL: z.string().min(1),
  OPENAI_MODEL_FALLBACK: z.string().optional().default(''),
  OPENAI_PROJECT_NAME: z.string().default('My30A Host'),

  SMTP_HOST: z.string().default('smtp.gmail.com'),
  SMTP_PORT: z.coerce.number().default(465),
  SMTP_SECURE: z
    .string()
    .optional()
    .transform((v) => v !== 'false'),
  SMTP_USER: z.string().min(1),
  SMTP_PASSWORD: z.string().min(1),
  SMTP_FROM: z.string().min(1),
  OFFICIAL_EMAIL: z.string().email(),

  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('12h'),
  SESSION_SECRET: z.string().min(32),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  RATE_LIMIT_MAX: z.coerce.number().default(300),

  OPEN_METEO_BASE_URL: z.string().default('https://api.open-meteo.com/v1'),
  WEATHER_LAT: z.coerce.number().default(30.2766),
  WEATHER_LON: z.coerce.number().default(-86.1258),
  WEATHER_CACHE_TTL_SECONDS: z.coerce.number().default(900),

  PAYMENT_PROVIDER: z.enum(['none', 'stripe']).default('none'),

  EVENTS_FEED_URL: z.string().default('https://30a.com/events/feed/'),
  EVENTS_ICAL_URL: z.string().optional().default(''),
  OPENTABLE_SEARCH_TERM: z.string().default('30A Santa Rosa Beach'),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('\n');
  const message = `Invalid environment configuration:\n${issues}`;
  console.error(message);
  throw new Error(message);
}

export const env = parsed.data;

export const corsOrigins = env.CORS_ORIGINS.split(',')
  .map((s) => s.trim())
  .filter(Boolean);

export const socketOrigins = (env.SOCKET_CORS_ORIGIN ?? env.CORS_ORIGINS)
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

export function requireServiceRole(): string {
  if (!env.SUPABASE_SERVICE_ROLE_KEY.trim()) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is empty. Copy the service_role key from Supabase Dashboard → Project Settings → API. The anon/publishable key cannot be used for server-side privileged work.',
    );
  }
  return env.SUPABASE_SERVICE_ROLE_KEY;
}

export const hasServiceRole = Boolean(env.SUPABASE_SERVICE_ROLE_KEY.trim());
