import { Link } from 'react-router-dom'
import Icon from '../../components/ui/Icon'
import { SearchBar, FilterChips, Select, Field } from '../../components/ui/Form'
import { PageHeader, Panel, StatusPill, Money, ReferralNote, Stat } from '../../components/common/AdminUI'
import DataTable, { Pagination, TableToolbar } from '../../components/tables/DataTable'
import { Thumb } from '../../components/ui/SmartImage'
import AccountActions from '../../components/accounts/AccountActions'
import AccountModals from '../../components/accounts/AccountModals'
import { useTable, useLoad } from '../../hooks/useTable'
import { useAccountManage } from '../../hooks/useAccountManage'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import * as api from '../../services/adminApi'
import { PARTNER_STATUSES } from '../../data/partners'
import { formatNumber, formatRelative } from '../../utils/format'
import { partnerPath } from '../../utils/paths'

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending review' },
  { value: 'approved', label: 'Approved' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'rejected', label: 'Rejected' },
]

/**
 * Partner applications and listings.
 *
 * A partner is a local business we point guests at, not a supplier we book. So
 * the columns here are approval state and referral traffic — there is no
 * revenue column, because My30A never sees a penny of what a partner earns.
 */
export default function Partners() {
  useDocumentTitle('Partners')
  const table = useTable(api.getPartners, { initial: { filters: { status: 'all', categoryId: '' } } })
  const categories = useLoad(() => api.getCategories(), [])
  const manage = useAccountManage('partner', { onDone: table.reload })

  const pending = table.rows.filter((p) => p.status === 'pending').length

  const columns = [
    {
      key: 'name',
      label: 'Business',
      primary: true,
      render: (row) => (
        <span className="tone-row" style={{ flexWrap: 'nowrap' }}>
          <Thumb photoId={row.images?.[0]} name={row.name} alt="" />
          <span style={{ minWidth: 0 }}>
            <Link to={partnerPath(row)} className="dtable__strong" onClick={(e) => e.stopPropagation()}>
              {row.name}
            </Link>
            <span style={{ display: 'block', fontSize: 'var(--fs-micro)', color: 'var(--ink-500)' }}>
              {row.owner} · {row.town}
            </span>
          </span>
        </span>
      ),
    },
    {
      key: 'categoryId',
      label: 'Category',
      render: (row) => categories.data?.find((c) => c.id === row.categoryId)?.name ?? row.categoryId,
    },
    {
      key: 'startingPrice',
      label: 'From',
      hideOn: 'card',
      render: (row) => (row.startingPrice ? <Money amount={row.startingPrice} /> : <span className="u-muted">Contact for pricing</span>),
    },
    { key: 'views', label: 'Views', align: 'right', render: (row) => formatNumber(row.stats?.views) },
    {
      key: 'clicks',
      label: 'Outbound',
      align: 'right',
      render: (row) =>
        formatNumber((Number(row.stats?.websiteClicks) || 0) + (Number(row.stats?.phoneClicks) || 0) + (Number(row.stats?.directionsClicks) || 0)),
    },
    {
      key: 'featured',
      label: 'Featured',
      hideOn: 'card',
      render: (row) => (row.featured ? <Icon name="star" size={16} style={{ color: 'var(--sand-500)' }} /> : '—'),
    },
    { key: 'status', label: 'Status', render: (row) => <StatusPill map={PARTNER_STATUSES} value={row.status} /> },
    { key: 'submittedAt', label: 'Applied', hideOn: 'card', render: (row) => formatRelative(row.submittedAt) },
    {
      key: 'actions',
      label: '',
      render: (row) => <AccountActions kind="partner" row={row} manage={manage} />,
    },
  ]

  return (
    <div className="apage">
      <PageHeader
        title="Partners"
        subtitle="Filter by status or category, then edit, block or remove a listing from this list."
      />

      {pending > 0 && table.filters.status !== 'pending' && (
        <Link to="/admin/partners?status=pending" className="attn attn--warn">
          <span className="attn__count">{pending}</span>
          <span className="attn__label">applications on this page are waiting for review</span>
          <Icon name="chevronRight" size={16} className="attn__go" />
        </Link>
      )}

      <ReferralNote />

      <Panel flush>
        <TableToolbar>
          <SearchBar
            value={table.search}
            onChange={table.setSearch}
            placeholder="Search business, owner or town"
            label="Search partners"
          />
          <Field label="Category" className="ttoolbar__select">
            {(props) => (
              <Select
                {...props}
                value={table.filters.categoryId}
                onChange={(e) => table.setFilter('categoryId', e.target.value)}
              >
                <option value="">All categories</option>
                {(categories.data ?? []).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            )}
          </Field>
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
          rowTo={partnerPath}
          caption="Partners"
          empty={{ icon: 'sparkles', title: 'No partners match those filters' }}
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
