/**
 * Centralised image registry.
 *
 * All imagery is hosted remotely (Unsplash CDN) so nothing copyrighted is
 * checked into the repo. `img()` returns a size-optimised, cropped URL; every
 * consumer renders through <SmartImage> which handles loading + failure states,
 * so a dead URL degrades to a branded placeholder instead of a broken layout.
 */

const BASE = 'https://images.unsplash.com/photo-'

/**
 * @param {string} id Unsplash photo id (the numeric-hash part of the URL)
 * @param {number} [w] target width in px
 * @param {number} [ratio] width/height ratio used to derive the crop height
 */
export function img(id, w = 1200, ratio = 1.5) {
  const h = Math.round(w / ratio)
  return `${BASE}${id}?auto=format&fit=crop&w=${w}&h=${h}&q=72`
}

/**
 * Ids grouped by subject so pages never reach for an unrelated stock photo.
 *
 * Everything in the LIFESTYLE block below was sourced from Unsplash search by
 * subject and visually checked before being added - these are the photos that
 * carry the destination, so a near-miss is not good enough. Run
 * `npm run test:images` after editing to confirm every URL still resolves.
 */
export const PHOTO = {
  /* ---------- Lifestyle: people actually enjoying 30A ---------- */
  heroEmerald: '1636937400111-f08d1fe8af2b', // white sand, emerald Gulf water
  duneWalkover: '1560427791-bcf0b027ff44', // boardwalk through sea oats to the beach
  bonfirePeople: '1569918970203-ea053ffda098', // group around a beach fire at sunset
  bonfireGroup: '1596326270763-87f26e0f9225', // sitting on the sand around a fire
  golfCartOcean: '1646606625592-7d61da12cff0', // cart parked above the ocean at sunset
  golfCartRow: '1561251224-e393160cd769', // carts lined up ready to go
  golfCartCourse: '1500948814185-c95ddc695d23', // two people riding a cart
  bikeRide: '1758967439612-80c7483f7168', // people cycling a coastal path
  bikeBoardwalk: '1768478581941-bbdcc8fa46d4', // two riders on a boardwalk
  familyWalk: '1695425812104-8a9963d58887', // family walking the shore hand in hand
  familyShore: '1576696058573-12b47c49559e', // mother and children at the water
  boatSunset: '1605472075294-4c73b9909d08', // people aboard at sunset
  boatDay: '1614808317315-4807afbab5eb', // two people out on the water
  paddleCouple: '1526188717906-ab4a2f949f26', // paddleboarding together
  beachCoupleWalk: '1654206700775-1c6257fb12e9', // couple walking the sand
  beachChairsWide: '1658157799932-eef5dee4118c', // chairs and umbrellas on wide sand
  beachGrass: '1654206855819-e639d7f0cb67', // dunes looking out to the Gulf
  coastalRoad: '1662666625842-0d2f1bf1a931', // 30A-style road along the beach
  yogaSunset: '1646941836303-12a0a6bff9b6', // yoga on the sand at golden hour
  patioLights: '1774228296846-14fd638af680', // outdoor dining under string lights
  sunsetSilhouette: '1602594748821-6df031e275e1', // arms raised at sunset

  // Coastal / 30A
  beachAerial: '1505142468610-359e7d316be0',
  beachTurquoise: '1507525428034-b723cf961d3e',
  beachUmbrellas: '1658157799932-eef5dee4118c',
  beachDunes: '1473116763249-2faaef81ccda',
  beachSunset: '1602594748821-6df031e275e1',
  beachWaves: '1559827260-dc66d52bef19',
  beachBoardwalk: '1502680390469-be75c86b636f',
  beachFamily: '1695425812104-8a9963d58887',
  beachKids: '1576696058573-12b47c49559e',
  coastalTown: '1662666625842-0d2f1bf1a931',

  // Homes
  houseWhite: '1580587771525-78b9dba3b914',
  houseLuxury: '1613490493576-7fde63acd811',
  houseModern: '1600596542815-ffad4c1539a9',
  interiorLiving: '1600585154340-be6161a56a0c',
  interiorKitchen: '1600607687939-ce8a6c25118c',
  interiorBedroom: '1560448204-e02f11c3d0e2',
  poolDeck: '1571003123894-1f0594d2b5d9',

  // Food + restaurants
  diningFine: '1414235077428-338989a2e8c0',
  diningPatio: '1517248135467-4c7edcad34c4',
  diningRustic: '1552566626-52f8b828add9',
  seafoodPlate: '1467003909585-2f8a72700288',
  oysters: '1633504581786-316c8002b1b9',
  steak: '1600891964092-4316c288032e',
  tacos: '1565299624946-b28f40a0ae38',
  pizza: '1513104890138-7c749659a591',
  breakfast: '1533089860892-a7c6f0a88666',
  coffeeShop: '1495474472287-4d71bcdd2085',
  bakery: '1509440159596-0249088772ff',
  cocktails: '1514362545857-3bc16c4c7d1b',
  iceCream: '1497034825429-c343d7c6a68f',

  // Activities & partners
  bikes: '1758967439612-80c7483f7168',
  bikeBeach: '1768478581941-bbdcc8fa46d4',
  boatYacht: '1567899378494-47b22a2ae96a',
  boatPontoon: '1614808317315-4807afbab5eb',
  paddleboard: '1526188717906-ab4a2f949f26',
  golfCourse: '1500948814185-c95ddc695d23',
  golfSwing: '1587174486073-ae5e5cff23aa',
  spaMassage: '1544161515-4ab6ce6db874',
  spaStones: '1540555700478-4be289fbecef',
  yoga: '1571019613454-1cb2f99b2d8b',
  bonfire: '1475738972911-5b44ce984c42',
  campfire: '1478147427282-58a87a120781',
  photographer: '1452587925148-ce544e77e70d',
  familyPhoto: '1543269865-cbf427effbad',
  fishing: '1544551763-77ef2d0cfc6c',
  kayak: '1505118380757-91f5f5632de0',
  tennis: '1554068865-24cecd4e34b8',

  // Services
  groceryBags: '1542838132-92c53300491e',
  groceryCart: '1604719312566-8912e9227c6a',
  groceryDelivery: '1543168256-418811576931',
  groceryKitchen: '1556909212-d5b604d0c90d',
  suvTransfer: '1449824913935-59a10b8d2000',
  blackCar: '1502877338535-766e1452684a',
  airport: '1540962351504-03099e0a754b',
  airplane: '1436491865332-7a61a109cc05',
  babysitter: '1596464716127-f2a82984de30',
  cleaning: '1581578731548-c64695cc6952',

  // Events & shopping
  concert: '1501386761578-eac5c94b800a',
  farmersMarket: '1533106418989-88406c7cc8ca',
  artFestival: '1503095396549-807759245b35',
  fireworks: '1467810563316-b5476525c0f9',
  wineTasting: '1510812431401-41d2bd2722f3',
  shoppingStreet: '1441986300917-64674bd600d8',
  boutique: '1483985988355-763728e1935b',
  sunsetParty: '1533174072545-7a4b6ad7a6c3',

  // People (avatars)
  guestSarah: '1494790108377-be9c29b29330',
  hostMichael: '1560250097-0b93528c311a',
}

/** Convenience: a hero-sized url. */
export const hero = (id) => img(id, 1600, 1.9)
/** Convenience: a card-sized url. */
export const card = (id) => img(id, 800, 1.5)
/** Convenience: a square thumb url. */
export const thumb = (id) => img(id, 320, 1)
