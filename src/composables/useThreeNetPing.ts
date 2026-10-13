import type { MaybeRefOrGetter } from 'vue'
import type { NodePingBar } from '@/composables/useNodePingDisplay'
import type { PingMetricLossPoint, PingRecord } from '@/composables/useNodePingStats'
import type { NodeData } from '@/stores/nodes'
import type { NodeStatusPing, PingMetricTaskStats } from '@/utils/rpc'
import { computed, toValue } from 'vue'
import {
  buildEmptyPingBars,
  buildLatencyBars,
  buildLossBars,
  getLatencyToneDotClass,
  getLatencyToneTextClass,
  getLossToneTextClass,
} from '@/composables/useNodePingDisplay'
import { buildPingStatsForTask } from '@/composables/useNodePingStats'
import { useAppStore } from '@/stores/app'

interface ThreeNetPingItem {
  id: number
  label: string
  fullName: string
  latencyDisplay: string
  lossDisplay: string
  latencyTooltip: string
  lossTooltip: string
  latencyBars: NodePingBar[]
  lossBars: NodePingBar[]
  latencyPoints: Array<number | null>
  latencyToneClass: string
  lossToneClass: string
  dotClass: string
}

interface UseThreeNetPingOptions {
  records?: MaybeRefOrGetter<readonly PingRecord[]>
  metricStats?: MaybeRefOrGetter<readonly PingMetricTaskStats[] | undefined>
  metricLossPoints?: MaybeRefOrGetter<readonly PingMetricLossPoint[] | undefined>
  loading?: MaybeRefOrGetter<boolean>
}

export function getPingTaskDisplayName(name: string, fallback: string): string {
  return name.trim() || fallback
}

function readPingSample(ping: NodeData['ping'], taskId: number): NodeStatusPing | undefined {
  if (!ping)
    return undefined
  return ping[String(taskId)]
}

function taskNameFromStats(metricStats: readonly PingMetricTaskStats[] | undefined, taskId: number): string {
  const match = metricStats?.find(stat => Number(stat.task_id) === taskId)
  return match?.name?.trim() || ''
}

export function useThreeNetPing(node: MaybeRefOrGetter<NodeData>, options: UseThreeNetPingOptions = {}) {
  const appStore = useAppStore()

  const taskIds = computed(() => {
    const binding = appStore.threeNetPingNodeTaskBindings[toValue(node).uuid]
    const available = appStore.pingTasks === undefined
      ? Object.keys(toValue(node).ping ?? {}).map(Number).filter(id => Number.isInteger(id) && id > 0)
      : appStore.pingTasks.filter(task => task.clients?.includes(toValue(node).uuid)).sort((a, b) => (a.weight ?? a.id) - (b.weight ?? b.id) || a.id - b.id).map(task => task.id)
    if (!available.length && appStore.pingTasks === undefined)
      return binding?.length ? [...binding] : [...appStore.threeNetPingTaskIds]
    const selected = (binding?.length ? binding : appStore.threeNetPingTaskIds).filter(id => available.includes(id))
    return selected.length ? [...selected] : available
  })
  const visible = computed(() => appStore.threeNetPingEnabled && taskIds.value.length > 0)

  const historyItems = computed(() => {
    if (!visible.value)
      return []

    const records = toValue(options.records) ?? []
    const metricStats = toValue(options.metricStats)
    const metricLossPoints = toValue(options.metricLossPoints)
    const loading = toValue(options.loading) === true

    return taskIds.value.map((id) => {
      const stats = buildPingStatsForTask(records, id, metricStats, metricLossPoints)
      const fullName = taskNameFromStats(metricStats, id) || `任务 ${id}`
      const emptyTooltip = loading ? '加载中' : `${fullName}\n暂无探测数据`
      const latencyHistoryBars = buildLatencyBars(stats.history)
      const lossHistoryBars = buildLossBars(stats.history)

      return {
        id,
        statsFullName: fullName,
        stats,
        loading,
        latencyPoints: stats.history.map(point => point.latency),
        latencyBars: latencyHistoryBars.length
          ? latencyHistoryBars
          : buildEmptyPingBars(emptyTooltip, `task-${id}-latency`),
        lossBars: lossHistoryBars.length
          ? lossHistoryBars
          : buildEmptyPingBars(emptyTooltip, `task-${id}-loss`),
      }
    })
  })

  const items = computed<ThreeNetPingItem[]>(() => {
    if (!visible.value)
      return []

    const current = toValue(node)

    return historyItems.value.map((item) => {
      const sample = readPingSample(current.ping, item.id)
      const stats = item.stats
      const fullName = appStore.pingTasks?.find(task => task.id === item.id)?.name?.trim() || sample?.name?.trim() || item.statsFullName
      const latest = sample && Number.isFinite(sample.latest) ? sample.latest : null
      const lost = latest !== null && latest < 0
      const displayLatency = latest !== null && !lost
        ? latest
        : stats.hasData
          ? stats.avgLatency
          : null
      const lossValue = sample && Number.isFinite(sample.loss)
        ? sample.loss
        : stats.hasData
          ? stats.avgLoss
          : null

      return {
        id: item.id,
        label: getPingTaskDisplayName(fullName, `#${item.id}`),
        fullName,
        latencyDisplay: latest === null && !stats.hasData
          ? (item.loading ? '加载中' : '-')
          : lost
            ? '丢包'
            : `${Math.round(displayLatency ?? 0)} ms`,
        lossDisplay: lossValue === null
          ? (item.loading ? '加载中' : '-')
          : `${lossValue.toFixed(1)}%`,
        latencyTooltip: latest === null && !stats.hasData
          ? `${fullName}\n暂无探测数据`
          : lost
            ? `${fullName}\n最近一次探测丢包`
            : `${fullName}\n延迟 ${Math.round(displayLatency ?? 0)} ms`,
        lossTooltip: lossValue === null
          ? `${fullName}\n暂无探测数据`
          : sample && Number.isFinite(sample.loss)
            ? `${fullName}\n丢包 ${lossValue.toFixed(1)}%`
            : `${fullName}\n平均丢包 ${lossValue.toFixed(1)}%`,
        latencyBars: item.latencyBars,
        lossBars: item.lossBars,
        latencyPoints: item.latencyPoints,
        latencyToneClass: lost
          ? 'text-signal-5'
          : displayLatency === null
            ? 'text-muted-foreground'
            : getLatencyToneTextClass(displayLatency),
        lossToneClass: lossValue === null
          ? 'text-muted-foreground'
          : getLossToneTextClass(lossValue),
        dotClass: lost
          ? 'bg-signal-5'
          : displayLatency === null
            ? 'bg-muted-foreground/40'
            : getLatencyToneDotClass(displayLatency),
      }
    })
  })

  return {
    visible,
    items,
  }
}
