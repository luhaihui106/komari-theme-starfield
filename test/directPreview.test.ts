import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8')

it('previews the Emerald renderer at the direct candidate URL without changing live settings', () => {
  const app = read('src/stores/app.ts')
  expect(app).toContain('window.location.pathname === \'/themes/GlassEmerald/dist/index.html\'')
  expect(app).toMatch(/if \(window\.location\.pathname === '\/themes\/GlassEmerald\/dist\/index\.html'\)\s*return 'emerald'/)
})

it('renders home when opening the candidate theme index directly', () => {
  const router = readFileSync(new URL('../src/router/index.ts', import.meta.url), 'utf8')
  expect(router).toMatch(/path: '\/index\.html',[\s\S]*?component: \(\) => import\('@\/views\/HomeView\.vue'\)/)
})
