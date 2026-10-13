import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'
import { buildGlobeClusters } from '../src/utils/buildGlobeClusters'

it('names country-region summary without changing its selector or persisted key', () => {
  const source = readFileSync(new URL('../src/components/NodeGeneralCards.vue', import.meta.url), 'utf8')
  expect(source).toContain('label: \'国家／地区\'')
  expect(source).toContain('key: \'regionDistribution\'')
  expect(source).toContain('getKnownDistribution(summaryNodes.value, node => getRegionDisplayName(node.region))')
  expect(readFileSync(new URL('../src/stores/app.ts', import.meta.url), 'utf8')).toContain('地区分布: \'regionDistribution\'')
})

it('labels London LON without changing its cluster identity', () => {
  const clusters = buildGlobeClusters([{ uuid: 'london', region: 'GB', online: true }], { london: { lat: 51.5074, lng: -0.1278, city: 'London', countryCode: 'GB' } })
  expect(clusters).toEqual([{ id: 'gb-london', code: 'GB', coord: [51.5074, -0.1278], label: 'LON', servers: 1, onlineServers: 1 }])
})

it('labels Hong Kong HKG without changing cluster identity', () => {
  const clusters = buildGlobeClusters([{ uuid: 'hk', region: 'HK', online: true }], { hk: { lat: 22.3, lng: 114.2, city: 'Hong Kong', countryCode: 'HK' } })
  expect(clusters).toEqual([{ id: 'hk-hong-kong', code: 'HK', coord: [22.3, 114.2], label: 'HKG', servers: 1, onlineServers: 1 }])
})
