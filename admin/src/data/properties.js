import { PHOTO } from '../assets/images'
import { mockHosts } from './hosts'
import { rng, between, pick, pickWeighted, shiftTime, TOWNS, STREETS } from './seed'

export const PROPERTY_STATUSES = {
  active: { label: 'Active', tone: 'success', icon: 'checkCircle' },
  pending: { label: 'Pending', tone: 'warn', icon: 'clock' },
  inactive: { label: 'Inactive', tone: 'muted', icon: 'circle' },
  suspended: { label: 'Suspended', tone: 'danger', icon: 'alert' },
}

const PROPERTY_TYPES = ['Beach House', 'Vacation Home', 'Condo', 'Villa', 'Cottage', 'Apartment']

const HOUSE_IMAGES = [
  PHOTO.houseWhite, PHOTO.houseLuxury, PHOTO.houseModern,
  PHOTO.interiorLiving, PHOTO.interiorKitchen, PHOTO.interiorBedroom, PHOTO.poolDeck,
]

const NAME_A = ['Rosemary', 'Alys', 'Seagrove', 'Watercolor', 'Grayton', 'Inlet', 'Seacrest', 'Blue Mountain', 'Dune Allen', 'Watersound', 'Santa Rosa', 'Seaside']
const NAME_B = ['Beach House', 'Dune Cottage', 'Sandpiper', 'Gulf View', 'Palmetto', 'Coquina House', 'Sea Oats', 'Heron Lodge', 'Bluewater', 'Salt & Pine', 'Driftwood', 'Magnolia House']

const RULES = [
  'No smoking anywhere on the property, including the porches.',
  'Quiet hours from 10:00 PM. Sound carries between the houses here.',
  'Maximum occupancy is the number on your booking — no additional overnight guests.',
  'No parties or events without written approval from the host.',
  'Please rinse sand off at the outdoor shower before coming inside.',
  'Pets are not permitted.',
  'Trash goes out Tuesday and Friday mornings.',
]

function buildProperties() {
  const random = rng(2718)
  const activeHosts = mockHosts.filter((h) => h.status !== 'rejected')

  return Array.from({ length: 56 }, (_, i) => {
    const host = activeHosts[i % activeHosts.length]
    const town = pick(random, TOWNS)
    const name = `${NAME_A[i % NAME_A.length]} ${NAME_B[(i * 3 + 1) % NAME_B.length]}`
    const status = host.status === 'suspended'
      ? 'suspended'
      : pickWeighted(random, [['active', 80], ['pending', 9], ['inactive', 8], ['suspended', 3]])
    const bedrooms = between(random, 2, 7)

    return {
      id: `prop_${String(i + 1).padStart(3, '0')}`,
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      hostId: host.id,
      hostName: host.name,
      type: pick(random, PROPERTY_TYPES),
      town,
      address: `${between(random, 10, 980)} ${pick(random, STREETS)}, ${town}, FL 32461`,
      status,
      bedrooms,
      bathrooms: Math.max(1, bedrooms - between(random, 0, 2)),
      sleeps: bedrooms * 2 + between(random, 0, 4),
      images: [
        HOUSE_IMAGES[i % HOUSE_IMAGES.length],
        HOUSE_IMAGES[(i + 3) % HOUSE_IMAGES.length],
        HOUSE_IMAGES[(i + 5) % HOUSE_IMAGES.length],
      ],
      wifi: {
        network: `${name.split(' ')[0]}_Guest`,
        password: `Beach${between(random, 1000, 9999)}`,
        notes: 'Router is in the laundry cupboard if it needs a restart.',
      },
      checkIn: { time: '4:00 PM', instructions: `Front door keypad code ${between(random, 1000, 9999)}#. The lockbox by the garage holds a spare.` },
      checkOut: { time: '10:00 AM', instructions: 'Strip the beds, start the dishwasher, leave the keypad code as it is.' },
      parking: `${between(random, 1, 3)} spaces in the driveway. Street parking is not permitted overnight.`,
      rules: RULES.slice(0, between(random, 4, 7)),
      emergency: {
        contactName: host.name,
        contactPhone: host.phone,
        managerPhone: '(850) 555-0177',
        hospital: 'Sacred Heart Emerald Coast, 7800 US-98, Miramar Beach',
      },
      recommendations: between(random, 3, 14),
      vitoria: {
        enabled: status === 'active',
        tone: pick(random, ['Warm and local', 'Concise', 'Playful']),
        specialNotes: '',
        escalateAfter: between(random, 2, 4),
      },
      currentGuests: 0, // filled in by guests.js
      stats: {
        guestSessions: between(random, 0, 320),
        conversations: between(random, 0, 210),
        serviceRequests: between(random, 0, 34),
        satisfaction: status === 'active' ? Number((4.0 + random() * 0.9).toFixed(2)) : null,
      },
      createdAt: shiftTime(-between(random, 10, 700), between(random, 8, 20), 0),
    }
  })
}

export const mockProperties = buildProperties()

/** Host property counts are derived, never stored twice. */
export const propertyCountFor = (properties, hostId) =>
  properties.filter((p) => p.hostId === hostId).length

export const propertyById = (list, id) => list.find((p) => p.id === id) ?? null
