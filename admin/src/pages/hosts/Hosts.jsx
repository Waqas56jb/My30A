import { Link } from 'react-router-dom'
import { SearchBar, FilterChips } from '../../components/ui/Form'
import { PageHeader, Panel, StatusPill, Money } from '../../components/common/AdminUI'
import DataTable, { Pagination, TableToolbar } from '../../components/tables/DataTable'
import { useTable } from '../../hooks/useTable'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import * as api from '../../services/adminApi'
import { HOST_STATUSES, SUBSCRIPTION_STATUSES } from '../../data/hosts'
import { formatShortDate } from '../../utils/format'

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'rejected', label: 'Rejected' },
]

/**
 * Hosts own properties and pay a subscription. Partners are local businesses
 * that pay nothing and take no bookings here — the two are never mixed.
 */
export default function Hosts() {
  useDocumentTitle('Hosts')
  const table = useTable(api.getHosts, { initial: { filters: { status: 'all' } } })

  const columns = [
    {
      key: 'name',
      label: 'Host',
      primary: true,
      render: (row) => (
        <span>
          <Link to={`/admin/hosts/${row.id}`} className="dtable__strong" onClick={(e) => e.stopPropagation()}>
            {row.name}
          </Link>
          <span style={{ display: 'block', fontSize: 'var(--fs-micro)', color: 'var(--ink-500)' }}>
            {row.company ?? row.email}
          </span>
        </span>
      ),
    },
    { key: 'town', label: 'Area', hideOn: 'card' },
    { key: 'propertyCount', label: 'Properties', align: 'right' },
    { key: 'guestCount', label: 'Guests', align: 'right', hideOn: 'card' },
    {
      key: 'plan',
      label: 'Plan',
      render: (row) => (
        <span className="tone-row">
          <span style={{ textTransform: 'capitalize' }}>
            {row.subscription.planId.replace('plan_', '')}
          </span>
          <Money amount={row.subscription.amount} />
        </span>
      ),
    },
    {
      key: 'subscription',
      label: 'Subscription',
      render: (row) => <StatusPill map={SUBSCRIPTION_STATUSES} value={row.subscription.status} />,
    },
    { key: 'status', label: 'Status', render: (row) => <StatusPill map={HOST_STATUSES} value={row.status} /> },
    {
      key: 'nextBilling',
      label: 'Next billing',
      hideOn: 'card',
      render: (row) => formatShortDate(row.subscription.nextBillingDate),
    },
  ]

  return (
    <div className="apage">
      <PageHeader
        title="Hosts"
        subtitle="Property owners and managers. Approving a host is what lets their properties go live and their guests get an experience."
      />

      <Panel flush>
        <TableToolbar>
          <SearchBar
            value={table.search}
            onChange={table.setSearch}
            placeholder="Search name, email, company or area"
            label="Search hosts"
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
          rowTo={(row) => `/admin/hosts/${row.id}`}
          caption="Hosts"
          empty={{ icon: 'building', title: 'No hosts match those filters' }}
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
