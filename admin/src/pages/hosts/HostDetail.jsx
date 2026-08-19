import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Button from '../../components/ui/Button'
import { SkeletonPage } from '../../components/ui/Skeleton'
import { ErrorState } from '../../components/ui/States'
import { Callout } from '../../components/ui/Display'
import {
  PageHeader, Panel, Grid, Stat, Facts, StatusPill, Money, InlineEmpty,
} from '../../components/common/AdminUI'
import DataTable from '../../components/tables/DataTable'
import ReviewDecisionModal from '../../components/modals/ReviewDecisionModal'
import AccountModals from '../../components/accounts/AccountModals'
import { useLoad } from '../../hooks/useTable'
import { useAccountManage } from '../../hooks/useAccountManage'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useAdmin } from '../../context/AdminContext'
import * as api from '../../services/adminApi'
import { HOST_STATUSES, SUBSCRIPTION_STATUSES, DEFAULT_PLANS } from '../../data/hosts'
import { PROPERTY_STATUSES } from '../../data/properties'
import { GUEST_STATUSES } from '../../data/guests'
import { PAYMENT_STATUSES } from '../../data/payments'
import { formatDate, formatShortDate } from '../../utils/format'
import { propertyPath } from '../../utils/paths'

export default function HostDetail() {
  const { id } = useParams()
  const { pushToast } = useAdmin()
  const { data, loading, error, reload } = useLoad(() => api.getHost(id), [id])
  const manage = useAccountManage('host', { onDone: reload })
  const [decision, setDecision] = useState(null)
  const [busy, setBusy] = useState(false)

  useDocumentTitle(data?.host?.name || 'Host')

  if (loading) return <SkeletonPage />
  if (error || !data?.host) return <ErrorState error={error} onRetry={reload} title="We could not open that" />

  const host = data.host
  const properties = Array.isArray(data.properties) ? data.properties : []
  const guests = Array.isArray(data.guests) ? data.guests : []
  const payments = Array.isArray(data.payments) ? data.payments : []
  const reviews = Array.isArray(data.reviews) ? data.reviews : []
  const subscription = host.subscription ?? {}
  const vitoria = host.vitoria ?? {}
  const plan = DEFAULT_PLANS.find((p) => p.id === subscription.planId)
  const satisfaction = reviews.length
    ? (reviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / reviews.length).toFixed(2)
    : null

  const decide = async (reason) => {
    const nextStatus = { approve: 'active', reject: 'rejected', suspend: 'suspended', reinstate: 'pending' }[decision]
    setBusy(true)
    try {
      await api.setHostStatus(id, nextStatus, reason)
      pushToast({ tone: 'success', title: `${host.name} is now ${(HOST_STATUSES[nextStatus]?.label ?? nextStatus).toLowerCase()}` })
      setDecision(null)
      reload()
    } catch (err) {
      pushToast({ tone: 'error', title: 'That did not go through', message: err.message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="apage">
      <PageHeader
        title={host.name}
        subtitle={`${host.company ? `${host.company} · ` : ''}${host.email} · ${host.phone}`}
        back={{ to: '/admin/hosts', label: 'All hosts' }}
        actions={
          <>
            <StatusPill map={HOST_STATUSES} value={host.status} />
            <Button size="sm" variant="secondary" icon="edit" onClick={() => manage.setEditRow(host)}>
              Edit
            </Button>
            {host.status === 'pending' && (
              <>
                <Button size="sm" icon="checkCircle" onClick={() => setDecision('approve')}>Approve</Button>
                <Button size="sm" variant="danger" icon="x" onClick={() => setDecision('reject')}>Reject</Button>
                <Button size="sm" variant="danger" icon="lock" onClick={() => manage.setBlockRow(host)}>
                  Block
                </Button>
              </>
            )}
            {host.status === 'active' && (
              <Button size="sm" variant="danger" icon="lock" onClick={() => manage.setBlockRow(host)}>
                Block
              </Button>
            )}
            {['suspended', 'rejected'].includes(host.status) && (
              <>
                <Button size="sm" icon="checkCircle" onClick={() => manage.setBlockRow(host)}>
                  Unblock
                </Button>
                <Button size="sm" variant="secondary" icon="refresh" onClick={() => setDecision('reinstate')}>
                  Return to review
                </Button>
              </>
            )}
            <Button size="sm" variant="ghost" icon="trash" onClick={() => manage.setDeleteRow(host)}>
              Delete
            </Button>
          </>
        }
      />

      {host.notes && host.status !== 'active' && (
        <Callout icon="alert" tone="warn">
          <strong style={{ display: 'block', marginBottom: 2 }}>
            {HOST_STATUSES[host.status]?.label ?? host.status}
          </strong>
          {host.notes}
        </Callout>
      )}

      <div className="astats">
        <Stat label="Properties" value={host.propertyCount} icon="key" tone="sea" />
        <Stat label="Guests hosted" value={guests.length} icon="users" tone="info" />
        <Stat label="Vitoria conversations" value={vitoria.conversations ?? 0} icon="sparkles" tone="gold" />
        <Stat
          label="Guest satisfaction"
          value={satisfaction ?? '—'}
          suffix={satisfaction ? ' / 5' : ''}
          icon="star"
          tone="success"
          hint={`${reviews.length} reviews`}
        />
      </div>

      <Grid cols={2}>
        <Panel title="Host">
          <Facts
            items={[
              { label: 'Name', value: host.name },
              { label: 'Company', value: host.company ?? '—' },
              { label: 'Email', value: host.email },
              { label: 'Phone', value: host.phone },
              { label: 'Area', value: host.town },
              { label: 'Joined', value: formatDate(host.joinedAt) },
              { label: 'Last active', value: formatDate(host.lastActiveAt) },
            ]}
          />
        </Panel>

        <Panel
          title="Subscription"
          subtitle="Plan pricing is configurable in Settings — the commercial rules are not final."
          actions={<Button to="/admin/subscriptions" size="sm" variant="ghost" iconRight="arrowRight">All subscriptions</Button>}
        >
          <Facts
            items={[
              { label: 'Plan', value: plan ? `${plan.name} — ${plan.blurb}` : subscription.planId ?? '—' },
              { label: 'Amount', value: <Money amount={subscription.amount} /> },
              { label: 'Status', value: <StatusPill map={SUBSCRIPTION_STATUSES} value={subscription.status} /> },
              { label: 'Next billing', value: formatDate(subscription.nextBillingDate) },
              { label: 'Started', value: formatDate(subscription.startedAt) },
              { label: 'Method', value: subscription.method },
              subscription.trialEndsAt && {
                label: 'Trial ends', value: formatDate(subscription.trialEndsAt),
              },
            ]}
          />
        </Panel>
      </Grid>

      <Panel title={`Properties (${properties.length})`} flush>
        <DataTable
          columns={[
            { key: 'name', label: 'Property', primary: true, render: (r) => <span className="dtable__strong">{r.name}</span> },
            { key: 'town', label: 'Area' },
            { key: 'type', label: 'Type', hideOn: 'card' },
            { key: 'bedrooms', label: 'Beds', align: 'right', hideOn: 'card' },
            { key: 'status', label: 'Status', render: (r) => <StatusPill map={PROPERTY_STATUSES} value={r.status} /> },
          ]}
          rows={properties}
          rowTo={propertyPath}
          caption="Properties for this host"
          empty={{ icon: 'key', title: 'No properties yet', body: 'This host has not added a property.' }}
        />
      </Panel>

      <Grid cols={2}>
        <Panel title={`Guests (${guests.length})`} flush>
          <DataTable
            columns={[
              { key: 'name', label: 'Guest', primary: true },
              { key: 'checkIn', label: 'Arrival', render: (r) => formatShortDate(r.checkIn) },
              { key: 'status', label: 'Status', render: (r) => <StatusPill map={GUEST_STATUSES} value={r.status} /> },
            ]}
            rows={guests.slice(0, 10)}
            rowTo={(r) => `/admin/guests/${r.id}`}
            caption="Guests at this host's properties"
            empty={{ icon: 'users', title: 'No guests yet' }}
          />
        </Panel>

        <Panel title="Subscription payments" flush>
          <DataTable
            columns={[
              { key: 'id', label: 'Payment', primary: true, render: (r) => <span className="dtable__mono">{r.id}</span> },
              { key: 'amount', label: 'Amount', align: 'right', render: (r) => <Money amount={r.amount} /> },
              { key: 'status', label: 'Status', render: (r) => <StatusPill map={PAYMENT_STATUSES} value={r.status} /> },
              { key: 'createdAt', label: 'Date', hideOn: 'card', render: (r) => formatShortDate(r.createdAt) },
            ]}
            rows={payments}
            caption="Subscription payments"
            empty={{ icon: 'creditCard', title: 'No payments recorded' }}
          />
        </Panel>
      </Grid>

      {reviews.length > 0 && (
        <Panel title="What guests said about these properties">
          <ul className="activity">
            {reviews.slice(0, 6).map((r) => (
              <li className="activity__row" key={r.id}>
                <span className="activity__icon" aria-hidden="true">{r.rating}</span>
                <span style={{ minWidth: 0 }}>
                  <span className="activity__title">{r.propertyName}</span>
                  <span className="activity__body">{r.comment}</span>
                </span>
                <span className="activity__meta">{formatShortDate(r.createdAt)}</span>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <ReviewDecisionModal
        open={!!decision}
        decision={decision}
        subject={host.name}
        loading={busy}
        onClose={() => setDecision(null)}
        onConfirm={decide}
      />
      <AccountModals manage={manage} />
    </div>
  )
}
