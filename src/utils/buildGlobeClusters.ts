import { getCoordByCode, getCountryCodeFromRegion } from '@/utils/geoHelper'

const COMMON_CITY_CODES: Record<string, string> = {
  'GB:london': 'LON',
  'DE:frankfurt': 'FRA',
  'DE:frankfurt am main': 'FRA',
  'HK:hong kong': 'HKG',
  'JP:tokyo': 'TYO',
  'JP:osaka': 'OSA',
  'KR:chuncheon': 'CWN',
  'US:los angeles': 'LAX',
  'US:champaign': 'CMI',
  'US:san jose': 'SJC',
}

const METRO_ALIASES: Record<string, { city: string, label: string, coord: [number, number] }> = {
  'US:rancho cucamonga': { city: 'Los Angeles', label: 'LAX', coord: [34.0522, -118.2437] },
}

const COUNTRY_CODE_REGEX = /^[A-Z]{2}$/
const CITY_SLUG_SEPARATOR_REGEX = /[^a-z0-9]+/g
const CITY_SLUG_EDGE_REGEX = /^-+|-+$/g

export interface ServerExitLocation {
  lat: number
  lng: number
  city: string
  countryCode: string
}
export interface GlobeCluster {
  id: string
  code: string
  coord: [number, number]
  label: string
  servers: number
  onlineServers: number
}
export function buildGlobeClusters<T extends { uuid: string, region: string, online: boolean }>(
  nodes: T[],
  locations: Record<string, ServerExitLocation>,
): GlobeCluster[] {
  const clusters = new Map<string, GlobeCluster>()
  for (const node of nodes) {
    const fallbackCode = getCountryCodeFromRegion(node.region)
    const geo = locations[node.uuid]
    const valid = geo && Number.isFinite(geo.lat) && Number.isFinite(geo.lng)
      && geo.lat >= -90 && geo.lat <= 90 && geo.lng >= -180 && geo.lng <= 180
      && !(geo.lat === 0 && geo.lng === 0)
    const code = valid ? geo.countryCode.toUpperCase() : fallbackCode
    if (!code || !COUNTRY_CODE_REGEX.test(code))
      continue
    const fallbackCoord = getCoordByCode(code)
    const coord: [number, number] | null = valid ? [geo.lat, geo.lng] : fallbackCoord
    if (!coord)
      continue
    const originalCity = valid ? geo.city.trim() : ''
    const metro = valid ? METRO_ALIASES[`${code}:${originalCity.toLowerCase()}`] : undefined
    const city = metro?.city ?? originalCity
    const displayCoord: [number, number] = metro?.coord ?? coord
    const slug = (city || `${displayCoord[0].toFixed(2)},${displayCoord[1].toFixed(2)}`).toLowerCase().replace(CITY_SLUG_SEPARATOR_REGEX, '-').replace(CITY_SLUG_EDGE_REGEX, '')
    const id = valid ? `${code.toLowerCase()}-${slug || 'city'}` : code.toLowerCase()
    const label = valid ? (metro?.label || COMMON_CITY_CODES[`${code}:${city.toLowerCase()}`] || code) : code
    const cluster = clusters.get(id) ?? { id, code, coord: displayCoord, label, servers: 0, onlineServers: 0 }
    cluster.servers += 1
    if (node.online)
      cluster.onlineServers += 1
    clusters.set(id, cluster)
  }
  return [...clusters.values()].sort((a, b) => b.servers - a.servers)
}

export function buildGlobeClusterRates<T extends { uuid: string, region: string, online: boolean, net_in: number, net_out: number }>(nodes: T[], locations: Record<string, ServerExitLocation>, visibleClusters: GlobeCluster[]) {
  const visibleIds = new Set(visibleClusters.map(cluster => cluster.id))
  const rates = new Map<string, { up: number, down: number }>()
  for (const node of nodes) {
    if (!node.online)
      continue
    const cluster = buildGlobeClusters([node], locations)[0]
    if (!cluster || !visibleIds.has(cluster.id))
      continue
    const rate = rates.get(cluster.id) ?? { up: 0, down: 0 }
    rate.up += Number.isFinite(node.net_out) ? Math.max(0, node.net_out) : 0
    rate.down += Number.isFinite(node.net_in) ? Math.max(0, node.net_in) : 0
    rates.set(cluster.id, rate)
  }
  return rates
}
