import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'

it('uses smooth NASA ocean color gradation and softened land without procedural grain', () => {
  const source = readFileSync(new URL('../src/components/NodeEarthEmeraldGlobe.vue', import.meta.url), 'utf8')
  expect(source).toContain('vec3 amapOcean = mix(gradedTexture, vec3(0.003, 0.22, 0.64), 0.10);')
  expect(source).toContain('vec3(1.06, 1.09, 0.94)')
  expect(source).toContain('amapLand = amapLand / (vec3(1.0) + max(amapLand - vec3(0.55), vec3(0.0)) * 0.16);')
  expect(source).toContain('mix(2.55 * pow(max(oceanLuma, 0.025), -0.12), 1.0, smoothstep(0.35, 0.75, oceanLuma))')
  expect(source).toContain('vec3 dayOcean = amapOcean * vec3(1.0, 1.65, 1.05) * oceanMidtoneLift;')
  expect(source).toContain('vec3 amapDaySurface = mix(amapLand, dayOcean, oceanMask);')
  expect(source).toContain('vec3 nightOcean = amapOcean * 0.24;')
  for (const forbidden of ['oceanNoise', 'oceanHash', 'seaGrain', 'microNormal', 'microLight', 'detailMask', 'seaPoint'])
    expect(source).not.toContain(forbidden)
})
