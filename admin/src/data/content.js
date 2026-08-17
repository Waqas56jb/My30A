import { PHOTO } from '../assets/images'
import { rng, between, pick, shiftTime } from './seed'

/**
 * Guest-facing content and the media library behind it.
 *
 * The guest app sells 30A with photographs, so whoever runs marketing needs to
 * be able to change a hero image, reorder the featured experiences and pull a
 * promotion without a developer. That is all this is.
 */

export const CONTENT_TYPES = {
  hero: { label: 'Hero', tone: 'gold' },
  featured_experience: { label: 'Featured experience', tone: 'sea' },
  featured_partner: { label: 'Featured partner', tone: 'success' },
  beach: { label: 'Beach', tone: 'info' },
  restaurant: { label: 'Restaurant', tone: 'warn' },
  event: { label: 'Event', tone: 'info' },
  promotion: { label: 'Promotion', tone: 'gold' },
  lifestyle: { label: 'Lifestyle', tone: 'neutral' },
}

const BLOCKS = [
  ['Experience 30A like a local.', 'hero', PHOTO.heroEmerald, 'Landing hero — headline over the drone footage.', true],
  ['Make tonight unforgettable', 'featured_experience', PHOTO.bonfirePeople, 'Beach bonfires spotlight on the landing page.', true],
  ['Explore 30A your way', 'featured_experience', PHOTO.golfCartOcean, 'Golf carts spotlight.', true],
  ['Ride the whole coast', 'featured_experience', PHOTO.bikeRide, 'Biking spotlight.', true],
  ['Out on the water', 'featured_experience', PHOTO.boatSunset, 'Boating spotlight.', true],
  ['Everyone happy at once', 'featured_experience', PHOTO.familyWalk, 'Family spotlight.', false],
  ['30A Golf Cart Rentals', 'featured_partner', PHOTO.golfCartRow, 'Featured partner slot 1.', true],
  ['Beachside Bike Rentals', 'featured_partner', PHOTO.bikes, 'Featured partner slot 2.', true],
  ['Inlet Beach Regional Access', 'beach', PHOTO.beachAerial, 'Beach guide — parking, chairs, crowd notes.', true],
  ['Grayton Beach State Park', 'beach', PHOTO.beachDunes, 'Beach guide entry.', true],
  ['Ed Walline Access', 'beach', PHOTO.beachUmbrellas, 'Beach guide entry.', true],
  ['Great Southern Cafe', 'restaurant', PHOTO.seafoodPlate, 'Restaurant feature.', true],
  ['Restaurant Paradis', 'restaurant', PHOTO.diningFine, 'Restaurant feature.', true],
  ['Charlie’s Donut Truck', 'restaurant', PHOTO.bakery, 'Restaurant feature.', true],
  ['Seaside Summer Concert Series', 'event', PHOTO.patioLights, 'Events listing — Thursdays on the lawn.', true],
  ['Rosemary Farmers Market', 'event', PHOTO.coastalTown, 'Events listing — Saturday mornings.', true],
  ['Book groceries before you land', 'promotion', PHOTO.groceryBags, 'Promotional band on the services page.', true],
  ['A driver waiting at baggage claim', 'promotion', PHOTO.coastalRoad, 'Promotional band for transfers.', true],
  ['Sunrise on the sand', 'lifestyle', PHOTO.beachSunset, 'Lifestyle imagery block.', true],
  ['Slow mornings', 'lifestyle', PHOTO.yogaSunset, 'Lifestyle imagery block.', false],
]

function buildContent() {
  const random = rng(1129)
  return BLOCKS.map(([title, type, image, note, published], i) => ({
    id: `cnt_${String(i + 1).padStart(3, '0')}`,
    title,
    type,
    image,
    note,
    published,
    featured: type.startsWith('featured') || type === 'hero',
    order: i + 1,
    updatedBy: pick(random, ['Content Manager', 'Operations', 'Super Admin']),
    updatedAt: shiftTime(-between(random, 1, 120), between(random, 8, 19), 0),
  }))
}

export const mockContent = buildContent()

/* ------------------------------ Media library ---------------------------- */

export const MEDIA_CATEGORIES = [
  'Beach', 'Golf Cart', 'Bike', 'Bonfire', 'Boating', 'Food',
  'Family', 'Wellness', 'Events', 'Property', 'Partner',
]

