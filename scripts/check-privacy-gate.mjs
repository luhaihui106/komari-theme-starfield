#!/usr/bin/env node
import { readFileSync } from 'node:fs'
import process from 'node:process'

const manifest = JSON.parse(readFileSync('komari-theme.json', 'utf8'))
const store = readFileSync('src/stores/app.ts', 'utf8')
if (!store.includes('publicSettings.value?.visitor_audit_enabled === true')) {
  console.error('visitor audit must be explicit opt-in, with absent/false settings disabled')
  process.exit(1)
}
for (const option of manifest.configuration.data.filter(item => item.key === 'visitorAuditEnabled')) {
  if (option.default !== false)
    throw new Error('visitor audit manifest default must be false')
}
const audit = readFileSync('src/composables/useVisitorAudit.ts', 'utf8')
const enabledGuard = audit.indexOf('if (!enabled.value)')
const fingerprint = audit.indexOf('getVisitorSecurityProfile()')
const submit = audit.indexOf('submitVisitorAuditEvent(')
if (enabledGuard < 0 || fingerprint < 0 || submit < 0 || !(enabledGuard < fingerprint && enabledGuard < submit)) {
  console.error('visitor audit privacy invariant failed: enabled guard must precede fingerprint collection and submission')
  process.exit(1)
}
if (!audit.includes('if (!enabled.value)\n      return')) {
  console.error('visitor audit disabled state must return without side effects')
  process.exit(1)
}
console.log('visitor audit disabled-state gate: PASS')
