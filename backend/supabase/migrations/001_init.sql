-- My30A Host initial schema
-- Reversible: DROP SCHEMA is not used. Down notes: drop tables in reverse FK order.

create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Identity (four separate account tables)
-- ---------------------------------------------------------------------------

create table if not exists guests (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  first_name text not null,
  last_name text not null,
  phone text,
  avatar_url text,
  language text not null default 'en',
  email_verified boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists hosts (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  first_name text not null,
  last_name text not null,
  phone text,
  company text,
  avatar_url text,
  preferred_contact text default 'email',
  email_verified boolean not null default false,
  status text not null default 'pending' check (status in ('pending','active','suspended','rejected')),
  notes text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists partners (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  name text not null,
  owner_name text,
  category_id uuid,
  slug text unique,
  short_description text,
  description text,
  phone text,
  website text,
  address text,
  town text,
  state text default 'FL',
  latitude double precision,
  longitude double precision,
  starting_price_cents integer,
  price_unit text,
  logo_url text,
  cover_url text,
  hours jsonb not null default '{}'::jsonb,
  services jsonb not null default '[]'::jsonb,
  tags jsonb not null default '[]'::jsonb,
  status text not null default 'pending' check (status in ('pending','approved','rejected','suspended')),
  reason text,
  published boolean not null default false,
  featured boolean not null default false,
  email_verified boolean not null default false,
  submitted_at timestamptz default now(),
  reviewed_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists admin_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  name text not null,
  role text not null check (role in ('super_admin','operations','finance','content_manager','support')),
  status text not null default 'active' check (status in ('active','invited','suspended')),
  two_factor boolean not null default false,
  last_active_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists admin_role_permissions (
  role text not null,
  area text not null,
  level text not null check (level in ('full','edit','view','none')),
  primary key (role, area)
);

create table if not exists password_reset_tokens (
  id uuid primary key default gen_random_uuid(),
  account_role text not null,
  account_id uuid not null,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists email_verification_codes (
  id uuid primary key default gen_random_uuid(),
  account_role text not null,
  account_id uuid not null,
  code_hash text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Properties / stays / access
-- ---------------------------------------------------------------------------

create table if not exists properties (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references hosts(id),
  slug text not null unique,
  name text not null,
  type text,
  status text not null default 'draft' check (status in ('draft','published','paused')),
  description text,
  address text,
  city text,
  state text default 'FL',
  zip text,
  community text,
  latitude double precision,
  longitude double precision,
  wifi jsonb not null default '{}'::jsonb,
  check_in jsonb not null default '{}'::jsonb,
  check_out jsonb not null default '{}'::jsonb,
  access jsonb not null default '{}'::jsonb,
  parking jsonb not null default '{}'::jsonb,
  emergency jsonb not null default '{}'::jsonb,
  rules jsonb not null default '[]'::jsonb,
  amenities jsonb not null default '[]'::jsonb,
  photos jsonb not null default '[]'::jsonb,
  branding jsonb not null default '{}'::jsonb,
  vitoria jsonb not null default '{"enabled":true,"specialNotes":"","conversation_visibility":"metadata","escalateAfter":2}'::jsonb,
  guest_access jsonb not null default '{}'::jsonb,
  published_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists guest_stays (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid not null references guests(id),
  property_id uuid not null references properties(id),
  check_in_date date not null,
  check_out_date date not null,
  check_in_time text,
  check_out_time text,
  party_size integer default 1,
  adults integer,
  children integer,
  confirmation_code text,
  access_slug text,
  status text not null default 'upcoming',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists property_guests (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid not null references guests(id),
  property_id uuid not null references properties(id),
  stay_id uuid references guest_stays(id),
  access_code_id uuid,
  activated_at timestamptz not null default now(),
  expires_at timestamptz,
  unique (guest_id, property_id, stay_id)
);

create table if not exists guest_access_tokens (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id),
  issued_by_host_id uuid not null references hosts(id),
  token_hash text not null unique,
  code text,
  slug text,
  expires_at timestamptz,
  max_uses integer default 1,
  used_count integer not null default 0,
  revoked_at timestamptz,
  first_used_at timestamptz,
  last_used_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists guest_preferences (
  guest_id uuid primary key references guests(id) on delete cascade,
  cuisines jsonb not null default '[]'::jsonb,
  dietary jsonb not null default '[]'::jsonb,
  traveling_with_kids boolean default false,
  kid_ages jsonb not null default '[]'::jsonb,
  activities jsonb not null default '[]'::jsonb,
  pace text,
  budget text,
  memories jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists saved_items (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid not null references guests(id) on delete cascade,
  entity_id text not null,
  entity_kind text,
  created_at timestamptz not null default now(),
  unique (guest_id, entity_id)
);

create table if not exists local_recommendations (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  host_id uuid not null references hosts(id),
  name text not null,
  category text,
  note text,
  featured boolean not null default false,
  place_ref text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Local guide / explore
-- ---------------------------------------------------------------------------

create table if not exists partner_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  blurb text,
  icon text,
  sort_order integer not null default 0,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table partners
  add constraint partners_category_fk
  foreign key (category_id) references partner_categories(id);

create table if not exists partner_media (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references partners(id) on delete cascade,
  url text not null,
  kind text not null default 'gallery',
  caption text,
  featured boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists pending_partner_updates (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references partners(id) on delete cascade,
  payload jsonb not null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create table if not exists restaurants (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  name text not null,
  category text,
  cuisine text,
  description text,
  short_description text,
  image text,
  gallery jsonb not null default '[]'::jsonb,
  website text,
  phone text,
  address text,
  location text,
  latitude double precision,
  longitude double precision,
  rating numeric(3,2),
  review_count integer default 0,
  price_level integer,
  starting_price_cents integer,
  hours jsonb not null default '{}'::jsonb,
  tags jsonb not null default '[]'::jsonb,
  featured boolean not null default false,
  active boolean not null default true,
  external_booking_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  image text,
  event_date date,
  event_time text,
  location text,
  website text,
  external_url text,
  category text,
  latitude double precision,
  longitude double precision,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists beaches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  image text,
  address text,
  location text,
  latitude double precision,
  longitude double precision,
  parking text,
  amenities jsonb not null default '[]'::jsonb,
  walk_time text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists attractions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  image text,
  address text,
  latitude double precision,
  longitude double precision,
  website text,
  phone text,
  kind text default 'attraction',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Pricing / airports
-- ---------------------------------------------------------------------------

create table if not exists system_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists service_pricing (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  code text not null,
  label text not null,
  amount_cents integer not null,
  meta jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  unique (kind, code)
);

create table if not exists cancellation_policies (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null,
  hours integer not null,
  fee_cents integer not null,
  note text
);

create table if not exists airports (
  code text primary key,
  name text not null,
  city text,
  drive_time text,
  base_fare_cents integer not null
);

create table if not exists vehicle_classes (
  id text primary key,
  name text not null,
  capacity text,
  seats integer,
  multiplier numeric(6,3) not null default 1
);

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------

create table if not exists grocery_orders (
  id text primary key,
  guest_id uuid not null references guests(id),
  property_id uuid not null references properties(id),
  stay_id uuid references guest_stays(id),
  status text not null default 'pending' check (status in (
    'pending','confirmed','payment_required','paid','shopping','on_the_way','delivered','cancelled'
  )),
  store text,
  delivery_date date,
  delivery_window text,
  items_text text,
  item_count integer default 0,
  package_code text,
  notes text,
  estimated_grocery_cents integer,
  service_fee_cents integer,
  rush_fee_cents integer default 0,
  holiday_fee_cents integer default 0,
  actual_amount_cents integer,
  tip_percent integer,
  tip_amount_cents integer,
  tip_status text default 'none',
  payment_status text not null default 'not_required',
  payment jsonb not null default '{}'::jsonb,
  timeline jsonb not null default '[]'::jsonb,
  shopper jsonb,
  delivery_photo_path text,
  rating jsonb,
  cancellation_accepted boolean default false,
  created_by text default 'guest',
  internal_notes text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists grocery_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references grocery_orders(id) on delete cascade,
  name text not null,
  qty integer default 1,
  note text
);

create table if not exists grocery_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references grocery_orders(id) on delete cascade,
  from_status text,
  to_status text not null,
  actor_id uuid,
  actor_role text,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists airport_transfers (
  id text primary key,
  guest_id uuid not null references guests(id),
  property_id uuid not null references properties(id),
  stay_id uuid references guest_stays(id),
  status text not null default 'pending' check (status in (
    'pending','confirmed','payment_authorized','driver_assigned','in_progress','completed','cancelled','no_show'
  )),
  direction text default 'arrival',
  airport text not null references airports(code),
  flight_number text,
  pickup_date date not null,
  pickup_time text not null,
  passengers integer not null default 1,
  bags integer default 0,
  child_seats integer default 0,
  vehicle_id text references vehicle_classes(id),
  quoted_fare_cents integer,
  tip_percent integer,
  tip_amount_cents integer,
  tip_status text default 'none',
  payment_status text not null default 'not_required',
  payment jsonb not null default '{}'::jsonb,
  driver jsonb,
  special_requests text,
  timeline jsonb not null default '[]'::jsonb,
  rating jsonb,
  cancel_reason text,
  cancellation_result jsonb,
  created_by text default 'guest',
  internal_notes text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists transfer_status_history (
  id uuid primary key default gen_random_uuid(),
  transfer_id text not null references airport_transfers(id) on delete cascade,
  from_status text,
  to_status text not null,
  actor_id uuid,
  actor_role text,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'none',
  provider_ref text,
  amount_cents integer not null,
  currency text not null default 'usd',
  status text not null default 'pending',
  type text,
  related_id text,
  guest_id uuid references guests(id),
  authorized_at timestamptz,
  captured_at timestamptz,
  refunded_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists subscription_records (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references hosts(id),
  property_id uuid references properties(id),
  plan text not null,
  status text not null default 'trial',
  trial_start timestamptz,
  trial_end timestamptz,
  subscription_id text,
  customer_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Chat / knowledge / notifications / analytics / audit
-- ---------------------------------------------------------------------------

create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid not null references guests(id),
  property_id uuid references properties(id),
  title text,
  topic text,
  status text not null default 'active' check (status in ('active','resolved','escalated','abandoned')),
  language text default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_type text,
  sender_id uuid,
  role text not null check (role in ('user','assistant','system','tool')),
  content text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  tool_calls jsonb,
  tokens_used integer,
  created_at timestamptz not null default now()
);

create table if not exists knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references properties(id),
  source_type text not null,
  source_id text,
  question text,
  content text not null,
  type text,
  is_active boolean not null default true,
  embedding_json jsonb,
  tsv tsvector,
  used_count integer default 0,
  author text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists automations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  enabled boolean not null default false,
  schedule text,
  last_run_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null,
  recipient_role text not null check (recipient_role in ('GUEST','HOST','PARTNER','ADMIN')),
  type text not null,
  title text not null,
  message text not null,
  data jsonb not null default '{}'::jsonb,
  link text,
  entity_type text,
  entity_id text,
  read boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists notification_preferences (
  account_id uuid not null,
  account_role text not null,
  in_app boolean not null default true,
  email boolean not null default true,
  sound_enabled boolean not null default false,
  primary key (account_id, account_role)
);

create table if not exists analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  user_id uuid,
  guest_id uuid,
  host_id uuid,
  partner_id uuid,
  property_id uuid,
  session_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists partner_click_events (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references partners(id) on delete cascade,
  guest_id uuid,
  property_id uuid,
  event_type text not null check (event_type in ('partner_view','website_click','phone_click','directions_click')),
  session_id text,
  source text,
  device text,
  created_at timestamptz not null default now()
);

create table if not exists partner_analytics_daily (
  partner_id uuid not null references partners(id) on delete cascade,
  day date not null,
  views integer not null default 0,
  website_clicks integer not null default 0,
  phone_clicks integer not null default 0,
  directions_clicks integer not null default 0,
  primary key (partner_id, day)
);

create table if not exists ratings (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid not null references guests(id),
  subject_type text not null,
  subject_id text not null,
  property_id uuid references properties(id),
  rating integer not null check (rating between 1 and 5),
  comment text,
  status text not null default 'published' check (status in ('published','hidden','flagged')),
  created_at timestamptz not null default now(),
  unique (guest_id, subject_type, subject_id)
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  actor_role text,
  actor_name text,
  action text not null,
  entity text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  ip text,
  user_agent text,
  status text default 'success',
  created_at timestamptz not null default now()
);

create table if not exists email_log (
  id uuid primary key default gen_random_uuid(),
  recipient text not null,
  subject text,
  template text,
  status text not null,
  provider text default 'nodemailer',
  provider_message_id text,
  error text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists files (
  id uuid primary key default gen_random_uuid(),
  bucket text not null,
  path text not null,
  entity_type text,
  entity_id text,
  uploaded_by uuid,
  mime_type text,
  size_bytes integer,
  created_at timestamptz not null default now()
);

create table if not exists content_blocks (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  title text,
  body text,
  image text,
  published boolean not null default true,
  sort_order integer default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists media_library (
  id uuid primary key default gen_random_uuid(),
  name text,
  url text not null,
  category text,
  status text default 'ready',
  created_at timestamptz not null default now()
);

create table if not exists job_runs (
  id uuid primary key default gen_random_uuid(),
  job_name text not null,
  status text not null,
  detail jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create table if not exists weather_cache (
  cache_key text primary key,
  payload jsonb not null,
  fetched_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Triggers / indexes
-- ---------------------------------------------------------------------------

do $$
declare t text;
begin
  foreach t in array array[
    'guests','hosts','partners','admin_users','properties','guest_stays',
    'local_recommendations','partner_categories','restaurants','events',
    'grocery_orders','airport_transfers','conversations','knowledge_chunks',
    'system_settings','payments','subscription_records','content_blocks'
  ]
  loop
    execute format(
      'drop trigger if exists trg_%s_updated on %I; create trigger trg_%s_updated before update on %I for each row execute function set_updated_at();',
      t, t, t, t
    );
  end loop;
end $$;

create index if not exists idx_properties_host on properties(host_id);
create index if not exists idx_stays_guest on guest_stays(guest_id);
create index if not exists idx_stays_property on guest_stays(property_id);
create index if not exists idx_pg_guest on property_guests(guest_id);
create index if not exists idx_pg_property on property_guests(property_id);
create index if not exists idx_tokens_property on guest_access_tokens(property_id);
create index if not exists idx_grocery_guest on grocery_orders(guest_id);
create index if not exists idx_grocery_status on grocery_orders(status);
create index if not exists idx_transfers_guest on airport_transfers(guest_id);
create index if not exists idx_transfers_status on airport_transfers(status);
create index if not exists idx_conv_guest on conversations(guest_id, updated_at desc);
create index if not exists idx_conv_property on conversations(property_id, status);
create index if not exists idx_msg_conv on messages(conversation_id, created_at);
create index if not exists idx_notif_recipient on notifications(recipient_id, recipient_role, read, created_at desc);
create index if not exists idx_analytics_event on analytics_events(event_name, created_at);
create index if not exists idx_analytics_partner on analytics_events(partner_id, created_at);
create index if not exists idx_clicks_partner on partner_click_events(partner_id, created_at);
create index if not exists idx_audit_created on audit_logs(created_at desc);
create index if not exists idx_knowledge_tsv on knowledge_chunks using gin(tsv);

create or replace function knowledge_tsv_update()
returns trigger language plpgsql as $$
begin
  new.tsv := to_tsvector('english', coalesce(new.question,'') || ' ' || coalesce(new.content,''));
  return new;
end;
$$;

drop trigger if exists trg_knowledge_tsv on knowledge_chunks;
create trigger trg_knowledge_tsv before insert or update on knowledge_chunks
for each row execute function knowledge_tsv_update();

-- ---------------------------------------------------------------------------
-- RLS (backend uses postgres/service role; policies protect anon key)
-- ---------------------------------------------------------------------------

alter table guests enable row level security;
alter table hosts enable row level security;
alter table partners enable row level security;
alter table admin_users enable row level security;
alter table properties enable row level security;
alter table guest_stays enable row level security;
alter table property_guests enable row level security;
alter table grocery_orders enable row level security;
alter table airport_transfers enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table notifications enable row level security;
alter table partner_click_events enable row level security;
alter table partner_analytics_daily enable row level security;
alter table audit_logs enable row level security;

-- Anon cannot read private tables. Public explore tables stay readable.

alter table restaurants enable row level security;
alter table events enable row level security;
alter table beaches enable row level security;
alter table partner_categories enable row level security;

drop policy if exists restaurants_public on restaurants;
create policy restaurants_public on restaurants for select using (active = true);

drop policy if exists events_public on events;
create policy events_public on events for select using (active = true);

drop policy if exists beaches_public on beaches;
create policy beaches_public on beaches for select using (active = true);

drop policy if exists categories_public on partner_categories;
create policy categories_public on partner_categories for select using (enabled = true);

drop policy if exists partners_public on partners;
create policy partners_public on partners for select using (status = 'approved' and published = true and deleted_at is null);

-- Audit is append-only: no update/delete for anyone via RLS
drop policy if exists audit_no_change on audit_logs;
create policy audit_no_change on audit_logs for update using (false);
drop policy if exists audit_no_delete on audit_logs;
create policy audit_no_delete on audit_logs for delete using (false);
