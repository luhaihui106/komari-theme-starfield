import process from 'node:process'
import { expect, test } from '@playwright/test'

test('compatibility worker uses bundled namespace; root preview redirects bare admin', async ({ page }) => {
  const assetBase = process.env.INSTALLED_ASSET_BASE || '/'
  await page.goto(assetBase, { waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null)
  const script = await page.evaluate(() => navigator.serviceWorker.controller!.scriptURL)
  expect(new URL(script).pathname).toBe(`${assetBase}sw.js`)
  if (assetBase === '/') {
    await page.goto('/admin', { waitUntil: 'domcontentloaded' })
    await expect(page).toHaveURL(/\/admin\/dashboard$/)
  }
  else {
    // A theme worker must not claim backend /admin or require a root alias.
    const scope = await page.evaluate(async () => (await navigator.serviceWorker.getRegistration())!.scope)
    expect(new URL(scope).pathname).toBe(assetBase)
  }
  await expect.poll(async () => page.evaluate(async () =>
    (await caches.keys()).filter(name => /workbox|precache|komari/i.test(name)),
  )).toEqual([])
})
