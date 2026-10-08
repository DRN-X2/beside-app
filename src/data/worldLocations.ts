/**
 * City-level geographic data for OpenWorld.
 * Provides exact real-world WGS84 Latitude and Longitude for Leaflet map,
 * and maintains svgX/svgY for backward compatibility.
 */

export interface CityData {
  name: string
  country: string
  lat: number
  lng: number
  svgX: number // 0-1000 legacy fallback
  svgY: number // 0-600 legacy fallback
}

export interface CountryData {
  name: string
  code: string
  cities: string[]
}

// World-space coordinate lookup for major cities
export const CITY_COORDINATES: Record<string, CityData> = {
  // Philippines
  'Manila':         { name: 'Manila', country: 'Philippines', lat: 14.5995, lng: 120.9842, svgX: 802, svgY: 352 },
  'Quezon City':    { name: 'Quezon City', country: 'Philippines', lat: 14.6760, lng: 121.0437, svgX: 803, svgY: 350 },
  'Makati':         { name: 'Makati', country: 'Philippines', lat: 14.5547, lng: 121.0244, svgX: 802, svgY: 353 },
  'Cebu':           { name: 'Cebu', country: 'Philippines', lat: 10.3157, lng: 123.8854, svgX: 808, svgY: 368 },
  'Davao':          { name: 'Davao', country: 'Philippines', lat: 7.1907, lng: 125.4553, svgX: 820, svgY: 380 },
  'Cagayan de Oro': { name: 'Cagayan de Oro', country: 'Philippines', lat: 8.4542, lng: 124.6319, svgX: 814, svgY: 370 },
  'Zamboanga':      { name: 'Zamboanga', country: 'Philippines', lat: 6.9214, lng: 122.0790, svgX: 800, svgY: 382 },
  'Iloilo':         { name: 'Iloilo', country: 'Philippines', lat: 10.7202, lng: 122.5621, svgX: 800, svgY: 362 },
  'Bacolod':        { name: 'Bacolod', country: 'Philippines', lat: 10.6765, lng: 122.9509, svgX: 803, svgY: 363 },
  'Baguio':         { name: 'Baguio', country: 'Philippines', lat: 16.4023, lng: 120.5960, svgX: 799, svgY: 342 },

  // Japan
  'Tokyo':          { name: 'Tokyo', country: 'Japan', lat: 35.6762, lng: 139.6503, svgX: 864, svgY: 226 },
  'Osaka':          { name: 'Osaka', country: 'Japan', lat: 34.6937, lng: 135.5023, svgX: 855, svgY: 234 },
  'Kyoto':          { name: 'Kyoto', country: 'Japan', lat: 35.0116, lng: 135.7681, svgX: 853, svgY: 233 },
  'Sapporo':        { name: 'Sapporo', country: 'Japan', lat: 43.0618, lng: 141.3545, svgX: 872, svgY: 210 },
  'Fukuoka':        { name: 'Fukuoka', country: 'Japan', lat: 33.5904, lng: 130.4017, svgX: 843, svgY: 240 },
  'Nagoya':         { name: 'Nagoya', country: 'Japan', lat: 35.1815, lng: 136.9066, svgX: 859, svgY: 229 },

  // South Korea
  'Seoul':          { name: 'Seoul', country: 'South Korea', lat: 37.5665, lng: 126.9780, svgX: 845, svgY: 225 },
  'Busan':          { name: 'Busan', country: 'South Korea', lat: 35.1796, lng: 129.0756, svgX: 850, svgY: 232 },
  'Incheon':        { name: 'Incheon', country: 'South Korea', lat: 37.4563, lng: 126.7052, svgX: 843, svgY: 225 },

  // China
  'Beijing':        { name: 'Beijing', country: 'China', lat: 39.9042, lng: 116.4074, svgX: 830, svgY: 215 },
  'Shanghai':       { name: 'Shanghai', country: 'China', lat: 31.2304, lng: 121.4737, svgX: 845, svgY: 230 },
  'Guangzhou':      { name: 'Guangzhou', country: 'China', lat: 23.1291, lng: 113.2644, svgX: 826, svgY: 255 },
  'Shenzhen':       { name: 'Shenzhen', country: 'China', lat: 22.5431, lng: 114.0579, svgX: 828, svgY: 257 },
  'Chengdu':        { name: 'Chengdu', country: 'China', lat: 30.5728, lng: 104.0668, svgX: 795, svgY: 238 },
  "Xi'an":          { name: "Xi'an", country: 'China', lat: 34.3416, lng: 108.9398, svgX: 803, svgY: 226 },
  'Wuhan':          { name: 'Wuhan', country: 'China', lat: 30.5928, lng: 114.3055, svgX: 828, svgY: 237 },
  'Hangzhou':       { name: 'Hangzhou', country: 'China', lat: 30.2741, lng: 120.1551, svgX: 846, svgY: 234 },

  // India
  'Mumbai':         { name: 'Mumbai', country: 'India', lat: 19.0760, lng: 72.8777, svgX: 715, svgY: 286 },
  'Delhi':          { name: 'Delhi', country: 'India', lat: 28.6139, lng: 77.2090, svgX: 720, svgY: 258 },
  'Bengaluru':      { name: 'Bengaluru', country: 'India', lat: 12.9716, lng: 77.5946, svgX: 720, svgY: 302 },
  'Chennai':        { name: 'Chennai', country: 'India', lat: 13.0827, lng: 80.2707, svgX: 728, svgY: 306 },
  'Kolkata':        { name: 'Kolkata', country: 'India', lat: 22.5726, lng: 88.3639, svgX: 751, svgY: 271 },
  'Hyderabad':      { name: 'Hyderabad', country: 'India', lat: 17.3850, lng: 78.4867, svgX: 722, svgY: 293 },

  // USA
  'New York':       { name: 'New York', country: 'United States', lat: 40.7128, lng: -74.0060, svgX: 232, svgY: 195 },
  'Los Angeles':    { name: 'Los Angeles', country: 'United States', lat: 34.0522, lng: -118.2437, svgX: 146, svgY: 218 },
  'Chicago':        { name: 'Chicago', country: 'United States', lat: 41.8781, lng: -87.6298, svgX: 210, svgY: 190 },
  'Houston':        { name: 'Houston', country: 'United States', lat: 29.7604, lng: -95.3698, svgX: 196, svgY: 234 },
  'San Francisco':  { name: 'San Francisco', country: 'United States', lat: 37.7749, lng: -122.4194, svgX: 135, svgY: 208 },
  'Seattle':        { name: 'Seattle', country: 'United States', lat: 47.6062, lng: -122.3321, svgX: 138, svgY: 175 },
  'Boston':         { name: 'Boston', country: 'United States', lat: 42.3601, lng: -71.0589, svgX: 241, svgY: 189 },
  'Miami':          { name: 'Miami', country: 'United States', lat: 25.7617, lng: -80.1918, svgX: 226, svgY: 248 },
  'Austin':         { name: 'Austin', country: 'United States', lat: 30.2672, lng: -97.7431, svgX: 191, svgY: 236 },
  'Denver':         { name: 'Denver', country: 'United States', lat: 39.7392, lng: -104.9903, svgX: 169, svgY: 207 },

  // Canada
  'Toronto':        { name: 'Toronto', country: 'Canada', lat: 43.6532, lng: -79.3832, svgX: 225, svgY: 182 },
  'Vancouver':      { name: 'Vancouver', country: 'Canada', lat: 49.2827, lng: -123.1207, svgX: 138, svgY: 168 },
  'Montreal':       { name: 'Montreal', country: 'Canada', lat: 45.5017, lng: -73.5673, svgX: 237, svgY: 178 },
  'Calgary':        { name: 'Calgary', country: 'Canada', lat: 51.0447, lng: -114.0719, svgX: 158, svgY: 168 },

  // UK
  'London':         { name: 'London', country: 'United Kingdom', lat: 51.5074, lng: -0.1278, svgX: 459, svgY: 165 },
  'Manchester':     { name: 'Manchester', country: 'United Kingdom', lat: 53.4808, lng: -2.2426, svgX: 456, svgY: 158 },
  'Birmingham':     { name: 'Birmingham', country: 'United Kingdom', lat: 52.4862, lng: -1.8904, svgX: 458, svgY: 162 },
  'Edinburgh':      { name: 'Edinburgh', country: 'United Kingdom', lat: 55.9533, lng: -3.1883, svgX: 456, svgY: 151 },

  // Germany
  'Berlin':         { name: 'Berlin', country: 'Germany', lat: 52.5200, lng: 13.4050, svgX: 490, svgY: 157 },
  'Munich':         { name: 'Munich', country: 'Germany', lat: 48.1351, lng: 11.5820, svgX: 488, svgY: 167 },
  'Hamburg':        { name: 'Hamburg', country: 'Germany', lat: 53.5511, lng: 9.9937, svgX: 484, svgY: 153 },
  'Frankfurt':      { name: 'Frankfurt', country: 'Germany', lat: 50.1109, lng: 8.6821, svgX: 483, svgY: 161 },

  // France
  'Paris':          { name: 'Paris', country: 'France', lat: 48.8566, lng: 2.3522, svgX: 470, svgY: 167 },
  'Lyon':           { name: 'Lyon', country: 'France', lat: 45.7640, lng: 4.8357, svgX: 472, svgY: 176 },
  'Marseille':      { name: 'Marseille', country: 'France', lat: 43.2965, lng: 5.3698, svgX: 475, svgY: 182 },

  // Australia
  'Sydney':         { name: 'Sydney', country: 'Australia', lat: -33.8688, lng: 151.2093, svgX: 882, svgY: 476 },
  'Melbourne':      { name: 'Melbourne', country: 'Australia', lat: -37.8136, lng: 144.9631, svgX: 870, svgY: 490 },
  'Brisbane':       { name: 'Brisbane', country: 'Australia', lat: -27.4698, lng: 153.0251, svgX: 888, svgY: 462 },
  'Perth':          { name: 'Perth', country: 'Australia', lat: -31.9505, lng: 115.8605, svgX: 818, svgY: 480 },
  'Adelaide':       { name: 'Adelaide', country: 'Australia', lat: -34.9285, lng: 138.6007, svgX: 855, svgY: 484 },

  // Singapore
  'Singapore':      { name: 'Singapore', country: 'Singapore', lat: 1.3521, lng: 103.8198, svgX: 778, svgY: 353 },

  // Indonesia
  'Jakarta':        { name: 'Jakarta', country: 'Indonesia', lat: -6.2088, lng: 106.8456, svgX: 776, svgY: 372 },
  'Surabaya':       { name: 'Surabaya', country: 'Indonesia', lat: -7.2575, lng: 112.7521, svgX: 797, svgY: 382 },
  'Bali':           { name: 'Bali', country: 'Indonesia', lat: -8.3405, lng: 115.0920, svgX: 806, svgY: 386 },
  'Bandung':        { name: 'Bandung', country: 'Indonesia', lat: -6.9175, lng: 107.6191, svgX: 779, svgY: 377 },

  // Malaysia
  'Kuala Lumpur':   { name: 'Kuala Lumpur', country: 'Malaysia', lat: 3.1390, lng: 101.6869, svgX: 770, svgY: 347 },
  'Penang':         { name: 'Penang', country: 'Malaysia', lat: 5.4141, lng: 100.3288, svgX: 763, svgY: 335 },

  // Thailand
  'Bangkok':        { name: 'Bangkok', country: 'Thailand', lat: 13.7563, lng: 100.5018, svgX: 760, svgY: 315 },
  'Chiang Mai':     { name: 'Chiang Mai', country: 'Thailand', lat: 18.7883, lng: 98.9853, svgX: 753, svgY: 302 },

  // Vietnam
  'Hanoi':          { name: 'Hanoi', country: 'Vietnam', lat: 21.0285, lng: 105.8542, svgX: 778, svgY: 296 },
  'Ho Chi Minh City': { name: 'Ho Chi Minh City', country: 'Vietnam', lat: 10.8231, lng: 106.6297, svgX: 778, svgY: 330 },

  // Brazil
  'São Paulo':      { name: 'São Paulo', country: 'Brazil', lat: -23.5505, lng: -46.6333, svgX: 320, svgY: 464 },
  'Rio de Janeiro': { name: 'Rio de Janeiro', country: 'Brazil', lat: -22.9068, lng: -43.1729, svgX: 330, svgY: 456 },
  'Brasília':       { name: 'Brasília', country: 'Brazil', lat: -15.8267, lng: -47.9218, svgX: 320, svgY: 440 },

  // Mexico
  'Mexico City':    { name: 'Mexico City', country: 'Mexico', lat: 19.4326, lng: -99.1332, svgX: 178, svgY: 274 },
  'Guadalajara':    { name: 'Guadalajara', country: 'Mexico', lat: 20.6597, lng: -103.3496, svgX: 166, svgY: 276 },
  'Monterrey':      { name: 'Monterrey', country: 'Mexico', lat: 25.6866, lng: -100.3161, svgX: 183, svgY: 264 },

  // Nigeria
  'Lagos':          { name: 'Lagos', country: 'Nigeria', lat: 6.5244, lng: 3.3792, svgX: 481, svgY: 332 },
  'Abuja':          { name: 'Abuja', country: 'Nigeria', lat: 9.0765, lng: 7.3986, svgX: 490, svgY: 322 },

  // South Africa
  'Cape Town':      { name: 'Cape Town', country: 'South Africa', lat: -33.9249, lng: 18.4241, svgX: 503, svgY: 462 },
  'Johannesburg':   { name: 'Johannesburg', country: 'South Africa', lat: -26.2041, lng: 28.0473, svgX: 525, svgY: 448 },

  // Egypt
  'Cairo':          { name: 'Cairo', country: 'Egypt', lat: 30.0444, lng: 31.2357, svgX: 546, svgY: 250 },
  'Alexandria':     { name: 'Alexandria', country: 'Egypt', lat: 31.2001, lng: 29.9187, svgX: 540, svgY: 243 },

  // UAE
  'Dubai':          { name: 'Dubai', country: 'United Arab Emirates', lat: 25.2048, lng: 55.2708, svgX: 631, svgY: 268 },
  'Abu Dhabi':      { name: 'Abu Dhabi', country: 'United Arab Emirates', lat: 24.4539, lng: 54.3773, svgX: 627, svgY: 272 },

  // Saudi Arabia
  'Riyadh':         { name: 'Riyadh', country: 'Saudi Arabia', lat: 24.7136, lng: 46.6753, svgX: 612, svgY: 270 },
  'Jeddah':         { name: 'Jeddah', country: 'Saudi Arabia', lat: 21.4858, lng: 39.1925, svgX: 592, svgY: 278 },

  // Spain
  'Madrid':         { name: 'Madrid', country: 'Spain', lat: 40.4168, lng: -3.7038, svgX: 453, svgY: 182 },
  'Barcelona':      { name: 'Barcelona', country: 'Spain', lat: 41.3879, lng: 2.1699, svgX: 465, svgY: 180 },

  // Italy
  'Rome':           { name: 'Rome', country: 'Italy', lat: 41.9028, lng: 12.4964, svgX: 489, svgY: 183 },
  'Milan':          { name: 'Milan', country: 'Italy', lat: 45.4642, lng: 9.1900, svgX: 484, svgY: 173 },

  // Netherlands
  'Amsterdam':      { name: 'Amsterdam', country: 'Netherlands', lat: 52.3676, lng: 4.9041, svgX: 475, svgY: 155 },

  // Sweden
  'Stockholm':      { name: 'Stockholm', country: 'Sweden', lat: 59.3293, lng: 18.0686, svgX: 500, svgY: 136 },

  // Poland
  'Warsaw':         { name: 'Warsaw', country: 'Poland', lat: 52.2297, lng: 21.0122, svgX: 505, svgY: 155 },
  'Krakow':         { name: 'Krakow', country: 'Poland', lat: 50.0647, lng: 19.9450, svgX: 503, svgY: 162 },

  // Pakistan
  'Karachi':        { name: 'Karachi', country: 'Pakistan', lat: 24.8607, lng: 67.0011, svgX: 692, svgY: 268 },
  'Lahore':         { name: 'Lahore', country: 'Pakistan', lat: 31.5204, lng: 74.3587, svgX: 706, svgY: 253 },
  'Islamabad':      { name: 'Islamabad', country: 'Pakistan', lat: 33.6844, lng: 73.0479, svgX: 707, svgY: 244 },

  // Bangladesh
  'Dhaka':          { name: 'Dhaka', country: 'Bangladesh', lat: 23.8103, lng: 90.4125, svgX: 751, svgY: 274 },
  'Chittagong':     { name: 'Chittagong', country: 'Bangladesh', lat: 22.3569, lng: 91.7832, svgX: 756, svgY: 276 },
}

