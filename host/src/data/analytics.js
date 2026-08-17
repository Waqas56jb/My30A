/**
 * Analytics fixtures.
 *
 * Only measurable things appear here. Partner engagement stops at the outbound
 * click — the platform has no way to know whether a guest actually booked with
 * a business off-platform, and the UI must never imply otherwise.
 */

export const RANGES = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
]

const series = (values, startDay) =>
  values.map((value, i) => ({ label: `${startDay + i}`, value }))

export const mockAnalytics = {
  prop_rosemary: {
    '7d': {
      totals: {
        guestSessions: { value: 18, delta: 12 },
        conversations: { value: 41, delta: 8 },
        propertyViews: { value: 96, delta: -4 },
        experienceClicks: { value: 52, delta: 21 },
        partnerClicks: { value: 19, delta: 15 },
        satisfaction: { value: 4.8, delta: 2 },
      },
      sessions: [
        { label: 'Mon', value: 2 },
        { label: 'Tue', value: 3 },
        { label: 'Wed', value: 1 },
        { label: 'Thu', value: 4 },
        { label: 'Fri', value: 3 },
        { label: 'Sat', value: 3 },
        { label: 'Sun', value: 2 },
      ],
      conversations: [
        { label: 'Mon', value: 5 },
        { label: 'Tue', value: 7 },
        { label: 'Wed', value: 4 },
        { label: 'Thu', value: 9 },
        { label: 'Fri', value: 6 },
        { label: 'Sat', value: 6 },
        { label: 'Sun', value: 4 },
      ],
      propertyViews: [
        { label: 'WiFi', value: 32 },
        { label: 'Check-in', value: 24 },
        { label: 'House rules', value: 14 },
        { label: 'Parking', value: 13 },
        { label: 'Check-out', value: 9 },
        { label: 'Emergency', value: 4 },
      ],
      experiences: [
        { label: 'Restaurants', value: 21 },
        { label: 'Beaches', value: 14 },
        { label: 'Bonfires', value: 8 },
        { label: 'Biking', value: 5 },
        { label: 'Events', value: 4 },
      ],
    },
    '30d': {
      totals: {
        guestSessions: { value: 47, delta: 18 },
        conversations: { value: 183, delta: 24 },
        propertyViews: { value: 612, delta: 9 },
        experienceClicks: { value: 274, delta: 31 },
        partnerClicks: { value: 88, delta: 26 },
        satisfaction: { value: 4.8, delta: 4 },
      },
      sessions: series([1, 2, 1, 3, 2, 4, 2, 1, 3, 2, 2, 1, 3, 4, 2, 1, 2, 3, 1, 2, 2, 3, 1, 2, 1, 2, 3, 2, 2, 1], 1),
      conversations: series(
        [4, 6, 5, 8, 6, 9, 7, 5, 8, 6, 5, 4, 7, 9, 6, 5, 6, 8, 4, 6, 5, 7, 4, 6, 5, 6, 7, 6, 5, 4],
        1,
      ),
      propertyViews: [
        { label: 'WiFi', value: 168 },
        { label: 'Check-in', value: 142 },
        { label: 'House rules', value: 96 },
        { label: 'Parking', value: 88 },
        { label: 'Check-out', value: 74 },
        { label: 'Emergency', value: 44 },
      ],
      experiences: [
        { label: 'Restaurants', value: 104 },
        { label: 'Beaches', value: 71 },
        { label: 'Bonfires', value: 38 },
        { label: 'Biking', value: 29 },
        { label: 'Golf carts', value: 18 },
        { label: 'Events', value: 14 },
      ],
    },
    '90d': {
      totals: {
        guestSessions: { value: 121, delta: 22 },
        conversations: { value: 488, delta: 19 },
        propertyViews: { value: 1740, delta: 12 },
        experienceClicks: { value: 806, delta: 27 },
        partnerClicks: { value: 231, delta: 18 },
        satisfaction: { value: 4.7, delta: -1 },
      },
      sessions: series([8, 11, 9, 14, 12, 15, 13, 10, 12, 9, 11, 14], 1),
      conversations: series([34, 42, 38, 51, 46, 55, 49, 39, 44, 36, 41, 48], 1),
      propertyViews: [
        { label: 'WiFi', value: 486 },
        { label: 'Check-in', value: 402 },
        { label: 'House rules', value: 268 },
        { label: 'Parking', value: 241 },
        { label: 'Check-out', value: 214 },
        { label: 'Emergency', value: 129 },
      ],
      experiences: [
        { label: 'Restaurants', value: 302 },
        { label: 'Beaches', value: 208 },
        { label: 'Bonfires', value: 111 },
        { label: 'Biking', value: 84 },
        { label: 'Golf carts', value: 61 },
        { label: 'Events', value: 40 },
      ],
    },
  },

  prop_seaside: {
    '7d': {
      totals: {
        guestSessions: { value: 6, delta: 5 },
        conversations: { value: 14, delta: -3 },
        propertyViews: { value: 38, delta: 6 },
        experienceClicks: { value: 19, delta: 4 },
        partnerClicks: { value: 6, delta: 0 },
        satisfaction: { value: 4.6, delta: 0 },
      },
      sessions: [
        { label: 'Mon', value: 1 },
        { label: 'Tue', value: 0 },
        { label: 'Wed', value: 1 },
        { label: 'Thu', value: 2 },
        { label: 'Fri', value: 1 },
        { label: 'Sat', value: 1 },
        { label: 'Sun', value: 0 },
      ],
      conversations: [
        { label: 'Mon', value: 2 },
        { label: 'Tue', value: 1 },
        { label: 'Wed', value: 2 },
        { label: 'Thu', value: 4 },
        { label: 'Fri', value: 2 },
        { label: 'Sat', value: 2 },
        { label: 'Sun', value: 1 },
      ],
      propertyViews: [
        { label: 'WiFi', value: 12 },
        { label: 'Check-in', value: 9 },
        { label: 'Parking', value: 8 },
        { label: 'House rules', value: 5 },
        { label: 'Check-out', value: 4 },
      ],
      experiences: [
        { label: 'Events', value: 9 },
        { label: 'Restaurants', value: 6 },
        { label: 'Beaches', value: 4 },
      ],
    },
    '30d': {
      totals: {
        guestSessions: { value: 22, delta: 9 },
        conversations: { value: 76, delta: 11 },
        propertyViews: { value: 244, delta: 14 },
        experienceClicks: { value: 118, delta: 12 },
        partnerClicks: { value: 31, delta: 8 },
        satisfaction: { value: 4.6, delta: 1 },
      },
      sessions: series([1, 0, 2, 1, 1, 2, 0, 1, 1, 2, 1, 0, 1, 2, 1, 1, 0, 1, 1, 2, 0, 1, 1, 1, 0, 1, 2, 1, 1, 0], 1),
      conversations: series(
        [2, 1, 3, 2, 3, 4, 1, 2, 3, 4, 2, 1, 2, 4, 3, 2, 1, 3, 2, 4, 1, 2, 3, 2, 1, 2, 4, 3, 2, 1],
        1,
      ),
      propertyViews: [
        { label: 'WiFi', value: 74 },
        { label: 'Check-in', value: 58 },
        { label: 'Parking', value: 46 },
        { label: 'House rules', value: 34 },
        { label: 'Check-out', value: 32 },
      ],
      experiences: [
        { label: 'Events', value: 48 },
        { label: 'Restaurants', value: 36 },
        { label: 'Beaches', value: 22 },
        { label: 'Shopping', value: 12 },
      ],
    },
    '90d': {
      totals: {
        guestSessions: { value: 54, delta: 12 },
        conversations: { value: 188, delta: 16 },
        propertyViews: { value: 690, delta: 10 },
        experienceClicks: { value: 302, delta: 14 },
        partnerClicks: { value: 79, delta: 9 },
        satisfaction: { value: 4.6, delta: 2 },
      },
      sessions: series([4, 5, 3, 6, 5, 7, 4, 3, 5, 4, 4, 4], 1),
      conversations: series([12, 16, 11, 21, 18, 24, 14, 12, 16, 13, 15, 16], 1),
      propertyViews: [
        { label: 'WiFi', value: 208 },
        { label: 'Check-in', value: 164 },
        { label: 'Parking', value: 131 },
        { label: 'House rules', value: 98 },
        { label: 'Check-out', value: 89 },
      ],
      experiences: [
        { label: 'Events', value: 128 },
        { label: 'Restaurants', value: 94 },
        { label: 'Beaches', value: 52 },
        { label: 'Shopping', value: 28 },
      ],
    },
  },
}

