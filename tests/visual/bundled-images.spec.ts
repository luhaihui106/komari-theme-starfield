import { expect, test } from '@playwright/test'
import { installKomariFixture } from './fixtures/komari'

for (const renderer of ['emerald', 'cobe', 'tiled', 'realistic'] as const) {
  test(`${renderer} bundled flags and OS identifiers decode without root aliases`, async ({ page }) => {
    await installKomariFixture(page, { earthRenderer: renderer })
    await page.goto('/')
    await expect(page.getByRole('button', { name: /^查看节点 .* 详情$/ }).first()).toBeVisible()
    await page.waitForTimeout(2500)
    const images = page.locator('img[src*="/images/"]')
    expect(await images.count()).toBeGreaterThan(10)
    for (const image of await images.all()) {
      const url = await image.getAttribute('src')
      const response = await page.request.get(url!)
      expect(response.status()).toBe(200)
      expect(response.headers()['content-type']).toMatch(/image\//)
      await expect.poll(() => image.evaluate(e => (e as HTMLImageElement).naturalWidth)).toBeGreaterThan(0)
    }
    await page.getByRole('button', { name: /^查看节点 .* 详情$/ }).first().click()
    await expect(page.locator('img[src*="/images/flags/"]').first()).toBeVisible()
    for (const image of await page.locator('img[src*="/images/"]').all())
      await expect.poll(() => image.evaluate(e => (e as HTMLImageElement).naturalWidth)).toBeGreaterThan(0)
  })
}
