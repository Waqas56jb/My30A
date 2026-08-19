import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Icon from '../../components/ui/Icon'
import Button from '../../components/ui/Button'
import Modal, { ConfirmModal } from '../../components/ui/Modal'
import SmartImage from '../../components/ui/SmartImage'
import { SkeletonPage } from '../../components/ui/Skeleton'
import { ErrorState } from '../../components/ui/States'
import { Field, Input, Textarea } from '../../components/ui/Form'
import {
  PageHeader, Panel, Grid, Facts, StatusPill, StepRail, Money, MockPaymentNote, InlineEmpty,
} from '../../components/common/AdminUI'
import { useLoad } from '../../hooks/useTable'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useAdmin } from '../../context/AdminContext'
import * as api from '../../services/adminApi'
import { GROCERY_STATUSES, GROCERY_FLOW, DEFAULT_SERVICE_FEES, feeForBasket } from '../../data/orders'
import { PAYMENT_STATUSES, PAYMENT_TYPES } from '../../data/payments'
import { formatDate, formatCurrency, formatRelative } from '../../utils/format'

/**
 * One grocery order, and the buttons that move it along.
 *
 * The workflow is deliberately one step at a time: the next status is whatever
 * the data layer says comes next, so an operator cannot skip payment and go
 * straight to delivered.
 */
