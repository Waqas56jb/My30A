/**
 * Landing page marketing content.
 *
 * Kept out of the component so copy can be edited without touching layout —
 * this is the page the client will want to tune most often.
 */

export const howItWorks = [
  {
    step: '01',
    icon: 'key',
    title: 'Open your link',
    body: 'Your host sends a code with the booking. One tap and the app knows which house you are in, when you arrive, and how many of you there are.',
  },
  {
    step: '02',
    icon: 'sparkles',
    title: 'Ask Vitoria anything',
    body: 'WiFi password at midnight, a table for six on a Friday, which beach will be quiet at four. She knows your property and this whole stretch of coast.',
  },
  {
    step: '03',
    icon: 'umbrella',
    title: 'Actually enjoy the week',
    body: 'Groceries in the fridge before you land, a driver at baggage claim, a bonfire lit at sunset. The planning is done. Go outside.',
  },
]

/** Every service, marketed in one line each. Nothing hidden in a submenu. */
export const serviceCatalogue = [
  {
    group: 'Getting around',
    items: [
      { icon: 'car', title: 'Golf carts', line: 'Street-legal carts delivered to your driveway.', to: '/experiences/golf-carts' },
      { icon: 'bike', title: 'Biking', line: 'Nineteen flat miles of paved trail, cruisers and e-bikes.', to: '/experiences/biking' },
      { icon: 'boat', title: 'Boating', line: 'Private charters, dolphin runs, paddleboards on the dune lakes.', to: '/experiences/boating' },
      { icon: 'map', title: 'The map', line: 'Everything near your house, plotted and filtered.', to: '/map' },
    ],
  },
  {
    group: 'Eating and evenings',
    items: [
      { icon: 'utensils', title: 'Restaurants', line: 'Fourteen tables worth knowing, from donut truck to rooftop.', to: '/restaurants' },
      { icon: 'flame', title: 'Beach bonfires', line: 'Permit, wood, chairs and cleanup — all handled.', to: '/experiences/bonfires' },
      { icon: 'ticket', title: 'Events', line: 'Free concerts, farmers markets, films on the green.', to: '/events' },
      { icon: 'bag', title: 'Shopping', line: 'Seaside boutiques, the Airstreams, an excellent bookshop.', to: '/experiences/shopping' },
    ],
  },
  {
    group: 'Days out',
    items: [
      { icon: 'umbrella', title: 'Beaches', line: 'Sixteen accesses, with parking and chair service noted.', to: '/beaches' },
      { icon: 'users', title: 'Family time', line: 'Surf lessons, beach gear delivered, vetted sitters.', to: '/experiences/family' },
      { icon: 'leaf', title: 'Wellness & spa', line: 'Sunrise beach yoga, or a therapist who comes to you.', to: '/experiences/wellness' },
      { icon: 'flag', title: 'Golf', line: 'Two championship courses ten minutes off 30A.', to: '/experiences/golf' },
    ],
  },
  {
    group: 'Handled for you',
    items: [
      { icon: 'bag', title: 'Grocery delivery', line: 'Send a list, arrive to a stocked kitchen.', to: '/groceries' },
      { icon: 'car', title: 'Airport transfers', line: 'A driver at ECP, VPS or PNS, tracking your flight.', to: '/transfers' },
      { icon: 'camera', title: 'Photography', line: 'Sunrise family sessions, gallery within 72 hours.', to: '/experiences/photography' },
      { icon: 'key', title: 'Your property', line: 'WiFi, door codes, check-out steps — the moment you unlock.', to: '/my-stay' },
    ],
  },
]

export const testimonials = [
  {
    id: 't1',
    quote:
      'We stopped googling from the beach. Vitoria had a quiet access, a cart, and dinner sorted before the kids finished the sandcastle.',
    name: 'Sarah Whitmore',
    detail: 'Rosemary Beach · guest',
    image: '1695425812104-8a9963d58887',
  },
  {
    id: 't2',
    quote:
      'Door codes, WiFi, a stocked fridge, and a driver at ECP — and none of it came through a group text. That is the whole difference.',
    name: 'Daniel Okafor',
    detail: 'Seaside · guest',
    image: '1605472075294-4c73b9909d08',
  },
  {
    id: 't3',
    quote:
      'The map of 30A finally made sense. Inlet to Grayton in a cart, bonfire at sunset, no hunting for parking. Effortless.',
    name: 'Alex Rivera',
    detail: 'Watercolor · guest',
    image: '1569918970203-ea053ffda098',
  },
]

export const coastTowns = [
  { name: 'Inlet Beach', query: 'Inlet Beach, Florida 30A', line: 'Wide shorelines and quiet dune landscapes at the east end of the road.' },
  { name: 'Seacrest', query: 'Seacrest Beach, Florida', line: 'Laid-back dunes and walkable charm between Alys and Rosemary.' },
  { name: 'Seagrove', query: 'Seagrove Beach, Florida', line: 'Towering oaks, winding roads, and classic 30A beach culture.' },
  { name: 'Watersound', query: 'Watersound, Florida', line: 'Boardwalk-lined beaches, privacy, and uninterrupted Gulf views.' },
  { name: 'Grayton Beach', query: 'Grayton Beach, Florida', line: 'Historic, creative, and still the soul of this stretch of coast.' },
  { name: 'Dune Allen', query: 'Dune Allen, Florida', line: 'Quiet, family-paced, with easy walkovers and a residential feel.' },
  { name: 'Alys Beach', query: 'Alys Beach, Florida', line: 'White courtyards, open architecture, a distinctly refined coastal town.' },
  { name: 'Watercolor', query: 'WaterColor, Florida', line: 'Lush greens, timeless houses, and a seamless walk to the sand.' },
  { name: 'Seaside', query: 'Seaside, Florida', line: 'Pastel streets, the square, and the most walkable mile on 30A.' },
  { name: 'Rosemary Beach', query: 'Rosemary Beach, Florida', line: 'Brick lanes, gulf views, and dinner you will plan the trip around.' },
]

export const stayBenefits = [
  { title: 'The local intel', body: 'Beaches, carts, bonfires, and tables worth knowing — already mapped to where you are staying.' },
  { title: 'Direct to the people', body: 'We introduce you. Partners take the call and the payment. No extra platform fee on what you book.' },
  { title: 'One concierge', body: 'WiFi, door codes, groceries, and a driver at baggage claim. Ask Vitoria instead of starting another search.' },
]

/** Small trust line under the hero CTAs. */
export const heroProof = [
  'Free for every guest',
  'No app to download',
  'Answers in seconds, day or night',
]
