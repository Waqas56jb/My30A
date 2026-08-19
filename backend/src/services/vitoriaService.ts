import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { query } from '../config/db.js';
import { errors } from '../utils/errors.js';
import { logger } from '../config/logger.js';
import { getActiveModel, runConciergeTurn, type ConciergeTool } from '../integrations/openai/openai.js';
import { getAuthorizedProperty, currentStay } from './stayService.js';
import { listPartnersPublic, getPartnerPublic, listRestaurants, listEvents, listBeaches, getWeather, getCategories } from './exploreService.js';
import { createGroceryRequest, getGrocery, listGroceries } from './groceryService.js';
import { createTransferRequest, getTransfer, listTransfers } from './transferService.js';
import { getPricingCatalog } from './pricingService.js';
import { listNotifications } from './notificationService.js';
import type { AuthAccount } from '../types/index.js';

const promptPath = resolve(process.cwd(), 'src/prompts/vitoria.txt');

function systemPrompt() {
  try {
    return readFileSync(promptPath, 'utf8');
  } catch {
    return 'You are Vitoria, the My30A concierge. Use tools. Never invent facts.';
  }
}

const TOOLS: ConciergeTool[] = [
  { type: 'function', name: 'get_guest_profile', description: 'The authenticated guest profile', parameters: { type: 'object', properties: {} } },
  { type: 'function', name: 'get_current_stay', description: 'Current stay binding', parameters: { type: 'object', properties: {} } },
  { type: 'function', name: 'get_property_information', description: 'Authorized property details including WiFi and access', parameters: { type: 'object', properties: {} } },
  { type: 'function', name: 'get_property_rules', description: 'House rules for the authorized stay only', parameters: { type: 'object', properties: {} } },
  { type: 'function', name: 'get_property_access_information', description: 'Door code and access notes for the authorized stay only', parameters: { type: 'object', properties: {} } },
  { type: 'function', name: 'get_local_categories', description: 'Enabled local-guide categories', parameters: { type: 'object', properties: {} } },
  { type: 'function', name: 'get_guest_activity', description: 'This guest orders and notifications only', parameters: { type: 'object', properties: {} } },
  { type: 'function', name: 'get_local_partners', description: 'Approved partners only', parameters: { type: 'object', properties: { category: { type: 'string' } } } },
  { type: 'function', name: 'get_partner_details', description: 'One approved partner. Do not promise availability.', parameters: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
  { type: 'function', name: 'get_restaurants', description: 'Restaurant directory with id, image, booking_platform, booking_url, and phone. Never assume OpenTable. Use id in markdown links.', parameters: { type: 'object', properties: { search: { type: 'string' } } } },
  { type: 'function', name: 'get_events', description: 'Local events with id, image, date, time, and location. Use id in markdown links.', parameters: { type: 'object', properties: {} } },
  { type: 'function', name: 'get_beaches', description: 'Public beach and bay access with id, image, and location. Use id in markdown links.', parameters: { type: 'object', properties: { search: { type: 'string' } } } },
  { type: 'function', name: 'get_weather', description: '30A weather', parameters: { type: 'object', properties: {} } },
  { type: 'function', name: 'get_orders', description: 'This guest grocery and transfer requests', parameters: { type: 'object', properties: {} } },
  { type: 'function', name: 'get_order_status', description: 'One order', parameters: { type: 'object', properties: { kind: { type: 'string' }, id: { type: 'string' } }, required: ['kind', 'id'] } },
  { type: 'function', name: 'get_service_pricing', description: 'Published grocery packages and airport fares', parameters: { type: 'object', properties: {} } },
  { type: 'function', name: 'get_cancellation_policy', description: 'Transfer cancellation tiers', parameters: { type: 'object', properties: {} } },
  { type: 'function', name: 'create_grocery_request', description: 'Create a PENDING grocery request. Never confirm.', parameters: { type: 'object', properties: { items: { type: 'string' }, deliveryDate: { type: 'string' }, deliveryWindow: { type: 'string' }, store: { type: 'string' }, notes: { type: 'string' } }, required: ['items', 'deliveryDate'] } },
  { type: 'function', name: 'create_airport_transfer_request', description: 'Create a PENDING transfer. Never confirm.', parameters: { type: 'object', properties: { airport: { type: 'string' }, date: { type: 'string' }, time: { type: 'string' }, passengers: { type: 'number' }, bags: { type: 'number' }, flightNumber: { type: 'string' }, vehicleClass: { type: 'string' } }, required: ['airport', 'date', 'time', 'passengers'] } },
  { type: 'function', name: 'get_guest_notifications', description: 'Recent notification rows', parameters: { type: 'object', properties: {} } },
  { type: 'function', name: 'escalate_to_human', description: 'Escalate urgent issues', parameters: { type: 'object', properties: { reason: { type: 'string' } }, required: ['reason'] } },
];

async function runTool(name: string, args: Record<string, unknown>, account: AuthAccount) {
  switch (name) {
    case 'get_guest_profile': {
      const { rows } = await query(`select id, first_name, last_name, email, phone, language from guests where id = $1`, [account.id]);
      return rows[0] ?? {};
    }
    case 'get_current_stay':
      return (await currentStay(account.id)) ?? { stay: null };
    case 'get_property_information':
      return getAuthorizedProperty(account);
    case 'get_property_rules': {
      const property = await getAuthorizedProperty(account);
      return { rules: property.rules ?? [] };
    }
    case 'get_property_access_information': {
      const property = await getAuthorizedProperty(account);
      return { access: property.access, wifi: property.wifi, checkIn: property.checkIn, checkOut: property.checkOut };
    }
    case 'get_local_categories':
      return getCategories();
    case 'get_guest_activity': {
      const [g, t, n] = await Promise.all([
        listGroceries(account),
        listTransfers(account),
        listNotifications(account.id, 'GUEST'),
      ]);
      return { groceries: g, transfers: t, notifications: n };
    }
    case 'get_local_partners':
      return (await listPartnersPublic({ category: args.category as string | undefined })).slice(0, 12).map(compactListing);
    case 'get_partner_details': {
      const partner = await getPartnerPublic(String(args.id));
      return { ...compactListing(partner as Record<string, unknown>), contactOnly: true, note: 'Guest must contact the partner directly. Do not quote a price as a booking.' };
    }
    case 'get_restaurants':
      return (await listRestaurants({ search: args.search as string | undefined })).slice(0, 12).map(compactListing);
    case 'get_events':
      return (await listEvents()).slice(0, 16).map(compactListing);
    case 'get_beaches':
      return (await listBeaches(String(args.search ?? ''))).slice(0, 12).map(compactListing);
    case 'get_weather':
      return getWeather();
    case 'get_orders': {
      const [g, t] = await Promise.all([listGroceries(account), listTransfers(account)]);
      return { groceries: g, transfers: t };
    }
    case 'get_order_status':
      return String(args.kind) === 'transfer'
        ? getTransfer(String(args.id), account)
        : getGrocery(String(args.id), account);
    case 'get_service_pricing':
    case 'get_cancellation_policy':
      return getPricingCatalog();
    case 'create_grocery_request':
      return createGroceryRequest(account, {
        items: String(args.items),
        deliveryDate: String(args.deliveryDate),
        deliveryWindow: String(args.deliveryWindow ?? '2:00 PM – 4:00 PM'),
        store: args.store as string | undefined,
        notes: args.notes as string | undefined,
        cancellationAccepted: true,
        createdBy: 'vitoria',
      });
    case 'create_airport_transfer_request':
      return createTransferRequest(account, {
        airport: String(args.airport).toUpperCase(),
        date: String(args.date),
        time: String(args.time),
        passengers: Number(args.passengers),
        bags: args.bags != null ? Number(args.bags) : 0,
        flightNumber: args.flightNumber as string | undefined,
        vehicleClass: (args.vehicleClass as string | undefined) ?? 'suv',
        createdBy: 'vitoria',
      });
    case 'get_guest_notifications':
      return listNotifications(account.id, 'GUEST');
    case 'escalate_to_human':
      await query(`update conversations set status = 'escalated' where guest_id = $1 and status = 'active'`, [account.id]);
      return { escalated: true, reason: args.reason };
    default:
      return { error: 'unknown_tool' };
  }
}

async function runToolSafe(name: string, args: Record<string, unknown>, account: AuthAccount) {
  try {
    return await runTool(name, args, account);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'tool_failed';
    logger.warn({ name, err: error }, 'Vitoria tool failed');
    return { error: message };
  }
}

async function resolveConversationId(account: AuthAccount, conversationId: string | undefined, title: string) {
  if (conversationId) {
    const owned = await query(
      `select id from conversations where id = $1 and guest_id = $2`,
      [conversationId, account.id],
    );
    if (owned.rows[0]) return String(owned.rows[0].id);
  }
  const existing = await query(
    `select id from conversations where guest_id = $1 and status = 'active' order by updated_at desc limit 1`,
    [account.id],
  );
  if (existing.rows[0]) return String(existing.rows[0].id);
  const created = await query(
    `insert into conversations (guest_id, property_id, title, topic, status, language)
     values ($1,$2,$3,$4,'active','en') returning id`,
    [account.id, account.propertyId ?? null, title.slice(0, 80), inferTopic(title)],
  );
  return String(created.rows[0].id);
}

export async function sendMessage(account: AuthAccount, text: string, conversationId?: string) {
  if (!getActiveModel()) throw errors.vitoriaUnavailable();

  const trimmed = String(text ?? '').trim();
  if (!trimmed) throw errors.validation('Write a message for Vitoria.');

  const convId = await resolveConversationId(account, conversationId, trimmed);
  const topic = inferTopic(trimmed);

  await query(
    `insert into messages (conversation_id, sender_type, sender_id, role, content) values ($1,'guest',$2,'user',$3)`,
    [convId, account.id, trimmed],
  );
  await query(
    `update conversations
        set topic = coalesce(nullif(topic, ''), $2),
            title = coalesce(nullif(title, ''), $3),
            updated_at = now()
      where id = $1`,
    [convId, topic, trimmed.slice(0, 80)],
  );

  const history = await query<{ role: string; content: string }>(
    `select role, content from messages where conversation_id = $1 and role in ('user','assistant') order by created_at asc limit 40`,
    [convId],
  );

  let replyText =
    'I want to get that right rather than guess. Tell me a little more, or I can connect you with the team.';
  let toolCalls: Array<{ name: string; arguments?: { id?: string } }> = [];
  const gathered: Array<{ name: string; result: unknown }> = [];

  try {
    const turn = await runConciergeTurn({
      instructions: systemPrompt(),
      messages: history.rows.map((row) => ({
        role: row.role === 'assistant' ? 'assistant' : 'user',
        content: row.content,
      })),
      tools: TOOLS,
      executeTool: async (name, args) => {
        const result = await runToolSafe(name, args, account);
        gathered.push({ name, result });
        return result;
      },
    });
    replyText = turn.text;
    toolCalls = turn.toolCalls;
  } catch (error) {
    logger.error({ err: error }, 'Vitoria turn failed');
    replyText = 'I could not complete that reply just now. Please try again in a moment.';
  }

  const cards = extractCards(replyText, gathered);
  const actions = extractActions(toolCalls);

  const saved = await query<{ id: string; created_at: string }>(
    `insert into messages (conversation_id, sender_type, role, content, tool_calls, metadata)
     values ($1,'assistant','assistant',$2,$3,$4) returning id, created_at`,
    [convId, replyText, JSON.stringify(toolCalls), JSON.stringify({ model: getActiveModel(), cards, actions })],
  );
  await query(`update conversations set updated_at = now() where id = $1`, [convId]);

  return {
    id: saved.rows[0]?.id ?? convId,
    role: 'assistant',
    at: saved.rows[0]?.created_at ?? new Date().toISOString(),
    text: replyText,
    cards,
    actions,
    conversationId: convId,
  };
}

function listingImage(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) return null;
  const src = value.trim();
  if (/^https?:\/\//i.test(src) || src.startsWith('/')) return src;
  return `https://images.unsplash.com/photo-${src}?auto=format&fit=crop&w=800&h=520&q=72`;
}

function compactListing(row: Record<string, unknown>) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name ?? row.title,
    title: row.title ?? row.name,
    type: row.type,
    cuisine: row.cuisine,
    category: row.category,
    location: row.location,
    shortDescription: row.shortDescription,
    image: listingImage(row.image),
    phone: row.phone,
    website: row.website,
    bookingPlatform: row.bookingPlatform,
    bookingUrl: row.bookingUrl,
    date: row.date,
    time: row.time,
    externalUrl: row.externalUrl,
  };
}

