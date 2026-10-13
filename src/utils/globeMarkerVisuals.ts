export type MarkerStatus = 'online' | 'mixed' | 'offline'

export interface MarkerVisualState {
  scale: number
  opacity: number
  color: number
}

// Match the dark-theme status tokens used by the node online/offline indicators.
const ONLINE_GREEN = 0x18E05F
const OFFLINE_RED = 0xFF6467

/** Online breathes green, mixed alternates green/red, fully offline stays red. */
export function markerVisualState(phase: number, status: MarkerStatus): MarkerVisualState {
  const wave = (Math.sin(phase) + 1) / 2
  const alternatingOffline = status === 'mixed' && Math.sin(phase * 0.5) < 0
  return {
    scale: 0.056 + wave * 0.054,
    // A stronger light/dark cycle while the greener base compensates for the
    // blue globe underneath without drifting toward cyan.
    opacity: 0.68 + wave * 0.32,
    color: status === 'offline' || alternatingOffline ? OFFLINE_RED : ONLINE_GREEN,
  }
}
