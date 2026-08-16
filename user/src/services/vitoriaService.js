/**
 * Vitoria — mock conversational service.
 *
 * Intent matching + templated replies stand in for the real model. The public
 * surface (`sendMessage(text, context)` → assistant message) is deliberately
 * the shape a Claude/OpenAI-backed endpoint will return, so swapping the
 * implementation does not touch the chat UI.
 *
 * A reply may carry:
 *   text     — markdown-ish plain text (newlines preserved)
 *   cards    — references to catalogue entities, rendered as rich mini-cards
 *   actions  — in-app routes Vitoria can take the guest to
 */

import { makeId } from '../utils/format'
import { mockLocalConditions } from '../data/mockRecommendations'
import { track, ANALYTICS_EVENTS } from './analytics'

const has = (text, ...words) => words.some((w) => text.includes(w))

/**
 * Ordered intent table — first match wins, so put specific intents above
 * general ones. Each `reply` receives the lowercased message plus context.
 */
const INTENTS = [
  {
    id: 'wifi',
    test: (t) => has(t, 'wifi', 'wi-fi', 'internet', 'password', 'network'),
    reply: ({ property }) => ({
      text: `The network is **${property?.wifi?.network ?? '30A-GUEST'}** and the password is **${property?.wifi?.password ?? 'BeachHouse2026'}**.\n\n${property?.wifi?.note ?? ''}\n\nIf a device will not connect, unplug the white router in the laundry closet for ten seconds — that fixes it nine times out of ten.`,
      actions: [{ label: 'Open My Stay', to: '/my-stay', icon: 'key' }],
    }),
  },
  {
    id: 'checkin',
    test: (t) =>
      has(t, 'check in', 'check-in', 'checkin', 'door code', 'get in', 'access', 'keypad', 'lock', 'arrive'),
    reply: ({ property, guest }) => ({
      text: `Check-in is at **${property?.checkIn ?? '4:00 PM'}** on ${
        guest?.stay?.checkInDate ? formatPlain(guest.stay.checkInDate) : 'arrival day'
      }.\n\nYour access is a ${property?.access?.method?.toLowerCase() ?? 'smart lock'} — code **${property?.access?.code ?? '2 0 4 8 #'}**. ${property?.access?.instructions ?? ''}\n\nParking: ${property?.access?.parking ?? ''}`,
      actions: [{ label: 'Full check-in guide', to: '/my-stay', icon: 'key' }],
    }),
  },
  {
    id: 'checkout',
    test: (t) => has(t, 'check out', 'check-out', 'checkout', 'leaving', 'departure day', 'late checkout'),
    reply: ({ property }) => ({
      text: `Check-out is **${property?.checkOut ?? '10:00 AM'}**.\n\nBefore you go: start the dishwasher, leave used towels in the downstairs bathtub, return the bikes to the carriage house, and set the thermostat to 78°.\n\nIf you want a later departure, tell me the time you are hoping for and I will ask your host — it usually depends on the next arrival.`,
      actions: [
        { label: 'Check-out checklist', to: '/my-stay', icon: 'key' },
        { label: 'Book my departure ride', to: '/transfers/new', icon: 'car' },
      ],
    }),
  },
  {
    id: 'kids_food',
    test: (t) =>
      (has(t, 'restaurant', 'eat', 'dinner', 'lunch', 'food', 'hungry', 'dine') &&
        has(t, 'kid', 'kids', 'child', 'children', 'family')) ||
      has(t, 'family restaurant', 'kid friendly'),
    reply: () => ({
      text: "For a family dinner, I recommend Great Southern Cafe in Seaside — real kids' menu, Gulf catch for the adults, and the amphitheatre right outside so nobody has to sit still for an hour.\n\nCloser to home, Cowgirl Kitchen is a four-minute walk and completely casual. And Pizza by the Sea will split toppings and box it up for the porch.\n\nOne thing worth flagging: with the shellfish allergy in your group, mention it to the host at Great Southern when you sit down — they are good about separate prep.",
      cards: [
        { kind: 'restaurant', refId: 'rest_great_southern' },
        { kind: 'restaurant', refId: 'rest_cowgirl_kitchen' },
        { kind: 'restaurant', refId: 'rest_pizza_bar' },
      ],
      actions: [{ label: 'Browse all restaurants', to: '/restaurants', icon: 'utensils' }],
    }),
  },
  {
    id: 'food',
    test: (t) =>
      has(t, 'restaurant', 'eat', 'dinner', 'lunch', 'breakfast', 'food', 'hungry', 'dine', 'reservation', 'coffee'),
    reply: (ctx, t) => {
      if (has(t, 'breakfast', 'coffee', 'morning')) {
        return {
          text: 'For breakfast, Cowgirl Kitchen is the four-minute walk and does a proper breakfast burrito. Amavida opens at 6:30 AM if you want coffee before everyone else is up.\n\nAnd if you can get out the door early, Black Bear Bread Co. in Grayton is worth the fifteen-minute drive — but the pastries are gone by 10:30 in August.',
          cards: [
            { kind: 'restaurant', refId: 'rest_cowgirl_kitchen' },
            { kind: 'restaurant', refId: 'rest_amavida' },
            { kind: 'restaurant', refId: 'rest_black_bear' },
          ],
          actions: [{ label: 'See all restaurants', to: '/restaurants', icon: 'utensils' }],
        }
      }
      return {
        text: "Tonight I would point you at three, depending on the mood.\n\nWalkable and grown-up: **Restaurant Paradis**, two minutes from your door, best wine list in Rosemary.\n\nGulf views and a rooftop: **Havana Beach Bar & Grill** — book ahead, the 7:30 slot goes first.\n\nWorth the drive: **The Red Bar** in Grayton, live jazz most nights, no reservations, so arrive by 5:30 PM.\n\nWant me to suggest something based on what you liked last August instead?",
        cards: [
          { kind: 'restaurant', refId: 'rest_restaurant_paradis' },
          { kind: 'restaurant', refId: 'rest_havana_beach' },
          { kind: 'restaurant', refId: 'rest_the_red_bar' },
        ],
        actions: [{ label: 'Browse all restaurants', to: '/restaurants', icon: 'utensils' }],
      }
    },
  },
  {
    id: 'beach',
    test: (t) => has(t, 'beach', 'sand', 'swim', 'ocean', 'gulf', 'walkover', 'access'),
    reply: ({ property }) => ({
      text: `The closest is the **${property?.beachAccess?.name ?? 'Barrett Square Walkover'}** — ${property?.beachAccess?.walkTime ?? 'about four minutes on foot'} straight down from the courtyard. ${property?.beachAccess?.note ?? ''}\n\nIf you want space, Deer Lake State Park is eight minutes by car and usually near-empty, though there are no facilities at all. Inlet Beach has the big lot and restrooms but fills by 9:30 AM in August.\n\nToday the flag is **${mockLocalConditions.beachFlag.label.toLowerCase()}** — ${mockLocalConditions.beachFlag.meaning.toLowerCase()}`,
      cards: [
        { kind: 'beach', refId: 'beach_rosemary_walkover' },
        { kind: 'beach', refId: 'beach_deer_lake' },
        { kind: 'beach', refId: 'beach_inlet' },
      ],
      actions: [{ label: 'Beach guide', to: '/beaches', icon: 'umbrella' }],
    }),
  },
  {
    id: 'transfer',
    test: (t) =>
      has(t, 'airport', 'pickup', 'pick up', 'transfer', 'flight', 'ecp', 'vps', 'pns', 'driver', 'ride'),
    reply: ({ guest }) => ({
      text: `Absolutely. I can help arrange your airport transfer.\n\nFrom **ECP** to Rosemary Beach is about a 35-minute drive. For ${guest?.partySize ?? 6} guests with luggage that is a Premium SUV at **$203** — your driver meets you at baggage claim with a sign and tracks the flight, so a delay does not cost you the ride.\n\nSend me the flight number and arrival time and I will put the request in. Nothing is charged until we confirm a driver, and card authorisation happens after that.`,
      actions: [
        { label: 'Request a transfer', to: '/transfers/new', icon: 'car' },
        { label: 'My transfers', to: '/transfers', icon: 'list' },
      ],
    }),
  },
  {
    id: 'grocery',
    test: (t) =>
      has(t, 'grocery', 'groceries', 'stock', 'kitchen', 'fridge', 'shopping list', 'publix', 'food delivery'),
    reply: () => ({
      text: "Happily. Send me a list — or pick one of my starter lists — and a shopper from 30A Provisions will have the kitchen stocked before you walk in.\n\nThe service fee is $39 plus delivery and the cost of the groceries themselves. Your shopper texts you about any substitutions, and cold items go straight into the fridge.\n\nI already know about the shellfish allergy and the vegetarian in your group, so I will flag both on the request.",
      actions: [
        { label: 'Start a grocery request', to: '/groceries/new', icon: 'bag' },
        { label: 'My grocery requests', to: '/groceries', icon: 'list' },
      ],
    }),
  },
  {
    id: 'kids',
    test: (t) => has(t, 'kid', 'kids', 'children', 'toddler', 'family activity', 'with the kids'),
    reply: () => ({
      text: "With a 7 and an 11 year old, three things work reliably.\n\n**Morning:** a group surf lesson at the Rosemary sandbar — the water is glassiest before 10 AM and most seven-year-olds stand up in the first session.\n\n**Afternoon:** the coastal dune lake eco tour. Ninety minutes, genuinely interesting, and there are usually alligators, which settles the matter.\n\n**Evening:** a bonfire on the sand. Our partner handles the permit, the wood, the chairs, and the cleanup — you just show up with marshmallows.",
      cards: [
        { kind: 'partner', refId: 'partner_activity_surf' },
        { kind: 'partner', refId: 'partner_activity_ecotour' },
        { kind: 'partner', refId: 'partner_bonfire_30a' },
      ],
      actions: [{ label: 'Explore things to do', to: '/explore', icon: 'compass' }],
    }),
  },
  {
    id: 'tonight',
    test: (t) => has(t, 'tonight', 'happening', 'event', 'events', 'live music', 'this week', 'to do tonight'),
    reply: () => ({
      text: "A few things during your stay.\n\n**Thursday** the Seaside concert series is free on the amphitheatre lawn — bring a blanket, grab dinner from the Airstreams.\n\n**Monday** there is a wine tasting on the Havana Beach rooftop, two minutes from the house. Twenty seats, adults only, and it does sell out.\n\n**Sunday morning** the Rosemary farmers market is on the north square — Gulf shrimp, pastries, easy with kids.",
      cards: [
        { kind: 'event', refId: 'event_seaside_concert' },
        { kind: 'event', refId: 'event_wine_tasting' },
        { kind: 'event', refId: 'event_farmers_market' },
      ],
      actions: [{ label: 'See all events', to: '/events', icon: 'ticket' }],
    }),
  },
  {
    id: 'bonfire',
    test: (t) => has(t, 'bonfire', 'fire pit', 'campfire', 's’more', "s'more", 'smore'),
    reply: () => ({
      text: `Beach bonfires need a Walton County permit, so this is one to book rather than improvise. 30A Beach Bonfires handles the permit, wood, chairs, and cleanup, from $225.\n\nSunset during your stay is around **${mockLocalConditions.sunset}** — I would set the fire for 7:00 PM so you get the light and the flames.`,
      cards: [{ kind: 'partner', refId: 'partner_bonfire_30a' }],
      actions: [{ label: 'View partner', to: '/partners/partner_bonfire_30a', icon: 'flame' }],
    }),
  },
  {
    id: 'bike',
    test: (t) => has(t, 'bike', 'bikes', 'cycling', 'e-bike', 'cruiser'),
    reply: ({ property }) => ({
      text: `Good news — ${property?.name ?? 'your house'} already includes six beach cruisers in the carriage house, and the keys are on the kitchen island.\n\nIf you need a trailer for the seven-year-old, a bigger frame, or e-bikes for the longer ride to Grayton, Beachside delivers to the driveway, usually within a couple of hours.`,
      cards: [
        { kind: 'partner', refId: 'partner_bike_beachside' },
        { kind: 'partner', refId: 'partner_bike_30a' },
      ],
    }),
  },
  {
    id: 'spa',
    test: (t) => has(t, 'massage', 'spa', 'yoga', 'facial', 'wellness', 'relax'),
    reply: () => ({
      text: 'Two options depending on whether you want to leave the house.\n\nSerenity Coastal Spa brings the table to you — same-day is realistic if you call before noon, from $160 for sixty minutes.\n\nOr Beach Flow Yoga runs a 7 AM class on the sand at your walkover. Three minutes from the front door, mats provided, no booking needed.',
      cards: [
        { kind: 'partner', refId: 'partner_spa_serenity' },
        { kind: 'partner', refId: 'partner_yoga_beach' },
      ],
    }),
  },
  {
    id: 'photo',
    test: (t) => has(t, 'photo', 'photographer', 'pictures', 'session', 'portrait'),
    reply: () => ({
      text: 'You have booked a sunrise session on every trip, so I checked — Dune & Light still has a Thursday 6:20 AM slot open. Forty-plus edited images in a private gallery within 72 hours, from $425.\n\nSunrise is at 6:22 AM during your stay, so that slot is exactly right.',
      cards: [
        { kind: 'partner', refId: 'partner_photo_dune' },
        { kind: 'partner', refId: 'partner_photo_saltair' },
      ],
    }),
  },
  {
    id: 'golf',
    test: (t) => has(t, 'golf', 'tee time', 'course', 'nine holes'),
    reply: () => ({
      text: 'Camp Creek is the best course near you — Tom Fazio, five minutes up the road, from $185. Call the shop the morning before; guest access depends on availability.\n\nShark\'s Tooth is more forgiving and cheaper, and the twilight rate after 3 PM is the value play if the heat is not a problem.',
      cards: [
        { kind: 'partner', refId: 'partner_golf_camp_creek' },
        { kind: 'partner', refId: 'partner_golf_shark' },
      ],
    }),
  },
  {
    id: 'boat',
    test: (t) => has(t, 'boat', 'charter', 'fishing', 'paddleboard', 'kayak', 'dolphin', 'crab island'),
    reply: () => ({
      text: 'For a family day on the water, a private pontoon from Baytowne is the easy answer — Crab Island, the dolphin grounds, and a sandbar stop, from $450 for a half day with the captain included.\n\nIf you want something closer and cheaper, Coastal Paddle drops boards at Western Lake. You paddleboarded last visit, so the guided sunrise paddle would be the step up.\n\nAnd if anyone wants to fish, go inshore rather than deep sea with a seven-year-old aboard.',
      cards: [
        { kind: 'partner', refId: 'partner_boat_baytowne' },
        { kind: 'partner', refId: 'partner_boat_paddle' },
        { kind: 'partner', refId: 'partner_fishing_emerald' },
      ],
    }),
  },
  {
    id: 'sitter',
    test: (t) => has(t, 'babysit', 'sitter', 'nanny', 'childcare', 'date night'),
    reply: () => ({
      text: 'Seaside Sitters is who I would use — background checked, CPR certified, four-hour minimum at $30 an hour. Book two days ahead for a weekend night in August.\n\nIf you want the dinner to match, Restaurant Paradis is a two-minute walk from your door, so you are never far.',
      cards: [
        { kind: 'partner', refId: 'partner_sitter_seaside' },
        { kind: 'restaurant', refId: 'rest_restaurant_paradis' },
      ],
    }),
  },
  {
    id: 'weather',
    test: (t) => has(t, 'weather', 'forecast', 'hot', 'rain', 'water temp', 'flag', 'surf'),
    reply: () => ({
      text: `Right now it is **${mockLocalConditions.weather.tempF}°F and ${mockLocalConditions.weather.condition.toLowerCase()}**, with a high of ${mockLocalConditions.weather.high}° today. Water temperature is ${mockLocalConditions.water.tempF}° — warm enough that nobody hesitates going in.\n\nThe beach flag is **${mockLocalConditions.beachFlag.label.toLowerCase()}**: ${mockLocalConditions.beachFlag.meaning.toLowerCase()}\n\nSunrise ${mockLocalConditions.sunrise}, sunset ${mockLocalConditions.sunset}. ${mockLocalConditions.tide}.`,
    }),
  },
  {
    id: 'sunset',
    test: (t) => has(t, 'sunset', 'sunrise', 'golden hour'),
    reply: () => ({
      text: `Sunset is at **${mockLocalConditions.sunset}** and sunrise at **${mockLocalConditions.sunrise}**.\n\nThe best sunset within walking distance is the Barrett Square walkover — go left at the bottom and it thins out. For a drink with the view, the Havana Beach rooftop is the one. Old Florida Fish House has the best table on the water if you want dinner with it, though it is a ten-minute drive.`,
      cards: [
        { kind: 'restaurant', refId: 'rest_havana_beach' },
        { kind: 'restaurant', refId: 'rest_old_florida_fish' },
      ],
    }),
  },
  {
    id: 'parking',
    test: (t) => has(t, 'parking', 'park the car', 'garage', 'driveway'),
    reply: ({ property }) => ({
      text: `${property?.access?.parking ?? 'Two spaces in the driveway.'}\n\nMost of Rosemary Beach is permit-only after hours, so the driveway and the Western Green lot are your two safe options.`,
      actions: [{ label: 'Property details', to: '/my-stay', icon: 'key' }],
    }),
  },
  {
    id: 'rules',
    test: (t) => has(t, 'rule', 'rules', 'quiet hours', 'smoking', 'pets', 'dog', 'trash', 'garbage'),
    reply: ({ property }) => ({
      text: `The essentials: ${(property?.houseRules ?? []).slice(0, 3).join(' ')}\n\n${property?.access?.trash ?? ''}\n\nThe full list is in My Stay if you want to read it properly.`,
      actions: [{ label: 'House rules', to: '/my-stay', icon: 'key' }],
    }),
  },
  {
    id: 'emergency',
    test: (t) => has(t, 'emergency', 'hospital', 'doctor', 'urgent care', 'police', 'ambulance', 'hurt'),
    reply: ({ property }) => ({
      text: `For anything urgent, call **911** first.\n\nThe nearest emergency room is Ascension Sacred Heart in Miramar Beach, ${property?.emergency?.[3]?.value ?? '(850) 278-3000'} — about 25 minutes west. For anything smaller, there is an urgent care in Inlet Beach that takes walk-ins until 8 PM.\n\nYour host Michael is at ${property?.host?.phone ?? '(850) 555-0142'} and usually replies within an hour.`,
      actions: [{ label: 'Emergency contacts', to: '/my-stay', icon: 'shield' }],
    }),
  },
  {
    id: 'host',
    test: (t) => has(t, 'host', 'michael', 'owner', 'manager', 'contact'),
    reply: ({ property }) => ({
      text: `Your host is **${property?.host?.name ?? 'Michael Reyes'}** of ${property?.host?.company ?? 'Coastal Key Property Group'}. You can reach him at ${property?.host?.phone ?? '(850) 555-0142'} or ${property?.host?.email ?? 'michael@coastalkey30a.com'} — ${property?.host?.responseTime?.toLowerCase() ?? 'he usually replies within an hour'}.\n\nFor anything about the house itself I can usually answer faster, so try me first.`,
      actions: [{ label: 'Host details', to: '/my-stay', icon: 'user' }],
    }),
  },
  {
    id: 'greeting',
    test: (t) => /^(hi|hey|hello|good morning|good evening|yo|thanks|thank you|ok|okay)\b/.test(t.trim()),
    reply: ({ guest }, t) =>
      has(t, 'thank')
        ? { text: 'Any time. I am here all week — just ask.' }
        : {
            text: `Hello ${guest?.firstName ?? 'there'}. What can I take off your plate?\n\nI can sort dinner, stock the kitchen, arrange your airport pickup, or just tell you which beach will be least busy this afternoon.`,
            actions: [
              { label: 'Where to eat', to: '/restaurants', icon: 'utensils' },
              { label: 'Stock the kitchen', to: '/groceries/new', icon: 'bag' },
            ],
          },
  },
]

