import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'
import { buildGlobeClusters } from '../src/utils/buildGlobeClusters'
import { getOSImage } from '../src/utils/osImageHelper'

it('admits default background only after settings and never behind pending custom media', () => {
  const source = readFileSync(new URL('../src/components/Background.vue', import.meta.url), 'utf8')
  const expression = source.split('const showDefaultBackground = computed(() =>\n')[1]!.split(',\n)')[0]!
  // Evaluate only the local checked-in predicate; never external input.
  // eslint-disable-next-line no-new-func
  const evaluate = new Function('appStore', 'hasCustomBackground', 'showMediaBackground', 'hasError', `return (${expression})`)
  const visible = (settings: unknown, custom: boolean, media: boolean, error: boolean) => evaluate({ publicSettings: settings }, { value: custom }, { value: media }, { value: error })
  expect(visible(undefined, false, false, false)).toBe(false)
  expect(visible(null, false, false, false)).toBe(false)
  expect(visible({}, true, false, false)).toBe(false)
  expect(visible({}, true, true, false)).toBe(false)
  expect(visible({}, false, false, false)).toBe(true)
  expect(visible({}, true, false, true)).toBe(true)
})

it('keeps Champaign membership and coordinates while showing CMI', () => {
  expect(buildGlobeClusters([{ uuid: 'synthetic', region: 'US', online: true }], { synthetic: { lat: 40.1164, lng: -88.2434, city: 'Champaign', countryCode: 'US' } })).toEqual([{ id: 'us-champaign', code: 'US', coord: [40.1164, -88.2434], label: 'CMI', servers: 1, onlineServers: 1 }])
})

it('uses distinct reviewed local distribution marks and honest unknown fallback', () => {
  const icons = ['Debian', 'Ubuntu', 'Alpine Linux'].map(getOSImage)
  expect(new Set(icons).size).toBe(3)
  expect(getOSImage('unknown-system')).toContain('generic-system.svg')
  for (const icon of icons) {
    const file = icon.slice(icon.indexOf('images/'))
    expect(readFileSync(new URL(`../public/${file}`, import.meta.url), 'utf8')).toContain('<path')
  }
})
