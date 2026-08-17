import { PHOTO } from '../assets/images'

/**
 * Partner records.
 *
 * Note what is NOT here: no orders, no bookings, no transactions, no payouts.
 * My30A is the discovery layer — a guest finds the business, taps through, and
 * the actual rental or reservation happens with the partner directly.
 */

export const PARTNER_CATEGORIES = [
  'Golf Cart Rentals',
  'Bike Rentals',
  'Beach Bonfires',
  'Boating',
  'Fishing',
  'Water Sports',
  'Photography',
  'Wellness & Spa',
  'Family Services',
  'Babysitting',
  'Restaurants',
  'Events',
  'Activities',
  'Transportation',
  'Shopping',
  'Other',
]

export const PARTNER_STATUSES = {
  pending: {
    label: 'Pending review',
    tone: 'warn',
    icon: 'clock',
    title: 'Your listing is waiting for review',
    body: 'Our local team checks every business by hand — usually within two working days. We will email you the moment it goes live. Nothing to do in the meantime, though the more photos you add now, the better your listing will look on day one.',
  },
  approved: {
    label: 'Approved',
    tone: 'ok',
    icon: 'checkCircle',
    title: 'Your business is live on My30A',
    body: 'Guests exploring 30A can find you, see your photos, and connect with you directly by phone, website, or directions. Everything below shows how much interest that is generating.',
  },
  rejected: {
    label: 'Needs changes',
    tone: 'danger',
    icon: 'alert',
    title: 'We need a few changes before this goes live',
    body: 'Nothing is lost — update the details below and resubmit, and we will take another look straight away.',
  },
  suspended: {
    label: 'Suspended',
    tone: 'danger',
    icon: 'eyeOff',
    title: 'Your listing is temporarily unavailable',
    body: 'Guests cannot currently see your business. This is usually a phone number or website that stopped working. Fix the details below and get in touch and we will restore it.',
  },
}

/** Photo shape: { id, image, name, category, cover, featured } */
const photo = (id, image, name, extra = {}) => ({
  id,
  image,
  name,
  category: extra.category ?? 'Experience',
  cover: !!extra.cover,
  featured: !!extra.featured,
})

