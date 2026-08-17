import { useEffect, useMemo, useState } from 'react'
import Icon from '../components/ui/Icon'
import Button from '../components/ui/Button'
import { Field, Input, Textarea, Select, Checkbox } from '../components/ui/Form'
import { Callout } from '../components/ui/Display'
import { Panel, StatusPill } from '../components/PartnerUI'
import ListingPreview from '../components/ListingPreview'
import { usePartner } from '../context/PartnerContext'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import * as partnerService from '../services/partnerService'
import { PARTNER_CATEGORIES } from '../data/partners'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

/**
 * Business profile.
 *
 * Pricing is deliberately optional — a partner who does not want to publish a
 * rate gets "Contact for pricing" on their listing rather than being forced to
 * invent a number.
 */
export default function Profile() {
  const { partner, applyPartner, pushToast } = usePartner()
  useDocumentTitle('My profile')

  const initial = useMemo(
    () =>
      partner
        ? {
            businessName: partner.businessName,
            category: partner.category,
            description: partner.description,
            phone: partner.phone,
            email: partner.email,
            website: partner.website,
            address: partner.address,
            city: partner.city,
            state: partner.state,
            zip: partner.zip,
            serviceArea: partner.serviceArea,
            startingPrice: partner.startingPrice ?? '',
            priceLabel: partner.priceLabel ?? '',
            showPricing: !!partner.showPricing,
            instagram: partner.instagram ?? '',
            facebook: partner.facebook ?? '',
            hours: { ...(partner.hours ?? {}) },
          }
        : null,
    [partner],
  )

  const [draft, setDraft] = useState(initial)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => setDraft(initial), [initial])

  if (!partner || !draft) return null

  const dirty = JSON.stringify(draft) !== JSON.stringify(initial)
  const set = (patch) => setDraft((d) => ({ ...d, ...patch }))

  const save = async () => {
    const next = {}
    if (!draft.businessName.trim()) next.businessName = 'Guests need to know what to search for.'
    if (draft.description.trim().length < 60)
      next.description = 'Give guests a couple of sentences about the experience.'
    if (!draft.phone.trim()) next.phone = 'Guests tap this to call you.'
    if (!/^\S+@\S+\.\S+$/.test(draft.email)) next.email = 'Enter a valid email address.'
    if (draft.website && !/^https?:\/\/.+/.test(draft.website))
      next.website = 'Start the address with http:// or https://'
    if (draft.zip && !/^\d{5}$/.test(draft.zip)) next.zip = 'Use a 5-digit ZIP code.'
    if (draft.showPricing && !draft.startingPrice)
      next.startingPrice = 'Add a price, or switch pricing off to show “Contact for pricing”.'
    setErrors(next)
    if (Object.keys(next).length) {
      pushToast({ tone: 'error', title: 'Check the highlighted fields' })
      return
    }

    setSaving(true)
    try {
      applyPartner(
        await partnerService.updatePartner(partner.id, {
          ...draft,
          startingPrice: draft.startingPrice ? Number(draft.startingPrice) : null,
          shortDescription: draft.description.slice(0, 120),
        }),
      )
      pushToast({
        tone: 'success',
        title: 'Profile saved',
        message: 'Guests see this the next time they open your listing.',
      })
    } catch (error) {
      pushToast({ tone: 'error', title: 'We could not save that', message: error.message })
    } finally {
      setSaving(false)
    }
  }

  /* Preview reflects the draft, so edits are visible before saving. */
  const preview = { ...partner, ...draft, startingPrice: draft.startingPrice ? Number(draft.startingPrice) : null }

  return (
    <div className="ppage">
      <header className="u-between u-wrap" style={{ gap: 'var(--sp-4)', marginBottom: 'var(--sp-5)' }}>
        <div>
          <h1 style={{ fontSize: 'var(--fs-h1)' }}>My profile</h1>
          <p className="u-small u-muted" style={{ marginTop: 4 }}>
            Everything here is what a guest sees on your listing.
          </p>
        </div>
        <StatusPill status={partner.status} />
      </header>

      <div className="pgrid pgrid--main-aside">
        <div>
          <div className="form-card">
            <div>
              <h2 className="form-card__title">Business information</h2>
              <p className="form-card__sub">The name, category and story guests read first.</p>
            </div>

            <Field label="Business name" required error={errors.businessName}>
              {(props) => (
                <Input
                  {...props}
                  value={draft.businessName}
                  onChange={(e) => set({ businessName: e.target.value })}
                />
              )}
            </Field>

            <Field label="Category" required>
              {(props) => (
                <Select {...props} value={draft.category} onChange={(e) => set({ category: e.target.value })}>
                  {PARTNER_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </Select>
              )}
            </Field>

            <Field
              label="Description"
              required
              error={errors.description}
              hint="Describe the experience, not the equipment. This is what sells the tap."
            >
              {(props) => (
                <Textarea
                  {...props}
                  rows={6}
                  value={draft.description}
                  onChange={(e) => set({ description: e.target.value })}
                />
              )}
            </Field>

            <div className="field-row field-row--2">
              <Field label="Phone" required error={errors.phone}>
                {(props) => (
                  <Input {...props} type="tel" value={draft.phone} onChange={(e) => set({ phone: e.target.value })} />
                )}
              </Field>
              <Field label="Email" required error={errors.email}>
                {(props) => (
                  <Input {...props} type="email" value={draft.email} onChange={(e) => set({ email: e.target.value })} />
                )}
              </Field>
            </div>

            <Field label="Website" error={errors.website} hint="The most-tapped button on your listing.">
              {(props) => (
                <Input {...props} value={draft.website} placeholder="https://" onChange={(e) => set({ website: e.target.value })} />
              )}
            </Field>

            <Field label="Address">
              {(props) => (
                <Input {...props} value={draft.address} onChange={(e) => set({ address: e.target.value })} />
              )}
            </Field>

            <div className="field-row field-row--3">
              <Field label="City">
                {(props) => <Input {...props} value={draft.city} onChange={(e) => set({ city: e.target.value })} />}
              </Field>
              <Field label="State">
                {(props) => (
                  <Input
                    {...props}
                    value={draft.state}
                    maxLength={2}
                    onChange={(e) => set({ state: e.target.value.toUpperCase() })}
                  />
                )}
              </Field>
              <Field label="ZIP" error={errors.zip}>
                {(props) => (
                  <Input {...props} value={draft.zip} inputMode="numeric" maxLength={5} onChange={(e) => set({ zip: e.target.value })} />
                )}
              </Field>
            </div>

            <Field label="Service area" hint="If you travel to the guest, say how far.">
              {(props) => (
                <Input {...props} value={draft.serviceArea} onChange={(e) => set({ serviceArea: e.target.value })} />
              )}
            </Field>
          </div>

          {/* ------------------------------ Pricing ---------------------------- */}
          <div className="form-card psection">
            <div>
              <h2 className="form-card__title">Pricing information</h2>
              <p className="form-card__sub">
                Optional. If you would rather not publish a rate, leave it off and your listing shows
                “Contact for pricing”.
              </p>
            </div>

            <Checkbox checked={draft.showPricing} onChange={(value) => set({ showPricing: value })}>
              Show a starting price on my listing
            </Checkbox>

            {draft.showPricing && (
              <div className="field-row field-row--2">
                <Field label="Starting price" error={errors.startingPrice}>
                  {(props) => (
                    <Input
                      {...props}
                      type="number"
                      min="0"
                      inputMode="decimal"
                      value={draft.startingPrice}
                      onChange={(e) => set({ startingPrice: e.target.value })}
                    />
                  )}
                </Field>
                <Field label="Price label">
                  {(props) => (
                    <Select {...props} value={draft.priceLabel} onChange={(e) => set({ priceLabel: e.target.value })}>
                      {['per person', 'per day', 'per hour', 'per session', 'per group', 'half day'].map((label) => (
                        <option key={label} value={label}>
                          {label}
                        </option>
                      ))}
                    </Select>
                  )}
                </Field>
              </div>
            )}

            <Callout icon="info">
              Guests see this as a starting point, not a quote. The actual price is between you and
              them — My30A never processes the payment.
            </Callout>
          </div>

          {/* -------------------------------- Hours ---------------------------- */}
          <div className="form-card psection">
            <div>
              <h2 className="form-card__title">Opening hours</h2>
              <p className="form-card__sub">Leave a day blank if you are closed.</p>
            </div>

            {DAYS.map((day) => (
              <Field key={day} label={day}>
                {(props) => (
                  <Input
                    {...props}
                    value={draft.hours[day] ?? ''}
                    placeholder="9:00 AM – 6:00 PM"
                    onChange={(e) => set({ hours: { ...draft.hours, [day]: e.target.value } })}
                  />
                )}
              </Field>
            ))}
          </div>

          {/* -------------------------------- Social --------------------------- */}
          <div className="form-card psection">
            <div>
              <h2 className="form-card__title">Social</h2>
              <p className="form-card__sub">Optional — shown alongside your website.</p>
            </div>
            <div className="field-row field-row--2">
              <Field label="Instagram">
                {(props) => (
                  <Input {...props} value={draft.instagram} onChange={(e) => set({ instagram: e.target.value })} />
                )}
              </Field>
              <Field label="Facebook">
                {(props) => (
                  <Input {...props} value={draft.facebook} onChange={(e) => set({ facebook: e.target.value })} />
                )}
              </Field>
            </div>
          </div>

          <div className="formbar">
            <span className="formbar__note">
              {dirty ? 'You have unsaved changes.' : 'All changes saved.'}
            </span>
            {dirty && (
              <Button variant="ghost" onClick={() => setDraft(initial)} disabled={saving}>
                Discard
              </Button>
            )}
            <Button onClick={save} loading={saving} disabled={!dirty} icon="check">
              Save changes
            </Button>
          </div>
        </div>

        {/* ---------------------------- Live preview --------------------------- */}
        <div style={{ position: 'sticky', top: 'var(--sp-6)' }}>
          <p className="u-eyebrow" style={{ marginBottom: 'var(--sp-3)' }}>
            Live preview
          </p>
          <ListingPreview partner={preview} />
          <p className="u-xs u-muted" style={{ marginTop: 'var(--sp-3)', lineHeight: 1.6 }}>
            <Icon name="info" size={12} style={{ verticalAlign: '-2px', marginRight: 4 }} />
            Reflects your edits before you save. Photos are managed on the Photos page.
          </p>
        </div>
      </div>

      <div style={{ height: 'var(--sp-7)' }} />
    </div>
  )
}
