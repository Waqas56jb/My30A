import pg from 'pg';
import { env, envReady } from './env.js';
import { logger } from './logger.js';

const { Pool } = pg;
const onVercel = Boolean(process.env.VERCEL);

export const pool = new Pool({
  connectionString: env.SUPABASE_POOLER_URL,
  max: onVercel ? 1 : 12,
  idleTimeoutMillis: onVercel ? 4_000 : 20_000,
  connectionTimeoutMillis: onVercel ? 3_000 : 15_000,
  allowExitOnIdle: onVercel,
  ssl: { rejectUnauthorized: false },
});

function sessionPoolerUrl() {
  try {
    const url = new URL(env.SUPABASE_POOLER_URL);
    url.port = '5432';
    return url.toString();
  } catch {
    return env.SUPABASE_POOLER_URL;
  }
}

export const migratePool = onVercel
  ? pool
  : new Pool({
      connectionString: env.SUPABASE_DB_URL,
      max: 2,
      ssl: { rejectUnauthorized: false },
    });

export const migrateFallbackPool = onVercel
  ? pool
  : new Pool({
      connectionString: sessionPoolerUrl(),
      max: 2,
      ssl: { rejectUnauthorized: false },
    });

export async function connectMigrator() {
  try {
    const client = await migratePool.connect();
    await client.query('select 1');
    return { client, pool: migratePool };
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'ENOTFOUND' || code === 'ECONNREFUSED' || code === 'ETIMEDOUT') {
      logger.warn('Direct database host unreachable; using session pooler for migrations');
      const client = await migrateFallbackPool.connect();
      return { client, pool: migrateFallbackPool };
    }
    throw error;
  }
}

export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<pg.QueryResult<T>> {
  return pool.query<T>(text, params);
}

export async function withTransaction<T>(fn: (client: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function pingDatabase(): Promise<boolean> {
  if (!envReady) return false;
  try {
    await pool.query('select 1 as ok');
    return true;
  } catch (error) {
    logger.error({ err: error }, 'database ping failed');
    return false;
  }
}
