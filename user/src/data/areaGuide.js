/**
 * Copy and assets for the Area Map, digital card, and flyer.
 * Components take these as props so the words can change without a layout edit.
 */
import { HOST_CONTACT } from '../config/contact'

export const AREA_GUIDE = {
  pageTitle: 'Area Map & Info',
  pageSubtitle: 'Scenic Highway 30A · Santa Rosa Beach',
  areaLabel: '30A - Santa Rosa Beach Area',
  intro:
    'One stretch of coast, from Dune Allen to Inlet Beach. Use the map with guests, then share a digital card or flyer.',

  maps: [
    {
      id: 'overview',
      src: '/map1.jpeg',
      alt: 'Illustrated map of Scenic Highway 30A from Destin toward Panama City',
      label: 'Coast overview',
    },
    {
      id: 'communities',
      src: '/map2.jpeg',
      alt: 'Community map of 30A beaches and connecting highways',
      label: 'Communities',
    },
  ],
  mapHint: 'Pinch, scroll, or use the buttons to zoom. Drag to move around.',
  zoomInLabel: 'Zoom in',
  zoomOutLabel: 'Zoom out',
  resetLabel: 'Reset view',

  accessTitle: 'Beach access',
  accessSubtitle: 'Public walkovers versus community-only access along 30A.',
  accessAllLabel: 'All',
  accessPublicLabel: 'Full Public Use',
  accessPrivateLabel: 'Private',
  accessLimitedLabel: 'Limited Public Use',
  accessPublicShort: 'Public',
  accessPrivateShort: 'Private',
  accessLimitedShort: 'Limited',
  accessPoints: [
    {
      id: 'grayton',
      name: 'Grayton Beach State Park',
      community: 'Grayton Beach',
      type: 'public',
      note: 'State park walkover, restrooms, and parking.',
    },
    {
      id: 'deer-lake',
      name: 'Deer Lake State Park',
      community: 'Seagrove',
      type: 'public',
      note: 'Quiet dune walkover. Limited facilities.',
    },
    {
      id: 'inlet',
      name: 'Inlet Beach public access',
      community: 'Inlet Beach',
      type: 'public',
      note: 'Large lot and restrooms. Fills early in season.',
    },
    {
      id: 'dune-allen',
      name: 'Dune Allen public access',
      community: 'Dune Allen',
      type: 'public',
      note: 'County access with parking near the gulf.',
    },
    {
      id: 'blue-mountain',
      name: 'Blue Mountain Beach access',
      community: 'Blue Mountain Beach',
      type: 'public',
      note: 'Known for wide sand and sunset views.',
    },
    {
      id: 'rosemary',
      name: 'Rosemary Beach walkovers',
      community: 'Rosemary Beach',
      type: 'private',
      note: 'Community access for owners and staying guests.',
    },
    {
      id: 'seaside',
      name: 'Seaside pavilions',
      community: 'Seaside',
      type: 'private',
      note: 'Town pavilions are for guests staying in Seaside.',
    },
    {
      id: 'alys',
      name: 'Alys Beach access',
      community: 'Alys Beach',
      type: 'private',
      note: 'Gated community walkovers for residents and guests.',
    },
    {
      id: 'watercolor',
      name: 'WaterColor beach club access',
      community: 'WaterColor',
      type: 'private',
      note: 'Club and community access for registered guests.',
    },
    {
      id: 'watersound',
      name: 'WaterSound beach access',
      community: 'WaterSound',
      type: 'private',
      note: 'Neighborhood access for staying guests.',
    },
  ],

  locationsTitle: 'Key locations',
  locations: [
    { id: 'beaches', label: 'Beaches', icon: 'umbrella', to: '/beaches' },
    { id: 'restaurants', label: 'Restaurants', icon: 'utensils', to: '/restaurants' },
    { id: 'access', label: 'Access points', icon: 'mapPin', to: '/beaches' },
    { id: 'partners', label: 'Local partners', icon: 'sparkles', to: '/partners' },
  ],

  communitiesTitle: 'Your 30A guide',
  communities: [
    { id: 'dune-allen', name: 'Dune Allen', blurb: 'Quiet beaches and long sunsets.' },
    { id: 'blue-mountain', name: 'Blue Mountain Beach', blurb: 'Peaceful dunes and open gulf.' },
    { id: 'grayton', name: 'Grayton Beach', blurb: 'Artsy, eclectic, and historic.' },
    { id: 'watercolor', name: 'WaterColor', blurb: 'Village living with lakes and parks.' },
    { id: 'seaside', name: 'Seaside', blurb: 'Walkable streets and iconic cottages.' },
    { id: 'seagrove', name: 'Seagrove', blurb: 'Family-friendly trails to the sand.' },
    { id: 'watersound', name: 'WaterSound', blurb: 'Upscale and quiet.' },
    { id: 'alys', name: 'Alys Beach', blurb: 'White walls and a Mediterranean feel.' },
    { id: 'rosemary', name: 'Rosemary Beach', blurb: 'Dining, porches, and a walkable square.' },
    { id: 'inlet', name: 'Inlet Beach', blurb: 'Laid-back and local.' },
  ],

  brand: {
    name: 'My30A Host',
    concierge: 'Vitoria',
    tagline: 'Your Personal 30A Concierge',
    slogan: "You're here to live 30A. We handle everything else.",
    flyerLine: 'One road. Endless beauty. We take care of the rest.',
    website: 'my30ahost.com',
    websiteUrl: 'https://my30ahost.com',
    email: HOST_CONTACT.email,
    emailHref: `mailto:${HOST_CONTACT.email}`,
    instagram: HOST_CONTACT.instagram,
    facebook: HOST_CONTACT.facebook,
  },

  card: {
    title: 'Digital business card',
    subtitle: 'Hand this to a guest or send it from your phone.',
    services: [
      { id: 'grocery', label: 'Grocery Delivery', icon: 'bag' },
      { id: 'transfer', label: 'Airport Transfer', icon: 'car' },
      { id: 'cart', label: 'Golf Cart Rental', icon: 'car' },
      { id: 'bonfire', label: 'Beach Bonfire', icon: 'flame' },
      { id: 'photo', label: 'Photography', icon: 'camera' },
      { id: 'bike', label: 'Bike Rentals', icon: 'bike' },
      { id: 'wellness', label: 'Wellness & Spa', icon: 'leaf' },
    ],
    flipFront: 'Front',
    flipBack: 'Services',
    printSrc: '/map5.png',
    printAlt: 'My30A Host digital business card',
    printSrc2: '/map4.png',
    printAlt2: 'My30A Host cream business card with seven services',
  },

  flyer: {
    title: 'Digital flyer',
    subtitle: 'QR opens the guest app. Share by WhatsApp or email.',
    imageSrc: '/map1.jpeg',
    imageAlt: 'Illustrated map of Scenic Highway 30A',
    altImageSrc: '/map6.png',
    altImageAlt: 'My30A Host flyer with aerial coastline and community labels',
    services: [
      { id: 'grocery', label: 'Grocery Delivery', price: 'from $149', icon: 'bag' },
      { id: 'transfer', label: 'Airport Transfer', price: '$150–299', icon: 'car' },
      { id: 'cart', label: 'Golf Cart Rental', price: 'from $120', icon: 'car' },
      { id: 'bonfire', label: 'Beach Bonfire', price: 'from $150', icon: 'flame' },
      { id: 'photo', label: 'Photography', price: 'from $300', icon: 'camera' },
      { id: 'bike', label: 'Bike Rentals', price: 'from $35', icon: 'bike' },
    ],
    qrCaption: 'Scan to learn My30A',
    shareLabel: 'Share Flyer',
    shareWhatsApp: 'WhatsApp',
    shareEmail: 'Email',
    shareNative: 'Share',
    shareCopied: 'Link copied',
    shareText:
      'My30A Host — your personal 30A concierge. Groceries, airport transfers, and a local guide for Santa Rosa Beach.',
    golfNote: 'Golf carts are not allowed on 30A east of Alys Beach.',
  },

  app: {
    downloadUrl: 'https://my30ahost.com',
    playStoreUrl: 'https://play.google.com/store',
    appStoreUrl: 'https://apps.apple.com',
  },
}

export function qrImageSrc(url, size = 220) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}`
}
