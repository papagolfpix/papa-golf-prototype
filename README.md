# Papa Golf Photo Prototype — v0.4

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
