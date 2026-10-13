export interface BoundaryCountry {
  code: string
  rings: number[][][]
}

export function batchCountryBoundaries(
  countries: BoundaryCountry[],
  highlightedCodes: Set<string>,
  project: (latLon: [number, number]) => [number, number, number],
): { highlighted: number[], normal: number[] } {
  const highlighted: number[] = []
  const normal: number[] = []
  for (const country of countries) {
    const target = highlightedCodes.has(country.code) ? highlighted : normal
    for (const ring of country.rings) {
      for (let i = 1; i < ring.length; i++) {
        const start = ring[i - 1]!
        const end = ring[i]!
        const a = project([start[1]!, start[0]!])
        const b = project([end[1]!, end[0]!])
        target.push(...a, ...b)
      }
    }
  }
  return { highlighted, normal }
}
