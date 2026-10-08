/**
 * High-accuracy City Geocoding Service for Beside OpenWorld.
 * Combines an exhaustive high-precision Philippine & Global City Registry
 * with dynamic live OpenStreetMap / Photon geocoding and persistent local caching.
 */

// Local storage cache key
const GEO_CACHE_KEY = 'beside_geocoding_cache_v2'

// In-memory runtime cache
const memoryCache = new Map<string, [number, number]>()

// Load persistent cache from localStorage
try {
  const saved = localStorage.getItem(GEO_CACHE_KEY)
  if (saved) {
    const parsed = JSON.parse(saved)
    Object.entries(parsed).forEach(([key, coords]) => {
      if (Array.isArray(coords) && coords.length === 2) {
        memoryCache.set(key.toLowerCase().trim(), coords as [number, number])
      }
    })
  }
} catch {}

function saveToStorage() {
  try {
    const obj: Record<string, [number, number]> = {}
    memoryCache.forEach((val, key) => {
      obj[key] = val
    })
    localStorage.setItem(GEO_CACHE_KEY, JSON.stringify(obj))
  } catch {}
}

/**
 * High-precision WGS84 coordinates for major Philippine and international cities.
 */
export const PRECISE_CITY_REGISTRY: Record<string, [number, number]> = {
  // ═══════════════════ METRO MANILA (NCR) ═══════════════════
  'manila':                     [14.5995, 120.9842],
  'city of manila':             [14.5995, 120.9842],
  'quezon city':                [14.6760, 121.0437],
  'qc':                         [14.6760, 121.0437],
  'makati':                     [14.5547, 121.0244],
  'makati city':                [14.5547, 121.0244],
  'taguig':                     [14.5176, 121.0509],
  'taguig city':                [14.5176, 121.0509],
  'bgc':                        [14.5507, 121.0503],
  'bonifacio global city':      [14.5507, 121.0503],
  'pasig':                      [14.5764, 121.0851],
  'pasig city':                 [14.5764, 121.0851],
  'mandaluyong':                [14.5794, 121.0359],
  'mandaluyong city':           [14.5794, 121.0359],
  'caloocan':                   [14.6571, 120.9841],
  'caloocan city':              [14.6571, 120.9841],
  'caloocan city north':        [14.7565, 121.0435],
  'pasay':                      [14.5378, 121.0014],
  'pasay city':                 [14.5378, 121.0014],
  'parañaque':                  [14.4793, 121.0198],
  'paranaque':                  [14.4793, 121.0198],
  'parañaque city':             [14.4793, 121.0198],
  'las piñas':                  [14.4445, 120.9939],
  'las pinas':                  [14.4445, 120.9939],
  'muntinlupa':                 [14.4081, 121.0415],
  'muntinlupa city':            [14.4081, 121.0415],
  'marikina':                   [14.6507, 121.1029],
  'marikina city':              [14.6507, 121.1029],
  'valenzuela':                 [14.7011, 120.9830],
  'valenzuela city':            [14.7011, 120.9830],
  'malabon':                    [14.6625, 120.9566],
  'malabon city':               [14.6625, 120.9566],
  'navotas':                    [14.6644, 120.9389],
  'navotas city':               [14.6644, 120.9389],
  'san juan':                   [14.6019, 121.0355],
  'san juan city':              [14.6019, 121.0355],
  'pateros':                    [14.5453, 121.0686],

  // ═══════════════════ GREATER MANILA & LUZON ═══════════════════
  'antipolo':                   [14.5842, 121.1763],
  'cainta':                     [14.5772, 121.1219],
  'taytay':                     [14.5135, 121.1325],
  'angono':                     [14.5262, 121.1541],
  'san mateo':                  [14.6966, 121.1215],
  'rodriguez':                  [14.7570, 121.1444],
  'montalban':                  [14.7570, 121.1444],
  'bacoor':                     [14.4608, 120.9416],
  'imus':                       [14.4296, 120.9367],
  'dasmarinas':                 [14.3294, 120.9367],
  'dasmariñas':                 [14.3294, 120.9367],
  'general trias':              [14.3871, 120.8803],
  'cavite city':                [14.4831, 120.8980],
  'tagaytay':                   [14.1153, 120.9621],
  'silang':                     [14.2307, 120.9749],
  'santa rosa':                 [14.3122, 121.1114],
  'sta. rosa':                  [14.3122, 121.1114],
  'biñan':                      [14.3385, 121.0827],
  'binan':                      [14.3385, 121.0827],
  'san pedro':                  [14.3592, 121.0544],
  'calamba':                    [14.2117, 121.1656],
  'los baños':                  [14.1706, 121.2434],
  'los banos':                  [14.1706, 121.2434],
  'san jose del monte':         [14.8135, 121.0453],
  'malolos':                    [14.8433, 120.8113],
  'meycauayan':                 [14.7366, 120.9599],
  'marilao':                    [14.7578, 120.9472],
  'angeles':                    [15.1450, 120.5887],
  'angeles city':               [15.1450, 120.5887],
  'san fernando, pampanga':     [15.0298, 120.6896],
  'san fernando':               [15.0298, 120.6896],
  'mabalacat':                  [15.2217, 120.5731],
  'clark':                      [15.1856, 120.5365],
  'olongapo':                   [14.8386, 120.2842],
  'subic':                      [14.8778, 120.2333],
  'baguio':                     [16.4023, 120.5960],
  'baguio city':                [16.4023, 120.5960],
  'la trinidad':                [16.4550, 120.5878],
  'dagupan':                    [16.0433, 120.3340],
  'san fernando, la union':     [16.6159, 120.3209],
  'vigan':                      [17.5705, 120.3869],
  'laoag':                      [18.1979, 120.5936],
  'tuguegarao':                 [17.6132, 121.7270],
  'tarlac city':                [15.4802, 120.5979],
  'tarlac':                     [15.4802, 120.5979],
  'cabanatuan':                 [15.4865, 120.9674],
  'batangas city':              [13.7565, 121.0583],
  'batangas':                   [13.7565, 121.0583],
  'lipa':                       [13.9419, 121.1644],
  'lipa city':                  [13.9419, 121.1644],
  'lucena':                     [13.9314, 121.6172],
  'lucena city':                [13.9314, 121.6172],
  'naga':                       [13.6218, 123.1948],
  'naga city':                  [13.6218, 123.1948],
  'legazpi':                    [13.1391, 123.7438],
  'legazpi city':               [13.1391, 123.7438],
  'puerto princesa':            [9.7392, 118.7353],

  // ═══════════════════ VISAYAS ═══════════════════
  'cebu':                       [10.3157, 123.8854],
  'cebu city':                  [10.3157, 123.8854],
  'mandaue':                    [10.3333, 123.9333],
  'lapu-lapu':                  [10.3111, 123.9494],
  'talisay, cebu':              [10.2447, 123.8494],
  'iloilo':                     [10.7202, 122.5621],
  'iloilo city':                [10.7202, 122.5621],
  'bacolod':                    [10.6765, 122.9509],
  'bacolod city':               [10.6765, 122.9509],
  'tacloban':                   [11.2433, 125.0039],
  'tacloban city':              [11.2433, 125.0039],
  'ormoc':                      [11.0050, 124.6075],
  'tagbilaran':                 [9.6444, 123.8547],
  'dumaguete':                  [9.3068, 123.3054],
  'roxas city':                 [11.5853, 122.7511],
  'kalibo':                     [11.7081, 122.3644],
  'boracay':                    [11.9674, 121.9248],

  // ═══════════════════ MINDANAO ═══════════════════
  'davao':                      [7.1907, 125.4553],
  'davao city':                 [7.1907, 125.4553],
  'cagayan de oro':             [8.4542, 124.6319],
  'cdo':                        [8.4542, 124.6319],
  'iligan':                     [8.2280, 124.2452],
  'iligan city':                [8.2280, 124.2452],
  'zamboanga':                  [6.9214, 122.0790],
  'zamboanga city':             [6.9214, 122.0790],
  'general santos':             [6.1164, 125.1716],
  'gen san':                    [6.1164, 125.1716],
  'gensan':                     [6.1164, 125.1716],
  'butuan':                     [8.9475, 125.5406],
  'bukidnon':                   [8.0228, 124.9986],
  'malaybalay':                 [8.1575, 125.1278],
  'valencia':                   [7.9064, 125.0942],
  'cotabato city':              [7.2236, 124.2464],
  'cotabato':                   [7.2236, 124.2464],
  'tagum':                      [7.4478, 125.8078],
  'marawi':                     [8.0037, 124.2850],
  'dipolog':                    [8.5833, 123.3333],
  'pagadian':                   [7.8286, 123.4356],
  'koronadal':                  [6.5022, 124.8478],

  // ═══════════════════ GLOBAL CITIES ═══════════════════
  'tokyo':                      [35.6762, 139.6503],
  'osaka':                      [34.6937, 135.5023],
  'kyoto':                      [35.0116, 135.7681],
  'seoul':                      [37.5665, 126.9780],
  'busan':                      [35.1796, 129.0756],
  'singapore':                  [1.3521, 103.8198],
  'beijing':                    [39.9042, 116.4074],
  'shanghai':                   [31.2304, 121.4737],
  'hong kong':                  [22.3193, 114.1694],
  'taipei':                     [25.0330, 121.5654],
  'bangkok':                    [13.7563, 100.5018],
  'kuala lumpur':               [3.1390, 101.6869],
  'jakarta':                    [ -6.2088, 106.8456],
  'hanoi':                      [21.0285, 105.8542],
  'london':                     [51.5074, -0.1278],
  'paris':                      [48.8566, 2.3522],
  'berlin':                     [52.5200, 13.4050],
  'amsterdam':                  [52.3676, 4.9041],
  'new york':                   [40.7128, -74.0060],
  'san francisco':              [37.7749, -122.4194],
  'los angeles':                [34.0522, -118.2437],
  'toronto':                    [43.6532, -79.3832],
  'vancouver':                  [49.2827, -123.1207],
  'sydney':                     [-33.8688, 151.2093],
  'melbourne':                  [-37.8136, 144.9631],
  'mumbai':                     [19.0760, 72.8777],
  'delhi':                      [28.6139, 77.2090],
  'bengaluru':                  [12.9716, 77.5946],
}

