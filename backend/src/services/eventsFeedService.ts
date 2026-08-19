import { query } from '../config/db.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { eventCoverImage, extractFeedImage } from '../data/listingImages.js';

const ATTRIBUTION = '30A.com / Beach Happy — private media brand, not Walton County Tourism.';

function decode(html: string) {
  return html
    .replace(/<!\[CDATA\[|\]\]>/g, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .trim();
}

function tag(xml: string, name: string) {
  const match = xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, 'i'));
  return match ? decode(match[1]) : '';
}

function categorize(title: string, description: string) {
  const text = `${title} ${description}`.toLowerCase();
  if (/market|farmer/.test(text)) return 'Market';
  if (/yoga|wellness|spa/.test(text)) return 'Wellness';
  if (/art|gallery|exhibit/.test(text)) return 'Arts';
  if (/kid|family|camp/.test(text)) return 'Family';
  if (/food|dinner|brunch|wine|taco|oyster/.test(text)) return 'Food & Drink';
  if (/music|band|karaoke|concert|live/.test(text)) return 'Live Music';
  return 'Community';
}

export async function syncEventsFeed() {
  const res = await fetch(env.EVENTS_FEED_URL, { headers: { Accept: 'application/rss+xml, application/xml, text/xml' } });
  if (!res.ok) throw new Error(`Events feed ${res.status}`);
  const xml = await res.text();
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].map((m) => m[1]);
  let upserted = 0;
  for (const item of items) {
    const title = tag(item, 'title');
    const link = tag(item, 'link');
    const guid = tag(item, 'guid') || link;
    const description = tag(item, 'description');
    const pub = tag(item, 'pubDate');
    if (!title || !guid) continue;
    const when = pub ? new Date(pub) : new Date();
    const eventDate = Number.isNaN(when.getTime()) ? null : when.toISOString().slice(0, 10);
    const timeMatch = description.match(/(\d{1,2}:\d{2}\s*[ap]m)/i);
    const lines = description.split('\n').map((l) => l.trim()).filter(Boolean);
    const location = lines.slice(1, 3).join(' · ') || lines[0] || '30A';
    const category = categorize(title, description);
    const image = eventCoverImage({
      image: extractFeedImage(item),
      title,
      category,
      location,
      description,
    });
    await query(
      `insert into events (title, description, event_date, event_time, location, website, external_url, category, image, active, source, source_id, source_attribution, synced_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,true,'30a.com',$10,$11, now())
       on conflict (source, source_id) do update set
         title = excluded.title,
         description = excluded.description,
         event_date = excluded.event_date,
         event_time = excluded.event_time,
         location = excluded.location,
         website = excluded.website,
         external_url = excluded.external_url,
         category = excluded.category,
         image = coalesce(excluded.image, events.image),
         active = true,
         source_attribution = excluded.source_attribution,
         synced_at = now()`,
      [title, description, eventDate, timeMatch?.[1] ?? null, location, link, link, category, image, guid, ATTRIBUTION],
    );
    upserted += 1;
  }
  logger.info({ upserted, feed: env.EVENTS_FEED_URL }, 'synced 30A.com events RSS');
  return { upserted, source: '30a.com', attribution: ATTRIBUTION };
}
