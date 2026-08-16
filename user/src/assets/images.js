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

/** Ids grouped by subject so pages never reach for an unrelated stock photo. */
export const PHOTO = {
  // Coastal / 30A
  beachAerial: '1505142468610-359e7d316be0',
  beachTurquoise: '1507525428034-b723cf961d3e',
  beachUmbrellas: '1519046904884-53103b34b206',
  beachDunes: '1473116763249-2faaef81ccda',
  beachSunset: '1520454974749-611b7248ffdb',
  beachWaves: '1559827260-dc66d52bef19',
  beachBoardwalk: '1502680390469-be75c86b636f',
  beachFamily: '1602002418082-a4443e081dd1',
  beachKids: '1530549387789-4c1017266635',
  coastalTown: '1512917774080-9991f1c4c750',

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
  bikes: '1485965120184-e220f721d03e',
  bikeBeach: '1571068316344-75bc76f77890',
  boatYacht: '1567899378494-47b22a2ae96a',
  boatPontoon: '1544551763-46a013bb70d5',
  paddleboard: '1526188717906-eb0f39e5b374',
  golfCourse: '1535131749006-b7f58c99034b',
  golfSwing: '1587174486073-ae5e5cff23aa',
  spaMassage: '1544161515-4ab6ce6db874',
  spaStones: '1540555700478-4be289fbecef',
  yoga: '1571019613454-1cb2f99b2d8b',
  bonfire: '1475738972911-5b44ce984c42',
  campfire: '1478147427282-58a87a120781',
  photographer: '1452587925148-ce544e77e70d',
  familyPhoto: '1543269865-cbf427effbad',
  fishing: '1544551763-77ef2d0cfc6c',
  kayak: '1527004013197-933c4bb611b7',
  tennis: '1554068865-24cecd4e34b8',

  // Services
  groceryBags: '1542838132-92c53300491e',
  groceryCart: '1601599963565-b7f49deb352a',
  groceryDelivery: '1543168256-418811576931',
  groceryKitchen: '1556909212-d5b604d0c90d',
  suvTransfer: '1449824913935-59a10b8d2000',
  blackCar: '1502877338535-766e1452684a',
  airport: '1540962351504-03099e0a754b',
  airplane: '1436491865332-7a61a109cc05',
  babysitter: '1596464716127-f2a82984de30',
  cleaning: '1581578731548-c64695cc6952',

  // Events & shopping
  concert: '1470229722913-7ea0d7c1f0d0',
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
