import { useCallback, useEffect, useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import Icon from '../../components/ui/Icon'
import Button, { IconButton } from '../../components/ui/Button'
import { Field, Input, Textarea, Select, Checkbox, Switch, Stepper } from '../../components/ui/Form'
import { Callout, CopyField } from '../../components/ui/Display'
import Modal, { ConfirmModal } from '../../components/ui/Modal'
import { EmptyState } from '../../components/ui/States'
import { Panel } from '../../components/HostUI'
import { SectionBar } from './PropertyLayout'
import { useWorkspace } from '../../context/WorkspaceContext'
import * as propertyService from '../../services/propertyService'
import { PROPERTY_TYPES } from '../../data/properties'

/**
 * Every property section is the same shape: take a slice of the property,
 * let the host edit a draft of it, and save the slice back. `useSection`
 * carries the dirty tracking, the save call, and the toast so the seven
 * forms below only have to describe their fields.
 */
function useSection(property, key, { validate } = {}) {
  const { applyProperty, pushToast } = useWorkspace()
  const initial = useMemo(() => JSON.parse(JSON.stringify(property[key] ?? {})), [property, key])

  const [draft, setDraft] = useState(initial)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    setDraft(initial)
    setErrors({})
  }, [initial])

  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(initial), [draft, initial])
  const set = useCallback((patch) => setDraft((current) => ({ ...current, ...patch })), [])

  const save = useCallback(async () => {
    const problems = validate ? validate(draft) : {}
    setErrors(problems)
    if (Object.keys(problems).length > 0) {
      pushToast({ tone: 'error', title: 'Check the highlighted fields' })
      return
    }
    setSaving(true)
    try {
      applyProperty(await propertyService.updateProperty(property.id, { [key]: draft }))
      pushToast({ tone: 'success', title: 'Saved', message: 'Guests see this the next time they open their link.' })
    } catch (error) {
      pushToast({ tone: 'error', title: 'We could not save that', message: error.message })
    } finally {
      setSaving(false)
    }
  }, [applyProperty, draft, key, property.id, pushToast, validate])

  return { draft, set, setDraft, dirty, saving, save, reset: () => setDraft(initial), errors }
}

const useProperty = () => useOutletContext().property

/* ======================= Property information ============================ */

