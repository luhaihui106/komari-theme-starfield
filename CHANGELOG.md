# Changelog

## 0.1.12 — 2026-10-27

- Port the maintained public theme's background admission fix into Vue source: wait for authoritative public settings and do not fetch the default behind pending custom media. Preserve image/video error fallback.
- Reuse the reviewed 2560×1556, quality-88 WebP derivative of the same EvgeniT CC0 Milky Way image (682,726 bytes). Retain original artwork and notices.
- Restore per-distribution local marks using Simple Icons 11.15.0 CC0 paths with explicit readable fills, original text identifiers for six unsupported marks, and an honest generic unknown fallback. Preserve existing OS detection.
- Add country-qualified `US:champaign` → `CMI` label without changing coordinates, grouping or membership; retain LON/HKG.
- Keep generic settings, HTTP transport and 3-second update defaults. No backend/Admin, node data, task bindings or private settings are included.
- Add regression tests and artifact verification. Release ZIP is rebuilt from public source, not byte-identical to the maintained compiled namespace. This publication does not deploy or modify production.
- Pin every Vite build-tool resolution to 7.3.7, removing the stale vulnerable 7.3.6 peer resolution without other dependency upgrades. Existing advisory exceptions in the public gate remain unchanged; this is not a claim of zero advisories across all development dependencies.
- Disable automatic draft asset uploading in the tag workflow to prevent overwriting manually verified release assets; tag CI still builds twice and verifies reproducibility.

Validation: source regression negative controls; Bun and Vitest source/runtime tests; lint/type-check/build; synthetic Chromium full-page background pending/success/image-error/video-error and icon decode smoke; JS syntax/import graph; public privacy/artwork gates; secret and URL/IP review; two byte-identical final ZIP builds. Authenticated Admin, physical devices/Safari, and a fresh backend theme upload were not rerun for this theme-only maintenance release. Historical official Komari 1.5.1 compatibility evidence remains scoped to its earlier version.
