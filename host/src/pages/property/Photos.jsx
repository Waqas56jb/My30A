import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import Icon from '../../components/ui/Icon'
import Button, { IconButton } from '../../components/ui/Button'
import SmartImage from '../../components/ui/SmartImage'
import Modal, { ConfirmModal } from '../../components/ui/Modal'
import { Field, Input, Select, FilterChips } from '../../components/ui/Form'
import { Badge } from '../../components/ui/StatusBadge'
import { EmptyState } from '../../components/ui/States'
import { Panel } from '../../components/HostUI'
import { useWorkspace } from '../../context/WorkspaceContext'
import * as propertyService from '../../services/propertyService'
import { PHOTO_CATEGORIES } from '../../data/properties'
import { PHOTO } from '../../assets/images'

/** A stand-in for a real uploader — picking from a stock set instead. */
const LIBRARY = [
  { image: PHOTO.houseWhite, label: 'Exterior' },
  { image: PHOTO.interiorLiving, label: 'Living room' },
  { image: PHOTO.interiorKitchen, label: 'Kitchen' },
  { image: PHOTO.interiorBedroom, label: 'Bedroom' },
  { image: PHOTO.poolDeck, label: 'Pool' },
  { image: PHOTO.duneWalkover, label: 'Beach access' },
  { image: PHOTO.houseModern, label: 'Exterior' },
  { image: PHOTO.coastalTown, label: 'Neighbourhood' },
]

