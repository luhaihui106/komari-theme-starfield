import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'
import { buildGlobeClusters } from '../src/utils/buildGlobeClusters'

it('uses published node exit coordinates without exposing IP and groups same city', () => {
  const nodes = [
    { uuid: 'a', region: '🇺🇸', online: true },
    { uuid: 'b', region: '🇺🇸', online: false },
    { uuid: 'c', region: '🇩🇪', online: true },
  ]
  const locations = {
    a: { lat: 34.05, lng: -118.24, city: 'Los Angeles', countryCode: 'US' },
    b: { lat: 34.05, lng: -118.24, city: 'Los Angeles', countryCode: 'US' },
  }
  const result = buildGlobeClusters(nodes, locations)
  expect(result).toEqual([
    { id: 'us-los-angeles', code: 'US', coord: [34.05, -118.24], label: 'LAX', servers: 2, onlineServers: 1 },
    { id: 'de', code: 'DE', coord: expect.any(Array), label: expect.any(String), servers: 1, onlineServers: 1 },
  ])
})

it('maps Rancho Cucamonga into the LAX display metro without creating a US badge', () => {
  const result = buildGlobeClusters(
    [
      { uuid: 'la', region: '🇺🇸', online: true },
      { uuid: 'rancho', region: '🇺🇸', online: true },
    ],
    {
      la: { lat: 34.05, lng: -118.24, city: 'Los Angeles', countryCode: 'US' },
      rancho: { lat: 34.12, lng: -117.57, city: 'Rancho Cucamonga', countryCode: 'US' },
    },
  )
  expect(result).toEqual([
    { id: 'us-los-angeles', code: 'US', coord: [34.05, -118.24], label: 'LAX', servers: 2, onlineServers: 2 },
  ])
})

it('identifies every currently published city rather than collapsing it to a country', () => {
  const cities = [
    ['Los Angeles', 'US', 'LAX'],
    ['Chuncheon', 'KR', 'CWN'],
    ['Frankfurt am Main', 'DE', 'FRA'],
    ['San Jose', 'US', 'SJC'],
  ] as const
  for (const [city, countryCode, label] of cities) {
    const [cluster] = buildGlobeClusters(
      [{ uuid: city, region: countryCode, online: true }],
      { [city]: { lat: 30, lng: 50, city, countryCode } },
    )
    expect(cluster?.label).toBe(label)
  }
})

it('keeps the badge compact while retaining node count and upload/download rates', () => {
  const globe = readFileSync(new URL('../src/components/NodeEarthEmeraldGlobe.vue', import.meta.url), 'utf8')
  expect(globe).toContain('region-badge__rates')
  expect(globe).toContain('{{ cluster.servers }}台')
  expect(globe).toMatch(/\.region-badge\s*\{[^}]*min-width:\s*0/)
  expect(globe).toMatch(/\.region-badge__country\s*\{[^}]*max-width:\s*34px/)
})