export const mockPartners = [
  {
    id: 'ptr_glowflow',
    slug: 'glow-and-flow-30a-beach-bonfires',
    businessName: 'Glow & Flow 30A Beach Bonfires',
    ownerName: 'Marissa Kane',
    email: 'hello@glowandflow30a.com',
    phone: '(850) 555-0251',
    website: 'https://glowandflow30a.com',
    category: 'Beach Bonfires',
    secondaryCategories: ['Events', 'Family Services'],
    status: 'approved',
    submittedAt: '2025-04-02T10:00:00',
    approvedAt: '2025-04-04T09:15:00',
    updatedAt: '2026-08-14T18:20:00',

    address: '78 Barrett Square',
    city: 'Rosemary Beach',
    state: 'FL',
    zip: '32461',
    serviceArea: 'Rosemary, Alys & Inlet Beach',

    description:
      'Create unforgettable evenings on the beach with professionally prepared bonfire experiences. We handle the Walton County permit, deliver the wood and seating, light it at your chosen time, and come back to clear it all away. All you bring is the marshmallows and the people you like.',
    shortDescription: 'Permitted beach bonfires with wood, chairs, s’mores and full cleanup.',

    startingPrice: 75,
    priceLabel: 'per person',
    showPricing: true,

    rating: 5.0,
    reviewCount: 200,

    logo: PHOTO.bonfireGroup,
    photos: [
      photo('gf1', PHOTO.bonfirePeople, 'Sunset bonfire with friends', { cover: true, featured: true, category: 'Experience' }),
      photo('gf2', PHOTO.bonfireGroup, 'Sitting around the fire', { category: 'Experience' }),
      photo('gf3', PHOTO.sunsetSilhouette, 'Golden hour on the sand', { category: 'Atmosphere' }),
      photo('gf4', PHOTO.beachSunset, 'The light before we light it', { category: 'Atmosphere' }),
    ],

    hours: {
      Monday: '9:00 AM – 9:00 PM',
      Tuesday: '9:00 AM – 9:00 PM',
      Wednesday: '9:00 AM – 9:00 PM',
      Thursday: '9:00 AM – 9:00 PM',
      Friday: '9:00 AM – 10:00 PM',
      Saturday: '9:00 AM – 10:00 PM',
      Sunday: '9:00 AM – 9:00 PM',
    },

    instagram: 'glowandflow30a',
    facebook: 'glowandflow30a',
    services: ['Permit handling', 'Wood & setup', 'Chairs and blankets', 'S’mores kit', 'Full cleanup'],
    rejectionReason: null,
  },

  {
    id: 'ptr_golfcarts',
    slug: '30a-golf-cart-rentals',
    businessName: '30A Golf Cart Rentals',
    ownerName: 'Trey Alderman',
    email: 'book@30agolfcartrentals.com',
    phone: '(850) 555-0293',
    website: 'https://30agolfcartrentals.com',
    category: 'Golf Cart Rentals',
    secondaryCategories: ['Transportation'],
    status: 'approved',
    submittedAt: '2025-02-18T11:30:00',
    approvedAt: '2025-02-20T08:40:00',
    updatedAt: '2026-08-11T14:05:00',

    address: '12805 US-98',
    city: 'Inlet Beach',
    state: 'FL',
    zip: '32461',
    serviceArea: 'Inlet Beach to Seagrove',

    description:
      'Street-legal four and six seat carts, delivered to your driveway and collected when you leave. The easiest way to move a family between Rosemary, Alys and Seacrest without thinking about parking. Driver must be 21+ with a valid licence.',
    shortDescription: 'Street-legal carts delivered to your door. See more of 30A on four wheels.',

    startingPrice: 25,
    priceLabel: 'per day',
    showPricing: true,

    rating: 5.0,
    reviewCount: 433,

    logo: PHOTO.golfCartRow,
    photos: [
      photo('gc1', PHOTO.golfCartOcean, 'Sunset stop above the Gulf', { cover: true, featured: true, category: 'Experience' }),
      photo('gc2', PHOTO.coastalRoad, 'Cruising 30A', { category: 'Experience' }),
      photo('gc3', PHOTO.golfCartRow, 'The fleet, ready to go', { category: 'Fleet' }),
      photo('gc4', PHOTO.golfCartCourse, 'Out for the afternoon', { category: 'Experience' }),
    ],

    hours: {
      Monday: '8:00 AM – 6:00 PM',
      Tuesday: '8:00 AM – 6:00 PM',
      Wednesday: '8:00 AM – 6:00 PM',
      Thursday: '8:00 AM – 6:00 PM',
      Friday: '8:00 AM – 6:00 PM',
      Saturday: '8:00 AM – 6:00 PM',
      Sunday: '9:00 AM – 4:00 PM',
    },

    instagram: '30agolfcarts',
    facebook: '30agolfcartrentals',
    services: ['4-seat carts', '6-seat carts', 'Free delivery & pickup', 'Weekly rates'],
    rejectionReason: null,
  },

  {
    id: 'ptr_bikes',
    slug: '30a-bike-rentals',
    businessName: '30A Bike Rentals',
    ownerName: 'Priya Raman',
    email: 'ride@30abikerentals.com',
    phone: '(850) 555-0210',
    website: 'https://30abikerentals.com',
    category: 'Bike Rentals',
    secondaryCategories: ['Activities', 'Family Services'],
    status: 'approved',
    submittedAt: '2025-05-06T09:00:00',
    approvedAt: '2025-05-07T16:10:00',
    updatedAt: '2026-07-30T10:45:00',

    address: '10343 E County Hwy 30A',
    city: 'Inlet Beach',
    state: 'FL',
    zip: '32461',
    serviceArea: 'The whole Timpoochee Trail',

    description:
      'Beach cruisers, e-bikes, kids bikes and trailers delivered to wherever you are staying, usually within a couple of hours. Helmets, baskets and locks come standard. The Timpoochee Trail runs nineteen flat miles along 30A — most of our guests barely touch the car all week.',
    shortDescription: 'Cruisers and e-bikes delivered to your door. Nineteen flat miles await.',

    startingPrice: 25,
    priceLabel: 'per bike / day',
    showPricing: true,

    rating: 4.8,
    reviewCount: 412,

    logo: PHOTO.bikeBoardwalk,
    photos: [
      photo('bk1', PHOTO.bikeRide, 'Riding the coastal path', { cover: true, featured: true, category: 'Experience' }),
      photo('bk2', PHOTO.bikeBoardwalk, 'Boardwalk mornings', { category: 'Experience' }),
      photo('bk3', PHOTO.beachBoardwalk, 'Down to the sand', { category: 'Atmosphere' }),
    ],

    hours: {
      Monday: '8:00 AM – 6:00 PM',
      Tuesday: '8:00 AM – 6:00 PM',
      Wednesday: '8:00 AM – 6:00 PM',
      Thursday: '8:00 AM – 6:00 PM',
      Friday: '8:00 AM – 6:00 PM',
      Saturday: '8:00 AM – 6:00 PM',
      Sunday: '9:00 AM – 4:00 PM',
    },

    instagram: '30abikerentals',
    facebook: '',
    services: ['Adult cruisers', 'E-bikes', 'Kids bikes & trailers', 'Free delivery'],
    rejectionReason: null,
  },

  {
    id: 'ptr_photo',
    slug: 'rosemary-beach-photography',
    businessName: 'Rosemary Beach Photography',
    ownerName: 'Elena Cardoso',
    email: 'studio@rosemarybeachphoto.com',
    phone: '(850) 555-0241',
    website: 'https://rosemarybeachphoto.com',
    category: 'Photography',
    secondaryCategories: ['Family Services'],
    status: 'pending',
    submittedAt: '2026-08-15T13:20:00',
    approvedAt: null,
    updatedAt: '2026-08-15T13:20:00',

    address: 'Serving all of 30A',
    city: 'Rosemary Beach',
    state: 'FL',
    zip: '32461',
    serviceArea: 'Inlet Beach to Grayton',

    description:
      'Sunrise and golden hour family sessions on the dunes. Forty-five minutes, forty-plus edited images in a private gallery within three days, and enough patience for the smallest member of your party. We know which walkovers stay empty.',
    shortDescription: 'Sunrise family sessions on the dunes, gallery within 72 hours.',

    startingPrice: 425,
    priceLabel: 'per session',
    showPricing: true,

    rating: 5.0,
    reviewCount: 214,

    logo: PHOTO.photographer,
    photos: [
      photo('ph1', PHOTO.familyWalk, 'Family walk at golden hour', { cover: true, featured: true, category: 'Experience' }),
      photo('ph2', PHOTO.familyShore, 'At the water together', { category: 'Experience' }),
      photo('ph3', PHOTO.beachSunset, 'The light we shoot in', { category: 'Atmosphere' }),
    ],

    hours: {
      Monday: '6:00 AM – 8:00 PM',
      Tuesday: '6:00 AM – 8:00 PM',
      Wednesday: '6:00 AM – 8:00 PM',
      Thursday: '6:00 AM – 8:00 PM',
      Friday: '6:00 AM – 8:00 PM',
      Saturday: '6:00 AM – 8:00 PM',
      Sunday: '6:00 AM – 8:00 PM',
    },

    instagram: 'rosemarybeachphoto',
    facebook: '',
    services: ['Family beach session', 'Golden hour session', 'Private online gallery', 'Print ordering'],
    rejectionReason: null,
  },

  {
    id: 'ptr_boating',
    slug: '30a-coastal-boating',
    businessName: '30A Coastal Boating',
    ownerName: 'Captain Ray Whitlock',
    email: 'charters@30acoastalboating.com',
    phone: '(850) 555-0221',
    website: 'https://30acoastalboating.com',
    category: 'Boating',
    secondaryCategories: ['Fishing', 'Water Sports'],
    status: 'suspended',
    submittedAt: '2025-03-11T08:00:00',
    approvedAt: '2025-03-13T12:00:00',
    updatedAt: '2026-08-09T09:30:00',

    address: '9300 Emerald Coast Pkwy',
    city: 'Miramar Beach',
    state: 'FL',
    zip: '32550',
    serviceArea: 'Choctawhatchee Bay & Crab Island',

    description:
      'Half and full day private pontoon charters with a licensed captain. Crab Island, the dolphin grounds, and a sandbar stop where the water is waist deep and warm. Coolers, water toys and a bluetooth stereo come with the boat.',
    shortDescription: 'Private pontoon charters on the bay. Captain, fuel and coolers included.',

    startingPrice: 450,
    priceLabel: 'half day',
    showPricing: true,

    rating: 4.9,
    reviewCount: 326,

    logo: PHOTO.boatDay,
    photos: [
      photo('bo1', PHOTO.boatSunset, 'Sunset on the water', { cover: true, featured: true, category: 'Experience' }),
      photo('bo2', PHOTO.boatDay, 'Out for the day', { category: 'Experience' }),
      photo('bo3', PHOTO.paddleCouple, 'Paddleboards on board', { category: 'Experience' }),
    ],

    hours: {
      Monday: '7:00 AM – 7:00 PM',
      Tuesday: '7:00 AM – 7:00 PM',
      Wednesday: '7:00 AM – 7:00 PM',
      Thursday: '7:00 AM – 7:00 PM',
      Friday: '7:00 AM – 7:00 PM',
      Saturday: '7:00 AM – 7:00 PM',
      Sunday: '7:00 AM – 7:00 PM',
    },

    instagram: '30acoastalboating',
    facebook: '',
    services: ['Private pontoon charter', 'Dolphin cruise', 'Sunset cruise', 'Captain & fuel included'],
    rejectionReason: null,
    suspensionReason:
      'The phone number on your listing has been unreachable for eleven days. Update it and let us know, and we will put you straight back up.',
  },

  {
    id: 'ptr_wellness',
    slug: '30a-wellness-studio',
    businessName: '30A Wellness Studio',
    ownerName: 'Naomi Fletcher',
    email: 'hello@30awellnessstudio.com',
    phone: '(850) 555-0263',
    website: '',
    category: 'Wellness & Spa',
    secondaryCategories: ['Activities'],
    status: 'rejected',
    submittedAt: '2026-08-12T15:45:00',
    approvedAt: null,
    updatedAt: '2026-08-13T10:10:00',

    address: 'Rosemary Beach walkover',
    city: 'Rosemary Beach',
    state: 'FL',
    zip: '32461',
    serviceArea: 'Rosemary Beach',

    description: 'Sunrise beach yoga and in-home massage across 30A.',
    shortDescription: 'Sunrise beach yoga, mats provided.',

    startingPrice: null,
    priceLabel: '',
    showPricing: false,

    rating: 4.9,
    reviewCount: 176,

    logo: PHOTO.yogaSunset,
    photos: [photo('wl1', PHOTO.yogaSunset, 'Sunrise flow on the sand', { cover: true, category: 'Experience' })],

    hours: {
      Monday: '7:00 AM – 7:00 PM',
      Tuesday: '7:00 AM – 7:00 PM',
      Wednesday: '7:00 AM – 7:00 PM',
      Thursday: '7:00 AM – 7:00 PM',
      Friday: '7:00 AM – 7:00 PM',
      Saturday: '7:00 AM – 12:00 PM',
      Sunday: '8:00 AM – 12:00 PM',
    },

    instagram: '30awellness',
    facebook: '',
    services: ['Sunrise beach yoga', 'In-home massage', 'Private sessions'],
    rejectionReason:
      'We could not verify a working website or booking phone line, and the listing needs at least three photos before it will look right next to other 30A businesses. Add those two things and resubmit — everything else looks great.',
  },
]

