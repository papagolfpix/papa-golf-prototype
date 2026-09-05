## v0.37.0 — Shared Data bridge + permanent Welcome identity

This build starts the transition from Papa Golf's local Alpha to a genuine shared platform without disturbing existing local data. It adds a backend adapter and permanent Gateway identity while retaining the existing snapshot QR as a safe fallback.

### Added
- New **Shared Data** owner section with live status, stable Gateway ID and backend connection controls.
- Firebase REST adapter for the first shared-data test. Connection values remain local to the owner's browser; no private/service-account credential is accepted or bundled.
- Anonymous Firebase owner session support with token refresh, designed for prototype owner writes under restrictive Firestore rules.
- **Publish Current Welcome** action writes the current guest-facing Welcome payload to `papaGolfGateways/{gatewayId}`.
- A successful shared publish activates a **permanent Welcome URL** using only the stable Gateway ID and Firebase project ID.
- Public `welcome.html` can now load either the existing `#d=` snapshot payload or a live shared `#g=...&p=...` Gateway record.
- A5/public QR generation automatically keeps using the safe snapshot URL until a shared publish succeeds; after that it switches to the permanent shared URL.
- Existing Show/Hide policies and Help system are carried into the shared payload unchanged.

### Architecture
- Local Alpha remains the source of truth until the owner explicitly publishes.
- The backend document stores the compact guest-facing payload, stable Gateway ID, owner UID, schema version and update timestamp.
- Owner authentication and guest public reads are deliberately separated so future real user accounts can replace anonymous prototype ownership without changing the public Gateway identity.
- Guest personalization remains a separate future profile layer; it is not mixed into property content or owner publication state.

### Safety
- No IndexedDB database deletion or localStorage clearing.
- Existing photos, nested related-photo Blob hardening, Brand Kit assets, backup v9 and Google Places key handling remain unchanged.
- v0.37.0 does **not** require Firebase to keep using Papa Golf. Until Firebase is configured, the current cross-device snapshot QR/link continues to work exactly as before.

See `FIREBASE_SETUP.md` when ready to connect the first shared backend.
