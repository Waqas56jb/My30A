import { useState } from 'react'
import Icon from '../../components/ui/Icon'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import SmartImage from '../../components/ui/SmartImage'
import { SkeletonList } from '../../components/ui/Skeleton'
import { ErrorState } from '../../components/ui/States'
import { SearchBar, FilterChips, Field, Input, Textarea, Select, Switch } from '../../components/ui/Form'
import { PageHeader, Panel, Stat, InlineEmpty } from '../../components/common/AdminUI'
import { Badge } from '../../components/ui/StatusBadge'
import { useLoad } from '../../hooks/useTable'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useAdmin } from '../../context/AdminContext'
import * as api from '../../services/adminApi'
import { CONTENT_TYPES } from '../../data/content'
import { MEDIA_CATEGORIES } from '../../data/content'
import { formatDate } from '../../utils/format'

const PUBLISHED_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'yes', label: 'Published' },
  { value: 'no', label: 'Unpublished' },
]

/**
 * Guest-facing content.
 *
 * The guest app sells 30A with photographs, so whoever runs marketing has to
 * be able to change a hero image, reorder the featured experiences and pull a
 * promotion without a developer.
 */
export default function Content() {
  useDocumentTitle('Content')
  const { pushToast } = useAdmin()

  const [search, setSearch] = useState('')
  const [type, setType] = useState('all')
  const [published, setPublished] = useState('all')
  const [editing, setEditing] = useState(null)
  const [busy, setBusy] = useState(false)

  const { data, loading, error, reload } = useLoad(
    () => api.getContent({ search, type, published }),
    [search, type, published],
  )
  const media = useLoad(() => api.getMedia({}), [])

  const save = async () => {
    setBusy(true)
    try {
      await api.updateContent(editing.id, {
        title: editing.title,
        note: editing.note,
        image: editing.image,
        published: editing.published,
      })
      pushToast({ tone: 'success', title: 'Content updated' })
      setEditing(null)
      reload()
    } catch (err) {
      pushToast({ tone: 'error', title: 'Could not save', message: err.message })
    } finally {
      setBusy(false)
    }
  }

  const toggle = async (block) => {
    await api.updateContent(block.id, { published: !block.published })
    pushToast({
      tone: 'success',
      title: block.published ? `"${block.title}" unpublished` : `"${block.title}" published`,
    })
    reload()
  }

  const move = async (block, direction) => {
    await api.reorderContent(block.id, direction)
    reload()
  }

  const rows = data ?? []

  return (
    <div className="apage">
      <PageHeader
        title="Content"
        subtitle="Everything a guest sees on the public site and in the Local Guide: heroes, featured experiences, beaches, restaurants, events and promotions."
        actions={<Button to="/admin/media" variant="secondary" icon="camera">Media library</Button>}
      />

      <div className="astats">
        <Stat label="Content blocks" value={rows.length} icon="image" tone="sea" />
        <Stat label="Published" value={rows.filter((c) => c.published).length} icon="eye" tone="success" />
        <Stat label="Unpublished" value={rows.filter((c) => !c.published).length} icon="eyeOff" tone="danger" />
        <Stat label="Featured slots" value={rows.filter((c) => c.featured).length} icon="star" tone="gold" />
      </div>

      <Panel flush>
        <div className="ttoolbar">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search titles and notes"
            label="Search content"
          />
          <Field label="Type">
            {(props) => (
              <Select {...props} value={type} onChange={(e) => setType(e.target.value)}>
                <option value="all">All types</option>
                {Object.entries(CONTENT_TYPES).map(([value, meta]) => (
                  <option key={value} value={value}>{meta.label}</option>
                ))}
              </Select>
            )}
          </Field>
          <FilterChips
            options={PUBLISHED_FILTERS}
            value={published}
            onChange={setPublished}
            label="Filter by visibility"
          />
        </div>

        <div style={{ padding: 'var(--sp-4)' }}>
          {loading && <SkeletonList count={6} />}
          {error && <ErrorState error={error} onRetry={reload} />}
          {!loading && !error && rows.length === 0 && (
            <InlineEmpty icon="image" title="No content matches those filters" />
          )}

          {!loading && !error && rows.length > 0 && (
            <ul className="activity">
              {rows.map((block, i) => {
                const meta = CONTENT_TYPES[block.type]
                return (
                  <li className="activity__row" key={block.id} style={{ alignItems: 'center' }}>
                    <span style={{ width: 62, flex: 'none' }}>
                      <SmartImage photoId={block.image} alt="" ratio="4x3" width={140} radius="sm" />
                    </span>

                    <span style={{ minWidth: 0, flex: '1 1 auto' }}>
                      <span className="activity__title">{block.title}</span>
                      <span className="activity__body">{block.note}</span>
                      <span className="chiplist" style={{ marginTop: 6 }}>
                        <Badge tone={meta?.tone}>{meta?.label ?? block.type}</Badge>
                        {!block.published && <Badge tone="muted">Unpublished</Badge>}
                        <span className="u-xs u-muted">
                          Updated {formatDate(block.updatedAt)} by {block.updatedBy}
                        </span>
                      </span>
                    </span>

                    <span className="tone-row" style={{ flex: 'none' }}>
                      <button
                        type="button"
                        className="pager__btn"
                        onClick={() => move(block, 'up')}
                        disabled={i === 0}
                        aria-label={`Move ${block.title} up`}
                      >
                        <Icon name="chevronUp" size={15} />
                      </button>
                      <button
                        type="button"
                        className="pager__btn"
                        onClick={() => move(block, 'down')}
                        disabled={i === rows.length - 1}
                        aria-label={`Move ${block.title} down`}
                      >
                        <Icon name="chevronDown" size={15} />
                      </button>
                      <Switch
                        checked={block.published}
                        onChange={() => toggle(block)}
                        label={`${block.published ? 'Unpublish' : 'Publish'} ${block.title}`}
                      />
                      <Button size="sm" variant="ghost" icon="edit" onClick={() => setEditing(block)}>
                        Edit
                      </Button>
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </Panel>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Edit content block"
        subtitle={editing ? CONTENT_TYPES[editing.type]?.label : ''}
        wide
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)} disabled={busy}>Cancel</Button>
            <Button onClick={save} loading={busy} icon="check">Save changes</Button>
          </>
        }
      >
        {editing && (
          <div className="u-stack" style={{ gap: 'var(--sp-4)' }}>
            <Field label="Title">
              {(p) => (
                <Input
                  {...p}
                  value={editing.title}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                />
              )}
            </Field>

            <Field label="Internal note" hint="Not shown to guests — a reminder of where this appears.">
              {(p) => (
                <Textarea
                  {...p}
                  rows={2}
                  value={editing.note}
                  onChange={(e) => setEditing({ ...editing, note: e.target.value })}
                />
              )}
            </Field>

            <div>
              <span className="field__label" style={{ display: 'block', marginBottom: 8 }}>Image</span>
              <div className="mediagrid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 120px), 1fr))', maxHeight: 260, overflowY: 'auto' }}>
                {(media.data ?? []).slice(0, 24).map((image) => (
                  <button
                    key={image.id}
                    type="button"
                    className="mediacard"
                    onClick={() => setEditing({ ...editing, image: image.photoId })}
                    style={{
                      cursor: 'pointer',
                      padding: 0,
                      border:
                        editing.image === image.photoId
                          ? '2px solid var(--sea-500)'
                          : '1px solid var(--line)',
                    }}
                  >
                    <span className="mediacard__img" style={{ display: 'block' }}>
                      <SmartImage photoId={image.photoId} alt={image.name} fill width={240} />
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="setting-row">
              <span className="setting-row__text">
                <span className="setting-row__title">Published</span>
                <span className="setting-row__sub">Unpublished blocks disappear from the guest app.</span>
              </span>
              <span className="setting-row__control">
                <Switch
                  checked={editing.published}
                  onChange={(value) => setEditing({ ...editing, published: value })}
                  label="Published"
                />
              </span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
