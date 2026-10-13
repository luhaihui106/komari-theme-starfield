import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, expect, it } from 'vitest'
import { ref } from 'vue'
import { useThreeNetPing } from '../src/composables/useThreeNetPing'
import { useAppStore } from '../src/stores/app'

beforeEach(() => {
  Object.assign(globalThis, { localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} } })
  setActivePinia(createPinia())
})
it('selects assigned ordinary tasks instead of unrelated global defaults for recreated nodes', () => {
  const app = useAppStore()
  app.publicSettings = { theme_settings: { threeNetPingEnabled: true, threeNetPingTaskIds: [1, 2, 7] } } as any
  const node = ref({ uuid: 'recreated', ping: { 9: { name: 'Cloudflare', latest: 1, loss: 0 }, 10: { name: 'Google', latest: 2, loss: 0 } } } as any)
  const display = useThreeNetPing(node)
  expect(display.items.value.map(i => i.id)).toEqual([9, 10])
})
it('uses authoritative membership to remove stale samples and include newly assigned tasks before first sample', () => {
  const app = useAppStore()
  app.publicSettings = { theme_settings: { threeNetPingEnabled: true, threeNetPingTaskIds: [1, 2, 7], threeNetPingNodeTaskBindings: '{"node":[9,11]}' } } as any
  app.pingTasks = [{ id: 10, name: 'renamed', clients: ['node'] }, { id: 9, name: 'removed', clients: [] }] as any
  const node = ref({ uuid: 'node', ping: { 9: { name: 'old', latest: 1, loss: 0 } } } as any)
  const display = useThreeNetPing(node)
  expect(display.items.value.map(i => i.id)).toEqual([10])
  expect(display.items.value[0].label).toBe('renamed')
  app.pingTasks = []
  expect(display.items.value).toEqual([])
})
it('respects valid explicit subsets and filters stale bindings without inventing probes', () => {
  const app = useAppStore()
  app.publicSettings = { theme_settings: { threeNetPingEnabled: true, threeNetPingTaskIds: [1, 2, 7], threeNetPingNodeTaskBindings: '{"node":[11,99]}' } } as any
  app.pingTasks = [{ id: 9, name: 'Cloudflare', clients: ['node'] }, { id: 11, name: 'GitHub TCP', clients: ['node'] }] as any
  const display = useThreeNetPing({ uuid: 'node' } as any)
  expect(display.items.value.map(i => i.id)).toEqual([11])
  app.pingTasks = [{ id: 9, name: 'Cloudflare', clients: ['node'] }] as any
  expect(display.items.value.map(i => i.id)).toEqual([9])
})
