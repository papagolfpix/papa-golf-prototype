## v0.38.0 — Secure shared-data setup assistant

This update turns the Firebase bridge into a guided, safer owner workflow while retaining the Local Alpha fallback.

### New
- Four-step Shared Data setup assistant: Connect Firebase → Owner identity → Secure rules → Publish.
- Papa Golf creates/tests the Firebase anonymous owner identity and displays the exact UID.
- Papa Golf generates Firestore rules locked to that exact owner UID.
- Public Gateway access uses `get` only; Firestore collection listing is explicitly blocked.
- One-tap copy for Owner ID and secure Firestore rules.
- Human-readable diagnostics for Anonymous Auth disabled, invalid Web API key, missing Project ID, and Firestore permission failures.
- Publishing remains disabled until Firebase settings and the local owner identity are ready.
- Successful publish promotes the Gateway to Shared Beta and retains one permanent URL/QR for future republishes.

### Safety
- Existing IndexedDB `papa-golf-v01`, photo records, related-photo Blob hardening, Welcome localStorage, Brand Kit asset DB and backup v9 remain intact.
- No IndexedDB deletion or `localStorage.clear()` is introduced.
- Firebase Web API key stays local to the admin browser settings and is not included in Papa Golf backups or public Welcome payloads.
- Do not clear Safari website data after binding Firestore rules to the temporary Anonymous owner UID. Named Papa Golf accounts are still the production target.
