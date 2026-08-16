import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader, { StickyBar } from '../components/ui/PageHeader'
import Icon from '../components/ui/Icon'
import Button from '../components/ui/Button'
import SmartImage from '../components/ui/SmartImage'
import { Field, Input, Textarea, OptionGrid, Checkbox } from '../components/ui/Form'
import { DefinitionList, Callout } from '../components/ui/Display'
import { SuccessState } from '../components/ui/States'
import { useApp } from '../context/AppContext'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import * as api from '../services/mockApi'
import { track, ANALYTICS_EVENTS } from '../services/analytics'
import { GROCERY_STORES, GROCERY_TEMPLATES } from '../data/mockCategories'
import { formatCurrency, formatLongDate, cx } from '../utils/format'

const WINDOWS = [
  { value: '8:00 AM – 10:00 AM', label: 'Early morning', sub: '8 – 10 AM' },
  { value: '10:00 AM – 12:00 PM', label: 'Late morning', sub: '10 AM – 12 PM' },
  { value: '12:00 PM – 2:00 PM', label: 'Midday', sub: '12 – 2 PM' },
  { value: '2:00 PM – 4:00 PM', label: 'Before check-in', sub: '2 – 4 PM' },
  { value: '4:00 PM – 6:00 PM', label: 'Late afternoon', sub: '4 – 6 PM' },
  { value: '6:00 PM – 8:00 PM', label: 'Evening', sub: '6 – 8 PM' },
]

const STEPS = ['When', 'Store', 'Your list', 'Review']

const SERVICE_FEE = 39
const DELIVERY_FEE = 15

/**
 * Grocery request wizard.
 *
 * Deliberately no payment step: the guest submits a request, our team confirms
 * and prices it, and only then is payment collected. That sequencing is the
 * whole reason the request/confirm/pay states exist.
 */
