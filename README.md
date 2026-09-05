## v0.36.1 — Welcome publishing controls + permanent Help foundation

This pre-backend refinement separates **owner publication state** from whether content exists. Guest-facing sections can now stay saved while being hidden from guests, and content editors have explicit Clear actions where deletion is appropriate.

### Added
- Backend-ready `presentation` policy metadata on the Welcome unit model.
- Owner **Show to guests** controls for Villa Guide, Stay Details, What’s On, Explore Nearby, Food, Transport, Wellness, Tours and Other Guest Services.
- **Clear details** actions for Villa Guide, Stay Details, individual guest services and the What’s On schedule. Clear actions require confirmation and only remove that category’s content.
- Public Welcome payload v4 carries publication state so Guest Preview and another device behave the same way.
- A permanent compact **Help** button at the top of guest Welcome screens.
- Help & Emergency is now a system-level item that remains available regardless of future guest personalization.
- First emergency-routing scaffold: Medical/Health, Fire/Property Emergency, Police/Security and Host/Property Help, using the property’s existing verified/entered contact information rather than inventing public-service numbers.

### Architecture
- Welcome schema version is now 2.
- Presentation policies distinguish `customizable` guest categories from `system` navigation.
- This is designed to map directly into the shared backend and later Guest Preference Profile without mixing owner publication controls with guest personalization.

### Safety
- Existing local Welcome content is migrated in place with all new sections defaulting to published, preserving current guest behaviour.
- No IndexedDB database deletion or localStorage clearing.
- Existing photos, nested related-photo Blob hardening, Brand Kit assets, backups and Google Places key handling are unchanged.
