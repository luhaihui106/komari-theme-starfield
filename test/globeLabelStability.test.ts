import { expect, it } from 'vitest'
import { createGlobeLabelLayout } from '../src/utils/globeLabelPlacement'

const dense = Array.from({ length: 8 }, (_, i) => ({ id: String(i), x: 150 + i * 2, y: 150 + i, width: 65, height: 22 }))
it('retains slots across input reordering and repeated data refreshes', () => {
  const layout = createGlobeLabelLayout()
  const first = layout(dense, 320, 320)
  expect(first.every(p => p.visible)).toBe(true)
  for (let i = 0; i < 100; i++) expect(layout([...dense].reverse(), 320, 320)).toEqual([...first].reverse())
})
it('follows projection continuously instead of snapping back to a preferred slot', () => {
  const layout = createGlobeLabelLayout()
  const first = layout(dense, 320, 320)
  const next = layout(dense.map(l => ({ ...l, x: l.x + 0.2, y: l.y + 0.1 })), 320, 320)
  next.forEach((p, i) => {
    expect(p.left - first[i].left).toBeCloseTo(0.2)
    expect(p.top - first[i].top).toBeCloseTo(0.1)
  })
})
it('keeps a dense cluster on screen without overlap and bounds frame cost', () => {
  const layout = createGlobeLabelLayout()
  const start = performance.now()
  let placed = layout(dense, 320, 320)
  for (let frame = 0; frame < 2000; frame++) placed = layout(dense, 320, 320)
  expect(performance.now() - start).toBeLessThan(500)
  for (const p of placed) {
    expect(p.visible).toBe(true)
    expect(p.left).toBeGreaterThanOrEqual(0)
    expect(p.top).toBeGreaterThanOrEqual(0)
    expect(p.left + 65).toBeLessThanOrEqual(320)
    expect(p.top + 22).toBeLessThanOrEqual(320)
  }
  for (let i = 0; i < placed.length; i++) {
    for (let j = i + 1; j < placed.length; j++)expect(placed[i].left < placed[j].left + 65 && placed[i].left + 65 > placed[j].left && placed[i].top < placed[j].top + 22 && placed[i].top + 22 > placed[j].top).toBe(false)
  }
})
