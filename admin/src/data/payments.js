import { mockOrders } from './orders'
import { mockTransfers } from './transfers'
import { mockHosts } from './hosts'
import { rng, between, pick, shiftTime } from './seed'

/**
 * Payments, refunds and tips.
 *
 * Every record here is derived from an order, a transfer or a subscription, so
 * the finance screens and the operations screens can never tell two different
 * stories about the same money.
 *
 * There are no card numbers in this file and there never will be. `•••• 4242`
 * is a label, not a truncated PAN — nothing real is being stored or masked.
 */

export const PAYMENT_STATUSES = {
  pending: { label: 'Pending', tone: 'warn' },
  authorized: { label: 'Authorised', tone: 'info' },
  captured: { label: 'Captured', tone: 'success' },
  refunded: { label: 'Refunded', tone: 'muted' },
  failed: { label: 'Failed', tone: 'danger' },
  cancelled: { label: 'Cancelled', tone: 'muted' },
}

export const PAYMENT_TYPES = {
  grocery: { label: 'Grocery', icon: 'bag' },
  service_fee: { label: 'Service fee', icon: 'dollar' },
  transfer: { label: 'Airport transfer', icon: 'car' },
  tip: { label: 'Tip', icon: 'heart' },
  subscription: { label: 'Host subscription', icon: 'refresh' },
}

export const REFUND_STATUSES = {
  pending: { label: 'Pending', tone: 'warn' },
  processing: { label: 'Processing', tone: 'info' },
  completed: { label: 'Completed', tone: 'success' },
  failed: { label: 'Failed', tone: 'danger' },
}

const METHODS = ['Visa •••• 4242', 'Mastercard •••• 8210', 'Amex •••• 1005', 'Apple Pay']

function buildPayments() {
  const random = rng(8821)
  const payments = []

  /* --- Grocery: basket charged on confirmation, fee on delivery --- */
  mockOrders.forEach((order) => {
    if (!order.paymentId) return
    const captured = ['paid', 'shopping', 'on_the_way', 'delivered'].includes(order.status)
    payments.push({
      id: order.paymentId,
      guestId: order.guestId,
      guestName: order.guestName,
      type: 'grocery',
      amount: order.actualAmount ?? order.estimatedAmount,
      status: captured ? 'captured' : 'pending',
      method: pick(random, METHODS),
      relatedId: order.id,
      relatedLabel: `Grocery ${order.id}`,
      relatedLink: `/admin/grocery/${order.id}`,
      createdAt: order.createdAt,
      authorizedAt: captured ? order.createdAt : null,
      capturedAt: captured ? shiftTime(0, 12, 0, order.deliveryDate) : null,
      refundedAt: null,
    })

    if (order.status === 'delivered') {
      payments.push({
        id: `${order.paymentId}_fee`,
        guestId: order.guestId,
        guestName: order.guestName,
        type: 'service_fee',
        amount: order.serviceFee,
        status: 'captured',
        method: pick(random, METHODS),
        relatedId: order.id,
        relatedLabel: `Grocery ${order.id}`,
        relatedLink: `/admin/grocery/${order.id}`,
        createdAt: shiftTime(0, 12, 5, order.deliveryDate),
        authorizedAt: shiftTime(0, 12, 5, order.deliveryDate),
        capturedAt: shiftTime(0, 12, 6, order.deliveryDate),
        refundedAt: null,
      })
    }

    if (order.tipAmount > 0) {
      payments.push({
        id: `${order.paymentId}_tip`,
        guestId: order.guestId,
        guestName: order.guestName,
        type: 'tip',
        amount: order.tipAmount,
        status: 'captured',
        method: pick(random, METHODS),
        relatedId: order.id,
        relatedLabel: `Grocery ${order.id}`,
        relatedLink: `/admin/grocery/${order.id}`,
        tipPercent: order.tipPercent,
        service: 'Grocery delivery',
        recipient: order.shopper,
        createdAt: shiftTime(0, 18, 0, order.deliveryDate),
        authorizedAt: shiftTime(0, 18, 0, order.deliveryDate),
        capturedAt: shiftTime(0, 18, 1, order.deliveryDate),
        refundedAt: null,
      })
    }
  })

  /* --- Transfers: authorise on confirmation, capture on completion --- */
  mockTransfers.forEach((transfer) => {
    if (!transfer.paymentId) return
    const captured = transfer.status === 'completed'
    payments.push({
      id: transfer.paymentId,
      guestId: transfer.guestId,
      guestName: transfer.guestName,
      type: 'transfer',
      amount: transfer.amount,
      status: captured ? 'captured' : 'authorized',
      method: pick(random, METHODS),
      relatedId: transfer.id,
      relatedLabel: `Transfer ${transfer.id}`,
      relatedLink: `/admin/transfers/${transfer.id}`,
      createdAt: transfer.createdAt,
      authorizedAt: transfer.createdAt,
      capturedAt: captured ? shiftTime(0, 14, 0, transfer.pickupDate) : null,
      refundedAt: null,
    })

    if (transfer.tipAmount > 0) {
      payments.push({
        id: `${transfer.paymentId}_tip`,
        guestId: transfer.guestId,
        guestName: transfer.guestName,
        type: 'tip',
        amount: transfer.tipAmount,
        status: 'captured',
        method: pick(random, METHODS),
        relatedId: transfer.id,
        relatedLabel: `Transfer ${transfer.id}`,
        relatedLink: `/admin/transfers/${transfer.id}`,
        tipPercent: transfer.tipPercent,
        service: 'Airport transfer',
        recipient: transfer.driver,
        createdAt: shiftTime(0, 15, 0, transfer.pickupDate),
        authorizedAt: shiftTime(0, 15, 0, transfer.pickupDate),
        capturedAt: shiftTime(0, 15, 1, transfer.pickupDate),
        refundedAt: null,
      })
    }
  })

  /* --- Host subscriptions --- */
  mockHosts
    .filter((h) => ['active', 'past_due', 'trial'].includes(h.subscription.status))
    .forEach((host, i) => {
      const failed = host.subscription.status === 'past_due'
      payments.push({
        id: `pay_sub_${String(i + 1).padStart(3, '0')}`,
        guestId: null,
        guestName: host.name,
        hostId: host.id,
        type: 'subscription',
        amount: host.subscription.amount,
        status: failed ? 'failed' : host.subscription.status === 'trial' ? 'pending' : 'captured',
        method: host.subscription.method,
        relatedId: host.id,
        relatedLabel: `Host ${host.name}`,
        relatedLink: `/admin/hosts/${host.id}`,
        createdAt: shiftTime(-between(random, 1, 30), between(random, 6, 20), 0),
        authorizedAt: failed ? null : shiftTime(-between(random, 1, 30), 9, 0),
        capturedAt: failed || host.subscription.status === 'trial' ? null : shiftTime(-between(random, 1, 30), 9, 1),
        refundedAt: null,
        failureReason: failed ? 'Card declined — insufficient funds.' : null,
      })
    })

  return payments.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
}

