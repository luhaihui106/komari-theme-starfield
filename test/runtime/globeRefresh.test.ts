import { expect, it, vi } from 'vitest'
import { usePublishedGlobeLocations } from '../../src/composables/usePublishedGlobeLocations'

const hooks = vi.hoisted(() => ({ mount: [] as Array<() => void>, unmount: [] as Array<() => void> }))
vi.mock('vue', async original => ({ ...await original<typeof import('vue')>(), onMounted: (fn: () => void) => hooks.mount.push(fn), onBeforeUnmount: (fn: () => void) => hooks.unmount.push(fn) }))
it('retries cold failure, refreshes locations, retains good data on failure and stops on unmount', async () => {
  vi.useFakeTimers()
  const fetcher = vi.fn().mockRejectedValueOnce(new Error('temporary')).mockResolvedValue({ ok: true, json: async () => ({ a: { lat: 35, lng: 139, city: 'Tokyo', countryCode: 'JP' } }) })
  vi.stubGlobal('fetch', fetcher)
  const state = usePublishedGlobeLocations(() => [{ uuid: 'a', region: 'JP', online: true }] as any)
  hooks.mount[0]()
  await vi.advanceTimersByTimeAsync(60000)
  expect(state.regionClusters.value[0].label).toBe('TYO')
  fetcher.mockResolvedValue({ ok: true, json: async () => ({ a: { lat: 34, lng: 135, city: 'Osaka', countryCode: 'JP' } }) })
  await vi.advanceTimersByTimeAsync(60000)
  expect(state.regionClusters.value[0].label).toBe('OSA')
  fetcher.mockRejectedValue(new Error('temporary'))
  await vi.advanceTimersByTimeAsync(60000)
  expect(state.regionClusters.value[0].label).toBe('OSA')
  hooks.unmount[0]()
  const count = fetcher.mock.calls.length
  await vi.advanceTimersByTimeAsync(120000)
  expect(fetcher).toHaveBeenCalledTimes(count)
  vi.unstubAllGlobals()
  vi.useRealTimers()
})
