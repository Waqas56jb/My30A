import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { connectMigrator, migrateFallbackPool, migratePool } from '../src/config/db.js';
import { logger } from '../src/config/logger.js';

async function main() {
  const { client, pool } = await connectMigrator();
  try {
    await client.query(`
      create table if not exists schema_migrations (
        id text primary key,
        applied_at timestamptz not null default now()
      )
    `);
    const dir = resolve(process.cwd(), 'supabase/migrations');
    const files = readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
    for (const file of files) {
      const applied = await client.query(`select 1 from schema_migrations where id = $1`, [file]);
      if (applied.rowCount) {
        logger.info({ file }, 'already applied');
        continue;
      }
      const sql = readFileSync(resolve(dir, file), 'utf8');
      await client.query(sql);
      await client.query(`insert into schema_migrations (id) values ($1)`, [file]);
      logger.info({ file }, 'applied migration');
    }
  } finally {
    client.release();
    await pool.end();
    if (pool !== migratePool) await migratePool.end().catch(() => undefined);
    if (pool !== migrateFallbackPool) await migrateFallbackPool.end().catch(() => undefined);
  }
}

main().catch((error) => {
  logger.error(error);
  process.exit(1);
});
