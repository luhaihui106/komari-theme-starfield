# Original Earth favicon

The approved source is `original-earth-refined.svg`, SHA-256
`e0ed7ef98a8f88401a636070b0b7806d62bfc3cf37bc99fee79a44329bd10f5b`.

Created in 2026 by Hermes for the project owner, iterating the owner's blue
ocean, tilted day/night terminator and probe/network style. All continents,
gradients, node and arc are geometric SVG code; no third-party textures or
character artwork were used. The owner approved this exact design.

Project-original icon source and generated derivatives are distributed under
the repository MIT license. Attribution: Copyright (c) 2026 GlassEmerald
project contributors. This statement does not grant rights in previous icons.

Reproduce from repository root:

    python3 -m venv .favicon-venv
    .favicon-venv/bin/pip install CairoSVG==2.8.2 Pillow==12.0.0
    .favicon-venv/bin/python scripts/generate-favicon.py

The ICO contains 16, 32, 48, 64, 128 and 256 pixel frames. The touch icon is
180 by 180 PNG. The approved SVG is unmodified; render at 1024px then Lanczos
downsample. The generated size-check sheet is a review aid, not an application
asset. At 16/32px the globe silhouette remains identifiable, but fine probe
arcs and the precise terminator shape are necessarily less legible.

This change replaces only the current-tree browser favicon and touch icon.
It does not change an administrator account avatar or other UI artwork.
Historical commits and old release archives still contain the prior character
favicon, whose author/license remain unverified. No history rewrite or release
deletion has been performed, and repository visibility remains private.

PR16's original asset hash manifest and favicon entry describe the old icon.
When integrating the two independent PRs, explicitly reconcile the favicon
entry/hash with this source and derivatives; do not silently preserve an old
hash as evidence for the new icon, or mark other asset groups cleared. PR16
is not merged by this change. All unrelated public-release gates remain.
