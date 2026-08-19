/**
 * Cover photos for restaurants and events.
 * Prefer a listing's own published photo; otherwise a subject-matched Unsplash
 * id from the same registry the rest of the app uses. 30A.com event RSS has
 * no media, so events fall back by venue then category.
 */

const PHOTO = {
  diningFine: '1414235077428-338989a2e8c0',
  diningPatio: '1517248135467-4c7edcad34c4',
  diningRustic: '1552566626-52f8b828add9',
  seafoodPlate: '1467003909585-2f8a72700288',
  oysters: '1633504581786-316c8002b1b9',
  steak: '1600891964092-4316c288032e',
  breakfast: '1533089860892-a7c6f0a88666',
  coffeeShop: '1495474472287-4d71bcdd2085',
  cocktails: '1514362545857-3bc16c4c7d1b',
  concert: '1501386761578-eac5c94b800a',
  farmersMarket: '1533106418989-88406c7cc8ca',
  yoga: '1571019613454-1cb2f99b2d8b',
  artFestival: '1503095396549-807759245b35',
  wineTasting: '1510812431401-41d2bd2722f3',
  beachUmbrellas: '1658157799932-eef5dee4118c',
  familyWalk: '1695425812104-8a9963d58887',
  coastalTown: '1662666625842-0d2f1bf1a931',
  patioLights: '1774228296846-14fd638af680',
  poolDeck: '1571003123894-1f0594d2b5d9',
  sunsetParty: '1533174072545-7a4b6ad7a6c3',
}

/** Official venue photos published on the restaurant's own site. */
const RESTAURANT_COVERS: Record<string, string> = {
  'bud-and-alleys': 'https://www.budandalleys.com/wp-content/uploads/2025/08/Home-social.jpeg',
  'great-southern': PHOTO.diningFine,
  'cowgirl-kitchen': PHOTO.breakfast,
  georges: PHOTO.diningPatio,
  'mimmos-30a': PHOTO.diningRustic,
  'the-citizen': PHOTO.oysters,
  'emerils-coastal':
    'https://emerilsrestaurants.com/wp-content/uploads/2017/05/Coastal_Emerils_Italian_day1-29065_RT.jpg',
  'restaurant-paradis': PHOTO.diningFine,
  caliza: PHOTO.poolDeck,
  borago: PHOTO.diningRustic,
  'cafe-thirty-a': PHOTO.diningFine,
  'vue-on-30a': PHOTO.diningPatio,
  'roux-30a': PHOTO.diningFine,
  'surfing-deer': PHOTO.diningPatio,
  'cuvee-30a': 'https://cuvee30a.com/wp-content/uploads/2022/09/Cuvee-30A-SE-View-Exterior-Fountain960.jpg',
  gallions: PHOTO.cocktails,
  bijoux: 'https://static.spotapps.co/website_images/ab_websites/348624_website_v1/social_share.jpg',
  seagars: PHOTO.steak,
}

const VENUE_COVERS: Array<[RegExp, string]> = [
  [/aj'?s/i, PHOTO.oysters],
  [/big chill/i, PHOTO.beachUmbrellas],
  [/old florida fish/i, PHOTO.seafoodPlate],
  [/amphitheatr|seaside concert|sounds of seaside/i, PHOTO.concert],
  [/farmer/i, PHOTO.farmersMarket],
  [/library/i, PHOTO.coastalTown],
  [/cracking/i, PHOTO.breakfast],
  [/amavida|coffee/i, PHOTO.coffeeShop],
  [/red bar/i, PHOTO.diningRustic],
  [/stinky/i, PHOTO.diningRustic],
  [/ovide|wine/i, PHOTO.wineTasting],
  [/boathouse|paddle|watercolor/i, PHOTO.patioLights],
  [/north beach social|shades|village door/i, PHOTO.concert],
]

export function isUsablePhoto(value: unknown): value is string {
  if (typeof value !== 'string' || !value.trim()) return false
  const lower = value.toLowerCase()
  if (/logo|favicon|footer_bg|sprite|placeholder|1x1/.test(lower)) return false
  return true
}

export function restaurantCoverImage(row: {
  image?: unknown
  slug?: unknown
  cuisine?: unknown
  name?: unknown
}) {
  if (isUsablePhoto(row.image)) return row.image
  const slug = String(row.slug ?? '')
  if (slug && RESTAURANT_COVERS[slug]) return RESTAURANT_COVERS[slug]
  return cuisineCover(String(row.cuisine ?? row.name ?? ''))
}

export function eventCoverImage(row: {
  image?: unknown
  title?: unknown
  category?: unknown
  location?: unknown
  description?: unknown
}) {
  if (isUsablePhoto(row.image)) return row.image
  const text = `${row.title ?? ''} ${row.location ?? ''} ${row.description ?? ''} ${row.category ?? ''}`
  for (const [pattern, photo] of VENUE_COVERS) {
    if (pattern.test(text)) return photo
  }
  return categoryCover(String(row.category ?? ''), text)
}

export function extractFeedImage(xml: string) {
  const enclosure = xml.match(/<enclosure[^>]+url=["']([^"']+)["']/i)
  if (enclosure && isUsablePhoto(enclosure[1])) return enclosure[1]
  const media =
    xml.match(/<media:(?:content|thumbnail)[^>]+url=["']([^"']+)["']/i) ||
    xml.match(/url=["']([^"']+)["'][^>]*type=["']image\//i)
  if (media && isUsablePhoto(media[1])) return media[1]
  const img = xml.match(/<img[^>]+src=["']([^"']+)["']/i)
  if (img && isUsablePhoto(img[1])) return img[1]
  return null
}

function cuisineCover(cuisine: string) {
  const text = cuisine.toLowerCase()
  if (/oyster|raw bar/.test(text)) return PHOTO.oysters
  if (/seafood|gulf|fish/.test(text)) return PHOTO.seafoodPlate
  if (/steak/.test(text)) return PHOTO.steak
  if (/breakfast|brunch/.test(text)) return PHOTO.breakfast
  if (/coffee|cafe thirty/.test(text)) return PHOTO.coffeeShop
  if (/italian|trattoria/.test(text)) return PHOTO.diningRustic
  if (/cocktail|tavern|bar/.test(text)) return PHOTO.cocktails
  if (/pool/.test(text)) return PHOTO.poolDeck
  return PHOTO.diningPatio
}

function categoryCover(category: string, text: string) {
  const hay = `${category} ${text}`.toLowerCase()
  if (/live music|concert|band|karaoke|jazz/.test(hay)) return PHOTO.concert
  if (/market|farmer/.test(hay)) return PHOTO.farmersMarket
  if (/wellness|yoga|tai chi|spa/.test(hay)) return PHOTO.yoga
  if (/art|gallery|clay|paint/.test(hay)) return PHOTO.artFestival
  if (/food|drink|wine|cocktail|dinner/.test(hay)) return PHOTO.wineTasting
  if (/family|kid|lego|story/.test(hay)) return PHOTO.familyWalk
  if (/beach|turtle|sunset/.test(hay)) return PHOTO.beachUmbrellas
  if (/bingo|trivia|party/.test(hay)) return PHOTO.sunsetParty
  return PHOTO.patioLights
}
