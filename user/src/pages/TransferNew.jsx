import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader, { StickyBar } from '../components/ui/PageHeader'
import Icon from '../components/ui/Icon'
import Button from '../components/ui/Button'
import { Field, Input, Textarea, OptionGrid, Stepper, Checkbox } from '../components/ui/Form'
import { DefinitionList, Callout } from '../components/ui/Display'
import { SuccessState } from '../components/ui/States'
import { useApp } from '../context/AppContext'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import * as api from '../services/mockApi'
import { track, ANALYTICS_EVENTS } from '../services/analytics'
import { AIRPORTS, VEHICLE_CLASSES } from '../data/mockCategories'
import { formatCurrency, formatLongDate } from '../utils/format'

/** Bags beyond the vehicle's comfortable capacity add a surcharge. */
const priceFor = (airportCode, vehicleId, bags) => {
  const airport = AIRPORTS.find((a) => a.code === airportCode)
  const vehicle = VEHICLE_CLASSES.find((v) => v.id === vehicleId)
  if (!airport || !vehicle) return 0
  const base = Math.round(airport.basePrice * vehicle.multiplier)
  const included = vehicle.id === 'sedan' ? 3 : vehicle.id === 'suv' ? 6 : 14
  const extraBags = Math.max(0, bags - included)
  return base + extraBags * 15
}

