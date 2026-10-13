import { expect, test } from '@playwright/test'
import { installKomariFixture } from './fixtures/komari'

test('tiled map loads every bundled texture and flag in the installed asset namespace', async ({ page }) => {
  await installKomariFixture(page, { earthRenderer: 'tiled' })
  await page.goto('/')
  await expect(page.locator('.earth-map')).toBeVisible()
  const urls = await page.locator('.earth-map image, .legend-flag').evaluateAll(elements => elements.map(e => e.getAttribute('href') || e.getAttribute('src')).filter(Boolean))
  expect(urls.length).toBeGreaterThan(3)
  for (const url of urls) {
    const response = await page.request.get(url!)
    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toMatch(/image\//)
  }
})
