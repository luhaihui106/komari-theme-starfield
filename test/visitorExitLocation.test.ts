import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'
import { resolveVisitorExit } from '../src/utils/visitorExitLocation'

it('accepts finite IP-reported exit coordinates and rejects missing or invalid values', () => {
  expect(resolveVisitorExit({ lat: 35.68, lng: 139.69, countryCode: 'JP' })).toEqual([35.68, 139.69])
  expect(resolveVisitorExit({ lat: 0, lng: 0, countryCode: 'JP' })).toBeNull()
  expect(resolveVisitorExit({ lat: 95, lng: 139, countryCode: 'JP' })).toBeNull()
  expect(resolveVisitorExit({ lat: 35.68, lng: 139.69, countryCode: '' })).toBeNull()
})

it('connects the same visitor IP response to the globe and labels it as estimated exit', () => {
  const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8')
  expect(read('src/components/VisitorInfo.vue')).toContain('appStore.visitorExitCoord =')
  expect(read('src/components/NodeEarthGlobe.vue')).toContain('appStore.visitorExitCoord')
  expect(read('src/components/NodeEarthEmeraldGlobe.vue')).toContain('您的位置')
})
