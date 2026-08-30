# Papa Golf Platform Prototype — v0.18


A deliberately small, iPhone-first prototype for the Papa Golf Platform.

## Current scope

1. Select or take one or more photos on iPhone.
2. Extract available image metadata in the browser:
   - filename
   - taken date/time (EXIF when present)
   - dimensions
   - file size
   - GPS latitude/longitude (EXIF when present)
   - camera/device make and model (EXIF when present)
3. Fill in configurable custom fields.
4. Save the photo and its record locally using IndexedDB.
5. View saved photos in a simple gallery.
6. Add/remove custom fields without changing source code.

## Important v0.4 limitation

There is **no cloud backend yet**. Photos saved by Millie on her iPhone remain on that iPhone/browser. This is intentional for the first prototype so the user flow can be tested before adding accounts, cloud storage, shared access, mapping, QR, or other modules.

## iPhone notes

- Tested design target: current iPhone Safari.
- The upload control accepts both the Photos library and camera options offered by iOS.
- iOS may omit GPS/location EXIF depending on the photo and the user's Photos sharing/privacy options. The app displays `Not found` rather than fabricating a location.
- IndexedDB data belongs to the browser/site. Clearing Safari website data can remove prototype records.

## Run locally

This is a static site with no build process.

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080` on the computer running it.

For an iPhone, deploy it to an HTTPS host such as GitHub Pages, Netlify, Cloudflare Pages, or similar. GitHub Pages is sufficient for v0.4 because storage is local to the browser.

## GitHub Pages

1. Create a GitHub repository.
2. Upload all files in this folder to the repository root.
3. In GitHub: **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select the `main` branch and `/ (root)` folder.
6. Save and open the generated HTTPS URL on the iPhone.

## Suggested next module — v0.4

Add cloud storage and a shared database so Millie's uploads are visible from another device. The current UI and record structure can remain; only the storage adapter needs to change.


## v0.4
- Saved photo cards are tappable on iPhone.
- Full-screen detail view shows all populated custom fields and photo metadata.
- GPS coordinates open Apple Maps.
- Location name is shown on the gallery card.
- Existing v0.1 IndexedDB records remain compatible.


## v0.4 additions
- Tap **Edit** from a saved photo record to change custom fields.
- Extracted photo metadata remains read-only.
- GPS coordinates now open in Google Maps.
- Existing IndexedDB records from v0.1/v0.2 remain compatible.


## v0.4 storage-safety additions

- Keeps the existing IndexedDB name and photo-store schema so normal upgrades do not intentionally recreate the database.
- Shows the number of locally saved records.
- Export Backup downloads a JSON backup containing photo files, extracted metadata, custom-field values and field configuration.
- Restore Backup merges records by ID and never clears existing records first.
- Clear All now requires two confirmations.
- GPS links continue to open Google Maps.
- Photo records remain editable while extracted metadata stays read-only.

For prototype testing, export a backup before replacing application files or making major changes. Browser-managed storage should not be treated as the sole permanent copy.


## v0.5 fix

Fixes the iPhone detail-view image placeholder that could appear immediately after editing and saving custom fields. Editing no longer recreates/revokes the photo object URL; the image blob remains untouched while the text and metadata view refreshes.


## v0.5 Map module

- Adds Photos / Map tabs.
- Any saved photo with GPS metadata appears automatically as a map pin.
- Tap a pin to see the photo thumbnail, title and location.
- Open the full Papa Golf photo record from the pin popup.
- Open the exact coordinates in Google Maps.
- The embedded prototype map uses OpenStreetMap/Leaflet and requires no API key.
- Existing IndexedDB photo records remain unchanged.

## v0.5.1 iPhone map patch

- Waits for the Map tab to finish layout before initializing/resizing Leaflet.
- Forces Leaflet to recalculate its viewport before fitting pins.
- Re-fits a single photo pin after Safari finishes painting the map.
- Fixes the custom marker positioning.
- Keeps all existing IndexedDB photo records unchanged.

## v0.5.2 map rendering patch

The previous iPhone failure was caused by Leaflet JavaScript loading without
the matching external Leaflet CSS being applied. v0.5.2 bundles the required
Leaflet core CSS inside `styles.css`, so the tile grid, controls, markers,
panning and popup layout no longer depend on the external stylesheet.

## v0.6 configurable fields

Adds field types: short text, long text, number, date, yes/no, single choice,
multiple choice, 1–5 rating, URL/website and phone number. Fields can be marked
Required. Choice fields accept user-defined options, one per line. Existing
field configuration and photo records are retained.

## v0.6.1 choice-field bug fix

- Single-choice fields now save and display only the selected option.
- Multiple-choice fields now save and display only selected options.
- Rating and Yes/No values are validated before saving/displaying.
- Edit mode restores the correct previously selected values.
- Adds compatibility repair for v0.6 records that may contain the full option list.
- Existing photo records and IndexedDB storage are preserved.

## v0.6.2 actual choice-list fix

Root cause fixed: field choices entered one-per-line were being stored as one
single option containing newline characters. v0.6.2:

- splits real line breaks correctly when saving choice lists;
- repairs already-saved v0.6/v0.6.1 field configurations automatically;
- repairs legacy single-choice record values containing the entire list;
- normalizes legacy values before detail display and edit mode;
- leaves the photo database and image blobs untouched.

## v0.6.3 iPhone cache fix

The v0.6.1/v0.6.2 JavaScript fixes were not reliably reaching Safari because
`index.html` continued loading `app.js?v=0.5`. v0.6.3:

- changes the script URL to `app.js?v=0.6.3`;
- changes the stylesheet URL to `styles.css?v=0.6.3`;
- disables stale HTTP caching for service-worker fetches;
- forces the service worker to update with `updateViaCache: 'none'`;
- keeps the corrected single-choice/multiple-choice normalization from v0.6.2.

## v0.7 Areas + GPS-specific locations

Adds a lightweight hierarchy without rewriting the photo database:

- New optional `Area / Place` field.
- Existing `Location name` remains the specific point/location.
- New `Areas` tab groups photo/location records by broader area.
- Existing records remain valid and simply appear ungrouped until an Area / Place is assigned.
- Map pins remain based on each individual photo's GPS metadata.
- Tapping a location inside an Area opens the existing full photo record.

## v0.8 Search + filters
Live text search plus Area / Place, Location, Category, minimum rating and GPS-only filters. Filters apply to Photos, Map and Areas views without changing stored records.

## v0.8.1 rendering fix

v0.8 referenced the `filtered()` helper without including the search/filter helper block in `app.js`.
That caused the library renderer to stop before displaying existing IndexedDB records.

v0.8.1:
- restores the missing search/filter helper functions;
- leaves IndexedDB and saved photo blobs untouched;
- cache-busts app.js and styles.css;
- keeps Photos, Map and Areas filtering consistent.

## v0.8.2 map filter fix

The Photos and Areas views were using the active filter state, but renderMap()
was still reading every saved record directly. The Map now applies the same
`filtered()` record set before placing GPS pins.

## v0.9 Map Experience

- Category-specific map markers.
- Persistent location-name labels beside pins.
- Standard / Satellite map switch.
- Locate me control using browser geolocation.
- Temporary 'You are here' marker plus GPS accuracy circle.
- Fit Pins can include both filtered Papa Golf pins and the user's current location.
- User location is never written to Papa Golf storage.
- Existing photo records and filters remain unchanged.

## v0.9.1 saved-location marker fix

v0.9 accidentally removed the existing `mapMarkerIcon()` and `popupNode()` helper
functions while replacing the map initialization block. The map base layers and
Locate Me feature therefore worked, but saved GPS records could not create markers.

v0.9.1 restores the saved-location marker/popup path and adds:
- category-specific marker symbols;
- persistent Location name labels beside saved-location pins;
- existing photo popup, Photo details and Google Maps actions;
- no changes to IndexedDB, stored photos, filters, Satellite or Locate Me.

## v0.10 Public / Visitor Preview
Adds a mobile-first Visitor view for any saved record. It hides all admin/upload/edit/backup controls and presents the photo, title, category, Area / Place, specific location, description, populated custom fields, location map, Google Maps link, and optional temporary visitor phone location. This is preview-only; permanent public URLs and QR publishing come next.

## v0.11 First public page + QR prototype
Adds `Publish QR` to saved records. It generates a standalone mobile visitor HTML page containing the selected record's photo and public information, calculates the permanent GitHub Pages URL from the current repository path, displays a QR code for that URL, and downloads the page as `<slug>.html`. Upload that generated HTML file to the repository root and commit it; after GitHub Pages publishes, the QR opens the visitor page from any phone. This is intentionally manual for the first end-to-end test before automating publishing.

## v0.11.1 iPhone public-page export fix

iOS Safari may silently ignore programmatic Blob downloads for generated HTML files.

v0.11.1 changes `Download public page` to `Create public page` and:
- uses the iPhone native Web Share sheet with a real `.html` file when supported;
- lets the user choose `Save to Files`;
- keeps a normal download fallback for desktop/other browsers;
- adds an `open generated page` fallback if the browser still refuses the download.

## v0.11.2 iPhone publish feedback/fallback
The Create public page control now gives immediate visible feedback, changes to Creating… while working, exposes an Open generated page fallback before attempting file sharing, and uses the iPhone Share sheet when available. If file sharing is unavailable, the generated page can be opened and saved through Safari's Share menu instead of failing silently.

## v0.11.3 public-page generator fix

Restores the missing `escapeHtml()` helper used by the standalone public-page
generator. No changes to IndexedDB, photos, QR URL generation, visitor view,
map, filters, or export/share logic.

## v0.12.1 safe publication-status patch

Rebuilt from the known-good v0.11.3 baseline after v0.12 stopped displaying the existing library.

This patch deliberately does not modify:
- IndexedDB name or schema;
- getRecords/renderGallery;
- photo blobs;
- map/filter code;
- backup/restore code.

It only adds Draft / Published / Published · update needed metadata and a public-page link inside the detail view.

## v0.12.2 detail-opening fix

v0.12.1 restored the photo library but referenced `renderPublicationStatus()`
without including its helper functions. Tapping a photo therefore threw a
JavaScript error before the detail dialog opened.

v0.12.2 restores those display-only helpers. It does not modify IndexedDB,
photo blobs, gallery loading, maps, filters, backup/restore or QR publishing.

## v0.12.3 Mark Published button fix

- Adds a dedicated IndexedDB write helper for publication metadata.
- Makes Mark published / Mark updated persist the publication state.
- Refreshes the detail status immediately.
- Re-renders the gallery after the publication state changes.
- Leaves photo blobs, record fields, gallery loading, map, filters, backup/restore and QR generation unchanged.

## v0.12.4 publication write fix

The Mark Published handler was using a non-existent `dbPromise` variable.
The rest of Papa Golf uses `openDb()`. v0.12.4 changes only the publication
write helper to use the existing `openDb()` database connection.

No changes to photos, gallery loading, maps, filters, visitor pages, QR generation,
backup/restore or IndexedDB schema.

## v0.12.5 Safari Blob safety fix
Publishing a record was rewriting Safari's stored IndexedDB Blob directly. On iPhone the photo could still display, but a later metadata edit could fail with `The object cannot be found here`.

v0.12.5:
- materializes a fresh plain Blob before every publication write;
- uses the same safe materialization before metadata/custom-field edits;
- adds FileReader and blob-URL fallbacks if Safari rejects Blob.arrayBuffer();
- uses the safely persisted record as the active record after publishing;
- leaves field values, QR/public pages, gallery, map, filters and database schema unchanged.

## v0.13 Update Public Page
Published records that have changed now show `Update public page`. It reuses the existing published slug and URL, regenerates the same `<slug>.html` filename, and tells the user to replace that file in GitHub. No changes to photo storage, IndexedDB schema, maps, filters, QR URL generation, visitor view, or backup/restore.

## v0.14 One-Tap Publish Package

Public publishing now uses the same automated GitHub update pipeline as application updates.

- Publish / Update Public Page generates `papa-golf-update.zip`.
- The ZIP contains the correct existing public page filename, e.g. `pig-beach.html`.
- On iPhone, the Share sheet offers `Save to Files`.
- Upload only `papa-golf-update.zip` to the repository root.
- The installed GitHub Action extracts the HTML page, removes the ZIP, commits the result and triggers GitHub Pages.
- Existing QR URLs remain unchanged.
- No changes to photo storage, IndexedDB schema, maps, filters or backup/restore.

## v0.14.1
- Restores the missing Update Public Page click handler.

## v0.14.2
- Public-page ZIPs now use descriptive dated names such as `papa-golf-publish-pig-beach-20260828.zip`.
- Deployment workflow accepts Papa Golf publish ZIPs and iPhone duplicate-number filenames.

## v0.15
- Adds multiple supporting photos to an existing Papa Golf record.
- The original image remains the hero/main photograph.
- Supporting photos appear in the saved-record detail view.
- Supporting photos are embedded into the standalone public visitor page.
- Existing public slug, URL and QR remain unchanged when the page is updated.
- Tags continue to be plain comma-separated searchable labels; hashtags are not required.

## v0.16 — Equal-photo collection + filmstrip
- Reframes hero/supporting photos as a photo collection.
- The scanned/original image is the entry photo and opens first.
- A horizontal filmstrip appears beneath the large image.
- Tapping a thumbnail promotes that image into the large viewer without leaving the record.
- Standalone public pages use the same entry-photo + filmstrip interaction.
- Existing records, URLs, QR codes and stored supporting photos remain compatible.
- This establishes the UI foundation for future dynamic ranking by tags, filters, votes and engagement.

## v0.16.1
- Restores the complete application stylesheet while retaining the v0.16 filmstrip feature.

## v0.17 — First-class related photos
- Related photos are stored as structured photo objects rather than bare gallery blobs.
- Each related photo has its own ID, original filename/blob, title/caption, story/notes, tags and role.
- Photo roles: Featured / Sellable, Standard, Context / Filler.
- Context / Filler images remain available for storytelling but are marked for suppression from future lead/print ranking.
- Existing v0.15/v0.16 blob-only related photos are normalized for backward compatibility.
- Adds smart-inheritance guidance for shared place/experience fields.
- Establishes the data foundation for later EXIF-per-photo extraction, votes, engagement and dynamic ranking.

## v0.17.1 — Active-photo viewer
- Selecting a filmstrip image now makes that photo the active large image.
- The active image is removed from the filmstrip; the previous active image returns to the strip.
- Active-photo title, story, tags, role and available metadata change with the selected image.
- Public visitor pages use the same swap behaviour.
- The QR/scanned entry image remains the initial active photo.

## v0.17.2
- Fixes a compatibility bug where the active-photo viewer looked for `record.imageBlob` instead of the existing record's `record.image`.
- The scanned/original image is again guaranteed to be the initial active image.
- Existing title, description, tags, capture date, GPS and filename are read from the established record fields/metadata.
- Keeps backward compatibility with both `image` and `imageBlob` photo objects.

## v0.17.3
- Prevents the entry photo's description/metadata from being shown simultaneously with a selected related photo's information.
- Entry photo shows the established record information; related photos show only their own title/story/tags/role/available metadata.
- Visitor View now supports the same active-photo + filmstrip interaction as the record detail viewer.
- The active visitor photo is removed from the filmstrip and the previous photo returns to it.

## v0.17.4
- Fixes the photo-card click regression introduced in v0.17.3.
- Declares the detail information section references used by the active-photo viewer.
- Restores opening a photo from the home-page library.
- Retains the v0.17.3 visitor filmstrip and active-photo information behavior.

## v0.18 — Papa Golf Welcome foundation
- Adds Property and Accommodation Unit data.
- Adds inherited shared fields with unit overrides.
- Adds a simple mobile Guest Welcome preview.
- Preserves existing Photo, map, QR and publishing workflows.

## v0.18.1
- Places the Welcome control in the visible main Photos / Map / Areas navigation row.

## v0.18.2
- Fixes Welcome navigation on the existing Photos/Map/Areas page structure.
- Opening Welcome now hides the photo interface and shows the Welcome editor at the top.
- Back restores Photos and the search tools.
- Welcome now uses the same visible tab styling as Photos, Map and Areas.

## v0.18.3
- Original and related active photos now use the same rounded corner radius.

## v0.18.4
- Forces the active image pixels to clip to the same 18px radius on all four corners in iOS Safari.

## v0.18.5
- Uses one identical active-photo rendering rule for original and related images.
- Removes the image border that was visually masking portrait-image corner rounding on iPhone Safari.

## v0.18.6
- Establishes an 18px Papa Golf photo radius across library, detail, related-photo, Visitor View and gallery displays.
- Applies the same rounded-photo design to newly generated standalone public pages.
- Keeps the visual treatment consistent across landscape and portrait photos on iPhone Safari.

## v0.18.7
- Visitor View hero photos now preserve their original aspect ratio; portrait photos are no longer square-cropped.
- Visitor hero photos receive a 16px page inset so the 18px rounded corners are actually visible.
- Applies the same full-aspect-ratio rounded treatment to newly generated public pages.

## v0.18.8
- Related photos in Visitor View now retain the shared place/experience information.
- Switching photos changes photo-specific title, story, role, filename/tags while Features, Access Difficulty, Cost, Rating, Best Time, Visit Time, Transport, Warnings and Location remain visible.

## v0.19 — first-class related photo metadata + editable inheritance
- New related photos extract their own EXIF date/time, GPS, camera make/model, dimensions, file size/type and filename where available.
- Related photos inherit place/experience fields from the parent record.
- Every inherited field can be overridden for an individual related photo; blank override means continue inheriting.
- Photo-specific title, story, tags and role remain independent.
- Visitor View uses the active photo's overrides while retaining inherited values for everything not overridden.

## v0.19.1 — editor cleanup
- Replaces the long always-open main-photo edit area with a compact main-photo summary.
- Adds an explicit Edit main photo toggle.
- Keeps related-photo editing prominent.
- Keeps inherited place-information overrides collapsed by default.
- No photo or metadata is deleted; this is a UI-only cleanup.


## v0.19.2 — performance correction
- Removes the broad MutationObserver introduced in v0.19.1.
- Main-photo edit visibility now changes only when Edit is opened or the toggle is tapped.
- Prevents repeated whole-page mutation handling and object-URL recreation during normal UI updates.
- Keeps the compact main-photo editor and collapsed inherited overrides.

## v0.19.3 — visible inherited values
- Related-photo override fields now show the actual inherited value.
- Leaving an override untouched keeps live inheritance from the main photo/place.
- Typing a different value creates a photo-specific override.
- No record schema changes.

## v0.19.4 — deployment/cache repair
- Corrects stale index.html version label and app/CSS query strings.
- Removes failed service-worker precache dependency on missing manifest.webmanifest.
- Makes same-origin app requests network-first.
- Activates new service workers immediately and deletes only old Papa Golf shell caches.
- Reloads once when the new worker takes control.
- Does not clear or alter IndexedDB photo records.

## v0.19.5 — photo click repair
- Fixed 4 inherited-value renderer reference(s) that used an undefined record variable.
- This error occurred when opening a saved photo and stopped openDetail() before the detail dialog appeared.
- Related-photo inherited placeholders now read from activeRecord.
- No photo records or IndexedDB data changed.

## v0.19.6 — inherited field display completion
- Updated 4 related-photo override input(s) to show the actual inherited parent value.
- Covers core fields and visitor/custom fields such as Features, Cost, Rating, Best Time, Visit Time, Transport, Warnings and Website.
- Empty parent values display `Inherited: no value set`.
- No data schema or photo records changed.

## v0.19.7 — related-photo Blob save repair
- Materializes every related-photo Blob before rewriting an edited record in IndexedDB.
- Prevents Safari from saving metadata changes while leaving a nested related image Blob unreadable.
- Rebuilds the detail viewer from the freshly saved Blobs immediately after Save.
- Aborts the save instead of writing the record if any related image bytes cannot be safely read.
- Main image and related image metadata/schema remain unchanged.

## v0.19.8 — one description per photo
- Replaces the separate Place Description override + Photo Story model with one `Photo Description`.
- Main photo description is the inherited default for related photos.
- A related photo with a blank description automatically uses the main photo description.
- Typing a related-photo description makes that photo different from the main photo.
- Legacy related `placeOverrides.description` values are migrated into the related photo description so existing edits are preserved.
- Shared structured place fields (Category, Area, Location, Features, Cost, Rating, Best Time, Transport, Warnings, Website, etc.) continue to inherit independently.


## v0.20.0 — Magic Dragon Villa Welcome foundation
- First real-world property seeded as Magic Dragon Villa, Bangrak, Samui.
- Property origin coordinates: 9.5487116, 100.0513577.
- Packaged Magic Dragon Villa logo used as the guest Welcome header.
- Added customizable developer/management branding.
- Rebuilt Welcome guest experience around large mobile menu tiles.
- Added Explore Nearby category management.
- Each category can be enabled/disabled and set to:
  - Automatic nearby search (future live Places layer), or
  - Approved / affiliate only.
- Restaurants, bars, cafés and other commercial categories default to approved-only.
- Convenience stores, supermarkets, petrol, ATM, pharmacy and medical default to automatic search.
- Added curated/affiliate place editor with name, category, coordinates and guest note.
- Curated places display immediately on the in-app satellite Explore Nearby map.
- Guest filters dynamically reduce map/list clutter.
- Approved Food & Drink places appear in a dedicated guest section.
- Google Maps navigation handoff is available for curated pins.
- Live utility-place discovery and route-time calculations remain deliberately provider-independent for the next integration layer.
- Removed stale manifest link from app shell.


## v0.20.1 — A5 Welcome Card
- Added standard portrait A5 Welcome Card preview for the clear plastic villa stand.
- Uses the current property's logo automatically.
- Large "SCAN HERE FOR EVERYTHING YOU NEED DURING YOUR STAY" message.
- Large QR area for the Welcome page.
- Prints Wi-Fi network and password clearly for manual entry.
- Magic Dragon Villa prototype Wi-Fi seeded as PaulHup_2.4GHz / FrameBalls555 only when existing saved Wi-Fi is blank; user-entered values are preserved.
- Added Powered by PAPA GOLF PLATFORM branding and "Local knowledge. Better stays."
- Added Print / Save as PDF action using A5 portrait print CSS.
- A5 data is sourced from the same Welcome property/unit fields; no duplicate Wi-Fi entry.


## v0.20.2 — Live Nearby utility discovery
- Explore Nearby now performs live utility-place discovery around the villa using OpenStreetMap / Overpass.
- No API key is required for this first live implementation.
- Search radius: 5 km from the property coordinates.
- Live automatic categories:
  - Convenience stores
  - Supermarkets
  - Petrol stations
  - ATMs / banks
  - Pharmacies
  - Hospitals / clinics
- Restaurants, bars, cafés and other commercial recommendations remain Papa Golf approved/affiliate-only.
- Live utility results and curated places are combined on the same in-app satellite map.
- Guest filter chips reduce both the map and result list.
- Each result shows straight-line distance from the villa and retains Google Maps navigation handoff.
- Live results are cached locally for 6 hours to reduce repeated public-service traffic.
- Added Refresh Nearby button for a forced live refresh.
- Added source labels to distinguish "Nearby utility" from "Papa Golf approved".
- Added fallback to a second Overpass endpoint if the first public endpoint is unavailable.


## v0.20.3 — Smart Nearby result controls
- Each automatic utility category now has its own configurable search radius.
- Each automatic utility category now has a configurable maximum number of displayed results.
- Each automatic category can choose:
  - Nearest
  - Nearest + directional spread
- Directional spread always keeps the nearest result, then favors candidates in different directions so dense categories such as convenience stores do not fill the map with many nearly identical nearby pins.
- Defaults:
  - Convenience: 2 km / max 4 / directional spread
  - Supermarket: 3 km / max 3 / nearest
  - Petrol: 3 km / max 3 / nearest
  - ATM: 2 km / max 4 / directional spread
  - Pharmacy: 3 km / max 3 / nearest
  - Medical: 8 km / max 4 / nearest
- Candidate fetching automatically expands only as far as the largest enabled automatic-category radius, capped at 10 km.
- Approved/affiliate commercial categories remain manually controlled.


## v0.20.4 — Guest map presentation
- Explore Nearby now opens tightly centred on the villa rather than zooming out to fit every result.
- Initial map frame is approximately 500 m from the villa to each edge.
- Villa receives a prominent gold YOU ARE HERE marker.
- Utility and approved-place pins use category icons rather than Leaflet default/broken blue marker graphics.
- Guests can still pan and zoom outward to places beyond the initial frame.
- Live search radii, maximum-result rules and directional-spread selection remain unchanged.


## v0.20.5 — Street map, proximity fix and tappable results
- Explore Nearby now uses a standard OpenStreetMap street map instead of satellite imagery.
- Initial villa-centred map view widened to approximately 750 m from the villa to each edge.
- Directional spread now always preserves the two nearest candidates first.
- Remaining result slots still favor useful directional spread.
- Big C Mini, Lotus's Go Fresh and Tops Daily are recognized as convenience-style stores when OSM tagging varies.
- Added shop=general to the live candidate query to catch inconsistently tagged mini-markets.
- Tapping anywhere on a result card except the Google Maps link now centres that location on the in-app map, zooms in and opens its marker popup.


## v0.20.6 — Show all Nearby results
- Removed maximum-result filtering from automatic Nearby categories.
- Removed directional-spread filtering from what guests actually see.
- Every live place returned within the configured category radius is now displayed.
- Results below the map are sorted strictly nearest-first.
- When All is selected, automatic and approved places share one nearest-first list.
- Per-category radius control remains.
- Initial map remains centred on the villa at the same ~750 m half-span used in v0.20.5.
- Tappable result-card map centring/popup behaviour remains unchanged.


## v0.20.7 — Fit villa + selected place together
- Tapping a Nearby result no longer centres only on the destination.
- Papa Golf now fits the selected place and the villa's YOU ARE HERE marker into the same map view.
- The map automatically zooms to the tightest practical level while keeping both pins visible.
- Selected-place popup still opens automatically.
- Existing 750 m default villa-centred map view remains unchanged until a result is selected.
- Nearest-first unfiltered result list from v0.20.6 remains unchanged.


## v0.20.8 — Sticky Explore Nearby map
- The Explore Nearby map now stays pinned on screen while the guest scrolls through results below it.
- Map status/hint remains attached to the sticky map area.
- Tapping a result still best-fits the villa YOU ARE HERE marker and selected place together.
- If the map is already visible, tapping a result no longer jumps the page back to the map.
- Existing 750 m initial map extent and nearest-first result behaviour remain unchanged.
- Google Places is not yet enabled; current live place source remains OpenStreetMap/Overpass.


## v0.20.9 — Google Places local-key test
- Added a Google Places API section to Welcome/Property setup.
- The Google Places key is stored only in this browser/device localStorage and is not embedded in the update ZIP or GitHub repository.
- Added Save key and Test Google Places controls.
- Test uses Places API (New) Nearby Search around the property's coordinates and ranks results nearest-first.
- Test result cards show name, type, distance, address and Google Maps link.
- Existing OpenStreetMap/Overpass guest Nearby system remains unchanged while we compare coverage.


## v0.20.10 — Google Places test bug fix
- Fixed `Can't find variable: escapeAttr` in the Google Places test results renderer.
- Existing saved Google Places API key remains untouched in localStorage.
- Google Places test now proceeds to the real API response instead of failing during result rendering.


