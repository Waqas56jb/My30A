import { PHOTO } from '../assets/images'

/**
 * Grocery requests. Amounts are illustrative; nothing is charged in the
 * prototype. `payment` mirrors the Stripe lifecycle we will connect later.
 */
export const mockGroceryOrders = [
  {
    id: 'GR-1024',
    type: 'grocery',
    guestId: 'guest_sarah_01',
    propertyId: 'prop_rosemary_01',
    createdAt: '2026-08-17T14:12:00',
    deliveryDate: '2026-08-20',
    deliveryWindow: '2:00 PM – 4:00 PM',
    store: 'Publix',
    status: 'shopping',
    items: `Eggs (2 dozen)
Milk (1 gal, 2%)
Coffee — medium roast, ground
Sourdough bread
Butter (salted)
Greek yogurt (6 cups)
Bananas, strawberries, blueberries
Sandwich meat & sliced cheddar
Goldfish crackers
Apple juice boxes
Bottled water (2 cases)
Gulf shrimp (2 lb)
Pasta, olive oil, garlic, lemons
Salad mix + parmesan
White wine (2 bottles, Sauvignon Blanc)
Sunscreen SPF 50`,
    itemCount: 16,
    notes:
      'One shellfish allergy in the house — please bag the shrimp separately. Vegetarian teen, so extra hummus and veggies if you see them.',
    attachments: [],
    estimatedTotal: 285,
    serviceFee: 39,
    deliveryFee: 15,
    tax: 21.4,
    tip: null,
    payment: {
      state: 'paid',
      method: 'Visa •••• 4242',
      authorizedAt: '2026-08-17T15:02:00',
      capturedAt: '2026-08-17T15:02:00',
      amount: 360.4,
    },
    timeline: [
      { status: 'pending', at: '2026-08-17T14:12:00', note: 'Request submitted' },
      { status: 'confirmed', at: '2026-08-17T14:58:00', note: 'Confirmed by the concierge team' },
      { status: 'shopping', at: '2026-08-20T13:05:00', note: 'Marcus is shopping at Publix Inlet Beach' },
    ],
    shopper: { name: 'Marcus D.', phone: '(850) 555-0333' },
    deliveryPhoto: null,
    rating: null,
    cancellationAccepted: true,
  },
  {
    id: 'GR-0987',
    type: 'grocery',
    guestId: 'guest_sarah_01',
    propertyId: 'prop_rosemary_01',
    createdAt: '2025-08-15T09:30:00',
    deliveryDate: '2025-08-16',
    deliveryWindow: '10:00 AM – 12:00 PM',
    store: 'The Fresh Market',
    status: 'delivered',
    items: `Coffee beans
Almond milk
Fresh grouper (2 lb)
Asparagus
Lemons
Baguette
Local honey
Rosé (3 bottles)`,
    itemCount: 8,
    notes: 'Please leave the wine on the counter, not in the fridge.',
    attachments: [],
    estimatedTotal: 168,
    serviceFee: 39,
    deliveryFee: 15,
    tax: 12.6,
    tip: 30,
    payment: {
      state: 'captured',
      method: 'Visa •••• 4242',
      authorizedAt: '2025-08-15T10:10:00',
      capturedAt: '2025-08-16T12:40:00',
      amount: 264.6,
    },
    timeline: [
      { status: 'pending', at: '2025-08-15T09:30:00', note: 'Request submitted' },
      { status: 'confirmed', at: '2025-08-15T10:05:00', note: 'Confirmed by the concierge team' },
      { status: 'shopping', at: '2025-08-16T09:40:00', note: 'Shopping at The Fresh Market' },
      { status: 'on_the_way', at: '2025-08-16T11:15:00', note: 'On the way to the property' },
      { status: 'delivered', at: '2025-08-16T11:52:00', note: 'Delivered and put away' },
    ],
    shopper: { name: 'Elena R.', phone: '(850) 555-0334' },
    deliveryPhoto: PHOTO.groceryKitchen,
    rating: { stars: 5, feedback: 'Elena put everything away and texted about a substitution. Perfect.' },
    cancellationAccepted: true,
  },
]

/** Bookings the guest made with partners — recorded for the trip timeline only. */
export const mockPartnerBookings = [
  {
    id: 'PB-3301',
    type: 'partner',
    guestId: 'guest_sarah_01',
    partnerId: 'partner_bike_beachside',
    partnerName: 'Beachside Bike Rentals',
    category: 'Bike Rentals',
    date: '2026-08-21',
    status: 'external',
    statusLabel: 'Arranged with partner',
    amount: null,
    note: 'You contacted this partner through My30A. Any booking or payment is handled directly by them.',
    image: PHOTO.bikes,
  },
  {
    id: 'PB-3302',
    type: 'partner',
    guestId: 'guest_sarah_01',
    partnerId: 'partner_photo_dune',
    partnerName: 'Dune & Light Photography',
    category: 'Photography',
    date: '2026-08-23',
    status: 'external',
    statusLabel: 'Arranged with partner',
    amount: null,
    note: 'You contacted this partner through My30A. Any booking or payment is handled directly by them.',
    image: PHOTO.familyPhoto,
  },
]

export const getGroceryOrderById = (id) => mockGroceryOrders.find((o) => o.id === id)
