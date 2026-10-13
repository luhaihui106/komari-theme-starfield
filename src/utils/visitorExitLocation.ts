export interface VisitorExitLocation {
  lat?: number
  lng?: number
  countryCode: string
}

/** An IP database point is only an estimate of the network exit, never the device position. */
export function resolveVisitorExit(location: VisitorExitLocation): [number, number] | null {
  const { lat, lng, countryCode } = location
  if (!countryCode || typeof lat !== 'number' || typeof lng !== 'number'
    || !Number.isFinite(lat) || !Number.isFinite(lng)
    || lat < -90 || lat > 90 || lng < -180 || lng > 180
    || (lat === 0 && lng === 0)) {
    return null
  }
  return [lat, lng]
}
