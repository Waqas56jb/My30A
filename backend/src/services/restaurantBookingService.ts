import { query } from '../config/db.js';
import { errors } from '../utils/errors.js';
import { getRestaurant } from './exploreService.js';
import {
  BOOKING_PLATFORMS,
  RESTAURANT_BOOKING_CATALOG,
  type BookingPlatform,
} from '../data/restaurantBookingCatalog.js';
import { restaurantCoverImage } from '../data/listingImages.js';

export const BOOKING_STALE_AFTER_DAYS = 90;

const PLATFORM_SET = new Set<string>(BOOKING_PLATFORMS);

export function isBookingPlatform(value: unknown): value is BookingPlatform {
  return typeof value === 'string' && PLATFORM_SET.has(value);
}

export async function restaurantReservation(id: string) {
  const restaurant = await getRestaurant(id);
  const platform = (restaurant.bookingPlatform as BookingPlatform | null) ?? null;
  const url = restaurant.bookingUrl ? String(restaurant.bookingUrl) : null;
  const phone = restaurant.phone ? String(restaurant.phone) : null;

  if (platform === 'phone_only' || (!url && phone)) {
    return {
      platform: platform ?? 'phone_only',
      action: 'call' as const,
      partnership: false,
      url: null,
      phone,
      restaurant: restaurant.name,
    };
  }

  if (url && platform) {
    return {
      platform,
      action: 'open_url' as const,
      partnership: false,
      url,
      phone,
      restaurant: restaurant.name,
    };
  }

  throw errors.service(
    'This restaurant does not have a verified online reservation link. Call them if a number is listed.',
  );
}

type QueryFn = (text: string, params?: unknown[]) => Promise<unknown>;

export async function upsertRestaurantCatalog(exec: { query: QueryFn } = { query }) {
  for (const row of RESTAURANT_BOOKING_CATALOG) {
    await exec.query(
      `insert into restaurants (
         id, slug, name, cuisine, short_description, description, location, address, phone, website,
         featured, active, latitude, longitude, price_level, rating, image,
         booking_platform, booking_url, last_verified_date, booking_notes,
         booking_provider, opentable_url, external_booking_url
       ) values (
         $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
         $11,true,$12,$13,$14,$15,$16,
         $17,$18,$19,$20,
         $17, case when $17 = 'opentable' then $18 else null end, $18
       )
       on conflict (slug) do update set
         name = excluded.name,
         cuisine = excluded.cuisine,
         short_description = excluded.short_description,
         description = excluded.description,
         location = excluded.location,
         address = coalesce(excluded.address, restaurants.address),
         phone = excluded.phone,
         website = coalesce(excluded.website, restaurants.website),
         featured = excluded.featured,
         latitude = coalesce(excluded.latitude, restaurants.latitude),
         longitude = coalesce(excluded.longitude, restaurants.longitude),
         price_level = coalesce(excluded.price_level, restaurants.price_level),
         rating = coalesce(excluded.rating, restaurants.rating),
         image = coalesce(excluded.image, restaurants.image),
         booking_platform = excluded.booking_platform,
         booking_url = excluded.booking_url,
         last_verified_date = excluded.last_verified_date,
         booking_notes = excluded.booking_notes,
         booking_provider = excluded.booking_platform,
         opentable_url = case when excluded.booking_platform = 'opentable' then excluded.booking_url else null end,
         external_booking_url = excluded.booking_url,
         updated_at = now()`,
      [
        row.id, row.slug, row.name, row.cuisine, row.shortDescription, row.description,
        row.location, row.address ?? null, row.phone, row.website ?? null,
        Boolean(row.featured), row.latitude ?? null, row.longitude ?? null, row.priceLevel ?? null, row.rating ?? null,
        restaurantCoverImage(row),
        row.bookingPlatform, row.bookingUrl, row.lastVerifiedDate, row.bookingNotes,
      ],
    );
  }
  return { upserted: RESTAURANT_BOOKING_CATALOG.length };
}

export async function listAdminRestaurants() {
  const { rows } = await query(`select * from restaurants order by featured desc, name`);
  return rows.map(shapeAdminRestaurant);
}

