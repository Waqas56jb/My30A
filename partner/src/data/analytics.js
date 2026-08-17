/**
 * Engagement fixtures.
 *
 * Every number here is something My30A can genuinely observe: a listing was
 * viewed, or a guest tapped through to a website, phone number, or directions.
 * There is deliberately no revenue, conversion, or booking metric — what
 * happens after the guest leaves is the partner's business and not ours to
 * claim. `TRACKED` / `NOT_TRACKED` below is surfaced in the UI verbatim.
 */

export const RANGES = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
  { value: '12m', label: '12 months' },
]

export const METRICS = [
  { key: 'views', label: 'Profile views', icon: 'eye', description: 'A guest opened your listing.' },
  { key: 'website', label: 'Website clicks', icon: 'globe', description: 'A guest tapped through to your site.' },
  { key: 'phone', label: 'Phone clicks', icon: 'phone', description: 'A guest tapped your number to call.' },
  { key: 'directions', label: 'Directions', icon: 'navigation', description: 'A guest asked for directions to you.' },
]

export const TRACKED = [
  'Profile views',
  'Website clicks',
  'Phone number clicks',
  'Directions requests',
  'Which categories guests browsed to reach you',
]

export const NOT_TRACKED = [
  'Purchases made on your website',
  'What was said on the phone',
  'Bookings taken in person or by email',
  'Anything a guest buys from you directly',
]

const series = (labels, values) => labels.map((label, i) => ({ label, value: values[i] }))

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTHS = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug']
const d30 = Array.from({ length: 30 }, (_, i) => `${i + 1}`)
const d90 = Array.from({ length: 12 }, (_, i) => `W${i + 1}`)

