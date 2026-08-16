/**
 * Vitoria's personalised picks. In production these come from the AI memory
 * layer; the shape (reason + entity reference) is what the backend will fill.
 */
export const mockRecommendations = [
  {
    id: 'rec_1',
    kind: 'restaurant',
    refId: 'rest_old_florida_fish',
    reason: 'You loved the grouper at Great Southern last August — this is the same catch, better sunset.',
    tag: 'Because you like seafood',
  },
  {
    id: 'rec_2',
    kind: 'partner',
    refId: 'partner_photo_dune',
    reason: 'You book a sunrise family session every trip. Their Thursday 6:20 AM slot is open.',
    tag: 'You do this every year',
  },
  {
    id: 'rec_3',
    kind: 'partner',
    refId: 'partner_activity_surf',
    reason: 'Both kids are old enough for the group lesson now, and the morning water is glassiest.',
    tag: 'Good with a 7 and 11 year old',
  },
  {
    id: 'rec_4',
    kind: 'event',
    refId: 'event_wine_tasting',
    reason: 'A rooftop tasting two minutes from the house on a night you have nothing planned.',
    tag: 'During your stay',
  },
  {
    id: 'rec_5',
    kind: 'beach',
    refId: 'beach_deer_lake',
    reason: 'You mentioned wanting somewhere quieter than Inlet Beach in the afternoons.',
    tag: 'Quieter than your usual'
  },
]

/** Local intel Vitoria surfaces in the contextual rail. */
export const mockLocalConditions = {
  weather: { tempF: 88, condition: 'Sunny', high: 91, low: 78, icon: 'sun' },
  water: { tempF: 84, surf: 'Light chop, 1–2 ft' },
  beachFlag: {
    color: '#F2C744',
    label: 'Yellow flag',
    meaning: 'Moderate surf and currents — keep an eye on younger swimmers.',
  },
  sunset: '7:35 PM',
  sunrise: '6:22 AM',
  tide: 'Low tide 4:12 PM · High tide 10:48 PM',
}
