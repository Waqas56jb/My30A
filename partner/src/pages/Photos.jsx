import { useState } from 'react'
import Icon from '../components/ui/Icon'
import Button, { IconButton } from '../components/ui/Button'
import SmartImage from '../components/ui/SmartImage'
import Modal, { ConfirmModal } from '../components/ui/Modal'
import { Badge } from '../components/ui/StatusBadge'
import { Callout } from '../components/ui/Display'
import { EmptyState } from '../components/ui/States'
import { Panel } from '../components/PartnerUI'
import { usePartner } from '../context/PartnerContext'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import * as partnerService from '../services/partnerService'
import { PHOTO_LIBRARY } from '../services/partnerService'

/**
 * Photo management.
 *
 * The copy here pushes hard on one thing: photographs of people enjoying the
 * experience out-perform photographs of the equipment. That is the difference
 * between a listing that gets tapped and one that gets scrolled past.
 */
export default function Photos() {
  const { partner, applyPartner, pushToast } = usePartner()
  const [adding, setAdding] = useState(false)
  const [logoOpen, setLogoOpen] = useState(false)
  const [confirmId, setConfirmId] = useState(null)
  const [busy, setBusy] = useState(false)
  const [pick, setPick] = useState(PHOTO_LIBRARY[0])
  useDocumentTitle('Photos')

  if (!partner) return null
  const photos = partner.photos ?? []
  const cover = photos.find((photo) => photo.cover)

  const run = async (work, success) => {
    setBusy(true)
    try {
      applyPartner(await work())
      if (success) pushToast({ tone: 'success', title: success })
    } catch (error) {
      pushToast({ tone: 'error', title: 'That did not work', message: error.message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="ppage">
      <header className="u-between u-wrap" style={{ gap: 'var(--sp-4)', marginBottom: 'var(--sp-5)' }}>
        <div>
          <h1 style={{ fontSize: 'var(--fs-h1)' }}>Photos</h1>
          <p className="u-small u-muted" style={{ marginTop: 4 }}>
            {photos.length} {photos.length === 1 ? 'photo' : 'photos'} on your listing
          </p>
        </div>
        <Button icon="plus" onClick={() => setAdding(true)}>
          Upload image
        </Button>
      </header>

      <Callout icon="camera">
        <strong style={{ display: 'block', marginBottom: 2 }}>Sell the experience, not the equipment</strong>
        People riding golf carts along 30A beat an empty cart in a car park. A group around a fire at
        sunset beats a photograph of a fire pit. Guests are choosing a holiday — show them the evening
        they are buying.
      </Callout>

      <div className="pgrid pgrid--main-aside psection">
        <Panel title="Gallery" subtitle="The first photo is your cover — reorder or change it any time" flush>
          {photos.length === 0 ? (
            <div style={{ padding: 'var(--sp-5)' }}>
              <EmptyState
                icon="image"
                title="Your experience deserves great photography"
                message="Add photos that show guests what they can experience. Listings with three or more photos get noticeably more taps through to the business."
                actionLabel="Upload your first photo"
                onAction={() => setAdding(true)}
              />
            </div>
          ) : (
            <div className="gal-grid" style={{ padding: 'var(--sp-4)' }}>
              {photos.map((photo, index) => (
                <figure className="gal-tile" key={photo.id} style={{ margin: 0 }}>
                  <span className="gal-tile__badges">
                    {photo.cover && <Badge tone="dark">Cover</Badge>}
                    {photo.featured && !photo.cover && <Badge tone="sand">Featured</Badge>}
                  </span>

                  <SmartImage photoId={photo.image} alt={photo.name} ratio="4x3" width={480} />

                  <figcaption className="gal-tile__bar">
                    <span className="gal-tile__name">{photo.name}</span>
                    <button
                      type="button"
                      className="gal-tile__mini"
                      onClick={() => run(() => partnerService.movePhoto(partner.id, photo.id, -1))}
                      disabled={index === 0}
                      aria-label={`Move ${photo.name} earlier`}
                    >
                      <Icon name="chevronUp" />
                    </button>
                    <button
                      type="button"
                      className="gal-tile__mini"
                      onClick={() => run(() => partnerService.movePhoto(partner.id, photo.id, 1))}
                      disabled={index === photos.length - 1}
                      aria-label={`Move ${photo.name} later`}
                    >
                      <Icon name="chevronDown" />
                    </button>
                    <button
                      type="button"
                      className="gal-tile__mini"
                      onClick={() => run(() => partnerService.toggleFeatured(partner.id, photo.id), 'Photo updated')}
                      aria-label={`${photo.featured ? 'Unfeature' : 'Feature'} ${photo.name}`}
                      aria-pressed={photo.featured}
                    >
                      <Icon name="star" />
                    </button>
                    {!photo.cover && (
                      <button
                        type="button"
                        className="gal-tile__mini"
                        onClick={() =>
                          run(() => partnerService.setCoverPhoto(partner.id, photo.id), 'Cover photo updated')
                        }
                        aria-label={`Set ${photo.name} as cover`}
                      >
                        <Icon name="image" />
                      </button>
                    )}
                    <button
                      type="button"
                      className="gal-tile__mini"
                      onClick={() => setConfirmId(photo.id)}
                      aria-label={`Delete ${photo.name}`}
                    >
                      <Icon name="trash" />
                    </button>
                  </figcaption>
                </figure>
              ))}
            </div>
          )}
        </Panel>

        <div className="pstack" style={{ gap: 'var(--sp-4)' }}>
          <Panel title="Logo">
            {partner.logo ? (
              <SmartImage
                photoId={partner.logo}
                alt={`${partner.businessName} logo`}
                ratio="1x1"
                width={280}
                style={{ borderRadius: 'var(--r-md)', maxWidth: 180 }}
              />
            ) : (
              <EmptyState icon="building" title="No logo yet" message="Optional, but it helps guests recognise you." plain />
            )}
            <Button
              size="sm"
              variant="secondary"
              block
              style={{ marginTop: 'var(--sp-3)' }}
              onClick={() => setLogoOpen(true)}
              icon="upload"
            >
              {partner.logo ? 'Change logo' : 'Add a logo'}
            </Button>
          </Panel>

          <Panel title="Cover photo" subtitle="The first thing a guest sees">
            {cover ? (
              <SmartImage photoId={cover.image} alt={cover.name} ratio="16x9" width={400} style={{ borderRadius: 'var(--r-md)' }} />
            ) : (
              <EmptyState icon="image" title="No cover chosen" message="Add a photo and it becomes your cover." plain />
            )}
          </Panel>

          <Panel title="What works">
            <ul className="track-list track-list--yes">
              {[
                'People actually enjoying it',
                'Golden hour and sunset light',
                'Wide shots that show where you are',
                'Families and groups, not empty gear',
              ].map((item) => (
                <li key={item}>
                  <Icon name="checkCircle" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <ul className="track-list track-list--no" style={{ marginTop: 'var(--sp-4)' }}>
              {['Equipment in a car park', 'Screenshots and flyers', 'Dark or blurry phone photos'].map((item) => (
                <li key={item}>
                  <Icon name="minus" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>

      {/* ------------------------------- Add photo ------------------------------ */}
      <Modal
        open={adding}
        onClose={() => setAdding(false)}
        wide
        title="Upload image"
        subtitle="Uploads are mocked in this prototype — choose from the sample library."
        footer={
          <>
            <Button variant="secondary" onClick={() => setAdding(false)} disabled={busy}>
              Cancel
            </Button>
            <Button
              loading={busy}
              onClick={async () => {
                await run(
                  () => partnerService.addPhoto(partner.id, { image: pick.image, name: pick.name, category: pick.category }),
                  'Photo added',
                )
                setAdding(false)
              }}
            >
              Add photo
            </Button>
          </>
        }
      >
        <div className="pstack" style={{ gap: 'var(--sp-4)' }}>
          <label className="upload" style={{ cursor: 'default' }}>
            <Icon name="upload" />
            <span>Drag a file here, or choose one below</span>
            <span className="u-xs u-muted">JPG or PNG · up to 10 MB · real uploads arrive with the backend</span>
          </label>

          <div className="gal-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))' }}>
            {PHOTO_LIBRARY.map((item) => (
              <button
                key={item.image}
                type="button"
                className="gal-tile"
                aria-pressed={pick.image === item.image}
                aria-label={`Choose ${item.name}`}
                style={{
                  borderColor: pick.image === item.image ? 'var(--sea-500)' : undefined,
                  boxShadow: pick.image === item.image ? '0 0 0 2px var(--sea-500) inset' : undefined,
                }}
                onClick={() => setPick(item)}
              >
                <SmartImage photoId={item.image} alt={item.name} ratio="4x3" width={260} />
                <span className="gal-tile__bar">
                  <span className="gal-tile__name">{item.name}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </Modal>

      {/* --------------------------------- Logo -------------------------------- */}
      <Modal
        open={logoOpen}
        onClose={() => setLogoOpen(false)}
        title="Choose a logo"
        subtitle="Square images work best."
        footer={
          <Button variant="secondary" onClick={() => setLogoOpen(false)}>
            Close
          </Button>
        }
      >
        <div className="gal-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))' }}>
          {PHOTO_LIBRARY.map((item) => (
            <button
              key={item.image}
              type="button"
              className="gal-tile"
              aria-label={`Use ${item.name} as logo`}
              onClick={async () => {
                await run(() => partnerService.setLogo(partner.id, item.image), 'Logo updated')
                setLogoOpen(false)
              }}
            >
              <SmartImage photoId={item.image} alt={item.name} ratio="1x1" width={220} />
            </button>
          ))}
        </div>
      </Modal>

      <ConfirmModal
        open={!!confirmId}
        onClose={() => setConfirmId(null)}
        onConfirm={async () => {
          await run(() => partnerService.removePhoto(partner.id, confirmId), 'Photo removed')
          setConfirmId(null)
        }}
        loading={busy}
        title="Delete this photo?"
        message="It will be removed from your listing. If it is the cover photo, the next one takes its place."
        confirmLabel="Delete photo"
        tone="danger"
      />

      <div style={{ height: 'var(--sp-7)' }} />
    </div>
  )
}
