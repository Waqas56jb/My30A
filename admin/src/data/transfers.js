import { mockGuests } from './guests'
import { rng, between, pick, pickWeighted, shiftDate, shiftTime, TODAY } from './seed'

/**
 * Airport transfers.
 *
 * Also a My30A-managed service, but the money moves differently from grocery:
 * the card is *authorised* when the transfer is confirmed and only *captured*
 * once the driver has finished. That distinction is the whole reason the
 * status list has both "Payment authorized" and "Completed" in it.
 */

export const TRANSFER_STATUSES = {
  pending: { label: 'Pending', tone: 'warn', step: 1, next: 'confirmed', nextLabel: 'Confirm transfer' },
  confirmed: { label: 'Confirmed', tone: 'info', step: 2, next: 'payment_authorized', nextLabel: 'Request authorisation' },
  payment_authorized: { label: 'Payment authorised', tone: 'info', step: 3, next: 'driver_assigned', nextLabel: 'Assign a driver' },
  driver_assigned: { label: 'Driver assigned', tone: 'info', step: 4, next: 'in_progress', nextLabel: 'Mark in progress' },
  in_progress: { label: 'In progress', tone: 'info', step: 5, next: 'completed', nextLabel: 'Mark completed' },
  completed: { label: 'Completed', tone: 'success', step: 6, next: null, nextLabel: null },
  cancelled: { label: 'Cancelled', tone: 'muted', step: 0, next: null, nextLabel: null },
  no_show: { label: 'No show', tone: 'danger', step: 0, next: null, nextLabel: null },
}

export const TRANSFER_FLOW = [
  'pending', 'confirmed', 'payment_authorized', 'driver_assigned', 'in_progress', 'completed',
]

export const AIRPORTS = [
  { code: 'ECP', name: 'Northwest Florida Beaches', drive: '45 min', base: 165 },
  { code: 'VPS', name: 'Destin–Fort Walton Beach', drive: '55 min', base: 185 },
  { code: 'PNS', name: 'Pensacola International', drive: '1 hr 40 min', base: 265 },
]

export const VEHICLES = [
  { id: 'sedan', name: 'Sedan', seats: 3, multiplier: 1 },
  { id: 'suv', name: 'SUV', seats: 6, multiplier: 1.23 },
  { id: 'sprinter', name: 'Sprinter Van', seats: 12, multiplier: 1.73 },
]

/**
 * Cancellation rules. Editable in Settings; the fee is deducted and the
 * balance refunded, or the authorisation is simply released if nothing was
 * captured yet.
 */
export const DEFAULT_CANCELLATION_RULES = [
  { id: 'rule_48', label: '48 hours or more before pickup', hours: 48, fee: 0, note: 'Full refund, or the card authorisation is released.' },
  { id: 'rule_24', label: '24–48 hours before pickup', hours: 24, fee: 50, note: '$50 fee, the remainder is refunded.' },
  { id: 'rule_0', label: 'Same day, or a no-show', hours: 0, fee: 75, note: '$75 fee, the remainder is refunded.' },
]

export function cancellationFor(rules, hoursUntilPickup) {
  const sorted = [...rules].sort((a, b) => b.hours - a.hours)
  return sorted.find((r) => hoursUntilPickup >= r.hours) ?? sorted[sorted.length - 1]
}

const AIRLINES = ['DL', 'AA', 'UA', 'WN', 'B6', 'AS', 'NK', 'F9']
const DRIVERS = ['Anthony P.', 'Marcus B.', 'Yolanda R.', 'Dev S.', 'Carla M.', 'Ruben O.']

function buildTransfers() {
  const random = rng(5507)
  const guests = mockGuests

  return Array.from({ length: 64 }, (_, i) => {
    const guest = guests[(i * 3 + 1) % guests.length]
    const airport = pick(random, AIRPORTS)
    const vehicle = pick(random, VEHICLES)
    const passengers = between(random, 1, vehicle.seats)

    /* Bracket first, then status — same reason as the grocery orders: a purely
       uniform age distribution leaves the queue almost empty. */
    const bracket = pickWeighted(random, [['upcoming', 34], ['today', 14], ['past', 52]])
    const pickupOffset =
      bracket === 'upcoming'
        ? between(random, 2, 12)
        : bracket === 'today'
          ? between(random, -1, 1)
          : -between(random, 2, 80)
    const createdOffset = pickupOffset - between(random, 1, 9)

    const status =
      bracket === 'upcoming'
        ? pickWeighted(random, [['pending', 30], ['confirmed', 24], ['payment_authorized', 26], ['driver_assigned', 20]])
        : bracket === 'today'
          ? pickWeighted(random, [['driver_assigned', 30], ['in_progress', 22], ['completed', 38], ['cancelled', 10]])
          : pickWeighted(random, [['completed', 82], ['cancelled', 12], ['no_show', 6]])

    const amount = Math.round(airport.base * vehicle.multiplier)
    const tipPercent = status === 'completed' ? pick(random, [0, 0, 10, 18, 20, 20]) : 0

    return {
      id: `TR-${2000 + i}`,
      guestId: guest.id,
      guestName: guest.name,
      propertyId: guest.propertyId,
      propertyName: guest.propertyName,
      hostName: guest.hostName,
      direction: pick(random, ['arrival', 'arrival', 'arrival', 'departure']),
      airport: airport.code,
      airportName: airport.name,
      flightNumber: `${pick(random, AIRLINES)} ${between(random, 100, 4999)}`,
      pickupDate: shiftDate(pickupOffset),
      pickupTime: `${between(random, 6, 22)}:${pick(random, ['00', '15', '30', '45'])}`,
      passengers,
      bags: between(random, 1, passengers + 3),
      childSeats: between(random, 0, 2),
      vehicleId: vehicle.id,
      vehicleName: vehicle.name,
      amount,
      tipPercent,
      tipAmount: tipPercent ? Math.round(amount * (tipPercent / 100)) : 0,
      status,
      driver: ['driver_assigned', 'in_progress', 'completed'].includes(status) ? pick(random, DRIVERS) : null,
      paymentId: ['payment_authorized', 'driver_assigned', 'in_progress', 'completed'].includes(status)
        ? `pay_tr_${2000 + i}`
        : null,
      createdBy: random() < 0.62 ? 'vitoria' : 'guest',
      notes: random() < 0.3 ? 'Two car seats needed, ages 3 and 6.' : '',
      createdAt: shiftTime(createdOffset, between(random, 7, 22), between(random, 0, 59)),
      cancelReason: ['cancelled', 'no_show'].includes(status)
        ? pick(random, ['Flight cancelled', 'Guest arranged their own ride', 'Guest never came to the pickup point'])
        : null,
    }
  })
}

export const mockTransfers = buildTransfers()

export const transferById = (list, id) => list.find((t) => t.id === id) ?? null

export const ACTIVE_TRANSFER = [
  'pending', 'confirmed', 'payment_authorized', 'driver_assigned', 'in_progress',
]

/** Hours from now until pickup, used to pick the cancellation tier. */
export function hoursUntilPickup(transfer, today = TODAY) {
  const date = transfer?.pickupDate || transfer?.date
  const rawTime = String(transfer?.pickupTime || transfer?.time || '12:00')
  const time = rawTime.length >= 5 ? rawTime.slice(0, 5) : rawTime.padStart(5, '0')
  if (!date) return 0
  const pickup = new Date(`${date}T${time}:00Z`)
  if (Number.isNaN(pickup.getTime())) return 0
  const now = new Date(`${today}T09:00:00Z`)
  return Math.round((pickup - now) / 36e5)
}
