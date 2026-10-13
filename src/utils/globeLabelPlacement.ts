export interface GlobeLabelInput {
  id: string
  x: number
  y: number
  width: number
  height: number
}
export interface GlobeLabelPlacement {
  id: string
  visible: boolean
  left: number
  top: number
  anchorOffset: number
  anchorTop: number
  leaderLength: number
}
interface Box { left: number, top: number, right: number, bottom: number }
interface Previous { input: GlobeLabelInput, placement: GlobeLabelPlacement }

/**
 * A component-owned cache: reserve surviving slots before placing newcomers.
 * Small projected motion follows the anchor, data refresh never resets the slot.
 * Fallback is bounded concentric rings, not a per-frame sorted screen lattice.
 */
export function createGlobeLabelLayout() {
  let previous = new Map<string, Previous>()
  let viewport = ''
  return (labels: GlobeLabelInput[], width: number, height: number): GlobeLabelPlacement[] => {
    if (viewport !== `${width}:${height}`)
      previous.clear()
    viewport = `${width}:${height}`
    const occupied: Box[] = []
    const placed = new Map<string, GlobeLabelPlacement>()
    const next = new Map<string, Previous>()
    const trySlot = (label: GlobeLabelInput, left: number, top: number): boolean => {
      const { id, x, y, width: w, height: h } = label
      if (left < 0 || top < 0 || left + w > width || top + h > height)
        return false
      const box = { left, top, right: left + w, bottom: top + h }
      if (occupied.some(o => left < o.right + 4 && left + w + 4 > o.left && top < o.bottom + 4 && top + h + 4 > o.top))
        return false
      const leaderLength = Math.hypot(x - Math.max(left, Math.min(x, left + w)), y - Math.max(top, Math.min(y, top + h)))
      if (leaderLength > 65)
        return false
      const placement = { id, visible: true, left, top, anchorOffset: x - left, anchorTop: y - top, leaderLength }
      occupied.push(box)
      placed.set(id, placement)
      next.set(id, { input: label, placement })
      return true
    }
    // Cache insertion order, not incoming online/count ordering, owns priority.
    const inputs = new Map(labels.map(l => [l.id, l]))
    for (const [id, old] of previous) {
      const label = inputs.get(id)
      if (!label || !old.placement.visible)
        continue
      const dx = label.x - old.input.x
      const dy = label.y - old.input.y
      // Large view changes must be replanned, not dragged to unrelated anchors.
      if (Math.hypot(dx, dy) < 16)
        trySlot(label, old.placement.left + dx, old.placement.top + dy)
    }
    for (const label of labels) {
      if (placed.has(label.id))
        continue
      const { id, x, y, width: w, height: h } = label
      const slots: Array<[number, number]> = [[x - w / 2, y - h - 12], [x - w / 2, y + 16], [x + 12, y - h / 2], [x - w - 12, y - h / 2], [x + 12, y - h - 12], [x - w - 12, y - h - 12]]
      let found = slots.some(([left, top]) => trySlot(label, left, top))
      // Bounded ring traversal costs nothing on frames reusing all slots.
      for (let radius = 8; radius <= Math.max(w, h) + 64 && !found; radius += 8) {
        for (let offset = -radius; offset <= radius && !found; offset += 8) {
          for (const [dx, dy] of [[offset, -radius], [offset, radius], [-radius, offset], [radius, offset]]) {
            if (trySlot(label, x - w / 2 + dx!, y - h / 2 + dy!)) {
              found = true
              break
            }
          }
        }
      }
      if (!found)
        placed.set(id, { id, visible: false, left: x - w / 2, top: y - h - 12, anchorOffset: w / 2, anchorTop: h + 12, leaderLength: 12 })
    }
    previous = next
    return labels.map(l => placed.get(l.id)!)
  }
}
/** Stateless compatibility entry point used by existing placement tests. */
export function placeGlobeLabels(labels: GlobeLabelInput[], width: number, height: number): GlobeLabelPlacement[] {
  return createGlobeLabelLayout()(labels, width, height)
}
