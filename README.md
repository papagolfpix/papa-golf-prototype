# Papa Golf Photo Prototype — v0.8.1


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
