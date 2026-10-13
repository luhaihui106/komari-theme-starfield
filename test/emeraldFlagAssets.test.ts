import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'

it('uses the existing runtime flag assets instead of bundling the full flag-icons package', () => {
  const source = readFileSync(new URL('../src/components/NodeEarthEmeraldGlobe.vue', import.meta.url), 'utf8')
  expect(source).not.toContain('import \'flag-icons/css/flag-icons.min.css\'')
  expect(source).toContain('const assetBase = import.meta.env.BASE_URL')
  expect(source).toContain(':src="`$' + '{assetBase}images/flags/$' + '{cluster.code}.svg`"')
})
