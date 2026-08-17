import { PHOTO } from '../assets/images'

/**
 * Local Guide categories.
 *
 * These are the buckets the guest app browses by, and the buckets a partner
 * applies into. Admin owns them: create, rename, reorder, disable. Disabling a
 * category hides it from guests without deleting the partners inside it, which
 * is what you want in the off-season.
 */
export const mockCategories = [
  { id: 'cat_golf_carts', name: 'Golf Carts', slug: 'golf-carts', icon: 'car', image: PHOTO.golfCartOcean, order: 1, enabled: true, description: 'Street-legal carts delivered to the driveway.', listings: 11 },
  { id: 'cat_bikes', name: 'Bikes', slug: 'bikes', icon: 'bike', image: PHOTO.bikeRide, order: 2, enabled: true, description: 'Cruisers and e-bikes for the nineteen-mile trail.', listings: 9 },
  { id: 'cat_bonfires', name: 'Beach Bonfires', slug: 'bonfires', icon: 'flame', image: PHOTO.bonfirePeople, order: 3, enabled: true, description: 'Permit, wood, chairs and cleanup, all handled.', listings: 7 },
  { id: 'cat_boating', name: 'Boating', slug: 'boating', icon: 'boat', image: PHOTO.boatSunset, order: 4, enabled: true, description: 'Private charters, dolphin runs and pontoons.', listings: 8 },
  { id: 'cat_fishing', name: 'Fishing', slug: 'fishing', icon: 'boat', image: PHOTO.fishing, order: 5, enabled: true, description: 'Inshore, offshore and surf fishing guides.', listings: 5 },
  { id: 'cat_photography', name: 'Photography', slug: 'photography', icon: 'camera', image: PHOTO.photographer, order: 6, enabled: true, description: 'Sunrise family sessions on the sand.', listings: 6 },
  { id: 'cat_wellness', name: 'Wellness', slug: 'wellness', icon: 'leaf', image: PHOTO.yogaSunset, order: 7, enabled: true, description: 'Beach yoga, breathwork and recovery.', listings: 6 },
  { id: 'cat_spa', name: 'Spa', slug: 'spa', icon: 'leaf', image: PHOTO.spaMassage, order: 8, enabled: true, description: 'In-home massage and treatments.', listings: 4 },
  { id: 'cat_restaurants', name: 'Restaurants', slug: 'restaurants', icon: 'utensils', image: PHOTO.diningPatio, order: 9, enabled: true, description: 'From a donut truck to a rooftop at golden hour.', listings: 14 },
  { id: 'cat_family', name: 'Family', slug: 'family', icon: 'users', image: PHOTO.familyWalk, order: 10, enabled: true, description: 'Surf lessons, beach gear and vetted sitters.', listings: 7 },
  { id: 'cat_events', name: 'Events', slug: 'events', icon: 'ticket', image: PHOTO.patioLights, order: 11, enabled: true, description: 'Concerts, markets and films on the green.', listings: 5 },
  { id: 'cat_transportation', name: 'Transportation', slug: 'transportation', icon: 'car', image: PHOTO.coastalRoad, order: 12, enabled: true, description: 'Airport runs, shuttles and evening rides.', listings: 6 },
  { id: 'cat_activities', name: 'Activities', slug: 'activities', icon: 'compass', image: PHOTO.kayak, order: 13, enabled: true, description: 'Paddleboards, kayaks, tennis and golf.', listings: 9 },
  { id: 'cat_shopping', name: 'Shopping', slug: 'shopping', icon: 'bag', image: PHOTO.coastalTown, order: 14, enabled: false, description: 'Seaside boutiques and the Airstreams.', listings: 4 },
]

export const categoryById = (list, id) => list.find((c) => c.id === id) ?? null
export const categoryName = (list, id) => categoryById(list, id)?.name ?? 'Uncategorised'
