import { expect, it } from 'vitest'
import { buildGlobeClusterRates, buildGlobeClusters } from '../src/utils/buildGlobeClusters'

it('distinguishes Tokyo and Osaka badges', () => {
  const nodes = [{ uuid: 't', region: 'JP', online: true }, { uuid: 'o', region: 'JP', online: true }]
  const locations = { t: { lat: 35, lng: 139, city: 'Tokyo', countryCode: 'JP' }, o: { lat: 34, lng: 135, city: 'Osaka', countryCode: 'JP' } }
  expect(buildGlobeClusters(nodes, locations).map(c => c.label)).toEqual(['TYO', 'OSA'])
})

it('sums live rates only for nodes in each city and excludes offline or filtered nodes', () => {
  const nodes = [{ uuid: 'la', region: 'US', online: true, net_out: 100, net_in: 20 }, { uuid: 'sj', region: 'US', online: true, net_out: 7, net_in: 9 }, { uuid: 'off', region: 'US', online: false, net_out: 999, net_in: 999 }]
  const locations = { la: { lat: 34, lng: -118, city: 'Los Angeles', countryCode: 'US' }, sj: { lat: 37, lng: -121, city: 'San Jose', countryCode: 'US' } }
  const clusters = buildGlobeClusters(nodes, locations)
  expect(buildGlobeClusterRates(nodes, locations, clusters).get('us-los-angeles')).toEqual({ up: 100, down: 20 })
  expect(buildGlobeClusterRates(nodes, locations, clusters).get('us-san-jose')).toEqual({ up: 7, down: 9 })
  nodes[0].net_out = 150
  expect(buildGlobeClusterRates(nodes, locations, clusters).get('us-los-angeles')?.up).toBe(150)
})
