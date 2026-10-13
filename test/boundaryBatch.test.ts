import { expect, it } from 'vitest'
import { batchCountryBoundaries } from '../src/utils/batchCountryBoundaries'

it('batches line segments by highlighted state without joining separate rings', () => {
  const result = batchCountryBoundaries([
    { code: 'US', rings: [[[0, 0], [1, 0], [1, 1]], [[4, 4], [5, 4]]] },
    { code: 'DE', rings: [[[8, 8], [9, 8]]] },
  ], new Set(['US']), ([lat, lon]) => [lat, lon, 1])
  expect(result.highlighted).toEqual([0, 0, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 4, 4, 1, 4, 5, 1])
  expect(result.normal).toEqual([8, 8, 1, 8, 9, 1])
})