export default function GroceryNew() {
  const navigate = useNavigate()
  const { guest, property, pushToast } = useApp()
  useDocumentTitle('New grocery request')

  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [created, setCreated] = useState(null)
  const [errors, setErrors] = useState({})

  const [form, setForm] = useState({
    deliveryDate: guest?.stay?.checkInDate ?? '',
    deliveryWindow: '2:00 PM – 4:00 PM',
    store: 'Publix',
    items: '',
    notes: '',
    estimatedTotal: 250,
    attachment: null,
    terms: false,
  })

  useEffect(() => {
    track(ANALYTICS_EVENTS.GROCERY_REQUEST_STARTED, { guestId: guest?.id })
  }, [guest?.id])

  const set = (patch) => setForm((f) => ({ ...f, ...patch }))

  const itemCount = useMemo(
    () => form.items.split('\n').map((s) => s.trim()).filter(Boolean).length,
    [form.items],
  )

  const validate = (index) => {
    const next = {}
    if (index === 0) {
      if (!form.deliveryDate) next.deliveryDate = 'Choose a delivery date.'
      else if (guest?.stay && form.deliveryDate < guest.stay.checkInDate) {
        next.deliveryDate = `Delivery can start from your check-in date (${formatLongDate(guest.stay.checkInDate)}).`
      } else if (guest?.stay && form.deliveryDate > guest.stay.checkOutDate) {
        next.deliveryDate = 'That date is after your check-out.'
      }
      if (!form.deliveryWindow) next.deliveryWindow = 'Choose a delivery window.'
    }
    if (index === 2) {
      if (itemCount === 0 && !form.attachment)
        next.items = 'Add at least one item, or attach a photo of your list.'
    }
    if (index === 3 && !form.terms) next.terms = 'Please accept the cancellation terms.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const next = () => {
    if (!validate(step)) return
    setStep((s) => Math.min(STEPS.length - 1, s + 1))
  }

  const back = () => {
    if (step === 0) navigate('/groceries')
    else setStep((s) => s - 1)
  }

  const submit = async () => {
    if (!validate(3)) return
    setSubmitting(true)
    try {
      const order = await api.createGroceryRequest({
        guestId: guest?.id,
        propertyId: property?.id,
        deliveryDate: form.deliveryDate,
        deliveryWindow: form.deliveryWindow,
        store: form.store,
        items: form.items,
        notes: form.notes,
        estimatedTotal: Number(form.estimatedTotal) || null,
        attachments: form.attachment ? [form.attachment] : [],
        cancellationAccepted: form.terms,
      })
      setCreated(order)
      pushToast({
        tone: 'success',
        title: 'Request submitted',
        message: `${order.id} is pending review.`,
      })
    } catch (error) {
      pushToast({ tone: 'error', title: 'We could not submit that', message: error.message })
    } finally {
      setSubmitting(false)
    }
  }

  /* ----------------------------- Success view ---------------------------- */
  if (created) {
    return (
      <div className="page">
        <PageHeader title="Request submitted" back backTo="/groceries" />
        <SuccessState
          title={`Grocery request ${created.id}`}
          message="Our concierge team is reviewing your list now. We usually confirm within an hour, and you’ll be asked to pay once the total is known."
        >
          <div className="u-row u-wrap" style={{ justifyContent: 'center', marginTop: 8 }}>
            <Button to={`/groceries/${created.id}`} iconRight="arrowRight">
              Track this request
            </Button>
            <Button variant="secondary" to="/">
              Back to home
            </Button>
          </div>
        </SuccessState>

        <div className="card card--pad section">
          <h2 style={{ fontSize: '1.05rem', marginBottom: 10 }}>What happens next</h2>
          <ol className="steps-list">
            <li>We review your list and confirm the store and window.</li>
            <li>You’ll get a payment link once the estimated total is set.</li>
            <li>Your shopper texts about substitutions while they shop.</li>
            <li>Everything is put away — cold items first — and you get a photo.</li>
          </ol>
        </div>
      </div>
    )
  }

  /* ------------------------------- Wizard -------------------------------- */
  return (
    <div className="page">
      <PageHeader
        title="Grocery request"
        subtitle="Four quick steps. Nothing is charged until we confirm."
        back
        backTo="/groceries"
        breadcrumbs={[
          { label: 'Services', to: '/services' },
          { label: 'Groceries', to: '/groceries' },
          { label: 'New request' },
        ]}
      />

      <ol className="wizard-steps" aria-label="Progress">
        {STEPS.map((label, i) => (
          <li
            key={label}
            className={cx(
              'wizard-step',
              i === step && 'wizard-step--active',
              i < step && 'wizard-step--done',
            )}
            aria-current={i === step ? 'step' : undefined}
          >
            <span className="wizard-step__num">
              {i < step ? <Icon name="check" style={{ width: 13, height: 13 }} /> : i + 1}
            </span>
            <span className="wizard-step__label">{label}</span>
            {i < STEPS.length - 1 && <span className="wizard-step__bar" aria-hidden="true" />}
          </li>
        ))}
      </ol>

      <div className="form-card">
        {/* ------------------------------ Step 1 ----------------------------- */}
        {step === 0 && (
          <>
            <div>
              <h2 className="form-card__title">When would you like it?</h2>
              <p className="form-card__sub">
                Most guests choose the window just before check-in so the kitchen is ready when they
                walk in.
              </p>
            </div>

            <Field label="Delivery date" required error={errors.deliveryDate}>
              {(props) => (
                <Input
                  {...props}
                  type="date"
                  value={form.deliveryDate}
                  min={guest?.stay?.checkInDate}
                  max={guest?.stay?.checkOutDate}
                  onChange={(e) => set({ deliveryDate: e.target.value })}
                />
              )}
            </Field>

            <Field label="Delivery window" required error={errors.deliveryWindow}>
              <OptionGrid
                options={WINDOWS}
                value={form.deliveryWindow}
                onChange={(value) => set({ deliveryWindow: value })}
                label="Delivery window"
              />
            </Field>

            <Callout icon="info" tone="info">
              Delivery before {property?.checkIn ?? '4:00 PM'} means we let ourselves in with your
              host’s permission and put everything away before you arrive.
            </Callout>
          </>
        )}

        {/* ------------------------------ Step 2 ----------------------------- */}
        {step === 1 && (
          <>
            <div>
              <h2 className="form-card__title">Where should we shop?</h2>
              <p className="form-card__sub">
                If you don’t mind, we’ll pick whichever store has your list in stock.
              </p>
            </div>

            <OptionGrid
              options={GROCERY_STORES.map((s) => ({ value: s.name, label: s.name, sub: s.note }))}
              value={form.store}
              onChange={(value) => set({ store: value })}
              label="Preferred store"
              columns={1}
            />

            <Field
              label="Estimated grocery budget"
              hint="Just a guide — you’re charged the actual receipt total."
            >
              {(props) => (
                <Input
                  {...props}
                  type="number"
                  min="0"
                  step="10"
                  inputMode="decimal"
                  value={form.estimatedTotal}
                  onChange={(e) => set({ estimatedTotal: e.target.value })}
                />
              )}
            </Field>
          </>
        )}

        {/* ------------------------------ Step 3 ----------------------------- */}
        {step === 2 && (
          <>
            <div>
              <h2 className="form-card__title">What do you need?</h2>
              <p className="form-card__sub">One item per line. Brands and sizes help us get it right.</p>
            </div>

            <div>
              <span className="field__label" style={{ display: 'block', marginBottom: 8 }}>
                Start from a list
              </span>
              <div className="chips chips--wrap">
                {GROCERY_TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    className="chip"
                    onClick={() =>
                      set({
                        items: form.items ? `${form.items}\n${template.items}` : template.items,
                      })
                    }
                  >
                    <Icon name="plus" style={{ width: 13, height: 13 }} />
                    {template.name}
                  </button>
                ))}
              </div>
            </div>

            <Field
              label="Your grocery list"
              required
              error={errors.items}
              hint={itemCount > 0 ? `${itemCount} items` : 'One item per line'}
            >
              {(props) => (
                <Textarea
                  {...props}
                  value={form.items}
                  rows={10}
                  placeholder={'Eggs (2 dozen)\nMilk (1 gal, 2%)\nCoffee — medium roast\nBananas'}
                  onChange={(e) => set({ items: e.target.value })}
                  style={{ minHeight: 220 }}
                />
              )}
            </Field>

            <div>
              <span className="field__label" style={{ display: 'block', marginBottom: 8 }}>
                Or attach a photo of your list
              </span>
              {form.attachment ? (
                <div className="upload-list">
                  <div className="upload-item">
                    <span className="upload-item__thumb" aria-hidden="true">
                      <SmartImage src={form.attachment.preview} alt="" ratio="1x1" width={120} />
                    </span>
                    <span className="u-grow u-truncate">{form.attachment.name}</span>
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => set({ attachment: null })}
                      aria-label="Remove attachment"
                    >
                      <Icon name="x" />
                    </button>
                  </div>
                </div>
              ) : (
                <label className="upload">
                  <Icon name="upload" />
                  <span>Tap to upload a photo or a screenshot of your list</span>
                  <span className="u-xs u-muted">JPG, PNG, or PDF · up to 10 MB</span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      set({
                        attachment: {
                          name: file.name,
                          size: file.size,
                          preview: URL.createObjectURL(file),
                        },
                      })
                    }}
                  />
                </label>
              )}
            </div>

            <Field
              label="Notes for your shopper"
              hint="Allergies, brand preferences, where to leave things"
            >
              {(props) => (
                <Textarea
                  {...props}
                  value={form.notes}
                  rows={3}
                  placeholder={
                    guest?.preferences?.dietary?.length
                      ? `e.g. ${guest.preferences.dietary.join('; ')}`
                      : 'Anything we should know?'
                  }
                  onChange={(e) => set({ notes: e.target.value })}
                />
              )}
            </Field>
          </>
        )}

        {/* ------------------------------ Step 4 ----------------------------- */}
        {step === 3 && (
          <>
            <div>
              <h2 className="form-card__title">Review your request</h2>
              <p className="form-card__sub">
                Check the details — you can still change everything before submitting.
              </p>
            </div>

            <DefinitionList
              className="review-list"
              rows={[
                { key: 'Delivery date', value: formatLongDate(form.deliveryDate) },
                { key: 'Window', value: form.deliveryWindow },
                { key: 'Store', value: form.store },
                { key: 'Items', value: `${itemCount} lines${form.attachment ? ' + photo' : ''}` },
                { key: 'Deliver to', value: property?.address ?? '' },
                form.notes ? { key: 'Notes', value: form.notes } : null,
              ]}
            />

            <div className="card card--tint card--pad">
              <DefinitionList
                rows={[
                  { key: 'Estimated groceries', value: formatCurrency(Number(form.estimatedTotal) || 0) },
                  { key: 'Service fee', value: formatCurrency(SERVICE_FEE) },
                  { key: 'Delivery fee', value: formatCurrency(DELIVERY_FEE) },
                  {
                    key: 'Estimated total',
                    value: formatCurrency((Number(form.estimatedTotal) || 0) + SERVICE_FEE + DELIVERY_FEE),
                    total: true,
                  },
                ]}
              />
              <p className="u-xs u-muted" style={{ marginTop: 8 }}>
                Groceries are charged at the actual receipt total. Nothing is taken until our team
                confirms your request.
              </p>
            </div>

            <div>
              <Checkbox checked={form.terms} onChange={(value) => set({ terms: value })}>
                I understand that once my shopper has started, this request can no longer be cancelled,
                and that I’ll be charged for the groceries purchased plus the service and delivery
                fees. Cancelling before shopping starts is free.
              </Checkbox>
              {errors.terms && (
                <span className="field__error" role="alert" style={{ paddingLeft: 12 }}>
                  <Icon name="alert" style={{ width: 13, height: 13 }} />
                  {errors.terms}
                </span>
              )}
            </div>
          </>
        )}
      </div>

      <StickyBar>
        <Button variant="secondary" onClick={back} disabled={submitting}>
          {step === 0 ? 'Cancel' : 'Back'}
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={next} iconRight="arrowRight">
            Continue
          </Button>
        ) : (
          <Button onClick={submit} loading={submitting} icon="check">
            Submit request
          </Button>
        )}
      </StickyBar>
    </div>
  )
}