export const getPartner = (id) => mockPartners.find((partner) => partner.id === id)

/** Demo sign-in. Any password works; the email picks which business you manage. */
export const DEMO_CREDENTIALS = {
  email: 'hello@glowandflow30a.com',
  password: 'demo1234',
}

/** Other demo logins, surfaced on the login screen so every status is reachable. */
export const DEMO_ACCOUNTS = mockPartners.map((partner) => ({
  id: partner.id,
  email: partner.email,
  businessName: partner.businessName,
  status: partner.status,
}))

/** Completeness drives the "improve your listing" nudges. */
export const PROFILE_CHECKS = [
  { key: 'description', label: 'Business description', test: (p) => (p.description ?? '').length > 80 },
  { key: 'phone', label: 'Phone number', test: (p) => !!p.phone },
  { key: 'website', label: 'Website', test: (p) => !!p.website },
  { key: 'address', label: 'Location', test: (p) => !!p.city },
  { key: 'photos', label: 'At least three photos', test: (p) => (p.photos ?? []).length >= 3 },
  { key: 'cover', label: 'Cover photo chosen', test: (p) => (p.photos ?? []).some((ph) => ph.cover) },
  { key: 'hours', label: 'Opening hours', test: (p) => Object.keys(p.hours ?? {}).length > 0 },
  { key: 'pricing', label: 'Starting price (optional)', test: (p) => !p.showPricing || !!p.startingPrice, optional: true },
]

export function profileCompleteness(partner) {
  if (!partner) return { items: [], done: 0, total: 0, percent: 0 }
  const items = PROFILE_CHECKS.map((check) => ({ ...check, done: check.test(partner) }))
  const done = items.filter((item) => item.done).length
  return { items, done, total: items.length, percent: Math.round((done / items.length) * 100) }
}
