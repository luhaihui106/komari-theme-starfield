import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, expect, it, vi } from 'vitest'
import { useAppStore } from '../../src/stores/app'
import { destroyInitManager, initApp } from '../../src/utils/init'

const f = vi.hoisted(() => ({ settings: vi.fn(), tasks: vi.fn(), nodes: vi.fn(), status: vi.fn() }))
vi.mock('../../src/utils/api', () => ({ getSharedApi: () => ({ getPublicSettings: f.settings, getMe: async () => ({ logged_in: false }) }) }))
vi.mock('../../src/utils/rpc', () => ({ RpcError: class extends Error {}, getSharedRpc: () => ({ ping: async () => 'pong', getNodes: f.nodes, getNodesLatestStatus: f.status, getPublicPingTasks: f.tasks, getClient: () => ({ setTransport: () => {} }), close: () => {} }) }))
beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-10-11T00:00:00Z'))
  Object.assign(globalThis, { localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} } })
  setActivePinia(createPinia())
  f.settings.mockResolvedValue({ theme_settings: { rpcTransportMode: 'http', dataUpdateInterval: 3 } })
  f.tasks.mockResolvedValue([{ id: 9, name: 'first', clients: ['node'] }])
  f.nodes.mockResolvedValue({})
  f.status.mockResolvedValue({})
})
it('refreshes configuration without reload and retains snapshots on failure', async () => {
  await initApp()
  const app = useAppStore()
  expect(app.pingTasks?.[0].name).toBe('first')
  f.settings.mockResolvedValue({ sitename: 'changed', theme_settings: { rpcTransportMode: 'http', dataUpdateInterval: 3 } })
  f.tasks.mockResolvedValue([{ id: 10, name: 'changed', clients: [] }])
  await vi.advanceTimersByTimeAsync(60000)
  expect(app.publicSettings?.sitename).toBe('changed')
  expect(app.pingTasks?.[0].id).toBe(10)
  f.tasks.mockRejectedValue(new Error('temporary'))
  await vi.advanceTimersByTimeAsync(60000)
  expect(app.pingTasks?.[0].id).toBe(10)
  expect(f.status.mock.calls.length).toBeGreaterThanOrEqual(40)
  destroyInitManager()
  vi.useRealTimers()
})
