import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'

const card = readFileSync(new URL('../src/components/NodeCard.vue', import.meta.url), 'utf8')
const home = readFileSync(new URL('../src/views/HomeView.vue', import.meta.url), 'utf8')

it('uses a thinner compact ping panel while retaining separate latency and loss bars', () => {
  expect(card).toContain('isMiniNodeCard.value ? \'h-7\' : \'h-9\'')
  expect(card).toContain('isMiniNodeCard.value ? \'gap-1 p-1\' : \'gap-1 p-1.5\'')
  expect(card).toContain('\'flex flex-col gap-1\'')
  expect(card).toContain('data-node-ping-bars="row.latencyBarsAttr"')
  expect(card).toContain('data-node-ping-bars="row.lossBarsAttr"')
  expect(home).toContain('{ mini: 30, compact: 38, comfortable: 42, large: 50 }')
})
