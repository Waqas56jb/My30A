import { Link } from 'react-router-dom'
import Button from '../../components/ui/Button'
import { SearchBar, FilterChips } from '../../components/ui/Form'
import { Callout } from '../../components/ui/Display'
import {
  PageHeader, Panel, Grid, StatusPill, Money, Stat,
} from '../../components/common/AdminUI'
import DataTable, { Pagination, TableToolbar } from '../../components/tables/DataTable'
import { useTable } from '../../hooks/useTable'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useAdmin } from '../../context/AdminContext'
import * as api from '../../services/adminApi'
import { SUBSCRIPTION_STATUSES, DEFAULT_PLANS } from '../../data/hosts'
import { formatShortDate } from '../../utils/format'

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  ...Object.entries(SUBSCRIPTION_STATUSES).map(([value, meta]) => ({ value, label: meta.label })),
]

export default function Subscriptions() {
  useDocumentTitle('Host subscriptions')
  const { pushToast } = useAdmin()
  const table = useTable(api.getSubscriptions, { initial: { filters: { status: 'all' } } })

  const change = async (row, status) => {
    try {
      await api.setSubscriptionStatus(row.hostId, status)
      pushToast({ tone: 'success', title: `${row.hostName}'s subscription is now ${status.replace(/_/g, ' ')}` })
      table.reload()
    } catch (err) {
      pushToast({ tone: 'error', title: 'Could not update', message: err.message })
    }
  }

  const columns = [
    {
      key: 'hostName',
      label: 'Host',
      primary: true,
      render: (r) => (
        <span>
          <Link to={`/admin/hosts/${r.hostId}`} className="dtable__strong" onClick={(e) => e.stopPropagation()}>
            {r.hostName}
          </Link>
          <span style={{ display: 'block', fontSize: 'var(--fs-micro)', color: 'var(--ink-500)' }}>
            {r.company ?? r.hostEmail}
          </span>
        </span>
      ),
    },
    { key: 'properties', label: 'Properties', align: 'right' },
    { key: 'planName', label: 'Plan' },
    { key: 'amount', label: 'Amount', align: 'right', render: (r) => <Money amount={r.amount} /> },
    { key: 'status', label: 'Status', render: (r) => <StatusPill map={SUBSCRIPTION_STATUSES} value={r.status} /> },
    { key: 'nextBillingDate', label: 'Next billing', render: (r) => formatShortDate(r.nextBillingDate) },
    {
      key: 'trialEndsAt',
      label: 'Trial',
      hideOn: 'card',
      render: (r) => (r.trialEndsAt ? `ends ${formatShortDate(r.trialEndsAt)}` : '—'),
    },
    {
      key: 'action',
      label: '',
      render: (r) =>
        r.status === 'past_due' ? (
          <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); change(r, 'active') }}>
            Mark paid
          </Button>
        ) : r.status === 'active' ? (
          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); change(r, 'paused') }}>
            Pause
          </Button>
        ) : r.status === 'paused' ? (
          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); change(r, 'active') }}>
            Resume
          </Button>
        ) : (
          '—'
        ),
    },
  ]

  const mrr = table.rows
    .filter((r) => r.status === 'active')
    .reduce((sum, r) => sum + r.amount, 0)

  return (
    <div className="apage">
      <PageHeader
        title="Host subscriptions"
        subtitle="What hosts pay for the guest experience. Partners pay nothing — they are listed for free and My30A takes no commission on their business."
      />

      <Callout icon="info">
        Plan names and prices are seeded but editable in Settings → Business. The commercial rules
        are not final, so nothing in this panel hardcodes a number.
      </Callout>

      <div className="astats">
        <Stat label="Subscriptions" value={table.total} icon="refresh" tone="sea" />
        <Stat label="Monthly recurring" value={<Money amount={mrr} />} icon="dollar" tone="success" />
        <Stat
          label="On trial"
          value={table.rows.filter((r) => r.status === 'trial').length}
          icon="clock"
          tone="info"
        />
        <Stat
          label="Past due"
          value={table.rows.filter((r) => r.status === 'past_due').length}
          icon="alert"
          tone="danger"
        />
      </div>

      <Panel title="Plans" subtitle="Configured in Settings → Business.">
        <Grid cols={3}>
          {DEFAULT_PLANS.map((plan) => (
            <div className="stat" key={plan.id}>
              <span className="stat__label">{plan.name}</span>
              <span className="stat__value">
                ${plan.price}
                <span style={{ fontSize: '0.85rem', color: 'var(--ink-500)' }}>/{plan.interval}</span>
              </span>
              <span className="stat__hint">{plan.blurb}</span>
              <span className="stat__hint">
                {table.rows.filter((r) => r.planName === plan.name).length} hosts on this plan
              </span>
            </div>
          ))}
        </Grid>
      </Panel>

      <Panel flush>
        <TableToolbar>
          <SearchBar
            value={table.search}
            onChange={table.setSearch}
            placeholder="Search host, company or plan"
            label="Search subscriptions"
          />
          <FilterChips
            options={STATUS_FILTERS}
            value={table.filters.status}
            onChange={(value) => table.setFilter('status', value)}
            label="Filter by status"
          />
        </TableToolbar>

        <DataTable
          columns={columns}
          rows={table.rows}
          loading={table.loading}
          error={table.error}
          onRetry={table.reload}
          caption="Host subscriptions"
          empty={{ icon: 'building', title: 'No subscriptions match those filters' }}
        />

        <Pagination
          page={table.page}
          pages={table.pages}
          total={table.total}
          pageSize={table.pageSize}
          onPage={table.setPage}
        />
      </Panel>
    </div>
  )
}
