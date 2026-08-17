import { guestLink } from '../config/links'
import { PHOTO } from '../assets/images'

export const PROPERTY_TYPES = [
  'Beach House',
  'Vacation Home',
  'Condo',
  'Apartment',
  'Villa',
  'Cottage',
  'Other',
]

export const PHOTO_CATEGORIES = [
  'Exterior',
  'Living Room',
  'Bedroom',
  'Kitchen',
  'Bathroom',
  'Pool',
  'Beach Access',
  'Other',
]

export const PROPERTY_STATUSES = {
  draft: {
    label: 'Draft',
    tone: 'neutral',
    description: 'Guests cannot open the property experience yet.',
  },
  published: {
    label: 'Published',
    tone: 'ok',
    description: 'Guest access is live. Anyone with the link or QR can open their stay.',
  },
  paused: {
    label: 'Paused',
    tone: 'warn',
    description: 'Guest access is temporarily disabled. Existing links will not open.',
  },
}

/**
 * The sections a host has to fill in before a property is genuinely useful to
 * a guest. `key` matches the property field it reads from, and `route` is the
 * page that completes it — the dashboard checklist links straight through.
 */
export const SETUP_SECTIONS = [
  { key: 'information', label: 'Property information', route: 'information', icon: 'building' },
  { key: 'wifi', label: 'WiFi', route: 'wifi', icon: 'wifi' },
  { key: 'checkIn', label: 'Check-in', route: 'check-in', icon: 'key' },
  { key: 'checkOut', label: 'Check-out', route: 'check-out', icon: 'clock' },
  { key: 'rules', label: 'House rules', route: 'rules', icon: 'shield' },
  { key: 'parking', label: 'Parking', route: 'parking', icon: 'car' },
  { key: 'emergency', label: 'Emergency contacts', route: 'emergency', icon: 'alert' },
  { key: 'recommendations', label: 'Local recommendations', route: 'recommendations', icon: 'sparkles' },
  { key: 'photos', label: 'Photos', route: 'photos', icon: 'image' },
  { key: 'guestAccess', label: 'Guest access', route: 'guest-access', icon: 'grid' },
]

const rosemaryRules = [
  { id: 'r1', title: 'No smoking anywhere on the property', note: 'Includes porches and the courtyard.', enabled: true },
  { id: 'r2', title: 'Quiet hours 10:00 PM – 8:00 AM', note: 'Rosemary Beach ordinance.', enabled: true },
  { id: 'r3', title: 'No pets', note: '', enabled: true },
  { id: 'r4', title: 'Maximum 10 overnight guests', note: 'No events or parties.', enabled: true },
  { id: 'r5', title: 'Rinse sand at the outdoor shower', note: 'Before coming inside, please.', enabled: true },
  { id: 'r6', title: 'Pool closes at 10:00 PM', note: 'No glass inside the pool fence.', enabled: true },
  { id: 'r7', title: 'Return beach gear to the carriage house', note: '', enabled: false },
]

