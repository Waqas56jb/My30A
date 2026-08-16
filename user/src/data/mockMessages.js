/**
 * Seed conversation with Vitoria plus the prompt sets shown around the chat.
 * `cards` reference other mock entities by id; `actions` are in-app routes.
 */
export const mockMessages = [
  {
    id: 'msg_seed_1',
    role: 'assistant',
    at: '2026-08-16T09:02:00',
    text: "Welcome back, Sarah — I have you at Rosemary Beach House from August 20th through the 27th.\n\nSince you enjoyed the grouper at Great Southern last August, I've been keeping an eye out for a few new seafood spots you haven't tried. I can also handle groceries before you arrive and your pickup from ECP.\n\nWhat would you like to sort out first?",
    cards: [
      { kind: 'restaurant', refId: 'rest_old_florida_fish' },
      { kind: 'restaurant', refId: 'rest_stinkys' },
    ],
    actions: [
      { label: 'Stock the kitchen', to: '/groceries/new', icon: 'bag' },
      { label: 'Arrange my pickup', to: '/transfers/new', icon: 'car' },
    ],
  },
  {
    id: 'msg_seed_2',
    role: 'user',
    at: '2026-08-16T09:05:00',
    text: "What's the best restaurant nearby for kids?",
  },
  {
    id: 'msg_seed_3',
    role: 'assistant',
    at: '2026-08-16T09:05:00',
    text: "For a family dinner I'd start with Great Southern Cafe in Seaside — proper kids' menu, the grits à ya ya you liked, and the amphitheatre right there so the kids can run between courses.\n\nIf you'd rather not get in the car, Cowgirl Kitchen is a four-minute walk and completely relaxed. And on a night nobody can agree, Pizza by the Sea will split toppings and you can eat on the porch.\n\nOne note: with the shellfish allergy in your party, tell the host on arrival at Great Southern — their kitchen is good about separate prep.",
    cards: [
      { kind: 'restaurant', refId: 'rest_great_southern' },
      { kind: 'restaurant', refId: 'rest_cowgirl_kitchen' },
      { kind: 'restaurant', refId: 'rest_pizza_bar' },
    ],
    actions: [{ label: 'See all restaurants', to: '/restaurants', icon: 'utensils' }],
  },
  {
    id: 'msg_seed_4',
    role: 'user',
    at: '2026-08-16T18:38:00',
    text: "I'm arriving at ECP Thursday at 2 PM. Can you arrange a pickup?",
  },
  {
    id: 'msg_seed_5',
    role: 'assistant',
    at: '2026-08-16T18:39:00',
    text: "Absolutely. I can help arrange your airport transfer.\n\nFor six guests and seven bags from ECP to Rosemary Beach, that's a Premium SUV at $203, roughly a 35-minute drive. Your driver meets you at baggage claim with a sign and tracks your flight, so a delay doesn't cost you the ride.\n\nI've pre-filled the request with your flight — just confirm the details and I'll send it to our team. Nothing is charged until we confirm a driver.",
    actions: [{ label: 'Review transfer request', to: '/transfers/new', icon: 'car' }],
  },
]

/** Chips shown above the composer on an empty or idle thread. */
export const suggestedPrompts = [
  { id: 'sp_1', icon: 'utensils', text: 'Where should we eat tonight?' },
  { id: 'sp_2', icon: 'umbrella', text: "What's the closest beach?" },
  { id: 'sp_3', icon: 'car', text: 'Can you arrange airport pickup?' },
  { id: 'sp_4', icon: 'bag', text: 'Can you stock my kitchen?' },
  { id: 'sp_5', icon: 'users', text: 'What should we do with kids?' },
  { id: 'sp_6', icon: 'sparkles', text: "What's happening tonight?" },
]

/** Secondary prompts surfaced on the home screen. */
export const homePrompts = [
  'How do I get into the house?',
  "What's the WiFi password?",
  'Best sunset spot nearby?',
  'Is there a bonfire company you trust?',
]
