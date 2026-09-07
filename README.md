## v0.44.0 — UI consolidation and redundancy audit

- Reduced unnecessary vertical space in the Welcome admin dashboard without shrinking readable text or touch targets.
- Simplified repeated Welcome guidance to one concise instruction.
- Kept the single canonical Guest Preview action and tightened its readiness card layout.
- Removed obsolete navigation remnants left behind by the global navigation migration.
- Removed several unreferenced legacy helper functions from the runtime to reduce overlapping/dead code.
- No change to IndexedDB photo storage, backup v11, Firebase/shared-data state, audit photos, QR touchpoints, or public Welcome behavior.

## v0.43.1 — Welcome action cleanup

- Removed the redundant bottom `Open Guest Welcome Preview` action.
- `Preview guest view` in Villa Welcome Status is now the single canonical owner preview action.
- Canonical preview now saves property, unit and category visibility before rendering.
- Removed obsolete CSS/event-handler code for the duplicate preview control.
- Added validator coverage to prevent duplicate Guest Preview actions returning.

## v0.43.0 — UI cleanup / unified app bar

- Consolidates owner/admin page navigation into one global Back/Home route control; removes obsolete per-screen and per-panel copies.
- Guest Preview emergency Help now shares the same safe-area-aware top row on the right, eliminating overlap with Back/Home.
- Adds consistent top clearance so fixed controls do not cover property branding, screen titles or A5 controls.
- Removes redundant navigation listeners and the old Home-return helper while preserving the same session route stack and Safari fallback.
- Keeps modal Close/Cancel controls local by design and keeps all owner/admin navigation out of the public Welcome page.
- No IndexedDB/localStorage clearing; backup v11, audit photos, Firebase bridge and Safari Blob hardening are unchanged.

## v0.42.1 — Deep navigation audit / global route controls

- Replaces fragmented screen-specific Back/Home controls with one fixed internal Papa Golf navigation cluster.
- Back is visible on every non-home page-level route and walks the Papa Golf session route stack; Home always returns to Photos/Home.
- On Home, Back appears only when there is an in-app route to return to; Home itself is hidden because the user is already there.
- Covers Photos/Home return, Map, Areas, Welcome admin, Guest Preview home, every Guest Preview detail panel, and A5 preview.
- Existing modal/dialog workflows keep their explicit Close/Cancel controls; public standalone Welcome pages remain free of owner/admin navigation.
- Adds layout clearance so the fixed navigation cannot be hidden behind the iPhone safe area, guest Help button, or app header.

## v0.42.0 — Navigation normalization + Property Audit photos/reports

- Standardizes round Back + Home controls across Welcome admin, Guest Preview and A5 preview.
- Main Photos/Map/Areas tab changes now participate in Papa Golf route history.
- Property Walkthrough touchpoints can capture an iPhone camera photo or choose an existing image.
- Audit photos are private, compressed locally, stored in a dedicated IndexedDB asset store and never published to guests automatically.
- Touchpoint cards show their audit photo.
- Adds a manager-facing Property Information Upgrade report with photo, proposed QR destination, sticker wording, QR and live demo link.
- Report can be printed/saved as PDF.
- Backup format v11 includes private audit photo assets; Firebase/API/auth secrets remain excluded.
- Existing photo DB, Safari Blob hardening, shared Welcome, Firebase security and QR deep links remain intact.

## v0.41.1 — Home return navigation fix

- Fixes the navigation continuity bug found in iPhone testing: after using Home, the landing screen now shows a compact round Back button when there is a Papa Golf route to return to.
- The Home jump remains reversible without relying on Safari browser history.
- The Back control disappears automatically when there is no in-app history, keeping the true landing state uncluttered.
- Existing Guest Preview Back/Home controls, public guest separation, reorder behaviour, Shared Data, QR touchpoints and storage protections are unchanged.

## v0.41.0 — Contextual Back/Home navigation + Welcome density polish

This update fixes the owner Guest Preview navigation dead-end and establishes a reusable Papa Golf navigation foundation.

### Owner Guest Preview navigation
- Replaces the large text “Edit Welcome” control with two compact round controls at top-left:
  - Back: returns through Papa Golf’s own in-app route history.
  - Home: jumps to the main Papa Golf Photos landing screen.
- Back and Home use 44–46px touch targets and remain visible while scrolling.
- Navigation history is kept in sessionStorage only; it contains route names, not guest/property data.
- Back from a guest detail returns to the guest menu; another Back returns to Welcome admin.
- Home is itself reversible with Back, so a user can jump home and return to where they were.
- A refresh/restore fallback prevents an owner Guest Preview from becoming a dead-end even if Safari restores the preview DOM state without the JS route state.
- Standalone public Welcome pages do not receive owner/admin Back or Home controls.

### Quick Essentials
- Owner Guest Preview Quick Essentials rows are significantly more compact without shrinking readable text.
- The public Welcome page gets the matching density treatment.
- Wi-Fi, location and host remain large enough for comfortable iPhone taps and now use consistent chevrons.

### Preserved
- v0.40 Property Walkthrough / QR Touchpoints.
- Reorder persistence and tactile lift/reflow.
- Help & Emergency protection.
- Firebase Shared Data setup assistant and security model.
- Backup v10, IndexedDB/photo data, Safari Blob hardening and Brand Kit asset protections.

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

### v0.44.3
Property Walkthrough field workflow: touchpoints can now be edited after capture and tracked as Proposed, Approved or Installed. Manager reports include status. Existing private audit-photo storage and backup protections are preserved.


### v0.44.4
- Hardened manager-report navigation on iPhone: local Back + Home remain available while the modal report is open.
- Added persistent magnifier minus/plus report zoom (80–120%); the selected scale also carries into Print / Save PDF.
- Rebuilt narrow-screen manager-report cards so photo, proposal copy and QR demo stack cleanly instead of squeezing copy into a narrow column.
- Added full-height iPhone report dialog with safe-area-aware sticky controls and explicit Escape/cancel handling.
- Added guest-safe Back + Welcome/Home controls on every public Welcome detail page, including direct QR deep links.
- Strengthened A4 print grid sizing and break-inside protection for audit opportunity cards.
- Extended validation coverage for report navigation, zoom, mobile layout and print safeguards.
