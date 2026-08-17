import { Link } from 'react-router-dom'
import Button from '../../components/ui/Button'
import { SearchBar, FilterChips, Field, Select } from '../../components/ui/Form'
import { SkeletonList } from '../../components/ui/Skeleton'
import { PageHeader, Panel, Grid, Stat, StatusPill, InlineEmpty } from '../../components/common/AdminUI'
import { StarBreakdown } from '../../components/charts/Charts'
import DataTable, { Pagination, TableToolbar } from '../../components/tables/DataTable'
import { useTable, useLoad } from '../../hooks/useTable'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useAdmin } from '../../context/AdminContext'
import * as api from '../../services/adminApi'
import { REVIEW_STATUSES, REVIEW_SUBJECTS, reviewSummary } from '../../data/reviews'
import { formatShortDate } from '../../utils/format'

const RATING_FILTERS = [
  { value: 'all', label: 'All' },
  { value: '5', label: '5 star' },
  { value: '4', label: '4 star' },
  { value: '3', label: '3 star' },
  { value: '2', label: '2 star' },
  { value: '1', label: '1 star' },
]

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'published', label: 'Published' },
  { value: 'hidden', label: 'Hidden' },
  { value: 'flagged', label: 'Flagged' },
]

export default function Reviews() {
  useDocumentTitle('Reviews')
  const { pushToast } = useAdmin()
  const table = useTable(api.getReviews, {
    initial: { filters: { rating: 'all', status: 'all', subject: 'all' } },
  })
  const all = useLoad(() => api.getAllReviews(), [])

  const summary = all.data ? reviewSummary(all.data) : null

  const act = async (review, status, message) => {
    try {
      await api.setReviewStatus(review.id, status)
      pushToast({ tone: 'success', title: message })
      table.reload()
      all.reload()
    } catch (err) {
      pushToast({ tone: 'error', title: 'Could not update', message: err.message })
    }
  }

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
      key: 'subject',
      label: 'About',
      render: (r) => (
        <span>
          {REVIEW_SUBJECTS[r.subject]?.label ?? r.subject}
          <span style={{ display: 'block', fontSize: 'var(--fs-micro)', color: 'var(--ink-500)' }}>
            {r.partnerName ?? r.propertyName}
          </span>
        </span>
      ),
    },
    { key: 'rating', label: 'Rating', align: 'right', render: (r) => `${r.rating} / 5` },
    {
      key: 'comment',
      label: 'Comment',
      render: (r) => <span style={{ display: 'block', maxWidth: '46ch' }}>{r.comment}</span>,
    },
    { key: 'status', label: 'Status', render: (r) => <StatusPill map={REVIEW_STATUSES} value={r.status} /> },
    { key: 'createdAt', label: 'Date', hideOn: 'card', render: (r) => formatShortDate(r.createdAt) },
    {
      key: 'actions',
      label: '',
      render: (r) => (
        <span className="tone-row" style={{ flexWrap: 'nowrap' }}>
          {r.status !== 'hidden' && (
            <Button size="sm" variant="ghost" icon="eyeOff" onClick={(e) => { e.stopPropagation(); act(r, 'hidden', 'Review hidden') }}>
              Hide
            </Button>
          )}
          {r.status !== 'flagged' && (
            <Button size="sm" variant="ghost" icon="alert" onClick={(e) => { e.stopPropagation(); act(r, 'flagged', 'Review flagged') }}>
              Flag
            </Button>
          )}
          {r.status !== 'published' && (
            <Button size="sm" variant="ghost" icon="refresh" onClick={(e) => { e.stopPropagation(); act(r, 'published', 'Review restored') }}>
              Restore
            </Button>
          )}
        </span>
      ),
    },
  ]

  return (
    <div className="apage">
      <PageHeader
        title="Reviews"
        subtitle="Ratings guests leave for stays, services, partners and Vitoria. Hiding a review keeps it on record; it just stops showing publicly."
      />

      <div className="astats">
        <Stat
          label="Average rating"
          value={summary ? summary.average.toFixed(2) : '—'}
          suffix={summary ? ' / 5' : ''}
          icon="star"
          tone="gold"
        />
        <Stat label="Published" value={summary?.total ?? 0} icon="checkCircle" tone="success" />
        <Stat label="Hidden" value={summary?.hidden ?? 0} icon="eyeOff" tone="muted" />
        <Stat
          label="Flagged"
          value={summary?.flagged ?? 0}
          icon="alert"
          tone="danger"
          to="/admin/reviews?status=flagged"
        />
      </div>

      <Grid cols={2}>
        <Panel title="Distribution">
          {all.loading ? (
            <SkeletonList count={5} />
          ) : summary ? (
            <StarBreakdown breakdown={summary.breakdown} total={summary.total} />
          ) : (
            <InlineEmpty icon="star" title="No reviews yet" />
          )}
        </Panel>

        <Panel title="By subject" subtitle="What guests are rating.">
          {all.data && (
            <ul className="activity">
              {Object.entries(REVIEW_SUBJECTS).map(([key, meta]) => {
                const subset = all.data.filter((r) => r.subject === key && r.status === 'published')
                const avg = subset.length
                  ? (subset.reduce((sum, r) => sum + r.rating, 0) / subset.length).toFixed(2)
                  : '—'
                return (
                  <li className="activity__row" key={key}>
                    <span className="activity__icon" aria-hidden="true">{avg}</span>
                    <span style={{ minWidth: 0 }}>
                      <span className="activity__title">{meta.label}</span>
                      <span className="activity__body">{subset.length} reviews</span>
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </Panel>
      </Grid>

      <Panel flush>
        <TableToolbar>
          <SearchBar
            value={table.search}
            onChange={table.setSearch}
            placeholder="Search guest, comment, property or partner"
            label="Search reviews"
          />
          <Field label="About">
            {(props) => (
              <Select
                {...props}
                value={table.filters.subject}
                onChange={(e) => table.setFilter('subject', e.target.value)}
              >
                <option value="all">Everything</option>
                {Object.entries(REVIEW_SUBJECTS).map(([value, meta]) => (
                  <option key={value} value={value}>{meta.label}</option>
                ))}
              </Select>
            )}
          </Field>
          <FilterChips
            options={RATING_FILTERS}
            value={table.filters.rating}
            onChange={(value) => table.setFilter('rating', value)}
            label="Filter by rating"
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
          caption="Reviews"
          empty={{ icon: 'star', title: 'No reviews match those filters' }}
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
