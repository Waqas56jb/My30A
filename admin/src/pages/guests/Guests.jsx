import { Link } from 'react-router-dom'
import { SearchBar, FilterChips } from '../../components/ui/Form'
import { PageHeader, Panel, StatusPill } from '../../components/common/AdminUI'
import DataTable, { Pagination, TableToolbar } from '../../components/tables/DataTable'
import AccountActions from '../../components/accounts/AccountActions'
import AccountModals from '../../components/accounts/AccountModals'
import { useTable } from '../../hooks/useTable'
import { useAccountManage } from '../../hooks/useAccountManage'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import * as api from '../../services/adminApi'
import { GUEST_STATUSES, GUEST_ACCOUNT_STATUSES } from '../../data/guests'
import { formatShortDate, formatRelative } from '../../utils/format'

const STATUS_FILTERS = [
  { value: 'all', label: 'All stays' },
  { value: 'active', label: 'In residence' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'checked_out', label: 'Checked out' },
  { value: 'inactive', label: 'Inactive' },
]

const ACCOUNT_FILTERS = [
  { value: 'all', label: 'All accounts' },
  { value: 'active', label: 'Active' },
  { value: 'blocked', label: 'Blocked' },
]

export default function Guests() {
  useDocumentTitle('Guests')
  const table = useTable(api.getGuests, { initial: { filters: { status: 'all', account: 'all' } } })
  const manage = useAccountManage('guest', { onDone: table.reload })

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
    { key: 'status', label: 'Stay', render: (row) => <StatusPill map={GUEST_STATUSES} value={row.status} /> },
    {
      key: 'accountStatus',
      label: 'Account',
      render: (row) => <StatusPill map={GUEST_ACCOUNT_STATUSES} value={row.accountStatus ?? 'active'} />,
    },
    {
      key: 'lastActiveAt',
      label: 'Last activity',
      hideOn: 'card',
      render: (row) => formatRelative(row.lastActiveAt),
    },
    {
      key: 'actions',
      label: '',
      render: (row) => <AccountActions kind="guest" row={row} manage={manage} />,
    },
  ]

  return (
    <div className="apage">
      <PageHeader
        title="Guests"
        subtitle="Filter by stay or account, then edit, block or remove anyone from this list."
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
            label="Filter by stay"
          />
          <FilterChips
            options={ACCOUNT_FILTERS}
            value={table.filters.account}
            onChange={(value) => table.setFilter('account', value)}
            label="Filter by account"
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
      <AccountModals manage={manage} />
    </div>
  )
}