export const COUNTRY_CENTERS: Record<string, [number, number]> = {
  'philippines': [12.8797, 121.7740],
  'japan': [36.2048, 138.2529],
  'south korea': [35.9078, 127.7669],
  'china': [35.8617, 104.1954],
  'india': [20.5937, 78.9629],
  'united states': [37.0902, -95.7129],
  'canada': [56.1304, -106.3468],
  'united kingdom': [55.3781, -3.4360],
  'germany': [51.1657, 10.4515],
  'france': [46.2276, 2.2137],
  'australia': [-25.2744, 133.7751],
  'singapore': [1.3521, 103.8198],
  'indonesia': [-0.7893, 113.9213],
  'malaysia': [4.2105, 101.9758],
  'thailand': [15.8700, 100.9925],
  'vietnam': [14.0583, 108.2772],
}

/**
 * Normalizes city/country lookup key.
 */
function normalizeKey(city: string, country?: string): string {
  const c = (city || '').trim().toLowerCase()
  return c
}

/**
 * Synchronous resolver for map initialization and immediate rendering.
 * Checks registry first, then cache, then country center.
 */
export function getCityLatLngSync(city: string, country: string = 'Philippines'): [number, number] {
  const key = normalizeKey(city)
  if (PRECISE_CITY_REGISTRY[key]) {
    return PRECISE_CITY_REGISTRY[key]
  }

  const cached = memoryCache.get(key)
  if (cached) {
    return cached
  }

  // Country fallback
  const countryKey = (country || '').trim().toLowerCase()
  return COUNTRY_CENTERS[countryKey] || [14.5995, 120.9842]
}

/**
 * Asynchronous dynamic geocoder using OpenStreetMap Photon API.
 * High precision, zero cost, CORS enabled, with instant caching.
 */
export async function geocodeCityAsync(city: string, country: string = 'Philippines'): Promise<[number, number]> {
  const key = normalizeKey(city)
  if (PRECISE_CITY_REGISTRY[key]) {
    return PRECISE_CITY_REGISTRY[key]
  }

  const cached = memoryCache.get(key)
  if (cached) {
    return cached
  }

  const query = `${city.trim()}, ${country.trim()}`
  try {
    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=1`
    const res = await fetch(url)
    if (res.ok) {
      const data = await res.json()
      const coords = data?.features?.[0]?.geometry?.coordinates
      if (Array.isArray(coords) && coords.length >= 2) {
        // Photon returns [longitude, latitude]
        const latLng: [number, number] = [coords[1], coords[0]]
        memoryCache.set(key, latLng)
        saveToStorage()
        return latLng
      }
    }
  } catch (err) {
    console.warn('[GeocodingService] Online lookup failed for', query, err)
  }

  return getCityLatLngSync(city, country)
}