export const mockPayments = buildPayments()

function buildRefunds() {
  const random = rng(6440)
  const cancelledTransfers = mockTransfers.filter((t) => ['cancelled', 'no_show'].includes(t.status))
  const cancelledOrders = mockOrders.filter((o) => o.status === 'cancelled')

  const fromTransfers = cancelledTransfers.slice(0, 14).map((transfer, i) => {
    const fee = transfer.status === 'no_show' ? 75 : pick(random, [0, 0, 50, 75])
    return {
      id: `ref_t_${String(i + 1).padStart(3, '0')}`,
      paymentId: transfer.paymentId ?? `pay_tr_${transfer.id}`,
      guestId: transfer.guestId,
      guestName: transfer.guestName,
      type: 'transfer',
      originalAmount: transfer.amount,
      fee,
      amount: transfer.amount - fee,
      reason: transfer.cancelReason ?? 'Cancelled by guest',
      source: fee > 0 ? 'automatic' : 'automatic',
      status: pick(random, ['completed', 'completed', 'processing', 'pending']),
      relatedId: transfer.id,
      relatedLink: `/admin/transfers/${transfer.id}`,
      createdAt: transfer.createdAt,
    }
  })

  const fromOrders = cancelledOrders.slice(0, 8).map((order, i) => ({
    id: `ref_g_${String(i + 1).padStart(3, '0')}`,
    paymentId: order.paymentId ?? `pay_gr_${order.id}`,
    guestId: order.guestId,
    guestName: order.guestName,
    type: 'grocery',
    originalAmount: order.estimatedAmount,
    fee: 0,
    amount: order.estimatedAmount,
    reason: order.cancelReason ?? 'Cancelled before shopping started',
    source: 'manual',
    status: pick(random, ['completed', 'processing', 'pending', 'failed']),
    relatedId: order.id,
    relatedLink: `/admin/grocery/${order.id}`,
    createdAt: order.createdAt,
  }))

  return [...fromTransfers, ...fromOrders].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
}

export const mockRefunds = buildRefunds()

export const paymentById = (list, id) => list.find((p) => p.id === id) ?? null
export const tipPayments = (list) => list.filter((p) => p.type === 'tip')
