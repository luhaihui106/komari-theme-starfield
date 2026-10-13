# Dependency audit exceptions

`bun audit` remains blocking for high/critical findings. The security gate temporarily ignores only these exact advisories, all in development/build tooling or a browser-only transitive dependency; none is shipped as executable server code:

- `GHSA-pqg4-j6r4-53mv`: `shell-quote` via `npm-run-all2`; package scripts use fixed repository strings, not untrusted tokens.
- `GHSA-vfj7-8cjw-p6xm`: `braces` through build/watch tooling; CI uses fixed repository globs.
- `GHSA-5gmw-xhrv-c9v3`, `GHSA-85c8-ppgw-ccpr`: `tinypool` through formatter tooling; no untrusted worker options are accepted.
- `GHSA-68fv-2mgg-jv7q`: `source-map-js` through Vue/Vite build dependencies; CI builds trusted repository sources.

Remove each exception as soon as the locked dependency graph contains a patched transitive version. New advisories are not ignored and fail CI.
