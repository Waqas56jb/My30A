import { PHOTO } from '../assets/images'

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
      'Asked for a table for six on a Friday in August and had one in four minutes. I have been coming to 30A for nine years and never managed that myself.',
    name: 'Sarah W.',
    detail: 'Rosemary Beach · August',
    image: PHOTO.guestSarah,
  },
  {
    id: 't2',
    quote:
      'We landed at nine, the driver was waiting, and the fridge was full when we walked in. The holiday started at the airport instead of the supermarket.',
    name: 'The Thompsons',
    detail: 'Alys Beach · July',
    image: null,
  },
  {
    id: 't3',
    quote:
      'The bonfire recommendation made the trip. Someone else pulled the permit, lit it at seven, and cleared it away. The kids still talk about it.',
    name: 'Daniel O.',
    detail: 'Seacrest · June',
    image: null,
  },
]

/** Small trust line under the hero CTAs. */
export const heroProof = [
  'Free for every guest',
  'No app to download',
  'Answers in seconds, day or night',
]