/** Outbound partner engagement — clicks only, never assumed bookings. */
export const mockPartnerClicks = {
  prop_rosemary: [
    { partner: '30A Beach Bonfires', category: 'Bonfires', views: 41, website: 18, phone: 11 },
    { partner: 'Beachside Bike Rentals', category: 'Bike Rentals', views: 36, website: 14, phone: 6 },
    { partner: 'Restaurant Paradis', category: 'Restaurant', views: 33, website: 12, phone: 9 },
    { partner: '30A Golf Cart Rentals', category: 'Golf Carts', views: 28, website: 11, phone: 7 },
    { partner: 'Dune & Light Photography', category: 'Photography', views: 19, website: 8, phone: 3 },
  ],
  prop_seaside: [
    { partner: 'Great Southern Cafe', category: 'Restaurant', views: 22, website: 9, phone: 5 },
    { partner: 'Seaside Central Square', category: 'Shopping', views: 17, website: 6, phone: 0 },
    { partner: 'Coastal Paddle Co.', category: 'Boating', views: 11, website: 5, phone: 2 },
  ],
}

/** Satisfaction distribution for the analytics page. */
export const mockSatisfaction = {
  prop_rosemary: { average: 4.8, responses: 34, breakdown: [1, 0, 1, 4, 28] },
  prop_seaside: { average: 4.6, responses: 14, breakdown: [0, 0, 1, 4, 9] },
  prop_watercolor: { average: null, responses: 0, breakdown: [0, 0, 0, 0, 0] },
}
