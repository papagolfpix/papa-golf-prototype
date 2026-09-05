## v0.36.0 — Welcome data-model consolidation / final local Alpha foundation

This release prepares the Welcome module for the next major milestone: moving the source of truth from one browser into a shared Papa Golf backend.

### What changed
- Added a canonical Welcome schema (`papa-golf-welcome`, schema version 1) with stable IDs for Property, Unit and Gateway records.
- Existing local Welcome data is migrated in place; no photo database, IndexedDB store or localStorage collection is deleted.
- Added `buildCanonicalWelcomeModel()` to assemble a backend-ready graph of Property → Unit → Gateway → Content → Services → Events → Places → Categories while preserving the current local Alpha storage layout.
- Backup format is now v9 and includes the consolidated canonical Welcome model. Restore remains backward compatible with v1–v9 backups.
- Public Welcome payload moved to compact payload v3 with an explicit schema version while retaining the current URL-fragment Alpha publishing method.
- Added a structured **Stay Details** section for information classes confirmed by the Apsara hotel benchmark: check-in/out, facilities/opening hours, property map/wayfinding and important notices.
- Stay Details appears on Guest Preview and the standalone public Welcome only when useful content exists.
- Existing What’s On, services, nearby places, Gateways, QR publishing, progressive disclosure and iPhone-first UI remain intact.

### Why this matters
The current app still runs as a safe local Alpha, but the data is now organized around stable entities and relationships suitable for a shared backend. The intended next acceptance test is: edit Magic Dragon Villa on the owner phone, refresh a second device, and see the update through the same permanent QR without regenerating its payload.

### Safety / validation
- No `indexedDB.deleteDatabase()` or `localStorage.clear()` added.
- Safari main/related photo Blob hardening retained.
- Affiliate Brand Kit asset DB and backup path retained.
- Google Places API key remains excluded from public Welcome payloads and backups.
- `node --check app.js`, `node --check welcome.js`, Papa Golf validator and ZIP integrity checks pass.
