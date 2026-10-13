<script setup lang="ts">
import type { NodeData } from '@/stores/nodes'
import { computed, defineAsyncComponent, useAttrs } from 'vue'
import { useAppStore } from '@/stores/app'

const props = defineProps<{
  nodes?: NodeData[]
  rateNodes?: NodeData[]
}>()

const attrs = useAttrs()
const appStore = useAppStore()

const NodeEarthCobeGlobe = defineAsyncComponent(() => import('@/components/NodeEarthCobeGlobe.vue'))
const NodeEarthRealisticGlobe = defineAsyncComponent(() => import('@/components/NodeEarthRealisticGlobe.vue'))
const NodeEarthTiledMap = defineAsyncComponent(() => import('@/components/NodeEarthTiledMap.vue'))
const NodeEarthEmeraldGlobe = defineAsyncComponent(() => import('@/components/NodeEarthEmeraldGlobe.vue'))

const earthComponent = computed(() => {
  const components = {
    realistic: NodeEarthRealisticGlobe,
    cobe: NodeEarthCobeGlobe,
    tiled: NodeEarthTiledMap,
    emerald: NodeEarthEmeraldGlobe,
  }
  return components[appStore.earthRenderer] ?? NodeEarthRealisticGlobe
})
</script>

<template>
  <component :is="earthComponent" v-bind="attrs" :nodes="props.nodes" :rate-nodes="props.rateNodes" :visitor-country-code="appStore.visitorCountryCode" :visitor-exit-coord="appStore.visitorExitCoord" />
</template>
