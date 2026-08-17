import { useEffect, useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import Icon from '../../components/ui/Icon'
import Button, { IconButton } from '../../components/ui/Button'
import SmartImage from '../../components/ui/SmartImage'
import Modal, { ConfirmModal } from '../../components/ui/Modal'
import { Field, Input, Textarea, Select, SearchBar, FilterChips, Checkbox } from '../../components/ui/Form'
import { Badge } from '../../components/ui/StatusBadge'
import { EmptyState, ErrorState } from '../../components/ui/States'
import { SkeletonGrid } from '../../components/ui/Skeleton'
import { Panel } from '../../components/HostUI'
import { useWorkspace } from '../../context/WorkspaceContext'
import { useAsync } from '../../hooks/useAsync'
import * as recommendationService from '../../services/recommendationService'
import { RECOMMENDATION_CATEGORIES } from '../../data/recommendations'
import { PHOTO } from '../../assets/images'

const IMAGE_CHOICES = [
  PHOTO.patioLights,
  PHOTO.seafoodPlate,
  PHOTO.coffeeShop,
  PHOTO.duneWalkover,
  PHOTO.bonfirePeople,
  PHOTO.farmersMarket,
  PHOTO.groceryBags,
  PHOTO.beachGrass,
]

const blank = (propertyId) => ({
  propertyId,
  name: '',
  category: 'Restaurant',
  description: '',
  hostNote: '',
  address: '',
  phone: '',
  website: '',
  image: IMAGE_CHOICES[0],
  featured: false,
})

/**
 * The host's own local picks. Vitoria weights these ahead of the general 30A
 * directory when a guest at this property asks for a recommendation.
 */
export default function PropertyRecommendations() {
  const { property } = useOutletContext()
  const { pushToast } = useWorkspace()

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [editing, setEditing] = useState(null)
  const [confirmId, setConfirmId] = useState(null)
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState({})

  const list = useAsync(
    () => recommendationService.listRecommendations({ propertyId: property.id, search, category }),
    [property.id, search, category],
  )

  useEffect(() => setErrors({}), [editing])

  const recommendations = list.data ?? []
  const featuredCount = useMemo(() => recommendations.filter((r) => r.featured).length, [recommendations])

  const save = async () => {
    const next = {}
    if (!editing.name.trim()) next.name = 'Give it a name.'
    if (!editing.hostNote.trim()) next.hostNote = 'Your note is the reason a guest trusts the pick.'
    if (editing.website && !/^https?:\/\/.+/.test(editing.website))
      next.website = 'Start the address with http:// or https://'
    setErrors(next)
    if (Object.keys(next).length) return

    setBusy(true)
    try {
      await recommendationService.saveRecommendation(editing)
      pushToast({ tone: 'success', title: editing.id ? 'Recommendation updated' : 'Recommendation added' })
      setEditing(null)
      list.reload()
    } catch (error) {
      pushToast({ tone: 'error', title: 'We could not save that', message: error.message })
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    setBusy(true)
    try {
      await recommendationService.deleteRecommendation(confirmId)
      pushToast({ tone: 'info', title: 'Recommendation removed' })
      setConfirmId(null)
      list.reload()
    } catch (error) {
      pushToast({ tone: 'error', title: 'That did not work', message: error.message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Panel
        title="Local recommendations"
        subtitle={`${recommendations.length} places · ${featuredCount} featured to guests`}
        action={
          <Button size="sm" icon="plus" onClick={() => setEditing(blank(property.id))}>
            Add place
          </Button>
        }
      >
        <div className="hrow" style={{ marginBottom: 'var(--sp-4)' }}>
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search your recommendations"
            label="Search recommendations"
            className="u-grow"
          />
        </div>

        <FilterChips
          options={['All', ...RECOMMENDATION_CATEGORIES]}
          value={category}
          onChange={setCategory}
          label="Filter by category"
          wrap
        />

        <div style={{ marginTop: 'var(--sp-4)' }}>
          {list.loading && <SkeletonGrid count={3} columns="hgrid hgrid--3" />}
          {list.error && <ErrorState error={list.error} onRetry={list.reload} />}

          {!list.loading && !list.error && recommendations.length === 0 && (
            <EmptyState
              icon="sparkles"
              title={search || category !== 'All' ? 'Nothing matched' : 'No recommendations yet'}
              message={
                search || category !== 'All'
                  ? 'Try a different search or category.'
                  : 'Add your favourite local places so Vitoria can recommend them to your guests instead of guessing.'
              }
              actionLabel="Add your first place"
              onAction={() => setEditing(blank(property.id))}
            />
          )}

          {!list.loading && recommendations.length > 0 && (
            <div className="hgrid hgrid--3">
              {recommendations.map((rec) => (
                <article className="panel" key={rec.id}>
                  <SmartImage photoId={rec.image} alt={rec.name} ratio="16x9" width={480} />
                  <div style={{ padding: 'var(--sp-4)' }}>
                    <div className="u-between" style={{ gap: 8 }}>
                      <h3 style={{ fontSize: '1.02rem', minWidth: 0 }}>{rec.name}</h3>
                      {rec.featured && <Badge tone="sand">Featured</Badge>}
                    </div>
                    <p className="u-xs u-muted" style={{ marginTop: 2 }}>
                      {rec.category}
                    </p>
                    <p className="u-small" style={{ marginTop: 8, color: 'var(--ink-600)' }}>
                      {rec.description}
                    </p>
                    <p
                      className="u-small"
                      style={{
                        marginTop: 10,
                        padding: 'var(--sp-3)',
                        borderRadius: 'var(--r-sm)',
                        background: 'var(--sand-100)',
                        color: 'var(--ink-700)',
                        fontStyle: 'italic',
                      }}
                    >
                      “{rec.hostNote}”
                    </p>
                    <div className="hrow" style={{ marginTop: 'var(--sp-3)' }}>
                      <Button size="sm" variant="secondary" icon="edit" onClick={() => setEditing({ ...rec })}>
                        Edit
                      </Button>
                      <IconButton icon="trash" label={`Delete ${rec.name}`} onClick={() => setConfirmId(rec.id)} />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </Panel>

      {/* ------------------------------ Editor ---------------------------- */}
      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        wide
        title={editing?.id ? 'Edit recommendation' : 'Add a local recommendation'}
        subtitle="Guests see these under your property, and Vitoria suggests them first."
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={save} loading={busy}>
              {editing?.id ? 'Save changes' : 'Add recommendation'}
            </Button>
          </>
        }
      >
        {editing && (
          <div className="hstack" style={{ gap: 'var(--sp-4)' }}>
            <div className="field-row field-row--2">
              <Field label="Name" required error={errors.name}>
                {(props) => (
                  <Input
                    {...props}
                    value={editing.name}
                    placeholder="The Surf Hut"
                    onChange={(e) => setEditing((r) => ({ ...r, name: e.target.value }))}
                  />
                )}
              </Field>
              <Field label="Category">
                {(props) => (
                  <Select
                    {...props}
                    value={editing.category}
                    onChange={(e) => setEditing((r) => ({ ...r, category: e.target.value }))}
                  >
                    {RECOMMENDATION_CATEGORIES.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
            </div>

            <Field label="Description" hint="What it is, in a line.">
              {(props) => (
                <Textarea
                  {...props}
                  rows={2}
                  value={editing.description}
                  onChange={(e) => setEditing((r) => ({ ...r, description: e.target.value }))}
                />
              )}
            </Field>

            <Field
              label="Your note"
              required
              error={errors.hostNote}
              hint="The insider bit — when to go, what to order, where to sit."
            >
              {(props) => (
                <Textarea
                  {...props}
                  rows={2}
                  value={editing.hostNote}
                  placeholder="Great for families and sunset dinner. Ask for a porch table."
                  onChange={(e) => setEditing((r) => ({ ...r, hostNote: e.target.value }))}
                />
              )}
            </Field>

            <Field label="Address">
              {(props) => (
                <Input
                  {...props}
                  value={editing.address}
                  onChange={(e) => setEditing((r) => ({ ...r, address: e.target.value }))}
                />
              )}
            </Field>

            <div className="field-row field-row--2">
              <Field label="Phone">
                {(props) => (
                  <Input
                    {...props}
                    type="tel"
                    value={editing.phone}
                    onChange={(e) => setEditing((r) => ({ ...r, phone: e.target.value }))}
                  />
                )}
              </Field>
              <Field label="Website" error={errors.website}>
                {(props) => (
                  <Input
                    {...props}
                    value={editing.website}
                    placeholder="https://"
                    onChange={(e) => setEditing((r) => ({ ...r, website: e.target.value }))}
                  />
                )}
              </Field>
            </div>

            <div>
              <span className="field__label" style={{ display: 'block', marginBottom: 8 }}>
                Photo
              </span>
              <div
                className="photo-grid"
                style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))' }}
              >
                {IMAGE_CHOICES.map((image) => (
                  <button
                    key={image}
                    type="button"
                    className="photo-tile"
                    aria-pressed={editing.image === image}
                    aria-label="Choose this photo"
                    style={{
                      borderColor: editing.image === image ? 'var(--sea-500)' : undefined,
                      boxShadow: editing.image === image ? '0 0 0 2px var(--sea-500) inset' : undefined,
                    }}
                    onClick={() => setEditing((r) => ({ ...r, image }))}
                  >
                    <SmartImage photoId={image} alt="" ratio="4x3" width={200} />
                  </button>
                ))}
              </div>
            </div>

            <Checkbox
              checked={editing.featured}
              onChange={(value) => setEditing((r) => ({ ...r, featured: value }))}
            >
              Feature this near the top of the guest experience
            </Checkbox>
          </div>
        )}
      </Modal>

      <ConfirmModal
        open={!!confirmId}
        onClose={() => setConfirmId(null)}
        onConfirm={remove}
        loading={busy}
        title="Remove this recommendation?"
        message="Guests will stop seeing it and Vitoria will stop suggesting it."
        confirmLabel="Remove"
        tone="danger"
      />
    </>
  )
}
