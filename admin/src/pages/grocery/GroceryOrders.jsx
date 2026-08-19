import { Link } from 'react-router-dom'
import { SearchBar, FilterChips } from '../../components/ui/Form'
import { PageHeader, Panel, StatusPill, Money, Stat } from '../../components/common/AdminUI'
import DataTable, { Pagination, TableToolbar } from '../../components/tables/DataTable'
import { useTable } from '../../hooks/useTable'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import * as api from '../../services/adminApi'
import { GROCERY_STATUSES } from '../../data/orders'
import { formatShortDate, formatRelative } from '../../utils/format'

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  ...Object.entries(GROCERY_STATUSES).map(([value, meta]) => ({ value, label: meta.label })),
]

/**
 * Grocery is a My30A-managed service, so admin owns the whole lifecycle:
 * request, confirmation, payment, shopping, delivery, photo, fee and tip.
 */
export default function GroceryOrders() {
  useDocumentTitle('Grocery orders')
  const table = useTable(api.getOrders, { initial: { filters: { status: 'all' } } })

  const columns = [
    {
      key: 'id',
      label: 'Order',
      primary: true,
      render: (row) => (
        <Link to={`/admin/grocery/${row.id}`} className="dtable__strong dtable__mono" onClick={(e) => e.stopPropagation()}>
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
    { key: 'deliveryDate', label: 'Delivery', render: (row) => formatShortDate(row.deliveryDate) },
    {
      key: 'estimatedAmount',
      label: 'Basket',
      align: 'right',
      render: (row) => <Money amount={row.actualAmount ?? row.estimatedAmount} />,
    },
    { key: 'serviceFee', label: 'Service fee', align: 'right', hideOn: 'card', render: (row) => <Money amount={row.serviceFee} /> },
    {
      key: 'total',
      label: 'Total',
      align: 'right',
      render: (row) => (
        <Money
          amount={Number(row.actualAmount ?? row.estimatedAmount ?? 0) + Number(row.serviceFee ?? 0)}
        />
      ),
    },
    { key: 'status', label: 'Status', render: (row) => <StatusPill map={GROCERY_STATUSES} value={row.status} /> },
    {
      key: 'payment',
      label: 'Payment',
      hideOn: 'card',
      render: (row) => (row.paymentId ? 'Charged' : 'Not yet'),
    },
    { key: 'createdAt', label: 'Created', hideOn: 'card', render: (row) => formatRelative(row.createdAt) },
  ]

  const pending = table.rows.filter((o) => o.status === 'pending').length

  return (
    <div className="apage">
      <PageHeader
        title="Grocery orders"
        subtitle="Guests send a list, we confirm an estimate, they pay the basket, a shopper delivers, and the service fee is charged on completion."
      />

      <div className="astats">
        <Stat label="On this page" value={table.total} icon="bag" tone="sea" />
        <Stat label="Awaiting confirmation" value={pending} icon="clock" tone="danger" to="/admin/grocery?status=pending" />
        <Stat
          label="Out for delivery"
          value={table.rows.filter((o) => ['shopping', 'on_the_way'].includes(o.status)).length}
          icon="car"
          tone="info"
        />
        <Stat
          label="Delivered"
          value={table.rows.filter((o) => o.status === 'delivered').length}
          icon="checkCircle"
          tone="success"
        />
      </div>

      <Panel flush>
        <TableToolbar>
          <SearchBar
            value={table.search}
            onChange={table.setSearch}
            placeholder="Search order id, guest, property or shopper"
            label="Search orders"
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
          rowTo={(row) => `/admin/grocery/${row.id}`}
          caption="Grocery orders"
          empty={{ icon: 'bag', title: 'No orders match those filters' }}
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