export default function GroceryDetail() {
  const { id } = useParams()
  const { pushToast } = useAdmin()
  const { data, loading, error, reload } = useLoad(() => api.getOrder(id), [id])

  const [busy, setBusy] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [estimate, setEstimate] = useState('')

  useDocumentTitle(data?.order?.id ? `Order ${data.order.id}` : 'Grocery order')

  if (loading) return <SkeletonPage />
  if (error || !data?.order) return <ErrorState error={error} onRetry={reload} title="We could not open that" />

  const { order, payments } = data
  const meta = GROCERY_STATUSES[order.status] ?? {}
  const cancelled = order.status === 'cancelled'
  const items = Array.isArray(order.items) ? order.items : []
  const basket = Number(order.actualAmount ?? order.estimatedAmount ?? 0) || 0
  const serviceFee = Number(order.serviceFee ?? 0) || 0
  const tipAmount = Number(order.tipAmount ?? 0) || 0

  const advance = async (status, extra = {}) => {
    setBusy(true)
    try {
      await api.setOrderStatus(order.id, status, extra)
      pushToast({ tone: 'success', title: `${order.id} is now ${(GROCERY_STATUSES[status]?.label ?? status).toLowerCase()}` })
      reload()
    } catch (err) {
      pushToast({ tone: 'error', title: 'That did not go through', message: err.message })
    } finally {
      setBusy(false)
      setConfirmOpen(false)
      setCancelOpen(false)
    }
  }

  const confirmWithEstimate = () => {
    const amount = Number(estimate) || order.estimatedAmount
    advance('confirmed', {
      estimatedAmount: amount,
      serviceFee: feeForBasket(DEFAULT_SERVICE_FEES, amount),
    })
  }

  return (
    <div className="apage">
      <PageHeader
        title={`Order ${order.id}`}
        subtitle={`${order.guestName} · ${order.propertyName} · delivery ${formatDate(order.deliveryDate)}, ${order.deliveryWindow}`}
        back={{ to: '/admin/grocery', label: 'All grocery orders' }}
        actions={
          <>
            <StatusPill map={GROCERY_STATUSES} value={order.status} />
            {meta?.next && !cancelled && (
              <Button
                icon="arrowRight"
                loading={busy}
                onClick={() => {
                  if (order.status === 'pending') {
                    setEstimate(String(order.estimatedAmount))
                    setConfirmOpen(true)
                  } else {
                    advance(meta.next)
                  }
                }}
              >
                {meta.nextLabel}
              </Button>
            )}
            {!cancelled && order.status !== 'delivered' && (
              <Button variant="danger" size="sm" icon="x" onClick={() => setCancelOpen(true)}>
                Cancel order
              </Button>
            )}
          </>
        }
      />

      <Panel title="Workflow">
        <StepRail
          flow={GROCERY_FLOW}
          statuses={GROCERY_STATUSES}
          current={order.status}
          cancelled={cancelled}
          cancelledLabel={`Cancelled — ${order.cancelReason ?? 'no reason recorded'}`}
        />
      </Panel>

      <Grid cols={2}>
        <Panel title="Order">
          <Facts
            items={[
              { label: 'Order id', value: order.id },
              {
                label: 'Guest',
                value: <Link to={`/admin/guests/${order.guestId}`}>{order.guestName}</Link>,
              },
              {
                label: 'Property',
                value: <Link to={`/admin/properties/${order.propertyId}`}>{order.propertyName}</Link>,
              },
              { label: 'Host', value: order.hostName },
              { label: 'Store', value: order.store },
              { label: 'Delivery date', value: formatDate(order.deliveryDate) },
              { label: 'Window', value: order.deliveryWindow },
              { label: 'Shopper', value: order.shopper ?? 'Not assigned yet' },
              { label: 'Created', value: formatRelative(order.createdAt) },
            ]}
          />
          {order.notes && (
            <div style={{ marginTop: 'var(--sp-4)' }}>
              <p className="stat__label" style={{ marginBottom: 4 }}>Guest notes</p>
              <p className="u-small" style={{ lineHeight: 1.6 }}>{order.notes}</p>
            </div>
          )}
        </Panel>

        <Panel title="Money">
          <div className="refund-preview" style={{ marginBottom: 'var(--sp-4)' }}>
            <div className="refund-preview__row">
              <span>{order.actualAmount ? 'Actual basket' : 'Estimated basket'}</span>
              <strong>{formatCurrency(basket)}</strong>
            </div>
            <div className="refund-preview__row">
              <span>Service fee</span>
              <strong>{formatCurrency(serviceFee)}</strong>
            </div>
            {tipAmount > 0 && (
              <div className="refund-preview__row">
                <span>Tip ({order.tipPercent}%)</span>
                <strong>{formatCurrency(tipAmount)}</strong>
              </div>
            )}
            <div className="refund-preview__row refund-preview__row--total">
              <span>Total</span>
              <strong>{formatCurrency(basket + serviceFee + tipAmount)}</strong>
            </div>
          </div>

          <p className="u-xs u-muted" style={{ lineHeight: 1.6 }}>
            The basket amount is charged once the guest confirms; the service fee is charged when the
            delivery is completed. Fee tiers are configurable in Settings.
          </p>

          <div style={{ marginTop: 'var(--sp-3)' }}>
            <MockPaymentNote />
          </div>
        </Panel>
      </Grid>

      <Grid cols={2}>
        <Panel title={`Shopping list (${items.length} items)`}>
          {items.length === 0 ? (
            <InlineEmpty icon="bag" title="No items on this list" />
          ) : (
            <ul className="activity">
              {items.map((item) => (
                <li className="activity__row" key={item.id ?? item.name}>
                  <span className="activity__icon" aria-hidden="true">{item.qty ?? 1}</span>
                  <span style={{ minWidth: 0 }}>
                    <span className="activity__title">{item.name}</span>
                    {item.note && <span className="activity__body">{item.note}</span>}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Delivery photo" subtitle="Sent to the guest when the order is marked delivered.">
          {order.deliveryPhoto ? (
            <div className="mediacard">
              <div className="mediacard__img">
                <SmartImage photoId={order.deliveryPhoto} alt="Delivery" fill width={600} />
              </div>
            </div>
          ) : (
            <InlineEmpty
              icon="camera"
              title="No photo yet"
              body="A photo is attached when the shopper completes the delivery."
            />
          )}
        </Panel>
      </Grid>

      <Panel title="Payments" flush>
        {payments.length === 0 ? (
          <InlineEmpty icon="creditCard" title="No payments recorded yet" body="The basket is charged once the guest confirms the estimate." />
        ) : (
          <ul className="activity" style={{ padding: 'var(--sp-4)' }}>
            {payments.map((p) => (
              <li className="activity__row" key={p.id}>
                <span className="activity__icon" aria-hidden="true"><Icon name="creditCard" size={15} /></span>
                <span style={{ minWidth: 0 }}>
                  <span className="activity__title">
                    {PAYMENT_TYPES[p.type]?.label ?? p.type} · <Money amount={p.amount} />
                  </span>
                  <span className="activity__body">{p.id} · {p.method}</span>
                </span>
                <StatusPill map={PAYMENT_STATUSES} value={p.status} />
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {/* -------------------------- Confirm with estimate ------------------ */}
      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Confirm this order"
        subtitle={`${order.id} · ${order.guestName}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmOpen(false)} disabled={busy}>Cancel</Button>
            <Button onClick={confirmWithEstimate} loading={busy} icon="check">Confirm order</Button>
          </>
        }
      >
        <p className="u-small u-muted" style={{ marginTop: 0, lineHeight: 1.6 }}>
          Set the estimated basket total. The guest is asked to pay this amount; the service fee is
          worked out from the tier it falls into and charged on delivery.
        </p>
        <Field label="Estimated basket total" hint={`Service fee will be ${formatCurrency(feeForBasket(DEFAULT_SERVICE_FEES, Number(estimate) || 0))}`}>
          {(p) => (
            <Input {...p} type="number" min="0" value={estimate} onChange={(e) => setEstimate(e.target.value)} />
          )}
        </Field>
        <MockPaymentNote />
      </Modal>

      {/* ------------------------------- Cancel --------------------------- */}
      <Modal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="Cancel this order?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCancelOpen(false)} disabled={busy}>Keep order</Button>
            <Button
              variant="danger"
              loading={busy}
              icon="x"
              onClick={() => advance('cancelled', { cancelReason: cancelReason.trim() || 'Cancelled by the team' })}
            >
              Cancel order
            </Button>
          </>
        }
      >
        <p className="u-small u-muted" style={{ marginTop: 0, lineHeight: 1.6 }}>
          The guest is notified. If the basket has already been charged, raise a refund from the
          payment record afterwards.
        </p>
        <Field label="Reason">
          {(p) => (
            <Textarea
              {...p}
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Guest cancelled their trip."
            />
          )}
        </Field>
      </Modal>
    </div>
  )
}
