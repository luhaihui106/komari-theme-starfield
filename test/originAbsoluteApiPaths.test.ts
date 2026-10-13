import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'

it('keeps production API and RPC endpoints origin-absolute under a theme base', () => {
  const rpc = readFileSync(new URL('../src/utils/rpc.ts', import.meta.url), 'utf8')
  const api = readFileSync(new URL('../src/utils/api.ts', import.meta.url), 'utf8')
  expect(rpc).toContain('const apiBase = import.meta.env.VITE_API_BASE ?? \'/api\'')
  expect(rpc).toContain('`$' + '{apiBase}/rpc2`')
  expect(api).toContain('import.meta.env.VITE_API_BASE ?? \'/api\'')
})
