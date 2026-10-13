import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'

it('uses the existing runtime flag assets instead of bundling the full flag-icons package', () => {
  const source = readFileSync(new URL('../src/components/NodeEarthEmeraldGlobe.vue', import.meta.url), 'utf8')
  expect(source).not.toContain('import \'flag-icons/css/flag-icons.min.css\'')
  expect(source).toContain(':src="`/images/flags/$' + '{cluster.code}.svg`"')
})
