import dotenv from 'dotenv';
import { z } from 'zod';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const envPath = existsSync(resolve(process.cwd(), '.env'))
  ? resolve(process.cwd(), '.env')
  : resolve(process.cwd(), 'backend/.env');

dotenv.config({ path: envPath });

const LIVE_USER = 'https://my30a-user.vercel.app'
const LIVE_HOST = 'https://my30a-host.vercel.app'
const LIVE_PARTNER = 'https://my30a-partner.vercel.app'
const LIVE_ADMIN = 'https://my30a-admin.vercel.app'
const LIVE_API = 'https://my30a-server.vercel.app'
const LIVE_ORIGINS = [LIVE_USER, LIVE_HOST, LIVE_PARTNER, LIVE_ADMIN]
const LOCAL_ORIGINS =
  'http://localhost:5173,http://localhost:5180,http://localhost:5185,http://localhost:5190'

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  APP_URL: z.string().default(process.env.VERCEL ? LIVE_API : 'http://localhost:4000'),
  CORS_ORIGINS: z.string().default([...LIVE_ORIGINS, LOCAL_ORIGINS].join(',')),
  FRONTEND_URL: z.string().default(process.env.VERCEL ? LIVE_USER : 'http://localhost:5173'),
  HOST_URL: z.string().default(process.env.VERCEL ? LIVE_HOST : 'http://localhost:5180'),
  PARTNER_URL: z.string().default(process.env.VERCEL ? LIVE_PARTNER : 'http://localhost:5185'),
  ADMIN_URL: z.string().default(process.env.VERCEL ? LIVE_ADMIN : 'http://localhost:5190'),
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

export type AppEnv = z.infer<typeof schema>;

const placeholder: z.input<typeof schema> = {
  NODE_ENV: 'production',
  JWT_SECRET: 'x'.repeat(32),
  SESSION_SECRET: 'x'.repeat(32),
  SUPABASE_URL: 'https://placeholder.invalid',
  SUPABASE_ANON_KEY: 'missing',
  SUPABASE_DB_URL: 'postgresql://127.0.0.1:5432/postgres',
  SUPABASE_POOLER_URL: 'postgresql://127.0.0.1:5432/postgres',
  OPENAI_API_KEY: 'missing',
  OPENAI_MODEL: 'gpt-4o-mini',
  SMTP_USER: 'missing',
  SMTP_PASSWORD: 'missing',
  SMTP_FROM: 'missing@example.com',
  OFFICIAL_EMAIL: 'missing@example.com',
};

const parsed = schema.safeParse(process.env);

export const envIssues = parsed.success
  ? []
  : parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);

export const envReady = parsed.success;

if (envIssues.length) {
  const message = `Invalid environment configuration:\n${envIssues.join('\n')}`;
  console.error(message);
  // On Vercel a throw here becomes FUNCTION_INVOCATION_FAILED for every request.
  // Boot with placeholders and report the missing keys from /health instead.
  if (!process.env.VERCEL) {
    throw new Error(message);
  }
}

export const env: AppEnv = parsed.success ? parsed.data : schema.parse(placeholder);

export const corsOrigins = [
  ...new Set([
    ...env.CORS_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean),
    ...LIVE_ORIGINS,
  ]),
];

export const socketOrigins = [
  ...new Set([
    ...(env.SOCKET_CORS_ORIGIN ?? env.CORS_ORIGINS).split(',').map((s) => s.trim()).filter(Boolean),
    ...LIVE_ORIGINS,
  ]),
];

export function isAllowedOrigin(origin?: string | null) {
  if (!origin) return true
  if (corsOrigins.includes(origin) || socketOrigins.includes(origin)) return true
  try {
    const { hostname } = new URL(origin)
    return /^my30a-(user|host|partner|admin)(-[\w-]+)?\.vercel\.app$/.test(hostname)
  } catch {
    return false
  }
}

export function requireServiceRole(): string {
  if (!env.SUPABASE_SERVICE_ROLE_KEY.trim()) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is empty. Copy the service_role key from Supabase Dashboard → Project Settings → API. The anon/publishable key cannot be used for server-side privileged work.',
    );
  }
  return env.SUPABASE_SERVICE_ROLE_KEY;
}

export const hasServiceRole = Boolean(env.SUPABASE_SERVICE_ROLE_KEY.trim());
