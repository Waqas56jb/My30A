import { Link } from 'react-router-dom'
import { SearchBar, FilterChips } from '../../components/ui/Form'
import { PageHeader, Panel, StatusPill } from '../../components/common/AdminUI'
import DataTable, { Pagination, TableToolbar } from '../../components/tables/DataTable'
import { useTable } from '../../hooks/useTable'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import * as api from '../../services/adminApi'
import { GUEST_STATUSES } from '../../data/guests'
import { formatShortDate, formatRelative } from '../../utils/format'

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'In residence' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'checked_out', label: 'Checked out' },
  { value: 'inactive', label: 'Inactive' },
]

export default function Guests() {
  useDocumentTitle('Guests')
  const table = useTable(api.getGuests, { initial: { filters: { status: 'all' } } })

  const columns = [
    {
      key: 'name',
      label: 'Guest',
      primary: true,
      render: (row) => (
        <span>
          <Link to={`/admin/guests/${row.id}`} className="dtable__strong" onClick={(e) => e.stopPropagation()}>
            {row.name}
          </Link>
          <span style={{ display: 'block', fontSize: 'var(--fs-micro)', color: 'var(--ink-500)' }}>
            {row.email}
          </span>
        </span>
      ),
    },
    { key: 'phone', label: 'Phone', hideOn: 'card' },
    { key: 'propertyName', label: 'Property' },
    { key: 'hostName', label: 'Host', hideOn: 'card' },
    { key: 'checkIn', label: 'Arrival', render: (row) => formatShortDate(row.checkIn) },
    { key: 'checkOut', label: 'Departure', render: (row) => formatShortDate(row.checkOut) },
    { key: 'status', label: 'Status', render: (row) => <StatusPill map={GUEST_STATUSES} value={row.status} /> },
    {
      key: 'lastActiveAt',
      label: 'Last activity',
      hideOn: 'card',
      render: (row) => formatRelative(row.lastActiveAt),
    },
  ]

  return (
    <div className="apage">
      <PageHeader
        title="Guests"
        subtitle="Everyone with a stay on 30A — past, present and booked. Status is worked out from the stay dates, so it is never out of date."
      />

      <Panel flush>
        <TableToolbar>
          <SearchBar
            value={table.search}
            onChange={table.setSearch}
            placeholder="Search name, email, phone or property"
            label="Search guests"
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
          rowTo={(row) => `/admin/guests/${row.id}`}
          caption="Guests"
          empty={{
            icon: 'user',
            title: 'No guests match those filters',
            body: 'Try a different status, or clear the search.',
          }}
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
