#!/usr/bin/env node
import { Buffer } from 'node:buffer'
import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import process from 'node:process'

// Public snapshot uses its own complete immutable inventory. Historical private
// acquisition reports are intentionally not distributed by this repository.
const manifest = JSON.parse(readFileSync('docs/asset-evidence/candidate-current-manifest.json', 'utf8'))
const IMAGE_EXTENSION_REGEX = /\.(?:svg|png|jpg|webp|ico)$/i
function listImages(root) {
  return readdirSync(root).flatMap((name) => {
    const path = `${root}/${name}`
    return statSync(path).isDirectory() ? listImages(path) : IMAGE_EXTENSION_REGEX.test(path) ? [path] : []
  })
}
for (const root of ['public', 'docs', 'tests/visual/snapshots', 'src/assets', 'artwork']) {
  for (const path of listImages(root)) {
    if (!manifest.files[path])
      throw new Error(`Unregistered candidate image: ${path}`)
  }
}
for (const [path, expected] of Object.entries(manifest.files)) {
  const actual = createHash('sha256').update(readFileSync(path)).digest('hex')
  if (actual !== expected)
    throw new Error(`Original asset changed: ${path}`)
}
console.log(`Public snapshot integrity: ${Object.keys(manifest.files).length} hash-checked files; no unregistered artwork`)

if (process.argv.includes('--upstream')) {
  const hash = value => createHash('sha256').update(value).digest('hex')
  async function download(url) {
    const response = await fetch(url, { signal: AbortSignal.timeout(60000) })
    if (!response.ok)
      throw new Error(`Upstream unavailable: ${response.status} ${url}`)
    return Buffer.from(await response.arrayBuffer())
  }
  const flags = JSON.parse(readFileSync('docs/asset-evidence/flags-comparison.json', 'utf8'))
  for (const file of flags) {
    if (hash(await download(file.candidate)) !== file.sha256)
      throw new Error(`Flag source mismatch: ${file.file}`)
  }
  const geo = JSON.parse(readFileSync('docs/asset-evidence/provenance-report.json', 'utf8')).groups.boundaries
  const source = await download(geo.source_url)
  if (hash(source) !== geo.source_sha256)
    throw new Error('Natural Earth source hash mismatch')
  const countries = JSON.parse(source).features.map((feature) => {
    const coordinates = feature.geometry.coordinates
    return { code: feature.properties.ISO_A2_EH, rings: feature.geometry.type === 'Polygon' ? coordinates : coordinates.flat(1) }
  })
  if (JSON.stringify({ countries }) !== JSON.stringify(JSON.parse(readFileSync('public/assets/earth/country-boundaries-v1.json', 'utf8'))))
    throw new Error('Boundary structured conversion mismatch')
  console.log(`Pinned upstream comparison: ${flags.length} exact flags; ${countries.length} exact country geometries`)
}
