## v0.40.0 — Property walkthrough & physical QR touchpoints

- Added a private **Property Walkthrough · QR Touchpoints** tool under Gateways & A5 / QR.
- During a hotel/villa walkthrough, Papa Golf can now record the physical location, existing sign/menu/poster, intended digital destination, sticker wording, priority and notes.
- Each touchpoint generates a working QR preview and a deep link to the exact Welcome section: Wi‑Fi, Villa Guide, Nearby, Stay Details, What’s On, Food & Drink, Wellness, Tours, Transport, or Help & Emergency.
- Public Welcome now understands the `s=` section parameter for direct physical-to-digital entry while retaining the same canonical Welcome data.
- Touchpoint records are private admin data and are now included in Papa Golf backup **v10**. Firebase credentials/auth remain excluded.
- Existing photo IndexedDB, Safari Blob hardening, Shared Data, guest ordering, Welcome presentation controls and Help protections remain unchanged.
- This lays the operational foundation for the planned property-audit workflow: **Property Audit → Physical Touchpoint → QR Origin → Digital Destination → Guest Action → Attribution**.

## v0.39.2 — Tactile Welcome reorder

- Reorder handles now lift the selected Welcome row above the list with a stronger border, subtle enlargement and shadow.
- The dragged row follows the finger instead of only swapping after release.
- A visible landing gap moves through the list while neighbouring rows animate smoothly out of the way.
- Release settles the row into the displayed gap and preserves the existing local guest order.
- Added gentle edge auto-scroll for longer lists while dragging.
- Help & Emergency remains a protected system item and cannot be reordered.
- Same interaction is used in owner Guest Preview and standalone public Welcome.
- No IndexedDB/localStorage clearing; existing photo, Welcome, Brand Kit and Shared Data protections remain intact.

## v0.39.1 — Welcome slim-list density polish
### What changed
- Reduced guest Welcome row height and inter-row spacing by about 20% while keeping 17px titles and 13px secondary text.
- Normalized the What’s On summary so “1 activity today” uses the same secondary text size as every other row.
- Preserved separate › open and ≡ reorder controls with 44px drag touch targets.
- Applied the same density rules to owner Guest Preview and the standalone public Welcome page.
- No IndexedDB, photo, Welcome, Firebase, or localStorage data is cleared or migrated.


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