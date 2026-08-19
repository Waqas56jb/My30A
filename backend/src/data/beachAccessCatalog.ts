/**
 * Official Walton County / Visit South Walton beach & bay access catalog.
 * Source: https://www.visitsouthwalton.com/beach-bay-access-locations/
 * Rules and access classes match the county legend (updated Jul 21, 2026).
 * This is free public-info content — never gated by subscription or stay.
 */

export const BEACH_ACCESS_SOURCE = {
  name: 'Visit South Walton',
  url: 'https://www.visitsouthwalton.com/beach-bay-access-locations/',
  flagSms: { keyword: 'SAFETY', number: '31279' },
  lastMapUpdate: '2026-07-21',
  neighborhoods: [
    'Miramar Beach',
    'Sandestin',
    'Dune Allen',
    'Gulf Place',
    'Santa Rosa Beach',
    'Blue Mountain Beach',
    'Grayton Beach',
    'WaterColor',
    'Seaside',
    'Seagrove',
    'WaterSound',
    'Seacrest',
    'Alys Beach',
    'Rosemary Beach',
    'Inlet Beach',
    'Point Washington',
  ],
};

export const ACCESS_RULES = {
  full_public: {
    label: 'Full Public Use',
    summary:
      'Open public beach. Regional accesses have restrooms, parking, showers, bike racks, surf flags, and lifeguards March–October.',
  },
  limited_public: {
    label: 'Limited Public Use',
    summary:
      'Beachgoers can use the 20-foot transitory zone landward of the wet/dry shoreline for walking, jogging, and entering the water. Follow posted signs.',
  },
  private: {
    label: 'Private',
    summary:
      'Access is site-specific to the resort, rental, or owner. Guests should confirm with their host. Sunbathing on owner-managed private beach is limited and may be relocated if rules are not followed.',
  },
};

export const FLAG_LEGEND = [
  { code: 'double_red', label: 'Water Closed to Public', meaning: 'Water activity is prohibited. Entering the water can result in a $500 fine.', color: '#7f1d1d' },
  { code: 'red', label: 'High Hazard', meaning: 'High surf and/or strong currents.', color: '#b91c1c' },
  { code: 'yellow', label: 'Medium Hazard', meaning: 'Moderate surf and/or currents.', color: '#ca8a04' },
  { code: 'green', label: 'Low Hazard', meaning: 'Calm conditions. Exercise caution.', color: '#15803d' },
  { code: 'purple', label: 'Stinging Marine Life', meaning: 'Man o’ war, jellyfish, or stingrays present.', color: '#7e22ce' },
];

export type BeachAccessSeed = {
  slug: string;
  name: string;
  neighborhood: string;
  useClass: 'full_public' | 'limited_public' | 'private';
  accessKind: 'regional' | 'neighborhood' | 'county_state' | 'bay_lake' | 'private';
  description: string;
  parking?: string;
  amenities?: string[];
  latitude: number;
  longitude: number;
};

