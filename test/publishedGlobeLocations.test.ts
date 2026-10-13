import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'

it('loads published server exit coordinates separately from client metadata', () => {
  const source = readFileSync(new URL('../src/composables/usePublishedGlobeLocations.ts', import.meta.url), 'utf8')
  expect(source).toContain('/api/public/globe-locations')
  expect(source).toContain('buildGlobeClusters')
  expect(source).not.toContain('node.ipv4')
})
