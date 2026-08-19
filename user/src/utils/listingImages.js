import { PHOTO } from '../assets/images'

const VENUE_COVERS = [
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

const RESTAURANT_COVERS = {
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

function usable(value) {
  if (typeof value !== 'string' || !value.trim()) return false
  return !/logo|favicon|footer_bg|sprite|placeholder|1x1/.test(value.toLowerCase())
}

function slugify(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function coverBySlug(item) {
  const slug = item?.slug || slugify(item?.name)
  if (slug && RESTAURANT_COVERS[slug]) return RESTAURANT_COVERS[slug]
  if (!slug) return null
  const match = Object.keys(RESTAURANT_COVERS).find((key) => slug.includes(key) || key.includes(slug))
  return match ? RESTAURANT_COVERS[match] : null
}

export function placeCover(item) {
  if (usable(item?.image)) return item.image
  const fromSlug = coverBySlug(item)
  if (fromSlug) return fromSlug
  const cuisine = `${item?.cuisine ?? ''} ${item?.category ?? ''} ${item?.name ?? ''}`.toLowerCase()
  if (/oyster|raw bar/.test(cuisine)) return PHOTO.oysters
  if (/seafood|gulf|fish/.test(cuisine)) return PHOTO.seafoodPlate
  if (/steak/.test(cuisine)) return PHOTO.steak
  if (/breakfast|brunch/.test(cuisine)) return PHOTO.breakfast
  if (/italian|trattoria/.test(cuisine)) return PHOTO.diningRustic
  if (/cocktail|tavern|bar/.test(cuisine)) return PHOTO.cocktails
  if (item?.type === 'beach') return PHOTO.beachUmbrellas
  if (item?.type === 'restaurant' || item?.cuisine) return PHOTO.diningPatio
  return item?.image ?? null
}

export function eventCover(event) {
  if (usable(event?.image)) return event.image
  const text = `${event?.title ?? ''} ${event?.location ?? ''} ${event?.description ?? ''} ${event?.category ?? ''}`
  for (const [pattern, photo] of VENUE_COVERS) {
    if (pattern.test(text)) return photo
  }
  const hay = text.toLowerCase()
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
