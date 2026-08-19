import { mockGuests } from './guests'
import { rng, between, pick, pickWeighted, shiftTime } from './seed'

/**
 * Vitoria conversations.
 *
 * Vitoria is not decoration — she creates real work. A guest who says "I land
 * at ECP Thursday at 2" ends up as a transfer request in the operations queue,
 * and `createdRequest` below is the link between the two. That is why admin
 * needs to see conversations at all.
 */

export const CONVERSATION_STATUSES = {
  resolved: { label: 'Resolved', tone: 'success' },
  active: { label: 'Active', tone: 'info' },
  escalated: { label: 'Escalated', tone: 'warn' },
  abandoned: { label: 'Abandoned', tone: 'muted' },
}

export const TOPICS = [
  'WiFi', 'Check-in', 'Check-out', 'Restaurant', 'Beach', 'Golf Cart', 'Bonfire',
  'Grocery', 'Airport Transfer', 'House Rules', 'Emergency', 'General',
]

/** Short, believable exchanges — enough to show the shape, never a real person's data. */
const SCRIPTS = {
  WiFi: [
    ['guest', 'What’s the wifi password?'],
    ['vitoria', 'The network is {wifi} and the password is on the fridge card — I can send it here too. Signal is weakest in the bunk room; the router is in the laundry cupboard if it needs a restart.'],
    ['guest', 'Got it, thanks.'],
  ],
  'Check-in': [
    ['guest', 'We’re running late, is that a problem?'],
    ['vitoria', 'Not at all — the keypad works whenever you arrive. Check-in is from 4:00 PM and the code is in your arrival message. I’ll let your host know you’ll be in around 9.'],
  ],
  Restaurant: [
    ['guest', 'Somewhere good for six tonight, kids included?'],
    ['vitoria', 'Great Southern Cafe in Seaside handles six well and the grouper is the reason to go. Two minutes away by cart. Shall I show you the number?'],
    ['guest', 'Yes please.'],
    ['vitoria', 'Here it is — you book directly with them, they hold tables until 7:30 in August.'],
  ],
  Beach: [
    ['guest', 'Which beach access is quietest in the afternoon?'],
    ['vitoria', 'Inlet Beach Regional Access thins out after three, and there is real parking. Walk twenty metres east of the boardwalk and you will have the stretch mostly to yourselves.'],
  ],
  'Golf Cart': [
    ['guest', 'Can we get a golf cart for the week?'],
    ['vitoria', '30A Golf Cart Rentals deliver to the driveway and start around $165 a day for a six-seater. You arrange it with them directly — here is their number and site.'],
  ],
  Bonfire: [
    ['guest', 'How do bonfires work here? Can we just light one?'],
    ['vitoria', 'You need a Walton County permit, so most people use a service. Glow & Flow set up the permit, wood, chairs and clear it all away — from about $275. I can show you their listing.'],
  ],
  Grocery: [
    ['guest', 'Can you have the fridge stocked before we land?'],
    ['vitoria', 'Yes — that one we handle ourselves. Send me the list and a delivery date and I will get it to the concierge team.'],
    ['guest', 'Coffee, milk, eggs, bread, fruit, and something for the kids’ lunches. Thursday before 3.'],
    ['vitoria', 'Done — request created. Someone will confirm the estimate with you within the hour.'],
  ],
  'Airport Transfer': [
    ['guest', 'I’m arriving at ECP Thursday at 2 PM. Can you arrange a pickup?'],
    ['vitoria', 'I can. How many of you, and roughly how many bags?'],
    ['guest', 'Four adults, two kids, six bags.'],
    ['vitoria', 'An SUV covers that — about $203 from ECP, meeting you at baggage claim with the flight tracked. Shall I put the request in?'],
    ['guest', 'Yes please.'],
    ['vitoria', 'Request created. The team will confirm a vehicle and then ask you to authorise the card — a hold, not a charge.'],
  ],
  Emergency: [
    ['guest', 'The AC has stopped working and it is 33 degrees in here.'],
    ['vitoria', 'I am sorry — that one needs a person. I have escalated to the My30A team and messaged your host with the property and unit details. Someone will call you within fifteen minutes.'],
  ],
  'House Rules': [
    ['guest', 'Are we allowed to have friends over for dinner?'],
    ['vitoria', 'Guests during the day are fine. The house asks for no parties or events without the host’s written approval, and quiet hours start at 10:00 PM — sound really does carry between these houses.'],
  ],
  'Check-out': [
    ['guest', 'What do we need to do before we leave?'],
    ['vitoria', 'Strip the beds, start the dishwasher, take the trash to the bin by the garage, and leave the keypad code as it is. Check-out is 10:00 AM — no need to message anyone.'],
  ],
  General: [
    ['guest', 'Is there anything on this week worth going to?'],
    ['vitoria', 'The Seaside Summer Concert Series is on the amphitheatre lawn Thursday at 7, free, bring a blanket. Farmers market Saturday morning in Rosemary.'],
  ],
}