## v0.20.11 — Google Places in Explore Nearby
- Google Places API (New) is now the preferred automatic utility source when a local Google Places key is saved.
- Automatic categories covered: convenience stores, supermarkets/grocery stores, petrol stations, ATMs/banks, pharmacies, hospitals/clinics/doctors.
- Results are kept nearest-first and still respect each category's configured search radius.
- Directional filtering and maximum-results filtering remain disabled.
- Existing sticky map, 750 m default villa-centred view, tappable result cards, and best-fit YOU ARE HERE + selected-place behavior are preserved.
- Google Places result cards can use Google's supplied Maps destination link.
- If the Google call fails or no key is saved, Papa Golf falls back to the existing OpenStreetMap/Overpass automatic utility system.
- Approved/affiliate places remain Papa Golf-controlled and are not replaced by Google.


## v0.20.12 — Google-first Explore Nearby fix
- Corrected two broken function references in the v0.20.11 Google handoff.
- Google success now renders the actual Explore Nearby map/list.
- Explore Nearby open/filter/refresh actions now use Google-first loading.
- OpenStreetMap/Overpass runs only as fallback.
- Manual Refresh Nearby clears stale automatic results first.
- Guest UI explicitly labels Google results as `Google nearby` and status as `Google utility places`.
- Sticky map, 750 m starting view, and YOU ARE HERE + selected-place best-fit are preserved.


