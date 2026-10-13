#!/usr/bin/env node
// Verification only. Never rewrites icons.generated.json.
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import process from 'node:process'

const root = process.argv[2]
if (!root)
  throw new Error('Usage: node scripts/verify-icon-subset.mjs PATH_TO_EXTRACTED_ICONIFY_JSON_2.2.529_PACKAGE')
const manifest = JSON.parse(readFileSync('docs/asset-evidence/icon-subset.json', 'utf8'))
const metadata = JSON.parse(readFileSync(`${root}/package.json`, 'utf8'))
if (metadata.name !== manifest.package || metadata.version !== manifest.version)
  throw new Error('Iconify source package identity mismatch')
const target = JSON.parse(readFileSync('src/assets/icons.generated.json', 'utf8'))
let count = 0
for (const entry of manifest.collections) {
  const bytes = readFileSync(`${root}/json/${entry.prefix}.json`)
  if (createHash('sha256').update(bytes).digest('hex') !== entry.collection_sha256)
    throw new Error(`Pinned collection hash mismatch: ${entry.prefix}`)
  const upstream = JSON.parse(bytes)
  const subset = target.find(item => item.prefix === entry.prefix)
  if (!subset || Object.keys(subset.icons).length !== entry.count)
    throw new Error(`Subset count mismatch: ${entry.prefix}`)
  for (const name of entry.names) {
    if (JSON.stringify(subset.icons[name]) !== JSON.stringify(upstream.icons[name]))
      throw new Error(`Icon body/properties mismatch: ${entry.prefix}:${name}`)
    count++
  }
}
console.log(`Pinned Iconify ${manifest.version}: ${count} exact icon records verified`)