function buildConversations() {
  const random = rng(7742)
  const guests = mockGuests

  return Array.from({ length: 520 }, (_, i) => {
    const guest = guests[(i * 5 + 2) % guests.length]
    const topic = pickWeighted(random, [
      ['Restaurant', 15], ['WiFi', 12], ['Beach', 11], ['Check-in', 10],
      ['Golf Cart', 9], ['General', 9], ['Grocery', 8], ['Airport Transfer', 8],
      ['Bonfire', 6], ['House Rules', 6], ['Check-out', 4], ['Emergency', 2],
    ])
    const status = topic === 'Emergency'
      ? 'escalated'
      : pickWeighted(random, [['resolved', 88], ['active', 6], ['escalated', 3], ['abandoned', 3]])

    const script = SCRIPTS[topic] ?? SCRIPTS.General
    const createdOffset = -between(random, 0, 150)

    return {
      id: `conv_${String(i + 1).padStart(4, '0')}`,
      guestId: guest.id,
      guestName: guest.name,
      propertyId: guest.propertyId,
      propertyName: guest.propertyName,
      language: guest.language,
      topic,
      status,
      messageCount: script.length + between(random, 0, 6),
      responseSeconds: between(random, 1, 9),
      satisfaction: status === 'resolved' && random() < 0.6 ? between(random, 4, 5) : null,
      createdAt: shiftTime(createdOffset, between(random, 6, 23), between(random, 0, 59)),
      createdRequest:
        topic === 'Airport Transfer' && random() < 0.7
          ? { kind: 'transfer', label: 'Airport transfer request' }
          : topic === 'Grocery' && random() < 0.7
            ? { kind: 'grocery', label: 'Grocery delivery request' }
            : null,
      messages: script.map(([role, text], n) => ({
        id: `m_${i}_${n}`,
        role,
        text: text.replace('{wifi}', `${guest.propertyName.split(' ')[0]}_Guest`),
        at: shiftTime(createdOffset, between(random, 6, 23), n * 2),
      })),
    }
  })
}

export const mockConversations = buildConversations()

export const conversationById = (list, id) => list.find((c) => c.id === id) ?? null

/**
 * Headline AI numbers, computed rather than typed, so they always agree with
 * the conversation table underneath them.
 */
export function vitoriaSummary(conversations = []) {
  const list = Array.isArray(conversations) ? conversations : []
  const num = (value) => {
    const n = Number(value)
    return Number.isFinite(n) ? n : 0
  }
  const total = list.length
  const escalated = list.filter((c) => c.status === 'escalated').length
  const resolved = list.filter((c) => c.status === 'resolved').length
  const active = list.filter((c) => c.status === 'active').length
  const messages = list.reduce((sum, c) => {
    const fromCount = num(c.messageCount)
    const fromList = Array.isArray(c.messages) ? c.messages.length : 0
    return sum + (fromCount || fromList)
  }, 0)
  const withReply = list.filter((c) => num(c.responseSeconds) > 0)
  const avgResponse = withReply.length
    ? withReply.reduce((sum, c) => sum + num(c.responseSeconds), 0) / withReply.length
    : 0
  const rated = list.filter((c) => num(c.satisfaction) > 0)

  return {
    total,
    messages,
    active,
    resolved,
    escalated,
    automatedRate: total ? (total - escalated) / total : 0,
    escalationRate: total ? escalated / total : 0,
    avgResponse,
    satisfaction: rated.length
      ? rated.reduce((sum, c) => sum + num(c.satisfaction), 0) / rated.length
      : 0,
    languages: [...new Set(list.map((c) => c.language).filter(Boolean))],
    requestsCreated: list.filter((c) => c.createdRequest).length,
  }
}

export function topicBreakdown(conversations = []) {
  const counts = new Map()
  ;(Array.isArray(conversations) ? conversations : []).forEach((c) => {
    const topic = c.topic || 'General'
    counts.set(topic, (counts.get(topic) ?? 0) + 1)
  })
  return [...counts.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
}
