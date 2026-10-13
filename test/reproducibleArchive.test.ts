import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'

const viteConfig = readFileSync(new URL('../vite.config.ts', import.meta.url), 'utf8')
const releaseWorkflow = readFileSync(new URL('../.github/workflows/release-on-version-bump.yml', import.meta.url), 'utf8')

it('normalizes release archive ordering, timestamps, and permissions', () => {
  expect(viteConfig).toContain('readdirSync(root).sort')
  expect(viteConfig).toContain('date: sourceDate')
  expect(viteConfig).toContain('mode: 0o644')
  expect(viteConfig).toContain('git show -s --format=%ct HEAD')
})

it('verifies byte-for-byte reproducibility and publishes provenance', () => {
  expect(releaseWorkflow).toContain('cmp "$' + '{archive}.first" "$archive"')
  expect(releaseWorkflow).toContain('SHA256SUMS')
  expect(releaseWorkflow).toContain('release-provenance.json')
})
