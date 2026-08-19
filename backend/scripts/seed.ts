import { connectMigrator, migrateFallbackPool, migratePool } from '../src/config/db.js';
import { hashPassword } from '../src/services/authService.js';
import { sha256 } from '../src/services/authService.js';
import { logger } from '../src/config/logger.js';
import { importAppPartners, importBeachAccess, importPartnerCategories } from '../src/services/directoryImport.js';
import { syncEventsFeed } from '../src/services/eventsFeedService.js';
import { upsertRestaurantCatalog } from '../src/services/restaurantBookingService.js';

const DEMO = 'demo1234';
const ADMIN = 'admin1234';

async function main() {
  const hash = await hashPassword(DEMO);
  const adminHash = await hashPassword(ADMIN);
  const { client, pool } = await connectMigrator();
  try {
    await client.query('BEGIN');

    await client.query(`
      insert into admin_role_permissions (role, area, level) values
      ('super_admin','users','full'),('super_admin','hosts','full'),('super_admin','partners','full'),
      ('super_admin','properties','full'),('super_admin','orders','full'),('super_admin','payments','full'),
      ('super_admin','content','full'),('super_admin','analytics','full'),('super_admin','settings','full'),
      ('operations','users','edit'),('operations','hosts','edit'),('operations','partners','full'),
      ('operations','properties','edit'),('operations','orders','full'),('operations','payments','view'),
      ('operations','content','view'),('operations','analytics','view'),('operations','settings','none'),
      ('finance','users','view'),('finance','hosts','view'),('finance','partners','view'),
      ('finance','properties','view'),('finance','orders','view'),('finance','payments','full'),
      ('finance','content','none'),('finance','analytics','full'),('finance','settings','view'),
      ('content_manager','users','none'),('content_manager','hosts','none'),('content_manager','partners','edit'),
      ('content_manager','properties','view'),('content_manager','orders','none'),('content_manager','payments','none'),
      ('content_manager','content','full'),('content_manager','analytics','view'),('content_manager','settings','none'),
      ('support','users','edit'),('support','hosts','view'),('support','partners','view'),
      ('support','properties','view'),('support','orders','edit'),('support','payments','view'),
      ('support','content','none'),('support','analytics','view'),('support','settings','none')
      on conflict do nothing
    `);

    const admins = [
      ['alicia@my30a.com', 'Alicia Brandt', 'super_admin'],
      ['marcus@my30a.com', 'Marcus Feld', 'operations'],
      ['priya@my30a.com', 'Priya Raman', 'finance'],
      ['tom@my30a.com', 'Tom Whitaker', 'content_manager'],
      ['sofia@my30a.com', 'Sofia Marchetti', 'support'],
    ];
    for (const [email, name, role] of admins) {
      await client.query(
        `insert into admin_users (email, password_hash, name, role, status)
         values ($1,$2,$3,$4,'active') on conflict (email) do update set password_hash = $2, role = $4`,
        [email, adminHash, name, role],
      );
    }

    const ownerHash = await hashPassword('admin@123!');
    await client.query(
      `insert into admin_users (email, password_hash, name, role, status)
       values ('admin@gmail.com',$1,'Admin','super_admin','active')
       on conflict (email) do update set password_hash = $1, role = 'super_admin', status = 'active', name = 'Admin'`,
      [ownerHash],
    )

    const host = await client.query(
      `insert into hosts (id, email, password_hash, first_name, last_name, phone, company, status, email_verified)
       values ('11111111-1111-1111-1111-111111111111','michael@coastalkey30a.com',$1,'Michael','Reyes','(850) 555-0142','Coastal Key Property Group','active', true)
       on conflict (email) do update set password_hash = $1
       returning id`,
      [hash],
    );
    const hostId = host.rows[0].id;

    await client.query(
      `insert into guests (id, email, password_hash, first_name, last_name, phone, email_verified)
       values
       ('22222222-2222-2222-2222-222222222222','sarah@my30a.com',$1,'Sarah','Whitmore','(404) 555-0188', true),
       ('33333333-3333-3333-3333-333333333333','daniel@my30a.com',$1,'Daniel','Okafor','(312) 555-0110', true),
       ('44444444-4444-4444-4444-444444444444','alex@my30a.com',$1,'Alex','Rivera','(850) 555-0164', false)
       on conflict (email) do update set password_hash = $1`,
      [hash],
    );

    await client.query(
      `insert into properties (id, host_id, slug, name, type, status, description, address, city, community, latitude, longitude, wifi, check_in, check_out, access, parking, emergency, rules, published_at)
       values
       ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',$1,'rosemary-beach-house','Rosemary Beach House','Beach House','published',
        'A gulf-side house on Barrett Square.','12 North Barrett Square','Rosemary Beach','Rosemary Beach',30.2802,-86.0165,
        '{"network":"30A-GUEST","password":"BeachHouse2026","note":"Router in the laundry closet."}',
        '{"time":"4:00 PM","arrival":"Smart lock","doorCode":"2048#"}',
        '{"time":"10:00 AM","lockUp":"Set thermostat to 78 and lock the front door."}',
        '{"method":"Smart lock","code":"2048#","instructions":"Code on the keypad, then #.","parking":"Two driveway spaces.","trash":"Bins by the garage. Tuesday and Friday."}',
        '{"location":"Driveway, two spaces"}',
        '{"contact":"Michael Reyes","contactPhone":"(850) 555-0142","hospital":"Ascension Sacred Heart Emerald Coast"}',
        '[{"title":"No smoking","enabled":true},{"title":"Quiet hours 10 PM – 8 AM","enabled":true}]',
        now()),
       ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',$1,'watercolor-dune-cottage','Watercolor Dune Cottage','Cottage','published',
        'A dune cottage a short walk from the beach club.','18 Lakeview Court','Watercolor','Watercolor',30.316,-86.103,
        '{"network":"WC-COTTAGE","password":"DuneLight2026","note":"Extender in the loft."}',
        '{"time":"4:00 PM","arrival":"Lockbox","doorCode":"3910"}',
        '{"time":"10:00 AM","lockUp":"Return bikes to the rack."}',
        '{"method":"Lockbox","code":"3910","instructions":"Lockbox on the porch rail.","parking":"One space under the house."}',
        '{"location":"Under-house space"}',
        '{"contact":"Michael Reyes","contactPhone":"(850) 555-0142","hospital":"Ascension Sacred Heart Emerald Coast"}',
        '[{"title":"No pets","enabled":true}]',
        now())
       on conflict (id) do nothing`,
      [hostId],
    );

    await client.query(
      `insert into guest_stays (id, guest_id, property_id, check_in_date, check_out_date, party_size, adults, children, confirmation_code, access_slug, status)
       values
       ('cccccccc-cccc-cccc-cccc-cccccccccccc','22222222-2222-2222-2222-222222222222','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','2026-08-20','2026-08-27',6,4,2,'MY30A-8842','demo','active'),
       ('dddddddd-dddd-dddd-dddd-dddddddddddd','33333333-3333-3333-3333-333333333333','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','2026-09-04','2026-09-11',4,2,2,'MY30A-2291','daniel','upcoming')
       on conflict (id) do nothing`,
    );
    await client.query(
      `insert into property_guests (guest_id, property_id, stay_id)
       values
       ('22222222-2222-2222-2222-222222222222','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','cccccccc-cccc-cccc-cccc-cccccccccccc'),
       ('33333333-3333-3333-3333-333333333333','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','dddddddd-dddd-dddd-dddd-dddddddddddd')
       on conflict do nothing`,
    );
    await client.query(
      `insert into guest_access_tokens (property_id, issued_by_host_id, token_hash, code, slug, max_uses)
       values
       ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',$1,$2,'MY30A-8842','demo', 50),
       ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',$1,$3,'MY30A-2291','daniel', 50)
       on conflict do nothing`,
      [hostId, sha256('MY30A-8842'), sha256('MY30A-2291')],
    );

    await importPartnerCategories(client);
    await importAppPartners(client);
    await importBeachAccess(client);

    const beachServices = await client.query<{ id: string }>(
      `select id from partner_categories where slug = 'beach-services'`,
    );
    if (beachServices.rows[0]) {
      await client.query(
        `insert into partners (email, password_hash, name, category_id, status, published, featured, listing_status, short_description, description)
         values ('partner@my30a.com',$1,'My30A Partner Desk',$2,'approved', false, false, 'paid_partner',
           'Partner console login. Not a guest-facing listing.',
           'Use this account to sign in to the partner app. Guest directory listings come from the imported spreadsheet.')
         on conflict (email) do update set password_hash = $1`,
        [hash, beachServices.rows[0].id],
      );
    }

    await upsertRestaurantCatalog(client);
    await client.query(`
      insert into events (id, title, description, event_date, event_time, location, category, active)
      values
      ('e1000000-0000-0000-0000-000000000001','Seaside Concert Series','Free lawn concert.','2026-08-21','7:00 PM','Seaside Amphitheatre','Music', true),
      ('e1000000-0000-0000-0000-000000000002','Rosemary Farmers Market','Sunday morning market.','2026-08-23','9:00 AM','North Square','Market', true)
      on conflict do nothing
    `);

    await client.query(`
      insert into airports (code, name, city, drive_time, base_fare_cents) values
      ('ECP','Northwest Florida Beaches Intl','Panama City','35 min', 15000),
      ('VPS','Destin–Fort Walton Beach','Valparaiso','55 min', 22500),
      ('PNS','Pensacola International','Pensacola','1 hr 50 min', 29900)
      on conflict (code) do update set base_fare_cents = excluded.base_fare_cents
    `);
    await client.query(`
      insert into vehicle_classes (id, name, capacity, seats, multiplier) values
      ('sedan','Luxury Sedan','3 guests · 3 bags',3,1),
      ('suv','Premium SUV','6 guests · 6 bags',6,1.35),
      ('sprinter','Sprinter Van','12 guests · 14 bags',12,1.9)
      on conflict (id) do update set multiplier = excluded.multiplier
    `);
    await client.query(`
      insert into service_pricing (kind, code, label, amount_cents, meta) values
      ('grocery_package','essentials','Essentials',14900, '{"maxItems":30}'),
      ('grocery_package','full','Full Pack',22900, '{"maxItems":70}'),
      ('grocery_package','large','Large Pack',32900, '{"maxItems":120}'),
      ('grocery_package','xl','XL Pack',37900, '{"maxItems":200}'),
      ('grocery_addon','rush','Rush',5000, '{}'),
      ('grocery_addon','holiday','Holiday',7500, '{}')
      on conflict (kind, code) do update set amount_cents = excluded.amount_cents
    `);
    await client.query(`
      insert into cancellation_policies (code, label, hours, fee_cents, note) values
      ('48_PLUS','48 hours or more',48,0,'Full refund or the authorisation is released.'),
      ('24_48_HOURS','24–48 hours',24,5000,'$50 fee, the remainder is refunded.'),
      ('SAME_DAY','Same day or no-show',0,7500,'$75 fee, the remainder is refunded.')
      on conflict (code) do update set fee_cents = excluded.fee_cents
    `);

    await client.query(
      `insert into grocery_orders (id, guest_id, property_id, stay_id, status, store, delivery_date, delivery_window, items_text, item_count, package_code, service_fee_cents, estimated_grocery_cents, timeline)
       values
       ('GR-1024','22222222-2222-2222-2222-222222222222','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','cccccccc-cccc-cccc-cccc-cccccccccccc','pending','Publix','2026-08-20','2:00 PM – 4:00 PM','Eggs\nMilk\nCoffee\nBread',4,'essentials',14900,28500,'[{"status":"pending","at":"2026-08-17T14:12:00Z","note":"Request submitted"}]'),
       ('GR-0987','22222222-2222-2222-2222-222222222222','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','cccccccc-cccc-cccc-cccc-cccccccccccc','delivered','The Fresh Market','2025-08-16','10:00 AM – 12:00 PM','Coffee beans\nAlmond milk',2,'essentials',14900,12000,'[{"status":"delivered","at":"2025-08-16T12:00:00Z","note":"Delivered"}]')
       on conflict do nothing`,
    );
    await client.query(
      `insert into airport_transfers (id, guest_id, property_id, stay_id, status, airport, pickup_date, pickup_time, passengers, bags, vehicle_id, quoted_fare_cents, flight_number, timeline)
       values
       ('TR-2048','22222222-2222-2222-2222-222222222222','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','cccccccc-cccc-cccc-cccc-cccccccccccc','pending','ECP','2026-08-20','14:00',6,4,'suv',20250,'DL 1844','[{"status":"pending","at":"2026-08-16T10:00:00Z","note":"Transfer requested"}]')
       on conflict do nothing`,
    );

    await client.query(`
      insert into knowledge_chunks (question, content, type, source_type, is_active) values
      ('How do I connect to the WiFi?','Each property publishes its own network in My Stay. Use the authorized property tool — never guess.','Property information','property', true),
      ('Can My30A book a golf cart?','No. Golf carts and similar services are independent partners. Show the listing and contact details only.','Service policy','admin', true),
      ('Where can I go to the beach?','Beach and bay access is free public info from Visit South Walton. Full Public Use, Limited Public Use, and Private are different. For live flags, text SAFETY to 31279. Never gate this behind a subscription.','Public info','admin', true),
      ('Can you book a restaurant?','Restaurants are not My30A partners. Each restaurant has its own booking_platform: OpenTable, Resy, SevenRooms, the restaurant website, or phone only. Use the restaurant record booking_url or phone. Never send every guest to a global OpenTable search.','Service policy','admin', true),
      ('Where do events come from?','The live events feed is 30A.com / Beach Happy, a private media brand, not Walton County Tourism. Prefer their RSS at /events/feed/.','Public info','admin', true),
      ('What is the transfer cancellation policy?','48h+ full refund concept. 24–48h $50 fee. Same day or no-show $75. Payment is not processed in this phase.','Service policy','admin', true)
      on conflict do nothing
    `);
    await client.query(
      `update knowledge_chunks
       set content = 'Restaurants are not My30A partners. Each restaurant has its own booking_platform: OpenTable, Resy, SevenRooms, the restaurant website, or phone only. Use the restaurant record booking_url or phone. Never send every guest to a global OpenTable search.'
       where question = 'Can you book a restaurant?'`,
    );

    await client.query(
      `insert into notifications (recipient_id, recipient_role, type, title, message, link)
       values
       ('22222222-2222-2222-2222-222222222222','GUEST','SYSTEM_ALERT','Welcome to My30A','Your stay at Rosemary Beach House is linked.','/discover'),
       ('11111111-1111-1111-1111-111111111111','HOST','NEW_GUEST','Sarah is checking in','Rosemary Beach House, 20 August.','/host/guests')
      `,
    );

    await client.query(`
      insert into system_settings (key, value) values
      ('general', '{"platformName":"My30A","timezone":"America/Chicago","currency":"USD"}'),
      ('payments', '{"provider":"none","readyForIntegration":true}')
      on conflict (key) do nothing
    `);

    await client.query('COMMIT');
    logger.info('seed complete');
    try {
      await syncEventsFeed();
    } catch (error) {
      logger.warn({ err: error }, '30A.com events feed could not be synced during seed');
    }
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
    if (pool !== migratePool) await migratePool.end().catch(() => undefined);
    if (pool !== migrateFallbackPool) await migrateFallbackPool.end().catch(() => undefined);
  }
}

main().catch((error) => {
  logger.error(error);
  process.exit(1);
});
