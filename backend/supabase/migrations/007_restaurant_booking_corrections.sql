-- Guessed OpenTable /r/ slugs 404. These venues are not bookable on OpenTable.

update restaurants
set
  booking_platform = 'phone_only',
  booking_provider = 'phone_only',
  booking_url = null,
  opentable_url = null,
  external_booking_url = null,
  website = coalesce(website, 'https://www.thegreatsoutherncafe.com/'),
  booking_notes = 'Invented OpenTable slug /r/great-southern-cafe-seaside 404s. Call (850) 231-7327.',
  last_verified_date = current_date,
  updated_at = now()
where slug = 'great-southern'
   or id = 'a1000000-0000-0000-0000-000000000001';

update restaurants
set
  booking_platform = 'phone_only',
  booking_provider = 'phone_only',
  booking_url = null,
  opentable_url = null,
  external_booking_url = null,
  website = coalesce(website, 'https://www.cowgirlkitchen.com/'),
  booking_notes = 'Not on OpenTable. Call (850) 231-1300.',
  last_verified_date = current_date,
  updated_at = now()
where slug = 'cowgirl-kitchen'
   or id = 'a1000000-0000-0000-0000-000000000002';

update restaurants
set
  booking_platform = 'phone_only',
  booking_provider = 'phone_only',
  booking_url = null,
  opentable_url = null,
  external_booking_url = null,
  website = coalesce(website, 'https://www.budandalleys.com/'),
  booking_notes = 'OpenTable /r/bud-and-alleys-seaside 404s. Official listing says not on the network. Hostess: (850) 231-5900.',
  last_verified_date = current_date,
  updated_at = now()
where slug = 'bud-and-alleys'
   or id = 'a1000000-0000-0000-0000-000000000003';