## v0.20.13 — Nearby provider race-condition fix
- Added a request-generation lock so overlapping Nearby searches cannot overwrite each other.
- Google Places remains the first-choice automatic utility provider.
- If Google succeeds, any older/later stale OpenStreetMap response is ignored.
- OpenStreetMap is only used when Google genuinely fails or no Google key is available.
- Starting a new refresh invalidates any previous in-flight Nearby request.
- Existing sticky map, nearest-first list, 750 m start view, and YOU ARE HERE + destination best-fit remain unchanged.


## v0.21.0 — Foundation hardening
### Backup / restore v2
- Backup now includes the main image and every nested related-photo image Blob.
- Backup includes photo metadata, custom fields, Welcome property/unit/category configuration, and approved/affiliate place records.
- Google Places API key is deliberately excluded from backup.
- Temporary Google/OpenStreetMap caches are deliberately excluded.
- Restore accepts both legacy v1 backups and new v2 backups.
- v2 restore rebuilds related-photo Blobs and Welcome/property configuration.

### Explore Nearby
- Category/filter controls and Refresh Nearby now stick together with the map.
- Results continue scrolling underneath.
- Existing Google-first / OpenStreetMap-fallback provider behavior remains.
- Existing 750 m initial map view and YOU ARE HERE + destination best-fit behavior remain.

### Cleanup
- Removed the obsolete directional-spread selection algorithm.
- Removed obsolete maximum-result / selection settings from the automatic category model.
- Radius remains the active per-category automatic search control.

### Responsive baseline
- Added phone, short-screen/landscape, tablet and desktop layout behavior.
- Maps use viewport-aware height.
- Guest menu expands from 1–2 columns to 3–4 columns where screen space allows.
- Large-screen result lists can use two columns.
- Added overflow protection, safe-area handling and viewport-safe dialogs.

## v0.21.1 — Sticky map base-layer fix
- Hardened Leaflet map rendering inside the sticky Explore Nearby container on iOS Safari.
- Forces Leaflet to recalculate its viewport immediately and after sticky layout settles.
- Recalculates after viewport resize/orientation changes.
- Preserves sticky category filters + Refresh Nearby + map behavior.
- No data model or backup changes from v0.21.0.

## v0.21.2 — Leaflet base-map tile fix
- Corrected the responsive image rule introduced in v0.21.0 so it does not apply to Leaflet raster tiles or marker images.
- Added explicit Leaflet tile max-width/max-height protection for Safari.
- Retains sticky filters + map and v0.21.1 viewport settling logic.