export const BEACH_ACCESSES: BeachAccessSeed[] = [
  { slug: 'inlet-beach-rba', name: 'Inlet Beach Regional Beach Access', neighborhood: 'Inlet Beach', useClass: 'full_public', accessKind: 'regional', description: 'One of Walton County’s 11 Regional Beach Accesses. Restrooms, parking, showers, bike racks, surf flag, and seasonal lifeguards.', parking: 'Large public lot', amenities: ['Restrooms', 'Showers', 'Bike racks', 'ADA', 'Lifeguard (Mar–Oct)', 'Flag'], latitude: 30.2728, longitude: -86.0012 },
  { slug: 'van-ness-butler-rba', name: 'Van Ness Butler Jr. Regional Beach Access', neighborhood: 'Seagrove', useClass: 'full_public', accessKind: 'regional', description: 'Regional access on East CR 30A with restrooms, parking, showers, and a posted surf flag.', parking: 'Public lot', amenities: ['Restrooms', 'Showers', 'Bike racks', 'Lifeguard (Mar–Oct)', 'Flag'], latitude: 30.3055, longitude: -86.0864 },
  { slug: 'ed-walline-rba', name: 'Ed Walline Regional Beach Access', neighborhood: 'Santa Rosa Beach', useClass: 'full_public', accessKind: 'regional', description: 'County RBA on CR 30A. Restrooms, parking, showers, bike racks, flag, and seasonal lifeguards.', parking: 'Public lot', amenities: ['Restrooms', 'Showers', 'Bike racks', 'ADA', 'Lifeguard (Mar–Oct)', 'Flag'], latitude: 30.3348, longitude: -86.1522 },
  { slug: 'dune-allen-rba', name: 'Dune Allen Regional Beach Access', neighborhood: 'Dune Allen', useClass: 'full_public', accessKind: 'regional', description: 'West 30A regional access with parking, restrooms, showers, and a daily surf flag.', parking: 'Public lot', amenities: ['Restrooms', 'Showers', 'Bike racks', 'Lifeguard (Mar–Oct)', 'Flag'], latitude: 30.3372, longitude: -86.2048 },
  { slug: 'gulfview-heights-rba', name: 'Gulfview Heights Regional Beach Access', neighborhood: 'Miramar Beach', useClass: 'full_public', accessKind: 'regional', description: 'Regional access on Scenic Gulf Drive / Hwy 98 with restrooms, parking, and a surf flag.', parking: 'Public lot', amenities: ['Restrooms', 'Showers', 'Bike racks', 'Flag', 'Lifeguard (Mar–Oct)'], latitude: 30.3714, longitude: -86.3221 },
  { slug: 'pompano-rba', name: 'Pompano Street Regional Beach Access', neighborhood: 'Miramar Beach', useClass: 'full_public', accessKind: 'regional', description: 'Miramar Beach regional access with public parking and posted surf conditions.', parking: 'Public lot', amenities: ['Restrooms', 'Showers', 'Flag'], latitude: 30.3742, longitude: -86.3506 },
  { slug: 'beachside-98-rba', name: 'Beachside Highway 98 Regional Access', neighborhood: 'Miramar Beach', useClass: 'full_public', accessKind: 'regional', description: 'Hwy 98 regional beach access serving the west end of South Walton.', parking: 'Public lot', amenities: ['Restrooms', 'Parking', 'Flag'], latitude: 30.379, longitude: -86.365 },
  { slug: 'eastern-lake-rba', name: 'Eastern Lake Beach Access', neighborhood: 'Seagrove', useClass: 'full_public', accessKind: 'regional', description: 'Public gulf access near Eastern Lake with parking and a surf flag.', parking: 'Public lot', amenities: ['Parking', 'Flag'], latitude: 30.292, longitude: -86.054 },
  { slug: 'western-lake-rba', name: 'Western Lake Beach Access', neighborhood: 'Grayton Beach', useClass: 'full_public', accessKind: 'regional', description: 'Public access by Western Lake. Parking and gulf walkover.', parking: 'Public lot', amenities: ['Parking', 'Walkover', 'Flag'], latitude: 30.326, longitude: -86.165 },
  { slug: 'cr393-rba', name: 'CR 393 / Blue Mountain Regional Access', neighborhood: 'Blue Mountain Beach', useClass: 'full_public', accessKind: 'regional', description: 'County access at CR 393 and 30A with parking and a posted flag.', parking: 'Public lot', amenities: ['Parking', 'Restrooms', 'Flag'], latitude: 30.337, longitude: -86.201 },
  { slug: 'lakewood-rba', name: 'Lakewood Drive Beach Access', neighborhood: 'Santa Rosa Beach', useClass: 'full_public', accessKind: 'regional', description: 'Santa Rosa Beach regional-style access with parking near the gulf.', parking: 'Street and lot parking', amenities: ['Parking', 'Flag'], latitude: 30.341, longitude: -86.175 },

  { slug: 'dune-allen-nba', name: 'Dune Allen neighborhood walkovers', neighborhood: 'Dune Allen', useClass: 'full_public', accessKind: 'neighborhood', description: 'Smaller public walkovers inside Dune Allen, meant mainly for walk-up traffic. Many post a surf flag.', parking: 'Limited / walk-up', amenities: ['Walkover', 'Flag'], latitude: 30.3385, longitude: -86.211 },
  { slug: 'blue-mountain-nba', name: 'Blue Mountain Beach neighborhood access', neighborhood: 'Blue Mountain Beach', useClass: 'full_public', accessKind: 'neighborhood', description: 'Neighborhood public walkovers. Wide sand and sunset views. Designed for walk-up use.', parking: 'Limited', amenities: ['Walkover', 'Flag'], latitude: 30.336, longitude: -86.198 },
  { slug: 'santa-rosa-nba', name: 'Santa Rosa Beach neighborhood accesses', neighborhood: 'Santa Rosa Beach', useClass: 'full_public', accessKind: 'neighborhood', description: 'Public neighborhood walkovers along CR 30A in Santa Rosa Beach.', parking: 'Limited / street', amenities: ['Walkover'], latitude: 30.333, longitude: -86.145 },
  { slug: 'grayton-nba', name: 'Grayton Beach neighborhood access', neighborhood: 'Grayton Beach', useClass: 'full_public', accessKind: 'neighborhood', description: 'Village walkovers in historic Grayton Beach. Walk-up public use.', parking: 'Limited village parking', amenities: ['Walkover'], latitude: 30.3305, longitude: -86.162 },
  { slug: 'seagrove-nba', name: 'Seagrove neighborhood walkovers', neighborhood: 'Seagrove', useClass: 'full_public', accessKind: 'neighborhood', description: 'Public neighborhood accesses in Seagrove, primarily walk-up.', parking: 'Limited', amenities: ['Walkover'], latitude: 30.308, longitude: -86.095 },
  { slug: 'inlet-nba', name: 'Inlet Beach neighborhood walkovers', neighborhood: 'Inlet Beach', useClass: 'full_public', accessKind: 'neighborhood', description: 'Smaller public accesses near Inlet Beach Regional. Walk-up traffic.', parking: 'Limited', amenities: ['Walkover'], latitude: 30.274, longitude: -86.006 },
  { slug: 'gulf-place-nba', name: 'Gulf Place public walkover', neighborhood: 'Gulf Place', useClass: 'full_public', accessKind: 'neighborhood', description: 'Public walkover by Gulf Place shops and the green.', parking: 'Shared lot', amenities: ['Walkover', 'Shops nearby'], latitude: 30.357, longitude: -86.262 },
  { slug: 'miramar-nba', name: 'Miramar Beach neighborhood accesses', neighborhood: 'Miramar Beach', useClass: 'full_public', accessKind: 'neighborhood', description: 'Public walkovers along Scenic Gulf Drive.', parking: 'Street / small lots', amenities: ['Walkover'], latitude: 30.375, longitude: -86.34 },
  { slug: 'beach-highlands-nba', name: 'Beach Highlands public access', neighborhood: 'Santa Rosa Beach', useClass: 'full_public', accessKind: 'neighborhood', description: 'Neighborhood public access west of Gulf Place.', parking: 'Limited', amenities: ['Walkover'], latitude: 30.352, longitude: -86.248 },
  { slug: 'seacrest-nba', name: 'Seacrest public walkover', neighborhood: 'Seacrest', useClass: 'full_public', accessKind: 'neighborhood', description: 'Public neighborhood access in Seacrest between WaterSound and Alys.', parking: 'Limited', amenities: ['Walkover'], latitude: 30.284, longitude: -86.032 },

  { slug: 'grayton-state-park', name: 'Grayton Beach State Park', neighborhood: 'Grayton Beach', useClass: 'full_public', accessKind: 'county_state', description: 'State park gulf beach, dune lakes, and trails. State parks may charge an entry fee. No access restrictions beyond park rules.', parking: 'Park lot (fee may apply)', amenities: ['Restrooms', 'Trails', 'Picnic', 'Ranger'], latitude: 30.3236, longitude: -86.1578 },
  { slug: 'deer-lake-state-park', name: 'Deer Lake State Park', neighborhood: 'Seagrove', useClass: 'full_public', accessKind: 'county_state', description: 'Quiet state-park dune walkover to the gulf. Limited facilities. Entry fee may apply.', parking: 'Park lot', amenities: ['Walkover', 'Trails'], latitude: 30.301, longitude: -86.073 },
  { slug: 'topsail-hill', name: 'Topsail Hill Preserve State Park', neighborhood: 'Santa Rosa Beach', useClass: 'full_public', accessKind: 'county_state', description: 'State preserve with gulf beach, dune lakes, and trails. Entry fee may apply.', parking: 'Park lot (tram in season)', amenities: ['Restrooms', 'Trails', 'Lakes', 'Tram'], latitude: 30.359, longitude: -86.279 },
  { slug: 'camp-helen', name: 'Camp Helen State Park', neighborhood: 'Inlet Beach', useClass: 'full_public', accessKind: 'county_state', description: 'State park at the east end of South Walton on Lake Powell and the gulf.', parking: 'Park lot', amenities: ['Restrooms', 'Trails', 'Lake'], latitude: 30.269, longitude: -85.993 },
  { slug: 'point-washington-sf', name: 'Point Washington State Forest access', neighborhood: 'Point Washington', useClass: 'full_public', accessKind: 'county_state', description: 'Inland forest trails and lake edges north of 30A. Not a gulf swim beach.', parking: 'Forest lots', amenities: ['Trails'], latitude: 30.345, longitude: -86.08 },

  { slug: 'western-lake-paddle', name: 'Western Lake paddle access', neighborhood: 'Grayton Beach', useClass: 'full_public', accessKind: 'bay_lake', description: 'Coastal dune lake access. Some bay and lake sites have ramps, parking, and restrooms.', parking: 'Nearby public parking', amenities: ['Paddle launch'], latitude: 30.327, longitude: -86.168 },
  { slug: 'eastern-lake-paddle', name: 'Eastern Lake paddle access', neighborhood: 'Seagrove', useClass: 'full_public', accessKind: 'bay_lake', description: 'Dune-lake launch for kayaks and paddleboards.', parking: 'Limited', amenities: ['Paddle launch'], latitude: 30.296, longitude: -86.056 },
  { slug: 'deer-lake-paddle', name: 'Deer Lake paddle access', neighborhood: 'Seagrove', useClass: 'full_public', accessKind: 'bay_lake', description: 'Lake access beside Deer Lake State Park.', parking: 'Park / roadside', amenities: ['Paddle launch'], latitude: 30.304, longitude: -86.075 },
  { slug: 'alligator-lake', name: 'Alligator Lake access', neighborhood: 'Santa Rosa Beach', useClass: 'full_public', accessKind: 'bay_lake', description: 'Coastal dune lake access west of Grayton.', parking: 'Limited', amenities: ['Paddle launch'], latitude: 30.332, longitude: -86.18 },
  { slug: 'stallworth-lake', name: 'Stallworth Lake access', neighborhood: 'Dune Allen', useClass: 'full_public', accessKind: 'bay_lake', description: 'Dune lake access in Dune Allen.', parking: 'Limited', amenities: ['Paddle launch'], latitude: 30.342, longitude: -86.218 },
  { slug: 'morris-lake', name: 'Morris Lake access', neighborhood: 'Santa Rosa Beach', useClass: 'full_public', accessKind: 'bay_lake', description: 'Coastal dune lake north of 30A.', parking: 'Limited', amenities: ['Paddle launch'], latitude: 30.348, longitude: -86.19 },
  { slug: 'choctawhatchee-mack', name: 'Mack Bayou boat ramp', neighborhood: 'Santa Rosa Beach', useClass: 'full_public', accessKind: 'bay_lake', description: 'Choctawhatchee Bay ramp with parking. Bay & lake access — not a gulf swim beach.', parking: 'Ramp lot', amenities: ['Boat ramp', 'Parking'], latitude: 30.402, longitude: -86.21 },
  { slug: 'hogtown-bayou', name: 'Hogtown Bayou access', neighborhood: 'Santa Rosa Beach', useClass: 'full_public', accessKind: 'bay_lake', description: 'Bayou access for fishing and paddling.', parking: 'Limited', amenities: ['Paddle launch'], latitude: 30.388, longitude: -86.18 },
  { slug: 'freeport-ramp', name: 'Freeport / Four Mile Village ramp', neighborhood: 'Point Washington', useClass: 'full_public', accessKind: 'bay_lake', description: 'Bay boat ramp north of 30A.', parking: 'Ramp lot', amenities: ['Boat ramp', 'Parking'], latitude: 30.498, longitude: -86.135 },
  { slug: 'lake-powell', name: 'Lake Powell bay access', neighborhood: 'Inlet Beach', useClass: 'full_public', accessKind: 'bay_lake', description: 'Coastal dune lake / bay access at the east end of the county.', parking: 'Park / roadside', amenities: ['Paddle launch'], latitude: 30.275, longitude: -85.985 },

  { slug: 'seagrove-limited', name: 'Seagrove owner-managed beach (transitory zone)', neighborhood: 'Seagrove', useClass: 'limited_public', accessKind: 'neighborhood', description: 'Limited Public Use: walk, jog, and enter the water in the 20-foot transitory zone. Do not cut through owner-managed dry sand. Follow posted signs.', parking: 'Use public RBA/NBA lots', amenities: ['Transitory zone'], latitude: 30.307, longitude: -86.09 },
  { slug: 'santa-rosa-limited', name: 'Santa Rosa Beach limited-use stretches', neighborhood: 'Santa Rosa Beach', useClass: 'limited_public', accessKind: 'neighborhood', description: 'Owner-managed private beach with a 20-foot public transitory zone. Sunbathing 9 a.m.–4 p.m. may be allowed; vendor chairs may be offered. Capacity is limited.', parking: 'Use public accesses', amenities: ['Transitory zone'], latitude: 30.332, longitude: -86.148 },
  { slug: 'blue-mountain-limited', name: 'Blue Mountain limited-use stretches', neighborhood: 'Blue Mountain Beach', useClass: 'limited_public', accessKind: 'neighborhood', description: 'Limited public use along owner-managed frontage. Stay in the transitory zone unless a public walkover is posted.', parking: 'Use CR 393 / Dune Allen RBA', amenities: ['Transitory zone'], latitude: 30.335, longitude: -86.195 },
  { slug: 'seacrest-limited', name: 'Seacrest limited-use stretches', neighborhood: 'Seacrest', useClass: 'limited_public', accessKind: 'neighborhood', description: 'Yellow-map owner-managed beach. Public use is the wet-sand / 20-foot transitory zone only.', parking: 'Public NBA / RBA nearby', amenities: ['Transitory zone'], latitude: 30.283, longitude: -86.03 },
  { slug: 'inlet-limited', name: 'Inlet Beach limited-use stretches', neighborhood: 'Inlet Beach', useClass: 'limited_public', accessKind: 'neighborhood', description: 'Limited public use between private home frontage. Use Inlet Beach RBA for parking and full amenities.', parking: 'Inlet Beach RBA', amenities: ['Transitory zone'], latitude: 30.2735, longitude: -86.008 },
  { slug: 'miramar-limited', name: 'Miramar Beach limited-use stretches', neighborhood: 'Miramar Beach', useClass: 'limited_public', accessKind: 'neighborhood', description: 'Owner-managed frontage west of 30A. Public walking zone is 20 feet landward of the wet/dry line.', parking: 'Regional lots', amenities: ['Transitory zone'], latitude: 30.376, longitude: -86.345 },

  { slug: 'seaside-private', name: 'Seaside pavilions (private / guest)', neighborhood: 'Seaside', useClass: 'private', accessKind: 'private', description: 'Private community beach. Access is for guests staying in Seaside. Red on the county map. Confirm with your host. Everyone may still use the wet-sand walking zone along the 26-mile gulf.', parking: 'Community / guest only', amenities: ['Pavilions for guests'], latitude: 30.32, longitude: -86.1408 },
  { slug: 'rosemary-private', name: 'Rosemary Beach walkovers (private / guest)', neighborhood: 'Rosemary Beach', useClass: 'private', accessKind: 'private', description: 'Private community walkovers for owners and staying guests. Check with your host for the pavilion assigned to your house.', parking: 'Guest / resident', amenities: ['Guest walkovers'], latitude: 30.2802, longitude: -86.0165 },
  { slug: 'alys-private', name: 'Alys Beach access (private / guest)', neighborhood: 'Alys Beach', useClass: 'private', accessKind: 'private', description: 'Gated community beach access for residents and registered guests.', parking: 'Community', amenities: ['Guest walkovers'], latitude: 30.2815, longitude: -86.028 },
  { slug: 'watercolor-private', name: 'WaterColor beach club access (private / guest)', neighborhood: 'WaterColor', useClass: 'private', accessKind: 'private', description: 'Club and community access for registered WaterColor guests.', parking: 'Community / club', amenities: ['Beach club'], latitude: 30.318, longitude: -86.127 },
  { slug: 'watersound-private', name: 'WaterSound beach access (private / guest)', neighborhood: 'WaterSound', useClass: 'private', accessKind: 'private', description: 'Neighborhood beach access for staying guests.', parking: 'Community', amenities: ['Guest walkovers'], latitude: 30.286, longitude: -86.042 },
  { slug: 'sandestin-private', name: 'Sandestin gulf access (private / guest)', neighborhood: 'Sandestin', useClass: 'private', accessKind: 'private', description: 'Resort beach access is for resort guests. Confirm with your accommodation.', parking: 'Resort', amenities: ['Resort beach'], latitude: 30.379, longitude: -86.322 },
  { slug: 'prominence-private', name: 'Prominence Beach access (private / guest)', neighborhood: 'Inlet Beach', useClass: 'private', accessKind: 'private', description: 'Community access for Prominence guests and owners.', parking: 'Community', amenities: ['Guest walkover'], latitude: 30.276, longitude: -86.012 },
  { slug: 'camp-creek-private', name: 'Camp Creek beach (private / guest)', neighborhood: 'WaterSound', useClass: 'private', accessKind: 'private', description: 'Private / guest beach associated with Camp Creek and WaterSound.', parking: 'Community', amenities: ['Guest access'], latitude: 30.288, longitude: -86.048 },
  { slug: 'seacrest-private', name: 'Seacrest Beach club access (private / guest)', neighborhood: 'Seacrest', useClass: 'private', accessKind: 'private', description: 'Some Seacrest buildings have private walkovers. Confirm with your rental.', parking: 'Building / guest', amenities: ['Guest walkover'], latitude: 30.282, longitude: -86.034 },
  { slug: 'dune-allen-private', name: 'Dune Allen cottage walkovers (private / guest)', neighborhood: 'Dune Allen', useClass: 'private', accessKind: 'private', description: 'Individual cottage walkovers are for that property’s guests. Use Dune Allen RBA for public parking and flags.', parking: 'House / guest', amenities: ['Private walkover'], latitude: 30.339, longitude: -86.208 },
];
