import { PHOTO } from '../assets/images'
import { mockGuests } from './guests'
import { rng, between, pick, pickWeighted, shiftDate, shiftTime } from './seed'

/**
 * Grocery orders.
 *
 * Unlike partner listings, grocery IS a My30A service: we take the request,
 * confirm it, charge for it, shop it, deliver it and get tipped for it. So
 * admin owns the whole lifecycle and every one of those steps is a status.
 */

export const GROCERY_STATUSES = {
  pending: { label: 'Pending', tone: 'warn', step: 1, next: 'confirmed', nextLabel: 'Confirm order' },
  confirmed: { label: 'Confirmed', tone: 'info', step: 2, next: 'payment_required', nextLabel: 'Request payment' },
  payment_required: { label: 'Payment required', tone: 'warn', step: 3, next: 'paid', nextLabel: 'Mark paid' },
  paid: { label: 'Paid', tone: 'info', step: 4, next: 'shopping', nextLabel: 'Start shopping' },
  shopping: { label: 'Shopping', tone: 'info', step: 5, next: 'on_the_way', nextLabel: 'Mark on the way' },
  on_the_way: { label: 'On the way', tone: 'info', step: 6, next: 'delivered', nextLabel: 'Mark delivered' },
  delivered: { label: 'Delivered', tone: 'success', step: 7, next: null, nextLabel: null },
  cancelled: { label: 'Cancelled', tone: 'muted', step: 0, next: null, nextLabel: null },
}

/** The order the workflow actually runs in, for progress bars and timelines. */
export const GROCERY_FLOW = [
  'pending', 'confirmed', 'payment_required', 'paid', 'shopping', 'on_the_way', 'delivered',
]

/**
 * Service fee tiers. Editable in Settings — the commercial rules are not final,
 * so nothing in the UI should hardcode these.
 */
export const DEFAULT_SERVICE_FEES = [
  { id: 'fee_1', label: 'Standard basket', upTo: 300, fee: 149 },
  { id: 'fee_2', label: 'Large basket', upTo: 600, fee: 229 },
  { id: 'fee_3', label: 'Full week', upTo: 1000, fee: 329 },
  { id: 'fee_4', label: 'Extended stay', upTo: null, fee: 379 },
]

export const feeForBasket = (tiers, amount) =>
  (tiers.find((t) => t.upTo === null || amount <= t.upTo) ?? tiers[tiers.length - 1]).fee

const STORES = ['Publix — Rosemary Beach', 'Publix — Seagrove', 'Whole Foods — Destin', 'Fresh Market — Miramar']

const ITEM_POOL = [
  'Whole milk', 'Oat milk', 'Cold brew concentrate', 'Sourdough loaf', 'Eggs (18)',
  'Salted butter', 'Greek yoghurt', 'Blueberries', 'Bananas', 'Avocados (4)',
  'Gulf shrimp', 'Chicken breasts', 'Ground beef', 'Pasta', 'Marinara',
  'Parmesan', 'Romaine', 'Cherry tomatoes', 'Lemons', 'Limes',
  'Tortilla chips', 'Salsa', 'Guacamole', 'Rosé (2 bottles)', 'Sauvignon blanc',
  'Local IPA (6)', 'Sparkling water (12)', 'Orange juice', 'Coffee beans', 'Sunscreen SPF 50',
  'Paper towels', 'Dish soap', 'Ice (2 bags)', 'Hot dogs + buns', 'Marshmallows',
  'Goldfish crackers', 'Apple juice boxes', 'Frozen waffles', 'Maple syrup', 'Bacon',
]

const NOTES = [
  'Please leave everything in the kitchen, code is in the booking.',
  'One shellfish allergy in the party — keep the shrimp bagged separately.',
  'Kids arrive first, anything for a quick lunch is a bonus.',
  'No plastic bags if you can avoid them.',
  '',
  '',
]

