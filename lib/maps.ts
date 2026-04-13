// ─────────────────────────────────────────────────────────────────
// maps.ts – Google Maps Geocoding & Haversine-Distanz
//
// Zwei Utilities:
//   geocodeAddress()      → Lat/Lng aus Adresse (Google Geocoding API)
//   calculateDistance()   → Luftlinie in km (Haversine-Formel)
// ─────────────────────────────────────────────────────────────────

export interface GeoCoordinates {
  lat: number
  lng: number
}

// ── Geocoding ────────────────────────────────────────────────────

/**
 * Konvertiert eine Adresse in GPS-Koordinaten via Google Geocoding API.
 *
 * @returns GeoCoordinates oder null wenn die Adresse nicht gefunden wurde
 *          oder der API-Key fehlt.
 */
export async function geocodeAddress(
  street: string,
  city: string,
  postalCode: string,
): Promise<GeoCoordinates | null> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY

  // Edge-Case: kein API-Key konfiguriert
  if (!apiKey) {
    console.warn(
      '[maps] NEXT_PUBLIC_GOOGLE_MAPS_KEY fehlt – Geocoding deaktiviert.',
    )
    return null
  }

  // Adresse zusammensetzen und für URL enkodieren
  const addressRaw = `${street}, ${postalCode} ${city}, Deutschland`
  const address = encodeURIComponent(addressRaw)
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${apiKey}&region=de&language=de`

  let data: GoogleGeocodeResponse

  try {
    const response = await fetch(url, { next: { revalidate: 86400 } }) // 24h Cache
    if (!response.ok) {
      console.error(`[maps] Geocoding HTTP-Fehler: ${response.status}`)
      return null
    }
    data = (await response.json()) as GoogleGeocodeResponse
  } catch (error) {
    console.error('[maps] Geocoding Netzwerkfehler:', error)
    return null
  }

  if (data.status !== 'OK' || !data.results.length) {
    // ZERO_RESULTS ist kein Fehler, einfach keine Koordinaten gefunden
    if (data.status !== 'ZERO_RESULTS') {
      console.warn(`[maps] Geocoding-Status: ${data.status} für "${addressRaw}"`)
    }
    return null
  }

  const { lat, lng } = data.results[0].geometry.location
  return { lat, lng }
}

// ── Haversine-Distanz ────────────────────────────────────────────

/**
 * Berechnet die Luftlinien-Distanz zwischen zwei GPS-Koordinaten in Kilometern.
 * Verwendet die Haversine-Formel (berücksichtigt die Erdkrümmung).
 *
 * @returns Distanz in km, gerundet auf 2 Dezimalstellen
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const EARTH_RADIUS_KM = 6371

  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = EARTH_RADIUS_KM * c

  return Math.round(distance * 100) / 100
}

// ── Interne Helpers ──────────────────────────────────────────────

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180)
}

// ── Google API Typen (minimal) ───────────────────────────────────

interface GoogleGeocodeResponse {
  status: string
  results: Array<{
    geometry: {
      location: {
        lat: number
        lng: number
      }
    }
  }>
}
