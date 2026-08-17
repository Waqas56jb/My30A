import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Icon from '../../components/ui/Icon'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import { SkeletonPage } from '../../components/ui/Skeleton'
import { ErrorState } from '../../components/ui/States'
import { Field, Textarea, Select } from '../../components/ui/Form'
import { Callout } from '../../components/ui/Display'
import {
  PageHeader, Panel, Grid, Facts, StatusPill, StepRail, Money, MockPaymentNote, InlineEmpty,
} from '../../components/common/AdminUI'
import { useLoad } from '../../hooks/useTable'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useAdmin } from '../../context/AdminContext'
import * as api from '../../services/adminApi'
import {
  TRANSFER_STATUSES, TRANSFER_FLOW, AIRPORTS,
  DEFAULT_CANCELLATION_RULES, cancellationFor, hoursUntilPickup,
} from '../../data/transfers'
import { PAYMENT_STATUSES, PAYMENT_TYPES, REFUND_STATUSES } from '../../data/payments'
import { formatDate, formatCurrency, formatRelative } from '../../utils/format'

const DRIVERS = ['Anthony P.', 'Marcus B.', 'Yolanda R.', 'Dev S.', 'Carla M.', 'Ruben O.']

export default function TransferDetail() {
  const { id } = useParams()
  const { pushToast } = useAdmin()
  const { data, loading, error, reload } = useLoad(() => api.getTransfer(id), [id])

  const [busy, setBusy] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [driverOpen, setDriverOpen] = useState(false)
  const [driver, setDriver] = useState(DRIVERS[0])

  useDocumentTitle(data ? `Transfer ${data.transfer.id}` : 'Transfer')

  if (loading) return <SkeletonPage />
  if (error) return <ErrorState error={error} onRetry={reload} title="We could not open that" />

  const { transfer, payments, refund } = data
  const meta = TRANSFER_STATUSES[transfer.status]
  const stopped = ['cancelled', 'no_show'].includes(transfer.status)
  const airport = AIRPORTS.find((a) => a.code === transfer.airport)

  /* Which cancellation tier applies right now — the fee follows from it. */
  const hours = hoursUntilPickup(transfer)
  const rule = cancellationFor(DEFAULT_CANCELLATION_RULES, Math.max(0, hours))
  const refundIfCancelled = Math.max(0, transfer.amount - rule.fee)

  const advance = async (status, extra = {}) => {
    setBusy(true)
    try {
      await api.setTransferStatus(transfer.id, status, extra)
      pushToast({
        tone: 'success',
        title: `${transfer.id} is now ${TRANSFER_STATUSES[status].label.toLowerCase()}`,
        message: status === 'completed' ? 'The card hold has been captured.' : undefined,
      })
      reload()
    } catch (err) {
      pushToast({ tone: 'error', title: 'That did not go through', message: err.message })
    } finally {
      setBusy(false)
      setCancelOpen(false)
      setDriverOpen(false)
    }
  }

  return (
    <div className="apage">
      <PageHeader
        title={`Transfer ${transfer.id}`}
        subtitle={`${transfer.guestName} · ${transfer.airport} ${transfer.flightNumber} · ${formatDate(transfer.pickupDate)} at ${transfer.pickupTime}`}
        back={{ to: '/admin/transfers', label: 'All transfers' }}
        actions={
          <>
            <StatusPill map={TRANSFER_STATUSES} value={transfer.status} />
            {meta.next && !stopped && (
              <Button
                icon="arrowRight"
                loading={busy}
                onClick={() => (meta.next === 'driver_assigned' ? setDriverOpen(true) : advance(meta.next))}
              >
                {meta.nextLabel}
              </Button>
            )}
            {!stopped && transfer.status !== 'completed' && (
              <Button variant="danger" size="sm" icon="x" onClick={() => setCancelOpen(true)}>
                Cancel
              </Button>
            )}
            {!stopped && transfer.status === 'driver_assigned' && (
              <Button variant="secondary" size="sm" icon="alert" onClick={() => advance('no_show')}>
                No show
              </Button>
            )}
          </>
        }
      />

      {transfer.createdBy === 'vitoria' && (
        <Callout icon="sparkles">
          <strong style={{ display: 'block', marginBottom: 2 }}>Created by Vitoria</strong>
          The guest asked the concierge for a pickup and she collected the airport, flight, time,
          passengers and bags, then raised this request. It arrives here for a human to confirm.
        </Callout>
      )}

      <Panel title="Workflow">
        <StepRail
          flow={TRANSFER_FLOW}
          statuses={TRANSFER_STATUSES}
          current={transfer.status}
          cancelled={stopped}
          cancelledLabel={`${TRANSFER_STATUSES[transfer.status].label} — ${transfer.cancelReason ?? 'no reason recorded'}`}
        />
      </Panel>

      <Grid cols={2}>
        <Panel title="Journey">
          <Facts
            items={[
              { label: 'Transfer id', value: transfer.id },
              { label: 'Direction', value: transfer.direction === 'arrival' ? 'Airport → property' : 'Property → airport' },
              { label: 'Airport', value: `${transfer.airport} — ${airport?.name ?? ''}` },
              { label: 'Drive time', value: airport?.drive ?? '—' },
              { label: 'Flight', value: transfer.flightNumber },
              { label: 'Pickup', value: `${formatDate(transfer.pickupDate)} at ${transfer.pickupTime}` },
              { label: 'Passengers', value: transfer.passengers },
              { label: 'Bags', value: transfer.bags },
              { label: 'Child seats', value: transfer.childSeats || 'None' },
              { label: 'Vehicle', value: transfer.vehicleName },
              { label: 'Driver', value: transfer.driver ?? 'Not assigned yet' },
              { label: 'Requested', value: formatRelative(transfer.createdAt) },
            ]}
          />
          {transfer.notes && (
            <div style={{ marginTop: 'var(--sp-4)' }}>
              <p className="stat__label" style={{ marginBottom: 4 }}>Guest notes</p>
              <p className="u-small" style={{ lineHeight: 1.6 }}>{transfer.notes}</p>
            </div>
          )}
        </Panel>

        <Panel title="Guest and property">
          <Facts
            items={[
              { label: 'Guest', value: <Link to={`/admin/guests/${transfer.guestId}`}>{transfer.guestName}</Link> },
              {
                label: 'Property',
                value: <Link to={`/admin/properties/${transfer.propertyId}`}>{transfer.propertyName}</Link>,
              },
              { label: 'Host', value: transfer.hostName },
            ]}
          />

          <div className="refund-preview" style={{ marginTop: 'var(--sp-4)' }}>
            <div className="refund-preview__row">
              <span>Fare</span>
              <strong>{formatCurrency(transfer.amount)}</strong>
            </div>
            {transfer.tipAmount > 0 && (
              <div className="refund-preview__row">
                <span>Tip ({transfer.tipPercent}%)</span>
                <strong>{formatCurrency(transfer.tipAmount)}</strong>
              </div>
            )}
            <div className="refund-preview__row refund-preview__row--total">
              <span>Total</span>
              <strong>{formatCurrency(transfer.amount + transfer.tipAmount)}</strong>
            </div>
          </div>

          <p className="u-xs u-muted" style={{ marginTop: 'var(--sp-3)', lineHeight: 1.6 }}>
            Confirming the transfer places a hold on the card. It only becomes a charge when the
            transfer is marked completed.
          </p>
          <MockPaymentNote />
        </Panel>
      </Grid>

      {/* -------------------------- Cancellation preview ------------------ */}
      {!stopped && transfer.status !== 'completed' && (
        <Panel
          title="If this were cancelled now"
          subtitle="Cancellation tiers are configurable in Settings."
        >
          <div className="refund-preview">
            <div className="refund-preview__row">
              <span>Time until pickup</span>
              <strong>{hours > 0 ? `${hours} hours` : 'Same day or passed'}</strong>
            </div>
            <div className="refund-preview__row">
              <span>Rule that applies</span>
              <strong>{rule.label}</strong>
            </div>
            <div className="refund-preview__row">
              <span>Original amount</span>
              <strong>{formatCurrency(transfer.amount)}</strong>
            </div>
            <div className="refund-preview__row">
              <span>Cancellation fee</span>
              <strong>{formatCurrency(rule.fee)}</strong>
            </div>
            <div className="refund-preview__row refund-preview__row--total">
              <span>Refund to guest</span>
              <strong>{formatCurrency(refundIfCancelled)}</strong>
            </div>
          </div>
          <p className="u-xs u-muted" style={{ marginTop: 'var(--sp-3)' }}>{rule.note}</p>
        </Panel>
      )}

      {refund && (
        <Panel title="Refund">
          <Facts
            items={[
              { label: 'Refund id', value: refund.id },
              { label: 'Original', value: <Money amount={refund.originalAmount} /> },
              { label: 'Fee retained', value: <Money amount={refund.fee} /> },
              { label: 'Refunded', value: <Money amount={refund.amount} /> },
              { label: 'Reason', value: refund.reason },
              { label: 'Status', value: <StatusPill map={REFUND_STATUSES} value={refund.status} /> },
            ]}
          />
        </Panel>
      )}

      <Panel title="Payments" flush>
        {payments.length === 0 ? (
          <InlineEmpty
            icon="creditCard"
            title="No payment yet"
            body="A hold is placed when the transfer is confirmed and the guest authorises their card."
          />
        ) : (
          <ul className="activity" style={{ padding: 'var(--sp-4)' }}>
            {payments.map((p) => (
              <li className="activity__row" key={p.id}>
                <span className="activity__icon" aria-hidden="true"><Icon name="creditCard" size={15} /></span>
                <span style={{ minWidth: 0 }}>
                  <span className="activity__title">
                    {PAYMENT_TYPES[p.type]?.label ?? p.type} · <Money amount={p.amount} />
                  </span>
                  <span className="activity__body">
                    {p.id} · {p.method}
                    {p.capturedAt ? ` · captured ${formatDate(p.capturedAt)}` : ' · hold only, not captured'}
                  </span>
                </span>
                <StatusPill map={PAYMENT_STATUSES} value={p.status} />
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {/* ---------------------------- Assign driver ----------------------- */}
      <Modal
        open={driverOpen}
        onClose={() => setDriverOpen(false)}
        title="Assign a driver"
        subtitle={`${transfer.id} · ${formatDate(transfer.pickupDate)} at ${transfer.pickupTime}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDriverOpen(false)} disabled={busy}>Cancel</Button>
            <Button loading={busy} icon="check" onClick={() => advance('driver_assigned', { driver })}>
              Assign {driver}
            </Button>
          </>
        }
      >
        <Field label="Driver">
          {(p) => (
            <Select {...p} value={driver} onChange={(e) => setDriver(e.target.value)}>
              {DRIVERS.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </Select>
          )}
        </Field>
        <p className="u-xs u-muted" style={{ lineHeight: 1.6 }}>
          The guest is told who is meeting them and where. Flight tracking continues until pickup.
        </p>
      </Modal>

      {/* ------------------------------- Cancel --------------------------- */}
      <Modal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="Cancel this transfer?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCancelOpen(false)} disabled={busy}>Keep it</Button>
            <Button
              variant="danger"
              loading={busy}
              icon="x"
              onClick={() => advance('cancelled', { cancelReason: cancelReason.trim() || 'Cancelled by the team' })}
            >
              Cancel transfer
            </Button>
          </>
        }
      >
        <div className="refund-preview">
          <div className="refund-preview__row">
            <span>Original amount</span>
            <strong>{formatCurrency(transfer.amount)}</strong>
          </div>
          <div className="refund-preview__row">
            <span>Cancellation fee ({rule.label})</span>
            <strong>{formatCurrency(rule.fee)}</strong>
          </div>
          <div className="refund-preview__row refund-preview__row--total">
            <span>Refund to guest</span>
            <strong>{formatCurrency(refundIfCancelled)}</strong>
          </div>
        </div>

        <Field label="Reason">
          {(p) => (
            <Textarea
              {...p}
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Flight cancelled — guest rebooked for Saturday."
            />
          )}
        </Field>
        <MockPaymentNote />
      </Modal>
    </div>
  )
}
