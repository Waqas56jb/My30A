import { PHOTO } from '../assets/images'

/**
 * Properties a host has configured for Vitoria.
 * Keyed by slug so a guest link like /guest/rosemary-beach-house resolves here.
 */
export const mockProperties = [
  {
    id: 'prop_rosemary_01',
    slug: 'rosemary-beach-house',
    name: 'Rosemary Beach House',
    tagline: 'Three blocks from the Gulf, one block from Main Street.',
    community: 'Rosemary Beach',
    address: '148 Barrett Square, Rosemary Beach, FL 32461',
    coordinates: { lat: 30.2758, lng: -86.0083 },
    heroImage: PHOTO.houseWhite,
    gallery: [
      PHOTO.houseWhite,
      PHOTO.interiorLiving,
      PHOTO.interiorKitchen,
      PHOTO.interiorBedroom,
      PHOTO.poolDeck,
      PHOTO.beachUmbrellas,
    ],
    bedrooms: 4,
    bathrooms: 3.5,
    sleeps: 10,
    checkIn: '4:00 PM',
    checkOut: '10:00 AM',
    wifi: {
      network: '30A-GUEST',
      password: 'BeachHouse2026',
      note: 'Fastest signal on the main floor and the carriage house.',
    },
    access: {
      method: 'Smart lock keypad',
      code: '2 0 4 8 #',
      instructions:
        'The keypad is on the courtyard gate first, then the front door uses the same code. Press the star key once to wake the lock, enter the code, then press #.',
      parking:
        'Two spaces in the carriage house driveway. Do not park on Barrett Square — Rosemary Beach patrol tickets after 9 PM. Additional guest parking is at the Western Green lot.',
      trash:
        'Bins live behind the carriage house. Pickup is Tuesday and Friday mornings — please roll them to the alley the night before.',
    },
    checkInSteps: [
      'Your door code activates at 4:00 PM on arrival day — we will text if the home is ready early.',
      'Park in the carriage house driveway; the courtyard gate is the tall wooden door on the left.',
      'The welcome binder, beach passes, and bike keys are on the kitchen island.',
      'Air conditioning is preset to 72°. Please keep exterior doors closed while it runs.',
    ],
    checkOutSteps: [
      'Check-out is 10:00 AM. Late check-out can sometimes be arranged — just ask Vitoria.',
      'Start the dishwasher and leave used towels in the downstairs bathtub.',
      'Return all six bikes to the carriage house and lock the rack.',
      'Set the thermostat to 78° and pull the front door firmly closed behind you.',
    ],
    houseRules: [
      'No smoking anywhere on the property, including the porches and courtyard.',
      'Quiet hours are 10:00 PM – 8:00 AM per Rosemary Beach ordinance.',
      'No pets at this property.',
      'Maximum 10 guests overnight; no events or parties.',
      'Please rinse sand at the outdoor shower before coming inside.',
    ],
    amenities: [
      'Private heated pool',
      'Six beach cruisers',
      'Gulf views from the tower',
      'Outdoor shower',
      'Screened porch',
      'Beach chairs & umbrella',
      'Washer & dryer',
      'Fully stocked kitchen',
    ],
    beachAccess: {
      name: 'Barrett Square Beach Walkover',
      walkTime: '4 min walk',
      note: 'Chairs and umbrellas are set up daily from 9 AM (March–October).',
    },
    emergency: [
      { label: 'Emergency services', value: '911', type: 'phone' },
      { label: 'Walton County Sheriff (non-emergency)', value: '(850) 892-8111', type: 'phone' },
      { label: 'South Walton Fire District', value: '(850) 267-1298', type: 'phone' },
      { label: 'Ascension Sacred Heart ER, Miramar Beach', value: '(850) 278-3000', type: 'phone' },
      { label: 'Beach patrol / rip current line', value: '(850) 622-5115', type: 'phone' },
    ],
    host: {
      name: 'Michael Reyes',
      company: 'Coastal Key Property Group',
      role: 'Your host',
      phone: '(850) 555-0142',
      email: 'michael@coastalkey30a.com',
      avatar: PHOTO.hostMichael,
      responseTime: 'Usually replies within an hour',
    },
  },
  {
    id: 'prop_watercolor_02',
    slug: 'watercolor-dune-cottage',
    name: 'WaterColor Dune Cottage',
    tagline: 'A quiet cottage steps from Western Lake.',
    community: 'WaterColor',
    address: '32 Sandy Shore Lane, Santa Rosa Beach, FL 32459',
    coordinates: { lat: 30.3235, lng: -86.1573 },
    heroImage: PHOTO.houseModern,
    gallery: [PHOTO.houseModern, PHOTO.interiorBedroom, PHOTO.poolDeck, PHOTO.beachDunes],
    bedrooms: 3,
    bathrooms: 2,
    sleeps: 6,
    checkIn: '4:00 PM',
    checkOut: '10:00 AM',
    wifi: {
      network: 'DuneCottage-Guest',
      password: 'WesternLake26',
      note: 'Mesh points in the living room and primary bedroom.',
    },
    access: {
      method: 'Lockbox',
      code: '7 1 9 2',
      instructions: 'The lockbox is mounted beside the outdoor shower on the east wall.',
      parking: 'One covered space plus one driveway space. No street parking overnight.',
      trash: 'Curbside pickup Monday and Thursday.',
    },
    checkInSteps: [
      'Door code activates at 4:00 PM on arrival day.',
      'Beach passes for the WaterColor Beach Club are on the entry table.',
      'Bikes are in the shed; the key is on the kitchen hook.',
    ],
    checkOutSteps: [
      'Check-out is 10:00 AM.',
      'Run the dishwasher and leave towels in the laundry room.',
      'Lock the shed and return the lockbox key.',
    ],
    houseRules: [
      'No smoking indoors or outdoors.',
      'Quiet hours 10:00 PM – 8:00 AM.',
      'Two dogs under 40 lbs welcome with prior approval.',
      'Maximum 6 overnight guests.',
    ],
    amenities: [
      'Screened porch',
      'Four bikes',
      'Kayaks for Western Lake',
      'Outdoor shower',
      'Gas grill',
    ],
    beachAccess: {
      name: 'WaterColor Beach Club',
      walkTime: '9 min walk',
      note: 'Wristbands required — they are in the welcome binder.',
    },
    emergency: [
      { label: 'Emergency services', value: '911', type: 'phone' },
      { label: 'Walton County Sheriff (non-emergency)', value: '(850) 892-8111', type: 'phone' },
      { label: 'South Walton Fire District', value: '(850) 267-1298', type: 'phone' },
    ],
    host: {
      name: 'Michael Reyes',
      company: 'Coastal Key Property Group',
      role: 'Your host',
      phone: '(850) 555-0142',
      email: 'michael@coastalkey30a.com',
      avatar: PHOTO.hostMichael,
      responseTime: 'Usually replies within an hour',
    },
  },
]

export const getPropertyBySlug = (slug) => mockProperties.find((p) => p.slug === slug)
export const getPropertyById = (id) => mockProperties.find((p) => p.id === id)
