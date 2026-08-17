import { PHOTO } from '../assets/images'
import { rng, between, pick, pickWeighted, shiftTime, TOWNS, STREETS } from './seed'

/**
 * Partners — local businesses listed in the guest app.
 *
 * READ THIS BEFORE ADDING A FIELD.
 *
 * A partner is not a supplier inside My30A. Guests do not book, pay, or
 * schedule anything with a partner through this platform. They see the
 * listing, then call, open the website, or drive over — and everything after
 * that happens between the guest and the business, off-platform.
 *
 * So there is no `bookings`, no `revenue`, no `orders` field here, and there
 * never should be. The only numbers admin has are the four interactions that
 * happen on our own screens: views, website clicks, phone clicks, directions.
 * Anything else would be a number we invented.
 */

export const PARTNER_STATUSES = {
  pending: { label: 'Pending review', tone: 'warn', icon: 'clock' },
  approved: { label: 'Approved', tone: 'success', icon: 'checkCircle' },
  rejected: { label: 'Rejected', tone: 'danger', icon: 'x' },
  suspended: { label: 'Suspended', tone: 'muted', icon: 'alert' },
}

/** The only four things My30A can honestly observe. */
export const TRACKED_EVENTS = [
  { key: 'views', event: 'partner_view', label: 'Profile views', icon: 'eye' },
  { key: 'websiteClicks', event: 'website_click', label: 'Website clicks', icon: 'globe' },
  { key: 'phoneClicks', event: 'phone_click', label: 'Phone clicks', icon: 'phone' },
  { key: 'directionsClicks', event: 'directions_click', label: 'Directions', icon: 'navigation' },
]

export const NOT_TRACKED = [
  'Whether the guest actually bought anything',
  'Bookings taken by phone, email or in person',
  'Checkout on the partner’s own website',
  'Whether the service was delivered',
]

/* --------------------------------------------------------------------------
   The named partners. These are the ones that appear in demos, so they are
   written by hand; the rest are generated below to give the tables volume.
   -------------------------------------------------------------------------- */
const NAMED = [
  {
    id: 'ptr_glowflow', name: 'Glow & Flow 30A Beach Bonfires', categoryId: 'cat_bonfires',
    owner: 'Marissa Cole', status: 'pending', featured: false, town: 'Rosemary Beach',
    startingPrice: 275, images: [PHOTO.bonfirePeople, PHOTO.bonfire, PHOTO.campfire],
    tagline: 'Permit, wood, chairs and cleanup — you just show up.',
    submittedAt: shiftTime(-2, 16, 12),
  },
  {
    id: 'ptr_golfcarts', name: '30A Golf Cart Rentals', categoryId: 'cat_golf_carts',
    owner: 'Trent Barlow', status: 'approved', featured: true, town: 'Seagrove Beach',
    startingPrice: 165, images: [PHOTO.golfCartOcean, PHOTO.golfCartRow, PHOTO.golfCartCourse],
    tagline: 'Street-legal 4 and 6 seaters delivered to your driveway.',
    submittedAt: shiftTime(-340, 10, 0),
  },
  {
    id: 'ptr_bikes', name: 'Beachside Bike Rentals', categoryId: 'cat_bikes',
    owner: 'Dana Whitfield', status: 'approved', featured: true, town: 'Seaside',
    startingPrice: 45, images: [PHOTO.bikeRide, PHOTO.bikes, PHOTO.bikeBoardwalk],
    tagline: 'Cruisers, e-bikes and trailers, dropped at the house.',
    submittedAt: shiftTime(-410, 9, 30),
  },
  {
    id: 'ptr_photo', name: 'Emerald Coast Portraits', categoryId: 'cat_photography',
    owner: 'Nathan Pruitt', status: 'pending', featured: false, town: 'Alys Beach',
    startingPrice: 450, images: [PHOTO.photographer, PHOTO.familyPhoto, PHOTO.beachSunset],
    tagline: 'Golden-hour family sessions, gallery in 72 hours.',
    submittedAt: shiftTime(-1, 8, 45),
  },
  {
    id: 'ptr_wellness', name: 'Salt & Sol Wellness', categoryId: 'cat_wellness',
    owner: 'Priya Raman', status: 'rejected', featured: false, town: 'Grayton Beach',
    startingPrice: null, images: [PHOTO.yogaSunset, PHOTO.yoga],
    tagline: 'Sunrise beach yoga and in-home recovery sessions.',
    submittedAt: shiftTime(-19, 14, 5),
    reason: 'Business licence number did not match Walton County records. Resubmit with a current licence.',
  },
  {
    id: 'ptr_boating', name: 'Choctawhatchee Charters', categoryId: 'cat_boating',
    owner: 'Rick Alderman', status: 'suspended', featured: false, town: 'Santa Rosa Beach',
    startingPrice: 550, images: [PHOTO.boatSunset, PHOTO.boatPontoon, PHOTO.boatYacht],
    tagline: 'Private half-day charters and sunset dolphin runs.',
    submittedAt: shiftTime(-260, 11, 20),
    reason: 'Three guest reports of unanswered calls during peak week. Suspended pending a call with the owner.',
  },
  {
    id: 'ptr_spa', name: 'Dune House Spa', categoryId: 'cat_spa',
    owner: 'Elena Marchetti', status: 'pending', featured: false, town: 'Watersound',
    startingPrice: 190, images: [PHOTO.spaMassage, PHOTO.spaStones],
    tagline: 'A therapist who comes to the house, same day.',
    submittedAt: shiftTime(-4, 19, 40),
  },
  {
    id: 'ptr_paddle', name: 'Western Lake Paddle Co.', categoryId: 'cat_activities',
    owner: 'Cole Hendrix', status: 'approved', featured: false, town: 'Grayton Beach',
    startingPrice: 60, images: [PHOTO.paddleboard, PHOTO.kayak, PHOTO.paddleCouple],
    tagline: 'Paddleboards and kayaks on the coastal dune lakes.',
    submittedAt: shiftTime(-190, 13, 0),
  },
]