function toolKind(name: string) {
  if (name === 'get_restaurants') return 'restaurant';
  if (name === 'get_events') return 'event';
  if (name === 'get_beaches') return 'beach';
  if (name === 'get_local_partners' || name === 'get_partner_details') return 'partner';
  return null;
}

function asRows(result: unknown): Record<string, unknown>[] {
  if (Array.isArray(result)) return result.filter((row) => row && typeof row === 'object') as Record<string, unknown>[];
  if (result && typeof result === 'object' && 'id' in (result as object)) return [result as Record<string, unknown>];
  return [];
}

function toCard(kind: string, row: Record<string, unknown>) {
  const id = String(row.id ?? '');
  const name = String(row.name ?? row.title ?? '');
  if (!id || !name) return null;
  return {
    kind,
    refId: id,
    name,
    image: row.image ?? null,
    location: row.location ?? null,
    subtitle: row.cuisine ?? row.category ?? row.time ?? null,
    website: row.website ?? row.externalUrl ?? row.bookingUrl ?? null,
  };
}

function extractCards(text: string, gathered: Array<{ name: string; result: unknown }>) {
  const catalog: Array<{ kind: string; row: Record<string, unknown>; card: NonNullable<ReturnType<typeof toCard>> }> = [];
  for (const item of gathered) {
    const kind = toolKind(item.name);
    if (!kind) continue;
    for (const row of asRows(item.result)) {
      const card = toCard(kind, row);
      if (card) catalog.push({ kind, row, card });
    }
  }

  const hay = text.toLowerCase();
  const picked: typeof catalog = [];
  const seen = new Set<string>();

  const take = (entry: (typeof catalog)[number]) => {
    if (seen.has(entry.card.refId)) return;
    seen.add(entry.card.refId);
    picked.push(entry);
  };

  for (const match of text.matchAll(/\/(restaurants|events|partners|beaches)\/([a-zA-Z0-9-]+)/g)) {
    const id = match[2];
    const found = catalog.find((entry) => entry.card.refId === id || String(entry.row.slug ?? '') === id);
    if (found) take(found);
  }

  for (const entry of catalog) {
    const name = entry.card.name.toLowerCase();
    if (name.length > 3 && hay.includes(name)) take(entry);
  }

  if (!picked.length) {
    catalog.slice(0, 4).forEach(take);
  }

  return picked.slice(0, 6).map((entry) => entry.card);
}

