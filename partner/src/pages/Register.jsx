import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import Icon from '../components/ui/Icon'
import Button from '../components/ui/Button'
import SmartImage from '../components/ui/SmartImage'
import { Field, Input, Textarea, Select, Checkbox } from '../components/ui/Form'
import { Callout } from '../components/ui/Display'
import { SuccessState } from '../components/ui/States'
import ListingPreview from '../components/ListingPreview'
import { Panel, StatusPill, Journey } from '../components/PartnerUI'
import { usePartner } from '../context/PartnerContext'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { PARTNER_CATEGORIES } from '../data/partners'
import { PHOTO_LIBRARY } from '../services/partnerService'
import { cx } from '../utils/format'

const STEPS = [
  { key: 'business', label: 'Your business' },
  { key: 'contact', label: 'Contact & location' },
  { key: 'story', label: 'Story & pricing' },
  { key: 'photos', label: 'Photos' },
  { key: 'review', label: 'Review' },
]

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const blank = {
  businessName: '',
  ownerName: '',
  email: '',
  phone: '',
  category: 'Beach Bonfires',
  website: '',
  address: '',
  city: '',
  state: 'FL',
  zip: '',
  description: '',
  startingPrice: '',
  priceLabel: 'per person',
  instagram: '',
  facebook: '',
  logo: null,
  photos: [],
  hoursOpen: '9:00 AM',
  hoursClose: '6:00 PM',
  setHours: true,
  terms: false,
}

/**
 * Partner application.
 *
 * The live preview beside the form is the point: a partner should see the
 * listing a guest will see while they are still writing it, because that is
 * what makes them write a better one.
 */