export const COUNTRIES: CountryData[] = [
  { name: 'Philippines', code: 'PH', cities: ['Manila', 'Quezon City', 'Makati', 'Cebu', 'Davao', 'Cagayan de Oro', 'Zamboanga', 'Iloilo', 'Bacolod', 'Baguio'] },
  { name: 'Japan', code: 'JP', cities: ['Tokyo', 'Osaka', 'Kyoto', 'Sapporo', 'Fukuoka', 'Nagoya'] },
  { name: 'South Korea', code: 'KR', cities: ['Seoul', 'Busan', 'Incheon'] },
  { name: 'China', code: 'CN', cities: ['Beijing', 'Shanghai', 'Guangzhou', 'Shenzhen', 'Chengdu', "Xi'an", 'Wuhan', 'Hangzhou'] },
  { name: 'India', code: 'IN', cities: ['Mumbai', 'Delhi', 'Bengaluru', 'Chennai', 'Kolkata', 'Hyderabad'] },
  { name: 'United States', code: 'US', cities: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'San Francisco', 'Seattle', 'Boston', 'Miami', 'Austin', 'Denver'] },
  { name: 'Canada', code: 'CA', cities: ['Toronto', 'Vancouver', 'Montreal', 'Calgary'] },
  { name: 'United Kingdom', code: 'GB', cities: ['London', 'Manchester', 'Birmingham', 'Edinburgh'] },
  { name: 'Germany', code: 'DE', cities: ['Berlin', 'Munich', 'Hamburg', 'Frankfurt'] },
  { name: 'France', code: 'FR', cities: ['Paris', 'Lyon', 'Marseille'] },
  { name: 'Australia', code: 'AU', cities: ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide'] },
  { name: 'Singapore', code: 'SG', cities: ['Singapore'] },
  { name: 'Indonesia', code: 'ID', cities: ['Jakarta', 'Surabaya', 'Bali', 'Bandung'] },
  { name: 'Malaysia', code: 'MY', cities: ['Kuala Lumpur', 'Penang'] },
  { name: 'Thailand', code: 'TH', cities: ['Bangkok', 'Chiang Mai'] },
  { name: 'Vietnam', code: 'VN', cities: ['Hanoi', 'Ho Chi Minh City'] },
  { name: 'Brazil', code: 'BR', cities: ['São Paulo', 'Rio de Janeiro', 'Brasília'] },
  { name: 'Mexico', code: 'MX', cities: ['Mexico City', 'Guadalajara', 'Monterrey'] },
  { name: 'Nigeria', code: 'NG', cities: ['Lagos', 'Abuja'] },
  { name: 'South Africa', code: 'ZA', cities: ['Cape Town', 'Johannesburg'] },
  { name: 'Egypt', code: 'EG', cities: ['Cairo', 'Alexandria'] },
  { name: 'United Arab Emirates', code: 'AE', cities: ['Dubai', 'Abu Dhabi'] },
  { name: 'Saudi Arabia', code: 'SA', cities: ['Riyadh', 'Jeddah'] },
  { name: 'Spain', code: 'ES', cities: ['Madrid', 'Barcelona'] },
  { name: 'Italy', code: 'IT', cities: ['Rome', 'Milan'] },
  { name: 'Netherlands', code: 'NL', cities: ['Amsterdam'] },
  { name: 'Sweden', code: 'SE', cities: ['Stockholm'] },
  { name: 'Poland', code: 'PL', cities: ['Warsaw', 'Krakow'] },
  { name: 'Pakistan', code: 'PK', cities: ['Karachi', 'Lahore', 'Islamabad'] },
  { name: 'Bangladesh', code: 'BD', cities: ['Dhaka', 'Chittagong'] },
]