export const mockProperties = [
  {
    id: 'prop_rosemary',
    slug: 'rosemary-house-12',
    name: 'Rosemary Beach House',
    type: 'Beach House',
    status: 'published',
    createdAt: '2025-03-14T10:00:00',
    publishedAt: '2025-04-02T09:20:00',
    updatedAt: '2026-08-14T16:40:00',

    address: '148 Barrett Square',
    city: 'Rosemary Beach',
    state: 'FL',
    zip: '32461',
    community: 'Rosemary Beach',
    coordinates: { lat: 30.2758, lng: -86.0083 },

    bedrooms: 4,
    bathrooms: 3.5,
    maxGuests: 10,
    description:
      'A four-bedroom beach house three blocks from the Gulf and one block from Main Street, with a private heated pool, six cruisers in the carriage house, and Gulf views from the tower.',
    phone: '(850) 555-0142',
    email: 'stay@coastalkey30a.com',

    checkInTime: '4:00 PM',
    checkOutTime: '10:00 AM',

    coverImage: PHOTO.houseWhite,
    photos: [
      { id: 'ph1', image: PHOTO.houseWhite, category: 'Exterior', caption: 'Front elevation from Barrett Square', cover: true },
      { id: 'ph2', image: PHOTO.interiorLiving, category: 'Living Room', caption: 'Main living room', cover: false },
      { id: 'ph3', image: PHOTO.interiorKitchen, category: 'Kitchen', caption: 'Kitchen and island seating', cover: false },
      { id: 'ph4', image: PHOTO.interiorBedroom, category: 'Bedroom', caption: 'Primary bedroom', cover: false },
      { id: 'ph5', image: PHOTO.poolDeck, category: 'Pool', caption: 'Private heated pool', cover: false },
      { id: 'ph6', image: PHOTO.duneWalkover, category: 'Beach Access', caption: 'Barrett Square walkover', cover: false },
    ],

    wifi: {
      network: 'RosemaryGuest',
      password: 'BeachHouse2026',
      notes: 'Fastest signal on the main floor and in the carriage house. The router is in the laundry closet if it needs a restart.',
    },

    checkIn: {
      time: '4:00 PM',
      earlyCheckIn:
        'Early check-in is sometimes possible if the house is ready — guests should ask Vitoria on the morning of arrival.',
      arrival:
        'Park in the carriage house driveway. The courtyard gate is the tall wooden door on the left.',
      entrance: 'Courtyard gate, then the front door — both use the same code.',
      lockType: 'Smart lock keypad',
      doorCode: '2048#',
      keypadInstructions:
        'Press the star key once to wake the lock, enter the code, then press #. The code activates at 4:00 PM on arrival day.',
      lockbox: 'Backup lockbox on the carriage house wall, code 7714.',
      onArrival:
        'The welcome binder, beach passes, and bike keys are on the kitchen island. Air conditioning is preset to 72°.',
    },

    checkOut: {
      time: '10:00 AM',
      lockUp: 'Pull the front door firmly closed and check the courtyard gate latches.',
      trash: 'Bins live behind the carriage house. Pickup is Tuesday and Friday mornings.',
      dishwasher: 'Please start the dishwasher before you leave.',
      laundry: 'Leave used towels in the downstairs bathtub. No need to run laundry.',
      keys: 'Return all six bike keys to the hook by the kitchen door and lock the rack.',
      thermostat: 'Set the thermostat to 78° before leaving.',
      notes: 'Late check-out can sometimes be arranged — guests should ask the day before.',
    },

    rules: rosemaryRules,

    parking: {
      available: true,
      spaces: 2,
      location: 'Carriage house driveway',
      passRequired: true,
      passInstructions:
        'Two parking passes hang inside the front door. They must be visible on the dash overnight.',
      garage: 'No garage access — the carriage house is guest accommodation.',
      street:
        'Do not park on Barrett Square. Rosemary Beach patrol tickets after 9 PM. Overflow parking is at the Western Green lot.',
      notes: 'Please park only in the marked spaces.',
    },

    emergency: {
      contactName: 'Michael Reyes',
      contactPhone: '(850) 555-0142',
      managerPhone: '(850) 555-0142',
      maintenancePhone: '(850) 555-0177',
      securityPhone: '(850) 892-8111',
      hospital: 'Ascension Sacred Heart, Miramar Beach — (850) 278-3000, about 25 minutes west.',
      fireExtinguisher: 'Under the kitchen sink and on the second-floor landing.',
      firstAid: 'Top shelf of the laundry room cupboard.',
      utilityShutoff:
        'Water shutoff is in the courtyard by the outdoor shower. Breaker panel is in the carriage house.',
      notes: 'For anything urgent, call 911 first, then the property manager.',
    },

    branding: {
      welcomeMessage:
        "Welcome to Rosemary Beach House! I'm Vitoria, your local 30A concierge. I'm here to make your stay effortless — ask me anything about the house or the coast.",
      accent: 'sea',
      showHostContact: true,
    },

    vitoria: {
      enabled: true,
      specialNotes:
        'The pool heater takes about four hours to come up to temperature. The tower room gets warm in the afternoon — the blackout blinds help.',
      preferredRecommendations: true,
      escalateAfter: 2,
    },

    guestAccess: {
      enabled: true,
      link: guestLink('rosemary-house-12'),
      code: 'MY30A-8842',
      generatedAt: '2025-04-02T09:22:00',
      activeGuests: 2,
      totalGuests: 47,
    },

    stats: {
      activeGuests: 2,
      guestSessions: 47,
      conversations: 183,
      satisfaction: 4.8,
      propertyViews: 612,
      experienceClicks: 274,
    },
  },

  {
    id: 'prop_seaside',
    slug: 'seaside-condo-04',
    name: 'Seaside Condo',
    type: 'Condo',
    status: 'published',
    createdAt: '2025-06-02T12:00:00',
    publishedAt: '2025-06-11T08:00:00',
    updatedAt: '2026-08-10T11:15:00',

    address: '25 Central Square, Unit 4',
    city: 'Seaside',
    state: 'FL',
    zip: '32459',
    community: 'Seaside',
    coordinates: { lat: 30.3178, lng: -86.1432 },

    bedrooms: 2,
    bathrooms: 2,
    maxGuests: 5,
    description:
      'A two-bedroom condo directly on Central Square — the amphitheatre, the Airstreams, and the beach pavilions are all a two-minute walk.',
    phone: '(850) 555-0142',
    email: 'stay@coastalkey30a.com',

    checkInTime: '4:00 PM',
    checkOutTime: '10:00 AM',

    coverImage: PHOTO.coastalTown,
    photos: [
      { id: 'sp1', image: PHOTO.coastalTown, category: 'Exterior', caption: 'On Central Square', cover: true },
      { id: 'sp2', image: PHOTO.interiorLiving, category: 'Living Room', caption: 'Living area', cover: false },
      { id: 'sp3', image: PHOTO.beachBoardwalk, category: 'Beach Access', caption: 'Pavilion walkover', cover: false },
    ],

    wifi: { network: 'SeasideSquare-4', password: 'CentralSq25', notes: '' },

    checkIn: {
      time: '4:00 PM',
      earlyCheckIn: '',
      arrival: 'Enter from the square side; the stairwell is beside the bookshop.',
      entrance: 'Stairwell door then unit 4.',
      lockType: 'Keypad',
      doorCode: '4417',
      keypadInstructions: 'Enter the code then press the lock symbol.',
      lockbox: '',
      onArrival: 'Beach wristbands are in the kitchen drawer nearest the fridge.',
    },

    checkOut: {
      time: '10:00 AM',
      lockUp: 'Close the balcony door and lock the front door behind you.',
      trash: 'Chute is at the end of the corridor.',
      dishwasher: 'Please start the dishwasher.',
      laundry: '',
      keys: 'Leave the wristbands in the kitchen drawer.',
      thermostat: 'Set to 78°.',
      notes: '',
    },

    rules: [
      { id: 'sr1', title: 'No smoking', note: '', enabled: true },
      { id: 'sr2', title: 'Quiet hours 10:00 PM – 8:00 AM', note: 'Sound carries across the square.', enabled: true },
      { id: 'sr3', title: 'Maximum 5 overnight guests', note: '', enabled: true },
      { id: 'sr4', title: 'No pets', note: '', enabled: true },
    ],

    parking: {
      available: true,
      spaces: 1,
      location: 'Assigned space 4B behind the building',
      passRequired: true,
      passInstructions: 'The pass hangs by the front door and must be on the mirror.',
      garage: '',
      street: 'Street parking in Seaside is paid and very limited after 10 AM.',
      notes: '',
    },

    emergency: {
      contactName: 'Michael Reyes',
      contactPhone: '(850) 555-0142',
      managerPhone: '(850) 555-0142',
      maintenancePhone: '(850) 555-0177',
      securityPhone: '(850) 892-8111',
      hospital: 'Ascension Sacred Heart, Miramar Beach — (850) 278-3000.',
      fireExtinguisher: 'Kitchen, under the sink.',
      firstAid: 'Hall cupboard.',
      utilityShutoff: 'Building maintenance handles shutoffs — call the manager.',
      notes: '',
    },

    branding: {
      welcomeMessage:
        "Welcome to Seaside! I'm Vitoria. You're right on Central Square — ask me what's on at the amphitheatre tonight.",
      accent: 'sea',
      showHostContact: true,
    },

    vitoria: {
      enabled: true,
      specialNotes: 'The square gets loud on concert nights — mention the white noise machine in the second bedroom.',
      preferredRecommendations: true,
      escalateAfter: 2,
    },

    guestAccess: {
      enabled: true,
      link: guestLink('seaside-condo-04'),
      code: 'MY30A-6310',
      generatedAt: '2025-06-11T08:02:00',
      activeGuests: 1,
      totalGuests: 22,
    },

    stats: {
      activeGuests: 1,
      guestSessions: 22,
      conversations: 76,
      satisfaction: 4.6,
      propertyViews: 244,
      experienceClicks: 118,
    },
  },

  {
    id: 'prop_watercolor',
    slug: 'watercolor-villa-08',
    name: 'WaterColor Villa',
    type: 'Villa',
    status: 'draft',
    createdAt: '2026-07-28T14:30:00',
    publishedAt: null,
    updatedAt: '2026-08-15T09:05:00',

    address: '32 Sandy Shore Lane',
    city: 'Santa Rosa Beach',
    state: 'FL',
    zip: '32459',
    community: 'WaterColor',
    coordinates: { lat: 30.3235, lng: -86.1573 },

    bedrooms: 3,
    bathrooms: 2,
    maxGuests: 6,
    description: 'A quiet villa a short walk from Western Lake and the WaterColor Beach Club.',
    phone: '',
    email: '',

    checkInTime: '4:00 PM',
    checkOutTime: '10:00 AM',

    coverImage: PHOTO.houseModern,
    photos: [
      { id: 'wp1', image: PHOTO.houseModern, category: 'Exterior', caption: '', cover: true },
    ],

    wifi: { network: '', password: '', notes: '' },

    checkIn: {
      time: '4:00 PM',
      earlyCheckIn: '',
      arrival: '',
      entrance: '',
      lockType: 'Lockbox',
      doorCode: '',
      keypadInstructions: '',
      lockbox: '',
      onArrival: '',
    },

    checkOut: {
      time: '10:00 AM',
      lockUp: '',
      trash: '',
      dishwasher: '',
      laundry: '',
      keys: '',
      thermostat: '',
      notes: '',
    },

    rules: [],

    parking: {
      available: true,
      spaces: 2,
      location: '',
      passRequired: false,
      passInstructions: '',
      garage: '',
      street: '',
      notes: '',
    },

    emergency: {
      contactName: '',
      contactPhone: '',
      managerPhone: '',
      maintenancePhone: '',
      securityPhone: '',
      hospital: '',
      fireExtinguisher: '',
      firstAid: '',
      utilityShutoff: '',
      notes: '',
    },

    branding: { welcomeMessage: '', accent: 'sea', showHostContact: true },

    vitoria: { enabled: false, specialNotes: '', preferredRecommendations: true, escalateAfter: 2 },

    guestAccess: {
      enabled: false,
      link: guestLink('watercolor-villa-08'),
      code: 'MY30A-7725',
      generatedAt: null,
      activeGuests: 0,
      totalGuests: 0,
    },

    stats: {
      activeGuests: 0,
      guestSessions: 0,
      conversations: 0,
      satisfaction: null,
      propertyViews: 0,
      experienceClicks: 0,
    },
  },
]

