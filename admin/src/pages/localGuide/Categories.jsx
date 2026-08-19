import { useState } from 'react'
import Icon from '../../components/ui/Icon'
import Button from '../../components/ui/Button'
import Modal, { ConfirmModal } from '../../components/ui/Modal'
import SmartImage from '../../components/ui/SmartImage'
import { SkeletonList } from '../../components/ui/Skeleton'
import { ErrorState } from '../../components/ui/States'
import { Field, Input, Textarea, Switch } from '../../components/ui/Form'
import { PageHeader, Panel, Stat, InlineEmpty } from '../../components/common/AdminUI'
import { Badge } from '../../components/ui/StatusBadge'
import { useLoad } from '../../hooks/useTable'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useAdmin } from '../../context/AdminContext'
import * as api from '../../services/adminApi'

const EMPTY = { name: '', description: '', icon: 'compass', image: null }

/**
 * Local Guide categories.
 *
 * Disabling a category hides it from guests without touching the partners
 * inside it — which is what you actually want in the off-season. Deleting is
 * blocked while listings still use it, because the alternative is orphaned
 * partners nobody notices until a guest reports a broken page.
 */
export default function Categories() {
  useDocumentTitle('Local Guide categories')
  const { pushToast } = useAdmin()
  const { data, loading, error, reload } = useLoad(() => api.getCategories(), [])

  const [editing, setEditing] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [busy, setBusy] = useState(false)

  const save = async () => {
    if (!editing.name.trim()) {
      pushToast({ tone: 'error', title: 'A category needs a name' })
      return
    }
    setBusy(true)
    try {
      await api.saveCategory(editing)
      pushToast({ tone: 'success', title: editing.id ? 'Category updated' : 'Category created' })
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
      await api.deleteCategory(confirmDelete.id)
      pushToast({ tone: 'success', title: 'Category deleted' })
      setConfirmDelete(null)
      reload()
    } catch (err) {
      pushToast({ tone: 'error', title: 'Cannot delete this category', message: err.message, duration: 7000 })
      setConfirmDelete(null)
    } finally {
      setBusy(false)
    }
  }

  const toggle = async (category) => {
    await api.saveCategory({ ...category, enabled: !category.enabled })
    pushToast({
      tone: 'info',
      title: category.enabled ? `${category.name} hidden from guests` : `${category.name} visible again`,
    })
    reload()
  }

  const move = async (category, direction) => {
    await api.reorderCategory(category.id, direction)
    reload()
  }

  const rows = Array.isArray(data) ? data : []

  return (
    <div className="apage">
      <PageHeader
        title="Categories"
        subtitle="The buckets guests browse by, and the ones partners apply into. Order here is the order they appear in the app."
        actions={<Button icon="plus" onClick={() => setEditing({ ...EMPTY })}>New category</Button>}
      />

      <div className="astats">
        <Stat label="Categories" value={rows.length} icon="list" tone="sea" />
        <Stat label="Enabled" value={rows.filter((c) => c.enabled).length} icon="checkCircle" tone="success" />
        <Stat label="Hidden" value={rows.filter((c) => !c.enabled).length} icon="eyeOff" tone="danger" />
        <Stat
          label="Listings"
          value={rows.reduce((sum, c) => sum + (Number(c.listings) || 0), 0)}
          icon="sparkles"
          tone="gold"
        />
      </div>

      <Panel flush>
        <div style={{ padding: 'var(--sp-4)' }}>
          {loading && <SkeletonList count={6} />}
          {error && <ErrorState error={error} onRetry={reload} />}
          {!loading && !error && rows.length === 0 && (
            <InlineEmpty icon="list" title="No categories yet" body="Create the first one to start grouping listings." />
          )}

          {!loading && !error && rows.length > 0 && (
            <ul className="activity">
              {rows.map((category, i) => (
                <li className="activity__row catrow" key={category.id}>
                  <span className="catrow__thumb">
                    {category.image ? (
                      <SmartImage photoId={category.image} alt="" ratio="1x1" width={88} radius="sm" label={category.name} />
                    ) : (
                      <span className="catrow__icon" aria-hidden="true">
                        <Icon name={category.icon || 'compass'} size={18} />
                      </span>
                    )}
                  </span>

                  <span className="catrow__copy">
                    <span className="activity__title">{category.name}</span>
                    <span className="activity__body">{category.description}</span>
                    <span className="chiplist" style={{ marginTop: 6 }}>
                      <Badge tone={category.listings ? 'sea' : 'muted'}>
                        {Number(category.listings) || 0} listing{Number(category.listings) === 1 ? '' : 's'}
                      </Badge>
                      {!category.enabled && <Badge tone="muted">Hidden from guests</Badge>}
                    </span>
                  </span>

                  <span className="catrow__actions">
                    <button
                      type="button"
                      className="pager__btn"
                      onClick={() => move(category, 'up')}
                      disabled={i === 0}
                      aria-label={`Move ${category.name} up`}
                    >
                      <Icon name="chevronUp" size={15} />
                    </button>
                    <button
                      type="button"
                      className="pager__btn"
                      onClick={() => move(category, 'down')}
                      disabled={i === rows.length - 1}
                      aria-label={`Move ${category.name} down`}
                    >
                      <Icon name="chevronDown" size={15} />
                    </button>
                    <Switch
                      checked={category.enabled}
                      onChange={() => toggle(category)}
                      label={`${category.enabled ? 'Disable' : 'Enable'} ${category.name}`}
                    />
                    <Button size="sm" variant="ghost" icon="edit" onClick={() => setEditing(category)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="ghost" icon="trash" onClick={() => setConfirmDelete(category)}>
                      Delete
                    </Button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Panel>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id ? 'Edit category' : 'New category'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)} disabled={busy}>Cancel</Button>
            <Button onClick={save} loading={busy} icon="check">Save category</Button>
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
                  placeholder="Beach Bonfires"
                />
              )}
            </Field>
            <Field label="Description" hint="One line. This is what a guest reads under the tile.">
              {(p) => (
                <Textarea
                  {...p}
                  rows={2}
                  value={editing.description}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  placeholder="Permit, wood, chairs and cleanup, all handled."
                />
              )}
            </Field>
            {editing.id && (
              <div className="setting-row">
                <span className="setting-row__text">
                  <span className="setting-row__title">Visible to guests</span>
                  <span className="setting-row__sub">
                    Hiding a category leaves its listings intact — useful off-season.
                  </span>
                </span>
                <span className="setting-row__control">
                  <Switch
                    checked={editing.enabled}
                    onChange={(value) => setEditing({ ...editing, enabled: value })}
                    label="Visible to guests"
                  />
                </span>
              </div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmModal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={remove}
        loading={busy}
        title="Delete this category?"
        message={
          confirmDelete
            ? `${confirmDelete.name} has ${Number(confirmDelete.listings) || 0} listing${Number(confirmDelete.listings) === 1 ? '' : 's'}. Categories in use cannot be deleted — move the listings first, or disable the category instead.`
            : ''
        }
        confirmLabel="Delete category"
        tone="danger"
      />
    </div>
  )
}
