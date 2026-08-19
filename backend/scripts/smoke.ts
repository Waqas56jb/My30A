import { env } from '../src/config/env.js';

const base = `http://127.0.0.1:${env.PORT}`;

type Result = { name: string; ok: boolean; status: number; detail?: string };

const results: Result[] = [];

async function hit(
  name: string,
  path: string,
  init: RequestInit = {},
  expectStatus: number | number[] = 200,
) {
  const allowed = Array.isArray(expectStatus) ? expectStatus : [expectStatus];
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) },
  });
  const text = await res.text();
  let body: { success?: boolean; error?: { code?: string; message?: string }; data?: unknown } = {};
  try {
    body = JSON.parse(text) as typeof body;
  } catch {
    body = {};
  }
  const ok = allowed.includes(res.status);
  results.push({
    name,
    ok,
    status: res.status,
    detail: ok ? undefined : body.error?.message ?? text.slice(0, 180),
  });
  if (!ok) return body;
  return body;
}

async function login(email: string, password: string, role: string) {
  const body = await hit(
    `login ${role} ${email}`,
    '/api/v1/auth/login',
    { method: 'POST', body: JSON.stringify({ email, password, role }) },
    200,
  );
  return (body.data as { token?: string })?.token ?? '';
}

async function main() {
  await hit('health', '/health', {}, [200, 503]);
  await hit('restaurants', '/api/v1/restaurants');
  await hit('partners', '/api/v1/partners');
  await hit('beaches', '/api/v1/beaches');
  await hit('events', '/api/v1/events');
  await hit('map', '/api/v1/map/entities');
  await hit('weather', '/api/v1/weather');
  await hit('weather alias', '/api/v1/explore/weather');
  await hit('categories', '/api/v1/local-guide/categories');
  await hit('pricing', '/api/v1/pricing');
  await hit('tracking policy', '/api/v1/partners/tracking-policy');

  const sarah = await login('sarah@my30a.com', 'demo1234', 'GUEST');
  const alex = await login('alex@my30a.com', 'demo1234', 'GUEST');
  const michael = await login('michael@coastalkey30a.com', 'demo1234', 'HOST');
  const glow = await login('glow@30abonfires.com', 'demo1234', 'PARTNER');
  const alicia = await login('alicia@my30a.com', 'admin1234', 'ADMIN');
  const tom = await login('tom@my30a.com', 'admin1234', 'ADMIN');

  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

  await hit('guest me', '/api/v1/guests/me', { headers: auth(sarah) });
  await hit('guest stay', '/api/v1/stays/current', { headers: auth(sarah) });
  await hit('authorized property', '/api/v1/properties/authorized', { headers: auth(sarah) });
  await hit('alex no wifi', '/api/v1/properties/authorized', { headers: auth(alex) }, 403);
  await hit('guest grocery list', '/api/v1/grocery', { headers: auth(sarah) });
  await hit('alex hidden grocery', '/api/v1/grocery/GR-1024', { headers: auth(alex) }, 404);
  await hit('guest transfers', '/api/v1/transfers', { headers: auth(sarah) });
  await hit('guest notifications', '/api/v1/notifications', { headers: auth(sarah) });
  await hit('guest conversations', '/api/v1/conversations', { headers: auth(sarah) });
  await hit('host grocery forbidden', '/api/v1/grocery', { headers: auth(michael) }, 403);
  await hit('host properties', '/api/v1/hosts/me/properties', { headers: auth(michael) });
  await hit('host guests', '/api/v1/hosts/me/guests', { headers: auth(michael) });
  await hit('host analytics', '/api/v1/hosts/me/analytics', { headers: auth(michael) });
  await hit('partner me', '/api/v1/partners/me', { headers: auth(glow) });
  await hit('partner analytics', '/api/v1/partners/me/analytics', { headers: auth(glow) });
  await hit('admin overview', '/api/v1/admin/overview', { headers: auth(alicia) });
  await hit('admin guests', '/api/v1/admin/guests', { headers: auth(alicia) });
  await hit('admin hosts', '/api/v1/admin/hosts', { headers: auth(alicia) });
  await hit('admin partners', '/api/v1/admin/partners', { headers: auth(alicia) });
  await hit('admin properties', '/api/v1/admin/properties', { headers: auth(alicia) });
  await hit('admin audit', '/api/v1/admin/audit', { headers: auth(alicia) });
  await hit('admin settings', '/api/v1/admin/settings', { headers: auth(alicia) });
  await hit('admin knowledge', '/api/v1/admin/knowledge', { headers: auth(alicia) });
  await hit('admin payments empty', '/api/v1/admin/payments', { headers: auth(alicia) });
  await hit('content cannot confirm grocery', '/api/v1/grocery/GR-1024/status', {
    method: 'POST',
    headers: auth(tom),
    body: JSON.stringify({ status: 'confirmed' }),
  }, 403);
  await hit('pay blocked', '/api/v1/grocery/GR-1024/pay', { method: 'POST', headers: auth(sarah) }, 503);
  await hit('unauthenticated me', '/api/v1/auth/me', {}, 401);

  const failed = results.filter((r) => !r.ok);
  for (const row of results) {
    console.log(`${row.ok ? 'PASS' : 'FAIL'} ${row.status} ${row.name}${row.detail ? ` — ${row.detail}` : ''}`);
  }
  if (failed.length) {
    console.error(`\n${failed.length} smoke checks failed`);
    process.exit(1);
  }
  console.log(`\n${results.length} smoke checks passed`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