function extractActions(toolCalls: unknown[]) {
  const actions: Array<{ label: string; to: string; icon: string }> = [];
  const seen = new Set<string>();
  const add = (action: { label: string; to: string; icon: string }) => {
    if (seen.has(action.to)) return;
    seen.add(action.to);
    actions.push(action);
  };
  for (const call of toolCalls as Array<{ name: string; arguments?: { id?: string } }>) {
    if (call.name === 'create_grocery_request') add({ label: 'Track grocery request', to: '/groceries', icon: 'bag' });
    if (call.name === 'create_airport_transfer_request') add({ label: 'Track transfer', to: '/transfers', icon: 'car' });
    if (call.name === 'get_restaurants') add({ label: 'See restaurants', to: '/restaurants', icon: 'utensils' });
    if (call.name === 'get_events') add({ label: 'See events', to: '/events', icon: 'calendar' });
    if (call.name === 'get_beaches') add({ label: 'Beach access', to: '/beaches', icon: 'umbrella' });
    if (call.name === 'get_local_partners' || call.name === 'get_partner_details') {
      add({ label: 'Local partners', to: '/partners', icon: 'sparkles' });
    }
  }
  return actions;
}

export async function listGuestMessages(account: AuthAccount) {
  const { rows: conv } = await query(
    `select id from conversations where guest_id = $1 and status = 'active' order by updated_at desc limit 1`,
    [account.id],
  );
  if (!conv[0]) return [];
  const conversationId = String(conv[0].id);
  const { rows } = await query<{
    id: string;
    role: string;
    text: string;
    at: string;
    metadata: { cards?: unknown; actions?: unknown } | null;
  }>(
    `select id, role, content as text, created_at as at, metadata from messages
     where conversation_id = $1 and role in ('user','assistant') order by created_at`,
    [conversationId],
  );
  return rows.map((row) => ({
    id: row.id,
    role: row.role,
    text: row.text,
    at: row.at,
    conversationId,
    cards: row.metadata?.cards ?? [],
    actions: row.metadata?.actions ?? [],
  }));
}

