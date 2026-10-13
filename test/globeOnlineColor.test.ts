import { expect, it } from 'vitest'
import { markerVisualState } from '@/utils/globeMarkerVisuals'

it('matches the dark-theme online status indicator color', () => {
  expect(markerVisualState(0, 'online').color).toBe(0x18E05F)
  expect(markerVisualState(Math.PI, 'online').color).toBe(0x18E05F)
})
