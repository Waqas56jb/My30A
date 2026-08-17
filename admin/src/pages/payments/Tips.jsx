import { Link } from 'react-router-dom'
import { SearchBar } from '../../components/ui/Form'
import { PageHeader, Panel, Money, Stat, MockPaymentNote } from '../../components/common/AdminUI'
import { Badge } from '../../components/ui/StatusBadge'
import { RankBars } from '../../components/charts/Charts'
import DataTable, { Pagination, TableToolbar } from '../../components/tables/DataTable'
import { useTable } from '../../hooks/useTable'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import * as api from '../../services/adminApi'
import { formatShortDate } from '../../utils/format'

/**
 * Tips.
 *
 * Tips go to the shopper or the driver, not to My30A — the recipient column is
 * the point of this screen, not the total.
 */
export default function Tips() {
  useDocumentTitle('Tips')
  const table = useTable(api.getTips)

  const columns = [
    {
      key: 'guestName',
      label: 'Guest',
      primary: true,
      render: (r) => (
        <Link to={`/admin/guests/${r.guestId}`} className="dtable__strong" onClick={(e) => e.stopPropagation()}>
          {r.guestName}
        </Link>
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
    { key: 'service', label: 'Service' },
    { key: 'recipient', label: 'Goes to', render: (r) => r.recipient ?? '—' },
    {
      key: 'tipPercent',
      label: 'Rate',
      render: (r) => (r.tipPercent ? <Badge tone="gold">{r.tipPercent}%</Badge> : <Badge>Custom</Badge>),
    },
    { key: 'amount', label: 'Amount', align: 'right', render: (r) => <Money amount={r.amount} /> },
    { key: 'createdAt', label: 'Date', hideOn: 'card', render: (r) => formatShortDate(r.createdAt) },
  ]

  const total = table.rows.reduce((sum, t) => sum + t.amount, 0)
  const grocery = table.rows.filter((t) => t.service === 'Grocery delivery')
  const transfer = table.rows.filter((t) => t.service === 'Airport transfer')

  const rateBuckets = [10, 18, 20].map((pct) => ({
    label: `${pct}%`,
    value: table.rows.filter((t) => t.tipPercent === pct).length,
  }))

  return (
    <div className="apage">
      <PageHeader
        title="Tips"
        subtitle="What guests added for the shopper or the driver after a service was completed."
        back={{ to: '/admin/payments', label: 'All transactions' }}
      />

      <MockPaymentNote />

      <div className="astats">
        <Stat label="Tips on this page" value={table.total} icon="heart" tone="gold" />
        <Stat label="Total value" value={<Money amount={total} />} icon="dollar" tone="success" />
        <Stat
          label="Average tip"
          value={<Money amount={table.rows.length ? Math.round(total / table.rows.length) : 0} />}
          icon="chart"
          tone="sea"
        />
        <Stat
          label="Grocery vs transfer"
          value={`${grocery.length} / ${transfer.length}`}
          icon="bag"
          tone="info"
        />
      </div>

      <Panel title="Tip rates chosen" subtitle="Presets are configurable in Settings → Payments.">
        <RankBars data={rateBuckets} valueLabel="tips" />
      </Panel>

      <Panel flush>
        <TableToolbar>
          <SearchBar
            value={table.search}
            onChange={table.setSearch}
            placeholder="Search guest, order, service or recipient"
            label="Search tips"
          />
        </TableToolbar>

        <DataTable
          columns={columns}
          rows={table.rows}
          loading={table.loading}
          error={table.error}
          onRetry={table.reload}
          caption="Tips"
          empty={{ icon: 'heart', title: 'No tips match that search' }}
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
