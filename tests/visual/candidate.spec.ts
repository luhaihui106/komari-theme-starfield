import { expect, test } from '@playwright/test'
import { installKomariFixture } from './fixtures/komari'

for (const [name, width, height] of [['desktop', 1440, 1000], ['mobile', 390, 844]] as const) {
  test(`candidate ${name} actual WebGL and city details`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', e => errors.push(e.message))
    await page.setViewportSize({ width, height })
    await installKomariFixture(page, { dark: true, earthRenderer: 'emerald', nodeCount: 19 })
    // Installed ZIP must serve its own NASA texture; no old-preview fallback.
    await page.route('**/api/public/globe-locations', (route) => {
      const cities = [
        { city: 'Los Angeles', countryCode: 'US', lat: 34.0522, lng: -118.2437 },
        { city: 'Hong Kong', countryCode: 'HK', lat: 22.3193, lng: 114.1694 },
        { city: 'Tokyo', countryCode: 'JP', lat: 35.6762, lng: 139.6503 },
        { city: 'Singapore', countryCode: 'SG', lat: 1.3521, lng: 103.8198 },
        { city: 'Frankfurt', countryCode: 'DE', lat: 50.1109, lng: 8.6821 },
        { city: 'London', countryCode: 'GB', lat: 51.5072, lng: -0.1276 },
        { city: 'Taipei', countryCode: 'TW', lat: 25.033, lng: 121.5654 },
        { city: 'Sydney', countryCode: 'AU', lat: -33.8688, lng: 151.2093 },
      ]
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify(Object.fromEntries(Array.from({ length: 19 }, (_, i) => [`00000000-0000-4000-8000-${String(i + 1).padStart(12, '0')}`, cities[i % 8]]))) })
    })
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Komari Visual Lab' })).toBeVisible()
    await expect(page.locator('.earth-canvas')).toBeVisible()
    await page.waitForTimeout(2000)
    await expect(page.locator('html')).toHaveJSProperty('scrollWidth', width)
    const badges = page.locator('.region-badge')
    await expect.poll(() => badges.count()).toBeGreaterThan(0)
    await page.screenshot({ path: `../candidate-${name}.png` })
    const visible = badges.filter({ visible: true }).first()
    await visible.click()
    const panel = page.getByRole('region', { name: '城市实时详情' })
    await expect(panel).toBeVisible()
    const members = panel.locator('.city-detail__members li')
    await expect.poll(() => members.count()).toBeGreaterThan(0)
    await expect(panel.locator('.city-detail__rates')).toContainText('上行')
    await expect(panel.locator('.city-detail__rates')).toContainText('下行')
    const selectedCount = Number((await visible.locator('.region-badge__count').textContent())!.replace('台', ''))
    await expect(members).toHaveCount(selectedCount)
    for (const member of await members.all()) {
      await expect(member.locator('.city-detail__name')).not.toHaveText('')
      await expect(member).toContainText(/在线|离线/)
    }
    await page.screenshot({ path: `../candidate-${name}-selected.png` })
    await page.getByRole('button', { name: '收起城市详情' }).click()
    await expect(panel).toHaveCount(0)
    expect(errors).toEqual([])
  })
}