const formatPlain = (dateStr) => {
  const [y, m, d] = String(dateStr).split('-').map(Number)
  if (!y) return dateStr
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

const FALLBACK = ({ guest }) => ({
  text: `That one I want to get right rather than guess at, ${guest?.firstName ?? 'friend'}.\n\nI can help with anything about the house — WiFi, door codes, check-out — or anything on 30A: restaurants, beaches, activities, groceries, and airport transfers. Tell me a bit more and I will point you the right way.\n\nIf it is time-sensitive, your host Michael is one tap away.`,
  actions: [
    { label: 'Explore 30A', to: '/explore', icon: 'compass' },
    { label: 'My Stay', to: '/my-stay', icon: 'key' },
  ],
})

/**
 * Typing delay scales with reply length, capped so it never feels broken.
 * `setTypingDelay` overrides it (the harness zeroes it out).
 */
let typingDelayOverride = null

export const setTypingDelay = (ms) => {
  typingDelayOverride = ms
}

export const typingDelayFor = (text = '') =>
  typingDelayOverride ?? Math.min(2200, 620 + text.length * 3.2)

/** Build a user message record. */
export const createUserMessage = (text) => ({
  id: makeId('msg'),
  role: 'user',
  at: new Date().toISOString(),
  text: text.trim(),
})

/**
 * Produce Vitoria's reply. Returns { message, delay } so the caller controls
 * when the typing indicator resolves.
 */
export function generateReply(text, context = {}) {
  const normalised = String(text || '').toLowerCase()
  const intent = INTENTS.find((i) => i.test(normalised)) ?? { id: 'fallback', reply: FALLBACK }
  const payload = intent.reply(context, normalised) ?? {}
  const message = {
    id: makeId('msg'),
    role: 'assistant',
    at: new Date().toISOString(),
    text: payload.text ?? '',
    cards: payload.cards ?? [],
    actions: payload.actions ?? [],
    intent: intent.id,
  }
  return { message, delay: typingDelayFor(message.text) }
}

/**
 * Async facade matching a future streaming endpoint.
 * `onTyping` fires immediately; the promise resolves with the reply.
 */
export async function sendMessage(text, context = {}, { onTyping } = {}) {
  track(ANALYTICS_EVENTS.VITORIA_MESSAGE_SENT, {
    length: String(text).length,
    guestId: context?.guest?.id,
  })
  const { message, delay } = generateReply(text, context)
  onTyping?.(true)
  await new Promise((resolve) => setTimeout(resolve, delay))
  onTyping?.(false)
  return message
}

/** Opening line used when a guest lands in an empty thread. */
export function greetingFor(guest, property) {
  const name = guest?.firstName ?? 'there'
  if (guest?.returning) {
    return {
      id: makeId('msg'),
      role: 'assistant',
      at: new Date().toISOString(),
      text: `Welcome back, ${name}. I have you at ${property?.name ?? 'your property'} and everything is ready.\n\nSince you enjoyed seafood last time, I found a few new options nearby — or I can start with groceries and your airport pickup, which are usually the two things worth sorting first.`,
      cards: [{ kind: 'restaurant', refId: 'rest_old_florida_fish' }],
      actions: [
        { label: 'Stock the kitchen', to: '/groceries/new', icon: 'bag' },
        { label: 'Arrange my pickup', to: '/transfers/new', icon: 'car' },
      ],
    }
  }
  return {
    id: makeId('msg'),
    role: 'assistant',
    at: new Date().toISOString(),
    text: `Hello ${name} — I am Vitoria, your concierge for ${property?.community ?? '30A'}.\n\nI know this house and this stretch of coast well. Ask me anything: the WiFi password, where to eat tonight, which beach will be quiet this afternoon, or a ride from the airport.`,
    actions: [
      { label: 'Where to eat', to: '/restaurants', icon: 'utensils' },
      { label: 'Explore 30A', to: '/explore', icon: 'compass' },
    ],
  }
}
