import { eventCoverImage, restaurantCoverImage } from '../data/listingImages.js';
import { catalogAsRow, catalogRestaurant, RESTAURANT_BOOKING_CATALOG } from '../data/restaurantBookingCatalog.js';
import { query } from '../config/db.js';
import { env } from '../config/env.js';
import { errors } from '../utils/errors.js';

export async function listRestaurants(filters: { search?: string; category?: string } = {}) {
  const params: unknown[] = [];
  let where = 'active = true';
  if (filters.category && filters.category !== 'All') {
    params.push(filters.category);
    where += ` and (cuisine ilike $${params.length} or category = $${params.length})`;
  }
  if (filters.search) {
    params.push(`%${filters.search}%`);
    where += ` and (name ilike $${params.length} or description ilike $${params.length})`;
  }
  const { rows } = await query(`select * from restaurants where ${where} order by featured desc, name`, params);
  const shaped = rows.map(shapeRestaurant);
  const seen = new Set(shaped.flatMap((row) => [String(row.id), String(row.slug ?? '')].filter(Boolean)));
  const needle = String(filters.search ?? '').trim().toLowerCase();
  const category = filters.category && filters.category !== 'All' ? String(filters.category).toLowerCase() : '';
  for (const item of RESTAURANT_BOOKING_CATALOG) {
    if (seen.has(item.id) || seen.has(item.slug)) continue;
    if (category && !item.cuisine.toLowerCase().includes(category) && item.cuisine.toLowerCase() !== category) continue;
    if (needle && !`${item.name} ${item.description} ${item.cuisine}`.toLowerCase().includes(needle)) continue;
    shaped.push(shapeRestaurant(catalogAsRow(item)));
  }
  return shaped;
}

export async function getRestaurant(id: string) {
  const catalog = catalogRestaurant(id, id);
  const { rows } = await query(
    `select * from restaurants where id::text = $1 or slug = $1 or ($2 != '' and slug = $2)`,
    [id, catalog?.slug ?? ''],
  );
  if (rows[0]) return shapeRestaurant(rows[0]);
  if (catalog) return shapeRestaurant(catalogAsRow(catalog));
  throw errors.notFound('that restaurant');
}

export async function listPartnersPublic(filters: { search?: string; category?: string } = {}) {
  const params: unknown[] = [];
  let where = `p.status = 'approved' and p.published = true and p.deleted_at is null`;
  if (filters.category && filters.category !== 'All') {
    params.push(filters.category);
    where += ` and (c.name = $${params.length} or c.slug = $${params.length})`;
  }
  if (filters.search) {
    params.push(`%${filters.search}%`);
    where += ` and (p.name ilike $${params.length} or p.description ilike $${params.length})`;
  }
  const { rows } = await query(
    `select p.id, p.name, p.slug, p.short_description, p.description, p.phone, p.website,
            p.address, p.town, p.state, p.latitude, p.longitude, p.starting_price_cents,
            p.price_unit, p.logo_url, p.cover_url, p.hours, p.services, p.tags,
            p.featured, p.status, p.listing_status, p.data_source, p.last_verified_date,
            c.name as category
     from partners p
     left join partner_categories c on c.id = p.category_id
     where ${where} order by p.featured desc, p.name`,
    params,
  );
  return rows.map(shapePartner);
}

export async function getPartnerPublic(id: string) {
  const { rows } = await query(
    `select p.id, p.name, p.slug, p.short_description, p.description, p.phone, p.website,
            p.address, p.town, p.state, p.latitude, p.longitude, p.starting_price_cents,
            p.price_unit, p.logo_url, p.cover_url, p.hours, p.services, p.tags,
            p.featured, p.status, p.listing_status, p.data_source, p.last_verified_date,
            c.name as category
     from partners p
     left join partner_categories c on c.id = p.category_id
     where (p.id::text = $1 or p.slug = $1) and p.status = 'approved' and p.published = true`,
    [id],
  );
  if (!rows[0]) throw errors.notFound('that partner');
  return shapePartner(rows[0]);
}

