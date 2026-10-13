import { existsSync, readFileSync } from 'node:fs'
import { expect, it } from 'vitest'

const root = new URL('../', import.meta.url)
const read = (path: string) => readFileSync(new URL(path, root), 'utf8')

it('exposes the Emerald renderer without replacing the existing renderers', () => {
  const wrapper = read('src/components/NodeEarthGlobe.vue')
  const app = read('src/stores/app.ts')

  expect(wrapper).toContain('NodeEarthEmeraldGlobe')
  expect(wrapper).toContain('emerald: NodeEarthEmeraldGlobe')
  expect(wrapper).toContain('realistic: NodeEarthRealisticGlobe')
  expect(wrapper).toContain('cobe: NodeEarthCobeGlobe')
  expect(wrapper).toContain('tiled: NodeEarthTiledMap')
  expect(app).toMatch(/'emerald'/)
})

it('keeps the globe and summary cards in the same homepage flow', () => {
  const home = read('src/views/HomeView.vue')
  const cards = read('src/components/NodeGeneralCards.vue')

  expect(home).toContain('<NodeGeneralCards')
  expect(cards).toContain('<NodeEarthGlobe')
  expect(cards).toContain(':rate-nodes="summaryNodes"')
  expect(home.includes('地图模式') && home.includes('卡片模式')).toBe(false)
})

it('ships the accepted Emerald texture and boundary resources', () => {
  expect(existsSync(new URL('../public/assets/earth/earth-blue-marble.webp', import.meta.url))).toBe(true)
  expect(existsSync(new URL('../public/assets/earth/country-boundaries-v1.json', import.meta.url))).toBe(true)
})
