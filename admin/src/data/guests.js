import { mockProperties } from './properties'
import { mockHosts } from './hosts'
import { rng, between, pick, shiftDate, shiftTime, FIRST_NAMES, LAST_NAMES, emailFor, phoneFor, TODAY } from './seed'

/**
 * Guests — the people actually on holiday.
 *
 * Status is derived from the stay dates rather than stored, because a stored
 * status is a status that goes stale overnight. `TODAY` is pinned in seed.js
 * so the mix of active / upcoming / checked-out stays stable for demos.
 */

export const GUEST_STATUSES = {
  active: { label: 'In residence', tone: 'success', icon: 'checkCircle' },
  upcoming: { label: 'Upcoming', tone: 'info', icon: 'calendar' },
  checked_out: { label: 'Checked out', tone: 'muted', icon: 'logout' },
  inactive: { label: 'Inactive', tone: 'neutral', icon: 'circle' },
}

export const GUEST_ACCOUNT_STATUSES = {
  active: { label: 'Active', tone: 'success', icon: 'checkCircle' },
  blocked: { label: 'Blocked', tone: 'danger', icon: 'lock' },
}

export function guestStatus(guest) {
  if (!guest.checkIn || !guest.checkOut) return 'inactive'
  if (guest.checkOut < TODAY) return 'checked_out'
  if (guest.checkIn > TODAY) return 'upcoming'
  return 'active'
}

function buildGuests() {
  const random = rng(1607)
  const liveProperties = mockProperties.filter((p) => p.status === 'active')

  return Array.from({ length: 118 }, (_, i) => {
    const firstName = FIRST_NAMES[(i * 11 + 5) % FIRST_NAMES.length]
    const lastName = LAST_NAMES[(i * 13 + 2) % LAST_NAMES.length]
    const property = liveProperties[i % liveProperties.length]
    const host = mockHosts.find((h) => h.id === property.hostId)

    /* Spread the stays either side of TODAY: roughly a fifth in residence,
       a quarter arriving, the rest already gone. */
    const offset = between(random, -150, 45)
    const nights = between(random, 3, 10)
    const adults = between(random, 1, 6)
    const children = between(random, 0, 4)

    return {
      id: `guest_${String(i + 1).padStart(3, '0')}`,
      firstName,
      lastName,
      name: `${firstName} ${lastName}`,
      email: emailFor(firstName, lastName),
      phone: phoneFor(random),
      propertyId: property.id,
      propertyName: property.name,
      hostId: host.id,
      hostName: host.name,
      checkIn: shiftDate(offset),
      checkOut: shiftDate(offset + nights),
      nights,
      adults,
      children,
      partySize: adults + children,
      confirmationCode: `MY30A-${between(random, 1000, 9999)}`,
      returning: random() < 0.28,
      language: pick(random, ['English', 'English', 'English', 'Spanish', 'French', 'German']),
      lastActiveAt: shiftTime(-between(random, 0, 40), between(random, 7, 23), between(random, 0, 59)),
      joinedAt: shiftTime(-between(random, 5, 400), between(random, 8, 21), 0),
      stats: {
        conversations: between(random, 0, 26),
        messages: between(random, 0, 140),
        partnerViews: between(random, 0, 42),
        partnerClicks: between(random, 0, 14),
        serviceRequests: between(random, 0, 5),
        payments: between(random, 0, 4),
        tips: between(random, 0, 2),
      },
      rating: random() < 0.45 ? between(random, 3, 5) : null,
    }
  })
}

export const mockGuests = buildGuests()

export const guestById = (list, id) => list.find((g) => g.id === id) ?? null

/**
 * The lifecycle a single guest moves through. Assembled on read from whatever
 * records exist for them, so the timeline can never claim something the rest
 * of the panel disagrees with.
 */
const asLabel = (value, fallback = '') => {
  if (value == null || value === '') return fallback
  return String(value).replace(/_/g, ' ')
}

export function buildGuestTimeline(guest, { orders = [], transfers = [], conversations = [], payments = [] } = {}) {
  if (!guest) return []
  const stats = guest.stats ?? {}
  const events = [
    { at: guest.joinedAt, icon: 'user', title: 'Guest account created', body: `${guest.name} · ${guest.email}` },
    guest.checkIn && {
      at: shiftTime(0, 9, 0, guest.checkIn),
      icon: 'mail',
      title: 'Welcome message sent',
      body: `Access details for ${guest.propertyName ?? 'the property'}`,
    },
  ].filter(Boolean)

  ;(Array.isArray(conversations) ? conversations : []).slice(0, 3).forEach((c) => {
    events.push({
      at: c.createdAt,
      icon: 'sparkles',
      title: `Asked Vitoria about ${asLabel(c.topic, 'the stay').toLowerCase()}`,
      body: `${c.messageCount ?? 0} messages · ${c.status === 'escalated' ? 'escalated to the team' : 'resolved automatically'}`,
    })
  })

  ;(Array.isArray(orders) ? orders : []).forEach((o) => {
    const items = Array.isArray(o.items) ? o.items : []
    events.push({
      at: o.createdAt,
      icon: 'bag',
      title: 'Requested grocery delivery',
      body: `${o.id} · ${items.length} items · ${asLabel(o.status, 'pending')}`,
    })
  })

  ;(Array.isArray(transfers) ? transfers : []).forEach((t) => {
    events.push({
      at: t.createdAt,
      icon: 'car',
      title: 'Requested an airport transfer',
      body: `${t.airport ?? ''} · ${t.flightNumber ?? ''} · ${asLabel(t.status, 'pending')}`.replace(/\s·\s·/g, ' · '),
    })
  })

  if (Number(stats.partnerViews) > 0 && guest.checkIn) {
    events.push({
      at: shiftTime(1, 15, 20, guest.checkIn),
      icon: 'eye',
      title: 'Browsed local partners',
      body: `${stats.partnerViews} listings viewed, ${stats.partnerClicks ?? 0} outbound clicks`,
    })
  }

  ;(Array.isArray(payments) ? payments : []).slice(0, 3).forEach((p) => {
    events.push({
      at: p.createdAt,
      icon: 'creditCard',
      title: `Payment ${asLabel(p.status, '')}`,
      body: `${p.id} · ${asLabel(p.type, 'charge')}`,
    })
  })

  if (guestStatus(guest) === 'checked_out') {
    events.push({ at: shiftTime(0, 10, 0, guest.checkOut), icon: 'logout', title: 'Checked out', body: guest.propertyName })
    if (guest.rating) {
      events.push({ at: shiftTime(0, 18, 0, guest.checkOut), icon: 'star', title: `Rated the stay ${guest.rating} out of 5`, body: guest.propertyName })
    }
  }

  return events.filter((e) => e.at).sort((a, b) => (a.at < b.at ? 1 : -1))
}
