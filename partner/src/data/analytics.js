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
