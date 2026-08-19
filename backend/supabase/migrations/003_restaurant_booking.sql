-- Per-restaurant reservation handoff. Never assume a global OpenTable search.
-- Platforms change; each row stores the restaurant's current direct booking path.

alter table restaurants
  add column if not exists booking_platform text,
  add column if not exists booking_url text,
  add column if not exists last_verified_date date,
  add column if not exists booking_notes text;

update restaurants
set
  booking_platform = coalesce(nullif(booking_platform, ''), nullif(booking_provider, ''), 'opentable'),
  booking_url = coalesce(nullif(booking_url, ''), opentable_url, external_booking_url)
where booking_platform is null or booking_url is null;

alter table restaurants drop constraint if exists restaurants_booking_platform_check;
alter table restaurants add constraint restaurants_booking_platform_check
  check (
    booking_platform is null
    or booking_platform in ('opentable', 'resy', 'sevenrooms', 'phone_only', 'website_widget')
  );

create index if not exists idx_restaurants_booking_platform on restaurants (booking_platform);
create index if not exists idx_restaurants_last_verified on restaurants (last_verified_date);
