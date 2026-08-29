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
