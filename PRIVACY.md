# Privacy and visitor audit

Starfield can submit a limited visitor-audit event to the Komari server. The feature is disabled by default (`visitor_audit_enabled=false`). When disabled, the theme returns before fingerprint collection, WebRTC construction, or audit submission; `scripts/check-privacy-gate.mjs` enforces this invariant in CI.

When an administrator enables visitor audit, page/route context and a security profile may include screen and viewport dimensions, language, timezone, hardware concurrency, device memory, network effective type/downlink/RTT, WebGL vendor/renderer, and summarized WebRTC candidate characteristics. The server independently records IP address and User-Agent. The data is used for abuse investigation and operational security, not advertising.

Komari currently retains audit records for 30 days. An administrator can review records in the audit panel, disable future collection, and delete records through the server's administrative facilities. Administrators are responsible for providing any notice or consent required in their jurisdiction.

GeoIP enrichment, if enabled by the Komari server, is a server-side operation and may contact the GeoIP provider configured by that server. Starfield does not send audit data to an independent analytics vendor.