export async function clearGuestConversations(account: AuthAccount) {
  await query(
    `update conversations set status = 'resolved', updated_at = now()
     where guest_id = $1 and status = 'active'`,
    [account.id],
  );
  return { ok: true };
}

export function inferTopic(text: string) {
  const t = String(text ?? '').toLowerCase();
  if (/wifi|wi-?fi|password|router|network/.test(t)) return 'WiFi';
  if (/check[- ]?in|keypad|door code|arrival|late/.test(t)) return 'Check-in';
  if (/check[- ]?out|before we leave|depart/.test(t)) return 'Check-out';
  if (/restaurant|dinner|breakfast|lunch|eat|reservation|opentable|cafe/.test(t)) return 'Restaurant';
  if (/beach|swim|gulf|boardwalk/.test(t)) return 'Beach';
  if (/golf.?cart|cart rental/.test(t)) return 'Golf Cart';
  if (/bonfire|fire pit/.test(t)) return 'Bonfire';
  if (/groc|fridge|stocked|shopping list|milk|eggs/.test(t)) return 'Grocery';
  if (/airport|transfer|pickup|ecp|vps|pns|flight|uber/.test(t)) return 'Airport Transfer';
  if (/emergenc|air condition|\bac\b|leak|broken|flood/.test(t)) return 'Emergency';
  if (/house rule|quiet hour|parties|pets allowed/.test(t)) return 'House Rules';
  if (/event|concert|market|this week/.test(t)) return 'General';
  return 'General';
}