const GENERIC = [
  ['Sandpiper Surf School', 'cat_family', PHOTO.beachKids, 85],
  ['Coastal Table Catering', 'cat_restaurants', PHOTO.diningFine, 40],
  ['Highway 30A Shuttle', 'cat_transportation', PHOTO.coastalRoad, 55],
  ['Point Washington Fishing', 'cat_fishing', PHOTO.fishing, 400],
  ['Camp Creek Tennis', 'cat_activities', PHOTO.tennis, 70],
  ['Sunset Sail 30A', 'cat_boating', PHOTO.boatDay, 480],
  ['Little Feet Sitters', 'cat_family', PHOTO.familyShore, 32],
  ['Grayton Beach Bonfires', 'cat_bonfires', PHOTO.campfire, 240],
  ['Alys Cart Company', 'cat_golf_carts', PHOTO.golfCartRow, 150],
  ['Emerald Cycle Hire', 'cat_bikes', PHOTO.bikeBeach, 38],
  ['Blue Mountain Massage', 'cat_spa', PHOTO.spaStones, 175],
  ['Seaside Sunrise Yoga', 'cat_wellness', PHOTO.yoga, 25],
  ['Inlet Beach Photo Co.', 'cat_photography', PHOTO.familyPhoto, 395],
  ['30A Market Events', 'cat_events', PHOTO.patioLights, null],
  ['Watercolor Kayak Tours', 'cat_activities', PHOTO.kayak, 65],
  ['The Airstream Row', 'cat_shopping', PHOTO.coastalTown, null],
  ['Rosemary Raw Bar', 'cat_restaurants', PHOTO.oysters, 30],
  ['Dune Allen Charters', 'cat_boating', PHOTO.boatPontoon, 520],
  ['Seacrest Beach Gear', 'cat_family', PHOTO.beachUmbrellas, 45],
  ['Coastal Golf Concierge', 'cat_activities', PHOTO.golfCourse, 210],
  ['Santa Rosa Sound Sailing', 'cat_boating', PHOTO.boatYacht, 640],
  ['Village Green Bakery', 'cat_restaurants', PHOTO.bakery, 12],
  ['30A Night Rides', 'cat_transportation', PHOTO.coastalRoad, 48],
  ['Salt Air Studios', 'cat_photography', PHOTO.photographer, 425],
  ['Dune Lake Wellness', 'cat_wellness', PHOTO.yogaSunset, 90],
  ['Barefoot Bike Tours', 'cat_bikes', PHOTO.bikeBoardwalk, 55],
  ['Seagrove Fish House', 'cat_restaurants', PHOTO.seafoodPlate, 34],
  ['Watersound Cart Co.', 'cat_golf_carts', PHOTO.golfCartCourse, 175],
  ['Gulf Coast Fireworks', 'cat_events', PHOTO.patioLights, 850],
  ['Coquina Family Charters', 'cat_fishing', PHOTO.fishing, 380],
  ['Beach Bonfire Brothers', 'cat_bonfires', PHOTO.bonfireGroup, 260],
  ['Alys Wellness Room', 'cat_spa', PHOTO.spaMassage, 165],
]

