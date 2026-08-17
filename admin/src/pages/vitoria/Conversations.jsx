import { Link } from 'react-router-dom'
import { SearchBar, FilterChips, Field, Select } from '../../components/ui/Form'
import { PageHeader, Panel, StatusPill } from '../../components/common/AdminUI'
import DataTable, { Pagination, TableToolbar } from '../../components/tables/DataTable'
import { useTable } from '../../hooks/useTable'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import * as api from '../../services/adminApi'
import { CONVERSATION_STATUSES, TOPICS } from '../../data/conversations'
import { formatRelative } from '../../utils/format'

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'active', label: 'Active' },
  { value: 'escalated', label: 'Escalated' },
  { value: 'abandoned', label: 'Abandoned' },
]

export default function Conversations() {
  useDocumentTitle('Conversations')
  const table = useTable(api.getConversations, { initial: { filters: { status: 'all', topic: 'all' } } })

  const columns = [
    {
      key: 'guestName',
      label: 'Guest',
      primary: true,
      render: (row) => (
        <span>
          <Link
            to={`/admin/vitoria/conversations/${row.id}`}
            className="dtable__strong"
            onClick={(e) => e.stopPropagation()}
          >
            {row.guestName}
          </Link>
          <span style={{ display: 'block', fontSize: 'var(--fs-micro)', color: 'var(--ink-500)' }}>
            {row.propertyName}
          </span>
        </span>
      ),
    },
    { key: 'language', label: 'Language', hideOn: 'card' },
    { key: 'topic', label: 'Topic' },
    { key: 'messageCount', label: 'Messages', align: 'right' },
    {
      key: 'createdRequest',
      label: 'Created',
      render: (row) => (row.createdRequest ? row.createdRequest.label : '—'),
    },
    { key: 'status', label: 'Status', render: (row) => <StatusPill map={CONVERSATION_STATUSES} value={row.status} /> },
    { key: 'createdAt', label: 'When', hideOn: 'card', render: (row) => formatRelative(row.createdAt) },
  ]

  return (
    <div className="apage">
      <PageHeader
        title="Conversations"
        subtitle="Every exchange between a guest and Vitoria. Open one to see what was said and what it produced."
      />

      <Panel flush>
        <TableToolbar>
          <SearchBar
            value={table.search}
            onChange={table.setSearch}
            placeholder="Search guest, property or topic"
            label="Search conversations"
          />
          <Field label="Topic">
            {(props) => (
              <Select
                {...props}
                value={table.filters.topic}
                onChange={(e) => table.setFilter('topic', e.target.value)}
              >
                <option value="all">All topics</option>
                {TOPICS.map((topic) => (
                  <option key={topic} value={topic}>{topic}</option>
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
          rowTo={(row) => `/admin/vitoria/conversations/${row.id}`}
          caption="Conversations"
          empty={{ icon: 'message', title: 'No conversations match those filters' }}
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
