import { useState } from 'react'
import { Link } from 'react-router-dom'
import { SearchBar, FilterChips } from '../../components/ui/Form'
import { PageHeader, Panel, StatusPill, Money, Stat } from '../../components/common/AdminUI'
import DataTable, { TableToolbar } from '../../components/tables/DataTable'
import { useLoad } from '../../hooks/useTable'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import * as api from '../../services/adminApi'
import { GROCERY_STATUSES, ACTIVE_GROCERY } from '../../data/orders'
import { TRANSFER_STATUSES, ACTIVE_TRANSFER } from '../../data/transfers'
import { formatShortDate, formatRelative } from '../../utils/format'

const KIND_FILTERS = [
  { value: 'all', label: 'Everything' },
  { value: 'grocery', label: 'Grocery' },
  { value: 'transfer', label: 'Transfers' },
]

const STATE_FILTERS = [
  { value: 'open', label: 'Open' },
  { value: 'done', label: 'Completed' },
  { value: 'all', label: 'All' },
]

/**
 * Both service queues in one list.
 *
 * Grocery and transfers have different workflows, but an operator on shift
 * wants one answer to "what is in flight right now" rather than two tabs.
 */
export default function ServiceRequests() {
  useDocumentTitle('Service requests')
  const [kind, setKind] = useState('all')
  const [state, setState] = useState('open')
  const [search, setSearch] = useState('')

  const orders = useLoad(() => api.getOrders({ pageSize: 200 }), [])
  const transfers = useLoad(() => api.getTransfers({ pageSize: 200 }), [])

  const loading = orders.loading || transfers.loading
  const error = orders.error ?? transfers.error

  const rows = [
    ...(orders.data?.rows ?? []).filter(Boolean).map((o) => {
      const estimated = Number(o.actualAmount ?? o.estimatedAmount ?? o.estimatedTotal ?? 0)
      const fee = Number(o.serviceFee ?? 0)
      return {
        id: o.id,
        kind: 'grocery',
        kindLabel: 'Grocery',
        guestId: o.guestId,
        guestName: o.guestName || 'Guest',
        propertyName: o.propertyName || '—',
        status: o.status,
        when: o.deliveryDate,
        amount: (Number.isFinite(estimated) ? estimated : 0) + (Number.isFinite(fee) ? fee : 0),
        createdAt: String(o.createdAt ?? o.created_at ?? ''),
        source: o.createdBy ?? o.created_by ?? 'guest',
        open: ACTIVE_GROCERY.includes(o.status),
        to: `/admin/grocery/${o.id}`,
      }
    }),
    ...(transfers.data?.rows ?? []).filter(Boolean).map((t) => {
      const amount = Number(t.amount ?? t.quotedPrice ?? 0)
      return {
        id: t.id,
        kind: 'transfer',
        kindLabel: 'Airport transfer',
        guestId: t.guestId,
        guestName: t.guestName || 'Guest',
        propertyName: t.propertyName || '—',
        status: t.status,
        when: t.pickupDate ?? t.date,
        amount: Number.isFinite(amount) ? amount : 0,
        createdAt: String(t.createdAt ?? t.created_at ?? ''),
        source: t.createdBy ?? t.created_by ?? 'guest',
        open: ACTIVE_TRANSFER.includes(t.status),
        to: `/admin/transfers/${t.id}`,
      }
    }),
  ]
    .filter((row) => (kind === 'all' ? true : row.kind === kind))
    .filter((row) => (state === 'all' ? true : state === 'open' ? row.open : !row.open))
    .filter((row) => {
      if (!search.trim()) return true
      const needle = search.trim().toLowerCase()
      return [row.id, row.guestName, row.propertyName].some((f) =>
        String(f ?? '').toLowerCase().includes(needle),
      )
    })
    .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))

  const columns = [
    {
      key: 'id',
      label: 'Request',
      primary: true,
      render: (row) => (
        <Link to={row.to} className="dtable__strong dtable__mono" onClick={(e) => e.stopPropagation()}>
          {row.id}
        </Link>
      ),
    },
    { key: 'kindLabel', label: 'Type' },
    {
      key: 'guestName',
      label: 'Guest',
      render: (row) => (
        <span>
          {row.guestName}
          <span style={{ display: 'block', fontSize: 'var(--fs-micro)', color: 'var(--ink-500)' }}>
            {row.propertyName}
          </span>
        </span>
      ),
    },
    { key: 'when', label: 'Scheduled', render: (row) => formatShortDate(row.when) },
    { key: 'amount', label: 'Value', align: 'right', render: (row) => <Money amount={row.amount} /> },
    {
      key: 'status',
      label: 'Status',
      render: (row) =>
        row.kind === 'grocery' ? (
          <StatusPill map={GROCERY_STATUSES} value={row.status} />
        ) : (
          <StatusPill map={TRANSFER_STATUSES} value={row.status} />
        ),
    },
    {
      key: 'source',
      label: 'Raised by',
      hideOn: 'card',
      render: (row) => (row.source === 'vitoria' ? 'Vitoria' : 'Guest'),
    },
    { key: 'createdAt', label: 'Created', hideOn: 'card', render: (row) => formatRelative(row.createdAt) },
  ]

  const openCount = rows.filter((r) => r.open).length

  return (
    <div className="apage">
      <PageHeader
        title="Service requests"
        subtitle="Grocery deliveries and airport transfers in one queue. These are the services My30A runs itself — partner listings are referrals and never appear here."
      />

      <div className="astats">
        <Stat label="Showing" value={rows.length} icon="clock" tone="sea" />
        <Stat label="Open" value={openCount} icon="alert" tone="danger" />
        <Stat
          label="Raised by Vitoria"
          value={rows.filter((r) => r.source === 'vitoria').length}
          icon="sparkles"
          tone="gold"
        />
        <Stat
          label="Total value"
          value={<Money amount={rows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0)} />}
          icon="dollar"
          tone="success"
        />
      </div>

      <Panel flush>
        <TableToolbar>
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search request id, guest or property"
            label="Search service requests"
          />
          <FilterChips options={KIND_FILTERS} value={kind} onChange={setKind} label="Filter by type" />
          <FilterChips options={STATE_FILTERS} value={state} onChange={setState} label="Filter by state" />
        </TableToolbar>

        <DataTable
          columns={columns}
          rows={rows.slice(0, 60)}
          loading={loading}
          error={error}
          onRetry={() => {
            orders.reload()
            transfers.reload()
          }}
          rowTo={(row) => row.to}
          caption="Service requests"
          empty={{ icon: 'clock', title: 'No requests match those filters' }}
        />
      </Panel>
    </div>
  )
}
