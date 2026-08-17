import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../components/ui/Icon'
import Button, { IconButton } from '../components/ui/Button'
import SmartImage from '../components/ui/SmartImage'
import { Field, Input, Textarea, Select, Stepper } from '../components/ui/Form'
import { Callout } from '../components/ui/Display'
import { useWorkspace } from '../context/WorkspaceContext'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import * as propertyService from '../services/propertyService'
import { PROPERTY_TYPES } from '../data/properties'
import { PHOTO } from '../assets/images'

const COVERS = [PHOTO.houseWhite, PHOTO.houseModern, PHOTO.coastalTown, PHOTO.interiorLiving]

/**
 * Add-property form. Deliberately short: name, type, address, size. Everything
 * else is a section the host fills in afterwards from the setup checklist,
 * which is far less daunting than a twenty-field wall on day one.
 */
export default function PropertyNew() {
  const navigate = useNavigate()
  const { setActivePropertyId, loadProperties, pushToast } = useWorkspace()
  useDocumentTitle('Add a property')

  const [form, setForm] = useState({
    name: '',
    type: 'Beach House',
    address: '',
    city: '',
    state: 'FL',
    zip: '',
    bedrooms: 3,
    bathrooms: 2,
    maxGuests: 6,
    description: '',
    checkInTime: '4:00 PM',
    checkOutTime: '10:00 AM',
    coverImage: COVERS[0],
  })
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)

  const set = (patch) => setForm((f) => ({ ...f, ...patch }))

  const submit = async (event) => {
    event.preventDefault()
    const next = {}
    if (!form.name.trim()) next.name = 'Give the property a name your guests will recognise.'
    if (!form.address.trim()) next.address = 'Enter the street address.'
    if (!form.city.trim()) next.city = 'Enter the city or community.'
    if (form.zip && !/^\d{5}$/.test(form.zip)) next.zip = 'Use a 5-digit ZIP code.'
    setErrors(next)
    if (Object.keys(next).length) return

    setBusy(true)
    try {
      const property = await propertyService.createProperty(form)
      await loadProperties()
      setActivePropertyId(property.id)
      pushToast({
        tone: 'success',
        title: 'Property created',
        message: 'Next: WiFi and check-in, then you can publish.',
      })
      navigate(`/host/properties/${property.id}`)
    } catch (error) {
      pushToast({ tone: 'error', title: 'We could not create that', message: error.message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="hpage" style={{ maxWidth: 820 }}>
      <div className="u-row" style={{ marginBottom: 'var(--sp-3)' }}>
        <IconButton icon="arrowLeft" label="Back to properties" onClick={() => navigate('/host/properties')} />
        <span className="u-xs u-muted">All properties</span>
      </div>

      <header style={{ marginBottom: 'var(--sp-5)' }}>
        <h1 style={{ fontSize: 'var(--fs-h1)' }}>Add a property</h1>
        <p className="u-small u-muted" style={{ marginTop: 6, maxWidth: '56ch' }}>
          Just the basics for now. WiFi, check-in, rules and the rest come next, and the setup
          checklist keeps track of what is left.
        </p>
      </header>

      <form onSubmit={submit} noValidate>
        <div className="form-card">
          <Field label="Property name" required error={errors.name}>
            {(props) => (
              <Input
                {...props}
                value={form.name}
                placeholder="Rosemary Beach House"
                onChange={(e) => set({ name: e.target.value })}
              />
            )}
          </Field>

          <Field label="Property type">
            {(props) => (
              <Select {...props} value={form.type} onChange={(e) => set({ type: e.target.value })}>
                {PROPERTY_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </Select>
            )}
          </Field>

          <Field label="Street address" required error={errors.address}>
            {(props) => (
              <Input
                {...props}
                value={form.address}
                placeholder="148 Barrett Square"
                onChange={(e) => set({ address: e.target.value })}
              />
            )}
          </Field>

          <div className="field-row field-row--3">
            <Field label="City" required error={errors.city}>
              {(props) => (
                <Input
                  {...props}
                  value={form.city}
                  placeholder="Rosemary Beach"
                  onChange={(e) => set({ city: e.target.value })}
                />
              )}
            </Field>
            <Field label="State">
              {(props) => (
                <Input
                  {...props}
                  value={form.state}
                  maxLength={2}
                  onChange={(e) => set({ state: e.target.value.toUpperCase() })}
                />
              )}
            </Field>
            <Field label="ZIP code" error={errors.zip}>
              {(props) => (
                <Input
                  {...props}
                  value={form.zip}
                  inputMode="numeric"
                  maxLength={5}
                  onChange={(e) => set({ zip: e.target.value })}
                />
              )}
            </Field>
          </div>

          <div className="field-row field-row--3">
            <Field label="Bedrooms">
              <Stepper value={form.bedrooms} onChange={(value) => set({ bedrooms: value })} min={0} max={20} label="bedrooms" />
            </Field>
            <Field label="Bathrooms">
              {(props) => (
                <Input
                  {...props}
                  type="number"
                  step="0.5"
                  min="0"
                  value={form.bathrooms}
                  onChange={(e) => set({ bathrooms: Number(e.target.value) })}
                />
              )}
            </Field>
            <Field label="Maximum guests">
              <Stepper value={form.maxGuests} onChange={(value) => set({ maxGuests: value })} min={1} max={30} label="maximum guests" />
            </Field>
          </div>

          <div className="field-row field-row--2">
            <Field label="Check-in time">
              {(props) => (
                <Input {...props} value={form.checkInTime} onChange={(e) => set({ checkInTime: e.target.value })} />
              )}
            </Field>
            <Field label="Check-out time">
              {(props) => (
                <Input {...props} value={form.checkOutTime} onChange={(e) => set({ checkOutTime: e.target.value })} />
              )}
            </Field>
          </div>

          <Field label="Description" hint="Optional now — Vitoria uses it when guests ask about the house.">
            {(props) => (
              <Textarea {...props} rows={3} value={form.description} onChange={(e) => set({ description: e.target.value })} />
            )}
          </Field>

          <div>
            <span className="field__label" style={{ display: 'block', marginBottom: 8 }}>
              Cover photo
            </span>
            <p className="field__hint" style={{ marginBottom: 8 }}>
              Uploads are mocked in this prototype — pick a placeholder and swap it later.
            </p>
            <div className="photo-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))' }}>
              {COVERS.map((image) => (
                <button
                  key={image}
                  type="button"
                  className="photo-tile"
                  aria-pressed={form.coverImage === image}
                  aria-label="Choose this cover photo"
                  style={{
                    borderColor: form.coverImage === image ? 'var(--sea-500)' : undefined,
                    boxShadow: form.coverImage === image ? '0 0 0 2px var(--sea-500) inset' : undefined,
                  }}
                  onClick={() => set({ coverImage: image })}
                >
                  <SmartImage photoId={image} alt="" ratio="4x3" width={240} />
                </button>
              ))}
            </div>
          </div>

          <Callout icon="info">
            New properties start as a <strong>draft</strong>. Guests cannot open anything until you
            publish, so take your time with the details.
          </Callout>
        </div>

        <div className="formbar">
          <span className="formbar__note">
            <Icon name="lock" size={13} style={{ verticalAlign: '-2px', marginRight: 4 }} />
            Property details are private to you and your guests.
          </span>
          <Button variant="ghost" type="button" onClick={() => navigate('/host/properties')} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" loading={busy} icon="plus">
            Create property
          </Button>
        </div>
      </form>

      <div style={{ height: 'var(--sp-7)' }} />
    </div>
  )
}
