#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'

const unsafeIdChars = /[^a-z0-9.-]/gi
const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
const lockHash = createHash('sha256').update(readFileSync('bun.lockb')).digest('hex')
const entries = Object.entries({ ...pkg.dependencies, ...pkg.devDependencies }).sort(([a], [b]) => a.localeCompare(b))
const packages = entries.map(([name, version]) => ({
  SPDXID: `SPDXRef-Package-${name.replace(unsafeIdChars, '-')}`,
  name,
  versionInfo: version,
  downloadLocation: 'NOASSERTION',
  filesAnalyzed: false,
  licenseConcluded: 'NOASSERTION',
  licenseDeclared: 'NOASSERTION',
}))
const document = {
  spdxVersion: 'SPDX-2.3',
  dataLicense: 'CC0-1.0',
  SPDXID: 'SPDXRef-DOCUMENT',
  name: 'GlassEmerald-direct-dependencies',
  documentNamespace: `https://github.com/luhaihui106/GlassEmerald/sbom/${lockHash}`,
  creationInfo: {
    creators: ['Tool: scripts/generate-sbom.mjs'],
    created: '2026-10-10T00:00:00Z',
  },
  packages: [
    {
      SPDXID: 'SPDXRef-Root',
      name: pkg.name,
      versionInfo: pkg.version ?? '0.0.0',
      downloadLocation: 'NOASSERTION',
      filesAnalyzed: false,
      licenseConcluded: pkg.license,
      licenseDeclared: pkg.license,
    },
    ...packages,
  ],
  relationships: [
    { spdxElementId: 'SPDXRef-DOCUMENT', relationshipType: 'DESCRIBES', relatedSpdxElement: 'SPDXRef-Root' },
    ...packages.map(p => ({ spdxElementId: 'SPDXRef-Root', relationshipType: 'DEPENDS_ON', relatedSpdxElement: p.SPDXID })),
  ],
}
writeFileSync('GlassEmerald.spdx.json', `${JSON.stringify(document, null, 2)}\n`)
