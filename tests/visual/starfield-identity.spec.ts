import process from 'node:process'
import { expect, test } from '@playwright/test'
import { installKomariFixture } from './fixtures/komari'

for (const [name, width, height] of [['desktop', 1440, 1000], ['mobile', 390, 844]] as const) {
  test(`installed starfield ${name} resource identity and full page`, async ({ page }) => {
    const errors: string[] = []
    const textures: string[] = []
    page.on('pageerror', e => errors.push(e.message))
    page.on('response', (r) => {
      if (r.url().includes('earth-blue-marble.webp') && r.status() === 200)
        textures.push(r.url())
    })
    await page.setViewportSize({ width, height })
    await installKomariFixture(page, { dark: true, earthRenderer: 'emerald', nodeCount: 19 })
    await page.goto('/')
    await expect(page.locator('.earth-canvas')).toBeVisible()
    await page.waitForTimeout(2500)
    const identity = await page.locator('.default-background').evaluate(async (element) => {
      const style = getComputedStyle(element)
      const url = style.backgroundImage.slice(5, -2)
      const response = await fetch(url)
      const bytes = await response.arrayBuffer()
      const hash = await crypto.subtle.digest('SHA-256', bytes)
      return { url, status: response.status, filter: style.filter, hash: Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, '0')).join('') }
    })
    expect(identity.status).toBe(200)
    expect(new URL(identity.url).pathname).toBe(`${process.env.INSTALLED_ASSET_BASE || '/'}images/default-milky-way-2560-q88-v1.webp`)
    expect(identity.hash).toBe((process.env.STARFIELD_HASH || '105bac5828ba20232495a5636d582eac9a7eae393b44ddb5272269517e9d507c'))
    expect(identity.filter).toBe('none')
    await expect(page.locator('html')).toHaveJSProperty('scrollWidth', width)
    await page.screenshot({ path: `../evidence/${process.env.STARFIELD_VARIANT}-${name}-full.png`, fullPage: true })
    await page.locator('.region-badge').filter({ visible: true }).first().click()
    const panel = page.getByRole('region', { name: '城市实时详情' })
    await expect(panel).toBeVisible()
    const box = await panel.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.x).toBeGreaterThanOrEqual(0)
    expect(box!.x + box!.width).toBeLessThanOrEqual(width)
    await page.screenshot({ path: `../evidence/${process.env.STARFIELD_VARIANT}-${name}-selected-full.png`, fullPage: true })
    expect(errors).toEqual([])
    expect(textures.length).toBeGreaterThan(0)
    const counts = { cards: await page.getByRole('button', { name: /^查看节点 .* 详情$/ }).count(), members: await panel.locator('.city-detail__members li').count() }
    console.warn(JSON.stringify({ name, identity, textures, errors, counts }))
  })
}
