import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'

const vite = readFileSync(new URL('../vite.config.ts', import.meta.url), 'utf8')
const workflow = readFileSync(new URL('../.github/workflows/release-on-version-bump.yml', import.meta.url), 'utf8')

it('supports immutable blue-green asset namespaces', () => {
  expect(vite).toContain('const themeAssetBase = process.env.VITE_THEME_ASSET_BASE || `/themes/Starfield/dist-$' + '{getCommitHash()}/`')
  expect(vite).toContain('base: themeAssetBase')
})

it('records the immutable asset base in release provenance', () => {
  expect(workflow).toContain('VITE_THEME_ASSET_BASE="/themes/Starfield/dist-$' + '{short_sha}/"')
  expect(workflow).toContain('asset_base: process.env.VITE_THEME_ASSET_BASE')
})

it('packages the immutable namespace beside the native dist entry', () => {
  expect(vite).toContain('const immutableAssetDir = `dist-$' + '{commitHash}`')
  expect(vite).toContain('const distPrefixPattern = /^dist\\//')
  expect(vite).toContain('appendFile(entry.path, entry.name.replace(distPrefixPattern, `$' + '{immutableAssetDir}/`))')
  expect(vite).toContain('appendFile(entry.path, entry.name)')
})