export async function listBeaches(search = '', useClass = '') {
  const params: unknown[] = [search, `%${search}%`];
  let extra = '';
  if (useClass && useClass !== 'all' && useClass !== 'All') {
    params.push(useClass);
    extra = ` and use_class = $${params.length}`;
  }
  const { rows } = await query(
    `select * from beaches where active = true and public_info = true
       and ($1 = '' or name ilike $2 or location ilike $2 or neighborhood ilike $2)
       ${extra}
     order by case use_class when 'full_public' then 0 when 'limited_public' then 1 else 2 end, name`,
    params,
  );
  return rows.map(shapeBeach);
}

export async function getBeach(id: string) {
  const { rows } = await query(`select * from beaches where id::text = $1 or slug = $1`, [id]);
  if (!rows[0]) throw errors.notFound('that beach');
  return shapeBeach(rows[0]);
}

export async function listEvents(filters: { search?: string; category?: string } = {}) {
  const params: unknown[] = [];
  let where = 'active = true';
  if (filters.category && filters.category !== 'All') {
    params.push(filters.category);
    where += ` and category = $${params.length}`;
  }
  if (filters.search) {
    params.push(`%${filters.search}%`);
    where += ` and title ilike $${params.length}`;
  }
  const { rows } = await query(`select * from events where ${where} order by event_date`, params);
  return rows.map(shapeEvent);
}

export async function getEvent(id: string) {
  const { rows } = await query(`select * from events where id::text = $1`, [id]);
  if (!rows[0]) throw errors.notFound('that event');
  return shapeEvent(rows[0]);
}

export async function getMapEntities() {
  const [restaurants, beaches, partners, events] = await Promise.all([
    listRestaurants(),
    listBeaches(),
    listPartnersPublic(),
    listEvents(),
  ]);
  return [
    ...restaurants.map((r) => ({ ...r, kind: 'restaurant' })),
    ...beaches.map((b) => ({ ...b, kind: 'beach' })),
    ...partners.map((p) => ({ ...p, kind: 'partner' })),
    ...events.map((e) => ({ ...e, kind: 'event', name: e.title })),
  ];
}

export async function getCategories() {
  const { rows } = await query(
    `select c.*, (select count(*)::int from partners p where p.category_id = c.id and p.status = 'approved' and p.published = true and p.deleted_at is null) as listings
     from partner_categories c where c.enabled = true order by sort_order`,
  );
  return rows.map((row) => ({ ...row, listings: Number(row.listings) || 0 }));
}

/** Admin sees every category, including hidden ones, with total listing counts. */
export async function listAdminCategories() {
  const { rows } = await query(
    `select c.id, c.name, c.slug, c.blurb, c.icon, c.sort_order, c.enabled, c.created_at,
            (select count(*)::int from partners p where p.category_id = c.id and p.deleted_at is null) as listings
     from partner_categories c
     order by c.sort_order, c.name`,
  );
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.blurb ?? '',
    blurb: row.blurb ?? '',
    icon: row.icon,
    image: null,
    order: Number(row.sort_order) || 0,
    enabled: row.enabled !== false,
    listings: Number(row.listings) || 0,
  }));
}

export async function getWeather(lat = env.WEATHER_LAT, lon = env.WEATHER_LON) {
  const key = `${lat},${lon}`;
  const cached = await query<{ payload: unknown; fetched_at: Date }>(
    `select payload, fetched_at from weather_cache where cache_key = $1`,
    [key],
  );
  const age = cached.rows[0]
    ? (Date.now() - new Date(cached.rows[0].fetched_at).getTime()) / 1000
    : Infinity;

  if (age < env.WEATHER_CACHE_TTL_SECONDS && cached.rows[0]) {
    return { ...((cached.rows[0].payload as Record<string, unknown>) ?? {}), stale: false };
  }

  try {
    const url = `${env.OPEN_METEO_BASE_URL}/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m&daily=sunrise,sunset,temperature_2m_max&timezone=America%2FChicago`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('weather upstream');
    const payload = (await res.json()) as Record<string, unknown>;
    await query(
      `insert into weather_cache (cache_key, payload, fetched_at) values ($1,$2,now())
       on conflict (cache_key) do update set payload = $2, fetched_at = now()`,
      [key, JSON.stringify(payload)],
    );
    return { ...payload, stale: false };
  } catch {
    if (cached.rows[0]) return { ...((cached.rows[0].payload as Record<string, unknown>) ?? {}), stale: true };
    throw errors.service('Weather is temporarily unavailable.');
  }
}

