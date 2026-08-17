import { useState } from 'react'
import Icon from '../../components/ui/Icon'
import Button from '../../components/ui/Button'
import Modal, { ConfirmModal } from '../../components/ui/Modal'
import SmartImage from '../../components/ui/SmartImage'
import { SkeletonGrid } from '../../components/ui/Skeleton'
import { ErrorState } from '../../components/ui/States'
import { Callout } from '../../components/ui/Display'
import { SearchBar, FilterChips, Field, Input, Select } from '../../components/ui/Form'
import { PageHeader, Panel, Stat, InlineEmpty } from '../../components/common/AdminUI'
import { useLoad } from '../../hooks/useTable'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useAdmin } from '../../context/AdminContext'
import * as api from '../../services/adminApi'
import { MEDIA_CATEGORIES } from '../../data/content'
import { PHOTO } from '../../assets/images'
import { formatDate } from '../../utils/format'

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'archived', label: 'Archived' },
]

/** A pool the mock "upload" picks from, so a new card shows a real photograph. */
const UPLOAD_POOL = [
  PHOTO.beachWaves, PHOTO.beachGrass, PHOTO.coastalRoad, PHOTO.sunsetSilhouette,
  PHOTO.cocktails, PHOTO.iceCream, PHOTO.tacos, PHOTO.breakfast, PHOTO.coffeeShop,
]

export default function Media() {
  useDocumentTitle('Media')
  const { pushToast } = useAdmin()

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [status, setStatus] = useState('all')
  const [uploading, setUploading] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [busy, setBusy] = useState(false)

  const { data, loading, error, reload } = useLoad(
    () => api.getMedia({ search, category, status }),
    [search, category, status],
  )

  const upload = async () => {
    if (!uploading.name.trim()) {
      pushToast({ tone: 'error', title: 'Give the image a name' })
      return
    }
    setBusy(true)
    try {
      await api.addMedia(uploading)
      pushToast({
        tone: 'success',
        title: 'Image added',
        message: 'Mock upload — a photograph from the shared library was attached.',
      })
      setUploading(null)
      reload()
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    setBusy(true)
    try {
      await api.deleteMedia(confirmDelete.id)
      pushToast({ tone: 'success', title: 'Image deleted' })
      setConfirmDelete(null)
      reload()
    } finally {
      setBusy(false)
    }
  }

  const feature = async (image) => {
    await api.updateMedia(image.id, { featured: !image.featured })
    pushToast({ tone: 'success', title: image.featured ? 'Removed from featured' : 'Set as featured' })
    reload()
  }

  const rows = data ?? []

  return (
    <div className="apage">
      <PageHeader
        title="Media library"
        subtitle="The photographs behind the guest experience. The public app sells 30A visually, so this is one of the highest-leverage screens in the panel."
        actions={
          <Button
            icon="upload"
            onClick={() =>
              setUploading({
                name: '',
                category: MEDIA_CATEGORIES[0],
                photoId: UPLOAD_POOL[Math.floor(rows.length % UPLOAD_POOL.length)],
              })
            }
          >
            Upload image
          </Button>
        }
      />

      <Callout icon="info">
        <strong style={{ display: 'block', marginBottom: 2 }}>Mock uploads</strong>
        There is no file storage connected. “Upload” attaches a photograph from the shared library so
        the workflow can be reviewed; no binary is stored in this repository.
      </Callout>

      <div className="astats">
        <Stat label="Images" value={rows.length} icon="camera" tone="sea" />
        <Stat label="Featured" value={rows.filter((m) => m.featured).length} icon="star" tone="gold" />
        <Stat label="In use" value={rows.filter((m) => m.usedBy !== 'Unused').length} icon="checkCircle" tone="success" />
        <Stat label="Unused" value={rows.filter((m) => m.usedBy === 'Unused').length} icon="circle" tone="muted" />
      </div>

      <Panel flush>
        <div className="ttoolbar">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search image name or category"
            label="Search media"
          />
          <Field label="Category">
            {(props) => (
              <Select {...props} value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="all">All categories</option>
                {MEDIA_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            )}
          </Field>
          <FilterChips options={STATUS_FILTERS} value={status} onChange={setStatus} label="Filter by status" />
        </div>

        <div style={{ padding: 'var(--sp-4)' }}>
          {loading && <SkeletonGrid count={8} columns="grid--4" />}
          {error && <ErrorState error={error} onRetry={reload} />}
          {!loading && !error && rows.length === 0 && (
            <InlineEmpty icon="camera" title="No images match those filters" />
          )}

          {!loading && !error && rows.length > 0 && (
            <div className="mediagrid">
              {rows.map((image) => (
                <div className="mediacard" key={image.id}>
                  <div className="mediacard__img">
                    <SmartImage photoId={image.photoId} alt={image.name} fill width={400} />
                    {image.featured && <span className="mediacard__flag">Featured</span>}
                  </div>
                  <div className="mediacard__body">
                    <span className="mediacard__name" title={image.name}>{image.name}</span>
                    <span className="mediacard__meta">
                      {image.category} · {image.usedBy}
                    </span>
                    <span className="mediacard__meta">
                      {formatDate(image.uploadedAt)} · {image.uploadedBy}
                    </span>
                  </div>
                  <div className="mediacard__actions">
                    <Button size="sm" variant="ghost" icon="star" onClick={() => feature(image)}>
                      {image.featured ? 'Unfeature' : 'Feature'}
                    </Button>
                    <Button size="sm" variant="ghost" icon="trash" onClick={() => setConfirmDelete(image)}>
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Panel>

      <Modal
        open={!!uploading}
        onClose={() => setUploading(null)}
        title="Upload an image"
        footer={
          <>
            <Button variant="secondary" onClick={() => setUploading(null)} disabled={busy}>Cancel</Button>
            <Button onClick={upload} loading={busy} icon="upload">Add to library</Button>
          </>
        }
      >
        {uploading && (
          <div className="u-stack" style={{ gap: 'var(--sp-4)' }}>
            <div className="mediacard">
              <div className="mediacard__img">
                <SmartImage photoId={uploading.photoId} alt="" fill width={500} />
              </div>
            </div>

            <Field label="Name" required>
              {(p) => (
                <Input
                  {...p}
                  value={uploading.name}
                  onChange={(e) => setUploading({ ...uploading, name: e.target.value })}
                  placeholder="Sunset over the Gulf"
                />
              )}
            </Field>

            <Field label="Category">
              {(p) => (
                <Select
                  {...p}
                  value={uploading.category}
                  onChange={(e) => setUploading({ ...uploading, category: e.target.value })}
                >
                  {MEDIA_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </Select>
              )}
            </Field>
          </div>
        )}
      </Modal>

      <ConfirmModal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={remove}
        loading={busy}
        title="Delete this image?"
        message={
          confirmDelete
            ? `"${confirmDelete.name}" is currently used by: ${confirmDelete.usedBy}. Deleting it will leave that slot without a photograph.`
            : ''
        }
        confirmLabel="Delete image"
        tone="danger"
      />
    </div>
  )
}
