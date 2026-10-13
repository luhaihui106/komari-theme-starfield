import { expect, it } from 'vitest'
import { placeGlobeLabels } from '../src/utils/globeLabelPlacement'

it('keeps the anchor at the projected marker when a crowded label moves', () => {
  const labels = [
    { id: 'one', x: 185, y: 135, width: 115, height: 44 },
    { id: 'two', x: 202, y: 138, width: 115, height: 44 },
  ]
  const placements = placeGlobeLabels(labels, 400, 300)
  for (const [index, placement] of placements.entries()) {
    expect(placement.visible).toBe(true)
    expect(placement.left + placement.anchorOffset).toBeCloseTo(labels[index]!.x)
    expect(placement.top + placement.anchorTop).toBeCloseTo(labels[index]!.y)
    expect(placement.leaderLength).toBeGreaterThan(0)
    expect(placement.leaderLength).toBeLessThanOrEqual(65)
  }
})

it('does not invent a remote label for a crowded marker', () => {
  const labels = Array.from({ length: 8 }, (_, i) => ({ id: String(i), x: 110, y: 110, width: 95, height: 44 }))
  const result = placeGlobeLabels(labels, 220, 220)
  expect(result.some(label => !label.visible)).toBe(true)
  expect(result.filter(label => label.visible).every(label => label.leaderLength <= 65)).toBe(true)
})
