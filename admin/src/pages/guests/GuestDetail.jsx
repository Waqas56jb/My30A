import { Link, useParams } from 'react-router-dom'
import Icon from '../../components/ui/Icon'
import Button from '../../components/ui/Button'
import { SkeletonPage } from '../../components/ui/Skeleton'
import { ErrorState } from '../../components/ui/States'
import {
  PageHeader, Panel, Grid, Stat, Facts, StatusPill, ActivityList, InlineEmpty, Money, ReferralNote,
} from '../../components/common/AdminUI'
import DataTable from '../../components/tables/DataTable'
import { useLoad } from '../../hooks/useTable'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import * as api from '../../services/adminApi'
import { GUEST_STATUSES, buildGuestTimeline } from '../../data/guests'
import { GROCERY_STATUSES } from '../../data/orders'
import { TRANSFER_STATUSES } from '../../data/transfers'
import { PAYMENT_STATUSES, PAYMENT_TYPES } from '../../data/payments'
import { CONVERSATION_STATUSES } from '../../data/conversations'
import { formatDate, formatShortDate, formatRelative, formatNumber } from '../../utils/format'

/** Everything about one guest, assembled from every record that mentions them. */
export default function GuestDetail() {
  const { id } = useParams()
  const { data, loading, error, reload } = useLoad(() => api.getGuest(id), [id])

  useDocumentTitle(data?.guest?.name || 'Guest')

  if (loading) return <SkeletonPage />
  if (error || !data?.guest) return <ErrorState error={error} onRetry={reload} title="We could not open that" />

  const guest = data.guest
  const orders = Array.isArray(data.orders) ? data.orders : []
  const transfers = Array.isArray(data.transfers) ? data.transfers : []
  const payments = Array.isArray(data.payments) ? data.payments : []
  const conversations = Array.isArray(data.conversations) ? data.conversations : []
  const reviews = Array.isArray(data.reviews) ? data.reviews : []
  const stats = guest.stats ?? {}
  const timeline = buildGuestTimeline(guest, { orders, transfers, conversations, payments })
  const spend = payments.filter((p) => p.status === 'captured').reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
  const tips = payments.filter((p) => p.type === 'tip').reduce((sum, p) => sum + (Number(p.amount) || 0), 0)

  return (
    <div className="apage">
      <PageHeader
        title={guest.name}
        subtitle={`${guest.email} · ${guest.phone} · ${guest.language}`}
        back={{ to: '/admin/guests', label: 'All guests' }}
        actions={
          <>
            <StatusPill map={GUEST_STATUSES} value={guest.status} />
            {guest.propertyId ? (
              <Button to={`/admin/properties/${guest.propertyId}`} variant="secondary" size="sm" icon="key">
                Property
              </Button>
            ) : null}
          </>
        }
      />

      <div className="astats">
        <Stat label="Conversations" value={stats.conversations ?? 0} icon="message" tone="sea" />
        <Stat label="Service requests" value={orders.length + transfers.length} icon="clock" tone="info" />
        <Stat label="Total spend" value={<Money amount={spend} />} icon="creditCard" tone="success" />
        <Stat label="Tips given" value={<Money amount={tips} />} icon="heart" tone="gold" />
      </div>

      <Grid cols={2}>
        <Panel title="Guest">
          <Facts
            items={[
              { label: 'Full name', value: guest.name },
              { label: 'Email', value: guest.email },
              { label: 'Phone', value: guest.phone },
              { label: 'Language', value: guest.language },
              { label: 'Party', value: `${guest.adults} adults, ${guest.children} children` },
              { label: 'Returning guest', value: guest.returning ? 'Yes' : 'First stay' },
              { label: 'Confirmation', value: guest.confirmationCode },
              { label: 'Joined', value: formatDate(guest.joinedAt) },
            ]}
          />
        </Panel>

        <Panel title="Stay">
          <Facts
            items={[
              {
                label: 'Property',
                value: (
                  <Link to={`/admin/properties/${guest.propertyId}`}>{guest.propertyName}</Link>
                ),
              },
              { label: 'Host', value: <Link to={`/admin/hosts/${guest.hostId}`}>{guest.hostName}</Link> },
              { label: 'Arrival', value: formatDate(guest.checkIn) },
              { label: 'Departure', value: formatDate(guest.checkOut) },
              { label: 'Nights', value: guest.nights },
              { label: 'Last activity', value: formatRelative(guest.lastActiveAt) },
              { label: 'Stay rating', value: guest.rating ? `${guest.rating} out of 5` : 'Not rated yet' },
            ]}
          />
        </Panel>
      </Grid>

      {/* ------------------------------ Timeline ------------------------- */}
      <Panel
        title="Timeline"
        subtitle="Assembled from the records that exist for this guest, so it can never claim something the rest of the panel disagrees with."
      >
        <ActivityList
          items={timeline.map((event, i) => ({
            id: `${event.at}-${i}`,
            icon: event.icon,
            title: event.title,
            body: event.body,
            meta: formatRelative(event.at),
          }))}
          empty="Nothing has happened on this stay yet."
        />
      </Panel>

      {/* ------------------------------ Services ------------------------- */}
      <Grid cols={2}>
        <Panel title="Grocery orders" flush>
          <DataTable
            columns={[
              { key: 'id', label: 'Order', primary: true, render: (r) => <span className="dtable__mono">{r.id}</span> },
              { key: 'deliveryDate', label: 'Delivery', render: (r) => formatShortDate(r.deliveryDate) },
              {
                key: 'total',
                label: 'Total',
                align: 'right',
                render: (r) => <Money amount={(Number(r.actualAmount ?? r.estimatedAmount) || 0) + (Number(r.serviceFee) || 0)} />,
              },
              { key: 'status', label: 'Status', render: (r) => <StatusPill map={GROCERY_STATUSES} value={r.status} /> },
            ]}
            rows={orders}
            rowTo={(r) => `/admin/grocery/${r.id}`}
            caption="Grocery orders for this guest"
            empty={{ icon: 'bag', title: 'No grocery orders' }}
          />
        </Panel>

        <Panel title="Airport transfers" flush>
          <DataTable
            columns={[
              { key: 'id', label: 'Transfer', primary: true, render: (r) => <span className="dtable__mono">{r.id}</span> },
              { key: 'airport', label: 'Airport', render: (r) => `${r.airport} ${r.flightNumber}` },
              { key: 'pickupDate', label: 'Pickup', render: (r) => formatShortDate(r.pickupDate) },
              { key: 'status', label: 'Status', render: (r) => <StatusPill map={TRANSFER_STATUSES} value={r.status} /> },
            ]}
            rows={transfers}
            rowTo={(r) => `/admin/transfers/${r.id}`}
            caption="Transfers for this guest"
            empty={{ icon: 'car', title: 'No transfers' }}
          />
        </Panel>
      </Grid>

      {/* ------------------------------ Payments ------------------------- */}
      <Panel title="Payments and tips" flush>
        <DataTable
          columns={[
            { key: 'id', label: 'Payment', primary: true, render: (r) => <span className="dtable__mono">{r.id}</span> },
            { key: 'type', label: 'Type', render: (r) => PAYMENT_TYPES[r.type]?.label ?? r.type },
            { key: 'amount', label: 'Amount', align: 'right', render: (r) => <Money amount={r.amount} /> },
            { key: 'method', label: 'Method', hideOn: 'card' },
            { key: 'status', label: 'Status', render: (r) => <StatusPill map={PAYMENT_STATUSES} value={r.status} /> },
            { key: 'createdAt', label: 'Created', hideOn: 'card', render: (r) => formatShortDate(r.createdAt) },
          ]}
          rows={payments}
          caption="Payments for this guest"
          empty={{ icon: 'creditCard', title: 'No payments' }}
        />
      </Panel>

      {/* ---------------------- Vitoria + partner activity ---------------- */}
      <Grid cols={2}>
        <Panel
          title="Vitoria conversations"
          subtitle={`${formatNumber(stats.messages ?? 0)} messages across ${conversations.length} conversations.`}
          flush
        >
          <DataTable
            columns={[
              { key: 'topic', label: 'Topic', primary: true },
              { key: 'messageCount', label: 'Messages', align: 'right' },
              { key: 'status', label: 'Status', render: (r) => <StatusPill map={CONVERSATION_STATUSES} value={r.status} /> },
              { key: 'createdAt', label: 'When', hideOn: 'card', render: (r) => formatRelative(r.createdAt) },
            ]}
            rows={conversations.slice(0, 8)}
            rowTo={(r) => `/admin/vitoria/conversations/${r.id}`}
            caption="Conversations"
            empty={{ icon: 'message', title: 'No conversations yet' }}
          />
        </Panel>

        <Panel title="Partner interactions" subtitle="What this guest did with local business listings.">
          <div className="astats" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 120px), 1fr))' }}>
            <div className="stat" style={{ padding: 'var(--sp-3)' }}>
              <span className="stat__label">Listings viewed</span>
              <span className="stat__value" style={{ fontSize: '1.3rem' }}>{stats.partnerViews ?? 0}</span>
            </div>
            <div className="stat" style={{ padding: 'var(--sp-3)' }}>
              <span className="stat__label">Clicked through</span>
              <span className="stat__value" style={{ fontSize: '1.3rem' }}>{stats.partnerClicks ?? 0}</span>
            </div>
          </div>
          <div style={{ marginTop: 'var(--sp-4)' }}>
            <ReferralNote />
          </div>
        </Panel>
      </Grid>

      {/* ------------------------------- Reviews -------------------------- */}
      <Panel title="Reviews left by this guest">
        {reviews.length === 0 ? (
          <InlineEmpty icon="star" title="No reviews yet" />
        ) : (
          <ActivityList
            items={reviews.map((r) => ({
              id: r.id,
              icon: 'star',
              title: `${r.rating} out of 5 · ${String(r.subject ?? 'stay').replace(/_/g, ' ')}`,
              body: r.comment,
              meta: formatShortDate(r.createdAt),
            }))}
          />
        )}
      </Panel>
    </div>
  )
}
