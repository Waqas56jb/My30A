import { Link } from 'react-router-dom'
import { SearchBar, FilterChips } from '../../components/ui/Form'
import { Thumb } from '../../components/ui/SmartImage'
import { PageHeader, Panel, StatusPill } from '../../components/common/AdminUI'
import DataTable, { Pagination, TableToolbar } from '../../components/tables/DataTable'
import { useTable } from '../../hooks/useTable'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import * as api from '../../services/adminApi'
import { PROPERTY_STATUSES } from '../../data/properties'

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'suspended', label: 'Suspended' },
]

export default function Properties() {
  useDocumentTitle('Properties')
  const table = useTable(api.getProperties, { initial: { filters: { status: 'all' } } })

  const columns = [
    {
      key: 'name',
      label: 'Property',
      primary: true,
      render: (row) => (
        <span className="tone-row" style={{ flexWrap: 'nowrap' }}>
          <Thumb photoId={row.images?.[0]} name={row.name} alt="" size={44} />
          <span style={{ minWidth: 0 }}>
            <Link to={`/admin/properties/${row.id}`} className="dtable__strong" onClick={(e) => e.stopPropagation()}>
              {row.name}
            </Link>
            <span style={{ display: 'block', fontSize: 'var(--fs-micro)', color: 'var(--ink-500)' }}>
              {row.town} · {row.type}
            </span>
          </span>
        </span>
      ),
    },
    {
      key: 'hostName',
      label: 'Host',
      render: (row) => (
        <Link to={`/admin/hosts/${row.hostId}`} onClick={(e) => e.stopPropagation()}>
          {row.hostName}
        </Link>
      ),
    },
    { key: 'bedrooms', label: 'Beds', align: 'right', hideOn: 'card' },
    { key: 'sleeps', label: 'Sleeps', align: 'right', hideOn: 'card' },
    { key: 'currentGuests', label: 'In residence', align: 'right' },
    { key: 'recommendations', label: 'Recommendations', align: 'right', hideOn: 'card' },
    {
      key: 'vitoria',
      label: 'Vitoria',
      hideOn: 'card',
      render: (row) => (row.vitoria.enabled ? 'Enabled' : 'Off'),
    },
    { key: 'status', label: 'Status', render: (row) => <StatusPill map={PROPERTY_STATUSES} value={row.status} /> },
  ]

  return (
    <div className="apage">
      <PageHeader
        title="Properties"
        subtitle="Every home on the platform. A property has to be active for its guests to get WiFi, door codes and a concierge who knows the house."
      />

      <Panel flush>
        <TableToolbar>
          <SearchBar
            value={table.search}
            onChange={table.setSearch}
            placeholder="Search name, address, host or town"
            label="Search properties"
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
          rowTo={(row) => `/admin/properties/${row.id}`}
          caption="Properties"
          empty={{ icon: 'key', title: 'No properties match those filters' }}
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
