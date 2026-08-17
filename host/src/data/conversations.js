/**
 * Vitoria conversation summaries as the host sees them.
 *
 * The host is not a support agent — they get a summary, the topic, whether
 * Vitoria could answer, and the transcript only when they open one. Anything
 * Vitoria could not answer is flagged, because that is a gap in the property
 * information the host can actually fix.
 */
export const mockConversations = [
  {
    id: 'conv_1',
    propertyId: 'prop_rosemary',
    guestId: 'guest_sarah',
    guestName: 'Sarah Whitmore',
    topic: 'Restaurants',
    summary: 'Asked for a family dinner recommendation; suggested Great Southern, Cowgirl Kitchen and Pizza by the Sea.',
    at: '2026-08-17T18:40:00',
    messages: 6,
    resolved: true,
    escalated: false,
    rating: 5,
    transcript: [
      { role: 'guest', text: "What's the best restaurant nearby for kids?", at: '2026-08-17T18:40:00' },
      {
        role: 'vitoria',
        text: 'For a family dinner I would start with Great Southern Cafe in Seaside — proper kids menu and the amphitheatre right outside. Closer to the house, Cowgirl Kitchen is a four-minute walk and completely relaxed.',
        at: '2026-08-17T18:40:00',
      },
      { role: 'guest', text: 'Can we walk to any of them?', at: '2026-08-17T18:42:00' },
      {
        role: 'vitoria',
        text: 'Cowgirl Kitchen and Restaurant Paradis are both a two to four minute walk from Barrett Square. Your host recommends Paradis for a grown-up dinner and suggests asking for the corner banquette.',
        at: '2026-08-17T18:42:00',
      },
    ],
  },
  {
    id: 'conv_2',
    propertyId: 'prop_rosemary',
    guestId: 'guest_daniel',
    guestName: 'Daniel Okafor',
    topic: 'Check-in',
    summary: 'Asked for the door code on arrival; answered from property information.',
    at: '2026-08-14T15:40:00',
    messages: 4,
    resolved: true,
    escalated: false,
    rating: 5,
    transcript: [
      { role: 'guest', text: 'We just arrived, what is the door code?', at: '2026-08-14T15:40:00' },
      {
        role: 'vitoria',
        text: 'Your code is 2048#. Press the star key once to wake the lock, enter the code, then press #. The courtyard gate uses the same code — that is the tall wooden door on the left.',
        at: '2026-08-14T15:40:00',
      },
      { role: 'guest', text: 'Got it, thanks', at: '2026-08-14T15:41:00' },
    ],
  },
  {
    id: 'conv_3',
    propertyId: 'prop_rosemary',
    guestId: 'guest_daniel',
    guestName: 'Daniel Okafor',
    topic: 'Parking',
    summary: 'Asked where the second car should go overnight. Vitoria could not confirm — property has no overflow guidance.',
    at: '2026-08-15T21:10:00',
    messages: 5,
    resolved: false,
    escalated: true,
    rating: 3,
    transcript: [
      { role: 'guest', text: 'Where can we put a second car overnight?', at: '2026-08-15T21:10:00' },
      {
        role: 'vitoria',
        text: 'The driveway holds two cars and Rosemary Beach patrol tickets on Barrett Square after 9 PM. I do not have confirmed overflow parking for this property — I have flagged it to your host so they can add it.',
        at: '2026-08-15T21:11:00',
      },
      { role: 'guest', text: 'No problem, we will move it in the morning', at: '2026-08-15T21:12:00' },
    ],
  },
  {
    id: 'conv_4',
    propertyId: 'prop_rosemary',
    guestId: 'guest_sarah',
    guestName: 'Sarah Whitmore',
    topic: 'Groceries',
    summary: 'Started a grocery request for arrival day; submitted successfully.',
    at: '2026-08-17T14:05:00',
    messages: 7,
    resolved: true,
    escalated: false,
    rating: 5,
    transcript: [
      { role: 'guest', text: 'Can you stock the kitchen before we arrive?', at: '2026-08-17T14:05:00' },
      {
        role: 'vitoria',
        text: 'Happily. Send me a list, or pick one of my starter lists, and a local shopper will have the kitchen stocked before you walk in. Service fee is $39 plus delivery and the cost of the groceries.',
        at: '2026-08-17T14:05:00',
      },
    ],
  },
  {
    id: 'conv_5',
    propertyId: 'prop_seaside',
    guestId: 'guest_amelia',
    guestName: 'Amelia Cruz',
    topic: 'Events',
    summary: 'Asked what was on at the amphitheatre; pointed at the Thursday concert series.',
    at: '2026-08-17T19:55:00',
    messages: 3,
    resolved: true,
    escalated: false,
    rating: 5,
    transcript: [
      { role: 'guest', text: 'Anything on tonight?', at: '2026-08-17T19:55:00' },
      {
        role: 'vitoria',
        text: 'The Seaside concert series is on the amphitheatre lawn at 7 PM and it is free — you are about ninety seconds away. Grab dinner from the Airstreams and bring a blanket.',
        at: '2026-08-17T19:55:00',
      },
    ],
  },
  {
    id: 'conv_6',
    propertyId: 'prop_rosemary',
    guestId: 'guest_thompson',
    guestName: 'The Thompson Family',
    topic: 'Bonfires',
    summary: 'Asked about arranging a bonfire; referred to the host’s recommended provider.',
    at: '2026-08-09T16:20:00',
    messages: 5,
    resolved: true,
    escalated: false,
    rating: 5,
    transcript: [
      { role: 'guest', text: 'Can we do a bonfire on the beach?', at: '2026-08-09T16:20:00' },
      {
        role: 'vitoria',
        text: 'Yes, but it needs a Walton County permit, so it is one to book rather than improvise. Your host recommends 30A Beach Bonfires — they handle the permit, wood, chairs and cleanup, from $225. Set it for 7 PM and you get the light and the fire.',
        at: '2026-08-09T16:21:00',
      },
    ],
  },
  {
    id: 'conv_7',
    propertyId: 'prop_rosemary',
    guestId: 'guest_park',
    guestName: 'Jae Park',
    topic: 'WiFi',
    summary: 'Reported weak WiFi in the tower room. Vitoria gave the router restart steps but flagged a coverage gap.',
    at: '2026-07-30T22:05:00',
    messages: 6,
    resolved: false,
    escalated: true,
    rating: 3,
    transcript: [
      { role: 'guest', text: 'WiFi keeps dropping upstairs in the tower', at: '2026-07-30T22:05:00' },
      {
        role: 'vitoria',
        text: 'The strongest signal is on the main floor and in the carriage house. Unplugging the white router in the laundry closet for ten seconds usually fixes a drop. I have noted the tower coverage for your host.',
        at: '2026-07-30T22:06:00',
      },
    ],
  },
]

/** Aggregated question counts — what the host most needs to see. */
export const mockTopQuestions = [
  { question: 'WiFi password', count: 32, topic: 'WiFi', answered: true },
  { question: 'Best restaurant nearby', count: 24, topic: 'Restaurants', answered: true },
  { question: 'Closest beach access', count: 18, topic: 'Beaches', answered: true },
  { question: 'What can we do tonight?', count: 16, topic: 'Events', answered: true },
  { question: 'Grocery delivery', count: 11, topic: 'Services', answered: true },
  { question: 'Check-out time', count: 9, topic: 'Check-out', answered: true },
  { question: 'Where to park a second car', count: 7, topic: 'Parking', answered: false },
  { question: 'Pool heating', count: 5, topic: 'Property', answered: false },
]

export const CONVERSATION_TOPICS = [
  'All',
  'WiFi',
  'Check-in',
  'Check-out',
  'Parking',
  'Restaurants',
  'Beaches',
  'Events',
  'Groceries',
  'Bonfires',
]
