export interface SubsolarPoint {
  latitude: number
  longitude: number
}

const DEG_TO_RAD = Math.PI / 180
const RAD_TO_DEG = 180 / Math.PI

function normalizeLongitude(degrees: number): number {
  return ((degrees % 360) + 540) % 360 - 180
}

/**
 * Returns the geographic point where the Sun is directly overhead.
 * The low-cost solar ephemeris is accurate to well below the visual
 * resolution of the globe and is suitable for real-time illumination.
 */
export function getSubsolarPoint(date = new Date()): SubsolarPoint {
  const julianDate = date.getTime() / 86_400_000 + 2_440_587.5
  const daysSinceJ2000 = julianDate - 2_451_545.0
  const meanLongitude = (280.460 + 0.9856474 * daysSinceJ2000) * DEG_TO_RAD
  const meanAnomaly = (357.528 + 0.9856003 * daysSinceJ2000) * DEG_TO_RAD
  const eclipticLongitude = meanLongitude
    + 1.915 * DEG_TO_RAD * Math.sin(meanAnomaly)
    + 0.020 * DEG_TO_RAD * Math.sin(2 * meanAnomaly)
  const obliquity = (23.439 - 0.0000004 * daysSinceJ2000) * DEG_TO_RAD

  const rightAscension = Math.atan2(
    Math.cos(obliquity) * Math.sin(eclipticLongitude),
    Math.cos(eclipticLongitude),
  )
  const declination = Math.asin(Math.sin(obliquity) * Math.sin(eclipticLongitude))
  const greenwichSiderealTime = 280.46061837 + 360.98564736629 * daysSinceJ2000

  return {
    latitude: declination * RAD_TO_DEG,
    longitude: normalizeLongitude(rightAscension * RAD_TO_DEG - greenwichSiderealTime),
  }
}

export function getSunDirection(date = new Date()): [number, number, number] {
  const { latitude, longitude } = getSubsolarPoint(date)
  const latitudeRadians = latitude * DEG_TO_RAD
  const longitudeRadians = longitude * DEG_TO_RAD
  const cosLatitude = Math.cos(latitudeRadians)

  return [
    cosLatitude * Math.cos(longitudeRadians),
    Math.sin(latitudeRadians),
    -cosLatitude * Math.sin(longitudeRadians),
  ]
}
