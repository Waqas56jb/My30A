import { query } from '../config/db.js';
import { env } from '../config/env.js';
import { ACCESS_RULES, BEACH_ACCESS_SOURCE, FLAG_LEGEND } from '../data/beachAccessCatalog.js';
import { errors } from '../utils/errors.js';

export async function listBeachAccess(filters: { search?: string; useClass?: string; neighborhood?: string } = {}) {
  const params: unknown[] = [];
  let where = 'active = true and public_info = true';
  if (filters.useClass && filters.useClass !== 'all') {
    params.push(filters.useClass);
    where += ` and use_class = $${params.length}`;
  }
  if (filters.neighborhood && filters.neighborhood !== 'All') {
    params.push(filters.neighborhood);
    where += ` and neighborhood = $${params.length}`;
  }
  if (filters.search) {
    params.push(`%${filters.search}%`);
    where += ` and (name ilike $${params.length} or neighborhood ilike $${params.length} or description ilike $${params.length})`;
  }
  const { rows } = await query(
    `select * from beaches where ${where} order by
      case use_class when 'full_public' then 0 when 'limited_public' then 1 else 2 end,
      name`,
    params,
  );
  return {
    source: BEACH_ACCESS_SOURCE,
    rules: ACCESS_RULES,
    flags: FLAG_LEGEND,
    gated: false,
    access: rows.map(shapeAccess),
  };
}

export async function getBeachAccessPoint(id: string) {
  const { rows } = await query(`select * from beaches where id::text = $1 or slug = $1`, [id]);
  if (!rows[0]) throw errors.notFound('that beach access');
  return { ...shapeAccess(rows[0]), source: BEACH_ACCESS_SOURCE, rules: ACCESS_RULES, flags: FLAG_LEGEND, gated: false };
}

export async function getBeachConditions() {
  const cached = await query<{ payload: Record<string, unknown>; fetched_at: Date }>(
    `select payload, fetched_at from beach_conditions_cache where cache_key = 'south-walton'`,
  );
  const age = cached.rows[0] ? (Date.now() - new Date(cached.rows[0].fetched_at).getTime()) / 1000 : Infinity;
  if (age < env.WEATHER_CACHE_TTL_SECONDS && cached.rows[0]) {
    return cached.rows[0].payload;
  }

  const weather = await query<{ payload: Record<string, unknown> }>(
    `select payload from weather_cache order by fetched_at desc limit 1`,
  );
  const current = (weather.rows[0]?.payload?.current ?? {}) as Record<string, unknown>;
  const wind = Number(current.wind_speed_10m ?? 0);
  const estimated =
    wind >= 25 ? FLAG_LEGEND[1] : wind >= 15 ? FLAG_LEGEND[2] : FLAG_LEGEND[3];

  const payload = {
    official: false,
    gated: false,
    source: BEACH_ACCESS_SOURCE,
    sms: BEACH_ACCESS_SOURCE.flagSms,
    legend: FLAG_LEGEND,
    estimatedFlag: {
      ...estimated,
      meaning: `${estimated.meaning} Estimated from current wind at the 30A station. Confirm with the county flag or text SAFETY to 31279.`,
    },
    note: 'Walton County posts flags at Regional Beach Accesses. For live Gulf conditions and flag updates, text SAFETY to 31279.',
    fetchedAt: new Date().toISOString(),
  };
  await query(
    `insert into beach_conditions_cache (cache_key, payload, fetched_at) values ('south-walton',$1, now())
     on conflict (cache_key) do update set payload = $1, fetched_at = now()`,
    [JSON.stringify(payload)],
  );
  return payload;
}

function shapeAccess(row: Record<string, unknown>) {
  return {
    id: row.id,
    slug: row.slug,
    type: 'beach',
    name: row.name,
    description: row.description,
    location: row.location,
    neighborhood: row.neighborhood,
    useClass: row.use_class,
    accessKind: row.access_kind,
    useLabel: row.use_label,
    rules: row.rules,
    parking: row.parking,
    amenities: row.amenities ?? [],
    coordinates: row.latitude != null ? { lat: Number(row.latitude), lng: Number(row.longitude) } : null,
    source: row.source,
    sourceUrl: row.source_url,
    publicInfo: row.public_info,
    gated: false,
  };
}
