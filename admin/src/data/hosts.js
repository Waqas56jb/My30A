import { rng, between, pick, pickWeighted, shiftDate, shiftTime, FIRST_NAMES, LAST_NAMES, TOWNS, emailFor, phoneFor } from './seed'

/**
 * Hosts — the people who own or manage the properties.
 *
 * A host is not a partner. Hosts pay My30A a subscription and get the guest
 * experience for their property; partners pay nothing and get a listing. The
 * two never share a screen, a table or a status vocabulary.
 */

export const HOST_STATUSES = {
  pending: { label: 'Pending', tone: 'warn', icon: 'clock' },
  active: { label: 'Active', tone: 'success', icon: 'checkCircle' },
  suspended: { label: 'Suspended', tone: 'muted', icon: 'alert' },
  rejected: { label: 'Rejected', tone: 'danger', icon: 'x' },
}

/**
 * Plans are seeded here but editable in Settings, because the commercial rules
 * are not final. Nothing in the UI should hardcode a price.
 */
export const DEFAULT_PLANS = [
  { id: 'plan_essential', name: 'Essential', price: 99, interval: 'month', properties: 1, blurb: 'One property, full guest experience, Vitoria included.' },
  { id: 'plan_concierge', name: 'Concierge', price: 199, interval: 'month', properties: 3, blurb: 'Up to three properties, priority operations, custom Vitoria tone.' },
  { id: 'plan_portfolio', name: 'Portfolio', price: 149, interval: 'month', properties: 5, blurb: 'Per-property rate for managers running five or more homes.' },
]

export const SUBSCRIPTION_STATUSES = {
  trial: { label: 'Trial', tone: 'info' },
  active: { label: 'Active', tone: 'success' },
  past_due: { label: 'Past due', tone: 'danger' },
  cancelled: { label: 'Cancelled', tone: 'muted' },
  paused: { label: 'Paused', tone: 'warn' },
}

const COMPANIES = [
  'Coastal Key Management', 'Emerald Stay Co.', 'Dune & Pine Rentals', '30A Home Collective',
  'Seagrass Property Group', 'Barefoot Hospitality', 'Watercolor Homes', 'Alys Retreats',
  null, null, null, null,
]

function buildHosts() {
  const random = rng(9013)
  return Array.from({ length: 34 }, (_, i) => {
    const firstName = FIRST_NAMES[(i * 7 + 3) % FIRST_NAMES.length]
    const lastName = LAST_NAMES[(i * 5 + 11) % LAST_NAMES.length]
    const status = i < 3
      ? 'pending'
      : pickWeighted(random, [['active', 82], ['suspended', 8], ['pending', 6], ['rejected', 4]])
    const plan = pickWeighted(random, [
      ['plan_essential', 52], ['plan_concierge', 30], ['plan_portfolio', 18],
    ])
    const subscription = status === 'active'
      ? pickWeighted(random, [['active', 74], ['trial', 12], ['past_due', 8], ['paused', 6]])
      : status === 'pending'
        ? 'trial'
        : 'cancelled'

    return {
      id: `host_${String(i + 1).padStart(3, '0')}`,
      firstName,
      lastName,
      name: `${firstName} ${lastName}`,
      email: emailFor(firstName, lastName, 'my30ahosts.com'),
      phone: phoneFor(random),
      company: pick(random, COMPANIES),
      town: pick(random, TOWNS),
      status,
      joinedAt: shiftTime(-between(random, 5, 720), between(random, 8, 19), 0),
      lastActiveAt: shiftTime(-between(random, 0, 21), between(random, 7, 22), 0),
      propertyCount: 0, // filled in by properties.js so the two can never disagree
      guestCount: between(random, 0, 68),
      satisfaction: status === 'active' ? Number((4.1 + random() * 0.85).toFixed(2)) : null,
      subscription: {
        planId: plan,
        status: subscription,
        amount: DEFAULT_PLANS.find((p) => p.id === plan).price,
        nextBillingDate: shiftDate(between(random, 1, 30)),
        trialEndsAt: subscription === 'trial' ? shiftDate(between(random, 2, 14)) : null,
        method: 'Visa •••• 4242',
        startedAt: shiftDate(-between(random, 30, 700)),
      },
      vitoria: {
        conversations: between(random, 0, 420),
        resolved: 0, // computed on read so it can never exceed conversations
        escalations: between(random, 0, 9),
      },
      notes: status === 'suspended'
        ? 'Suspended after two guests reported the door code had not been updated between stays.'
        : status === 'rejected'
          ? 'Property address is outside the 30A service area.'
          : '',
    }
  })
}

export const mockHosts = buildHosts().map((host) => ({
  ...host,
  vitoria: {
    ...host.vitoria,
    resolved: Math.max(0, host.vitoria.conversations - host.vitoria.escalations),
  },
}))

export const hostById = (list, id) => list.find((h) => h.id === id) ?? null
export const planById = (plans, id) => plans.find((p) => p.id === id) ?? null
