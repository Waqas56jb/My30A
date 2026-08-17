import { rng, between, pick, shiftTime } from './seed'

/**
 * Vitoria's knowledge base — the management surface only.
 *
 * Eventually this feeds a retrieval system: entries get embedded and Vitoria
 * cites them when she answers. None of that exists yet. What exists is the
 * editorial workflow around it, which is the part a human actually operates:
 * who wrote this, where did it come from, is it live, when was it last
 * touched. No vector database, no embeddings, no similarity search.
 */

export const KNOWLEDGE_SOURCES = {
  property: { label: 'Property', tone: 'info', icon: 'building' },
  partner: { label: 'Partner', tone: 'success', icon: 'sparkles' },
  admin: { label: 'Admin', tone: 'gold', icon: 'shield' },
  local_guide: { label: 'Local Guide', tone: 'sea', icon: 'compass' },
}

export const KNOWLEDGE_TYPES = [
  'Property information', 'House rules', 'FAQ', 'Emergency information',
  'Local recommendation', 'Service policy',
]

const ENTRIES = [
  ['How do I connect to the WiFi?', 'Property information', 'property', 'Each property publishes its own network name and password in the guest app under My Stay. If the network does not appear, the router is usually in the laundry cupboard or the hall closet; unplug for thirty seconds and plug back in.'],
  ['What time is check-in?', 'Property information', 'property', 'Standard check-in is 4:00 PM and check-out is 10:00 AM. Some properties allow earlier arrival — the app shows the actual time for the property the guest is in.'],
  ['Can we have a bonfire on the beach?', 'Local recommendation', 'local_guide', 'Walton County requires a permit for beach fires. Most guests use a licensed service that pulls the permit, brings wood and chairs, lights it and clears everything away. Never point a guest at an unpermitted fire.'],
  ['Are dogs allowed on the beach?', 'FAQ', 'admin', 'Dogs are not permitted on Walton County beaches. There are dog-friendly parks inland and several restaurants with dog-friendly patios.'],
  ['What is the closest hospital?', 'Emergency information', 'admin', 'Sacred Heart Emerald Coast, 7800 US-98, Miramar Beach. For anything urgent, escalate to the My30A team immediately rather than answering alone.'],
  ['How does grocery delivery work?', 'Service policy', 'admin', 'My30A runs this service directly. The guest sends a list and a delivery date, the team confirms an estimate, the guest pays the basket amount, a shopper delivers, and the service fee is charged on completion. Vitoria can create the request but never quotes a final total.'],
  ['How does an airport transfer work?', 'Service policy', 'admin', 'My30A runs this service directly from ECP, VPS and PNS. Vitoria collects the airport, flight, date, time, passengers and bags, shows an estimate, and creates the request. The card is authorised on confirmation and captured after the transfer.'],
  ['Can My30A book a golf cart for me?', 'Service policy', 'admin', 'No. Golf carts, bikes, boats, photography and similar are independent local partners. Vitoria shows the listing and the contact details; the guest arranges and pays with the business directly. Never promise availability or a price on a partner’s behalf.'],
  ['What is there to do when it rains?', 'Local recommendation', 'local_guide', 'The Sundog bookshop in Seaside, the Airstream food court, indoor climbing in Santa Rosa Beach, and the aquarium in Panama City Beach are the usual answers.'],
  ['Quiet hours', 'House rules', 'property', 'Most 30A properties set quiet hours from 10:00 PM. Sound carries between houses more than guests expect, so it is worth mentioning proactively on the first evening.'],
  ['Which beach accesses have parking?', 'Local recommendation', 'local_guide', 'Inlet Beach Regional Access, Ed Walline, Van Ness Butler and Gulfview Heights all have public parking. Most others are neighbourhood access with none.'],
  ['Where do I put the trash?', 'Property information', 'property', 'Bins live by the garage on most properties. Collection is Tuesday and Friday morning across most of the corridor.'],
  ['Can we get a late check-out?', 'FAQ', 'property', 'It depends on the turnover. Vitoria should never grant one — escalate to the host, who knows whether the cleaner is booked.'],
  ['Is the water safe to swim in?', 'FAQ', 'admin', 'Check the beach flag before answering. Double red means the water is closed. Vitoria should always state the flag system rather than say "yes".'],
  ['What is the cancellation policy for transfers?', 'Service policy', 'admin', '48 hours or more before pickup, full refund or the authorisation is released. 24–48 hours, a $50 fee. Same day or a no-show, a $75 fee. The remainder is refunded in every case.'],
  ['Recommended restaurants for a large group', 'Local recommendation', 'local_guide', 'Great Southern Cafe in Seaside, Restaurant Paradis in Rosemary, and Bud & Alley’s all handle six or more with notice. Suggest booking directly and early in August.'],
  ['Do you have car seats for transfers?', 'Service policy', 'admin', 'Yes, included at no extra charge, but the number and the children’s ages have to be collected when the request is made.'],
  ['Bike trail information', 'Local recommendation', 'local_guide', 'The Timpoochee Trail runs about nineteen flat miles alongside 30A from Dune Allen to Inlet Beach. Fully paved, safe for children, busiest between nine and eleven.'],
  ['What happens if the AC fails?', 'Emergency information', 'property', 'Escalate immediately. Do not troubleshoot beyond checking the thermostat batteries and the breaker — a failed compressor in August is a same-day dispatch, not a chat.'],
  ['Do partners pay to be listed?', 'Service policy', 'admin', 'Internal only, never repeated to guests: partners are listed at no cost and pay nothing for referrals. My30A does not take a commission on partner business and does not know whether a guest bought anything.'],
]