export default function Register() {
  const navigate = useNavigate()
  const { apply, isAuthed, pushToast } = usePartner()
  useDocumentTitle('Become a partner')

  const [step, setStep] = useState(0)
  const [form, setForm] = useState(blank)
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const [created, setCreated] = useState(null)

  const set = (patch) => setForm((f) => ({ ...f, ...patch }))

  /** The preview is built from the form as it stands, not from saved data. */
  const preview = useMemo(
    () => ({
      businessName: form.businessName,
      category: form.category,
      description: form.description,
      shortDescription: form.description.slice(0, 120),
      startingPrice: form.startingPrice ? Number(form.startingPrice) : null,
      priceLabel: form.priceLabel,
      showPricing: !!form.startingPrice,
      rating: null,
      reviewCount: 0,
      address: form.address,
      city: form.city,
      state: form.state,
      zip: form.zip,
      serviceArea: form.city,
      phone: form.phone,
      website: form.website,
      services: [],
      hours: form.setHours
        ? Object.fromEntries(DAYS.map((day) => [day, `${form.hoursOpen} – ${form.hoursClose}`]))
        : {},
      photos: form.photos.map((image, i) => ({
        id: `p${i}`,
        image,
        name: `Photo ${i + 1}`,
        cover: i === 0,
      })),
    }),
    [form],
  )

  const validate = (index) => {
    const next = {}
    if (index === 0) {
      if (!form.businessName.trim()) next.businessName = 'Guests need to know what to search for.'
      if (!form.ownerName.trim()) next.ownerName = 'Who should we contact about this listing?'
    }
    if (index === 1) {
      if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Enter a valid email address.'
      if (!form.phone.trim()) next.phone = 'Guests tap this to call you — it is the whole point.'
      if (form.website && !/^https?:\/\/.+/.test(form.website))
        next.website = 'Start the address with http:// or https://'
      if (!form.city.trim()) next.city = 'Where on 30A are you based?'
      if (form.zip && !/^\d{5}$/.test(form.zip)) next.zip = 'Use a 5-digit ZIP code.'
    }
    if (index === 2) {
      if (form.description.trim().length < 60)
        next.description = 'Give guests a couple of sentences — say what the experience feels like.'
    }
    if (index === 3) {
      if (form.photos.length === 0) next.photos = 'Add at least one photo. Three is better.'
    }
    if (index === 4 && !form.terms) next.terms = 'Please accept the partner terms to submit.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const next = () => {
    if (!validate(step)) return
    setStep((s) => Math.min(STEPS.length - 1, s + 1))
  }

  const submit = async () => {
    if (!validate(4)) return
    setBusy(true)
    try {
      const partner = await apply({
        ...form,
        hours: preview.hours,
        photos: form.photos,
        logo: form.logo ?? form.photos[0] ?? null,
      })
      setCreated(partner)
      pushToast({ tone: 'success', title: 'Application submitted', message: 'We will review it shortly.' })
    } catch (error) {
      pushToast({ tone: 'error', title: 'We could not submit that', message: error.message })
    } finally {
      setBusy(false)
    }
  }

  const togglePhoto = (image) =>
    set({
      photos: form.photos.includes(image)
        ? form.photos.filter((item) => item !== image)
        : [...form.photos, image],
    })

  if (isAuthed && !created) return <Navigate to="/partner/dashboard" replace />

  /* ----------------------------- Success view ---------------------------- */
  if (created) {
    return (
      <div className="ppage ppage--narrow" style={{ paddingTop: 'var(--sp-7)' }}>
        <SuccessState
          title="Your partner profile has been submitted"
          message="Once approved, your business will become visible to guests exploring 30A."
        >
          <div className="prow" style={{ justifyContent: 'center', marginTop: 8 }}>
            <StatusPill status="pending" />
          </div>
        </SuccessState>

        <Panel title="What happens next" className="psection">
          <Journey status="pending" />
          <p className="u-small u-muted" style={{ marginTop: 'var(--sp-4)', lineHeight: 1.65 }}>
            Our local team checks every business by hand, usually within two working days. You will
            get an email the moment it goes live — and you can keep improving your listing in the
            meantime.
          </p>
        </Panel>

        <div className="prow" style={{ marginTop: 'var(--sp-5)' }}>
          <Button onClick={() => navigate('/partner/dashboard')} iconRight="arrowRight">
            Go to your dashboard
          </Button>
          <Button variant="secondary" onClick={() => navigate('/partner/photos')} icon="image">
            Add more photos
          </Button>
        </div>

        <div style={{ height: 'var(--sp-8)' }} />
      </div>
    )
  }

  /* ------------------------------- The form ------------------------------ */
  return (
    <div className="ppage" style={{ paddingTop: 'var(--sp-6)', paddingBottom: 'var(--sp-8)' }}>
      <div className="u-row" style={{ marginBottom: 'var(--sp-4)' }}>
        <Link to="/partner/login" className="u-row" style={{ gap: 8 }}>
          <Icon name="arrowLeft" size={18} />
          <span className="u-small">Back to sign in</span>
        </Link>
      </div>

      <header style={{ marginBottom: 'var(--sp-5)', maxWidth: '62ch' }}>
        <p className="u-eyebrow">My30A Partners</p>
        <h1 style={{ fontSize: 'var(--fs-h1)', marginTop: 6 }}>Bring your business to 30A</h1>
        <p className="u-small u-muted" style={{ marginTop: 8, lineHeight: 1.65 }}>
          Connect your local experience with guests looking for something unforgettable. Free to list,
          no commission on anything you book — guests contact you directly.
        </p>
      </header>

      <ol className="steps" aria-label="Application progress">
        {STEPS.map((item, i) => (
          <li
            key={item.key}
            className={cx('step', i === step && 'step--active', i < step && 'step--done')}
            aria-current={i === step ? 'step' : undefined}
          >
            <span className="step__num">
              {i < step ? <Icon name="check" size={11} strokeWidth={3} /> : i + 1}
            </span>
            {item.label}
          </li>
        ))}
      </ol>

      <div className="reg">
        <div>
          <div className="form-card">
            {/* ---------------------------- Business --------------------------- */}
            {step === 0 && (
              <>
                <div>
                  <h2 className="form-card__title">Your business</h2>
                  <p className="form-card__sub">The name guests will see, and who we talk to.</p>
                </div>

                <Field label="Business name" required error={errors.businessName}>
                  {(props) => (
                    <Input
                      {...props}
                      value={form.businessName}
                      placeholder="Glow &amp; Flow 30A Beach Bonfires"
                      onChange={(e) => set({ businessName: e.target.value })}
                    />
                  )}
                </Field>

                <Field label="Category" required hint="Pick the one guests would search for.">
                  {(props) => (
                    <Select {...props} value={form.category} onChange={(e) => set({ category: e.target.value })}>
                      {PARTNER_CATEGORIES.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </Select>
                  )}
                </Field>

                <Field label="Owner or contact name" required error={errors.ownerName}>
                  {(props) => (
                    <Input
                      {...props}
                      value={form.ownerName}
                      autoComplete="name"
                      onChange={(e) => set({ ownerName: e.target.value })}
                    />
                  )}
                </Field>

                <Callout icon="info">
                  My30A is a discovery platform. We show your business to guests and send them to you —
                  we never take the booking or a cut of it.
                </Callout>
              </>
            )}

            {/* ------------------------ Contact & location --------------------- */}
            {step === 1 && (
              <>
                <div>
                  <h2 className="form-card__title">Contact &amp; location</h2>
                  <p className="form-card__sub">
                    These become the Call, Website and Directions buttons on your listing.
                  </p>
                </div>

                <div className="field-row field-row--2">
                  <Field label="Email" required error={errors.email}>
                    {(props) => (
                      <Input
                        {...props}
                        type="email"
                        value={form.email}
                        autoComplete="email"
                        onChange={(e) => set({ email: e.target.value })}
                      />
                    )}
                  </Field>
                  <Field label="Phone" required error={errors.phone}>
                    {(props) => (
                      <Input
                        {...props}
                        type="tel"
                        value={form.phone}
                        placeholder="(850) 555-0100"
                        onChange={(e) => set({ phone: e.target.value })}
                      />
                    )}
                  </Field>
                </div>

                <Field label="Website" error={errors.website} hint="Optional, but it is the most-tapped button.">
                  {(props) => (
                    <Input
                      {...props}
                      value={form.website}
                      placeholder="https://"
                      onChange={(e) => set({ website: e.target.value })}
                    />
                  )}
                </Field>

                <Field label="Business address" hint="Or your service area, if you come to the guest.">
                  {(props) => (
                    <Input {...props} value={form.address} onChange={(e) => set({ address: e.target.value })} />
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
                  <Field label="ZIP" error={errors.zip}>
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

                <div className="field-row field-row--2">
                  <Field label="Instagram" hint="Optional">
                    {(props) => (
                      <Input
                        {...props}
                        value={form.instagram}
                        placeholder="yourbusiness"
                        onChange={(e) => set({ instagram: e.target.value })}
                      />
                    )}
                  </Field>
                  <Field label="Facebook" hint="Optional">
                    {(props) => (
                      <Input
                        {...props}
                        value={form.facebook}
                        placeholder="yourbusiness"
                        onChange={(e) => set({ facebook: e.target.value })}
                      />
                    )}
                  </Field>
                </div>
              </>
            )}

            {/* --------------------------- Story & price ----------------------- */}
            {step === 2 && (
              <>
                <div>
                  <h2 className="form-card__title">Your story</h2>
                  <p className="form-card__sub">
                    Guests are picking a holiday, not comparing suppliers. Describe the evening, not
                    the equipment.
                  </p>
                </div>

                <Field
                  label="Description"
                  required
                  error={errors.description}
                  hint={`${form.description.trim().length} characters — aim for 60 or more.`}
                >
                  {(props) => (
                    <Textarea
                      {...props}
                      rows={6}
                      value={form.description}
                      placeholder="Create unforgettable evenings on the beach. We handle the permit, the wood, the chairs and the cleanup — you bring the marshmallows."
                      onChange={(e) => set({ description: e.target.value })}
                    />
                  )}
                </Field>

                <div className="field-row field-row--2">
                  <Field
                    label="Starting price"
                    hint="Optional — leave blank and your listing says “Contact for pricing”."
                  >
                    {(props) => (
                      <Input
                        {...props}
                        type="number"
                        min="0"
                        inputMode="decimal"
                        value={form.startingPrice}
                        placeholder="75"
                        onChange={(e) => set({ startingPrice: e.target.value })}
                      />
                    )}
                  </Field>
                  <Field label="Price label">
                    {(props) => (
                      <Select
                        {...props}
                        value={form.priceLabel}
                        onChange={(e) => set({ priceLabel: e.target.value })}
                      >
                        {['per person', 'per day', 'per hour', 'per session', 'per group', 'half day'].map(
                          (label) => (
                            <option key={label} value={label}>
                              {label}
                            </option>
                          ),
                        )}
                      </Select>
                    )}
                  </Field>
                </div>

                <div>
                  <Checkbox checked={form.setHours} onChange={(value) => set({ setHours: value })}>
                    Show opening hours on my listing
                  </Checkbox>
                  {form.setHours && (
                    <div className="field-row field-row--2" style={{ marginTop: 'var(--sp-3)' }}>
                      <Field label="Opens">
                        {(props) => (
                          <Input {...props} value={form.hoursOpen} onChange={(e) => set({ hoursOpen: e.target.value })} />
                        )}
                      </Field>
                      <Field label="Closes">
                        {(props) => (
                          <Input {...props} value={form.hoursClose} onChange={(e) => set({ hoursClose: e.target.value })} />
                        )}
                      </Field>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ------------------------------ Photos --------------------------- */}
            {step === 3 && (
              <>
                <div>
                  <h2 className="form-card__title">Photos</h2>
                  <p className="form-card__sub">
                    Show people enjoying what you offer, not the equipment sitting in a car park. That
                    is what makes a guest tap through.
                  </p>
                </div>

                <label className="upload" style={{ cursor: 'default' }}>
                  <Icon name="upload" />
                  <span>Drag files here, or choose from the sample library below</span>
                  <span className="u-xs u-muted">
                    Real uploads arrive with the backend. Pick a few to see how your listing looks.
                  </span>
                </label>

                {errors.photos && (
                  <span className="field__error" role="alert">
                    <Icon name="alert" size={13} />
                    {errors.photos}
                  </span>
                )}

                <div className="gal-grid">
                  {PHOTO_LIBRARY.map((item) => {
                    const chosen = form.photos.includes(item.image)
                    return (
                      <button
                        key={item.image}
                        type="button"
                        className="gal-tile"
                        aria-pressed={chosen}
                        style={{
                          borderColor: chosen ? 'var(--sea-500)' : undefined,
                          boxShadow: chosen ? '0 0 0 2px var(--sea-500) inset' : undefined,
                        }}
                        onClick={() => togglePhoto(item.image)}
                      >
                        {chosen && (
                          <span className="gal-tile__badges">
                            <span
                              style={{
                                display: 'grid',
                                placeItems: 'center',
                                width: 24,
                                height: 24,
                                borderRadius: '50%',
                                background: 'var(--sea-700)',
                                color: '#fff',
                              }}
                            >
                              <Icon name="check" size={13} strokeWidth={3} />
                            </span>
                          </span>
                        )}
                        <SmartImage photoId={item.image} alt={item.name} ratio="4x3" width={320} />
                        <span className="gal-tile__bar">
                          <span className="gal-tile__name">{item.name}</span>
                        </span>
                      </button>
                    )
                  })}
                </div>

                <p className="u-xs u-muted">
                  {form.photos.length} selected. The first one becomes your cover photo — you can
                  change that later.
                </p>
              </>
            )}

            {/* ------------------------------ Review --------------------------- */}
            {step === 4 && (
              <>
                <div>
                  <h2 className="form-card__title">Review and submit</h2>
                  <p className="form-card__sub">
                    This is exactly what a guest will see. Everything stays editable afterwards.
                  </p>
                </div>

                <div className="pstack" style={{ gap: 'var(--sp-2)' }}>
                  {[
                    ['Business', form.businessName],
                    ['Category', form.category],
                    ['Contact', form.ownerName],
                    ['Email', form.email],
                    ['Phone', form.phone],
                    ['Website', form.website || 'Not provided'],
                    ['Location', [form.city, form.state, form.zip].filter(Boolean).join(', ')],
                    [
                      'Pricing',
                      form.startingPrice ? `From $${form.startingPrice} ${form.priceLabel}` : 'Contact for pricing',
                    ],
                    ['Photos', `${form.photos.length} selected`],
                  ].map(([key, value]) => (
                    <div
                      key={key}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 'var(--sp-4)',
                        padding: 'var(--sp-3) 0',
                        borderBottom: '1px solid var(--line-soft)',
                        fontSize: 'var(--fs-sm)',
                      }}
                    >
                      <span className="u-muted">{key}</span>
                      <span style={{ fontWeight: 600, textAlign: 'right', overflowWrap: 'anywhere' }}>
                        {value || '—'}
                      </span>
                    </div>
                  ))}
                </div>

                <div>
                  <Checkbox checked={form.terms} onChange={(value) => set({ terms: value })}>
                    I confirm I am authorised to list this business, the details are accurate, and I
                    understand guests will contact me directly.
                  </Checkbox>
                  {errors.terms && (
                    <span className="field__error" role="alert" style={{ paddingLeft: 12 }}>
                      <Icon name="alert" size={13} />
                      {errors.terms}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="formbar">
            <span className="formbar__note">
              Step {step + 1} of {STEPS.length}
            </span>
            <Button
              variant="ghost"
              onClick={() => (step === 0 ? navigate('/partner/login') : setStep((s) => s - 1))}
              disabled={busy}
            >
              {step === 0 ? 'Cancel' : 'Back'}
            </Button>
            {step < STEPS.length - 1 ? (
              <Button onClick={next} iconRight="arrowRight">
                Continue
              </Button>
            ) : (
              <Button onClick={submit} loading={busy} icon="send">
                Submit for Approval
              </Button>
            )}
          </div>
        </div>

        {/* -------------------------- Live preview -------------------------- */}
        <div className="reg__preview">
          <p className="u-eyebrow" style={{ marginBottom: 'var(--sp-3)' }}>
            Live preview — what guests see
          </p>
          <ListingPreview partner={preview} />
          <p className="u-xs u-muted" style={{ marginTop: 'var(--sp-3)', lineHeight: 1.6 }}>
            <Icon name="info" size={12} style={{ verticalAlign: '-2px', marginRight: 4 }} />
            Updates as you type. The Call, Website and Directions buttons are what a guest taps — and
            what we count for you.
          </p>
        </div>
      </div>
    </div>
  )
}
