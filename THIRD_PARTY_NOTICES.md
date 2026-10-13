# Third-Party Notices

GlassEmerald is derived code, not a license grant over all independent artwork. Preserve this notice and `docs/asset-evidence/licenses/` in source and binary distributions.

## Theme code

- sanrokamlan-prog and towersip Glassmorphism: MIT, Copyright (c) 2025 Tony Liu (tonyliuzj, tony-liu.com).
- Tokinx Emerald: MIT, Copyright (c) 2026 Tokinx.

Original full MIT notices were retrieved from pinned upstream commits in `docs/asset-evidence/logos-docs.json` and are bundled under `docs/asset-evidence/licenses/`. The project `LICENSE` does not replace those copyright lines.

## Icon subset (unchanged)

154 exact records from `@iconify/json` 2.2.529:

- Carbon 11.88.0, IBM: 1 icon, Apache-2.0.
- IconPark Outline 1.4.2, ByteDance: 27 icons, Apache-2.0.
- Lucide Contributors: 6 icons, ISC; Iconify snapshot version pins the records (no collection semver supplied).
- Simple Icons 16.31.0, collaborators: 14 icons, CC0-1.0.
- Tabler 3.46.0, Paweł Kuna: 106 icons, MIT.

Full license texts, metadata, hashes and source URLs are bundled. IconPark and Lucide license snapshots are commit-pinned; do not invent an unavailable release tag. The current development lock resolves a newer Iconify package; this is not the source version verified for the existing icon subset. Iconify package MIT does not override source-set licenses.

## Flags

All 258 unchanged SVGs are exact Twitter Twemoji v14.0.2 graphics, commit `7a3dad4a4da30497093dab22eafba135f02308e1`. Copyright Twitter, Inc. and other contributors; graphics licensed CC BY 4.0: https://creativecommons.org/licenses/by/4.0/ . Source: https://github.com/twitter/twemoji/tree/7a3dad4a4da30497093dab22eafba135f02308e1/assets/svg . No graphic modifications; local filenames map regional-indicator sequences to two-letter codes. Per-file manifest and full original graphics license are included.

## Geographic data and images

Natural Earth `ne_110m_admin_0_countries`, repository v5.1.2 / layer version 5.1.1, public domain. Source coordinates and ring order match all 177 countries. Conversion preserves feature order, uses ISO_A2_EH and flattens MultiPolygon one level; no rounding or coordinate transformation. Attribution: Made with Natural Earth. Public-domain declaration is included.

Blue Marble/night/topology/water images exactly match three-globe commit `a868dbf5636b8db153d92662f00560415bb9be0a`. Three-globe MIT is captured only as repository licensing evidence, not permission from an unidentified original image producer. Exact NASA product attribution is still unverified. The WebP can be reproduced exactly from the JPG using Pillow 12.3.0/libwebp 1.6.0, quality=82, method=6; encoding reproduction does not establish rights.

## Logos and remaining artwork

Four specialist source findings among 33 logos:

- TablerHelp: matches `tabler:help` geometry, MIT (full notice bundled); SVG wrapper/style differs.
- AlibabaCloud: exact LobeHub bytes, MIT, Copyright (c) 2023 LobeHub; trademark permission is separate.
- OpenWrt: exact Simple Icons bytes, CC0; trademark conditions separate.
- Gentoo: exact Commons image, Lennart Andre Rolland, CC BY-SA 2.5. Source https://commons.wikimedia.org/wiki/File:Gentoo_Linux_logo_matte.svg ; license https://creativecommons.org/licenses/by-sa/2.5/ . No image modification. Retain attribution and applicable share-alike terms; Gentoo identification/trademark policy needs independent review.

Historical group findings below are retained for audit comparison, not current-candidate claims. See CANDIDATE_NOTICES.md and candidate-transitions.json for current replacements: official NASA day/night, Natural Earth mask, neutral bump, approved favicon, accepted upstream default background and freshly captured mock screenshots. Uncertain logos and legacy captures are absent. Original private history and Releases remain blocked separately.

## Libraries and trademarks

Three.js 0.184.0, globe.gl 2.46.2, Cobe 2.0.1 and transitive three-globe retain their package licenses. Dependency SBOM is separate from image ownership evidence.

Product, operating-system, cloud-provider and service names/logos are their respective owners' trademarks. Identification does not imply affiliation, sponsorship or endorsement. Open-source/CC0 copyright licensing does not grant trademark rights.
