import { useState } from 'react'
import Icon from '../../components/ui/Icon'
import Button from '../../components/ui/Button'
import Modal, { ConfirmModal } from '../../components/ui/Modal'
import { SkeletonList } from '../../components/ui/Skeleton'
import { ErrorState } from '../../components/ui/States'
import { Callout } from '../../components/ui/Display'
import { Field, Input, Select, Switch } from '../../components/ui/Form'
import { PageHeader, Panel, Stat } from '../../components/common/AdminUI'
import { Badge } from '../../components/ui/StatusBadge'
import DataTable from '../../components/tables/DataTable'
import { useLoad } from '../../hooks/useTable'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useAdmin } from '../../context/AdminContext'
import * as api from '../../services/adminApi'
import { ROLES, ROLE_LIST, PERMISSION_AREAS, LEVELS } from '../../data/adminUsers'
import { formatDate, formatRelative } from '../../utils/format'

const EMPTY = { name: '', email: '', role: 'operations' }

/**
 * Admin users and the permission matrix.
 *
 * The matrix is display-only. Hiding a menu item is a convenience for the
 * operator, not a security boundary — there is no server to enforce anything,
 * and it would be dishonest to present this as access control. It exists so
 * the shape of the model can be agreed before the middleware is written.
 */
export default function AdminUsers() {
  useDocumentTitle('Admin users')
  const { pushToast, user } = useAdmin()
  const { data, loading, error, reload } = useLoad(() => api.getAdminUsers(), [])

  const [editing, setEditing] = useState(null)
  const [confirmRemove, setConfirmRemove] = useState(null)
  const [busy, setBusy] = useState(false)

  const save = async () => {
    if (!editing.name.trim() || !editing.email.trim()) {
      pushToast({ tone: 'error', title: 'A name and an email are both required' })
      return
    }
    setBusy(true)
    try {
      await api.saveAdminUser(editing)
      pushToast({ tone: 'success', title: editing.id ? 'Admin user updated' : 'Invitation recorded' })
      setEditing(null)
      reload()
    } catch (err) {
      pushToast({ tone: 'error', title: 'Could not save', message: err.message })
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    setBusy(true)
    try {
      await api.removeAdminUser(confirmRemove.id)
      pushToast({ tone: 'success', title: 'Admin user removed' })
      setConfirmRemove(null)
      reload()
    } finally {
      setBusy(false)
    }
  }

  const rows = data ?? []

  const columns = [
    {
      key: 'name',
      label: 'User',
      primary: true,
      render: (r) => (
        <span>
          <span className="dtable__strong">{r.name}</span>
          <span style={{ display: 'block', fontSize: 'var(--fs-micro)', color: 'var(--ink-500)' }}>
            {r.email}
          </span>
        </span>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      render: (r) => <Badge tone={ROLES[r.role]?.tone}>{ROLES[r.role]?.label ?? r.role}</Badge>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (r) => <Badge tone={r.status === 'active' ? 'success' : 'warn'}>{r.status}</Badge>,
    },
    {
      key: 'twoFactor',
      label: 'Two-factor',
      hideOn: 'card',
      render: (r) => (r.twoFactor ? 'On' : 'Off'),
    },
    { key: 'actionsThisMonth', label: 'Actions', align: 'right', hideOn: 'card' },
    {
      key: 'lastActiveAt',
      label: 'Last active',
      render: (r) => (r.lastActiveAt ? formatRelative(r.lastActiveAt) : 'Never'),
    },
    {
      key: 'actions',
      label: '',
      render: (r) => (
        <span className="tone-row" style={{ flexWrap: 'nowrap' }}>
          <Button size="sm" variant="ghost" icon="edit" onClick={(e) => { e.stopPropagation(); setEditing(r) }}>
            Edit
          </Button>
          <Button
            size="sm"
            variant="ghost"
            icon="trash"
            disabled={r.email === user?.email}
            onClick={(e) => { e.stopPropagation(); setConfirmRemove(r) }}
          >
            Remove
          </Button>
        </span>
      ),
    },
  ]

  return (
    <div className="apage">
      <PageHeader
        title="Admin users"
        subtitle="Who can get into this panel, and what each role covers."
        actions={<Button icon="plus" onClick={() => setEditing({ ...EMPTY })}>Invite user</Button>}
      />

      <Callout icon="alert" tone="warn">
        <strong style={{ display: 'block', marginBottom: 2 }}>Not enforced yet</strong>
        Roles currently decide which sections appear in the navigation. That is a convenience for the
        operator, not access control — with no server there is nothing to enforce a permission. The
        matrix below is the model to build against.
      </Callout>

      <div className="astats">
        <Stat label="Admin users" value={rows.length} icon="shield" tone="sea" />
        <Stat label="Active" value={rows.filter((u) => u.status === 'active').length} icon="checkCircle" tone="success" />
        <Stat label="Invited" value={rows.filter((u) => u.status === 'invited').length} icon="mail" tone="info" />
        <Stat
          label="Two-factor on"
          value={rows.filter((u) => u.twoFactor).length}
          icon="lock"
          tone="gold"
          hint={`${rows.filter((u) => !u.twoFactor).length} without`}
        />
      </div>

      <Panel title="Team" flush>
        {loading && <SkeletonList count={5} />}
        {error && <ErrorState error={error} onRetry={reload} />}
        {!loading && !error && (
          <DataTable columns={columns} rows={rows} caption="Admin users" empty={{ icon: 'shield', title: 'No admin users' }} />
        )}
      </Panel>

      <Panel
        title="Permission matrix"
        subtitle="What each role is intended to reach. Full, Edit, View or None per area."
        flush
      >
        <div className="dtable__wrap">
          <table className="matrix">
            <thead>
              <tr>
                <th scope="col">Area</th>
                {ROLE_LIST.map((role) => (
                  <th key={role.id} scope="col">{role.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISSION_AREAS.map((area) => (
                <tr key={area.key}>
                  <th scope="row" style={{ background: 'transparent', textTransform: 'none', fontSize: 'var(--fs-small)', color: 'var(--ink-800)' }}>
                    {area.label}
                  </th>
                  {ROLE_LIST.map((role) => {
                    const level = role.permissions[area.key]
                    return (
                      <td key={role.id}>
                        <Badge tone={LEVELS[level].tone}>{LEVELS[level].label}</Badge>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Roles">
        <ul className="activity">
          {ROLE_LIST.map((role) => (
            <li className="activity__row" key={role.id}>
              <span className="activity__icon" aria-hidden="true"><Icon name="shield" size={15} /></span>
              <span style={{ minWidth: 0 }}>
                <span className="activity__title">{role.label}</span>
                <span className="activity__body">{role.blurb}</span>
              </span>
              <span className="activity__meta">
                {rows.filter((u) => u.role === role.id).length} users
              </span>
            </li>
          ))}
        </ul>
      </Panel>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id ? 'Edit admin user' : 'Invite an admin user'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)} disabled={busy}>Cancel</Button>
            <Button onClick={save} loading={busy} icon="check">
              {editing?.id ? 'Save changes' : 'Send invitation'}
            </Button>
          </>
        }
      >
        {editing && (
          <div className="u-stack" style={{ gap: 'var(--sp-4)' }}>
            <Field label="Name" required>
              {(p) => (
                <Input
                  {...p}
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  placeholder="Marcus Feld"
                />
              )}
            </Field>

            <Field label="Work email" required>
              {(p) => (
                <Input
                  {...p}
                  type="email"
                  value={editing.email}
                  onChange={(e) => setEditing({ ...editing, email: e.target.value })}
                  placeholder="marcus@my30a.com"
                  autoCapitalize="none"
                  spellCheck="false"
                />
              )}
            </Field>

            <Field label="Role" hint={ROLES[editing.role]?.blurb}>
              {(p) => (
                <Select
                  {...p}
                  value={editing.role}
                  onChange={(e) => setEditing({ ...editing, role: e.target.value })}
                >
                  {ROLE_LIST.map((role) => (
                    <option key={role.id} value={role.id}>{role.label}</option>
                  ))}
                </Select>
              )}
            </Field>

            {editing.id && (
              <div className="setting-row">
                <span className="setting-row__text">
                  <span className="setting-row__title">Two-factor authentication</span>
                  <span className="setting-row__sub">
                    Recommended for anyone who can reach payments or settings.
                  </span>
                </span>
                <span className="setting-row__control">
                  <Switch
                    checked={!!editing.twoFactor}
                    onChange={(value) => setEditing({ ...editing, twoFactor: value })}
                    label="Two-factor authentication"
                  />
                </span>
              </div>
            )}

            {editing.id && (
              <p className="u-xs u-muted">Added {formatDate(editing.createdAt)}.</p>
            )}
          </div>
        )}
      </Modal>

      <ConfirmModal
        open={!!confirmRemove}
        onClose={() => setConfirmRemove(null)}
        onConfirm={remove}
        loading={busy}
        title="Remove this admin user?"
        message={
          confirmRemove
            ? `${confirmRemove.name} will lose access to the panel. Their entries in the audit log are kept — history is never rewritten.`
            : ''
        }
        confirmLabel="Remove user"
        tone="danger"
      />
    </div>
  )
}
