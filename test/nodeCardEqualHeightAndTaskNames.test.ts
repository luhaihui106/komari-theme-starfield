import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { getPingTaskDisplayName } from '../src/composables/useThreeNetPing.ts'

const card = readFileSync(new URL('../src/components/NodeCard.vue', import.meta.url), 'utf8')

describe('production-accepted node-card monitoring contract', () => {
  it('keeps exact configured task names so carriers and IP versions remain distinct', () => {
    for (const name of ['天津移动', '天津联通', '天津电信', '天津移动 IPv6', 'Cloudflare', 'GitHub TCP'])
      expect(getPingTaskDisplayName(name, '#1')).toBe(name)
    expect(getPingTaskDisplayName('   ', '#7')).toBe('#7')
  })

  it('reserves the production-accepted ping area height for equal cards', () => {
    expect(card).toContain('class="node-card-ping-reserve select-none"')
    expect(card).toContain('height: 7.125rem')
    expect(card).toContain('min-height: 7.125rem')
    expect(card).toContain('flex: 0 0 7.125rem')
  })
})