function buildPartners() {
  const random = rng(4211)

  const named = NAMED.map((partner) => ({
    ...partner,
    email: `hello@${partner.name.toLowerCase().replace(/[^a-z0-9]+/g, '')}.com`.slice(0, 44),
    phone: `(850) 555-0${between(random, 100, 199)}`,
    website: `https://${partner.name.toLowerCase().replace(/[^a-z0-9]+/g, '')}.com`.slice(0, 48),
    address: `${between(random, 10, 980)} ${pick(random, STREETS)}, ${partner.town}, FL`,
    description: `${partner.tagline} Independent local business serving the 30A corridor. Guests contact them directly — My30A does not take bookings or payments on their behalf.`,
    hours: 'Mon–Sun · 8:00 AM – 8:00 PM',
    social: { instagram: `@${partner.name.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 18)}` },
    rating: partner.status === 'approved' ? Number((4.2 + random() * 0.7).toFixed(1)) : null,
    reviewCount: partner.status === 'approved' ? between(random, 18, 240) : 0,
    published: partner.status === 'approved',
    stats: statsFor(random, partner.status),
  }))

  const generated = GENERIC.map(([name, categoryId, image, price], i) => {
    const status = pickWeighted(random, [
      ['approved', 74], ['pending', 12], ['suspended', 7], ['rejected', 7],
    ])
    const town = pick(random, TOWNS)
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '')
    return {
      id: `ptr_g${String(i + 1).padStart(2, '0')}`,
      name,
      categoryId,
      owner: `${pick(random, ['Ava', 'Ben', 'Cara', 'Dean', 'Elise', 'Finn', 'Gia', 'Hal'])} ${pick(random, ['Mercer', 'Vance', 'Duval', 'Orr', 'Quinn', 'Reyes', 'Stone', 'Tate'])}`,
      status,
      featured: status === 'approved' && random() < 0.18,
      town,
      startingPrice: price,
      images: [image],
      tagline: `${name} — ${town}.`,
      description: `${name} is an independent business on 30A. Guests reach them directly by phone or website; My30A lists them and passes the interest along.`,
      email: `hello@${slug}.com`.slice(0, 44),
      phone: `(850) 555-0${between(random, 100, 199)}`,
      website: `https://${slug}.com`.slice(0, 48),
      address: `${between(random, 10, 980)} ${pick(random, STREETS)}, ${town}, FL`,
      hours: 'Mon–Sun · 9:00 AM – 6:00 PM',
      social: { instagram: `@${slug.slice(0, 18)}` },
      rating: status === 'approved' ? Number((3.9 + random() * 1.0).toFixed(1)) : null,
      reviewCount: status === 'approved' ? between(random, 4, 180) : 0,
      published: status === 'approved',
      submittedAt: shiftTime(-between(random, 3, 400), between(random, 8, 20), 0),
      reason:
        status === 'rejected'
          ? 'Photos did not show the actual service. Replace the stock imagery and resubmit.'
          : status === 'suspended'
            ? 'Listing paused at the owner’s request for the off-season.'
            : undefined,
      stats: statsFor(random, status),
    }
  })

  return [...named, ...generated]
}

function statsFor(random, status) {
  if (status !== 'approved') {
    return { views: 0, websiteClicks: 0, phoneClicks: 0, directionsClicks: 0 }
  }
  const views = between(random, 240, 5200)
  const websiteClicks = Math.round(views * (0.14 + random() * 0.16))
  const phoneClicks = Math.round(views * (0.05 + random() * 0.09))
  const directionsClicks = Math.round(views * (0.03 + random() * 0.07))
  return { views, websiteClicks, phoneClicks, directionsClicks }
}

export const mockPartners = buildPartners()

/** Interactions = every tracked event. It is a traffic number, not a sales number. */
export const partnerInteractions = (partner) =>
  partner.stats.views +
  partner.stats.websiteClicks +
  partner.stats.phoneClicks +
  partner.stats.directionsClicks

/** Of the guests who saw the listing, how many acted on it. */
export const partnerCtr = (partner) => {
  const { views, websiteClicks, phoneClicks, directionsClicks } = partner.stats
  if (!views) return 0
  return (websiteClicks + phoneClicks + directionsClicks) / views
}
