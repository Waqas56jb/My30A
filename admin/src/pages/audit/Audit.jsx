import { SearchBar, Field, Select } from '../../components/ui/Form'
import { Callout } from '../../components/ui/Display'
import { PageHeader, Panel, Stat, StatusPill } from '../../components/common/AdminUI'
import DataTable, { Pagination, TableToolbar } from '../../components/tables/DataTable'
import { useTable, useLoad } from '../../hooks/useTable'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import * as api from '../../services/adminApi'
import { AUDIT_STATUSES } from '../../data/audit'
import { formatDate, formatTime, formatRelative } from '../../utils/format'

const ENTITIES = [
  'Partner', 'Host', 'Property', 'Guest', 'Grocery order', 'Transfer', 'Payment',
  'Refund', 'Review', 'Content', 'Media', 'Notification', 'Automation', 'Knowledge',
  'Category', 'Settings', 'Admin user', 'Subscription',
]

/**
 * The audit log.
 *
 * Every mutation in the panel appends here through the service layer rather
 * than from the components, so an action cannot be performed without being
 * recorded. The IP column is a placeholder — there is no request, so there is
 * no address, and inventing a plausible one would be fabricating evidence.
 */
export default function Audit() {
  useDocumentTitle('Audit log')
  const table = useTable(api.getAudit, { initial: { filters: { entity: 'all', userId: 'all' } } })
  const users = useLoad(() => api.getAdminUsers(), [])

  const columns = [
    {
      key: 'userName',
      label: 'User',
      primary: true,
      render: (r) => (
        <span>
          <span className="dtable__strong">{r.userName}</span>
          <span style={{ display: 'block', fontSize: 'var(--fs-micro)', color: 'var(--ink-500)', textTransform: 'capitalize' }}>
            {r.userRole.replace(/_/g, ' ')}
          </span>
        </span>
      ),
    },
    { key: 'action', label: 'Action' },
    { key: 'entity', label: 'Entity' },
    { key: 'entityId', label: 'Entity id', render: (r) => <span className="dtable__mono">{r.entityId}</span> },
    {
      key: 'at',
      label: 'When',
      render: (r) => (
        <span>
          {formatDate(r.at)} {formatTime(r.at)}
          <span style={{ display: 'block', fontSize: 'var(--fs-micro)', color: 'var(--ink-500)' }}>
            {formatRelative(r.at)}
          </span>
        </span>
      ),
    },
    { key: 'ip', label: 'IP', hideOn: 'card' },
    { key: 'status', label: 'Result', render: (r) => <StatusPill map={AUDIT_STATUSES} value={r.status} /> },
  ]

  return (
    <div className="apage">
      <PageHeader
        title="Audit log"
        subtitle="Every change made in this panel, newest first. Approvals, status changes, refunds, edits and settings."
      />

      <Callout icon="info">
        The IP column is a placeholder. This build has no server and therefore no request to read an
        address from — showing a realistic-looking one would be inventing evidence.
      </Callout>

      <div className="astats">
        <Stat label="Entries" value={table.total} icon="shield" tone="sea" />
        <Stat
          label="Failed actions"
          value={table.rows.filter((r) => r.status === 'failed').length}
          icon="alert"
          tone="danger"
        />
        <Stat
          label="Distinct users"
          value={new Set(table.rows.map((r) => r.userId)).size}
          icon="users"
          tone="info"
        />
        <Stat
          label="Distinct entities"
          value={new Set(table.rows.map((r) => r.entity)).size}
          icon="grid"
          tone="gold"
        />
      </div>

      <Panel flush>
        <TableToolbar>
          <SearchBar
            value={table.search}
            onChange={table.setSearch}
            placeholder="Search action, entity or user"
            label="Search the audit log"
          />
          <Field label="Entity">
            {(props) => (
              <Select
                {...props}
                value={table.filters.entity}
                onChange={(e) => table.setFilter('entity', e.target.value)}
              >
                <option value="all">All entities</option>
                {ENTITIES.map((entity) => (
                  <option key={entity} value={entity}>{entity}</option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="User">
            {(props) => (
              <Select
                {...props}
                value={table.filters.userId}
                onChange={(e) => table.setFilter('userId', e.target.value)}
              >
                <option value="all">Everyone</option>
                {(users.data ?? []).map((user) => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </Select>
            )}
          </Field>
        </TableToolbar>

        <DataTable
          columns={columns}
          rows={table.rows}
          loading={table.loading}
          error={table.error}
          onRetry={table.reload}
          caption="Audit log"
          empty={{ icon: 'shield', title: 'No entries match those filters' }}
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
