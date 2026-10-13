import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'

const router = readFileSync(new URL('../src/router/index.ts', import.meta.url), 'utf8')
const vite = readFileSync(new URL('../vite.config.ts', import.meta.url), 'utf8')

it('separates the root history base from the immutable asset namespace', () => {
  expect(router).toContain('createWebHistory(__APP_ROUTER_BASE__)')
  expect(router).not.toContain('createWebHistory(import.meta.env.BASE_URL)')
  expect(vite).toContain('__APP_ROUTER_BASE__: JSON.stringify(\'/\')')
  expect(vite).toContain('base: themeAssetBase')
})
