import { AppError, errors } from '../utils/errors.js';
import { query } from '../config/db.js';
import { getServiceClient } from '../config/supabase.js';
import { recordAudit } from './auditService.js';
import type { AuthAccount } from '../types/index.js';

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_BYTES = 8 * 1024 * 1024;

export async function uploadProof(
  account: AuthAccount,
  input: { entityId: string; entityType?: string; mimeType?: string; base64?: string; fileName?: string },
) {
  const client = getServiceClient();
  if (!client) {
    throw new AppError(
      503,
      'STORAGE_NOT_CONFIGURED',
      'Supabase storage is unavailable because SUPABASE_SERVICE_ROLE_KEY is not set.',
    );
  }
  if (!input.base64) throw errors.validation('A proof photo is required.');
  const mime = input.mimeType ?? 'image/jpeg';
  if (!ALLOWED.has(mime)) throw errors.validation('Use a JPEG, PNG, or WebP image.');
  const buffer = Buffer.from(input.base64, 'base64');
  if (buffer.length > MAX_BYTES) throw errors.validation('That file is too large. The limit is 8 MB.');

  const ext = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
  const path = `${input.entityType ?? 'grocery'}/${input.entityId}/${Date.now()}.${ext}`;
  const { error } = await client.storage.from('order-proof').upload(path, buffer, {
    contentType: mime,
    upsert: false,
  });
  if (error) throw errors.service('The proof photo could not be stored.');

  const { data: signed } = await client.storage.from('order-proof').createSignedUrl(path, 60 * 60);
  await query(
    `insert into files (bucket, path, entity_type, entity_id, uploaded_by, mime_type, size_bytes)
     values ('order-proof',$1,$2,$3,$4,$5,$6)`,
    [path, input.entityType ?? 'grocery', input.entityId, account.id, mime, buffer.length],
  );
  if ((input.entityType ?? 'grocery') === 'grocery') {
    await query(`update grocery_orders set delivery_photo_path = $2 where id = $1`, [input.entityId, path]);
  }
  await recordAudit({
    actorId: account.id,
    actorRole: account.role,
    action: 'Uploaded proof photo',
    entity: 'File',
    entityId: input.entityId,
  });
  return { bucket: 'order-proof', path, signedUrl: signed?.signedUrl ?? null };
}
