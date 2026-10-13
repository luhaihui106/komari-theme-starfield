const FULL_TURN = Math.PI * 2

/** Return the equivalent target angle requiring at most half a turn from current. */
export function closestEquivalentAngle(current: number, target: number): number {
  return current + Math.atan2(Math.sin(target - current), Math.cos(target - current))
}

/** Keep accumulated angles bounded without changing their visible orientation. */
export function normalizeAccumulatedAngle(angle: number): number {
  return ((angle + Math.PI) % FULL_TURN + FULL_TURN) % FULL_TURN - Math.PI
}