function buildOrders() {
  const random = rng(3301)
  const guests = mockGuests.filter((g) => g.stats.serviceRequests > 0)

  return Array.from({ length: 112 }, (_, i) => {
    const guest = guests[i % guests.length]

    /**
     * Pick the age bracket first, then the status.
     *
     * Deriving the bracket from a uniform "days ago" gave 101 delivered orders
     * and one live one — technically plausible, useless as a demo, because the
     * operations queue an admin opens in the morning was empty. Weighting the
     * brackets explicitly keeps a realistic slice of work in flight.
     */
    const bracket = pickWeighted(random, [['new', 16], ['recent', 24], ['historic', 60]])
    const createdOffset =
      bracket === 'new'
        ? -between(random, 0, 1)
        : bracket === 'recent'
          ? -between(random, 2, 5)
          : -between(random, 6, 120)
    const deliveryOffset = createdOffset + between(random, 1, 5)

    const status =
      bracket === 'new'
        ? pickWeighted(random, [['pending', 46], ['confirmed', 24], ['payment_required', 20], ['paid', 10]])
        : bracket === 'recent'
          ? pickWeighted(random, [['shopping', 24], ['on_the_way', 20], ['delivered', 44], ['cancelled', 12]])
          : pickWeighted(random, [['delivered', 88], ['cancelled', 12]])

    const itemCount = between(random, 6, 22)
    const items = Array.from({ length: itemCount }, (_, n) => ({
      id: `it_${i}_${n}`,
      name: ITEM_POOL[(i * 7 + n * 3) % ITEM_POOL.length],
      qty: between(random, 1, 3),
      note: random() < 0.12 ? 'any brand is fine' : '',
    }))

    const estimated = between(random, 90, 940)
    const fee = feeForBasket(DEFAULT_SERVICE_FEES, estimated)
    const actual = ['delivered'].includes(status)
      ? Math.max(40, estimated + between(random, -60, 70))
      : null
    const tipPercent = status === 'delivered' ? pick(random, [0, 0, 10, 18, 18, 20, 20]) : 0

    return {
      id: `GR-${1000 + i}`,
      guestId: guest.id,
      guestName: guest.name,
      propertyId: guest.propertyId,
      propertyName: guest.propertyName,
      hostName: guest.hostName,
      status,
      store: pick(random, STORES),
      deliveryDate: shiftDate(deliveryOffset),
      deliveryWindow: pick(random, ['9:00 AM – 12:00 PM', '12:00 – 3:00 PM', '3:00 – 6:00 PM', 'Before check-in']),
      items,
      estimatedAmount: estimated,
      actualAmount: actual,
      serviceFee: fee,
      total: (actual ?? estimated) + fee,
      tipPercent,
      tipAmount: tipPercent ? Math.round(((actual ?? estimated) + fee) * (tipPercent / 100)) : 0,
      shopper: ['shopping', 'on_the_way', 'delivered'].includes(status)
        ? pick(random, ['Marcus B.', 'Aisha T.', 'Cole H.', 'Renée D.', 'Dani P.'])
        : null,
      deliveryPhoto: status === 'delivered' ? PHOTO.groceryBags : null,
      notes: pick(random, NOTES),
      paymentId: ['paid', 'shopping', 'on_the_way', 'delivered'].includes(status) ? `pay_gr_${1000 + i}` : null,
      createdAt: shiftTime(createdOffset, between(random, 7, 21), between(random, 0, 59)),
      updatedAt: shiftTime(Math.min(0, createdOffset + 1), between(random, 8, 20), 0),
      cancelReason: status === 'cancelled' ? pick(random, ['Guest cancelled the trip', 'Duplicate request', 'Guest chose to shop themselves']) : null,
    }
  })
}

export const mockOrders = buildOrders()

export const orderById = (list, id) => list.find((o) => o.id === id) ?? null

export const ACTIVE_GROCERY = ['pending', 'confirmed', 'payment_required', 'paid', 'shopping', 'on_the_way']