function coords(row: Record<string, unknown>) {
  return row.latitude != null ? { lat: Number(row.latitude), lng: Number(row.longitude) } : null;
}

function bookingFromRow(row: Record<string, unknown>) {
  const catalog = catalogRestaurant(row.id, row.slug);
  const platform = catalog?.bookingPlatform ?? row.booking_platform ?? row.booking_provider ?? null;
  const bookingUrl = catalog
    ? catalog.bookingUrl
    : (row.booking_url
        ?? (platform === 'opentable' ? row.opentable_url : null)
        ?? row.external_booking_url
        ?? null);
  return {
    platform,
    bookingUrl,
    phone: catalog?.phone ?? row.phone,
    website: catalog?.website ?? row.website,
  };
}

function shapeRestaurant(row: Record<string, unknown>) {
  const image = restaurantCoverImage(row)
  const gallery = Array.isArray(row.gallery) && (row.gallery as unknown[]).length ? row.gallery : [image]
  const booking = bookingFromRow(row)
  return {
    id: row.id,
    type: 'restaurant',
    name: row.name,
    slug: row.slug,
    category: row.category ?? row.cuisine,
    cuisine: row.cuisine,
    tags: row.tags ?? [],
    shortDescription: row.short_description,
    description: row.description,
    image,
    gallery,
    rating: row.rating != null ? Number(row.rating) : null,
    reviewCount: row.review_count,
    priceLevel: row.price_level,
    startingPrice: row.starting_price_cents != null ? Number(row.starting_price_cents) / 100 : null,
    phone: booking.phone,
    website: booking.website,
    location: row.location,
    address: row.address,
    coordinates: coords(row),
    featured: row.featured,
    hours: row.hours,
    externalBookingUrl: booking.bookingUrl,
    bookingPlatform: booking.platform,
    bookingUrl: booking.bookingUrl,
    lastVerifiedDate: row.last_verified_date ?? null,
    bookingProvider: booking.platform,
    opentableUrl: booking.platform === 'opentable' ? booking.bookingUrl : null,
    opentableRid: row.opentable_rid,
  };
}

function shapePartner(row: Record<string, unknown>) {
  return {
    id: row.id,
    type: 'partner',
    name: row.name,
    slug: row.slug,
    category: row.category,
    shortDescription: row.short_description,
    description: row.description,
    phone: row.phone,
    website: row.website,
    address: row.address,
    town: row.town,
    location: row.town,
    startingPrice: row.starting_price_cents != null ? Number(row.starting_price_cents) / 100 : null,
    priceUnit: row.price_unit,
    logo: row.logo_url,
    image: row.cover_url ?? row.logo_url,
    hours: row.hours,
    services: row.services,
    tags: row.tags,
    featured: row.featured,
    coordinates: coords(row),
    listingStatus: row.listing_status,
    dataSource: row.data_source,
    lastVerifiedDate: row.last_verified_date,
  };
}

function shapeBeach(row: Record<string, unknown>) {
  return {
    id: row.id,
    type: 'beach',
    name: row.name,
    description: row.description,
    image: row.image,
    address: row.address,
    location: row.location,
    coordinates: coords(row),
    parking: row.parking,
    amenities: row.amenities,
    walkTime: row.walk_time,
    neighborhood: row.neighborhood,
    useClass: row.use_class,
    accessKind: row.access_kind,
    useLabel: row.use_label,
    rules: row.rules,
    source: row.source,
    sourceUrl: row.source_url,
    publicInfo: row.public_info,
    gated: false,
  };
}

function shapeEvent(row: Record<string, unknown>) {
  return {
    id: row.id,
    type: 'event',
    title: row.title,
    name: row.title,
    description: row.description,
    image: eventCoverImage(row),
    date: row.event_date,
    time: row.event_time,
    location: row.location,
    website: row.website,
    externalUrl: row.external_url,
    category: row.category,
    coordinates: coords(row),
    source: row.source,
    sourceAttribution: row.source_attribution,
    shortDescription: row.description,
  };
}
