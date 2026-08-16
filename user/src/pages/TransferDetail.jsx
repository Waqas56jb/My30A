import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import PageHeader from '../components/ui/PageHeader'
import Icon from '../components/ui/Icon'
import Button from '../components/ui/Button'
import StatusBadge, { PaymentBadge } from '../components/ui/StatusBadge'
import { ConfirmModal } from '../components/ui/Modal'
import { Timeline, DefinitionList, Section, Callout } from '../components/ui/Display'
import { SkeletonPage } from '../components/ui/Skeleton'
import { ErrorState } from '../components/ui/States'
import { PaymentSheet, PaymentStateRow, TipPanel, RatingPanel } from '../components/service/PaymentPanel'
import MapPanel from '../components/map/MapPanel'
import { useApp } from '../context/AppContext'
import { useAsync } from '../hooks/useAsync'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import * as api from '../services/mockApi'
import { TRANSFER_FLOW, getStatusMeta } from '../data/statusConfig'
import { formatCurrency, formatLongDate, formatTime, formatDayLabel } from '../utils/format'

const NEXT_STATUS = {
  pending: 'confirmed',
  confirmed: 'payment_required',
  payment_required: 'scheduled',
  scheduled: 'completed',
}

export default function TransferDetail() {
  const { id } = useParams()
  const { property, pushToast } = useApp()
  const [authOpen, setAuthOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const { data: transfer, loading, error, reload, setData } = useAsync(
    () => api.getTransfer(id),
    [id],
  )
  useDocumentTitle(transfer ? `Transfer ${transfer.id}` : 'Transfer')

  const steps = useMemo(() => {
    if (!transfer) return []
    const currentIndex = TRANSFER_FLOW.findIndex((s) => s.key === transfer.status)
    return TRANSFER_FLOW.map((status, i) => {
      const entry = transfer.timeline.find((t) => t.status === status.key)
      const state =
        transfer.status === 'cancelled'
          ? 'pending'
          : i < currentIndex
            ? 'done'
            : i === currentIndex
              ? 'current'
              : 'pending'
      return {
        key: status.key,
        title: status.label,
        meta: entry
          ? `${formatDayLabel(entry.at)} · ${formatTime(entry.at)}${entry.note ? ` · ${entry.note}` : ''}`
          : state === 'current'
            ? status.description
            : undefined,
        state,
      }
    })
  }, [transfer])

  if (loading) return <SkeletonPage />
  if (error || !transfer) {
    return (
      <div className="page">
        <PageHeader title="Airport transfer" back backTo="/transfers" />
        <ErrorState title="We couldn’t find that transfer" error={error} onRetry={reload} />
        <div style={{ marginTop: 'var(--sp-4)', textAlign: 'center' }}>
          <Button variant="secondary" to="/transfers">
            All transfers
          </Button>
        </div>
      </div>
    )
  }

  const meta = getStatusMeta(TRANSFER_FLOW, transfer.status)
  const needsAuthorization = ['authorization_required'].includes(transfer.payment?.state)
  const isCompleted = transfer.status === 'completed'
  const canCancel = ['pending', 'confirmed', 'payment_required', 'scheduled'].includes(transfer.status)
  const total = Number(transfer.quotedPrice ?? 0) + Number(transfer.gratuity ?? 0)

  const advance = async () => {
    const nextStatus = NEXT_STATUS[transfer.status]
    if (!nextStatus) return
    setBusy(true)
    try {
      setData(await api.updateMockOrderStatus('transfer', transfer.id, nextStatus))
    } catch (err) {
      pushToast({ tone: 'error', title: 'Could not update', message: err.message })
    } finally {
      setBusy(false)
    }
  }

  const authorize = async () => {
    setBusy(true)
    try {
      const updated = await api.authorizePayment('transfer', transfer.id)
      setData(updated)
      setAuthOpen(false)
      pushToast({
        tone: 'success',
        title: 'Card authorised',
        message: 'Your vehicle is locked in. Nothing has been charged yet.',
      })
    } catch (err) {
      pushToast({ tone: 'error', title: 'Authorisation failed', message: err.message })
    } finally {
      setBusy(false)
    }
  }

  const cancel = async () => {
    setBusy(true)
    try {
      setData(await api.cancelOrder('transfer', transfer.id))
      setCancelOpen(false)
      pushToast({ tone: 'info', title: 'Transfer cancelled' })
    } catch (err) {
      pushToast({ tone: 'error', title: 'Could not cancel', message: err.message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page">
      <PageHeader
        title={`Transfer ${transfer.id}`}
        subtitle={`${transfer.airport} · ${formatLongDate(transfer.date)} at ${transfer.time}`}
        back
        backTo="/transfers"
        breadcrumbs={[
          { label: 'Services', to: '/services' },
          { label: 'Transfers', to: '/transfers' },
          { label: transfer.id },
        ]}
        actions={<StatusBadge kind="transfer" status={transfer.status} />}
      />

      <div className="detail-layout">
        <div>
          <div className="card card--pad">
            <div className="u-between u-wrap" style={{ marginBottom: 'var(--sp-4)' }}>
              <div>
                <h2 style={{ fontSize: '1.1rem' }}>{meta.label}</h2>
                <p className="u-small u-muted" style={{ maxWidth: '46ch' }}>
                  {meta.description}
                </p>
              </div>
              {transfer.driver && (
                <div className="u-row">
                  <span className="order-card__icon" aria-hidden="true">
                    <Icon name="user" />
                  </span>
                  <div>
                    <div className="u-small" style={{ fontWeight: 600 }}>
                      {transfer.driver.name}
                    </div>
                    <div className="u-xs u-muted">{transfer.driver.vehicle}</div>
                    <a
                      className="u-xs"
                      style={{ color: 'var(--sea-700)' }}
                      href={`tel:${transfer.driver.phone}`}
                    >
                      {transfer.driver.phone}
                    </a>
                  </div>
                </div>
              )}
            </div>

            <Timeline steps={steps} />

            {transfer.status === 'cancelled' && (
              <Callout icon="alert">This transfer was cancelled. Any hold has been released.</Callout>
            )}
          </div>

          {needsAuthorization && (
            <Callout icon="lock" tone="info" className="section">
              <strong style={{ display: 'block', marginBottom: 2 }}>One step left</strong>
              Authorise your card to lock the vehicle. This places a hold of{' '}
              {formatCurrency(transfer.quotedPrice)} — you are only charged after the ride.
            </Callout>
          )}

          <Section title="Route" id="route">
            <MapPanel
              entities={[]}
              property={property}
              showLegend={false}
              style={{ minHeight: 240 }}
            />
            <div className="card card--pad section">
              <DefinitionList
                rows={[
                  { key: 'Pickup', value: transfer.pickupAddress },
                  { key: 'Drop-off', value: transfer.dropoffAddress },
                  { key: 'Flight', value: transfer.flightNumber },
                  { key: 'Vehicle', value: transfer.vehicleName },
                  { key: 'Party', value: `${transfer.passengers} passengers · ${transfer.bags} bags` },
                  transfer.specialRequests
                    ? { key: 'Requests', value: transfer.specialRequests }
                    : null,
                ]}
              />
            </div>
          </Section>

          {isCompleted && (
            <>
              <Section title="Thank your driver" id="tip">
                <div className="card card--pad">
                  <TipPanel
                    base={Number(transfer.quotedPrice ?? 0)}
                    currentTip={transfer.gratuity}
                    onSubmit={async (amount) => {
                      setData(await api.addTip('transfer', transfer.id, amount))
                      pushToast({
                        tone: 'success',
                        title: amount ? 'Tip added' : 'Noted',
                        message: amount
                          ? `${formatCurrency(amount)} added for ${transfer.driver?.name ?? 'your driver'}.`
                          : undefined,
                      })
                    }}
                  />
                </div>
              </Section>

              <Section title="How was the ride?" id="rating">
                <div className="card">
                  <RatingPanel
                    title="How was your airport transfer?"
                    existing={transfer.rating}
                    onSubmit={async ({ stars, feedback }) => {
                      setData(await api.submitRating('transfer', transfer.id, { stars, feedback }))
                      pushToast({ tone: 'success', title: 'Thank you for the feedback' })
                    }}
                  />
                </div>
              </Section>
            </>
          )}
        </div>

        <aside className="detail-layout__aside">
          <div className="card card--pad">
            <div className="u-between" style={{ marginBottom: 12 }}>
              <h2 style={{ fontSize: '1.05rem' }}>Payment</h2>
              <PaymentBadge state={transfer.payment?.state} />
            </div>

            <PaymentStateRow
              state={transfer.payment?.state}
              amount={transfer.payment?.amount ?? transfer.quotedPrice}
              method={transfer.payment?.method}
            />

            <DefinitionList
              className="section"
              rows={[
                { key: 'Transfer', value: formatCurrency(transfer.quotedPrice) },
                transfer.gratuity ? { key: 'Gratuity', value: formatCurrency(transfer.gratuity) } : null,
                { key: 'Total', value: formatCurrency(total), total: true },
              ]}
            />

            {needsAuthorization && (
              <Button block icon="lock" onClick={() => setAuthOpen(true)} style={{ marginTop: 12 }}>
                Authorise {formatCurrency(transfer.quotedPrice)}
              </Button>
            )}

            {canCancel && (
              <Button
                block
                variant="ghost"
                onClick={() => setCancelOpen(true)}
                style={{ marginTop: 8, color: 'var(--danger)' }}
              >
                Cancel this transfer
              </Button>
            )}
          </div>

          <div className="card card--pad">
            <h2 style={{ fontSize: '1.05rem', marginBottom: 12 }}>Flight</h2>
            <DefinitionList
              rows={[
                { key: 'Airport', value: `${transfer.airport} · ${transfer.airportName}` },
                { key: 'Date', value: formatLongDate(transfer.date) },
                { key: 'Time', value: transfer.time },
                { key: 'Flight', value: transfer.flightNumber },
                { key: 'Direction', value: transfer.direction === 'arrival' ? 'Arriving' : 'Departing' },
              ]}
            />
          </div>

          {NEXT_STATUS[transfer.status] && (
            <div
              className="state state--plain"
              style={{ padding: 'var(--sp-4)', border: '1px dashed var(--line-strong)' }}
            >
              <p className="u-xs u-muted">
                Prototype control — operations moves these states in production and the guest is
                notified automatically.
              </p>
              <Button size="sm" variant="secondary" onClick={advance} loading={busy} icon="refresh">
                Advance to “{getStatusMeta(TRANSFER_FLOW, NEXT_STATUS[transfer.status]).label}”
              </Button>
            </div>
          )}
        </aside>
      </div>

      <PaymentSheet
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onConfirm={authorize}
        mode="authorize"
        amount={transfer.quotedPrice}
        busy={busy}
        lines={[
          { key: 'Transfer', value: formatCurrency(transfer.quotedPrice) },
          { key: 'Charged now', value: formatCurrency(0), total: true },
        ]}
      />

      <ConfirmModal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={cancel}
        loading={busy}
        title="Cancel this transfer?"
        message="Cancellations more than 12 hours before pickup are free, and any authorisation hold is released immediately."
        confirmLabel="Cancel transfer"
        cancelLabel="Keep it"
        tone="danger"
      />

      <div style={{ height: 'var(--sp-8)' }} />
    </div>
  )
}
