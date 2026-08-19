-- Directory listings, official beach access, live events, OpenTable booking.

alter table partners
  add column if not exists listing_status text not null default 'paid_partner'
    check (listing_status in ('free_directory', 'paid_partner')),
  add column if not exists data_source text,
  add column if not exists last_verified_date date;

alter table beaches
  add column if not exists slug text,
  add column if not exists neighborhood text,
  add column if not exists use_class text default 'full_public'
    check (use_class in ('full_public', 'limited_public', 'private')),
  add column if not exists access_kind text default 'neighborhood'
    check (access_kind in ('regional', 'neighborhood', 'county_state', 'bay_lake', 'private')),
  add column if not exists use_label text,
  add column if not exists rules text,
  add column if not exists source text,
  add column if not exists source_url text,
  add column if not exists public_info boolean not null default true,
  add column if not exists gated boolean not null default false;

create unique index if not exists beaches_slug_uq on beaches (slug);

alter table events
  add column if not exists source text,
  add column if not exists source_id text,
  add column if not exists source_attribution text,
  add column if not exists synced_at timestamptz;

create unique index if not exists events_source_id_uq on events (source, source_id);

alter table restaurants
  add column if not exists booking_provider text default 'opentable',
  add column if not exists opentable_url text,
  add column if not exists opentable_rid text;

create table if not exists beach_conditions_cache (
  cache_key text primary key,
  payload jsonb not null,
  fetched_at timestamptz not null default now()
);
