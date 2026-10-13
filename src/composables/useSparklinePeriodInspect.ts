import { onScopeDispose, ref, watch } from 'vue'

export interface SparklinePeriodInspect {
  rowKey: string
  index: number
  sticky: boolean
}

const MOUSE_COMPAT_MS = 700

export function sparklineIndexFromClientX(element: HTMLElement, clientX: number, barCount: number): number {
  const count = Math.max(barCount, 1)
  const last = Math.max(count - 1, 0)
  const rect = element.getBoundingClientRect()
  if (rect.width <= 0)
    return 0

  const ratio = (clientX - rect.left) / rect.width
  return Math.min(last, Math.max(0, Math.round(ratio * last)))
}

export function sparklineMarkerPercent(index: number, barCount: number): number {
  const count = Math.max(barCount, 1)
  return ((index + 0.5) / count) * 100
}

function isCoarsePointer(event: PointerEvent): boolean {
  return event.pointerType === 'touch' || event.pointerType === 'pen'
}

export function useSparklinePeriodInspect() {
  const inspect = ref<SparklinePeriodInspect | null>(null)
  let hostEl: HTMLElement | null = null
  let lastCoarseAt = 0

  function isCompatibilityMouse(event: PointerEvent): boolean {
    return event.pointerType === 'mouse' && lastCoarseAt > 0 && (performance.now() - lastCoarseAt) < MOUSE_COMPAT_MS
  }

  function setFromEvent(event: PointerEvent, rowKey: string, barCount: number, sticky: boolean) {
    const target = event.currentTarget
    if (!(target instanceof HTMLElement))
      return

    hostEl = target
    inspect.value = {
      rowKey,
      index: sparklineIndexFromClientX(target, event.clientX, barCount),
      sticky,
    }
  }

  function onPointerDown(event: PointerEvent, rowKey: string, barCount: number) {
    const sticky = isCoarsePointer(event)
    if (sticky) {
      lastCoarseAt = performance.now()
      event.stopPropagation()
    }
    setFromEvent(event, rowKey, barCount, sticky)
  }

  function onPointerMove(event: PointerEvent, rowKey: string, barCount: number) {
    if (isCompatibilityMouse(event))
      return
    if (isCoarsePointer(event) && !inspect.value)
      return

    setFromEvent(event, rowKey, barCount, inspect.value?.sticky === true || isCoarsePointer(event))
  }

  function onPointerLeave(event: PointerEvent, rowKey: string) {
    if (inspect.value?.sticky || isCoarsePointer(event) || isCompatibilityMouse(event))
      return
    if (inspect.value?.rowKey !== rowKey)
      return
    inspect.value = null
    hostEl = null
  }

  function clear() {
    inspect.value = null
    hostEl = null
  }

  function onDocumentPointerDown(event: PointerEvent) {
    if (!inspect.value?.sticky)
      return
    if (hostEl && event.target instanceof Node && hostEl.contains(event.target))
      return
    inspect.value = null
    hostEl = null
  }

  watch(() => inspect.value?.sticky === true, (sticky) => {
    if (typeof document === 'undefined')
      return
    if (sticky)
      document.addEventListener('pointerdown', onDocumentPointerDown, true)
    else
      document.removeEventListener('pointerdown', onDocumentPointerDown, true)
  })

  onScopeDispose(() => {
    if (typeof document !== 'undefined')
      document.removeEventListener('pointerdown', onDocumentPointerDown, true)
  })

  return {
    inspect,
    onPointerDown,
    onPointerMove,
    onPointerLeave,
    clear,
  }
}
