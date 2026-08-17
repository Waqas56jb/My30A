import { Link } from 'react-router-dom'
import Icon from '../../components/ui/Icon'
import Button from '../../components/ui/Button'
import { SkeletonList } from '../../components/ui/Skeleton'
import { ErrorState } from '../../components/ui/States'
import {
  PageHeader, Panel, Grid, StatusPill, ActivityList, InlineEmpty, Money,
} from '../../components/common/AdminUI'
import { useLoad } from '../../hooks/useTable'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useAdmin } from '../../context/AdminContext'
import * as api from '../../services/adminApi'
import { GROCERY_STATUSES } from '../../data/orders'
import { TRANSFER_STATUSES } from '../../data/transfers'
import { formatShortDate, formatRelative } from '../../utils/format'

/**
 * The daily work centre.
 *
 * The dashboard answers "how is the business doing". This answers "what do I
 * have to do before lunch". An operator should be able to open this at 8am and
 * work top to bottom without opening anything else.
 */
export default function Operations() {
  const { attention, refreshOverview } = useAdmin()
  useDocumentTitle('Operations')

  const schedule = useLoad(() => api.getSchedule(), [])
  const activity = useLoad(() => api.getRecentAudit(14), [])
  const pendingOrders = useLoad(() => api.getOrders({ status: 'pending', pageSize: 6 }), [])
  const pendingTransfers = useLoad(() => api.getTransfers({ status: 'pending', pageSize: 6 }), [])
  const activeOrders = useLoad(
    () => api.getOrders({ status: ['confirmed', 'payment_required', 'paid', 'shopping', 'on_the_way'], pageSize: 8 }),
    [],
  )

  const totalWaiting = attention.reduce((sum, a) => sum + a.count, 0)

  return (
    <div className="apage">
      <PageHeader
        title="Operations"
        subtitle={
          totalWaiting
            ? `${totalWaiting} items are waiting on a decision. Work down the list and the queues clear.`
            : 'Nothing is waiting on a decision. The queues are clear.'
        }
        actions={
          <Button variant="secondary" icon="refresh" onClick={() => { refreshOverview(); schedule.reload(); }}>
            Refresh
          </Button>
        }
      />

      {/* ---------------------------- Needs attention --------------------- */}
      <Panel title="Needs attention" subtitle="Every queue with unfinished work in it.">
        {attention.length === 0 ? (
          <InlineEmpty
            icon="checkCircle"
            title="Everything is handled"
            body="No applications, orders, transfers, refunds or flagged reviews are waiting."
          />
        ) : (
          <div className="attention">
            {attention.map((item) => (
              <Link key={item.id} to={item.to} className={`attn attn--${item.tone}`}>
                <span className="attn__count">{item.count}</span>
                <span className="attn__label">{item.label}</span>
                <Icon name="chevronRight" size={16} className="attn__go" />
              </Link>
            ))}
          </div>
        )}
      </Panel>

      {/* ---------------------------- Today's schedule -------------------- */}
      <Grid cols={2}>
        <Panel
          title="Airport transfers"
          subtitle="The next pickups, in order."
          actions={<Button to="/admin/transfers" size="sm" variant="ghost" iconRight="arrowRight">All transfers</Button>}
        >
          {schedule.loading && <SkeletonList count={4} />}
          {schedule.error && <ErrorState error={schedule.error} onRetry={schedule.reload} />}
          {schedule.data && (
            schedule.data.transfers.length === 0 ? (
              <InlineEmpty icon="car" title="No transfers scheduled" />
            ) : (
              <ul className="activity">
                {schedule.data.transfers.map((t) => (
                  <li className="activity__row" key={t.id}>
                    <span className="activity__icon" aria-hidden="true"><Icon name="car" size={15} /></span>
                    <span style={{ minWidth: 0, flex: '1 1 auto' }}>
                      <Link to={`/admin/transfers/${t.id}`} className="activity__title" style={{ textDecoration: 'none' }}>
                        {t.guestName} · {t.airport} {t.flightNumber}
                      </Link>
                      <span className="activity__body">
                        {formatShortDate(t.pickupDate)} at {t.pickupTime} · {t.passengers} pax ·{' '}
                        {t.vehicleName}
                        {t.driver ? ` · ${t.driver}` : ' · no driver yet'}
                      </span>
                    </span>
                    <StatusPill map={TRANSFER_STATUSES} value={t.status} />
                  </li>
                ))}
              </ul>
            )
          )}
        </Panel>

        <Panel
          title="Grocery deliveries"
          subtitle="Confirmed orders due to land."
          actions={<Button to="/admin/grocery" size="sm" variant="ghost" iconRight="arrowRight">All orders</Button>}
        >
          {schedule.loading && <SkeletonList count={4} />}
          {schedule.data && (
            schedule.data.deliveries.length === 0 ? (
              <InlineEmpty icon="bag" title="No deliveries scheduled" />
            ) : (
              <ul className="activity">
                {schedule.data.deliveries.map((o) => (
                  <li className="activity__row" key={o.id}>
                    <span className="activity__icon" aria-hidden="true"><Icon name="bag" size={15} /></span>
                    <span style={{ minWidth: 0, flex: '1 1 auto' }}>
                      <Link to={`/admin/grocery/${o.id}`} className="activity__title" style={{ textDecoration: 'none' }}>
                        {o.id} · {o.guestName}
                      </Link>
                      <span className="activity__body">
                        {formatShortDate(o.deliveryDate)} · {o.deliveryWindow} · {o.items.length} items ·{' '}
                        {o.propertyName}
                      </span>
                    </span>
                    <StatusPill map={GROCERY_STATUSES} value={o.status} />
                  </li>
                ))}
              </ul>
            )
          )}
        </Panel>
      </Grid>

      {/* ------------------------------- Queues --------------------------- */}
      <Grid cols={2}>
        <Panel
          title="Grocery orders to confirm"
          subtitle="A guest has sent a list and is waiting for an estimate."
          actions={<Button to="/admin/grocery?status=pending" size="sm" variant="secondary">Open queue</Button>}
        >
          {pendingOrders.loading && <SkeletonList count={3} />}
          {pendingOrders.data && (
            pendingOrders.data.rows.length === 0 ? (
              <InlineEmpty icon="checkCircle" title="Nothing waiting to be confirmed" />
            ) : (
              <ActivityList
                items={pendingOrders.data.rows.map((o) => ({
                  id: o.id,
                  icon: 'bag',
                  title: `${o.id} · ${o.guestName}`,
                  body: `${o.items.length} items · delivery ${formatShortDate(o.deliveryDate)} · ${o.store}`,
                  meta: formatRelative(o.createdAt),
                }))}
              />
            )
          )}
        </Panel>

        <Panel
          title="Transfers to confirm"
          subtitle="A vehicle needs reserving before the card can be authorised."
          actions={<Button to="/admin/transfers?status=pending" size="sm" variant="secondary">Open queue</Button>}
        >
          {pendingTransfers.loading && <SkeletonList count={3} />}
          {pendingTransfers.data && (
            pendingTransfers.data.rows.length === 0 ? (
              <InlineEmpty icon="checkCircle" title="Nothing waiting to be confirmed" />
            ) : (
              <ActivityList
                items={pendingTransfers.data.rows.map((t) => ({
                  id: t.id,
                  icon: 'car',
                  title: `${t.id} · ${t.guestName}`,
                  body: `${t.airport} ${t.flightNumber} · ${formatShortDate(t.pickupDate)} ${t.pickupTime}${
                    t.createdBy === 'vitoria' ? ' · created by Vitoria' : ''
                  }`,
                  meta: formatRelative(t.createdAt),
                }))}
              />
            )
          )}
        </Panel>
      </Grid>

      {/* ---------------------------- Active orders ----------------------- */}
      <Panel
        title="Active orders"
        subtitle="Paid, shopping, or out for delivery right now."
        actions={<Button to="/admin/service-requests" size="sm" variant="ghost" iconRight="arrowRight">All requests</Button>}
      >
        {activeOrders.loading && <SkeletonList count={4} />}
        {activeOrders.data && (
          activeOrders.data.rows.length === 0 ? (
            <InlineEmpty icon="bag" title="No orders in flight" />
          ) : (
            <ul className="activity">
              {activeOrders.data.rows.map((o) => (
                <li className="activity__row" key={o.id}>
                  <span className="activity__icon" aria-hidden="true"><Icon name="bag" size={15} /></span>
                  <span style={{ minWidth: 0, flex: '1 1 auto' }}>
                    <Link to={`/admin/grocery/${o.id}`} className="activity__title" style={{ textDecoration: 'none' }}>
                      {o.id} · {o.guestName}
                    </Link>
                    <span className="activity__body">
                      {o.propertyName} · <Money amount={(o.actualAmount ?? o.estimatedAmount) + o.serviceFee} />
                      {o.shopper ? ` · ${o.shopper}` : ''}
                    </span>
                  </span>
                  <StatusPill map={GROCERY_STATUSES} value={o.status} />
                </li>
              ))}
            </ul>
          )
        )}
      </Panel>

      {/* -------------------------- Recent activity ----------------------- */}
      <Panel
        title="Recent activity"
        subtitle="Every operational event, newest first."
        actions={<Button to="/admin/audit" size="sm" variant="ghost" iconRight="arrowRight">Full audit log</Button>}
      >
        {activity.loading && <SkeletonList count={6} />}
        {activity.data && (
          <ActivityList
            items={activity.data.map((row) => ({
              id: row.id,
              icon: row.status === 'failed' ? 'alert' : 'check',
              title: `${row.userName} · ${row.action}`,
              body: `${row.entity} ${row.entityId}${row.detail ? ` — ${row.detail}` : ''}`,
              meta: formatRelative(row.at),
            }))}
          />
        )}
      </Panel>
    </div>
  )
}
