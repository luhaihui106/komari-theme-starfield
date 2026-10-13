import { expect, it } from 'vitest'
import { placeGlobeLabels } from '../src/utils/globeLabelPlacement'

it('keeps nearby city labels visible without intersection and keeps stems at anchors', () => {
  const labels = [
    { id: 'a', x: 180, y: 150, width: 110, height: 42 },
    { id: 'b', x: 197, y: 154, width: 110, height: 42 },
  ]
  const result = placeGlobeLabels(labels, 380, 300)
  expect(result).toHaveLength(2)
  expect(result.every(label => label.visible)).toBe(true)
  const [a, b] = result
  const overlap = a.left < b.left + 110 && a.left + 110 > b.left && a.top < b.top + 42 && a.top + 42 > b.top
  expect(overlap).toBe(false)
  expect(a.left + a.anchorOffset).toBeCloseTo(180)
  expect(b.left + b.anchorOffset).toBeCloseTo(197)
})

it('prefers an on-screen placement rather than clipping an edge label', () => {
  const [label] = placeGlobeLabels([{ id: 'edge', x: 15, y: 75, width: 100, height: 40 }], 220, 180)
  expect(label.visible).toBe(true)
  expect(label.left).toBeGreaterThanOrEqual(0)
  expect(label.left + 100).toBeLessThanOrEqual(220)
})
