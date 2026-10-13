import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'

it('loads historical ping metrics whenever ping bars are enabled', () => {
  const source = readFileSync(new URL('../src/components/NodeCard.vue', import.meta.url), 'utf8')
  expect(source).toContain('enabled: () => props.pingEnabled')
  expect(source).not.toContain('enabled: () => props.pingEnabled && appStore.threeNetPingSparkline')
})
