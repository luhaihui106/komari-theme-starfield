import { describe, expect, it } from 'vitest'
import { buildGlobeCityMembers } from './globeCityDetails'

describe('city details UUID membership', () => {
  it('includes every city machine including offline, deduplicates UUID, follows live data', () => {
    const geo = { a: { lat: 34, lng: -118, city: 'Los Angeles', countryCode: 'US' }, b: { lat: 34, lng: -118, city: 'Los Angeles', countryCode: 'US' } }
    const a = { uuid: 'a', name: 'long name', region: 'US', online: true }
    const b = { uuid: 'b', name: 'offline', region: 'US', online: false }
    expect(buildGlobeCityMembers([a, b, a], geo).get('us-los-angeles')).toEqual([a, b])
    expect(buildGlobeCityMembers([b], geo).get('us-los-angeles')).toEqual([b])
  })
})