export default function PropertyPhotos() {
  const { property } = useOutletContext()
  const { applyProperty, pushToast } = useWorkspace()

  const [filter, setFilter] = useState('All')
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState(null)
  const [confirmId, setConfirmId] = useState(null)
  const [busy, setBusy] = useState(false)
  const [pick, setPick] = useState({ image: LIBRARY[0].image, category: 'Exterior', caption: '' })

  const photos = property.photos ?? []
  const visible = filter === 'All' ? photos : photos.filter((photo) => photo.category === filter)

  const run = async (work, success) => {
    setBusy(true)
    try {
      applyProperty(await work())
      if (success) pushToast({ tone: 'success', title: success })
    } catch (error) {
      pushToast({ tone: 'error', title: 'That did not work', message: error.message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Panel
        title="Photos"
        subtitle="The first thing a guest sees when they open their stay."
        action={
          <Button size="sm" icon="plus" onClick={() => setAdding(true)}>
            Add photo
          </Button>
        }
      >
        {photos.length === 0 ? (
          <EmptyState
            icon="image"
            title="No photos yet"
            message="Add at least three — the exterior so guests recognise the house when they pull up, and a couple of interiors."
            actionLabel="Add your first photo"
            onAction={() => setAdding(true)}
          />
        ) : (
          <>
            <FilterChips
              options={['All', ...PHOTO_CATEGORIES]}
              value={filter}
              onChange={setFilter}
              label="Filter photos by room"
              wrap
            />

            <div className="photo-grid" style={{ marginTop: 'var(--sp-4)' }}>
              {visible.map((photo, index) => (
                <figure className="photo-tile" key={photo.id} style={{ margin: 0 }}>
                  {photo.cover && (
                    <span className="photo-tile__cover">
                      <Badge tone="dark">Cover</Badge>
                    </span>
                  )}
                  <SmartImage
                    photoId={photo.image}
                    alt={photo.caption || `${photo.category} photo`}
                    ratio="4x3"
                    width={480}
                  />
                  <figcaption className="photo-tile__bar">
                    <span className="photo-tile__caption">{photo.caption || photo.category}</span>
                    <button
                      type="button"
                      className="photo-tile__mini"
                      onClick={() => run(() => propertyService.movePhoto(property.id, photo.id, -1))}
                      disabled={index === 0}
                      aria-label={`Move ${photo.caption || photo.category} earlier`}
                    >
                      <Icon name="chevronUp" />
                    </button>
                    <button
                      type="button"
                      className="photo-tile__mini"
                      onClick={() => run(() => propertyService.movePhoto(property.id, photo.id, 1))}
                      disabled={index === visible.length - 1}
                      aria-label={`Move ${photo.caption || photo.category} later`}
                    >
                      <Icon name="chevronDown" />
                    </button>
                    <button
                      type="button"
                      className="photo-tile__mini"
                      onClick={() => setEditing({ ...photo })}
                      aria-label={`Edit ${photo.caption || photo.category}`}
                    >
                      <Icon name="edit" />
                    </button>
                    <button
                      type="button"
                      className="photo-tile__mini"
                      onClick={() => setConfirmId(photo.id)}
                      aria-label={`Remove ${photo.caption || photo.category}`}
                    >
                      <Icon name="trash" />
                    </button>
                  </figcaption>
                </figure>
              ))}
            </div>

            {visible.length === 0 && (
              <EmptyState
                icon="image"
                title={`No ${filter.toLowerCase()} photos`}
                message="Try another category, or add one."
                plain
              />
            )}
          </>
        )}
      </Panel>

      {/* ------------------------------ Add ------------------------------ */}
      <Modal
        open={adding}
        onClose={() => setAdding(false)}
        title="Add a photo"
        subtitle="Uploads are mocked in this prototype — choose from the sample library."
        wide
        footer={
          <>
            <Button variant="secondary" onClick={() => setAdding(false)} disabled={busy}>
              Cancel
            </Button>
            <Button
              loading={busy}
              onClick={async () => {
                await run(() => propertyService.addPhoto(property.id, pick), 'Photo added')
                setAdding(false)
              }}
            >
              Add photo
            </Button>
          </>
        }
      >
        <div className="hstack" style={{ gap: 'var(--sp-4)' }}>
          <label className="upload" style={{ cursor: 'default' }}>
            <Icon name="upload" />
            <span>Drag a file here, or choose one below</span>
            <span className="u-xs u-muted">
              Real uploads arrive with the backend. Pick a sample to see the flow.
            </span>
          </label>

          <div className="photo-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))' }}>
            {LIBRARY.map((item, i) => (
              <button
                key={`${item.image}-${i}`}
                type="button"
                className="photo-tile"
                aria-pressed={pick.image === item.image}
                style={{
                  borderColor: pick.image === item.image ? 'var(--sea-500)' : undefined,
                  boxShadow: pick.image === item.image ? '0 0 0 2px var(--sea-500) inset' : undefined,
                }}
                onClick={() => setPick((p) => ({ ...p, image: item.image }))}
              >
                <SmartImage photoId={item.image} alt={item.label} ratio="4x3" width={220} />
              </button>
            ))}
          </div>

          <div className="field-row field-row--2">
            <Field label="Category">
              {(props) => (
                <Select
                  {...props}
                  value={pick.category}
                  onChange={(e) => setPick((p) => ({ ...p, category: e.target.value }))}
                >
                  {PHOTO_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label="Caption" hint="Optional">
              {(props) => (
                <Input
                  {...props}
                  value={pick.caption}
                  placeholder="Front elevation from the square"
                  onChange={(e) => setPick((p) => ({ ...p, caption: e.target.value }))}
                />
              )}
            </Field>
          </div>
        </div>
      </Modal>

      {/* ------------------------------ Edit ----------------------------- */}
      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Edit photo"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)} disabled={busy}>
              Cancel
            </Button>
            {!editing?.cover && (
              <Button
                variant="secondary"
                loading={busy}
                onClick={async () => {
                  await run(() => propertyService.setCoverPhoto(property.id, editing.id), 'Cover photo updated')
                  setEditing(null)
                }}
              >
                Make cover
              </Button>
            )}
            <Button
              loading={busy}
              onClick={async () => {
                await run(
                  () =>
                    propertyService.updatePhoto(property.id, editing.id, {
                      category: editing.category,
                      caption: editing.caption,
                    }),
                  'Photo updated',
                )
                setEditing(null)
              }}
            >
              Save
            </Button>
          </>
        }
      >
        {editing && (
          <div className="hstack" style={{ gap: 'var(--sp-4)' }}>
            <SmartImage
              photoId={editing.image}
              alt=""
              ratio="4x3"
              width={520}
              className="photo-tile"
            />
            <Field label="Category">
              {(props) => (
                <Select
                  {...props}
                  value={editing.category}
                  onChange={(e) => setEditing((p) => ({ ...p, category: e.target.value }))}
                >
                  {PHOTO_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label="Caption">
              {(props) => (
                <Input
                  {...props}
                  value={editing.caption}
                  onChange={(e) => setEditing((p) => ({ ...p, caption: e.target.value }))}
                />
              )}
            </Field>
          </div>
        )}
      </Modal>

      <ConfirmModal
        open={!!confirmId}
        onClose={() => setConfirmId(null)}
        onConfirm={async () => {
          await run(() => propertyService.removePhoto(property.id, confirmId), 'Photo removed')
          setConfirmId(null)
        }}
        loading={busy}
        title="Remove this photo?"
        message="It will no longer appear in your guest experience. If it is the cover photo, the next one takes its place."
        confirmLabel="Remove photo"
        tone="danger"
      />
    </>
  )
}
