#!/usr/bin/env node
import { readFileSync } from 'node:fs'
import process from 'node:process'

const mode = process.argv.includes('--public') ? 'public' : 'private'
const statuses = new Set(['Verified', 'Conditional', 'Unverified', 'Mixed'])
const rows = readFileSync('ASSET_PROVENANCE.md', 'utf8')
  .split('\n')
  .filter(line => line.startsWith('|') && !line.includes('---'))
  .map(line => line.split('|').slice(1, -1).map(cell => cell.trim().replaceAll('`', '')))
  .filter(cells => cells.length > 1 && statuses.has(cells[1]))
if (rows.length !== 9 || new Set(rows.map(([name]) => name)).size !== 9)
  throw new Error('asset provenance register must contain exactly nine unique recognized groups')
// A status label alone cannot pass: validate the immutable asset inventory.
await import('./verify-original-assets.mjs')
const approved = new Set(JSON.parse(readFileSync('docs/asset-evidence/candidate-groups.json', 'utf8')).groups)
for (const [name, status] of rows) {
  if (status === 'Verified' && !approved.has(name))
    throw new Error(`Verified group has no approved reproducible verifier: ${name}`)
}
const unresolved = rows.filter(([, status]) => status !== 'Verified')
if (mode === 'public' && unresolved.length) {
  console.error('Public release blocked by unresolved asset provenance:')
  for (const [name, status] of unresolved)
    console.error(`- ${status}: ${name}`)
  process.exit(1)
}
console.log(`asset provenance gate: ${mode} mode; ${unresolved.length} unresolved item(s); private-use-only=${mode === 'private'}`)
