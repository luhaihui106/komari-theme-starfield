import { describe, expect, it } from 'vitest'
import { closestEquivalentAngle } from '@/utils/angleHelper'

describe('closestEquivalentAngle', () => {
  it('returns the equivalent target within half a turn of the current accumulated rotation', () => {
    const current = Math.PI * 12 + 0.4
    const target = -2.7
    const result = closestEquivalentAngle(current, target)

    expect(Math.abs(result - current)).toBeLessThanOrEqual(Math.PI)
    expect(Math.atan2(Math.sin(result), Math.cos(result))).toBeCloseTo(Math.atan2(Math.sin(target), Math.cos(target)), 10)
  })
})
