# Third-Party Notices

Starfield is derived code, not a license grant over all independent artwork. Preserve this notice and `docs/asset-evidence/licenses/` in source and binary distributions.

## Theme code

- sanrokamlan-prog and towersip Glassmorphism: MIT, Copyright (c) 2025 Tony Liu (tonyliuzj, tony-liu.com).
- Tokinx Emerald: MIT, Copyright (c) 2026 Tokinx.

Original full MIT notices are bundled under `docs/asset-evidence/licenses/` for each named upstream. The project `LICENSE` does not replace those copyright lines.

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

NASA Blue Marble 2002 day texture is the official land_shallow_topo_2048.jpg product, converted to lossless WebP without resize or color changes; exact hashes and complete credits are in NASA_TEXTURE.md. NASA Black Marble 2016 night texture is the official unchanged 3600×1800 JPEG credited to NASA Earth Observatory/Joshua Stevens with Suomi NPP VIIRS data from Miguel Román. Exact source URL, hash and media-policy link are in CANDIDATE_NOTICES.md. Neither image is claimed as original project artwork or licensed through three-globe MIT.

Water mask derives from pinned public-domain Natural Earth geometry; the constant neutral bump does not claim real elevation. Recipes remain in scripts/generate-candidate-assets.py. NASA imagery is informational visualization, not a NASA trademark/endorsement grant.

## Logos and remaining artwork

Current standalone identifiers:

- TablerHelp: matches `tabler:help` geometry, MIT (full notice bundled); SVG wrapper/style differs.

- Gentoo: exact Commons image, Lennart Andre Rolland, CC BY-SA 2.5. Source https://commons.wikimedia.org/wiki/File:Gentoo_Linux_logo_matte.svg ; license https://creativecommons.org/licenses/by-sa/2.5/ . No image modification. Retain attribution and applicable share-alike terms; Gentoo identification/trademark policy needs independent review.

All other standalone system/vendor artwork is replaced by an original generic terminal/monitor identifier and textual OS names. The current default background is EvgeniT's Pixabay photograph 2341762, Published May 25, 2017, CC0-1.0 under Pixabay Terms §4 (not MIT or our original photography). See docs/asset-evidence/pixabay-2341762.json and retained full item/terms evidence. The former procedural starfield remains MIT historical artwork with its generator and creation records unchanged. The favicon is original geometric Earth artwork, MIT. Documentation screenshots and visual baselines use fixed synthetic data.

## Libraries and trademarks

Three.js 0.184.0, globe.gl 2.46.2, Cobe 2.0.1 and transitive three-globe retain their package licenses. Dependency SBOM is separate from image ownership evidence.

Product, operating-system, cloud-provider and service names/logos are their respective owners' trademarks. Identification does not imply affiliation, sponsorship or endorsement. Open-source/CC0 copyright licensing does not grant trademark rights.
