import type { NodeData } from '@/stores/nodes'
import type { ServerExitLocation } from '@/utils/buildGlobeClusters'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { buildGlobeClusters } from '@/utils/buildGlobeClusters'

export function usePublishedGlobeLocations(nodes: () => NodeData[] | undefined) {
  const locations = ref<Record<string, ServerExitLocation>>({})
  let timer: ReturnType<typeof setTimeout> | undefined
  let controller: AbortController | undefined
  let stopped = false
  async function refresh() {
    controller = new AbortController()
    const timeout = setTimeout(() => controller?.abort(), 10000)
    try {
      const response = await fetch('/api/public/globe-locations', { signal: controller.signal, cache: 'no-store' })
      if (!response.ok)
        return
      const data: unknown = await response.json()
      if (!stopped && data && typeof data === 'object' && !Array.isArray(data))
        locations.value = data as Record<string, ServerExitLocation>
    }
    catch {
      // Keep the last valid locations and retry on the metadata cadence.
    }
    finally {
      clearTimeout(timeout)
      if (!stopped)
        timer = setTimeout(() => void refresh(), 60000)
    }
  }
  onMounted(() => void refresh())
  onBeforeUnmount(() => {
    stopped = true
    clearTimeout(timer)
    controller?.abort()
  })
  const regionClusters = computed(() => buildGlobeClusters(nodes() ?? [], locations.value))
  return { regionClusters, locations }
}