export function InformationSection() {
  const property = useProperty()
  const { applyProperty, pushToast } = useWorkspace()

  const initial = useMemo(
    () => ({
      name: property.name,
      type: property.type,
      address: property.address,
      city: property.city,
      state: property.state,
      zip: property.zip,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      maxGuests: property.maxGuests,
      description: property.description,
      phone: property.phone,
      email: property.email,
    }),
    [property],
  )

  const [draft, setDraft] = useState(initial)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => setDraft(initial), [initial])
  const dirty = JSON.stringify(draft) !== JSON.stringify(initial)
  const set = (patch) => setDraft((d) => ({ ...d, ...patch }))

  const save = async () => {
    const next = {}
    if (!draft.name.trim()) next.name = 'Your guests need to know which house they are in.'
    if (!draft.address.trim()) next.address = 'Enter the street address.'
    if (!draft.city.trim()) next.city = 'Enter the city or community.'
    if (draft.zip && !/^\d{5}$/.test(draft.zip)) next.zip = 'Use a 5-digit ZIP code.'
    if (draft.email && !/^\S+@\S+\.\S+$/.test(draft.email)) next.email = 'Enter a valid email address.'
    setErrors(next)
    if (Object.keys(next).length) {
      pushToast({ tone: 'error', title: 'Check the highlighted fields' })
      return
    }

    setSaving(true)
    try {
      applyProperty(await propertyService.updateProperty(property.id, draft))
      pushToast({ tone: 'success', title: 'Property information saved' })
    } catch (error) {
      pushToast({ tone: 'error', title: 'We could not save that', message: error.message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="form-card">
        <div>
          <h2 className="form-card__title">Property information</h2>
          <p className="form-card__sub">The basics a guest sees at the top of their stay.</p>
        </div>

        <Field label="Property name" required error={errors.name}>
          {(props) => (
            <Input {...props} value={draft.name} onChange={(e) => set({ name: e.target.value })} />
          )}
        </Field>

        <div className="field-row field-row--2">
          <Field label="Property type">
            {(props) => (
              <Select {...props} value={draft.type} onChange={(e) => set({ type: e.target.value })}>
                {PROPERTY_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Maximum guests">
            <Stepper
              value={draft.maxGuests}
              onChange={(value) => set({ maxGuests: value })}
              min={1}
              max={30}
              label="maximum guests"
            />
          </Field>
        </div>

        <Field label="Street address" required error={errors.address}>
          {(props) => (
            <Input {...props} value={draft.address} onChange={(e) => set({ address: e.target.value })} />
          )}
        </Field>

        <div className="field-row field-row--3">
          <Field label="City" required error={errors.city}>
            {(props) => (
              <Input {...props} value={draft.city} onChange={(e) => set({ city: e.target.value })} />
            )}
          </Field>
          <Field label="State">
            {(props) => (
              <Input {...props} value={draft.state} maxLength={2} onChange={(e) => set({ state: e.target.value.toUpperCase() })} />
            )}
          </Field>
          <Field label="ZIP code" error={errors.zip}>
            {(props) => (
              <Input {...props} value={draft.zip} inputMode="numeric" maxLength={5} onChange={(e) => set({ zip: e.target.value })} />
            )}
          </Field>
        </div>

        <div className="field-row field-row--2">
          <Field label="Bedrooms">
            <Stepper value={draft.bedrooms} onChange={(value) => set({ bedrooms: value })} min={0} max={20} label="bedrooms" />
          </Field>
          <Field label="Bathrooms">
            {(props) => (
              <Input
                {...props}
                type="number"
                step="0.5"
                min="0"
                value={draft.bathrooms}
                onChange={(e) => set({ bathrooms: Number(e.target.value) })}
              />
            )}
          </Field>
        </div>

        <Field
          label="Description"
          hint="A sentence or two. Vitoria uses this when a guest asks about the house."
        >
          {(props) => (
            <Textarea {...props} rows={4} value={draft.description} onChange={(e) => set({ description: e.target.value })} />
          )}
        </Field>

        <div className="field-row field-row--2">
          <Field label="Property phone" hint="Shown to guests for property questions.">
            {(props) => (
              <Input {...props} type="tel" value={draft.phone} onChange={(e) => set({ phone: e.target.value })} />
            )}
          </Field>
          <Field label="Property email" error={errors.email}>
            {(props) => (
              <Input {...props} type="email" value={draft.email} onChange={(e) => set({ email: e.target.value })} />
            )}
          </Field>
        </div>
      </div>

      <SectionBar dirty={dirty} saving={saving} onSave={save} onReset={() => setDraft(initial)} />
    </>
  )
}

/* ================================= WiFi ================================== */

export function WifiSection() {
  const property = useProperty()
  const { settings } = useWorkspace()
  const [visible, setVisible] = useState(!settings.maskSecrets)

  const { draft, set, dirty, saving, save, reset, errors } = useSection(property, 'wifi', {
    validate: (value) => {
      const problems = {}
      if (!value.network?.trim()) problems.network = 'Enter the network name exactly as it appears.'
      if (!value.password?.trim()) problems.password = 'Enter the password guests should use.'
      return problems
    },
  })

  return (
    <>
      <div className="form-card">
        <div>
          <h2 className="form-card__title">WiFi</h2>
          <p className="form-card__sub">
            The single most requested piece of information in every property we run.
          </p>
        </div>

        <Callout icon="lock">
          This is private property information. It is only shown to guests who open your access link
          — never on the public 30A pages.
        </Callout>

        <Field label="Network name (SSID)" required error={errors.network}>
          {(props) => (
            <Input
              {...props}
              value={draft.network ?? ''}
              placeholder="RosemaryGuest"
              autoCapitalize="none"
              spellCheck="false"
              onChange={(e) => set({ network: e.target.value })}
            />
          )}
        </Field>

        <Field label="Password" required error={errors.password}>
          {(props) => (
            <div style={{ position: 'relative' }}>
              <Input
                {...props}
                type={visible ? 'text' : 'password'}
                value={draft.password ?? ''}
                autoCapitalize="none"
                spellCheck="false"
                autoComplete="off"
                style={{ paddingRight: 52, fontFamily: visible ? 'ui-monospace, monospace' : undefined }}
                onChange={(e) => set({ password: e.target.value })}
              />
              <button
                type="button"
                className="icon-btn"
                onClick={() => setVisible((v) => !v)}
                aria-label={visible ? 'Hide password' : 'Show password'}
                style={{ position: 'absolute', right: 2, top: 2 }}
              >
                <Icon name={visible ? 'eyeOff' : 'eye'} size={18} />
              </button>
            </div>
          )}
        </Field>

        <Field label="Notes" hint="Where the signal is strongest, how to restart the router.">
          {(props) => (
            <Textarea {...props} rows={3} value={draft.notes ?? ''} onChange={(e) => set({ notes: e.target.value })} />
          )}
        </Field>

        {property.wifi?.network && property.wifi?.password && (
          <div className="hstack" style={{ gap: 'var(--sp-2)' }}>
            <span className="field__label">What your guest sees</span>
            <CopyField label="Network" value={property.wifi.network} />
            <CopyField label="Password" value={visible ? property.wifi.password : '••••••••••••'} />
          </div>
        )}
      </div>

      <SectionBar dirty={dirty} saving={saving} onSave={save} onReset={reset} />
    </>
  )
}

/* =============================== Check-in ================================ */

export function CheckInSection() {
  const property = useProperty()
  const { draft, set, dirty, saving, save, reset, errors } = useSection(property, 'checkIn', {
    validate: (value) => {
      const problems = {}
      if (!value.time?.trim()) problems.time = 'Set a check-in time.'
      if (!value.arrival?.trim()) problems.arrival = 'Tell guests what to do when they pull up.'
      return problems
    },
  })
  const [showCode, setShowCode] = useState(false)

  return (
    <>
      <div className="form-card">
        <div>
          <h2 className="form-card__title">Check-in</h2>
          <p className="form-card__sub">
            Everything Vitoria reads back when a guest is standing outside asking how to get in.
          </p>
        </div>

        <div className="field-row field-row--2">
          <Field label="Check-in time" required error={errors.time}>
            {(props) => (
              <Input {...props} value={draft.time ?? ''} placeholder="4:00 PM" onChange={(e) => set({ time: e.target.value })} />
            )}
          </Field>
          <Field label="Lock type">
            {(props) => (
              <Select {...props} value={draft.lockType ?? ''} onChange={(e) => set({ lockType: e.target.value })}>
                {['Smart lock keypad', 'Keypad', 'Lockbox', 'Physical key', 'Front desk', 'Other'].map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </div>

        <Field label="Door or gate code" hint="Masked in this panel. Shown to guests with access.">
          {(props) => (
            <div style={{ position: 'relative' }}>
              <Input
                {...props}
                type={showCode ? 'text' : 'password'}
                value={draft.doorCode ?? ''}
                autoComplete="off"
                style={{ paddingRight: 52, letterSpacing: showCode ? '0.2em' : undefined }}
                onChange={(e) => set({ doorCode: e.target.value })}
              />
              <button
                type="button"
                className="icon-btn"
                onClick={() => setShowCode((v) => !v)}
                aria-label={showCode ? 'Hide code' : 'Show code'}
                style={{ position: 'absolute', right: 2, top: 2 }}
              >
                <Icon name={showCode ? 'eyeOff' : 'eye'} size={18} />
              </button>
            </div>
          )}
        </Field>

        <Field label="Arrival instructions" required error={errors.arrival}>
          {(props) => (
            <Textarea
              {...props}
              rows={3}
              value={draft.arrival ?? ''}
              placeholder="Where to park, which door, which gate."
              onChange={(e) => set({ arrival: e.target.value })}
            />
          )}
        </Field>

        <Field label="Entrance" hint="Which door guests should use.">
          {(props) => (
            <Input {...props} value={draft.entrance ?? ''} onChange={(e) => set({ entrance: e.target.value })} />
          )}
        </Field>

        <Field label="Keypad or lock instructions">
          {(props) => (
            <Textarea
              {...props}
              rows={3}
              value={draft.keypadInstructions ?? ''}
              placeholder="Press the star key once to wake the lock, enter the code, then press #."
              onChange={(e) => set({ keypadInstructions: e.target.value })}
            />
          )}
        </Field>

        <Field label="Lockbox details" hint="Backup access, if you have one.">
          {(props) => (
            <Input {...props} value={draft.lockbox ?? ''} onChange={(e) => set({ lockbox: e.target.value })} />
          )}
        </Field>

        <Field label="Early check-in">
          {(props) => (
            <Textarea {...props} rows={2} value={draft.earlyCheckIn ?? ''} onChange={(e) => set({ earlyCheckIn: e.target.value })} />
          )}
        </Field>

        <Field label="What to do on arrival" hint="Where the binder, passes and keys are.">
          {(props) => (
            <Textarea {...props} rows={3} value={draft.onArrival ?? ''} onChange={(e) => set({ onArrival: e.target.value })} />
          )}
        </Field>
      </div>

      <SectionBar dirty={dirty} saving={saving} onSave={save} onReset={reset} />
    </>
  )
}

/* =============================== Check-out =============================== */

export function CheckOutSection() {
  const property = useProperty()
  const { draft, set, dirty, saving, save, reset, errors } = useSection(property, 'checkOut', {
    validate: (value) => (value.time?.trim() ? {} : { time: 'Set a check-out time.' }),
  })

  const fields = [
    ['lockUp', 'Lock-up instructions', 'Which doors and gates, and anything to switch off.'],
    ['trash', 'Trash', 'Where the bins are and which day they go out.'],
    ['dishwasher', 'Dishwasher', ''],
    ['laundry', 'Laundry and towels', ''],
    ['keys', 'Keys, passes and equipment', ''],
    ['thermostat', 'Thermostat', 'What to set it to before leaving.'],
    ['notes', 'Anything else', ''],
  ]

  return (
    <>
      <div className="form-card">
        <div>
          <h2 className="form-card__title">Check-out</h2>
          <p className="form-card__sub">
            Keep it short. A list of four things gets done; a list of twelve gets skipped.
          </p>
        </div>

        <Field label="Check-out time" required error={errors.time}>
          {(props) => (
            <Input {...props} value={draft.time ?? ''} placeholder="10:00 AM" onChange={(e) => set({ time: e.target.value })} />
          )}
        </Field>

        {fields.map(([key, label, hint]) => (
          <Field key={key} label={label} hint={hint || undefined}>
            {(props) => (
              <Textarea {...props} rows={2} value={draft[key] ?? ''} onChange={(e) => set({ [key]: e.target.value })} />
            )}
          </Field>
        ))}
      </div>

      <SectionBar dirty={dirty} saving={saving} onSave={save} onReset={reset} />
    </>
  )
}

/* ============================== House rules ============================== */

export function RulesSection() {
  const property = useProperty()
  const { applyProperty, pushToast } = useWorkspace()
  const [editing, setEditing] = useState(null)
  const [confirmId, setConfirmId] = useState(null)
  const [busy, setBusy] = useState(false)

  const rules = property.rules ?? []

  const toggle = async (rule) => {
    try {
      applyProperty(await propertyService.saveRule(property.id, { ...rule, enabled: !rule.enabled }))
    } catch (error) {
      pushToast({ tone: 'error', title: 'That did not work', message: error.message })
    }
  }

  const saveRule = async () => {
    if (!editing.title.trim()) {
      pushToast({ tone: 'error', title: 'Give the rule a title' })
      return
    }
    setBusy(true)
    try {
      applyProperty(await propertyService.saveRule(property.id, editing))
      pushToast({ tone: 'success', title: editing.id ? 'Rule updated' : 'Rule added' })
      setEditing(null)
    } catch (error) {
      pushToast({ tone: 'error', title: 'That did not work', message: error.message })
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    setBusy(true)
    try {
      applyProperty(await propertyService.removeRule(property.id, confirmId))
      pushToast({ tone: 'info', title: 'Rule removed' })
    } catch (error) {
      pushToast({ tone: 'error', title: 'That did not work', message: error.message })
    } finally {
      setBusy(false)
      setConfirmId(null)
    }
  }

  return (
    <>
      <Panel
        title="House rules"
        subtitle="Turn a rule off to hide it from guests without deleting it."
        action={
          <Button size="sm" icon="plus" onClick={() => setEditing({ title: '', note: '', enabled: true })}>
            Add rule
          </Button>
        }
      >
        {rules.length === 0 ? (
          <EmptyState
            icon="shield"
            title="No house rules yet"
            message="Add the handful of things you always end up explaining. Short and specific works best."
            actionLabel="Add your first rule"
            onAction={() => setEditing({ title: '', note: '', enabled: true })}
          />
        ) : (
          <div>
            {rules.map((rule) => (
              <div key={rule.id} className={`rule-row${rule.enabled ? '' : ' rule-row--off'}`}>
                <Switch
                  checked={rule.enabled}
                  onChange={() => toggle(rule)}
                  label={`${rule.enabled ? 'Hide' : 'Show'} rule: ${rule.title}`}
                />
                <div className="rule-row__body">
                  <div className="rule-row__title">{rule.title}</div>
                  {rule.note && <div className="rule-row__note">{rule.note}</div>}
                </div>
                <IconButton icon="edit" label={`Edit ${rule.title}`} onClick={() => setEditing(rule)} />
                <IconButton icon="trash" label={`Delete ${rule.title}`} onClick={() => setConfirmId(rule.id)} />
              </div>
            ))}
          </div>
        )}
      </Panel>

      <ConfirmModal
        open={!!confirmId}
        onClose={() => setConfirmId(null)}
        onConfirm={remove}
        loading={busy}
        title="Delete this rule?"
        message="It will no longer be shown to guests or used by Vitoria."
        confirmLabel="Delete rule"
        tone="danger"
      />

      {/* A real dialog rather than ConfirmModal — form controls cannot live
          inside the confirm modal's <p>. */}
      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id ? 'Edit rule' : 'Add a house rule'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={saveRule} loading={busy}>
              {editing?.id ? 'Save rule' : 'Add rule'}
            </Button>
          </>
        }
      >
        {editing && (
          <div className="hstack" style={{ gap: 'var(--sp-4)' }}>
            <Field label="Rule" required>
              {(props) => (
                <Input
                  {...props}
                  value={editing.title}
                  placeholder="Quiet hours 10:00 PM – 8:00 AM"
                  onChange={(e) => setEditing((r) => ({ ...r, title: e.target.value }))}
                />
              )}
            </Field>
            <Field label="Why" hint="Guests follow rules they understand.">
              {(props) => (
                <Input
                  {...props}
                  value={editing.note}
                  placeholder="Rosemary Beach ordinance."
                  onChange={(e) => setEditing((r) => ({ ...r, note: e.target.value }))}
                />
              )}
            </Field>
            <Checkbox
              checked={editing.enabled}
              onChange={(value) => setEditing((r) => ({ ...r, enabled: value }))}
            >
              Show this rule to guests
            </Checkbox>
          </div>
        )}
      </Modal>
    </>
  )
}

/* ================================ Parking ================================ */

export function ParkingSection() {
  const property = useProperty()
  const { draft, set, dirty, saving, save, reset, errors } = useSection(property, 'parking', {
    validate: (value) =>
      value.available && !value.location?.trim()
        ? { location: 'Tell guests where to actually put the car.' }
        : {},
  })

  return (
    <>
      <div className="form-card">
        <div>
          <h2 className="form-card__title">Parking</h2>
          <p className="form-card__sub">
            On 30A this is the second thing guests ask and the easiest to get a ticket over.
          </p>
        </div>

        <label className="checkbox" style={{ padding: 0 }}>
          <Switch
            checked={!!draft.available}
            onChange={(value) => set({ available: value })}
            label="Parking available at this property"
          />
          <span className="checkbox__text">Parking is available at this property</span>
        </label>

        {draft.available && (
          <>
            <div className="field-row field-row--2">
              <Field label="Number of spaces">
                <Stepper
                  value={draft.spaces ?? 0}
                  onChange={(value) => set({ spaces: value })}
                  min={0}
                  max={12}
                  label="parking spaces"
                />
              </Field>
              <Field label="Location" required error={errors.location}>
                {(props) => (
                  <Input
                    {...props}
                    value={draft.location ?? ''}
                    placeholder="Private driveway"
                    onChange={(e) => set({ location: e.target.value })}
                  />
                )}
              </Field>
            </div>

            <label className="checkbox" style={{ padding: 0 }}>
              <Switch
                checked={!!draft.passRequired}
                onChange={(value) => set({ passRequired: value })}
                label="Parking pass required"
              />
              <span className="checkbox__text">A parking pass is required</span>
            </label>

            {draft.passRequired && (
              <Field label="Where the pass is and how to use it">
                {(props) => (
                  <Textarea
                    {...props}
                    rows={2}
                    value={draft.passInstructions ?? ''}
                    onChange={(e) => set({ passInstructions: e.target.value })}
                  />
                )}
              </Field>
            )}

            <Field label="Garage">
              {(props) => (
                <Input {...props} value={draft.garage ?? ''} onChange={(e) => set({ garage: e.target.value })} />
              )}
            </Field>

            <Field label="Street parking" hint="Restrictions, fines, overflow lots.">
              {(props) => (
                <Textarea {...props} rows={2} value={draft.street ?? ''} onChange={(e) => set({ street: e.target.value })} />
              )}
            </Field>

            <Field label="Special instructions">
              {(props) => (
                <Textarea {...props} rows={2} value={draft.notes ?? ''} onChange={(e) => set({ notes: e.target.value })} />
              )}
            </Field>
          </>
        )}
      </div>

      <SectionBar dirty={dirty} saving={saving} onSave={save} onReset={reset} />
    </>
  )
}

/* =============================== Emergency =============================== */

export function EmergencySection() {
  const property = useProperty()
  const { draft, set, dirty, saving, save, reset, errors } = useSection(property, 'emergency', {
    validate: (value) =>
      value.contactPhone?.trim() ? {} : { contactPhone: 'Give guests one number that always works.' },
  })

  return (
    <>
      <div className="form-card">
        <div>
          <h2 className="form-card__title">Emergency information</h2>
          <p className="form-card__sub">
            The details nobody reads until they need them in the middle of the night.
          </p>
        </div>

        <Callout icon="alert">
          Vitoria always tells guests to call 911 first for anything urgent. Everything here is what
          she gives them next.
        </Callout>

        <div className="field-row field-row--2">
          <Field label="Emergency contact name">
            {(props) => (
              <Input {...props} value={draft.contactName ?? ''} onChange={(e) => set({ contactName: e.target.value })} />
            )}
          </Field>
          <Field label="Emergency contact phone" required error={errors.contactPhone}>
            {(props) => (
              <Input {...props} type="tel" value={draft.contactPhone ?? ''} onChange={(e) => set({ contactPhone: e.target.value })} />
            )}
          </Field>
        </div>

        <div className="field-row field-row--3">
          <Field label="Property manager">
            {(props) => (
              <Input {...props} type="tel" value={draft.managerPhone ?? ''} onChange={(e) => set({ managerPhone: e.target.value })} />
            )}
          </Field>
          <Field label="Maintenance">
            {(props) => (
              <Input {...props} type="tel" value={draft.maintenancePhone ?? ''} onChange={(e) => set({ maintenancePhone: e.target.value })} />
            )}
          </Field>
          <Field label="Security / non-emergency">
            {(props) => (
              <Input {...props} type="tel" value={draft.securityPhone ?? ''} onChange={(e) => set({ securityPhone: e.target.value })} />
            )}
          </Field>
        </div>

        <Field label="Nearest hospital or urgent care">
          {(props) => (
            <Textarea {...props} rows={2} value={draft.hospital ?? ''} onChange={(e) => set({ hospital: e.target.value })} />
          )}
        </Field>

        <div className="field-row field-row--2">
          <Field label="Fire extinguisher location">
            {(props) => (
              <Input {...props} value={draft.fireExtinguisher ?? ''} onChange={(e) => set({ fireExtinguisher: e.target.value })} />
            )}
          </Field>
          <Field label="First aid kit location">
            {(props) => (
              <Input {...props} value={draft.firstAid ?? ''} onChange={(e) => set({ firstAid: e.target.value })} />
            )}
          </Field>
        </div>

        <Field label="Utility shutoffs" hint="Water, gas, breaker panel.">
          {(props) => (
            <Textarea {...props} rows={2} value={draft.utilityShutoff ?? ''} onChange={(e) => set({ utilityShutoff: e.target.value })} />
          )}
        </Field>

        <Field label="Anything else">
          {(props) => (
            <Textarea {...props} rows={2} value={draft.notes ?? ''} onChange={(e) => set({ notes: e.target.value })} />
          )}
        </Field>
      </div>

      <SectionBar dirty={dirty} saving={saving} onSave={save} onReset={reset} />
    </>
  )
}

/* ========================== Vitoria configuration ======================== */

export function VitoriaSection() {
  const property = useProperty()
  const { applyProperty, pushToast, recommendationCount } = useWorkspace()

  const initial = useMemo(
    () => ({ branding: { ...property.branding }, vitoria: { ...property.vitoria } }),
    [property],
  )
  const [draft, setDraft] = useState(initial)
  const [saving, setSaving] = useState(false)
  useEffect(() => setDraft(initial), [initial])

  const dirty = JSON.stringify(draft) !== JSON.stringify(initial)

  const save = async () => {
    setSaving(true)
    try {
      applyProperty(await propertyService.updateProperty(property.id, draft))
      pushToast({ tone: 'success', title: 'Vitoria updated', message: 'New guests hear this straight away.' })
    } catch (error) {
      pushToast({ tone: 'error', title: 'We could not save that', message: error.message })
    } finally {
      setSaving(false)
    }
  }

  const recCount = recommendationCount(property.id)

  return (
    <>
      <div className="form-card">
        <div>
          <h2 className="form-card__title">How Vitoria introduces this property</h2>
          <p className="form-card__sub">
            She already knows 30A. This is what she knows about your house.
          </p>
        </div>

        <label className="checkbox" style={{ padding: 0 }}>
          <Switch
            checked={!!draft.vitoria.enabled}
            onChange={(value) => setDraft((d) => ({ ...d, vitoria: { ...d.vitoria, enabled: value } }))}
            label="Enable Vitoria for this property"
          />
          <span className="checkbox__text">Vitoria is available to guests at this property</span>
        </label>

        <Field
          label="Welcome message"
          hint="The first thing a guest reads when they open their stay."
        >
          {(props) => (
            <Textarea
              {...props}
              rows={4}
              value={draft.branding.welcomeMessage ?? ''}
              placeholder="Welcome to Rosemary Beach House! I'm Vitoria, your local 30A concierge…"
              onChange={(e) =>
                setDraft((d) => ({ ...d, branding: { ...d.branding, welcomeMessage: e.target.value } }))
              }
            />
          )}
        </Field>

        <Field
          label="Property notes for Vitoria"
          hint="Quirks worth knowing: the pool heater, the noisy road, the tricky shower."
        >
          {(props) => (
            <Textarea
              {...props}
              rows={4}
              value={draft.vitoria.specialNotes ?? ''}
              onChange={(e) =>
                setDraft((d) => ({ ...d, vitoria: { ...d.vitoria, specialNotes: e.target.value } }))
              }
            />
          )}
        </Field>

        <label className="checkbox" style={{ padding: 0 }}>
          <Switch
            checked={!!draft.vitoria.preferredRecommendations}
            onChange={(value) =>
              setDraft((d) => ({ ...d, vitoria: { ...d.vitoria, preferredRecommendations: value } }))
            }
            label="Prefer my recommendations"
          />
          <span className="checkbox__text">
            Suggest my {recCount} local recommendation{recCount === 1 ? '' : 's'} before the general
            30A directory
          </span>
        </label>

        <label className="checkbox" style={{ padding: 0 }}>
          <Switch
            checked={!!draft.branding.showHostContact}
            onChange={(value) =>
              setDraft((d) => ({ ...d, branding: { ...d.branding, showHostContact: value } }))
            }
            label="Show host contact details"
          />
          <span className="checkbox__text">Show my contact details to guests in the app</span>
        </label>

        <Callout icon="sparkles">
          Vitoria answers from the property information you have entered. Anything she cannot answer
          shows up under Vitoria as an unanswered question — those are worth checking weekly.
        </Callout>
      </div>

      <SectionBar dirty={dirty} saving={saving} onSave={save} onReset={() => setDraft(initial)} />
    </>
  )
}
