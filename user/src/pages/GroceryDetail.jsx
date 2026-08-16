import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import PageHeader from '../components/ui/PageHeader'
import Icon from '../components/ui/Icon'
import Button from '../components/ui/Button'
import SmartImage from '../components/ui/SmartImage'
import StatusBadge, { PaymentBadge } from '../components/ui/StatusBadge'
import { ConfirmModal } from '../components/ui/Modal'
import { Timeline, DefinitionList, Section, Callout } from '../components/ui/Display'
import { SkeletonPage } from '../components/ui/Skeleton'
import { ErrorState } from '../components/ui/States'
import { PaymentSheet, PaymentStateRow, TipPanel, RatingPanel } from '../components/service/PaymentPanel'
import { useApp } from '../context/AppContext'
import { useAsync } from '../hooks/useAsync'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import * as api from '../services/mockApi'
import { GROCERY_FLOW, getStatusMeta } from '../data/statusConfig'
import { formatCurrency, formatLongDate, formatTime, formatDayLabel } from '../utils/format'
import { PHOTO } from '../assets/images'

const NEXT_STATUS = {
  pending: 'confirmed',
  confirmed: 'shopping',
  shopping: 'on_the_way',
  on_the_way: 'delivered',
}

export default function GroceryDetail() {
  const { id } = useParams()
  const { property, pushToast } = useApp()
  const [payOpen, setPayOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const { data: order, loading, error, reload, setData } = useAsync(
    () => api.getGroceryOrder(id),
    [id],
  )
  useDocumentTitle(order ? `Grocery ${order.id}` : 'Grocery request')

  const steps = useMemo(() => {
    if (!order) return []
    const currentIndex = GROCERY_FLOW.findIndex((s) => s.key === order.status)
    return GROCERY_FLOW.map((status, i) => {
      const entry = order.timeline.find((t) => t.status === status.key)
      const state = order.status === 'cancelled' ? 'pending' : i < currentIndex ? 'done' : i === currentIndex ? 'current' : 'pending'
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
  }, [order])

  if (loading) return <SkeletonPage />
  if (error || !order) {
    return (
      <div className="page">
        <PageHeader title="Grocery request" back backTo="/groceries" />
        <ErrorState title="We couldn’t find that request" error={error} onRetry={reload} />
        <div style={{ marginTop: 'var(--sp-4)', textAlign: 'center' }}>
          <Button variant="secondary" to="/groceries">
            All grocery requests
          </Button>
        </div>
      </div>
    )
  }

  const meta = getStatusMeta(GROCERY_FLOW, order.status)
  const total =
    Number(order.estimatedTotal ?? 0) + Number(order.serviceFee ?? 0) + Number(order.deliveryFee ?? 0)
  const canCancel = ['pending', 'confirmed'].includes(order.status)
  const needsPayment = order.payment?.state === 'payment_required'
  const isDelivered = order.status === 'delivered'

  const advance = async () => {
    const nextStatus = NEXT_STATUS[order.status]
    if (!nextStatus) return
    setBusy(true)
    try {
      const updated = await api.updateMockOrderStatus('grocery', order.id, nextStatus, {
        deliveryPhoto: nextStatus === 'delivered' ? PHOTO.groceryKitchen : undefined,
      })
      setData(updated)
    } catch (err) {
      pushToast({ tone: 'error', title: 'Could not update', message: err.message })
    } finally {
      setBusy(false)
    }
  }

  const pay = async () => {
    setBusy(true)
    try {
      const updated = await api.payNow('grocery', order.id, { amount: total })
      setData(updated)
      setPayOpen(false)
      pushToast({ tone: 'success', title: 'Payment received', message: `${formatCurrency(total)} paid.` })
    } catch (err) {
      pushToast({ tone: 'error', title: 'Payment failed', message: err.message })
    } finally {
      setBusy(false)
    }
  }

  const cancel = async () => {
    setBusy(true)
    try {
      const updated = await api.cancelOrder('grocery', order.id)
      setData(updated)
      setCancelOpen(false)
      pushToast({ tone: 'info', title: 'Request cancelled', message: `${order.id} was cancelled.` })
    } catch (err) {
      pushToast({ tone: 'error', title: 'Could not cancel', message: err.message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page">
      <PageHeader
        title={`Grocery request ${order.id}`}
        subtitle={`${formatLongDate(order.deliveryDate)} · ${order.deliveryWindow}`}
        back
        backTo="/groceries"
        breadcrumbs={[
          { label: 'Services', to: '/services' },
          { label: 'Groceries', to: '/groceries' },
          { label: order.id },
        ]}
        actions={<StatusBadge kind="grocery" status={order.status} />}
      />

      <div className="detail-layout">
        <div>
          {/* --------------------------- Status --------------------------- */}
          <div className="card card--pad">
            <div className="u-between u-wrap" style={{ marginBottom: 'var(--sp-4)' }}>
              <div>
                <h2 style={{ fontSize: '1.1rem' }}>{meta.label}</h2>
                <p className="u-small u-muted" style={{ maxWidth: '46ch' }}>
                  {meta.description}
                </p>
              </div>
              {order.shopper && (
                <div className="u-row">
                  <span className="order-card__icon" aria-hidden="true">
                    <Icon name="user" />
                  </span>
                  <div>
                    <div className="u-small" style={{ fontWeight: 600 }}>
                      {order.shopper.name}
                    </div>
                    <a className="u-xs" style={{ color: 'var(--sea-700)' }} href={`tel:${order.shopper.phone}`}>
                      {order.shopper.phone}
                    </a>
                  </div>
                </div>
              )}
            </div>

            <Timeline steps={steps} />

            {order.status === 'cancelled' && (
              <Callout icon="alert" className="section" style={{ marginTop: 16 }}>
                This request was cancelled. Nothing was charged.
              </Callout>
            )}
          </div>

          {/* ------------------------ Delivery proof ---------------------- */}
          {isDelivered && (
            <Section title="Delivered" id="proof">
              <div className="proof">
                <SmartImage
                  photoId={order.deliveryPhoto ?? PHOTO.groceryKitchen}
                  alt="Your groceries put away in the kitchen"
                  ratio="16x9"
                  width={1000}
                />
                <p className="proof__caption">
                  Everything is put away — cold items in the fridge, wine on the counter. Enjoy your
                  stay at {property?.name}.
                </p>
              </div>
            </Section>
          )}

          {/* ------------------------- Tip + rating ----------------------- */}
          {isDelivered && (
            <>
              <Section title="Tip your shopper" id="tip">
                <div className="card card--pad">
                  <TipPanel
                    base={Number(order.estimatedTotal ?? 0)}
                    currentTip={order.tip}
                    onSubmit={async (amount) => {
                      const updated = await api.addTip('grocery', order.id, amount)
                      setData(updated)
                      pushToast({
                        tone: 'success',
                        title: amount ? 'Tip added' : 'Noted',
                        message: amount ? `${formatCurrency(amount)} added for ${order.shopper?.name ?? 'your shopper'}.` : undefined,
                      })
                    }}
                  />
                </div>
              </Section>

              <Section title="How did we do?" id="rating">
                <div className="card">
                  <RatingPanel
                    title="How was your grocery delivery?"
                    existing={order.rating}
                    onSubmit={async ({ stars, feedback }) => {
                      const updated = await api.submitRating('grocery', order.id, { stars, feedback })
                      setData(updated)
                      pushToast({ tone: 'success', title: 'Thank you for the feedback' })
                    }}
                  />
                </div>
              </Section>
            </>
          )}

          {/* --------------------------- The list ------------------------- */}
          <Section title="Your list" id="items">
            <div className="card card--pad">
              <pre
                style={{
                  margin: 0,
                  fontFamily: 'inherit',
                  fontSize: 'var(--fs-sm)',
                  whiteSpace: 'pre-wrap',
                  color: 'var(--ink-600)',
                  lineHeight: 1.8,
                }}
              >
                {order.items}
              </pre>
              {order.notes && (
                <>
                  <hr />
                  <p className="u-small">
                    <strong>Notes for the shopper:</strong> {order.notes}
                  </p>
                </>
              )}
            </div>
          </Section>
        </div>

        {/* ---------------------------- Aside ---------------------------- */}
        <aside className="detail-layout__aside">
          <div className="card card--pad">
            <div className="u-between" style={{ marginBottom: 12 }}>
              <h2 style={{ fontSize: '1.05rem' }}>Payment</h2>
              <PaymentBadge state={order.payment?.state} />
            </div>

            <PaymentStateRow
              state={order.payment?.state}
              amount={order.payment?.amount ?? total}
              method={order.payment?.method}
            />

            <DefinitionList
              className="section"
              rows={[
                { key: 'Groceries (estimate)', value: formatCurrency(order.estimatedTotal) },
                { key: 'Service fee', value: formatCurrency(order.serviceFee) },
                { key: 'Delivery fee', value: formatCurrency(order.deliveryFee) },
                order.tax ? { key: 'Tax', value: formatCurrency(order.tax) } : null,
                order.tip ? { key: 'Tip', value: formatCurrency(order.tip) } : null,
                { key: 'Total', value: formatCurrency(total + Number(order.tip ?? 0)), total: true },
              ]}
            />

            {needsPayment && (
              <Button block icon="creditCard" onClick={() => setPayOpen(true)} style={{ marginTop: 12 }}>
                Pay {formatCurrency(total)}
              </Button>
            )}

            {canCancel && (
              <Button
                block
                variant="ghost"
                onClick={() => setCancelOpen(true)}
                style={{ marginTop: 8, color: 'var(--danger)' }}
              >
                Cancel this request
              </Button>
            )}
          </div>

          <div className="card card--pad">
            <h2 style={{ fontSize: '1.05rem', marginBottom: 12 }}>Delivery</h2>
            <DefinitionList
              rows={[
                { key: 'Date', value: formatLongDate(order.deliveryDate) },
                { key: 'Window', value: order.deliveryWindow },
                { key: 'Store', value: order.store },
                { key: 'Address', value: property?.address },
              ]}
            />
          </div>

          {/* Demo affordance: in production, ops moves these states. */}
          {NEXT_STATUS[order.status] && (
            <div className="state state--plain" style={{ padding: 'var(--sp-4)', border: '1px dashed var(--line-strong)' }}>
              <p className="u-xs u-muted">
                Prototype control — in production the concierge team advances this from the admin
                console and the guest is notified.
              </p>
              <Button size="sm" variant="secondary" onClick={advance} loading={busy} icon="refresh">
                Advance to “{getStatusMeta(GROCERY_FLOW, NEXT_STATUS[order.status]).label}”
              </Button>
            </div>
          )}
        </aside>
      </div>

      <PaymentSheet
        open={payOpen}
        onClose={() => setPayOpen(false)}
        onConfirm={pay}
        mode="pay"
        amount={total}
        busy={busy}
        lines={[
          { key: 'Groceries (estimate)', value: formatCurrency(order.estimatedTotal) },
          { key: 'Service fee', value: formatCurrency(order.serviceFee) },
          { key: 'Delivery fee', value: formatCurrency(order.deliveryFee) },
          { key: 'Total', value: formatCurrency(total), total: true },
        ]}
      />

      <ConfirmModal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={cancel}
        loading={busy}
        title="Cancel this grocery request?"
        message="Your shopper hasn’t started yet, so cancelling is free. You can always submit a new request."
        confirmLabel="Cancel request"
        cancelLabel="Keep it"
        tone="danger"
      />

      <div style={{ height: 'var(--sp-8)' }} />
    </div>
  )
}
