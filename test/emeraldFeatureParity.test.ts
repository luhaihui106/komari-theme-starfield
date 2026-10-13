import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'

const globe = readFileSync(new URL('../src/components/NodeEarthEmeraldGlobe.vue', import.meta.url), 'utf8')

it('keeps Emerald globe large enough on desktop and mobile without shrinking its canvas', () => {
  expect(globe).toContain('max-w-[20rem] sm:max-w-[23rem] md:max-w-[24rem] xl:max-w-[32rem]')
  expect(globe).toContain('camera.position.z = width < 640 ? 3.65 : 2.32')
  expect(globe).toContain('earthGroup.scale.setScalar(1)')
})

it('preserves Emerald globe physics and solar presentation', () => {
  expect(globe).toContain('EARTH_AXIAL_TILT_DEG = 23.439')
  expect(globe).toContain('getSunDirection')
  expect(globe).toContain('SOLAR_UPDATE_INTERVAL_MS')
  expect(globe).toContain('INITIAL_VIEW_PITCH = 0.42')
})

it('preserves Emerald interaction and return behavior', () => {
  expect(globe).toContain('RETURN_DELAY_MS = 1200')
  expect(globe).toContain('AUTO_ROTATION_SPEED = 0.00022')
  expect(globe).toContain('appStore.stopEarth')
  expect(globe).toContain('setPointerCapture')
  expect(globe).toContain('closestEquivalentAngle(targetRotationY, defaultRotationY)')
  expect(globe).toContain('glass-emerald-globe-position-v1')
  expect(globe).toContain('persistGlobePosition()')
  expect(globe).toContain('恢复地球默认视角')
})

it('preserves boundaries, low arcs, packets, markers and performance guards', () => {
  expect(globe).toContain('country-boundaries-v1.json')
  expect(globe).toContain('MAX_ARC_ALTITUDE = 0.16')
  expect(globe).toContain('networkArcs')
  expect(globe).toContain('signalRipples')
  expect(globe).toContain('GLOBE_FPS = computed(() => (containerWidth.value >= 384 ? 45 : 30))')
  expect(globe).toContain('fpsLimit: GLOBE_FPS')
  expect(globe).toContain('surfaceColor.b *= mix(1.0, 0.90, oceanMask)')
  expect(globe).toContain('Math.min(window.devicePixelRatio || 1, 1.5)')
  expect(globe).toContain('useElementVisibility')
})

it('preserves labels, real flags, live rates and visitor marker', () => {
  expect(globe).toContain('new Intl.DisplayNames([\'zh-CN\']')
  expect(globe).toContain('const assetBase = import.meta.env.BASE_URL')
  expect(globe).toContain(':src="`$' + '{assetBase}images/flags/$' + '{cluster.code}.svg`"')
  expect(globe).toContain('props.rateNodes ?? displayNodes.value')
  expect(globe).toContain('您的位置')
  expect(globe).toContain('visitorBeacon')
})