export const mockAnalytics = {
  ptr_glowflow: {
    '7d': {
      totals: { views: 312, website: 78, phone: 41, directions: 26 },
      deltas: { views: 18.4, website: 12.7, phone: 8.3, directions: 15.2 },
      views: series(DAYS, [38, 44, 31, 58, 49, 52, 40]),
      website: series(DAYS, [9, 12, 7, 16, 12, 13, 9]),
      phone: series(DAYS, [5, 6, 4, 9, 6, 7, 4]),
      directions: series(DAYS, [3, 4, 2, 6, 4, 4, 3]),
    },
    '30d': {
      totals: { views: 1284, website: 326, phone: 148, directions: 92 },
      deltas: { views: 18.4, website: 12.7, phone: 8.3, directions: 15.2 },
      views: series(d30, [32, 38, 41, 36, 45, 52, 48, 39, 44, 51, 46, 40, 43, 55, 49, 42, 38, 47, 53, 44, 41, 48, 52, 39, 43, 46, 50, 44, 38, 40]),
      website: series(d30, [8, 10, 11, 9, 12, 14, 13, 10, 11, 13, 12, 10, 11, 14, 13, 11, 9, 12, 14, 11, 10, 12, 13, 10, 11, 12, 13, 11, 9, 10]),
      phone: series(d30, [4, 5, 5, 4, 6, 7, 6, 5, 5, 6, 6, 5, 5, 7, 6, 5, 4, 6, 7, 5, 5, 6, 6, 5, 5, 6, 6, 5, 4, 5]),
      directions: series(d30, [2, 3, 3, 3, 4, 4, 4, 3, 3, 4, 4, 3, 3, 4, 4, 3, 3, 4, 4, 3, 3, 4, 4, 3, 3, 4, 4, 3, 2, 3]),
    },
    '90d': {
      totals: { views: 3418, website: 861, phone: 392, directions: 244 },
      deltas: { views: 22.1, website: 16.4, phone: 11.2, directions: 9.8 },
      views: series(d90, [212, 248, 264, 286, 301, 288, 312, 334, 298, 321, 348, 366]),
      website: series(d90, [52, 61, 66, 72, 76, 71, 78, 84, 74, 80, 87, 92]),
      phone: series(d90, [24, 28, 30, 33, 35, 32, 36, 38, 34, 36, 40, 42]),
      directions: series(d90, [15, 17, 19, 21, 22, 20, 22, 24, 21, 23, 25, 26]),
    },
    '12m': {
      totals: { views: 11840, website: 2916, phone: 1284, directions: 806 },
      deltas: { views: 31.6, website: 24.9, phone: 18.7, directions: 21.4 },
      views: series(MONTHS, [612, 688, 540, 498, 820, 1120, 1450, 1180, 1090, 1240, 1320, 1282]),
      website: series(MONTHS, [148, 168, 132, 121, 190, 245, 318, 288, 266, 302, 328, 326]),
      phone: series(MONTHS, [64, 73, 58, 52, 74, 102, 140, 128, 118, 134, 143, 148]),
      directions: series(MONTHS, [41, 46, 36, 33, 48, 64, 88, 80, 74, 84, 90, 92]),
    },
    interest: [
      { label: 'Beach Bonfires', value: 486 },
      { label: 'Sunset Experiences', value: 312 },
      { label: 'Family Activities', value: 248 },
      { label: 'Things to do tonight', value: 176 },
      { label: 'Events', value: 92 },
    ],
    referrers: [
      { label: 'Explore 30A', value: 542 },
      { label: 'Asked Vitoria', value: 388 },
      { label: 'Host recommendation', value: 214 },
      { label: 'Map', value: 140 },
    ],
  },

  ptr_golfcarts: {
    '7d': {
      totals: { views: 268, website: 71, phone: 38, directions: 31 },
      deltas: { views: 9.2, website: 6.4, phone: -2.1, directions: 4.8 },
      views: series(DAYS, [34, 41, 29, 46, 40, 44, 34]),
      website: series(DAYS, [9, 11, 8, 12, 10, 12, 9]),
      phone: series(DAYS, [5, 6, 4, 7, 5, 6, 5]),
      directions: series(DAYS, [4, 5, 3, 6, 4, 5, 4]),
    },
    '30d': {
      totals: { views: 1102, website: 289, phone: 162, directions: 128 },
      deltas: { views: 9.2, website: 6.4, phone: -2.1, directions: 4.8 },
      views: series(d30, Array.from({ length: 30 }, (_, i) => 30 + ((i * 7) % 18))),
      website: series(d30, Array.from({ length: 30 }, (_, i) => 7 + ((i * 3) % 6))),
      phone: series(d30, Array.from({ length: 30 }, (_, i) => 4 + ((i * 2) % 4))),
      directions: series(d30, Array.from({ length: 30 }, (_, i) => 3 + ((i * 2) % 3))),
    },
    '90d': {
      totals: { views: 3040, website: 792, phone: 441, directions: 352 },
      deltas: { views: 14.8, website: 11.1, phone: 3.4, directions: 7.7 },
      views: series(d90, [198, 221, 234, 256, 268, 249, 276, 291, 262, 284, 302, 318]),
      website: series(d90, [51, 58, 61, 66, 70, 64, 72, 76, 68, 74, 79, 83]),
      phone: series(d90, [28, 32, 34, 37, 39, 36, 40, 42, 38, 41, 44, 46]),
      directions: series(d90, [22, 25, 27, 29, 31, 28, 32, 34, 30, 33, 35, 37]),
    },
    '12m': {
      totals: { views: 10420, website: 2688, phone: 1520, directions: 1204 },
      deltas: { views: 26.2, website: 19.8, phone: 12.4, directions: 16.1 },
      views: series(MONTHS, [560, 620, 480, 440, 742, 986, 1288, 1064, 980, 1120, 1180, 1102]),
      website: series(MONTHS, [142, 158, 124, 114, 190, 252, 332, 274, 252, 288, 302, 289]),
      phone: series(MONTHS, [80, 89, 70, 64, 108, 142, 188, 154, 142, 162, 170, 162]),
      directions: series(MONTHS, [63, 70, 55, 50, 85, 112, 148, 122, 112, 128, 134, 128]),
    },
    interest: [
      { label: 'Golf Cart Rentals', value: 512 },
      { label: 'Getting around 30A', value: 344 },
      { label: 'Family Activities', value: 228 },
      { label: 'Beach Activities', value: 164 },
    ],
    referrers: [
      { label: 'Explore 30A', value: 488 },
      { label: 'Asked Vitoria', value: 356 },
      { label: 'Map', value: 168 },
      { label: 'Host recommendation', value: 90 },
    ],
  },
}

/** Everything else gets a quiet-but-real dataset. */
export const EMPTY_ANALYTICS = {
  totals: { views: 0, website: 0, phone: 0, directions: 0 },
  deltas: { views: 0, website: 0, phone: 0, directions: 0 },
  views: [],
  website: [],
  phone: [],
  directions: [],
  interest: [],
  referrers: [],
}

export const mockAnalyticsFor = (partnerId, range) => {
  const set = mockAnalytics[partnerId]
  if (!set) return { ...EMPTY_ANALYTICS }
  return { ...set[range], interest: set.interest, referrers: set.referrers }
}
