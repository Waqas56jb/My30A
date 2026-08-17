import { Link } from 'react-router-dom'
import Button from '../../components/ui/Button'
import { SearchBar, FilterChips } from '../../components/ui/Form'
import {
  PageHeader, Panel, StatusPill, Money, Stat, MockPaymentNote,
} from '../../components/common/AdminUI'
import DataTable, { Pagination, TableToolbar } from '../../components/tables/DataTable'
import { useTable } from '../../hooks/useTable'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useAdmin } from '../../context/AdminContext'
import * as api from '../../services/adminApi'
import { REFUND_STATUSES } from '../../data/payments'
import { DEFAULT_CANCELLATION_RULES } from '../../data/transfers'
import { formatShortDate } from '../../utils/format'

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  ...Object.entries(REFUND_STATUSES).map(([value, meta]) => ({ value, label: meta.label })),
]

/**
 * Refunds — both the automatic ones a cancellation produces and the manual
 * ones an operator raises from a payment.
 */
export default function Refunds() {
  useDocumentTitle('Refunds')
  const { pushToast } = useAdmin()
  const table = useTable(api.getRefunds, { initial: { filters: { status: 'all' } } })

  const advance = async (refund, status) => {
    try {
      await api.setRefundStatus(refund.id, status)
      pushToast({ tone: 'success', title: `${refund.id} marked ${status}` })
      table.reload()
    } catch (err) {
      pushToast({ tone: 'error', title: 'Could not update', message: err.message })
    }
  }

  const columns = [
    { key: 'id', label: 'Refund', primary: true, render: (r) => <span className="dtable__strong dtable__mono">{r.id}</span> },
    {
      key: 'guestName',
      label: 'Guest',
      render: (r) => (
        <Link to={`/admin/guests/${r.guestId}`} onClick={(e) => e.stopPropagation()}>{r.guestName}</Link>
      ),
    },
    {
      key: 'relatedId',
      label: 'Order',
      render: (r) => (
        <Link to={r.relatedLink} onClick={(e) => e.stopPropagation()} className="dtable__mono">
          {r.relatedId}
        </Link>
      ),
    },
    { key: 'originalAmount', label: 'Original', align: 'right', render: (r) => <Money amount={r.originalAmount} /> },
    { key: 'fee', label: 'Fee kept', align: 'right', hideOn: 'card', render: (r) => <Money amount={r.fee} /> },
    { key: 'amount', label: 'Refunded', align: 'right', render: (r) => <Money amount={r.amount} /> },
    { key: 'reason', label: 'Reason', hideOn: 'card' },
    {
      key: 'source',
      label: 'Source',
      hideOn: 'card',
      render: (r) => (r.source === 'automatic' ? 'Cancellation rule' : 'Manual'),
    },
    { key: 'status', label: 'Status', render: (r) => <StatusPill map={REFUND_STATUSES} value={r.status} /> },
    {
      key: 'action',
      label: '',
      render: (r) =>
        r.status === 'pending' ? (
          <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); advance(r, 'processing') }}>
            Process
          </Button>
        ) : r.status === 'processing' ? (
          <Button size="sm" onClick={(e) => { e.stopPropagation(); advance(r, 'completed') }}>
            Mark complete
          </Button>
        ) : r.status === 'failed' ? (
          <Button size="sm" variant="secondary" icon="refresh" onClick={(e) => { e.stopPropagation(); advance(r, 'processing') }}>
            Retry
          </Button>
        ) : (
          '—'
        ),
    },
  ]

  const totalRefunded = table.rows
    .filter((r) => r.status === 'completed')
    .reduce((sum, r) => sum + r.amount, 0)

  return (
    <div className="apage">
      <PageHeader
        title="Refunds"
        subtitle="Cancellations produce these automatically; an operator can also raise one from any payment."
        back={{ to: '/admin/payments', label: 'All transactions' }}
      />

      <MockPaymentNote />

      <div className="astats">
        <Stat label="Refunds" value={table.total} icon="refresh" tone="sea" />
        <Stat
          label="Awaiting processing"
          value={table.rows.filter((r) => ['pending', 'processing'].includes(r.status)).length}
          icon="clock"
          tone="danger"
        />
        <Stat label="Completed value" value={<Money amount={totalRefunded} />} icon="checkCircle" tone="success" />
        <Stat
          label="Fees retained"
          value={<Money amount={table.rows.reduce((sum, r) => sum + r.fee, 0)} />}
          icon="dollar"
          tone="gold"
        />
      </div>

      <Panel
        title="Cancellation rules"
        subtitle="These decide the fee automatically. Editable in Settings → Payments."
      >
        <ul className="activity">
          {DEFAULT_CANCELLATION_RULES.map((rule) => (
            <li className="activity__row" key={rule.id}>
              <span className="activity__icon" aria-hidden="true">{rule.fee ? `$${rule.fee}` : '$0'}</span>
              <span style={{ minWidth: 0 }}>
                <span className="activity__title">{rule.label}</span>
                <span className="activity__body">{rule.note}</span>
              </span>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel flush>
        <TableToolbar>
          <SearchBar
            value={table.search}
            onChange={table.setSearch}
            placeholder="Search refund id, guest or reason"
            label="Search refunds"
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
          caption="Refunds"
          empty={{ icon: 'refresh', title: 'No refunds match those filters' }}
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
