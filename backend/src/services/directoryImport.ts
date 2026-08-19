import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { PoolClient } from 'pg';
import { hashPassword } from './authService.js';
import { PARTNER_CATEGORIES } from '../data/partnerCategories.js';
import { ACCESS_RULES, BEACH_ACCESSES, BEACH_ACCESS_SOURCE } from '../data/beachAccessCatalog.js';
import { logger } from '../config/logger.js';

type PartnerRow = {
  category: string;
  name: string;
  description: string;
  areaServed: string;
  website: string;
  phone: string;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

function websiteUrl(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export async function importPartnerCategories(client: PoolClient) {
  for (const category of PARTNER_CATEGORIES) {
    await client.query(
      `insert into partner_categories (name, slug, icon, sort_order, enabled, blurb)
       values ($1,$2,$3,$4,true,$5)
       on conflict (slug) do update set name = excluded.name, icon = excluded.icon, sort_order = excluded.sort_order, enabled = true`,
      [category.name, category.slug, category.icon, category.sort, 'Independent 30A businesses. Referral listing only.'],
    );
  }
}

export async function importAppPartners(client: PoolClient) {
  const file = resolve(process.cwd(), 'data/app-partners.json');
  const payload = JSON.parse(readFileSync(file, 'utf8')) as { partners: PartnerRow[]; pulled: string };
  const passwordHash = await hashPassword(`directory-import-${payload.pulled}`);
  const verified = payload.pulled ? `${payload.pulled}-01` : '2026-08-01';

  const cats = await client.query<{ id: string; name: string }>(`select id, name from partner_categories`);
  const byName = new Map(cats.rows.map((row) => [row.name, row.id]));

  let upserted = 0;
  for (const row of payload.partners) {
    const categoryId = byName.get(row.category);
    if (!categoryId) throw new Error(`Unknown partner category: ${row.category}`);
    const slug = slugify(row.name);
    const email = `directory.${slug}@my30a.invalid`;
    await client.query(
      `insert into partners (
         email, password_hash, name, category_id, slug, short_description, description,
         phone, website, town, status, published, featured, listing_status, data_source, last_verified_date
       ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'approved', true, false, 'free_directory', $11, $12)
       on conflict (email) do update set
         name = excluded.name,
         category_id = excluded.category_id,
         slug = excluded.slug,
         short_description = excluded.short_description,
         description = excluded.description,
         phone = excluded.phone,
         website = excluded.website,
         town = excluded.town,
         status = 'approved',
         published = true,
         listing_status = 'free_directory',
         data_source = excluded.data_source,
         last_verified_date = excluded.last_verified_date,
         starting_price_cents = null`,
      [
        email,
        passwordHash,
        row.name,
        categoryId,
        slug,
        row.description.slice(0, 160),
        row.description,
        row.phone || null,
        websiteUrl(row.website),
        row.areaServed || null,
        'MY30A_App_Partners_For_Developer.xlsx',
        verified,
      ],
    );
    upserted += 1;
  }
  logger.info({ upserted }, 'imported app partners from spreadsheet');
  return upserted;
}

export async function importBeachAccess(client: PoolClient) {
  for (const access of BEACH_ACCESSES) {
    const rules = ACCESS_RULES[access.useClass];
    await client.query(
      `insert into beaches (
         slug, name, description, location, neighborhood, use_class, access_kind, use_label, rules,
         parking, amenities, latitude, longitude, source, source_url, public_info, gated, active
       ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12,$13,$14,$15,true,false,true)
       on conflict (slug) do update set
         name = excluded.name,
         description = excluded.description,
         location = excluded.location,
         neighborhood = excluded.neighborhood,
         use_class = excluded.use_class,
         access_kind = excluded.access_kind,
         use_label = excluded.use_label,
         rules = excluded.rules,
         parking = excluded.parking,
         amenities = excluded.amenities,
         latitude = excluded.latitude,
         longitude = excluded.longitude,
         source = excluded.source,
         source_url = excluded.source_url,
         public_info = true,
         gated = false,
         active = true`,
      [
        access.slug,
        access.name,
        access.description,
        access.neighborhood,
        access.neighborhood,
        access.useClass,
        access.accessKind,
        rules.label,
        `${rules.summary} ${access.description}`,
        access.parking ?? null,
        JSON.stringify(access.amenities ?? []),
        access.latitude,
        access.longitude,
        BEACH_ACCESS_SOURCE.name,
        BEACH_ACCESS_SOURCE.url,
      ],
    );
  }
  return BEACH_ACCESSES.length;
}