const CONVERSATION_LIST_SQL = `
  select
    c.id,
    c.guest_id,
    c.property_id,
    c.title,
    c.topic,
    c.status,
    c.language,
    c.created_at,
    c.updated_at,
    trim(coalesce(g.first_name, '') || ' ' || coalesce(g.last_name, '')) as guest_name,
    g.email as guest_email,
    p.name as property_name,
    coalesce((select count(*)::int from messages m where m.conversation_id = c.id), 0) as message_count,
    (select m.content from messages m where m.conversation_id = c.id and m.role = 'user' order by m.created_at asc limit 1) as first_message,
    greatest(0, coalesce((
      select extract(epoch from (
        (select min(created_at) from messages where conversation_id = c.id and role = 'assistant')
        - (select min(created_at) from messages where conversation_id = c.id and role = 'user')
      ))::int
    ), 0)) as response_seconds,
    exists (
      select 1 from messages m
      where m.conversation_id = c.id
        and coalesce(m.tool_calls::text, '') ilike '%create_grocery_request%'
    ) as created_grocery,
    exists (
      select 1 from messages m
      where m.conversation_id = c.id
        and coalesce(m.tool_calls::text, '') ilike '%create_airport_transfer_request%'
    ) as created_transfer
  from conversations c
  left join guests g on g.id = c.guest_id
  left join properties p on p.id = c.property_id
`;

