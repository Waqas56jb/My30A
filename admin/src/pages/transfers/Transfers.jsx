import { Link } from 'react-router-dom'
import { SearchBar, FilterChips } from '../../components/ui/Form'
import { PageHeader, Panel, StatusPill, Money, Stat } from '../../components/common/AdminUI'
import DataTable, { Pagination, TableToolbar } from '../../components/tables/DataTable'
import { useTable } from '../../hooks/useTable'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import * as api from '../../services/adminApi'
import { TRANSFER_STATUSES, AIRPORTS } from '../../data/transfers'
import { formatShortDate, formatRelative } from '../../utils/format'

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  ...Object.entries(TRANSFER_STATUSES).map(([value, meta]) => ({ value, label: meta.label })),
]

const AIRPORT_FILTERS = [
  { value: 'all', label: 'All airports' },
  ...AIRPORTS.map((a) => ({ value: a.code, label: a.code })),
]

export default function Transfers() {
  useDocumentTitle('Airport transfers')
  const table = useTable(api.getTransfers, { initial: { filters: { status: 'all', airport: 'all' } } })

  const columns = [
    {
      key: 'id',
      label: 'Transfer',
      primary: true,
      render: (row) => (
        <Link to={`/admin/transfers/${row.id}`} className="dtable__strong dtable__mono" onClick={(e) => e.stopPropagation()}>
          {row.id}
        </Link>
      ),
    },
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
    { key: 'airport', label: 'Airport' },
    { key: 'flightNumber', label: 'Flight', hideOn: 'card' },
    {
      key: 'pickup',
      label: 'Pickup',
      render: (row) => `${formatShortDate(row.pickupDate)} · ${row.pickupTime}`,
    },
    { key: 'passengers', label: 'Pax', align: 'right', hideOn: 'card' },
    { key: 'vehicleName', label: 'Vehicle', hideOn: 'card' },
    { key: 'amount', label: 'Amount', align: 'right', render: (row) => <Money amount={row.amount} /> },
    { key: 'status', label: 'Status', render: (row) => <StatusPill map={TRANSFER_STATUSES} value={row.status} /> },
    {
      key: 'createdBy',
      label: 'Source',
      hideOn: 'card',
      render: (row) => (row.createdBy === 'vitoria' ? 'Vitoria' : 'Guest'),
    },
    { key: 'createdAt', label: 'Created', hideOn: 'card', render: (row) => formatRelative(row.createdAt) },
  ]

  return (
    <div className="apage">
      <PageHeader
        title="Airport transfers"
        subtitle="A My30A-managed service from ECP, VPS and PNS. The card is authorised when the transfer is confirmed and captured only once the ride is completed."
      />

      <div className="astats">
        <Stat label="On this page" value={table.total} icon="car" tone="sea" />
        <Stat
          label="Awaiting confirmation"
          value={table.rows.filter((t) => t.status === 'pending').length}
          icon="clock"
          tone="danger"
          to="/admin/transfers?status=pending"
        />
        <Stat
          label="Driver assigned"
          value={table.rows.filter((t) => ['driver_assigned', 'in_progress'].includes(t.status)).length}
          icon="user"
          tone="info"
        />
        <Stat
          label="Created by Vitoria"
          value={table.rows.filter((t) => t.createdBy === 'vitoria').length}
          icon="sparkles"
          tone="gold"
          hint="Requests the concierge raised herself"
        />
      </div>

      <Panel flush>
        <TableToolbar>
          <SearchBar
            value={table.search}
            onChange={table.setSearch}
            placeholder="Search transfer id, guest, flight or driver"
            label="Search transfers"
          />
          <FilterChips
            options={AIRPORT_FILTERS}
            value={table.filters.airport}
            onChange={(value) => table.setFilter('airport', value)}
            label="Filter by airport"
          />
          <FilterChips
            options={STATUS_FILTERS}
            value={table.filters.status}
            onChange={(value) => table.setFilter('status', value)}
            label="Filter by status"
            wrap
          />
        </TableToolbar>

        <DataTable
          columns={columns}
          rows={table.rows}
          loading={table.loading}
          error={table.error}
          onRetry={table.reload}
          rowTo={(row) => `/admin/transfers/${row.id}`}
          caption="Airport transfers"
          empty={{ icon: 'car', title: 'No transfers match those filters' }}
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
