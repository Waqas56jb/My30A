import { createClient } from '@supabase/supabase-js';
import { env, hasServiceRole } from './env.js';

export function getServiceClient() {
  if (!hasServiceRole) return null;
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
