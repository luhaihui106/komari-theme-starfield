#!/usr/bin/env bash
set -euo pipefail
ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$ROOT"

bun_cmd=${BUN:-}
if [[ -z "$bun_cmd" ]]; then
  bun_cmd=$(command -v bun || true)
fi
if [[ -z "$bun_cmd" && -x "$HOME/.bun/bin/bun" ]]; then
  bun_cmd="$HOME/.bun/bin/bun"
fi
[[ -n "$bun_cmd" ]] || { echo 'bun is required' >&2; exit 1; }

"$bun_cmd" install --frozen-lockfile
"$bun_cmd" run lint
"$bun_cmd" audit --audit-level=high --ignore GHSA-pqg4-j6r4-53mv --ignore GHSA-vfj7-8cjw-p6xm --ignore GHSA-5gmw-xhrv-c9v3 --ignore GHSA-85c8-ppgw-ccpr --ignore GHSA-68fv-2mgg-jv7q
node scripts/check-privacy-gate.mjs
node scripts/check-asset-provenance.mjs "${1:-}"
node scripts/generate-sbom.mjs
node -e "JSON.parse(require('node:fs').readFileSync('GlassEmerald.spdx.json'))"

if git grep -IEn \
  '(github_pat_[A-Za-z0-9_]{20,}|ghp_[A-Za-z0-9]{20,}|-----BEGIN (RSA |OPENSSH |EC )?PRIVATE KEY-----|[0-9]{8,10}:[A-Za-z0-9_-]{30,})' \
  -- . ':(exclude)scripts/security-gate.sh' >/dev/null; then
  echo 'credential-shaped content found in tracked files' >&2
  exit 1
fi
printf 'security gate: PASS\n'