function buildKnowledge() {
  const random = rng(4409)
  return ENTRIES.map(([question, type, source, answer], i) => ({
    id: `kb_${String(i + 1).padStart(3, '0')}`,
    question,
    answer,
    type,
    source,
    tags: [type.split(' ')[0].toLowerCase(), source],
    enabled: random() > 0.1,
    usedCount: between(random, 12, 1840),
    author: pick(random, ['Operations', 'Content', 'Super Admin']),
    updatedAt: shiftTime(-between(random, 1, 180), between(random, 8, 19), 0),
  }))
}

export const mockKnowledge = buildKnowledge()

/**
 * Automations — scheduled Vitoria behaviours. Toggling one here is local state
 * only; nothing is scheduled, nothing sends.
 */
export const mockAutomations = [
  {
    id: 'auto_prearrival', name: 'Pre-arrival concierge', enabled: true,
    description: 'Vitoria introduces herself, confirms arrival details and offers groceries and a transfer before the guest lands.',
    trigger: '3 days before arrival', audience: 'Guests with an upcoming stay',
    lastRun: shiftTime(0, 7, 0), nextRun: shiftTime(1, 7, 0), runsThisMonth: 214,
  },
  {
    id: 'auto_notransfer', name: 'No transfer reminder', enabled: true,
    description: 'Nudges guests arriving within 48 hours who have not arranged a ride from the airport.',
    trigger: '48 hours before arrival, if no transfer exists', audience: 'Guests arriving soon',
    lastRun: shiftTime(0, 8, 30), nextRun: shiftTime(1, 8, 30), runsThisMonth: 96,
  },
  {
    id: 'auto_grocery', name: 'Grocery follow-up', enabled: true,
    description: 'Checks the delivery landed, shares the photo, and prompts a tip for the shopper.',
    trigger: '2 hours after a delivery is marked complete', audience: 'Guests with a delivered order',
    lastRun: shiftTime(0, 14, 10), nextRun: 'On the next delivery', runsThisMonth: 148,
  },
  {
    id: 'auto_review', name: 'Post-checkout review request', enabled: true,
    description: 'Asks for a rating of the stay and of any service used, the evening after check-out.',
    trigger: '8 hours after check-out', audience: 'Checked-out guests',
    lastRun: shiftTime(0, 18, 0), nextRun: shiftTime(1, 18, 0), runsThisMonth: 302,
  },
  {
    id: 'auto_partner', name: 'Partner follow-up', enabled: false,
    description: 'Asks whether the guest reached the partner they clicked through to. Off by default — it is the only way to learn anything about outcomes, but it also asks guests about business we did not handle.',
    trigger: '24 hours after an outbound partner click', audience: 'Guests who clicked a listing',
    lastRun: shiftTime(-46, 11, 0), nextRun: 'Paused', runsThisMonth: 0,
  },
  {
    id: 'auto_weekly', name: 'Weekly partner report', enabled: true,
    description: 'Emails each approved partner their views, website clicks, phone clicks and directions for the week.',
    trigger: 'Mondays at 8:00 AM', audience: 'Approved partners',
    lastRun: shiftTime(-3, 8, 0), nextRun: shiftTime(4, 8, 0), runsThisMonth: 4,
  },
  {
    id: 'auto_satisfaction', name: 'Guest satisfaction follow-up', enabled: false,
    description: 'Reaches out to any guest who rated a service 3 stars or lower, before they leave.',
    trigger: 'Rating of 3 or below', audience: 'Guests in residence',
    lastRun: shiftTime(-9, 16, 0), nextRun: 'Paused', runsThisMonth: 0,
  },
]
