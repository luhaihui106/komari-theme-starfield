import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'

const root = new URL('../', import.meta.url)
const manifest = JSON.parse(readFileSync(new URL('komari-theme.json', root), 'utf8')) as { short: string }
const settingsService = readFileSync(new URL('src/services/theme-settings.service.ts', root), 'utf8')
const viteConfig = readFileSync(new URL('vite.config.ts', root), 'utf8')

it('uses the manifest short name for theme settings writes', () => {
  expect(manifest.short).toBe('GlassEmerald')
  expect(settingsService).toContain('const THEME_SHORT_NAME = \'GlassEmerald\'')
  expect(settingsService).not.toContain('GlassmorphismTS')
})

it('brands generated release archives as GlassEmerald', () => {
  expect(viteConfig).toContain('komari-theme-GlassEmerald-build-$' + '{commitHash}.zip')
  expect(viteConfig).not.toContain('komari-theme-Glassmorphism-build-$' + '{commitHash}.zip')
})
