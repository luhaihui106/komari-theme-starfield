import { describe, expect, it } from 'vitest'
import { markerVisualState } from '@/utils/globeMarkerVisuals'

describe('markerVisualState', () => {
  it('keeps online nodes emerald and makes the breathing pulse clearly visible', () => {
    const low = markerVisualState(-Math.PI / 2, 'online')
    const high = markerVisualState(Math.PI / 2, 'online')

    expect(low.color).toBe(0x18E05F)
    expect(high.color).toBe(0x18E05F)
    expect(high.scale - low.scale).toBeGreaterThan(0.05)
    expect(low.opacity).toBeGreaterThanOrEqual(0.68)
    expect(high.opacity).toBe(1)
  })

  it('alternates discretely between online green and offline red for any region with offline nodes', () => {
    const green = markerVisualState(Math.PI / 2, 'mixed')
    const red = markerVisualState(3 * Math.PI, 'mixed')
    expect(green.color).toBe(0x18E05F)
    expect(red.color).toBe(0xFF6467)
    expect([green.color, red.color]).not.toContain(0xF59E0B)
  })

  it('keeps fully offline regions red throughout the breathing cycle', () => {
    expect(markerVisualState(0, 'offline').color).toBe(0xFF6467)
    expect(markerVisualState(Math.PI, 'offline').color).toBe(0xFF6467)
  })
})
