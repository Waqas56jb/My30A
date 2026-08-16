import { PHOTO } from '../assets/images'

/**
 * Experiences are the lifestyle-first entry points into the app.
 *
 * The rule: lead with what a guest can *experience*, then show the local
 * businesses who make it happen. Copy is written as an invitation, never as a
 * service description - "Make tonight unforgettable", not "Bonfire rental".
 *
 * `partnerCategories` pulls the providers; `route` overrides the destination
 * where a richer dedicated page already exists (beaches, restaurants, events).
 */
export const experiences = [
  {
    slug: 'beaches',
    label: 'Beaches',
    icon: 'umbrella',
    image: PHOTO.duneWalkover,
    tagline: 'Thirty minutes of boardwalk and sea oats, then the whitest sand in Florida.',
    headline: 'The sand you came for.',
    blurb:
      'Twenty-six miles of shoreline, sixteen public accesses, and sugar-white quartz sand that squeaks underfoot. Some mornings you will have it to yourself.',
    highlights: ['Sixteen public accesses', 'Chair service at most walkovers', 'Rare coastal dune lakes'],
    route: '/beaches',
    partnerCategories: [],
    gallery: [PHOTO.duneWalkover, PHOTO.heroEmerald, PHOTO.beachChairsWide, PHOTO.beachGrass],
    prompt: 'Which beach will be quietest this afternoon?',
    featured: true,
  },
  {
    slug: 'bonfires',
    label: 'Beach Bonfires',
    icon: 'flame',
    image: PHOTO.bonfirePeople,
    tagline: 'Sunset. Sand. Fire. Good company.',
    headline: 'Make tonight unforgettable.',
    blurb:
      'The best night of most 30A trips costs less than dinner. Someone else pulls the permit, hauls the wood, sets the chairs in a circle, and comes back to clear it away. You bring the marshmallows and stay until the fire burns down.',
    highlights: ['County permit handled for you', 'Chairs, wood and blankets set up', 'Cleared away after you leave'],
    partnerCategories: ['Bonfires'],
    gallery: [PHOTO.bonfirePeople, PHOTO.bonfireGroup, PHOTO.sunsetSilhouette, PHOTO.beachSunset],
    prompt: 'Can you arrange a beach bonfire for tonight?',
    featured: true,
  },
  {
    slug: 'golf-carts',
    label: 'Golf Carts',
    icon: 'car',
    image: PHOTO.golfCartOcean,
    tagline: 'See more of 30A on four wheels.',
    headline: 'Explore 30A your way.',
    blurb:
      'Nobody drives a car on 30A if they can help it. Street-legal carts get you from Rosemary to Alys to Seacrest with the top down, the kids in the back, and no parking to think about.',
    highlights: ['Street legal, delivered to your driveway', 'Four and six seaters', 'Better by the week'],
    partnerCategories: ['Golf Carts'],
    gallery: [PHOTO.golfCartOcean, PHOTO.golfCartRow, PHOTO.coastalRoad, PHOTO.golfCartCourse],
    prompt: 'Where can I rent a golf cart?',
    featured: true,
  },
  {
    slug: 'biking',
    label: 'Biking',
    icon: 'bike',
    image: PHOTO.bikeRide,
    tagline: 'Slow down and explore.',
    headline: 'Ride through 30A.',
    blurb:
      'The Timpoochee Trail runs the whole nineteen miles, flat the entire way, threading every beach town on the road. Rent cruisers for the week and you will barely touch the car.',
    highlights: ['19 miles of paved trail', 'Cruisers, e-bikes and kids trailers', 'Delivered and collected'],
    partnerCategories: ['Bike Rentals'],
    gallery: [PHOTO.bikeRide, PHOTO.bikeBoardwalk, PHOTO.coastalRoad, PHOTO.beachBoardwalk],
    prompt: 'Where can we rent bikes for the week?',
    featured: true,
  },
  {
    slug: 'boating',
    label: 'Boating',
    icon: 'boat',
    image: PHOTO.boatSunset,
    tagline: 'The best view of the coast is from the water.',
    headline: 'Out on the water by ten.',
    blurb:
      'Private charters run the bay to Crab Island and the dolphin grounds, with a sandbar stop where the water is waist deep and warm. Or take a paddleboard onto a dune lake at sunrise and see almost nobody.',
    highlights: ['Half and full day charters', 'Captain, fuel and coolers included', 'Paddleboards on the dune lakes'],
    partnerCategories: ['Boating'],
    gallery: [PHOTO.boatSunset, PHOTO.boatDay, PHOTO.paddleCouple, PHOTO.boatYacht],
    prompt: 'Can we get a boat out for a half day?',
    featured: true,
  },
  {
    slug: 'restaurants',
    label: 'Restaurants',
    icon: 'utensils',
    image: PHOTO.patioLights,
    tagline: 'Gulf catch, porch tables, and one very loud jazz bar.',
    headline: 'Where to eat tonight.',
    blurb:
      'From a donut truck on the square to a rooftop with a sommelier - and the fish was almost certainly landed this morning.',
    highlights: ['Walkable from most rentals', 'Reservations worth booking ahead', 'Kids menus that are not an afterthought'],
    route: '/restaurants',
    partnerCategories: ['Restaurants'],
    gallery: [PHOTO.patioLights, PHOTO.diningFine, PHOTO.oysters, PHOTO.seafoodPlate],
    prompt: 'Where should we eat tonight?',
    featured: true,
  },
  {
    slug: 'wellness',
    label: 'Wellness & Spa',
    icon: 'leaf',
    image: PHOTO.yogaSunset,
    tagline: 'Seven in the morning on the sand, before anyone else is up.',
    headline: 'Start slow.',
    blurb:
      'Sunrise yoga at the walkover, or a therapist who brings the table to your living room the afternoon you overdo the sun. Both are easier to arrange here than at home.',
    highlights: ['Daily beach yoga, mats provided', 'In-home massage, often same day', 'Prenatal and couples sessions'],
    partnerCategories: ['Wellness & Spa'],
    gallery: [PHOTO.yogaSunset, PHOTO.spaMassage, PHOTO.spaStones, PHOTO.beachSunset],
    prompt: 'Can someone come to the house for a massage?',
    featured: false,
  },
  {
    slug: 'family',
    label: 'Family Time',
    icon: 'users',
    image: PHOTO.familyWalk,
    tagline: 'The bit they will still talk about in ten years.',
    headline: 'Everyone happy, somehow.',
    blurb:
      'Surf lessons on the sandbar, an eco tour with actual alligators, chairs already set up when you get to the sand, and a background-checked sitter for the night you want a grown-up dinner.',
    highlights: ['Surf lessons from age six', 'Cribs and beach gear delivered', 'CPR-certified sitters'],
    partnerCategories: ['Family Services', 'Babysitters'],
    gallery: [PHOTO.familyWalk, PHOTO.familyShore, PHOTO.beachChairsWide, PHOTO.babysitter],
    prompt: 'What should we do with a 7 and an 11 year old?',
    featured: true,
  },
  {
    slug: 'photography',
    label: 'Photography',
    icon: 'camera',
    image: PHOTO.familyPhoto,
    tagline: 'The photo that ends up on the wall.',
    headline: 'Golden hour, once a year.',
    blurb:
      'Sunrise on the dunes is the shot everyone books, and the light is only right for about forty minutes. Local photographers know which walkovers stay empty.',
    highlights: ['45-60 minute sessions', 'Private gallery within 72 hours', 'Patient with small children'],
    partnerCategories: ['Photography'],
    gallery: [PHOTO.familyPhoto, PHOTO.photographer, PHOTO.beachSunset, PHOTO.duneWalkover],
    prompt: 'Can you find a photographer for a sunrise session?',
    featured: false,
  },
  {
    slug: 'golf',
    label: 'Golf',
    icon: 'flag',
    image: PHOTO.golfCartCourse,
    tagline: 'Fazio and Norman, ten minutes from the sand.',
    headline: 'An early tee time.',
    blurb:
      'Two championship courses sit just off 30A. Go early - by eleven in August the heat has an opinion about your swing.',
    highlights: ['Camp Creek and Sharks Tooth', 'Club rental and lessons', 'Twilight rates after 3pm'],
    partnerCategories: ['Golf'],
    gallery: [PHOTO.golfCartCourse, PHOTO.golfSwing, PHOTO.golfCartOcean],
    prompt: 'Can I get a tee time tomorrow morning?',
    featured: false,
  },
  {
    slug: 'events',
    label: 'Events',
    icon: 'ticket',
    image: PHOTO.concert,
    tagline: 'Something on almost every night in season.',
    headline: 'What is on this week.',
    blurb:
      'Free concerts on the Seaside lawn, a Sunday farmers market on the square, films projected onto the green, and a fireworks show over the Gulf.',
    highlights: ['Most of it free', 'Walkable from the east end', 'Bring a blanket'],
    route: '/events',
    partnerCategories: [],
    gallery: [PHOTO.concert, PHOTO.farmersMarket, PHOTO.sunsetParty, PHOTO.fireworks],
    prompt: 'What is happening tonight?',
    featured: false,
  },
  {
    slug: 'shopping',
    label: 'Shopping',
    icon: 'bag',
    image: PHOTO.shoppingStreet,
    tagline: 'Airstreams, boutiques, and one very good bookshop.',
    headline: 'An afternoon off the sand.',
    blurb:
      'Park once at Seaside and spend the afternoon: a dozen boutiques, the famous food Airstreams, and live music at the amphitheatre by evening.',
    highlights: ['Seaside Central Square', 'Independent bookshop in Rosemary', 'Best on a rainy afternoon'],
    partnerCategories: ['Shopping'],
    gallery: [PHOTO.shoppingStreet, PHOTO.boutique, PHOTO.iceCream, PHOTO.coastalTown],
    prompt: 'Where is the best shopping nearby?',
    featured: false,
  },
  {
    slug: 'outdoor',
    label: 'Outdoor Experiences',
    icon: 'compass',
    image: PHOTO.paddleCouple,
    tagline: 'Coastal dune lakes exist in only a handful of places on earth.',
    headline: 'Get properly outside.',
    blurb:
      'Four of the world’s rare coastal dune lakes are here, along with state park trails through scrub pine and a sandbar that makes learning to surf genuinely easy.',
    highlights: ['Guided dune lake eco tours', 'Surf lessons on the sandbar', 'State park trails and kayak launches'],
    partnerCategories: ['Activities'],
    gallery: [PHOTO.paddleCouple, PHOTO.kayak, PHOTO.beachDunes, PHOTO.beachBoardwalk],
    prompt: 'What outdoor activities are worth doing here?',
    featured: false,
  },
]

export const getExperience = (slug) => experiences.find((e) => e.slug === slug)

/** Where an experience tile should navigate to. */
export const experienceRoute = (experience) => experience.route ?? `/experiences/${experience.slug}`

/** The three editorial spotlights on the home page. */
export const SPOTLIGHT_SLUGS = ['bonfires', 'golf-carts', 'biking']
