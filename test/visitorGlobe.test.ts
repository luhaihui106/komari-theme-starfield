import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

it('shares visitor country from TS visitor fetch with Emerald renderer', () => {
  const visitor = read('src/components/VisitorInfo.vue')
  const wrapper = read('src/components/NodeEarthGlobe.vue')
  const app = read('src/stores/app.ts')
  expect(visitor).toContain('appStore.visitorCountryCode =')
  expect(app).toContain('const visitorCountryCode = ref<string | null>(null)')
  expect(wrapper).toContain('appStore.visitorCountryCode')
})
