import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'

it('uses published server exit city clusters for Emerald markers and keeps country fallback', () => {
  const globe = readFileSync(new URL('../src/components/NodeEarthEmeraldGlobe.vue', import.meta.url), 'utf8')
  expect(globe).toContain('usePublishedGlobeLocations(() => props.nodes)')
  expect(globe).toContain('cluster.label')
  expect(globe).toContain('cluster.id')
  expect(globe).toContain('c.coord[0]')
  expect(globe).toContain('serverCountryCodes')
  const shared = readFileSync(new URL('../src/composables/useNodeGeoClusters.ts', import.meta.url), 'utf8')
  expect(shared).toContain('getCoordByCode(countryCode)')
  expect(shared).toContain('lookupIpGeo(ip)')
})
