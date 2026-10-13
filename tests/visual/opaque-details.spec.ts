import { expect, test } from '@playwright/test'
import { installKomariFixture } from './fixtures/komari'

for (const [device, width, height] of [['desktop', 1440, 1000], ['mobile', 390, 844]] as const) {
  for (const dark of [false, true]) {
    test(`opaque details ${device} ${dark ? 'dark' : 'light'}`, async ({ page }) => {
      const errors: string[] = []
      page.on('pageerror', e => errors.push(e.message))
      await page.setViewportSize({ width, height })
      await installKomariFixture(page, { dark, earthRenderer: 'emerald', nodeCount: 19 })
      await page.route('**/api/public/globe-locations', route => route.fulfill({ contentType: 'application/json', body: JSON.stringify(Object.fromEntries(Array.from({ length: 19 }, (_, i) => [`00000000-0000-4000-8000-${String(i + 1).padStart(12, '0')}`, i === 18 ? { city: 'San Jose', countryCode: 'US', lat: 37.3382, lng: -121.8863 } : { city: 'Los Angeles', countryCode: 'US', lat: 34.0522, lng: -118.2437 }]))) }))
      await page.goto('/')
      await expect(page.locator('.earth-canvas')).toBeVisible()
      await page.waitForTimeout(1500)
      const lax = page.locator('.region-badge').filter({ hasText: 'LAX' })
      const sjc = page.locator('.region-badge').filter({ hasText: 'SJC' })
      await lax.click()
      const panel = page.getByRole('region', { name: '城市实时详情' })
      await expect(panel).toBeVisible()
      await expect(panel.locator('li')).toHaveCount(18)
      await expect(panel).toContainText('上行')
      await expect(panel).toContainText('下行')
      await expect(panel).toContainText('离线')
      await expect(panel).toContainText('在线')
      const style = await panel.evaluate(e => ({ bg: getComputedStyle(e).backgroundColor, fg: getComputedStyle(e).color, opacity: getComputedStyle(e).opacity, filter: getComputedStyle(e).filter }))
      expect(style.bg).toBe(dark ? 'rgb(7, 20, 38)' : 'rgb(255, 255, 255)')
      expect(style.opacity).toBe('1')
      expect(style.filter).toBe('none')
      await page.screenshot({ path: `../evidence/candidate-${device}-${dark ? 'dark' : 'light'}.png` })
      // Pixel-level occlusion proof: changing high-contrast digits immediately behind
      // the actual teleported panel must not alter a single panel pixel.
      await panel.evaluate((e) => {
        const r = e.getBoundingClientRect()
        const probe = document.createElement('div')
        probe.id = 'occlusion-probe'
        probe.textContent = '999999999999999999999999999999999999999999999999999999'
        Object.assign(probe.style, { position: 'fixed', left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px`, zIndex: '49', background: '#ff00ff', color: '#000', fontSize: '48px' })
        document.body.append(probe)
      })
      const clip = (await panel.boundingBox())!
      const interior = { x: Math.ceil(clip.x + 16), y: Math.ceil(clip.y + 16), width: Math.floor(clip.width - 32), height: Math.floor(clip.height - 32) }
      const a = await page.screenshot({ clip: interior })
      await page.locator('#occlusion-probe').evaluate((e) => {
        e.style.background = '#00ffff'
        e.style.color = '#fff'
        e.textContent = '000000000000000000000000000000000000000000000000000000'
      })
      const b = await page.screenshot({ clip: interior })
      expect(a.equals(b)).toBe(true)
      await page.locator('#occlusion-probe').evaluate(e => e.remove())
      await panel.locator('ul').evaluate(e => e.scrollTop = e.scrollHeight)
      await expect(panel.locator('li').last()).toBeInViewport()
      await page.screenshot({ path: `../evidence/candidate-${device}-${dark ? 'dark' : 'light'}-scrolled.png` })
      await sjc.click()
      await expect(panel).toContainText('SJC')
      await expect(panel.locator('li')).toHaveCount(1)
      await sjc.click()
      await expect(panel).toHaveCount(0)
      await lax.click()
      const box = (await lax.boundingBox())!
      await page.mouse.move(box.x + 4, box.y + 4)
      await page.mouse.down()
      await page.mouse.move(box.x + 44, box.y + 24, { steps: 6 })
      await page.mouse.up()
      await expect(panel).toBeVisible()
      await page.locator('.earth-canvas').click({ position: { x: 5, y: 5 }, force: true })
      await expect(panel).toHaveCount(0)
      expect(errors).toEqual([])
      expect(await page.locator('html').evaluate(e => e.scrollWidth)).toBe(width)
    })
  }
}