export default function TransferNew() {
  const navigate = useNavigate()
  const { guest, property, pushToast } = useApp()
  useDocumentTitle('Request a transfer')

  const [submitting, setSubmitting] = useState(false)
  const [created, setCreated] = useState(null)
  const [errors, setErrors] = useState({})

  const [form, setForm] = useState({
    direction: 'arrival',
    airport: 'ECP',
    date: guest?.stay?.checkInDate ?? '',
    time: '14:00',
    flightNumber: '',
    passengers: guest?.partySize ?? 2,
    bags: 4,
    vehicleClass: 'suv',
    specialRequests: guest?.preferences?.travelingWithKids
      ? 'Two booster seats please.'
      : '',
    terms: false,
  })

  useEffect(() => {
    track(ANALYTICS_EVENTS.TRANSFER_REQUEST_STARTED, { guestId: guest?.id })
  }, [guest?.id])

  const set = (patch) => setForm((f) => ({ ...f, ...patch }))

  const quotedPrice = useMemo(
    () => priceFor(form.airport, form.vehicleClass, form.bags),
    [form.airport, form.vehicleClass, form.bags],
  )

  const airport = AIRPORTS.find((a) => a.code === form.airport)
  const vehicle = VEHICLE_CLASSES.find((v) => v.id === form.vehicleClass)

  const validate = () => {
    const next = {}
    if (!form.date) next.date = 'Choose your flight date.'
    if (!form.time) next.time = 'Add your flight time.'
    if (!form.flightNumber.trim()) next.flightNumber = 'We need the flight number to track delays.'
    else if (!/^[A-Za-z]{1,3}\s?\d{1,4}$/.test(form.flightNumber.trim()))
      next.flightNumber = 'Use the airline code and number, e.g. DL 2417.'
    if (form.passengers < 1) next.passengers = 'At least one passenger.'
    if (!form.terms) next.terms = 'Please accept the transfer terms.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const submit = async () => {
    if (!validate()) return
    setSubmitting(true)
    try {
      const isArrival = form.direction === 'arrival'
      const transfer = await api.createTransferRequest({
        guestId: guest?.id,
        propertyId: property?.id,
        direction: form.direction,
        airport: form.airport,
        date: form.date,
        time: formatClock(form.time),
        flightNumber: form.flightNumber.toUpperCase(),
        passengers: form.passengers,
        bags: form.bags,
        vehicleClass: form.vehicleClass,
        pickupAddress: isArrival ? `${form.airport} · Baggage Claim` : property?.address,
        dropoffAddress: isArrival ? property?.address : `${form.airport} · Departures`,
        specialRequests: form.specialRequests,
        quotedPrice,
      })
      setCreated(transfer)
      pushToast({
        tone: 'success',
        title: 'Transfer requested',
        message: `${transfer.id} is pending confirmation.`,
      })
    } catch (error) {
      pushToast({ tone: 'error', title: 'We could not submit that', message: error.message })
    } finally {
      setSubmitting(false)
    }
  }

  if (created) {
    return (
      <div className="page">
        <PageHeader title="Transfer requested" back backTo="/transfers" />
        <SuccessState
          title={`Transfer ${created.id}`}
          message="We’re confirming a vehicle for your flight. Once a driver is reserved we’ll ask you to authorise your card — a hold, not a charge."
        >
          <div className="u-row u-wrap" style={{ justifyContent: 'center', marginTop: 8 }}>
            <Button to={`/transfers/${created.id}`} iconRight="arrowRight">
              Track this transfer
            </Button>
            <Button variant="secondary" to="/home">
              Back to home
            </Button>
          </div>
        </SuccessState>

        <div className="card card--pad section">
          <h2 style={{ fontSize: '1.05rem', marginBottom: 10 }}>What happens next</h2>
          <ol className="steps-list">
            <li>We confirm a vehicle with our transport partner.</li>
            <li>You authorise your card — nothing is charged yet.</li>
            <li>Driver details arrive 24 hours before pickup.</li>
            <li>Payment is captured after the ride, and you can add a tip.</li>
          </ol>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <PageHeader
        title="Request a transfer"
        subtitle="We’ll confirm a driver and send details before you fly."
        back
        backTo="/transfers"
        breadcrumbs={[
          { label: 'Services', to: '/services' },
          { label: 'Transfers', to: '/transfers' },
          { label: 'New request' },
        ]}
      />

      <div className="detail-layout">
        <div className="form-card">
          <Field label="Direction">
            <OptionGrid
              label="Direction"
              value={form.direction}
              onChange={(value) =>
                set({
                  direction: value,
                  date:
                    value === 'arrival'
                      ? (guest?.stay?.checkInDate ?? form.date)
                      : (guest?.stay?.checkOutDate ?? form.date),
                })
              }
              options={[
                { value: 'arrival', label: 'Airport → property', sub: 'Arriving' },
                { value: 'departure', label: 'Property → airport', sub: 'Departing' },
              ]}
            />
          </Field>

          <Field label="Airport" required>
            <OptionGrid
              label="Airport"
              value={form.airport}
              onChange={(value) => set({ airport: value })}
              columns={1}
              options={AIRPORTS.map((a) => ({
                value: a.code,
                label: `${a.code} · ${a.name}`,
                sub: `${a.city} · ${a.driveTime} drive · from ${formatCurrency(a.basePrice)}`,
              }))}
            />
          </Field>

          <div className="field-row field-row--2">
            <Field label={form.direction === 'arrival' ? 'Arrival date' : 'Departure date'} required error={errors.date}>
              {(props) => (
                <Input
                  {...props}
                  type="date"
                  value={form.date}
                  onChange={(e) => set({ date: e.target.value })}
                />
              )}
            </Field>
            <Field
              label={form.direction === 'arrival' ? 'Landing time' : 'Flight departure time'}
              required
              error={errors.time}
              hint={form.direction === 'departure' ? 'We’ll collect you 3 hours before' : undefined}
            >
              {(props) => (
                <Input
                  {...props}
                  type="time"
                  value={form.time}
                  onChange={(e) => set({ time: e.target.value })}
                />
              )}
            </Field>
          </div>

          <Field
            label="Flight number"
            required
            error={errors.flightNumber}
            hint="Your driver tracks the flight, so delays are covered."
          >
            {(props) => (
              <Input
                {...props}
                value={form.flightNumber}
                placeholder="DL 2417"
                autoCapitalize="characters"
                onChange={(e) => set({ flightNumber: e.target.value })}
              />
            )}
          </Field>

          <div className="field-row field-row--2">
            <Field label="Passengers" error={errors.passengers}>
              <Stepper
                value={form.passengers}
                onChange={(value) => set({ passengers: value })}
                min={1}
                max={14}
                label="passengers"
              />
            </Field>
            <Field label="Bags">
              <Stepper
                value={form.bags}
                onChange={(value) => set({ bags: value })}
                min={0}
                max={20}
                label="bags"
              />
            </Field>
          </div>

          <Field label="Vehicle" hint="We’ll suggest the right size for your party.">
            <OptionGrid
              label="Vehicle class"
              value={form.vehicleClass}
              onChange={(value) => set({ vehicleClass: value })}
              columns={1}
              options={VEHICLE_CLASSES.map((v) => ({
                value: v.id,
                label: v.name,
                sub: `${v.capacity} · ${formatCurrency(priceFor(form.airport, v.id, form.bags))}`,
              }))}
            />
          </Field>

          <Field
            label={form.direction === 'arrival' ? 'Drop-off address' : 'Pickup address'}
            hint="Pre-filled from your stay"
          >
            {(props) => <Input {...props} value={property?.address ?? ''} readOnly />}
          </Field>

          <Field label="Special requests" hint="Car seats, extra stops, accessibility needs">
            {(props) => (
              <Textarea
                {...props}
                rows={3}
                value={form.specialRequests}
                placeholder="Two booster seats, please stop at a pharmacy…"
                onChange={(e) => set({ specialRequests: e.target.value })}
              />
            )}
          </Field>

          <div>
            <Checkbox checked={form.terms} onChange={(value) => set({ terms: value })}>
              I understand this is a request. My30A confirms a vehicle first, then authorises my card
              as a hold. The final amount is captured after the ride, and cancellations more than 12
              hours before pickup are free.
            </Checkbox>
            {errors.terms && (
              <span className="field__error" role="alert" style={{ paddingLeft: 12 }}>
                <Icon name="alert" style={{ width: 13, height: 13 }} />
                {errors.terms}
              </span>
            )}
          </div>
        </div>

        {/* --------------------------- Quote aside -------------------------- */}
        <aside className="detail-layout__aside">
          <div className="card card--pad">
            <h2 style={{ fontSize: '1.05rem', marginBottom: 12 }}>Estimated price</h2>
            <div className="u-between" style={{ marginBottom: 12 }}>
              <div>
                <div className="u-small" style={{ fontWeight: 600 }}>
                  {form.direction === 'arrival'
                    ? `${form.airport} → ${property?.community ?? 'Rosemary Beach'}`
                    : `${property?.community ?? 'Rosemary Beach'} → ${form.airport}`}
                </div>
                <div className="u-xs u-muted">
                  {airport?.driveTime} · {vehicle?.name}
                </div>
              </div>
              <span className="price price--lg">
                <span className="price__amount">{formatCurrency(quotedPrice)}</span>
              </span>
            </div>

            <DefinitionList
              rows={[
                { key: 'Airport', value: `${form.airport} · ${airport?.name}` },
                { key: 'Vehicle', value: vehicle?.name },
                { key: 'Party', value: `${form.passengers} passengers · ${form.bags} bags` },
                form.date ? { key: 'Date', value: formatLongDate(form.date) } : null,
              ]}
            />

            <Callout icon="lock" tone="info" className="section">
              Nothing is charged now. We authorise your card only after a driver is confirmed.
            </Callout>
          </div>
        </aside>
      </div>

      <StickyBar>
        <Button variant="secondary" onClick={() => navigate('/transfers')} disabled={submitting}>
          Cancel
        </Button>
        <Button onClick={submit} loading={submitting} icon="car">
          Request transfer · {formatCurrency(quotedPrice)}
        </Button>
      </StickyBar>
    </div>
  )
}

/** '14:00' → '2:00 PM' */
function formatClock(value) {
  if (!value) return ''
  const [h, m] = value.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 === 0 ? 12 : h % 12
  return `${hour}:${String(m).padStart(2, '0')} ${period}`
}
