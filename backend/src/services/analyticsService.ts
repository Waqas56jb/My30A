import { query } from '../config/db.js';

export async function trackEvent(input: {
  eventName: string;
  userId?: string;
  guestId?: string;
  hostId?: string;
  partnerId?: string;
  propertyId?: string;
  sessionId?: string;
  metadata?: unknown;
}) {
  try {
    await query(
      `insert into analytics_events
        (event_name, user_id, guest_id, host_id, partner_id, property_id, session_id, metadata)
       values ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        input.eventName,
        input.userId ?? null,
        input.guestId ?? null,
        input.hostId ?? null,
        input.partnerId ?? null,
        input.propertyId ?? null,
        input.sessionId ?? null,
        JSON.stringify(input.metadata ?? {}),
      ],
    );
  } catch {
    // fire-and-forget
  }
}

const n = (row?: { n?: string | number }) => Number(row?.n ?? 0);

export async function adminOverview() {
  const todayStart = `date_trunc('day', now())`;
  const [
    guests,
    hosts,
    properties,
    partners,
    orders,
    transfers,
    conversations,
    activeGuests,
    upcomingGuests,
    activeHosts,
    activeProperties,
    approvedPartners,
    activeGrocery,
    activeTransfers,
    partnerClicks,
    pendingPartners,
    pendingOrders,
    pendingTransfers,
    escalations,
    todayGuests,
    todayHosts,
    todayPartners,
    todayGrocery,
    todayTransfers,
    todayDelivered,
    todayConversations,
    todayClicks,
    messages,
  ] = await Promise.all([
    query<{ n: string }>(`select count(*)::text as n from guests where deleted_at is null`),
    query<{ n: string }>(`select count(*)::text as n from hosts where deleted_at is null`),
    query<{ n: string }>(`select count(*)::text as n from properties where deleted_at is null`),
    query<{ n: string }>(`select count(*)::text as n from partners where deleted_at is null`),
    query<{ n: string }>(`select count(*)::text as n from grocery_orders where deleted_at is null`),
    query<{ n: string }>(`select count(*)::text as n from airport_transfers where deleted_at is null`),
    query<{ n: string }>(`select count(*)::text as n from conversations`),
    query<{ n: string }>(`select count(*)::text as n from guest_stays where check_in_date <= current_date and check_out_date >= current_date`),
    query<{ n: string }>(`select count(*)::text as n from guest_stays where check_in_date > current_date`),
    query<{ n: string }>(`select count(*)::text as n from hosts where deleted_at is null and status = 'active'`),
    query<{ n: string }>(`select count(*)::text as n from properties where deleted_at is null and status = 'published'`),
    query<{ n: string }>(`select count(*)::text as n from partners where deleted_at is null and status = 'approved'`),
    query<{ n: string }>(`select count(*)::text as n from grocery_orders where deleted_at is null and status in ('pending','confirmed','paid','shopping','on_the_way')`),
    query<{ n: string }>(`select count(*)::text as n from airport_transfers where deleted_at is null and status in ('pending','confirmed','payment_authorized','driver_assigned','in_progress')`),
    query<{ n: string }>(`select count(*)::text as n from partner_click_events`),
    query<{ n: string }>(`select count(*)::text as n from partners where status = 'pending'`),
    query<{ n: string }>(`select count(*)::text as n from grocery_orders where status = 'pending'`),
    query<{ n: string }>(`select count(*)::text as n from airport_transfers where status = 'pending'`),
    query<{ n: string }>(`select count(*)::text as n from conversations where status = 'escalated'`),
    query<{ n: string }>(`select count(*)::text as n from guests where deleted_at is null and created_at >= ${todayStart}`),
    query<{ n: string }>(`select count(*)::text as n from hosts where deleted_at is null and created_at >= ${todayStart}`),
    query<{ n: string }>(`select count(*)::text as n from partners where deleted_at is null and created_at >= ${todayStart}`),
    query<{ n: string }>(`select count(*)::text as n from grocery_orders where deleted_at is null and created_at >= ${todayStart}`),
    query<{ n: string }>(`select count(*)::text as n from airport_transfers where deleted_at is null and created_at >= ${todayStart}`),
    query<{ n: string }>(`select count(*)::text as n from grocery_orders where status = 'delivered' and updated_at >= ${todayStart}`),
    query<{ n: string }>(`select count(*)::text as n from conversations where created_at >= ${todayStart}`),
    query<{ n: string }>(`select count(*)::text as n from partner_click_events where created_at >= ${todayStart}`),
    query<{ n: string }>(`select count(*)::text as n from messages`),
  ]);

  const groceryN = n(orders.rows[0]);
  const transferN = n(transfers.rows[0]);
  const clickN = n(partnerClicks.rows[0]);

  return {
    totals: {
      guests: n(guests.rows[0]),
      activeGuests: n(activeGuests.rows[0]),
      upcomingGuests: n(upcomingGuests.rows[0]),
      hosts: n(hosts.rows[0]),
      activeHosts: n(activeHosts.rows[0]),
      properties: n(properties.rows[0]),
      activeProperties: n(activeProperties.rows[0]),
      partners: n(partners.rows[0]),
      approvedPartners: n(approvedPartners.rows[0]),
      groceryOrders: groceryN,
      transfers: transferN,
      conversations: n(conversations.rows[0]),
      messages: n(messages.rows[0]),
      activeRequests: n(activeGrocery.rows[0]) + n(activeTransfers.rows[0]),
      partnerClicks: clickN,
      revenue: 0,
      netRevenue: 0,
    },
    today: {
      date: new Date().toISOString().slice(0, 10),
      newGuests: n(todayGuests.rows[0]),
      newHosts: n(todayHosts.rows[0]),
      newPartners: n(todayPartners.rows[0]),
      newRequests: n(todayGrocery.rows[0]) + n(todayTransfers.rows[0]),
      completedOrders: n(todayDelivered.rows[0]),
      payments: 0,
      refunds: 0,
      conversations: n(todayConversations.rows[0]),
      partnerClicks: n(todayClicks.rows[0]),
      revenue: 0,
    },
    attention: [
      { id: 'partners', count: n(pendingPartners.rows[0]), label: 'partner applications awaiting approval', to: '/admin/partners?status=pending' },
      { id: 'orders', count: n(pendingOrders.rows[0]), label: 'grocery orders awaiting confirmation', to: '/admin/grocery?status=pending' },
      { id: 'transfers', count: n(pendingTransfers.rows[0]), label: 'airport transfers awaiting confirmation', to: '/admin/transfers?status=pending' },
      { id: 'escalations', count: n(escalations.rows[0]), label: 'Vitoria escalations', to: '/admin/vitoria/conversations?status=escalated' },
    ].filter((a) => a.count > 0),
  };
}

const RANGE: Record<string, { days: number; trunc: 'hour' | 'day' | 'week' | 'month' }> = {
  today: { days: 1, trunc: 'hour' },
  '7d': { days: 7, trunc: 'day' },
  '30d': { days: 30, trunc: 'day' },
  '90d': { days: 90, trunc: 'week' },
  '12m': { days: 365, trunc: 'month' },
};

function metricSql(metric: string) {
  switch (metric) {
    case 'hosts':
      return `select created_at from hosts where deleted_at is null`;
    case 'partners':
      return `select created_at from partners where deleted_at is null`;
    case 'requests':
      return `select created_at from grocery_orders where deleted_at is null union all select created_at from airport_transfers where deleted_at is null`;
    case 'conversations':
      return `select created_at from conversations`;
    case 'partnerClicks':
      return `select created_at from partner_click_events`;
    case 'visits':
      return `select created_at from analytics_events`;
    case 'revenue':
      return `select created_at from grocery_orders where deleted_at is null and status = 'delivered'`;
    case 'guests':
    default:
      return `select created_at from guests where deleted_at is null`;
  }
}

export async function adminSeries(metric = 'conversations', rangeId = '30d') {
  const spec = RANGE[rangeId] ?? RANGE['30d'];
  const step = spec.trunc === 'hour' ? '1 hour' : spec.trunc === 'week' ? '1 week' : spec.trunc === 'month' ? '1 month' : '1 day';
  const startSql =
    spec.trunc === 'hour'
      ? `date_trunc('hour', now()) - interval '23 hours'`
      : `date_trunc('${spec.trunc}', now() - ($1::int * interval '1 day'))`;

  const { rows } = await query<{ bucket: Date; n: string | number }>(
    `with src as (${metricSql(metric)}),
     buckets as (
       select generate_series(
         ${startSql},
         date_trunc('${spec.trunc}', now()),
         interval '${step}'
       ) as bucket
     )
     select b.bucket, count(s.created_at)::int as n
     from buckets b
     left join src s on date_trunc('${spec.trunc}', s.created_at) = b.bucket
     group by 1
     order by 1`,
    spec.trunc === 'hour' ? [] : [spec.days],
  );

  return rows.map((row) => {
    const d = new Date(row.bucket);
    const label =
      spec.trunc === 'hour'
        ? d.toLocaleTimeString('en-US', { hour: 'numeric' })
        : spec.trunc === 'month'
          ? d.toLocaleDateString('en-US', { month: 'short' })
          : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return { label, value: n(row) };
  });
}