function slugFromName(name: string) {
  return String(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

export async function createRestaurant(input: Record<string, unknown>) {
  const platform = isBookingPlatform(input.bookingPlatform) ? input.bookingPlatform : null;
  const slug = String(input.slug ?? slugFromName(String(input.name ?? ''))).trim() || null;
  const bookingUrl = platform === 'phone_only' ? null : (input.bookingUrl ?? null);
  const { rows } = await query(
    `insert into restaurants (
       name, slug, cuisine, description, location, phone, website, featured, active,
       latitude, longitude, booking_platform, booking_url, last_verified_date, booking_notes,
       booking_provider, opentable_url, external_booking_url
     ) values (
       $1,$2,$3,$4,$5,$6,$7,$8,true,$9,$10,$11,$12,$13,$14,$11,
       case when $11 = 'opentable' then $12 else null end, $12
     ) returning *`,
    [
      input.name, slug, input.cuisine ?? '', input.description ?? '',
      input.location ?? '', input.phone ?? null, input.website ?? null,
      Boolean(input.featured), input.latitude ?? null, input.longitude ?? null,
      platform, bookingUrl, input.lastVerifiedDate ?? null, input.bookingNotes ?? null,
    ],
  );
  return shapeAdminRestaurant(rows[0]);
}

export async function updateRestaurant(id: string, input: Record<string, unknown>) {
  const platform = input.bookingPlatform === undefined
    ? undefined
    : isBookingPlatform(input.bookingPlatform)
      ? input.bookingPlatform
      : null;
  if (input.bookingPlatform !== undefined && platform === null && input.bookingPlatform != null) {
    throw errors.validation('booking_platform must be opentable, resy, sevenrooms, phone_only, or website_widget.');
  }
  const { rows } = await query(
    `update restaurants set
       name = coalesce($2, name),
       description = coalesce($3, description),
       cuisine = coalesce($4, cuisine),
       location = coalesce($5, location),
       phone = coalesce($6, phone),
       website = coalesce($7, website),
       active = coalesce($8, active),
       featured = coalesce($9, featured),
       booking_platform = coalesce($10, booking_platform),
       booking_url = case
         when $10 = 'phone_only' then null
         when $11 is not null then $11
         else booking_url
       end,
       last_verified_date = coalesce($12, last_verified_date),
       booking_notes = coalesce($13, booking_notes),
       booking_provider = coalesce($10, booking_provider),
       opentable_url = case
         when $10 = 'opentable' then coalesce($11, opentable_url)
         when $10 is not null then null
         else opentable_url
       end,
       external_booking_url = case
         when $10 = 'phone_only' then null
         when $11 is not null then $11
         else external_booking_url
       end,
       updated_at = now()
     where id::text = $1 or slug = $1
     returning *`,
    [
      id,
      input.name ?? null,
      input.description ?? null,
      input.cuisine ?? null,
      input.location ?? null,
      input.phone ?? null,
      input.website ?? null,
      typeof input.active === 'boolean' ? input.active : null,
      typeof input.featured === 'boolean' ? input.featured : null,
      platform ?? null,
      input.bookingUrl === undefined ? null : input.bookingUrl,
      input.lastVerifiedDate ?? null,
      input.bookingNotes ?? null,
    ],
  );
  if (!rows[0]) throw errors.notFound('that restaurant');
  return shapeAdminRestaurant(rows[0]);
}

export async function markRestaurantVerified(id: string) {
  const { rows } = await query(
    `update restaurants set last_verified_date = current_date, updated_at = now()
     where id::text = $1 or slug = $1 returning *`,
    [id],
  );
  if (!rows[0]) throw errors.notFound('that restaurant');
  return shapeAdminRestaurant(rows[0]);
}

export async function checkRestaurantBookingFreshness() {
  const { rows } = await query<{
    id: string;
    name: string;
    slug: string;
    booking_platform: string | null;
    booking_url: string | null;
    last_verified_date: string | Date | null;
  }>(
    `select id, name, slug, booking_platform, booking_url, last_verified_date
     from restaurants where active = true`,
  );

  const stale = [];
  for (const row of rows) {
    const verified = row.last_verified_date ? new Date(row.last_verified_date) : null;
    const ageDays = verified ? (Date.now() - verified.getTime()) / 86_400_000 : Number.POSITIVE_INFINITY;
    if (ageDays > BOOKING_STALE_AFTER_DAYS) {
      stale.push({
        id: row.id,
        name: row.name,
        slug: row.slug,
        platform: row.booking_platform,
        lastVerifiedDate: row.last_verified_date,
        ageDays: Number.isFinite(ageDays) ? Math.round(ageDays) : null,
      });
    }
  }

  return {
    checked: rows.length,
    staleAfterDays: BOOKING_STALE_AFTER_DAYS,
    staleCount: stale.length,
    stale,
    note: 'Visit South Walton and similar blogs are a first pass only. Re-check restaurant websites in batches — platforms change and broken links fail silently.',
  };
}

function daysSince(value: unknown) {
  if (!value) return null;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return null;
  return Math.floor((Date.now() - date.getTime()) / 86_400_000);
}

function shapeAdminRestaurant(row: Record<string, unknown>) {
  const lastVerifiedDate = row.last_verified_date ?? null;
  const ageDays = daysSince(lastVerifiedDate);
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    cuisine: row.cuisine,
    description: row.description,
    location: row.location,
    address: row.address,
    phone: row.phone,
    website: row.website,
    featured: row.featured,
    active: row.active,
    bookingPlatform: row.booking_platform ?? row.booking_provider ?? null,
    bookingUrl: row.booking_url
      ?? ((row.booking_platform ?? row.booking_provider) === 'opentable' ? row.opentable_url : null)
      ?? row.external_booking_url
      ?? null,
    lastVerifiedDate,
    bookingNotes: row.booking_notes ?? null,
    stale: ageDays == null || ageDays > BOOKING_STALE_AFTER_DAYS,
    staleAfterDays: BOOKING_STALE_AFTER_DAYS,
    daysSinceVerified: ageDays,
  };
}