const MEDIA_SEED = [
  [PHOTO.beachAerial, 'Beach', 'Emerald water from the air'],
  [PHOTO.beachTurquoise, 'Beach', 'Turquoise shallows'],
  [PHOTO.beachUmbrellas, 'Beach', 'Chair and umbrella service'],
  [PHOTO.beachDunes, 'Beach', 'Sea oats on the dune line'],
  [PHOTO.beachSunset, 'Beach', 'Sunset over the Gulf'],
  [PHOTO.beachBoardwalk, 'Beach', 'Boardwalk to the sand'],
  [PHOTO.duneWalkover, 'Beach', 'Dune walkover'],
  [PHOTO.golfCartOcean, 'Golf Cart', 'Cart above the ocean'],
  [PHOTO.golfCartRow, 'Golf Cart', 'Carts lined up'],
  [PHOTO.golfCartCourse, 'Golf Cart', 'Riding the cart path'],
  [PHOTO.bikeRide, 'Bike', 'Cycling the coast road'],
  [PHOTO.bikes, 'Bike', 'Cruisers ready to go'],
  [PHOTO.bikeBoardwalk, 'Bike', 'Bikes on the boardwalk'],
  [PHOTO.bonfirePeople, 'Bonfire', 'Group around a beach fire'],
  [PHOTO.bonfireGroup, 'Bonfire', 'Sitting around the fire'],
  [PHOTO.campfire, 'Bonfire', 'Fire at dusk'],
  [PHOTO.boatSunset, 'Boating', 'Boat at sunset'],
  [PHOTO.boatPontoon, 'Boating', 'Pontoon on the bay'],
  [PHOTO.boatYacht, 'Boating', 'Charter under sail'],
  [PHOTO.paddleboard, 'Boating', 'Paddleboards on a dune lake'],
  [PHOTO.seafoodPlate, 'Food', 'Gulf seafood'],
  [PHOTO.oysters, 'Food', 'Raw bar'],
  [PHOTO.diningPatio, 'Food', 'Patio dining'],
  [PHOTO.diningFine, 'Food', 'Dinner service'],
  [PHOTO.bakery, 'Food', 'Morning pastries'],
  [PHOTO.cocktails, 'Food', 'Cocktails at golden hour'],
  [PHOTO.familyWalk, 'Family', 'Family walking the shore'],
  [PHOTO.familyShore, 'Family', 'Kids at the water line'],
  [PHOTO.familyPhoto, 'Family', 'Family portrait session'],
  [PHOTO.beachKids, 'Family', 'Children in the shallows'],
  [PHOTO.yogaSunset, 'Wellness', 'Beach yoga at sunrise'],
  [PHOTO.spaMassage, 'Wellness', 'In-home massage'],
  [PHOTO.spaStones, 'Wellness', 'Treatment room'],
  [PHOTO.patioLights, 'Events', 'Evening on the green'],
  [PHOTO.coastalTown, 'Events', 'Market in the square'],
  [PHOTO.houseWhite, 'Property', 'White coastal house'],
  [PHOTO.houseLuxury, 'Property', 'Gulf-front home'],
  [PHOTO.houseModern, 'Property', 'Modern beach house'],
  [PHOTO.interiorLiving, 'Property', 'Living room'],
  [PHOTO.interiorKitchen, 'Property', 'Kitchen'],
  [PHOTO.interiorBedroom, 'Property', 'Bunk room'],
  [PHOTO.poolDeck, 'Property', 'Pool deck'],
  [PHOTO.photographer, 'Partner', 'Photographer at work'],
  [PHOTO.fishing, 'Partner', 'Fishing charter'],
  [PHOTO.kayak, 'Partner', 'Kayak tour'],
  [PHOTO.golfCourse, 'Partner', 'Championship course'],
  [PHOTO.tennis, 'Partner', 'Tennis courts'],
  [PHOTO.groceryBags, 'Partner', 'Grocery delivery drop'],
]

const USED_BY = [
  'Landing hero', 'Experience tile', 'Beach guide', 'Partner listing',
  'Property gallery', 'Promotion band', 'Unused',
]

function buildMedia() {
  const random = rng(5150)
  return MEDIA_SEED.map(([photoId, category, name], i) => ({
    id: `med_${String(i + 1).padStart(3, '0')}`,
    photoId,
    name,
    category,
    usedBy: pick(random, USED_BY),
    featured: random() < 0.18,
    status: random() < 0.94 ? 'active' : 'archived',
    uploadedBy: pick(random, ['Content Manager', 'Operations', 'Super Admin']),
    uploadedAt: shiftTime(-between(random, 2, 400), between(random, 8, 19), 0),
  }))
}

export const mockMedia = buildMedia()
