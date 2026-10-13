import { expect, it } from 'vitest'
import { placeGlobeLabels } from '../src/utils/globeLabelPlacement'

function overlaps(a: { left: number, top: number }, aw: number, ah: number, b: { left: number, top: number }, bw: number, bh: number) {
  return a.left < b.left + bw && a.left + aw > b.left && a.top < b.top + bh && a.top + ah > b.top
}

it('reserves the visitor badge before placing nearby region labels', () => {
  const visitor = { id: 'visitor', x: 190, y: 145, width: 74, height: 24 }
  const region = { id: 'jp', x: 196, y: 151, width: 92, height: 42 }
  const [visitorPlacement, regionPlacement] = placeGlobeLabels([visitor, region], 390, 336)

  expect(visitorPlacement.visible).toBe(true)
  expect(regionPlacement.visible).toBe(true)
  expect(overlaps(visitorPlacement, visitor.width, visitor.height, regionPlacement, region.width, region.height)).toBe(false)
})

it('hides the back-to-top control on narrow screens so it cannot cover card data', async () => {
  const source = await import('node:fs').then(fs => fs.readFileSync(new URL('../src/components/ui/back-top/BackTop.vue', import.meta.url), 'utf8'))
  expect(source).toMatch(/\.back-top\s*\{[\s\S]*?display:\s*none/)
  expect(source).toMatch(/@media \(min-width: 768px\)[\s\S]*?\.back-top\s*\{[\s\S]*?display:\s*flex/)
})