/**
 * A section counts as complete when the fields a guest would actually miss are
 * filled in — not merely when the object exists.
 */
export function sectionComplete(property, key, recommendationCount = 0) {
  if (!property) return false
  switch (key) {
    case 'information':
      return Boolean(property.name && property.address && property.city && property.description)
    case 'wifi':
      return Boolean(property.wifi?.network && property.wifi?.password)
    case 'checkIn':
      return Boolean(property.checkIn?.time && property.checkIn?.arrival && property.checkIn?.doorCode)
    case 'checkOut':
      return Boolean(property.checkOut?.time && property.checkOut?.lockUp)
    case 'rules':
      return (property.rules ?? []).some((rule) => rule.enabled)
    case 'parking':
      return Boolean(property.parking?.location)
    case 'emergency':
      return Boolean(property.emergency?.contactPhone && property.emergency?.hospital)
    case 'recommendations':
      return recommendationCount > 0
    case 'photos':
      return (property.photos ?? []).length >= 3
    case 'guestAccess':
      return Boolean(property.guestAccess?.enabled && property.status === 'published')
    default:
      return false
  }
}

export function setupProgress(property, recommendationCount = 0) {
  const items = SETUP_SECTIONS.map((section) => ({
    ...section,
    done: sectionComplete(property, section.key, recommendationCount),
  }))
  const done = items.filter((item) => item.done).length
  return { items, done, total: items.length, percent: Math.round((done / items.length) * 100) }
}