export async function listAdminConversations(hostId?: string) {
  const { rows } = await query(
    `${CONVERSATION_LIST_SQL}
     where ($1::uuid is null or p.host_id = $1)
     order by c.updated_at desc
     limit 300`,
    [hostId ?? null],
  );
  return rows.map(decorateConversation);
}

export async function getAdminConversation(id: string) {
  const { rows } = await query(`${CONVERSATION_LIST_SQL} where c.id = $1`, [id]);
  if (!rows[0]) return null;
  const conversation = decorateConversation(rows[0]);
  const messages = await query(
    `select id, role, sender_type, content, created_at, metadata, tool_calls
     from messages
     where conversation_id = $1 and role in ('user','assistant')
     order by created_at`,
    [id],
  );
  return {
    ...conversation,
    messages: messages.rows.map((row) => ({
      id: row.id,
      role: row.role === 'assistant' || row.sender_type === 'assistant' ? 'vitoria' : 'guest',
      text: row.content ?? '',
      at: row.created_at,
    })),
  };
}

function decorateConversation(row: Record<string, unknown>) {
  const first = String(row.first_message ?? row.title ?? '');
  const topic = String(row.topic || inferTopic(first));
  let createdRequest = null;
  if (row.created_transfer) createdRequest = { kind: 'transfer', label: 'Airport transfer request' };
  else if (row.created_grocery) createdRequest = { kind: 'grocery', label: 'Grocery delivery request' };
  return { ...row, topic, createdRequest };
}

export async function vitoriaKpis() {
  const [counts, avg] = await Promise.all([
    query<{ conversations: string; messages: string; active: string; resolved: string; escalated: string }>(`
      select
        (select count(*)::text from conversations) as conversations,
        (select count(*)::text from messages where role in ('user','assistant')) as messages,
        (select count(*)::text from conversations where status = 'active') as active,
        (select count(*)::text from conversations where status = 'resolved') as resolved,
        (select count(*)::text from conversations where status = 'escalated') as escalated
    `),
    query<{ avg_seconds: string | null }>(`
      select avg(extract(epoch from (asst.first_at - usr.first_at)))::text as avg_seconds
      from (
        select conversation_id, min(created_at) as first_at
        from messages
        where role = 'user'
        group by conversation_id
      ) usr
      join (
        select conversation_id, min(created_at) as first_at
        from messages
        where role = 'assistant'
        group by conversation_id
      ) asst on asst.conversation_id = usr.conversation_id
    `),
  ]);
  const row = counts.rows[0] ?? { conversations: '0', messages: '0', active: '0', resolved: '0', escalated: '0' };
  const total = Number(row.conversations) || 0;
  const escalated = Number(row.escalated) || 0;
  const avgRaw = Number(avg.rows[0]?.avg_seconds);
  return {
    conversations: total,
    messages: Number(row.messages) || 0,
    active: Number(row.active) || 0,
    resolved: Number(row.resolved) || 0,
    escalated,
    automatedRate: total ? (total - escalated) / total : 0,
    escalationRate: total ? escalated / total : 0,
    avgResponse: Number.isFinite(avgRaw) && avgRaw >= 0 ? avgRaw : 0,
  };
}
