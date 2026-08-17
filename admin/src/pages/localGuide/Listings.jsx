import { Link } from 'react-router-dom'
import Icon from '../../components/ui/Icon'
import Button from '../../components/ui/Button'
import SmartImage from '../../components/ui/SmartImage'
import { SearchBar, FilterChips, Field, Select } from '../../components/ui/Form'
import {
  PageHeader, Panel, StatusPill, Money, Stat, ReferralNote,
} from '../../components/common/AdminUI'
import DataTable, { Pagination, TableToolbar } from '../../components/tables/DataTable'
import { useTable, useLoad } from '../../hooks/useTable'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useAdmin } from '../../context/AdminContext'
import * as api from '../../services/adminApi'
import { PARTNER_STATUSES } from '../../data/partners'
import { formatNumber } from '../../utils/format'

const VISIBILITY = [
  { value: 'all', label: 'All' },
  { value: 'approved', label: 'Published' },
  { value: 'pending', label: 'Pending' },
  { value: 'suspended', label: 'Suspended' },
]

/**
 * The guest-facing listing controls.
 *
 * Same underlying records as /admin/partners, but this screen is about what a
 * guest sees — published, featured, priced — rather than about approving an
 * application. Listings are discovery, not a booking system: there is no
 * inventory, no calendar and no availability here, by design.
 */
export default function Listings() {
  useDocumentTitle('Listings')
  const { pushToast } = useAdmin()
  const table = useTable(api.getPartners, { initial: { filters: { status: 'all', categoryId: '' } } })
  const categories = useLoad(() => api.getCategories(), [])

  const act = async (partner, patch, message) => {
    try {
      await api.updatePartner(partner.id, patch)
      pushToast({ tone: 'success', title: message })
      table.reload()
    } catch (err) {
      pushToast({ tone: 'error', title: 'Could not update', message: err.message })
    }
  }

  const columns = [
    {
      key: 'name',
      label: 'Listing',
      primary: true,
      render: (row) => (
        <span className="tone-row" style={{ flexWrap: 'nowrap' }}>
          <span style={{ width: 40, flex: 'none' }}>
            <SmartImage photoId={row.images[0]} alt="" ratio="1x1" width={80} radius="sm" />
          </span>
          <span style={{ minWidth: 0 }}>
            <Link to={`/admin/partners/${row.id}`} className="dtable__strong" onClick={(e) => e.stopPropagation()}>
              {row.name}
            </Link>
            <span style={{ display: 'block', fontSize: 'var(--fs-micro)', color: 'var(--ink-500)' }}>
              {row.tagline}
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
      label: 'Price',
      render: (row) =>
        row.startingPrice ? (
          <span>From <Money amount={row.startingPrice} /></span>
        ) : (
          <span className="u-muted">Contact for pricing</span>
        ),
    },
    {
      key: 'rating',
      label: 'Rating',
      align: 'right',
      hideOn: 'card',
      render: (row) => (row.rating ? `${row.rating} (${row.reviewCount})` : '—'),
    },
    { key: 'images', label: 'Photos', align: 'right', hideOn: 'card', render: (row) => row.images.length },
    { key: 'views', label: 'Views', align: 'right', render: (row) => formatNumber(row.stats.views) },
    { key: 'status', label: 'Status', render: (row) => <StatusPill map={PARTNER_STATUSES} value={row.status} /> },
    {
      key: 'visibility',
      label: 'Visibility',
      render: (row) => (
        <span className="tone-row" style={{ flexWrap: 'nowrap' }}>
          {row.published ? 'Live' : 'Hidden'}
          {row.featured && <Icon name="star" size={14} style={{ color: 'var(--sand-500)' }} />}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (row) =>
        row.status === 'approved' ? (
          <span className="tone-row" style={{ flexWrap: 'nowrap' }}>
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation()
                act(row, { published: !row.published }, row.published ? 'Listing unpublished' : 'Listing published')
              }}
            >
              {row.published ? 'Unpublish' : 'Publish'}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              icon="star"
              onClick={(e) => {
                e.stopPropagation()
                act(row, { featured: !row.featured }, row.featured ? 'Removed from featured' : 'Featured')
              }}
            >
              {row.featured ? 'Unfeature' : 'Feature'}
            </Button>
          </span>
        ) : (
          <Button size="sm" variant="ghost" to={`/admin/partners/${row.id}`}>Review</Button>
        ),
    },
  ]

  return (
    <div className="apage">
      <PageHeader
        title="Listings"
        subtitle="What guests actually see in the Local Guide. These are discovery listings — My30A does not take bookings or payments for them."
      />

      <ReferralNote compact />

      <div className="astats">
        <Stat label="Listings" value={table.total} icon="grid" tone="sea" />
        <Stat label="Live" value={table.rows.filter((r) => r.published).length} icon="eye" tone="success" />
        <Stat label="Featured" value={table.rows.filter((r) => r.featured).length} icon="star" tone="gold" />
        <Stat
          label="Missing photos"
          value={table.rows.filter((r) => r.images.length < 3).length}
          icon="camera"
          tone="danger"
          hint="Three or more roughly doubles interest"
        />
      </div>

      <Panel flush>
        <TableToolbar>
          <SearchBar
            value={table.search}
            onChange={table.setSearch}
            placeholder="Search listings"
            label="Search listings"
          />
          <Field label="Category">
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
            options={VISIBILITY}
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
          caption="Local Guide listings"
          empty={{ icon: 'grid', title: 'No listings match those filters' }}
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