export const COUNTRY_CENTERS_LATLNG: Record<string, [number, number]> = {
  'Philippines': [12.8797, 121.7740],
  'Japan': [36.2048, 138.2529],
  'South Korea': [35.9078, 127.7669],
  'China': [35.8617, 104.1954],
  'India': [20.5937, 78.9629],
  'United States': [37.0902, -95.7129],
  'Canada': [56.1304, -106.3468],
  'United Kingdom': [55.3781, -3.4360],
  'Germany': [51.1657, 10.4515],
  'France': [46.2276, 2.2137],
  'Australia': [-25.2744, 133.7751],
  'Singapore': [1.3521, 103.8198],
  'Indonesia': [-0.7893, 113.9213],
  'Malaysia': [4.2105, 101.9758],
  'Thailand': [15.8700, 100.9925],
  'Vietnam': [14.0583, 108.2772],
  'Brazil': [-14.2350, -51.9253],
  'Mexico': [23.6345, -102.5528],
  'Nigeria': [9.0820, 8.6753],
  'South Africa': [-30.5595, 22.9375],
  'Egypt': [26.8206, 30.8025],
  'United Arab Emirates': [23.4241, 53.8478],
  'Saudi Arabia': [23.8859, 45.0792],
  'Spain': [40.4637, -3.7492],
  'Italy': [41.8719, 12.5674],
  'Netherlands': [52.1326, 5.2913],
  'Sweden': [60.1282, 18.6435],
  'Poland': [51.9194, 19.1451],
  'Pakistan': [30.3753, 69.3451],
  'Bangladesh': [23.6850, 90.3563],
}

/** Resolve city real-world WGS84 [lat, lng]. Falls back to country center or default [20, 0]. */
export function getCityLatLng(city: string, country: string): [number, number] {
  const cityKey = city?.trim() || ''
  if (CITY_COORDINATES[cityKey]) {
    return [CITY_COORDINATES[cityKey].lat, CITY_COORDINATES[cityKey].lng]
  }
  const countryKey = country?.trim() || ''
  return COUNTRY_CENTERS_LATLNG[countryKey] || [20, 0]
}

/** Resolve city legacy SVG coordinates. */
export function getCityCoords(city: string, country: string): { x: number; y: number } {
  const cityKey = city?.trim() || ''
  if (CITY_COORDINATES[cityKey]) {
    return { x: CITY_COORDINATES[cityKey].svgX, y: CITY_COORDINATES[cityKey].svgY }
  }
  return { x: 500, y: 300 }
}
