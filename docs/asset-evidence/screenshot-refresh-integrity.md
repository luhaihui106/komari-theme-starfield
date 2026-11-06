# README screenshot inventory correction

## Evidence

Security run [40553663205](https://github.com/luhaihui106/komari-theme-starfield/actions/runs/40553663205)
failed at `Original asset changed: docs/screenshots/desktop.png` on
`757ac79c1b018290da533d4958e2c4914964f9ae`.

That commit, authored by the repository owner, explicitly refreshed the desktop
and mobile Starfield previews. It changed only README.md and those two images.
The README describes v0.1.12 application renders using fictional demonstration
nodes, metrics and city locations; the mobile image is a Chromium viewport
simulation, not physical Safari testing. Both images were inspected: they show
the Starfield demo title, example IPv6 address and demo node cards. This is not
new visual approval, deployment evidence or independent reproduction of capture.

The existing manifest was unchanged by that commit. Its two screenshot hashes
exactly match the corresponding image bytes in the parent commit. A full
inventory comparison found only these two mismatches. Thus this correction
records the already committed documentation refresh; it does not replace assets
or weaken the verifier.

## Exact transition

- `docs/screenshots/desktop.png`
  - Previous SHA-256: `c9a8ce553feb98bacc9b4d70461f2b57d9d702e7a28f3c3324880e2a69e8d4bb`
  - Current SHA-256: `f06f540bfe3987c20bb007da47d211a0310315746bafcfd2ebf18f22aaefd7e7`
- `docs/screenshots/mobile.png`
  - Previous SHA-256: `f5801c0f8ec5e52352179fa687f81d411adb56d779c023eeba12e9fb5a9d38a6`
  - Current SHA-256: `0d0e67a0240ba750ae17e5a6679e0b16d21a38ceb0e05657ba389e1ddee5d782`

Only these two entries in `candidate-current-manifest.json` are updated.
Historical evidence and all other hashes remain unchanged. Run
`node scripts/check-asset-provenance.mjs --public` and
`./scripts/security-gate.sh --public` to validate the current snapshot.
Future intentional screenshot refreshes must update the current inventory in
the same change after reviewing source/capture evidence; never regenerate the
whole inventory blindly to silence an unexplained mismatch.
