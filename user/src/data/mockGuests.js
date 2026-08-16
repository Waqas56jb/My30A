import { PHOTO } from '../assets/images'

/**
 * Guests are resolved from the unique link the host shares after booking:
 *   /guest/:guestId  →  guest + property + stay window
 * There is no auth yet; the link *is* the credential in this prototype.
 */
export const mockGuests = [
  {
    id: 'guest_sarah_01',
    slug: 'demo',
    linkSlugs: ['demo', 'sarah', 'rosemary-beach-house'],
    firstName: 'Sarah',
    lastName: 'Whitmore',
    email: 'sarah.whitmore@example.com',
    phone: '(404) 555-0188',
    avatar: PHOTO.guestSarah,
    propertyId: 'prop_rosemary_01',
    partySize: 6,
    returning: true,
    previousStays: 2,
    stay: {
      checkInDate: '2026-08-20',
      checkOutDate: '2026-08-27',
      checkInTime: '4:00 PM',
      checkOutTime: '10:00 AM',
      nights: 7,
      confirmationCode: 'MY30A-8842',
      adults: 4,
      children: 2,
    },
    preferences: {
      cuisines: ['Seafood', 'Coastal Italian', 'Sushi'],
      dietary: ['One shellfish allergy', 'Vegetarian teen'],
      travelingWithKids: true,
      kidAges: [7, 11],
      activities: ['Beach days', 'Paddleboarding', 'Live music', 'Sunset photography'],
      pace: 'Relaxed mornings, one activity a day',
      budget: '$$–$$$',
    },
    memories: [
      {
        id: 'mem_1',
        note: 'Loved the grouper at Great Southern Cafe last August.',
        source: 'Stay · Aug 2025',
      },
      {
        id: 'mem_2',
        note: 'Prefers a 7:30 PM dinner reservation so the kids can swim first.',
        source: 'Chat with Vitoria',
      },
      {
        id: 'mem_3',
        note: 'Books a sunrise family photo session every trip.',
        source: 'Stay · Jul 2024',
      },
    ],
    savedPlaceIds: ['rest_great_southern', 'beach_inlet', 'partner_bike_beachside'],
  },
  {
    id: 'guest_daniel_02',
    slug: 'daniel',
    linkSlugs: ['daniel', 'watercolor-dune-cottage'],
    firstName: 'Daniel',
    lastName: 'Okafor',
    email: 'daniel.okafor@example.com',
    phone: '(312) 555-0110',
    avatar: null,
    propertyId: 'prop_watercolor_02',
    partySize: 4,
    returning: false,
    previousStays: 0,
    stay: {
      checkInDate: '2026-09-04',
      checkOutDate: '2026-09-09',
      checkInTime: '4:00 PM',
      checkOutTime: '10:00 AM',
      nights: 5,
      confirmationCode: 'MY30A-9107',
      adults: 2,
      children: 2,
    },
    preferences: {
      cuisines: ['Barbecue', 'Mexican'],
      dietary: [],
      travelingWithKids: true,
      kidAges: [3, 5],
      activities: ['Kayaking', 'Bike rides', 'Farmers markets'],
      pace: 'Early risers',
      budget: '$$',
    },
    memories: [],
    savedPlaceIds: [],
  },
]

/** Resolve a guest from any of the slugs a host might have shared. */
export const getGuestBySlug = (slug) => {
  if (!slug) return null
  const key = String(slug).toLowerCase()
  return (
    mockGuests.find((g) => g.slug === key || g.linkSlugs?.includes(key)) ??
    mockGuests.find((g) => g.id === slug) ??
    null
  )
}

export const DEFAULT_GUEST_SLUG = 'demo'
