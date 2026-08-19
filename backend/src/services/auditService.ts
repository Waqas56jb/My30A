import type { PoolClient } from 'pg';
import { query } from '../config/db.js';
import type { AppRole } from '../types/index.js';

export async function recordAudit(
  input: {
    actorId?: string | null;
    actorRole?: AppRole | string | null;
    actorName?: string | null;
    action: string;
    entity: string;
    entityId?: string | null;
    metadata?: unknown;
    ip?: string | null;
    userAgent?: string | null;
    status?: string;
  },
  client?: PoolClient,
) {
  const sql = `insert into audit_logs
    (actor_id, actor_role, actor_name, action, entity, entity_id, metadata, ip, user_agent, status)
    values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`;
  const params = [
    input.actorId ?? null,
    input.actorRole ?? null,
    input.actorName ?? null,
    input.action,
    input.entity,
    input.entityId ?? null,
    JSON.stringify(input.metadata ?? {}),
    input.ip ?? '—',
    input.userAgent ?? null,
    input.status ?? 'success',
  ];
  if (client) await client.query(sql, params);
  else await query(sql, params);
}
