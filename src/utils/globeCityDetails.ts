import type { ServerExitLocation } from './buildGlobeClusters'
import { buildGlobeClusters } from './buildGlobeClusters'

export function buildGlobeCityMembers<T extends { uuid: string, region: string, online: boolean }>(nodes: T[], locations: Record<string, ServerExitLocation>) {
  const members = new Map<string, T[]>()
  const seen = new Set<string>()
  for (const node of nodes) {
    if (seen.has(node.uuid))
      continue
    seen.add(node.uuid)
    const cluster = buildGlobeClusters([node], locations)[0]
    if (!cluster)
      continue
    const list = members.get(cluster.id) ?? []
    list.push(node)
    members.set(cluster.id, list)
  }
  return members
}
