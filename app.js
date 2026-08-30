const RUNTIME_VERSION = '0.27.1';
console.info('Papa Golf runtime', RUNTIME_VERSION);
const DB_NAME = 'papa-golf-v01';
const STORE_NAME = 'photos';
const FIELD_KEY = 'papaGolfCustomFields';

const defaultFields = [
  { id: 'title', label: 'Title', type: 'text' },
  { id: 'description', label: 'Photo Description', type: 'textarea' },
  { id: 'category', label: 'Category', type: 'text' },
  { id: 'areaName', label: 'Area / Place', type: 'text' },
  { id: 'locationName', label: 'Location name', type: 'text' },
  { id: 'people', label: 'People', type: 'text' },
  { id: 'tags', label: 'Tags', type: 'text' },
];

const photoInput = document.querySelector('#photoInput');
const editorSection = document.querySelector('#editorSection');
const gallery = document.querySelector('#gallery');
const emptyState = document.querySelector('#emptyState');
const clearAllBtn = document.querySelector('#clearAllBtn');
const recordCount = document.querySelector('#recordCount');
const exportBackupBtn = document.querySelector('#exportBackupBtn');
const importBackupInput = document.querySelector('#importBackupInput');
const backupStatus = document.querySelector('#backupStatus');
const template = document.querySelector('#photoEditorTemplate');
const fieldsDialog = document.querySelector('#fieldsDialog');
const manageFieldsBtn = document.querySelector('#manageFieldsBtn');
const fieldList = document.querySelector('#fieldList');
const addFieldBtn = document.querySelector('#addFieldBtn');
const saveFieldsBtn = document.querySelector('#saveFieldsBtn');
const detailDialog = document.querySelector('#detailDialog');
const detailTitle = document.querySelector('#detailTitle');

const publicationStatusBlock = document.querySelector('#publicationStatusBlock');
const publicationStatusBadge = document.querySelector('#publicationStatusBadge');
const publicationPublicLink = document.querySelector('#publicationPublicLink');
const publicationUpdateBtn = document.querySelector('#publicationUpdateBtn');
const publicationMarkBtn = document.querySelector('#publicationMarkBtn');

const detailImage = document.querySelector('#detailImage');
const detailCustomFields = document.querySelector('#detailCustomFields');
const detailMetadata = document.querySelector('#detailMetadata');
const detailCustomFieldsSection = detailCustomFields;
const detailMetadataSection = detailMetadata ? detailMetadata.closest('.detail-section') : null;
const closeDetailBtn = document.querySelector('#closeDetailBtn');
const editDetailBtn = document.querySelector('#editDetailBtn');
const visitorPreviewBtn = document.querySelector('#visitorPreviewBtn');
const publishQrBtn = document.querySelector('#publishQrBtn');
const publishDialog = document.querySelector('#publishDialog');
const closePublishBtn = document.querySelector('#closePublishBtn');
const publishSlug = document.querySelector('#publishSlug');
const publishUrl = document.querySelector('#publishUrl');
const publishQrImage = document.querySelector('#publishQrImage');
const generatePageBtn = document.querySelector('#generatePageBtn');
const openQrBtn = document.querySelector('#openQrBtn');
const publishStatus = document.querySelector('#publishStatus');
const generatedPageLink = document.querySelector('#generatedPageLink');
let publishRecord = null;

const visitorDialog = document.querySelector('#visitorDialog');
const closeVisitorBtn = document.querySelector('#closeVisitorBtn');
const visitorHeroWrap = document.querySelector('#visitorHeroWrap');
const visitorHero = document.querySelector('#visitorHero');
const visitorFilmstrip = document.querySelector('#visitorFilmstrip');
const visitorActivePhotoInfo = document.querySelector('#visitorActivePhotoInfo');
const visitorCategory = document.querySelector('#visitorCategory');
const visitorTitle = document.querySelector('#visitorTitle');
const visitorPlace = document.querySelector('#visitorPlace');
const visitorDescription = document.querySelector('#visitorDescription');
const visitorFields = document.querySelector('#visitorFields');
const visitorMapSection = document.querySelector('#visitorMapSection');
const visitorMiniMap = document.querySelector('#visitorMiniMap');
const visitorGoogleMaps = document.querySelector('#visitorGoogleMaps');
const visitorLocateBtn = document.querySelector('#visitorLocateBtn');
const visitorLocationStatus = document.querySelector('#visitorLocationStatus');
let visitorImageUrl=null, visitorMap=null, visitorUserMarker=null, visitorAccuracyCircle=null;

const editDialog = document.querySelector('#editDialog');
const editForm = document.querySelector('#editForm');
const editTitle = document.querySelector('#editTitle');
const editFields = document.querySelector('#editFields');
const closeEditBtn = document.querySelector('#closeEditBtn');
const cancelEditBtn = document.querySelector('#cancelEditBtn');
const editStatus = document.querySelector('#editStatus');
const editMainPhotoThumb = document.querySelector('#editMainPhotoThumb');
const editMainPhotoSummaryTitle = document.querySelector('#editMainPhotoSummaryTitle');
const editMainPhotoSummaryMeta = document.querySelector('#editMainPhotoSummaryMeta');
const toggleMainPhotoEditBtn = document.querySelector('#toggleMainPhotoEditBtn');
let editMainPhotoThumbUrl = null;
const photosTabBtn = document.querySelector('#photosTabBtn');
const mapTabBtn = document.querySelector('#mapTabBtn');
const areasTabBtn = document.querySelector('#areasTabBtn');
const photosView = document.querySelector('#photosView');
const mapView = document.querySelector('#mapView');
const areasView = document.querySelector('#areasView');
const areasList = document.querySelector('#areasList');
const areaCount = document.querySelector('#areaCount');
const areasEmptyState = document.querySelector('#areasEmptyState');
const photoMapEl = document.querySelector('#photoMap');
const mapPinCount = document.querySelector('#mapPinCount');
const mapStatus = document.querySelector('#mapStatus');
const mapEmptyState = document.querySelector('#mapEmptyState');
const fitMapBtn = document.querySelector('#fitMapBtn');
let detailImageUrl = null;
let activeRecord = null;
let photoMap = null;
let mapLayer = null;
let mapBounds = null;
let standardLayer = null;
let satelliteLayer = null;
let activeBaseLayer = 'standard';
let userLocationMarker = null;
let userAccuracyCircle = null;
let lastUserLocation = null;
let mapImageUrls = [];

let pending = [];
let customFields = loadFields();

if (!customFields.some(field => field.id === 'areaName')) {
  const areaField = normalizeField({ id: 'areaName', label: 'Area / Place', type: 'text', required: false });
  const locationIndex = customFields.findIndex(field => field.id === 'locationName');
  if (locationIndex >= 0) customFields.splice(locationIndex, 0, areaField);
  else customFields.push(areaField);
}

try {
  localStorage.setItem(FIELD_KEY, JSON.stringify(customFields));
} catch {}

function normalizeField(field) {
  const allowed = new Set(['text','textarea','number','date','boolean','select','multiselect','rating','url','tel']);
  const rawOptions = Array.isArray(field.options) ? field.options : [];
  const options = rawOptions
    .flatMap(option => String(option).replace(/\\n/g, '\n').split(/\r?\n|,/))
    .map(option => option.trim())
    .filter(Boolean);

  return {
    id: String(field.id || slugify(field.label || 'field')),
    label: String(field.label || field.id || 'Field'),
    type: allowed.has(field.type) ? field.type : 'text',
    required: Boolean(field.required),
    options: [...new Set(options)],
  };
}

function loadFields() {
  try {
    const raw = localStorage.getItem(FIELD_KEY);
    return (raw ? JSON.parse(raw) : defaultFields).map(normalizeField);
  } catch {
    return defaultFields.map(normalizeField);
  }
}

function slugify(text) {
  const base = text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  return base || `field_${Date.now()}`;
}

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function putRecord(record) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(record);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

async function getRecords() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).getAll();
    req.onsuccess = () => resolve(req.result.sort((a, b) => b.savedAt.localeCompare(a.savedAt)));
    req.onerror = () => reject(req.error);
  });
}


function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error('Could not read image for backup.'));
    reader.readAsDataURL(blob);
  });
}

function dataUrlToBlob(dataUrl) {
  const parts = String(dataUrl || '').split(',');
  if (parts.length < 2) throw new Error('Invalid image data in backup.');
  const match = parts[0].match(/data:([^;]+);base64/i);
  const type = match ? match[1] : 'application/octet-stream';
  const binary = atob(parts.slice(1).join(','));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type });
}

function backupFileName() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `papa-golf-backup-${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}.json`;
}

async function serializeRelatedPhotosForBackup(items = []) {
  const output = [];
  for (let i = 0; i < items.length; i++) {
    const photo = normalizeRelatedPhoto(items[i], i);
    const blob = relatedBlob(photo);
    if (!(blob instanceof Blob) || !blob.size) {
      throw new Error(`Related photo ${i + 1} has no readable image bytes. Backup stopped rather than creating an incomplete file.`);
    }
    const safeBlob = await materializeSafeBlob(
      blob,
      photo?.metadata?.type || photo?.mimeType || blob.type || 'image/jpeg'
    );
    output.push({
      ...photo,
      imageBlob: {
        dataUrl: await blobToDataUrl(safeBlob),
        name: photo?.metadata?.filename || photo?.filename || `related-photo-${i+1}.jpg`,
        type: photo?.metadata?.type || photo?.mimeType || safeBlob.type || 'image/jpeg'
      },
      image: undefined
    });
  }
  return output;
}

function welcomeBackupSnapshot() {
  return {
    property: readWelcomeJson(WELCOME_PROPERTY_KEY, null),
    unit: readWelcomeJson(WELCOME_UNIT_KEY, null),
    categories: readWelcomeJson(WELCOME_CATEGORY_KEY, null),
    partners: readWelcomeJson(WELCOME_PARTNER_KEY, null),
    sharedPlaces: readWelcomeJson(PAPA_GOLF_PLACES_KEY, []),
    language: localStorage.getItem(WELCOME_LANGUAGE_KEY)||'auto',
    photoPlaceLinks: readWelcomeJson(PAPA_GOLF_PHOTO_PLACE_LINKS_KEY,{}),
    gateways: getPapaGolfGateways()
  };
}

async function exportBackup() {
  const records = await getRecords();
  const serialized = [];

  for (let i = 0; i < records.length; i++) {
    backupStatus.textContent = `Preparing photo ${i + 1} of ${records.length}…`;
    const record = records[i];

    const safeMain = await materializeSafeBlob(
      record.image,
      record.metadata?.type || record.image?.type || 'image/jpeg'
    );

    const related = await serializeRelatedPhotosForBackup(record.supportingPhotos || []);

    serialized.push({
      ...record,
      image: {
        dataUrl: await blobToDataUrl(safeMain),
        name: record.metadata?.filename || 'photo.jpg',
        type: record.metadata?.type || safeMain.type || 'image/jpeg',
        lastModified: record.metadata?.lastModified || Date.now()
      },
      supportingPhotos: related
    });
  }

  const payload = {
    format: 'papa-golf-backup',
    version: 7,
    exportedAt: new Date().toISOString(),
    appVersion: RUNTIME_VERSION,
    customFields,
    welcome: welcomeBackupSnapshot(),
    records: serialized
    // Deliberately excluded:
    // - Google Places API key
    // - temporary Nearby provider caches
    // - service-worker/browser caches
  };

  const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = backupFileName();
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);

  const relatedCount = records.reduce((sum, rec) => sum + (Array.isArray(rec.supportingPhotos) ? rec.supportingPhotos.length : 0), 0);
  backupStatus.textContent =
    `Backup ready: ${records.length} main photo${records.length === 1 ? '' : 's'} + ` +
    `${relatedCount} related photo${relatedCount === 1 ? '' : 's'}, plus Welcome/property data and the shared Places index.`;
}


function mergeCustomFields(importedFields) {
  if (!Array.isArray(importedFields)) return;
  const existing = new Set(customFields.map(f => f.id));
  const merged = [...customFields];
  importedFields.forEach(field => {
    if (field && field.id && !existing.has(field.id)) {
      merged.push({ id: String(field.id), label: String(field.label || field.id), type: field.type === 'textarea' ? 'textarea' : 'text' });
      existing.add(field.id);
    }
  });
  customFields = merged;
  localStorage.setItem(FIELD_KEY, JSON.stringify(customFields));
}

async function restoreRelatedPhotosFromBackup(items = []) {
  const restored = [];
  for (let i = 0; i < items.length; i++) {
    const raw = items[i] || {};
    const packed = raw.imageBlob;

    // v2 format
    if (packed?.dataUrl) {
      restored.push(normalizeRelatedPhoto({
        ...raw,
        imageBlob: dataUrlToBlob(packed.dataUrl),
        image: undefined
      }, i));
      continue;
    }

    // Defensive compatibility if a future/hand-edited backup stores image.dataUrl.
    if (raw.image?.dataUrl) {
      restored.push(normalizeRelatedPhoto({
        ...raw,
        imageBlob: dataUrlToBlob(raw.image.dataUrl),
        image: undefined
      }, i));
    }
  }
  return restored;
}

function restoreWelcomeBackup(welcome) {
  if (!welcome || typeof welcome !== 'object') return false;
  const entries = [
    [WELCOME_PROPERTY_KEY, welcome.property],
    [WELCOME_UNIT_KEY, welcome.unit],
    [WELCOME_CATEGORY_KEY, welcome.categories],
    [WELCOME_PARTNER_KEY, welcome.partners],
    [PAPA_GOLF_PLACES_KEY, welcome.sharedPlaces],
    [PAPA_GOLF_PHOTO_PLACE_LINKS_KEY, welcome.photoPlaceLinks],
    [PAPA_GOLF_GATEWAYS_KEY, welcome.gateways]
  ];
  let restored = false;
  entries.forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      localStorage.setItem(key, JSON.stringify(value));
      restored = true;
    }
  });
  if(welcome.language){
    localStorage.setItem(WELCOME_LANGUAGE_KEY,welcome.language);
    restored=true;
  }
  return restored;
}

async function importBackupFile(file) {
  const text = await file.text();
  let payload;
  try { payload = JSON.parse(text); }
  catch { throw new Error('That file is not valid JSON.'); }

  if (payload?.format !== 'papa-golf-backup' || ![1,2,3,4,5,6,7].includes(payload?.version) || !Array.isArray(payload.records)) {
    throw new Error('That is not a compatible Papa Golf backup file.');
  }

  mergeCustomFields(payload.customFields);

  let restored = 0;
  let relatedRestored = 0;

  for (let i = 0; i < payload.records.length; i++) {
    backupStatus.textContent = `Restoring photo ${i + 1} of ${payload.records.length}…`;
    const saved = payload.records[i];
    if (!saved?.id || !saved?.image?.dataUrl) continue;

    const blob = dataUrlToBlob(saved.image.dataUrl);
    let supportingPhotos = [];

    if (payload.version >= 2 && Array.isArray(saved.supportingPhotos)) {
      supportingPhotos = await restoreRelatedPhotosFromBackup(saved.supportingPhotos);
      relatedRestored += supportingPhotos.length;
    }

    const restoredRecord = {
      ...saved,
      image: blob,
      supportingPhotos,
      restoredAt: new Date().toISOString()
    };

    await putRecord(restoredRecord);
    restored++;
  }

  const welcomeRestored = payload.version >= 2 ? restoreWelcomeBackup(payload.welcome) : false;

  await renderGallery();

  backupStatus.textContent =
    `Restore complete: ${restored} main photo${restored === 1 ? '' : 's'}` +
    `${payload.version >= 2 ? ` + ${relatedRestored} related photo${relatedRestored === 1 ? '' : 's'}` : ''}` +
    `${welcomeRestored ? ' + Welcome/property data' : ''}. Existing records were not bulk-deleted.`;
}


async function deleteRecord(id) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

async function clearRecords() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).clear();
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

function prettyBytes(bytes) {
  if (!Number.isFinite(bytes)) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  let n = bytes; let i = 0;
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(i ? 1 : 0)} ${units[i]}`;
}

function formatTakenDate(value) {
  if (!value) return 'Not found';
  const normalized = value.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3');
  const date = new Date(normalized.replace(' ', 'T'));
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function gpsDisplay(lat, lon) {
  if (lat == null || lon == null) return 'Not found';
  return `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
}

function getImageDimensions(file) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => { resolve({ width: img.naturalWidth, height: img.naturalHeight }); URL.revokeObjectURL(url); };
    img.onerror = () => { resolve({ width: null, height: null }); URL.revokeObjectURL(url); };
    img.src = url;
  });
}

function readExif(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      try { resolve(parseExif(reader.result)); } catch { resolve({}); }
    };
    reader.onerror = () => resolve({});
    reader.readAsArrayBuffer(file.slice(0, 512 * 1024));
  });
}

function parseExif(buffer) {
  const view = new DataView(buffer);
  if (view.byteLength < 4 || view.getUint16(0, false) !== 0xFFD8) return {};
  let offset = 2;
  while (offset + 4 < view.byteLength) {
    const marker = view.getUint16(offset, false); offset += 2;
    if ((marker & 0xFF00) !== 0xFF00) break;
    const length = view.getUint16(offset, false);
    if (marker === 0xFFE1 && offset + length <= view.byteLength) {
      const start = offset + 2;
      if (getAscii(view, start, 4) === 'Exif') return parseTiff(view, start + 6);
    }
    offset += length;
  }
  return {};
}

function getAscii(view, offset, length) {
  let s = '';
  for (let i = 0; i < length && offset + i < view.byteLength; i++) s += String.fromCharCode(view.getUint8(offset + i));
  return s.replace(/\0+$/, '');
}

function parseTiff(view, tiffStart) {
  const byteOrder = view.getUint16(tiffStart, false);
  const little = byteOrder === 0x4949;
  if (!little && byteOrder !== 0x4D4D) return {};
  const get16 = (o) => view.getUint16(o, little);
  const get32 = (o) => view.getUint32(o, little);
  if (get16(tiffStart + 2) !== 42) return {};

  const typeSizes = { 1:1, 2:1, 3:2, 4:4, 5:8, 7:1, 9:4, 10:8 };
  const valueOf = (entry) => {
    const type = get16(entry + 2), count = get32(entry + 4), size = (typeSizes[type] || 1) * count;
    const pos = size <= 4 ? entry + 8 : tiffStart + get32(entry + 8);
    if (pos < 0 || pos + size > view.byteLength) return null;
    if (type === 2) return getAscii(view, pos, count);
    if (type === 3) return count === 1 ? get16(pos) : Array.from({length:count}, (_,i)=>get16(pos+i*2));
    if (type === 4) return count === 1 ? get32(pos) : Array.from({length:count}, (_,i)=>get32(pos+i*4));
    if (type === 5) return Array.from({length:count}, (_,i)=>get32(pos+i*8) / Math.max(1,get32(pos+i*8+4)));
    return null;
  };

  const readIfd = (ifdOffset) => {
    const entries = {};
    const base = tiffStart + ifdOffset;
    if (base + 2 > view.byteLength) return entries;
    const count = get16(base);
    for (let i=0;i<count;i++) {
      const entry = base + 2 + i*12;
      if (entry + 12 > view.byteLength) break;
      entries[get16(entry)] = valueOf(entry);
    }
    return entries;
  };

  const ifd0 = readIfd(get32(tiffStart + 4));
  const exif = ifd0[0x8769] ? readIfd(ifd0[0x8769]) : {};
  const gps = ifd0[0x8825] ? readIfd(ifd0[0x8825]) : {};

  const coord = (vals, ref) => {
    if (!Array.isArray(vals) || vals.length < 3) return null;
    let n = vals[0] + vals[1]/60 + vals[2]/3600;
    if (ref === 'S' || ref === 'W') n *= -1;
    return n;
  };

  return {
    make: ifd0[0x010F] || '',
    model: ifd0[0x0110] || '',
    dateTime: exif[0x9003] || exif[0x9004] || ifd0[0x0132] || '',
    latitude: coord(gps[0x0002], gps[0x0001]),
    longitude: coord(gps[0x0004], gps[0x0003]),
  };
}

function makeField(field, value = '') {
  field = normalizeField(field);
  const wrap = document.createElement('div');
  wrap.className = 'field';
  const label = document.createElement('label');
  label.textContent = field.label + (field.required ? ' *' : '');

  let input;
  if (field.type === 'textarea') {
    input = document.createElement('textarea');
  } else if (field.type === 'select') {
    input = document.createElement('select');
    input.innerHTML = '<option value="">Select…</option>';
    field.options.forEach(option => {
      const el = document.createElement('option');
      el.value = option; el.textContent = option; input.appendChild(el);
    });
  } else if (field.type === 'multiselect') {
    input = document.createElement('select');
    input.multiple = true;
    input.size = Math.min(Math.max(field.options.length, 3), 6);
    field.options.forEach(option => {
      const el = document.createElement('option');
      el.value = option; el.textContent = option; input.appendChild(el);
    });
  } else if (field.type === 'boolean') {
    input = document.createElement('select');
    input.innerHTML = '<option value="">Not set</option><option value="Yes">Yes</option><option value="No">No</option>';
  } else if (field.type === 'rating') {
    input = document.createElement('select');
    input.innerHTML = '<option value="">Not rated</option>' +
      [1,2,3,4,5].map(n => `<option value="${n}">${n} / 5</option>`).join('');
  } else {
    input = document.createElement('input');
    input.type = ({number:'number', date:'date', url:'url', tel:'tel'})[field.type] || 'text';
    if (field.type === 'number') input.inputMode = 'decimal';
  }

  input.id = field.id;
  input.name = field.id;
  input.dataset.fieldId = field.id;
  input.dataset.fieldType = field.type;
  input.required = field.required;
  input.autocomplete = 'off';

  value = normalizeSavedValue(field, value);

  if (field.type === 'multiselect') {
    const selected = new Set(Array.isArray(value) ? value : []);
    [...input.options].forEach(o => o.selected = selected.has(o.value));
  } else {
    input.value = value ?? '';
  }

  label.htmlFor = field.id;
  wrap.append(label, input);
  return wrap;
}

function readFieldValues(container) {
  const values = {};
  container.querySelectorAll('[data-field-id]').forEach(input => {
    if (input.multiple) values[input.dataset.fieldId] = [...input.selectedOptions].map(o => o.value);
    else values[input.dataset.fieldId] = String(input.value || '').trim();
  });
  return values;
}

function normalizeSavedValue(field, value) {
  field = normalizeField(field);

  if (field.type === 'multiselect') {
    const raw = Array.isArray(value) ? value : [value];
    const parts = raw
      .flatMap(v => String(v || '').replace(/\\n/g, '\n').split(/\r?\n|,/))
      .map(v => v.trim())
      .filter(Boolean);
    return [...new Set(parts.filter(v => field.options.includes(v)))];
  }

  if (field.type === 'select') {
    if (Array.isArray(value)) {
      const expanded = value
        .flatMap(v => String(v).replace(/\\n/g, '\n').split(/\r?\n|,/))
        .map(v => v.trim())
        .filter(Boolean);
      const match = expanded.find(v => field.options.includes(v));
      return match || '';
    }

    const str = String(value || '').trim();
    if (field.options.includes(str)) return str;

    // Repair v0.6/v0.6.1 records where a "single" saved value actually
    // contains the entire choice list separated by line breaks.
    const parts = str
      .replace(/\\n/g, '\n')
      .split(/\r?\n|,/)
      .map(v => v.trim())
      .filter(Boolean);
    const match = parts.find(v => field.options.includes(v));
    return match || '';
  }

  if (field.type === 'rating') {
    const str = String(value || '').trim();
    return ['1','2','3','4','5'].includes(str) ? str : '';
  }

  if (field.type === 'boolean') {
    const str = String(value || '').trim();
    return ['Yes','No'].includes(str) ? str : '';
  }

  return value == null ? '' : String(value);
}

function normalizeRecordFieldValues(values = {}) {
  const out = {};
  customFields.forEach(field => {
    out[field.id] = normalizeSavedValue(field, values[field.id]);
  });
  return out;
}
function metadataItems(meta) {
  return [
    ['Filename', meta.filename],
    ['Taken', formatTakenDate(meta.dateTime)],
    ['Dimensions', meta.width && meta.height ? `${meta.width} × ${meta.height}` : 'Not found'],
    ['File size', prettyBytes(meta.fileSize)],
    ['GPS', gpsDisplay(meta.latitude, meta.longitude)],
    ['Device', [meta.make, meta.model].filter(Boolean).join(' ') || 'Not found'],
  ];
}

function renderEditor(item) {
  const node = template.content.firstElementChild.cloneNode(true);
  node.dataset.pendingId = item.id;
  const preview = node.querySelector('.preview');
  preview.src = item.previewUrl;
  const grid = node.querySelector('.metadata-grid');
  for (const [label, value] of metadataItems(item.metadata)) {
    const cell = document.createElement('div');
    cell.className = 'metadata-item';
    cell.innerHTML = `<div class="metadata-label"></div><div class="metadata-value"></div>`;
    cell.querySelector('.metadata-label').textContent = label;
    cell.querySelector('.metadata-value').textContent = value;
    grid.appendChild(cell);
  }
  const fields = node.querySelector('.fields');
  customFields.forEach(field => fields.appendChild(makeField(field)));

  node.querySelector('.remove-photo').addEventListener('click', () => removePending(item.id));
  node.querySelector('.save-photo').addEventListener('click', async () => {
    const values = normalizeRecordFieldValues(readFieldValues(node));
    const status = node.querySelector('.save-status');
    status.textContent = 'Saving…';
    try {
      await putRecord({
        id: item.id,
        savedAt: new Date().toISOString(),
        metadata: item.metadata,
        fields: values,
        image: new Blob([await item.file.arrayBuffer()], { type: item.file.type || 'image/jpeg' }),
      });
      status.textContent = 'Saved on this iPhone.';
      setTimeout(() => removePending(item.id), 350);
      await renderGallery();
      if (!areasView.classList.contains('hidden')) await renderAreas();
    } catch (error) {
      status.textContent = `Could not save: ${error.message || error}`;
    }
  });
  editorSection.appendChild(node);
}

function removePending(id) {
  const item = pending.find(p => p.id === id);
  if (item) URL.revokeObjectURL(item.previewUrl);
  pending = pending.filter(p => p.id !== id);
  const el = editorSection.querySelector(`[data-pending-id="${CSS.escape(id)}"]`);
  if (el) el.remove();
  if (!pending.length) editorSection.classList.add('hidden');
}

photoInput.addEventListener('change', async () => {
  const files = [...photoInput.files];
  if (!files.length) return;
  editorSection.classList.remove('hidden');
  for (const file of files) {
    const [dims, exif] = await Promise.all([getImageDimensions(file), readExif(file)]);
    const item = {
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
      metadata: {
        filename: file.name,
        fileSize: file.size,
        type: file.type,
        lastModified: file.lastModified,
        width: dims.width,
        height: dims.height,
        ...exif,
      },
    };
    pending.push(item);
    renderEditor(item);
  }
  photoInput.value = '';
});

function detailRow(label, value, options = {}) {
  const row = document.createElement('div');
  row.className = 'detail-row';
  const key = document.createElement('div');
  key.className = 'detail-key';
  key.textContent = label;
  const val = document.createElement('div');
  val.className = 'detail-value';
  if (options.href && value && value !== 'Not found' && value !== '—') {
    const link = document.createElement('a');
    link.href = options.href;
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = value;
    val.appendChild(link);
  } else {
    val.textContent = value || '—';
  }
  row.append(key, val);
  return row;
}

function fieldLabelFor(id) {
  if (id === 'description') return 'Photo Description';
  return customFields.find(field => field.id === id)?.label ||
    defaultFields.find(field => field.id === id)?.label ||
    id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function closeDetail() {
  activeRecord = null;
  if (detailDialog.open) detailDialog.close();
  if (detailImageUrl) {
    URL.revokeObjectURL(detailImageUrl);
    detailImageUrl = null;
  }
  detailImage.removeAttribute('src');
}




async function materializeSafeBlob(blob, fallbackType='image/jpeg') {
  if (!(blob instanceof Blob) || !blob.size) {
    throw new Error('The stored photo has no image bytes. Restore the last backup before editing.');
  }

  // Preferred path.
  try {
    if (typeof blob.arrayBuffer === 'function') {
      const bytes = await blob.arrayBuffer();
      if (bytes.byteLength) return new Blob([bytes], { type: blob.type || fallbackType });
    }
  } catch {}

  // Safari fallback 1: FileReader.
  try {
    const bytes = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error || new Error('FileReader failed'));
      reader.readAsArrayBuffer(blob);
    });
    if (bytes && bytes.byteLength) return new Blob([bytes], { type: blob.type || fallbackType });
  } catch {}

  // Safari fallback 2: re-read through a blob: object URL.
  let url = null;
  try {
    url = URL.createObjectURL(blob);
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) throw new Error('Blob URL read failed');
    const recovered = await response.blob();
    if (recovered.size) {
      const bytes = await recovered.arrayBuffer();
      if (bytes.byteLength) return new Blob([bytes], { type: recovered.type || blob.type || fallbackType });
    }
  } catch {}
  finally {
    if (url) URL.revokeObjectURL(url);
  }

  throw new Error('Safari could display this photo but could not safely re-read its stored bytes. Restore the last backup before editing.');
}

async function savePublicationRecord(record) {
  const safeImage = await materializeSafeBlob(
    record.image,
    record.metadata?.type || 'image/jpeg'
  );
  const safeRecord = { ...record, image: safeImage };

  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(safeRecord);
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => resolve(safeRecord);
    tx.onerror = () => reject(tx.error);
  });
}

function publicationInfo(record) {
  const pub = record?.publication || {};
  return {
    status: pub.status === 'published' ? 'published' : 'draft',
    slug: String(pub.slug || '').trim(),
    publicUrl: String(pub.publicUrl || '').trim(),
    publishedAt: pub.publishedAt || null,
    snapshot: String(pub.snapshot || '')
  };
}

function publicationSnapshot(record) {
  const text = JSON.stringify({
    fields: record?.fields || {},
    lat: record?.metadata?.latitude ?? null,
    lng: record?.metadata?.longitude ?? null
  });
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return String(hash >>> 0);
}

function publicationNeedsUpdate(record) {
  const pub = publicationInfo(record);
  return pub.status === 'published' &&
    Boolean(pub.snapshot) &&
    pub.snapshot !== publicationSnapshot(record);
}

function publicationUrlForSlug(slug) {
  const path = window.location.pathname.endsWith('/')
    ? window.location.pathname
    : window.location.pathname.replace(/[^/]*$/, '');
  return `${window.location.origin}${path}${slug}.html`;
}


async function markPublicationState(record) {
  const existing = publicationInfo(record);

  const slug = slugifyPublic(
    existing.slug ||
    record.fields?.locationName ||
    record.fields?.title ||
    record.metadata?.filename ||
    'papa-golf-location'
  );

  const updated = {
    ...record,
    publication: {
      status: 'published',
      slug,
      publicUrl: publicationUrlForSlug(slug),
      publishedAt: new Date().toISOString(),
      snapshot: publicationSnapshot(record)
    }
  };

  const saved = await savePublicationRecord(updated);
  activeRecord = saved;
  renderPublicationStatus(saved);

  // Re-render the gallery so any publication badges/status can refresh.
  await renderGallery();
  return saved;
}

function renderPublicationStatus(record) {
  if (!publicationStatusBadge || !publicationMarkBtn) return;

  const pub = publicationInfo(record);
  const stale = publicationNeedsUpdate(record);

  if (pub.status === 'published') {
    publicationStatusBadge.textContent = stale
      ? 'Published · update needed'
      : 'Published';
    publicationStatusBadge.className =
      `publication-status-badge ${stale ? 'stale' : 'published'}`;

    if (pub.publicUrl) {
      publicationPublicLink.href = pub.publicUrl;
      publicationPublicLink.classList.remove('hidden');
    } else {
      publicationPublicLink.classList.add('hidden');
    }
    if (publicationUpdateBtn) publicationUpdateBtn.classList.toggle('hidden', !stale);

    publicationMarkBtn.textContent = stale ? 'Mark updated' : 'Published';
    publicationMarkBtn.disabled = !stale;
  } else {
    publicationStatusBadge.textContent = 'Draft';
    publicationStatusBadge.className = 'publication-status-badge draft';
    publicationPublicLink.classList.add('hidden');
    if (publicationUpdateBtn) publicationUpdateBtn.classList.add('hidden');
    publicationMarkBtn.textContent = 'Mark published';
    publicationMarkBtn.disabled = false;
  }
}

function openDetail(record) {
  if(detailCustomFieldsSection) detailCustomFieldsSection.classList.remove('hidden');
  if(detailMetadataSection) detailMetadataSection.classList.remove('hidden');
  if(activePhotoInfo) activePhotoInfo.classList.add('hidden');
  activeRecord = record;
  pendingSupportingPhotos = Array.isArray(record.supportingPhotos) ? [...record.supportingPhotos] : [];
  renderSupportingPreview(pendingSupportingPhotos);
  renderPublicationStatus(record);
  if (detailImageUrl) URL.revokeObjectURL(detailImageUrl);
  detailImageUrl = null;
  detailImage.removeAttribute('src');
  if (record.image instanceof Blob && record.image.size > 0) {
    renderDetailSupportingGallery(record);
  } else {
    detailImage.alt = 'Photo data needs restore from backup';
  }
  detailTitle.textContent = record.fields?.title || record.metadata?.filename || 'Photo details';

  detailCustomFields.innerHTML = '';
  const normalizedFields = normalizeRecordFieldValues(record.fields || {});
  const populated = customFields
    .map(field => [field.id, normalizedFields[field.id]])
    .filter(([, value]) => (Array.isArray(value) ? value.join(', ') : String(value || '')).trim());
  if (populated.length) {
    const heading = document.createElement('div');
    heading.className = 'detail-section-title';
    heading.textContent = 'Your information';
    detailCustomFields.appendChild(heading);
    const list = document.createElement('div');
    list.className = 'detail-list';
    populated.forEach(([id, value]) => list.appendChild(detailRow(fieldLabelFor(id), Array.isArray(value) ? value.join(', ') : value)));
    detailCustomFields.appendChild(list);
  }

  const m = record.metadata || {};
  detailMetadata.innerHTML = '';
  const gps = gpsDisplay(m.latitude, m.longitude);
  const rows = [
    ['Date/time taken', formatTakenDate(m.dateTime)],
    ['GPS coordinates', gps, m.latitude != null && m.longitude != null ? `https://www.google.com/maps/search/?api=1&query=${m.latitude},${m.longitude}` : null],
    ['Device', [m.make, m.model].filter(Boolean).join(' ') || 'Not found'],
    ['Filename', m.filename || '—'],
    ['Dimensions', m.width && m.height ? `${m.width} × ${m.height}` : 'Not found'],
    ['File size', prettyBytes(m.fileSize)],
    ['File type', m.type || 'Not found'],
    ['Saved to prototype', record.savedAt ? new Date(record.savedAt).toLocaleString() : 'Not found'],
  ];
  rows.forEach(([label, value, href]) => detailMetadata.appendChild(detailRow(label, value, { href })));
  detailDialog.showModal();
}


function openEdit(record) {
  if (!record) return;
  activeRecord = record;
  editTitle.textContent = record.fields?.title || record.metadata?.filename || 'Edit photo';
  editFields.innerHTML = '';
  const recordFields = normalizeRecordFieldValues(record.fields || {});
  const fieldIds = new Set(customFields.map(field => field.id));
  const fieldsToShow = [...customFields];
  Object.keys(recordFields).forEach(id => {
    if (!fieldIds.has(id)) {
      fieldsToShow.push({ id, label: fieldLabelFor(id), type: id === 'description' ? 'textarea' : 'text' });
    }
  });
  fieldsToShow.forEach(field => editFields.appendChild(makeField(field, recordFields[field.id] || '')));

  // v0.19.2: compact main-photo editor, with no DOM observer.
  // The full main-photo form stays in the DOM so save logic remains unchanged,
  // but is hidden until the user explicitly opens it.
  editFields.classList.add('hidden');
  if (toggleMainPhotoEditBtn) toggleMainPhotoEditBtn.textContent = 'Edit main photo';
  if (editMainPhotoSummaryTitle) {
    editMainPhotoSummaryTitle.textContent = record.fields?.title || record.metadata?.filename || 'Main photo';
  }
  if (editMainPhotoSummaryMeta) {
    const bits = [];
    const place = [record.fields?.locationName, record.fields?.areaName].filter(Boolean).join(' · ');
    if (place) bits.push(place);
    if (record.metadata?.dateTime) bits.push(formatTakenDate(record.metadata.dateTime));
    editMainPhotoSummaryMeta.textContent = bits.join(' · ');
  }
  if (editMainPhotoThumb) {
    if (editMainPhotoThumbUrl) URL.revokeObjectURL(editMainPhotoThumbUrl);
    editMainPhotoThumbUrl = null;
    editMainPhotoThumb.removeAttribute('src');
    if (record.image instanceof Blob && record.image.size > 0) {
      editMainPhotoThumbUrl = URL.createObjectURL(record.image);
      editMainPhotoThumb.src = editMainPhotoThumbUrl;
    }
  }

  // Ensure related-photo cards are populated for this record when Edit opens.
  pendingSupportingPhotos = Array.isArray(record.supportingPhotos) ? [...record.supportingPhotos] : [];
  renderSupportingPreview(pendingSupportingPhotos);

  editStatus.textContent = '';
  editDialog.showModal();
}

function closeEdit() {
  if (editDialog.open) editDialog.close();
  editStatus.textContent = '';
  if (editMainPhotoThumbUrl) {
    URL.revokeObjectURL(editMainPhotoThumbUrl);
    editMainPhotoThumbUrl = null;
  }
}




function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}


async function ensureJsZip() {
  if (window.JSZip) return window.JSZip;

  await new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-papa-golf-jszip]');
    if (existing) {
      existing.addEventListener('load', resolve, { once: true });
      existing.addEventListener('error', reject, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';
    script.async = true;
    script.dataset.papaGolfJszip = '1';
    script.onload = resolve;
    script.onerror = () => reject(new Error('Could not load ZIP library. Check your internet connection.'));
    document.head.appendChild(script);
  });

  if (!window.JSZip) throw new Error('ZIP library failed to load.');
  return window.JSZip;
}

async function makePapaGolfUpdateZip(filename, html) {
  const JSZip = await ensureJsZip();
  const zip = new JSZip();
  zip.file(filename, html);
  return await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });
}


// ---------- Supporting photo gallery ----------
let pendingSupportingPhotos = [];


function displayInheritedValue(value){
  if(value === undefined || value === null) return '';
  if(Array.isArray(value)) return value.filter(Boolean).join(', ');
  if(typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value).trim();
}

function getInheritedValue(record, key){
  if(!record) return '';
  if(key === 'description') return record?.fields?.description ?? record?.description ?? '';
  if(key === 'category') return record?.fields?.category ?? record?.category ?? '';
  if(key === 'locationName') return record?.fields?.locationName ?? record?.locationName ?? '';
  if(key === 'areaName') return record?.fields?.areaName ?? record?.areaName ?? '';
  if(key === 'people') return record?.fields?.people ?? record?.people ?? '';
  if(key === 'tags') return record?.fields?.tags ?? record?.tags ?? '';
  if(record?.fields && record.fields[key] !== undefined) return record.fields[key];
  if(record?.visitorFields && record.visitorFields[key] !== undefined) return record.visitorFields[key];
  return record?.[key] ?? '';
}

function relatedInheritedPlaceholder(record, key, label='Inherited'){
  const shown = displayInheritedValue(getInheritedValue(record, key));
  return shown ? `Inherited: ${shown}` : `${label}: no value set`;
}

function normalizeRelatedPhoto(item, index = 0) {
  if (item instanceof Blob) {
    return {
      id: `photo-${Date.now()}-${index}-${Math.random().toString(36).slice(2,8)}`,
      imageBlob: item,
      filename: item.name || `related-photo-${index+1}`,
      mimeType: item.type || 'image/jpeg',
      captureDate: '',
      gps: null,
      metadata: {},
      title: '',
      description: '',
      tags: '',
      role: 'standard',
      inherited: true,
      placeOverrides: {}
    };
  }
  if(item && typeof item==='object'){
    if(!item.metadata)item.metadata={};
    if(!item.placeOverrides)item.placeOverrides={};

    // v0.19.8: one description per photo.
    // Preserve any earlier photo-specific "place description override" by
    // migrating it into the related photo's own description when needed.
    const legacyDescription = String(item.placeOverrides?.description ?? '').trim();
    if(!String(item.description ?? '').trim() && legacyDescription){
      item.description = legacyDescription;
    }
    if(Object.prototype.hasOwnProperty.call(item.placeOverrides, 'description')){
      delete item.placeOverrides.description;
    }
  }
  return item;
}

function effectiveRelatedField(photo, record, fieldId){
  const overrides=photo?.placeOverrides||{};
  if(Object.prototype.hasOwnProperty.call(overrides,fieldId) && String(overrides[fieldId]??'').trim()!=='') return overrides[fieldId];
  return record?.fields?.[fieldId] ?? '';
}

function relatedBlob(item) {
  if (item instanceof Blob) return item;
  if (item?.imageBlob instanceof Blob) return item.imageBlob;
  if (item?.image instanceof Blob) return item.image;
  return null;
}


function inheritedValueForRelated(record, fieldId){
  if(!record) return '';

  const directMap = {
    description: record?.fields?.description ?? record?.description ?? '',
    category: record?.fields?.category ?? record?.category ?? '',
    locationName: record?.fields?.locationName ?? record?.locationName ?? '',
    areaName: record?.fields?.areaName ?? record?.areaName ?? '',
    people: record?.fields?.people ?? record?.people ?? '',
    tags: record?.fields?.tags ?? record?.tags ?? ''
  };
  if(Object.prototype.hasOwnProperty.call(directMap, fieldId)) return directMap[fieldId];

  if(record?.fields && Object.prototype.hasOwnProperty.call(record.fields, fieldId)){
    return record.fields[fieldId];
  }
  if(record?.visitorFields && Object.prototype.hasOwnProperty.call(record.visitorFields, fieldId)){
    return record.visitorFields[fieldId];
  }

  // Some visitor/place fields may be stored under a custom-field ID.
  const wanted = String(fieldId || '').toLowerCase().replace(/[^a-z0-9]/g,'');
  const fieldDef = (typeof customFields !== 'undefined' ? customFields : []).find(f => {
    const id = String(f?.id || '').toLowerCase().replace(/[^a-z0-9]/g,'');
    const label = String(f?.label || '').toLowerCase().replace(/[^a-z0-9]/g,'');
    return id === wanted || label === wanted;
  });
  if(fieldDef){
    if(record?.fields && record.fields[fieldDef.id] !== undefined) return record.fields[fieldDef.id];
    if(record?.visitorFields && record.visitorFields[fieldDef.id] !== undefined) return record.visitorFields[fieldDef.id];
  }

  return '';
}

function inheritedPlaceholderForRelated(record, fieldId){
  const value = inheritedValueForRelated(record, fieldId);
  const shown = displayInheritedValue(value);
  return shown ? `Inherited: ${shown}` : 'Inherited: no value set';
}

function renderSupportingPreview(items = []) {
  if (!supportingPhotosPreview) return;
  supportingPhotosPreview.innerHTML = '';
  items.forEach((raw, index) => {
    const photo = normalizeRelatedPhoto(raw, index);
    if (raw instanceof Blob) items[index] = photo;
    const blob = relatedBlob(photo);
    if (!(blob instanceof Blob)) return;

    const card = document.createElement('div');
    card.className = 'related-photo-card';

    const img = document.createElement('img');
    const url = URL.createObjectURL(blob);
    img.src = url;
    img.alt = photo.filename || `Related photo ${index+1}`;
    img.onload = () => URL.revokeObjectURL(url);

    const fields = document.createElement('div');
    fields.className = 'related-photo-fields';
    fields.innerHTML = `
      <label>Photo role
        <select data-related-field="role">
          <option value="featured">Featured / Sellable</option>
          <option value="standard">Standard</option>
          <option value="context">Context / Filler</option>
        </select>
      </label>
      <label>Title / caption
        <input data-related-field="title" type="text" placeholder="Optional photo-specific title">
      </label>
      <label>Photo Description
        <textarea data-related-field="description" rows="3" placeholder="${escapeHtml(inheritedPlaceholderForRelated(activeRecord, 'description'))}"></textarea>
        <span class="small muted">Leave blank to inherit the main photo description. Type here only when this photo needs a different description.</span>
      </label>
      <label>Photo tags
        <input data-related-field="tags" type="text" placeholder="e.g. pigs, beach, jetski">
      </label>
      <details class="related-inherited-editor">
        <summary>Inherited place information · edit for this photo</summary>
        <p class="small muted">These are shared place details. The current inherited value is shown in each field; type a different value only when this photo needs an exception.</p>
        <label>Category override
          <input data-place-override="category" type="text" placeholder="${escapeHtml(inheritedPlaceholderForRelated(activeRecord, 'category'))}">
        </label>
        <label>Location name override
          <input data-place-override="locationName" type="text" placeholder="${escapeHtml(inheritedPlaceholderForRelated(activeRecord, 'locationName'))}">
        </label>
        <label>Area / Place override
          <input data-place-override="areaName" type="text" placeholder="${escapeHtml(inheritedPlaceholderForRelated(activeRecord, 'areaName'))}">
        </label>
        <div class="related-custom-overrides"></div>
      </details>
      <div class="small muted related-photo-metadata"></div>
      <div class="small muted">Original file: ${escapeHtml(photo.filename || 'photo')} · This photo remains independently editable.</div>
    `;

    const role = fields.querySelector('[data-related-field="role"]');
    const title = fields.querySelector('[data-related-field="title"]');
    const desc = fields.querySelector('[data-related-field="description"]');
    const tags = fields.querySelector('[data-related-field="tags"]');
    role.value = photo.role || 'standard';
    title.value = photo.title || '';
    desc.value = photo.description || '';
    tags.value = photo.tags || '';

    const overrideBox=fields.querySelector('.related-custom-overrides');
    customFields.filter(f=>!['title','description','category','areaName','locationName'].includes(f.id)).forEach(field=>{
      const lab=document.createElement('label');
      lab.textContent=`${field.label} override`;
      const input=document.createElement('input');
      input.type='text';
      input.dataset.placeOverride=field.id;
      input.placeholder = inheritedPlaceholderForRelated(activeRecord, field.id);
      input.value=visitorText(photo.placeOverrides?.[field.id]||'');
      lab.appendChild(input); overrideBox.appendChild(lab);
    });
    fields.querySelectorAll('[data-place-override]').forEach(el=>{
      el.value=visitorText(photo.placeOverrides?.[el.dataset.placeOverride]||'');
      el.addEventListener('input',()=>{
        photo.placeOverrides=photo.placeOverrides||{};
        const v=el.value.trim();
        if(v)photo.placeOverrides[el.dataset.placeOverride]=v;
        else delete photo.placeOverrides[el.dataset.placeOverride];
      });
    });
    const md=fields.querySelector('.related-photo-metadata');
    const mm=photo.metadata||{};
    const bits=[];
    if(mm.dateTime||photo.captureDate)bits.push(`Date: ${mm.dateTime||photo.captureDate}`);
    if(Number.isFinite(mm.latitude)&&Number.isFinite(mm.longitude))bits.push(`GPS: ${mm.latitude.toFixed(5)}, ${mm.longitude.toFixed(5)}`);
    if(mm.width&&mm.height)bits.push(`${mm.width}×${mm.height}`);
    if(mm.make||mm.model)bits.push([mm.make,mm.model].filter(Boolean).join(' '));
    if(mm.size)bits.push(`${Math.round(mm.size/1024)} KB`);
    md.textContent=bits.length?`Photo metadata: ${bits.join(' · ')}`:'Photo metadata: no embedded EXIF found.';

    [role,title,desc,tags].forEach(el => el.addEventListener('input', () => {
      photo[el.dataset.relatedField] = el.value;
    }));

    const remove = document.createElement('button');
    remove.type='button';
    remove.className='secondary';
    remove.textContent='Remove from collection';
    remove.addEventListener('click',()=>{
      pendingSupportingPhotos.splice(index,1);
      renderSupportingPreview(pendingSupportingPhotos);
    });

    card.append(img,fields,remove);
    supportingPhotosPreview.appendChild(card);
  });
}


async function materializeSafeRelatedPhotos(items = []) {
  const safe = [];
  for (let i = 0; i < items.length; i++) {
    const raw = items[i];
    const photo = normalizeRelatedPhoto(raw, i);
    const blob = relatedBlob(photo);
    if (!(blob instanceof Blob) || !blob.size) {
      throw new Error(`Related photo ${i + 1} has no readable image bytes. No changes were saved.`);
    }

    const fallbackType =
      photo?.metadata?.type ||
      photo?.mimeType ||
      blob.type ||
      'image/jpeg';

    const safeBlob = await materializeSafeBlob(blob, fallbackType);

    safe.push({
      ...photo,
      imageBlob: safeBlob,
      // Avoid carrying a second stale Blob reference if an older record used `image`.
      ...(Object.prototype.hasOwnProperty.call(photo, 'image') ? { image: undefined } : {})
    });
  }
  return safe;
}

function renderDetailSupportingGallery(record) {
  if (!detailSupportingGallery || !detailImage) return;

  const collection=[];
  const entryBlob = record?.image instanceof Blob ? record.image :
                    record?.imageBlob instanceof Blob ? record.imageBlob : null;
  if(entryBlob){
    const entryFields = normalizeRecordFieldValues(record.fields || {});
    collection.push({
      id: record.id || 'entry',
      imageBlob: entryBlob,
      entry:true,
      role:'featured',
      title:entryFields.title || record.metadata?.filename || 'Entry photo',
      description:entryFields.description || entryFields.notes || '',
      tags:Array.isArray(entryFields.tags) ? entryFields.tags.join(', ') : (entryFields.tags || ''),
      captureDate:record.metadata?.dateTaken || record.metadata?.captureDate || '',
      gps:record.metadata?.gps || record.gps || null,
      filename:record.metadata?.filename || ''
    });
  }
  const extras=Array.isArray(record?.supportingPhotos)?record.supportingPhotos:[];
  extras.forEach((raw,index)=>{
    const p=normalizeRelatedPhoto(raw,index);
    if(relatedBlob(p) instanceof Blob) collection.push({...p,entry:false});
  });

  let activeIndex=0;
  let activeObjectUrl='';

  function renderActive(){
    const active=collection[activeIndex];
    if(!active)return;
    const blob=relatedBlob(active);
    if(activeObjectUrl)URL.revokeObjectURL(activeObjectUrl);
    activeObjectUrl=URL.createObjectURL(blob);
    detailImage.src=activeObjectUrl;
    detailImage.dataset.dynamicObjectUrl=activeObjectUrl;

    if(activePhotoInfo){
      if(active.entry){
        // The established record information below is the entry photo's information.
        activePhotoInfo.classList.add('hidden');
        if(detailCustomFieldsSection) detailCustomFieldsSection.classList.remove('hidden');
        if(detailMetadataSection) detailMetadataSection.classList.remove('hidden');
      }else{
        // Related photo: show only this photo's own information, not the entry photo's data.
        activePhotoInfo.classList.remove('hidden');
        if(detailCustomFieldsSection) detailCustomFieldsSection.classList.add('hidden');
        if(detailMetadataSection) detailMetadataSection.classList.add('hidden');

        const roleLabel=
          active.role==='featured'?'Featured / Sellable':
          active.role==='context'?'Context / Filler':'Standard';
        activePhotoRole.textContent=roleLabel;
        activePhotoTitle.textContent=active.title || 'Untitled photo';
        activePhotoDescription.textContent=String(active.description || '').trim() || String(record?.fields?.description || '').trim();
        const meta=[];
        if(active.captureDate)meta.push(`Date: ${active.captureDate}`);
        if(active.filename)meta.push(`File: ${active.filename}`);
        if(active.gps?.lat!=null && active.gps?.lng!=null)meta.push(`GPS: ${active.gps.lat}, ${active.gps.lng}`);
        activePhotoMeta.textContent=meta.join(' · ');
        activePhotoTags.textContent=active.tags ? `Tags: ${active.tags}` : '';
      }
    }

    detailSupportingGallery.innerHTML='';
    collection.forEach((photo,index)=>{
      if(index===activeIndex)return; // active photo lives only in large viewer
      const blob=relatedBlob(photo);
      const button=document.createElement('button');
      button.type='button';
      button.className='filmstrip-thumb'+(photo.role==='context'?' context-photo':'');
      button.title=photo.entry?'Scanned / entry photo':(photo.title||`Photo ${index+1}`);
      const img=document.createElement('img');
      const thumbUrl=URL.createObjectURL(blob);
      img.src=thumbUrl;
      img.alt=photo.title||`Photo ${index+1}`;
      img.onload=()=>URL.revokeObjectURL(thumbUrl);
      button.appendChild(img);
      button.addEventListener('click',()=>{
        activeIndex=index;
        renderActive();
      });
      detailSupportingGallery.appendChild(button);
    });
  }

  renderActive();
}
async function blobsToDataUrls(items = []) {
  const result=[];
  for(const raw of items){
    const blob=relatedBlob(raw);
    if(blob instanceof Blob) result.push(await blobToDataUrl(blob));
  }
  return result;
}

if (supportingPhotosInput) {
  supportingPhotosInput.addEventListener('change', async () => {
    const files=Array.from(supportingPhotosInput.files||[]);
    for(const file of files){
      if(!file.type.startsWith('image/'))continue;
      const photo=normalizeRelatedPhoto(file,pendingSupportingPhotos.length);
      const [dims,exif]=await Promise.all([getImageDimensions(file),readExif(file)]);
      photo.metadata={
        filename:file.name||photo.filename,
        type:file.type||photo.mimeType,
        size:file.size||0,
        lastModified:file.lastModified||0,
        width:dims?.width||null,
        height:dims?.height||null,
        ...exif
      };
      photo.captureDate=exif?.dateTime||'';
      photo.gps=(Number.isFinite(exif?.latitude)&&Number.isFinite(exif?.longitude))?{lat:exif.latitude,lng:exif.longitude}:null;
      pendingSupportingPhotos.push(photo);
    }
    renderSupportingPreview(pendingSupportingPhotos);
    supportingPhotosInput.value='';
  });
}

// ---------- Public page + QR publishing ----------
function slugifyPublic(value) {
  return String(value || 'papa-golf-location')
    .normalize('NFKD').toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    .slice(0,72) || 'papa-golf-location';
}
function publicBaseUrl() {
  const path=window.location.pathname.endsWith('/')?window.location.pathname:window.location.pathname.replace(/[^/]*$/,'');
  return `${window.location.origin}${path}`;
}
function updatePublishUrl() {
  const slug=slugifyPublic(publishSlug.value);
  publishSlug.value=slug;
  const url=`${publicBaseUrl()}${slug}.html`;
  publishUrl.textContent=url;
  const qr=`https://api.qrserver.com/v1/create-qr-code/?size=600x600&margin=20&format=png&data=${encodeURIComponent(url)}`;
  publishQrImage.src=qr; openQrBtn.href=qr;
  return {slug,url};
}
function blobToDataUrl(blob) {
  return new Promise((resolve,reject)=>{
    if(!(blob instanceof Blob)||!blob.size)return resolve('');
    const r=new FileReader();r.onload=()=>resolve(String(r.result||''));r.onerror=()=>reject(r.error||new Error('Could not read image'));r.readAsDataURL(blob);
  });
}
function publicFieldRows(record) {
  return customFields.filter(f=>!['title','description','category','areaName','locationName'].includes(f.id)).map(f=>{
    const v=visitorText(normalizeSavedValue(f,record.fields?.[f.id]));if(!v)return '';
    return `<div class="info-row"><div class="info-label">${escapeHtml(f.label)}</div><div class="info-value">${escapeHtml(v)}</div></div>`;
  }).filter(Boolean).join('');
}
async function buildStandalonePublicPage(record) {
  const imageData=await blobToDataUrl(record.image);
  const title=visitorText(record.fields?.title)||visitorText(record.fields?.locationName)||'Papa Golf location';
  const category=visitorText(record.fields?.category);
  const place=[visitorText(record.fields?.locationName),visitorText(record.fields?.areaName)].filter(Boolean).join(' · ');
  const description=visitorText(record.fields?.description);
  const lat=Number(record.metadata?.latitude),lng=Number(record.metadata?.longitude),hasGps=Number.isFinite(lat)&&Number.isFinite(lng);
  const rows=publicFieldRows(record);
  const safeTitle=escapeHtml(title),safeCategory=escapeHtml(category),safePlace=escapeHtml(place),safeDescription=escapeHtml(description).replace(/\n/g,'<br>');
  const safeImage=imageData.replace(/"/g,'&quot;');
  const mapHtml=hasGps?`<section class="map-section"><div class="section-title">Location</div><div id="map" class="map"></div><div class="actions"><a class="primary" href="https://www.google.com/maps/search/?api=1&query=${lat},${lng}" target="_blank" rel="noopener">Open in Google Maps</a><button id="locateBtn" type="button">Show where I am</button></div><div id="locationStatus" class="status"></div></section>`:'';
  const mapScripts=hasGps?`<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"><\/script><script>(function(){const target=[${lat},${lng}],map=L.map('map',{scrollWheelZoom:false}).setView(target,15);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap contributors'}).addTo(map);L.marker(target).addTo(map).bindPopup(${JSON.stringify(title)});const b=document.getElementById('locateBtn'),st=document.getElementById('locationStatus');if(b)b.addEventListener('click',()=>{if(!navigator.geolocation){st.textContent='Location is not supported.';return;}st.textContent='Finding your location…';navigator.geolocation.getCurrentPosition(p=>{const here=[p.coords.latitude,p.coords.longitude],acc=Math.max(Number(p.coords.accuracy)||0,5);L.circle(here,{radius:acc}).addTo(map);L.marker(here).addTo(map).bindPopup('You are here').openPopup();map.fitBounds([target,here],{padding:[34,34],maxZoom:16});st.textContent='Your location shown · accuracy about '+Math.round(acc)+' m';},()=>st.textContent='Could not get your location.',{enableHighAccuracy:true,timeout:12000,maximumAge:15000});});})();<\/script>`:'';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#0b0b0b"><title>${safeTitle} · Papa Golf</title>${hasGps?'<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">':''}<style>*{box-sizing:border-box}html,body{margin:0;background:#0b0b0b;color:#f7f4ec;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.page{width:min(100%,680px);margin:auto}.brand{padding:16px;font-size:13px;font-weight:900;letter-spacing:.18em;color:#e0bc66;border-bottom:1px solid #292929}.hero{display:block;width:100%;max-height:58vh;object-fit:cover;background:#151515}.content{padding:20px 16px 30px}.category{display:inline-block;margin-bottom:9px;padding:5px 9px;border:1px solid rgba(224,188,102,.45);border-radius:999px;color:#e0bc66;font-size:11px;font-weight:800;text-transform:uppercase}h1{margin:0;font-size:clamp(30px,9vw,44px);line-height:1.02}.place{margin-top:9px;color:#c7c1b4;font-size:16px;font-weight:700}.description{margin-top:20px;font-size:17px;line-height:1.58}.fields{margin-top:22px;border-top:1px solid #292929}.info-row{display:grid;grid-template-columns:minmax(112px,.8fr) minmax(0,1.4fr);gap:14px;padding:14px 0;border-bottom:1px solid #292929}.info-label{color:#8e897e;font-size:12px;font-weight:800;text-transform:uppercase}.info-value{font-size:15px;line-height:1.4}.map-section{margin-top:26px}.section-title{margin-bottom:10px;font-size:19px;font-weight:850}.map{height:320px;border:1px solid #292929;border-radius:14px;overflow:hidden}.actions{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:10px}.actions a,.actions button{min-height:48px;padding:11px 13px;border-radius:12px;font:700 15px/1.2 inherit;text-align:center;text-decoration:none}.actions .primary{display:grid;place-items:center;background:#e0bc66;color:#121212;border:1px solid #e0bc66}.actions button{background:#151515;color:#f7f4ec;border:1px solid #383838}.status{min-height:20px;margin-top:8px;color:#9a958b;font-size:12px}.footer{margin-top:30px;padding-top:18px;border-top:1px solid #292929;color:#706b62;font-size:11px;text-align:center;text-transform:uppercase;letter-spacing:.08em}@media(max-width:480px){.info-row,.actions{grid-template-columns:1fr}}
      .photo-collection{margin-top:22px}
      .photo-collection h2{font-size:1.1rem;margin:0 0 10px}
      .public-filmstrip{display:flex;gap:9px;overflow-x:auto;padding:2px 2px 8px;scroll-snap-type:x proximity}
      .public-thumb{flex:0 0 82px;border:2px solid transparent;border-radius:11px;padding:0;background:transparent;overflow:hidden;scroll-snap-align:start}
      .public-thumb.active{border-color:currentColor}
      .public-thumb img{display:block;width:78px;height:78px;object-fit:cover}
      .filmstrip-hint{font-size:.82rem;opacity:.7;margin-top:5px}

  img { border-radius: 18px; }
  .hero img, .hero-image, .visitor-image, .filmstrip img, .thumb img {
    border-radius: 18px !important;
    overflow: hidden;
    clip-path: inset(0 round 18px);
    -webkit-clip-path: inset(0 round 18px);
  }

  /* Papa Golf v0.18.7 public photo display */
  .hero img, .hero-image, .visitor-image, #visitorImage, .main-photo, .active-photo {
    display:block !important;
    width:calc(100% - 32px) !important;
    height:auto !important;
    max-height:none !important;
    aspect-ratio:auto !important;
    object-fit:contain !important;
    object-position:center !important;
    margin:16px auto 0 !important;
    border-radius:18px !important;
    overflow:hidden !important;
    clip-path:inset(0 round 18px) !important;
    -webkit-clip-path:inset(0 round 18px) !important;
  }
</style></head><body><main class="page"><div class="brand">PAPA GOLF</div>${imageData?`<img class="hero" src="${safeImage}" alt="${safeTitle}">`:''}<div class="content">${category?`<div class="category">${safeCategory}</div>`:''}<h1>${safeTitle}</h1>${place?`<div class="place">${safePlace}</div>`:''}${description?`<div class="description">${safeDescription}</div>`:''}${rows?`<div class="fields">${rows}</div>`:''}${mapHtml}<div class="footer">Papa Golf · Explore the story behind the place</div></div></main>${mapScripts}</body></html>`;
}
async function downloadPublishedPage(){
  if(!publishRecord)return;

  const originalLabel=generatePageBtn.textContent;
  generatedPageLink.classList.add('hidden');
  generatedPageLink.removeAttribute('href');
  publishStatus.textContent='Creating GitHub update package…';
  generatePageBtn.textContent='Creating…';
  generatePageBtn.disabled=true;

  let objectUrl=null;

  try{
    const {slug}=updatePublishUrl();
    const html=await buildStandalonePublicPage(publishRecord);
    const pageFilename=`${slug}.html`;
    const zipBlob=await makePapaGolfUpdateZip(pageFilename, html);
    const publishDate=new Date().toISOString().slice(0,10).replaceAll('-','');
    const updateZipName=`papa-golf-publish-${slug}-${publishDate}.zip`;
    const file=new File([zipBlob],updateZipName,{type:'application/zip'});

    objectUrl=URL.createObjectURL(zipBlob);
    generatedPageLink.href=objectUrl;
    generatedPageLink.download=updateZipName;
    generatedPageLink.textContent='Open update ZIP';
    generatedPageLink.classList.remove('hidden');

    if(navigator.share){
      let canShare=true;
      if(navigator.canShare){
        try{canShare=navigator.canShare({files:[file]});}
        catch{canShare=false;}
      }

      if(canShare){
        publishStatus.textContent=`Update package ready as ${updateZipName}. In the Share sheet choose “Save to Files”, then upload it to GitHub.`;
        try{
          await navigator.share({
            files:[file],
            title:`Papa Golf update — ${slug}`
          });

          if(publishRecord){
            const marked=await markPublicationState({
              ...publishRecord,
              publication:{...(publishRecord.publication||{}),slug}
            });
            publishRecord=marked;
            activeRecord=marked;
            renderPublicationStatus(marked);
          }

          publishStatus.textContent=`${updateZipName} created. Upload that single ZIP to the repository root; GitHub will apply ${pageFilename} automatically.`;
          return;
        }catch(err){
          if(err?.name==='AbortError'){
            publishStatus.textContent='Share sheet closed. Tap Create GitHub update again when ready.';
            return;
          }
        }
      }
    }

    publishStatus.textContent='Update package created. Tap “Open update ZIP” below, then use Safari Share → Save to Files.';
  }catch(e){
    publishStatus.textContent=`Could not create GitHub update: ${e?.message||e}`;
  }finally{
    generatePageBtn.disabled=false;
    generatePageBtn.textContent=originalLabel;
    if(objectUrl)setTimeout(()=>URL.revokeObjectURL(objectUrl),300000);
  }
}
// v0.14.1: Update Public Page opens the same publishing workflow.
if (publicationUpdateBtn) {
  publicationUpdateBtn.addEventListener('click', () => {
    publishQrBtn.click();
  });
}

publishQrBtn.addEventListener('click',()=>{if(!activeRecord)return;publishRecord=activeRecord;publishSlug.value=slugifyPublic(activeRecord.publication?.slug||activeRecord.fields?.locationName||activeRecord.fields?.title||activeRecord.metadata?.filename);generatedPageLink.classList.add('hidden');generatedPageLink.removeAttribute('href');generatePageBtn.textContent='Create GitHub update';updatePublishUrl();publishStatus.textContent=`Ready to package ${publishSlug.value}.html into papa-golf-update.zip.`;publishDialog.showModal();});
publishSlug.addEventListener('input',updatePublishUrl);
generatePageBtn.addEventListener('click',downloadPublishedPage);
closePublishBtn.addEventListener('click',()=>publishDialog.close());
publishDialog.addEventListener('cancel',e=>{e.preventDefault();publishDialog.close();});

function closeVisitorPreview(){
  if(visitorImageUrl){URL.revokeObjectURL(visitorImageUrl);visitorImageUrl=null;}
  if(visitorMap){visitorMap.remove();visitorMap=null;visitorUserMarker=null;visitorAccuracyCircle=null;}
  if(visitorDialog.open)visitorDialog.close();
}
function visitorText(v){return Array.isArray(v)?v.join(', '):String(v??'').trim();}
function openVisitorPreview(record){
  if(visitorImageUrl)URL.revokeObjectURL(visitorImageUrl);
  visitorImageUrl=null;

  const fields=normalizeRecordFieldValues(record.fields||{});
  const collection=[];
  const entryBlob=record?.image instanceof Blob ? record.image :
                  record?.imageBlob instanceof Blob ? record.imageBlob : null;

  if(entryBlob){
    collection.push({
      imageBlob:entryBlob,
      entry:true,
      role:'featured',
      title:fields.title || record.metadata?.filename || 'Papa Golf photo',
      description:fields.description || fields.notes || '',
      tags:Array.isArray(fields.tags)?fields.tags.join(', '):(fields.tags||''),
      captureDate:record.metadata?.dateTime || record.metadata?.dateTaken || '',
      filename:record.metadata?.filename || ''
    });
  }

  const extras=Array.isArray(record?.supportingPhotos)?record.supportingPhotos:[];
  extras.forEach((raw,index)=>{
    const p=normalizeRelatedPhoto(raw,index);
    if(relatedBlob(p) instanceof Blob)collection.push({...p,entry:false});
  });

  let activeIndex=0;
  let activeVisitorUrl='';

  function renderVisitorSharedFields(active){
    visitorFields.innerHTML='';
    customFields.forEach(field=>{
      if(['title','description','category','areaName','locationName'].includes(field.id))return;
      const rawValue=active && !active.entry ? effectiveRelatedField(active,record,field.id) : record.fields?.[field.id];
      const value=visitorText(normalizeSavedValue(field,rawValue));
      if(!value)return;
      const row=document.createElement('div'); row.className='visitor-info-row';
      const label=document.createElement('div'); label.className='visitor-info-label'; label.textContent=field.label;
      const text=document.createElement('div'); text.className='visitor-info-value'; text.textContent=value;
      row.append(label,text); visitorFields.append(row);
    });
  }

  function renderVisitorActive(){
    const active=collection[activeIndex];
    if(!active)return;
    const blob=relatedBlob(active);

    if(activeVisitorUrl)URL.revokeObjectURL(activeVisitorUrl);
    activeVisitorUrl=URL.createObjectURL(blob);
    visitorImageUrl=activeVisitorUrl;
    visitorHero.src=activeVisitorUrl;
    visitorHeroWrap.classList.remove('hidden');

    // Entry photo uses the established visitor information.
    if(active.entry){
      visitorCategory.textContent=visitorText(fields.category);
      visitorCategory.classList.toggle('hidden',!visitorCategory.textContent);
      visitorTitle.textContent=visitorText(fields.title)||visitorText(fields.locationName)||'Papa Golf location';
      visitorPlace.textContent=[visitorText(fields.locationName),visitorText(fields.areaName)].filter(Boolean).join(' · ');
      visitorDescription.textContent=visitorText(fields.description);
      visitorDescription.classList.toggle('hidden',!visitorDescription.textContent);
      visitorActivePhotoInfo.classList.add('hidden');
      visitorFields.classList.remove('hidden');
    }else{
      const effectiveCategory=visitorText(effectiveRelatedField(active,record,'category'));
      visitorCategory.textContent=effectiveCategory || (
        active.role==='featured'?'Featured / Sellable':
        active.role==='context'?'Context / Filler':'Standard');
      visitorCategory.classList.remove('hidden');
      visitorTitle.textContent=active.title || 'Untitled photo';
      visitorPlace.textContent=[visitorText(effectiveRelatedField(active,record,'locationName')),visitorText(effectiveRelatedField(active,record,'areaName'))].filter(Boolean).join(' · ');
      visitorDescription.textContent=active.description || visitorText(effectiveRelatedField(active,record,'description')) || '';
      visitorDescription.classList.toggle('hidden',!visitorDescription.textContent);
      visitorFields.classList.remove('hidden'); // related photo still belongs to this place/experience

      const bits=[];
      if(active.captureDate)bits.push(`Date: ${active.captureDate}`);
      if(active.filename)bits.push(`File: ${active.filename}`);
      if(active.tags)bits.push(`Tags: ${active.tags}`);
      visitorActivePhotoInfo.textContent=bits.join(' · ');
      visitorActivePhotoInfo.classList.toggle('hidden',!bits.length);
    }

    renderVisitorSharedFields(active);

    visitorFilmstrip.innerHTML='';
    collection.forEach((photo,index)=>{
      if(index===activeIndex)return;
      const b=document.createElement('button');
      b.type='button';
      b.className='visitor-thumb'+(photo.role==='context'?' context-photo':'');
      const img=document.createElement('img');
      const u=URL.createObjectURL(relatedBlob(photo));
      img.src=u;
      img.alt=photo.title||`Photo ${index+1}`;
      img.onload=()=>URL.revokeObjectURL(u);
      b.appendChild(img);
      b.addEventListener('click',()=>{
        activeIndex=index;
        renderVisitorActive();
      });
      visitorFilmstrip.appendChild(b);
    });
  }

  if(!collection.length){
    visitorHeroWrap.classList.add('hidden');
    visitorFilmstrip.innerHTML='';
  }else{
    renderVisitorActive();
  }


  const lat=Number(record.metadata?.latitude),lng=Number(record.metadata?.longitude);
  const hasGps=Number.isFinite(lat)&&Number.isFinite(lng);
  visitorMapSection.classList.toggle('hidden',!hasGps);
  visitorLocationStatus.textContent='';
  visitorDialog.showModal();

  if(visitorMap){visitorMap.remove();visitorMap=null;}
  if(hasGps&&window.L){
    visitorGoogleMaps.href=`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    visitorMap=L.map(visitorMiniMap,{scrollWheelZoom:false}).setView([lat,lng],15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap contributors'}).addTo(visitorMap);
    L.marker([lat,lng],{icon:mapMarkerIcon(record)}).addTo(visitorMap);
    setTimeout(()=>visitorMap?.invalidateSize(false),80);
    visitorLocateBtn.onclick=()=>navigator.geolocation.getCurrentPosition(pos=>{
      const ulat=pos.coords.latitude,ulng=pos.coords.longitude,acc=Math.max(Number(pos.coords.accuracy)||0,5);
      if(visitorUserMarker)visitorMap.removeLayer(visitorUserMarker);
      if(visitorAccuracyCircle)visitorMap.removeLayer(visitorAccuracyCircle);
      visitorAccuracyCircle=L.circle([ulat,ulng],{radius:acc,className:'pg-user-accuracy',interactive:false}).addTo(visitorMap);
      const icon=L.divIcon({className:'pg-user-location-icon',html:'<div class="pg-user-dot"><span></span></div><div class="pg-user-label">You are here</div>',iconSize:[120,44],iconAnchor:[14,14]});
      visitorUserMarker=L.marker([ulat,ulng],{icon,zIndexOffset:1000}).addTo(visitorMap);
      visitorMap.fitBounds([[lat,lng],[ulat,ulng]],{padding:[34,34],maxZoom:16,animate:false});
      visitorLocationStatus.textContent=`Your location shown · accuracy about ${Math.round(acc)} m`;
    },()=>visitorLocationStatus.textContent='Could not get your location.',{enableHighAccuracy:true,timeout:12000,maximumAge:15000});
  }
}
visitorPreviewBtn.addEventListener('click',()=>{if(!activeRecord)return;detailDialog.close();openVisitorPreview(activeRecord);});
closeVisitorBtn.addEventListener('click',closeVisitorPreview);
visitorDialog.addEventListener('cancel',e=>{e.preventDefault();closeVisitorPreview();});

editDetailBtn.addEventListener('click', () => openEdit(activeRecord));
if (toggleMainPhotoEditBtn) {
  toggleMainPhotoEditBtn.addEventListener('click', () => {
    const opening = editFields.classList.contains('hidden');
    editFields.classList.toggle('hidden', !opening);
    toggleMainPhotoEditBtn.textContent = opening ? 'Hide main photo details' : 'Edit main photo';
  });
}
closeEditBtn.addEventListener('click', closeEdit);
cancelEditBtn.addEventListener('click', closeEdit);
editDialog.addEventListener('click', event => {
  if (event.target === editDialog) closeEdit();
});
editForm.addEventListener('submit', async event => {
  event.preventDefault();
  if (!activeRecord) return;
  const values = { ...(activeRecord.fields || {}) };
  Object.assign(values, normalizeRecordFieldValues(readFieldValues(editFields)));
  editStatus.textContent = 'Saving changes…';
  try {
    // Always materialize a fresh plain Blob before rewriting an IndexedDB record.
    const safeImage = await materializeSafeBlob(
      activeRecord.image,
      activeRecord.metadata?.type || 'image/jpeg'
    );
    // Safari needs the nested related-photo Blobs materialized too.
    // Otherwise a metadata-only edit can save the text successfully while
    // leaving a related image Blob unreadable after the IndexedDB rewrite.
    const safeSupportingPhotos = await materializeSafeRelatedPhotos(pendingSupportingPhotos);

    const updated = {
      ...activeRecord,
      image: safeImage,
      fields: values,
      supportingPhotos: safeSupportingPhotos,
      updatedAt: new Date().toISOString()
    };
    await putRecord(updated);
    activeRecord = updated;
    pendingSupportingPhotos = safeSupportingPhotos;
    renderPublicationStatus(updated);
    editStatus.textContent = 'Changes saved.';
    await renderGallery();
    if (!areasView.classList.contains('hidden')) await renderAreas();
    closeEdit();

    // The photo itself does not change during a metadata/custom-field edit.
    // Keep the existing object URL alive and refresh only the record text.
    detailTitle.textContent = updated.fields?.title || updated.metadata?.filename || 'Photo details';
    detailCustomFields.innerHTML = '';
    const normalizedUpdatedFields = normalizeRecordFieldValues(updated.fields || {});
    const populated = customFields
      .map(field => [field.id, normalizedUpdatedFields[field.id]])
      .filter(([, value]) => (Array.isArray(value) ? value.join(', ') : String(value || '')).trim());
    if (populated.length) {
      const heading = document.createElement('div');
      heading.className = 'detail-section-title';
      heading.textContent = 'Your information';
      detailCustomFields.appendChild(heading);
      const list = document.createElement('div');
      list.className = 'detail-list';
      populated.forEach(([id, value]) => list.appendChild(detailRow(fieldLabelFor(id), Array.isArray(value) ? value.join(', ') : value)));
      detailCustomFields.appendChild(list);
    }

    const m = updated.metadata || {};
    detailMetadata.innerHTML = '';
    const gps = gpsDisplay(m.latitude, m.longitude);
    const rows = [
      ['Date/time taken', formatTakenDate(m.dateTime)],
      ['GPS coordinates', gps, m.latitude != null && m.longitude != null ? `https://www.google.com/maps/search/?api=1&query=${m.latitude},${m.longitude}` : null],
      ['Device', [m.make, m.model].filter(Boolean).join(' ') || 'Not found'],
      ['Filename', m.filename || '—'],
      ['Dimensions', m.width && m.height ? `${m.width} × ${m.height}` : 'Not found'],
      ['File size', prettyBytes(m.fileSize)],
      ['File type', m.type || 'Not found'],
      ['Saved to prototype', updated.savedAt ? new Date(updated.savedAt).toLocaleString() : 'Not found'],
    ];
    rows.forEach(([label, value, href]) => detailMetadata.appendChild(detailRow(label, value, { href })));
    // Rebuild image URLs from the freshly materialized saved Blobs.
    // This also restores whichever filmstrip images Safari may have invalidated
    // during the IndexedDB rewrite.
    renderDetailSupportingGallery(updated);
  } catch (error) {
    editStatus.textContent = `Could not save: ${error.message || error}`;
  }
});

closeDetailBtn.addEventListener('click', closeDetail);
detailDialog.addEventListener('click', event => {
  if (event.target === detailDialog) closeDetail();
});
detailDialog.addEventListener('close', () => {
  if (detailImageUrl) {
    URL.revokeObjectURL(detailImageUrl);
    detailImageUrl = null;
  }
  detailImage.removeAttribute('src');
});


// ---------- v0.8.1 Search + filtering ----------
const librarySearch = document.querySelector('#librarySearch');
const filterBtn = document.querySelector('#filterBtn');
const filterDialog = document.querySelector('#filterDialog');
const closeFilterBtn = document.querySelector('#closeFilterBtn');
const applyFilterBtn = document.querySelector('#applyFilterBtn');
const resetFilterBtn = document.querySelector('#resetFilterBtn');
const clearFiltersBtn = document.querySelector('#clearFiltersBtn');
const activeFilterBar = document.querySelector('#activeFilterBar');
const activeFilterSummary = document.querySelector('#activeFilterSummary');
const filterArea = document.querySelector('#filterArea');
const filterLocation = document.querySelector('#filterLocation');
const filterCategory = document.querySelector('#filterCategory');
const filterRating = document.querySelector('#filterRating');
const filterGps = document.querySelector('#filterGps');

let libraryQuery = '';
let activeFilters = { area: '', location: '', category: '', rating: '', gps: false };

function ratingOf(record) {
  for (const [key, value] of Object.entries(record.fields || {})) {
    if (!/rating/i.test(key)) continue;
    const match = String(value ?? '').match(/[1-5](?:\.\d+)?/);
    if (match) return Number(match[0]);
  }
  return 0;
}

function recordMatchesFilters(record) {
  const fields = record.fields || {};

  if (libraryQuery) {
    const values = Object.values(fields).flatMap(value => Array.isArray(value) ? value : [value]);
    const haystack = [
      ...values,
      record.metadata?.filename || '',
      record.metadata?.device || ''
    ].join(' ').toLocaleLowerCase();

    if (!haystack.includes(libraryQuery)) return false;
  }

  if (activeFilters.area && String(fields.areaName || '') !== activeFilters.area) return false;
  if (activeFilters.location && String(fields.locationName || '') !== activeFilters.location) return false;

  if (activeFilters.category) {
    const categories = Array.isArray(fields.category) ? fields.category : [fields.category];
    if (!categories.map(value => String(value || '')).includes(activeFilters.category)) return false;
  }

  if (activeFilters.rating && ratingOf(record) < Number(activeFilters.rating)) return false;
  if (activeFilters.gps && !Number.isFinite(record.metadata?.latitude)) return false;

  return true;
}

function filtered(records) {
  return records.filter(recordMatchesFilters);
}

function fillFilterSelect(select, values, firstLabel) {
  if (!select) return;
  const current = select.value;
  select.innerHTML = '';

  const first = document.createElement('option');
  first.value = '';
  first.textContent = firstLabel;
  select.appendChild(first);

  [...new Set(values.filter(Boolean).map(value => String(value).trim()).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b))
    .forEach(value => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = value;
      select.appendChild(option);
    });

  if ([...select.options].some(option => option.value === current)) {
    select.value = current;
  }
}

async function populateFilterOptions() {
  const records = await getRecords();
  fillFilterSelect(filterArea, records.map(record => record.fields?.areaName), 'All areas');
  fillFilterSelect(filterLocation, records.map(record => record.fields?.locationName), 'All locations');
  fillFilterSelect(
    filterCategory,
    records.flatMap(record => Array.isArray(record.fields?.category) ? record.fields.category : [record.fields?.category]),
    'All categories'
  );

  if (filterArea) filterArea.value = activeFilters.area;
  if (filterLocation) filterLocation.value = activeFilters.location;
  if (filterCategory) filterCategory.value = activeFilters.category;
  if (filterRating) filterRating.value = activeFilters.rating;
  if (filterGps) filterGps.checked = activeFilters.gps;
}

function updateFilterSummary() {
  if (!activeFilterBar || !activeFilterSummary) return;
  const parts = [];

  if (activeFilters.area) parts.push(activeFilters.area);
  if (activeFilters.location) parts.push(activeFilters.location);
  if (activeFilters.category) parts.push(activeFilters.category);
  if (activeFilters.rating) parts.push(`Rating ${activeFilters.rating}+`);
  if (activeFilters.gps) parts.push('GPS only');
  if (libraryQuery) parts.push(`Search: “${libraryQuery}”`);

  activeFilterBar.classList.toggle('hidden', parts.length === 0);
  activeFilterSummary.textContent = parts.join(' · ');
}

async function refreshFilteredViews() {
  await renderGallery();
  if (!mapView.classList.contains('hidden')) await renderMap();
  if (!areasView.classList.contains('hidden')) await renderAreas();
  updateFilterSummary();
}

if (librarySearch) {
  librarySearch.addEventListener('input', () => {
    libraryQuery = librarySearch.value.trim().toLocaleLowerCase();
    refreshFilteredViews();
  });
}

if (filterBtn && filterDialog) {
  filterBtn.addEventListener('click', async () => {
    await populateFilterOptions();
    filterDialog.showModal();
  });
}

if (closeFilterBtn && filterDialog) {
  closeFilterBtn.addEventListener('click', () => filterDialog.close());
}

if (applyFilterBtn && filterDialog) {
  applyFilterBtn.addEventListener('click', () => {
    activeFilters = {
      area: filterArea?.value || '',
      location: filterLocation?.value || '',
      category: filterCategory?.value || '',
      rating: filterRating?.value || '',
      gps: Boolean(filterGps?.checked)
    };
    filterDialog.close();
    refreshFilteredViews();
  });
}

if (resetFilterBtn) {
  resetFilterBtn.addEventListener('click', () => {
    if (filterArea) filterArea.value = '';
    if (filterLocation) filterLocation.value = '';
    if (filterCategory) filterCategory.value = '';
    if (filterRating) filterRating.value = '';
    if (filterGps) filterGps.checked = false;
  });
}

if (clearFiltersBtn) {
  clearFiltersBtn.addEventListener('click', () => {
    activeFilters = { area: '', location: '', category: '', rating: '', gps: false };
    libraryQuery = '';
    if (librarySearch) librarySearch.value = '';
    refreshFilteredViews();
  });
}


async function renderGallery() {
  const records = filtered(await getRecords());
  gallery.innerHTML = '';
  emptyState.classList.toggle('hidden', records.length > 0);
  clearAllBtn.classList.toggle('hidden', records.length === 0);
  recordCount.textContent = String(records.length);
  for (const record of records) {
    const card = document.createElement('article');
    card.className = 'gallery-card';
    const img = document.createElement('img');
    img.alt = record.fields?.title || record.metadata?.filename || 'Saved photo';
    if (record.image instanceof Blob && record.image.size > 0) {
      const url = URL.createObjectURL(record.image);
      img.src = url;
      img.onload = () => URL.revokeObjectURL(url);
      img.onerror = () => {
        URL.revokeObjectURL(url);
        img.removeAttribute('src');
        img.alt = 'Photo data needs restore from backup';
        img.classList.add('broken-photo');
      };
    } else {
      img.alt = 'Photo data needs restore from backup';
      img.classList.add('broken-photo');
    }
    const info = document.createElement('div'); info.className = 'gallery-info';
    const title = document.createElement('div'); title.className = 'gallery-title';
    title.textContent = record.fields.title || record.metadata.filename || 'Untitled';
    const meta = document.createElement('div'); meta.className = 'gallery-meta';
    const gps = record.metadata.latitude != null ? ' · GPS ✓' : '';
    const location = record.fields.locationName ? `${record.fields.locationName} · ` : '';
    const area = record.fields.areaName ? `${record.fields.areaName} · ` : '';
    meta.textContent = `${area}${location}${new Date(record.savedAt).toLocaleDateString()}${gps}`;
    const placeLine=document.createElement('div'); placeLine.className='gallery-place-link small muted';
    const linkedPlace=papaGolfPlaceForPhoto(record.id);
    if(linkedPlace)placeLine.innerHTML=`Place: <button type="button" class="gallery-place-button" data-open-photo-place="${escapeHtml(linkedPlace.id)}">${escapeHtml(papaGolfPlaceDisplayName(linkedPlace))}</button>`;
    else placeLine.textContent='Place: indexing…';
    const actions = document.createElement('div'); actions.className = 'gallery-actions';
    const del = document.createElement('button'); del.className = 'delete-record'; del.type = 'button'; del.textContent = 'Delete';
    del.addEventListener('click', async (event) => {
      event.stopPropagation();
      if (confirm('Delete this saved photo from this device?')) { await deleteRecord(record.id); await renderGallery(); }
    });
    actions.appendChild(del); info.append(title, meta, placeLine, actions); card.append(img, info);
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `Open ${title.textContent} details`);
    card.addEventListener('click', () => openDetail(record));
    card.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openDetail(record); } });
    gallery.appendChild(card);
  }
}


function clearMapImageUrls() {
  mapImageUrls.forEach(url => URL.revokeObjectURL(url));
  mapImageUrls = [];
}

function ensureMap() {
  if (photoMap) return;
  if (!window.L) return;

  photoMap = L.map('photoMap', {
    zoomControl: true,
    attributionControl: true
  }).setView([9.512, 100.013], 10);

  standardLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  });

  // Esri World Imagery provides a satellite-style layer without requiring an API key.
  satelliteLayer = L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    {
      maxZoom: 19,
      attribution: 'Tiles &copy; Esri'
    }
  );

  standardLayer.addTo(photoMap);
  mapLayer = L.layerGroup().addTo(photoMap);

  const MapTools = L.Control.extend({
    options: { position: 'topright' },
    onAdd() {
      const container = L.DomUtil.create('div', 'leaflet-bar pg-map-tools');
      container.innerHTML = `
        <button type="button" class="pg-map-tool" data-action="base" aria-label="Switch map style">Satellite</button>
        <button type="button" class="pg-map-tool" data-action="locate" aria-label="Show my location">◎ Locate me</button>
      `;
      L.DomEvent.disableClickPropagation(container);
      L.DomEvent.disableScrollPropagation(container);

      container.querySelector('[data-action="base"]').addEventListener('click', event => {
        const button = event.currentTarget;
        if (activeBaseLayer === 'standard') {
          if (standardLayer) photoMap.removeLayer(standardLayer);
          satelliteLayer.addTo(photoMap);
          activeBaseLayer = 'satellite';
          button.textContent = 'Standard';
        } else {
          if (satelliteLayer) photoMap.removeLayer(satelliteLayer);
          standardLayer.addTo(photoMap);
          activeBaseLayer = 'standard';
          button.textContent = 'Satellite';
        }
      });

      container.querySelector('[data-action="locate"]').addEventListener('click', () => {
        locateUser();
      });

      return container;
    }
  });

  photoMap.addControl(new MapTools());
}

function locateUser() {
  if (!navigator.geolocation) {
    mapStatus.textContent = 'Location is not supported by this browser.';
    return;
  }

  mapStatus.textContent = 'Finding your location…';

  navigator.geolocation.getCurrentPosition(
    position => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const accuracy = Math.max(Number(position.coords.accuracy) || 0, 5);
      lastUserLocation = [lat, lng];

      if (userLocationMarker) photoMap.removeLayer(userLocationMarker);
      if (userAccuracyCircle) photoMap.removeLayer(userAccuracyCircle);

      userAccuracyCircle = L.circle([lat, lng], {
        radius: accuracy,
        className: 'pg-user-accuracy',
        interactive: false
      }).addTo(photoMap);

      const userIcon = L.divIcon({
        className: 'pg-user-location-icon',
        html: '<div class="pg-user-dot"><span></span></div><div class="pg-user-label">You are here</div>',
        iconSize: [120, 44],
        iconAnchor: [14, 14]
      });

      userLocationMarker = L.marker([lat, lng], {
        icon: userIcon,
        zIndexOffset: 1000
      }).addTo(photoMap);

      photoMap.setView([lat, lng], Math.max(photoMap.getZoom(), 15), { animate: false });
      mapStatus.textContent = `Your location shown · accuracy about ${Math.round(accuracy)} m`;
    },
    error => {
      const messages = {
        1: 'Location permission was denied. Allow location access for this site in Safari settings.',
        2: 'Your location could not be determined.',
        3: 'Location request timed out.'
      };
      mapStatus.textContent = messages[error.code] || 'Could not get your location.';
    },
    {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 15000
    }
  );
}


function categoryIcon(categoryValue) {
  const category = String(Array.isArray(categoryValue) ? categoryValue[0] : categoryValue || '').toLocaleLowerCase();
  if (category.includes('beach')) return '🏖';
  if (category.includes('viewpoint')) return '◉';
  if (category.includes('waterfall')) return '💧';
  if (category.includes('restaurant') || category.includes('food')) return '🍴';
  if (category.includes('bar') || category.includes('nightlife')) return '🍹';
  if (category.includes('activity')) return '➤';
  if (category.includes('attraction')) return '★';
  if (category.includes('temple') || category.includes('cultural')) return '◆';
  if (category.includes('accommodation')) return '⌂';
  if (category.includes('shopping')) return '●';
  return '•';
}

function mapMarkerIcon(record) {
  const label = String(record.fields?.locationName || record.fields?.title || '').trim();
  const symbol = categoryIcon(record.fields?.category);

  const marker = document.createElement('div');
  marker.className = 'pg-marker-v09';

  const pin = document.createElement('div');
  pin.className = 'pg-marker-pin-v09';
  pin.textContent = symbol;
  marker.appendChild(pin);

  if (label) {
    const text = document.createElement('div');
    text.className = 'pg-marker-label-v09';
    text.textContent = label;
    marker.appendChild(text);
  }

  return L.divIcon({
    className: 'pg-marker-wrap-v09',
    html: marker.outerHTML,
    iconSize: [170, 46],
    iconAnchor: [16, 36],
    popupAnchor: [0, -34],
  });
}

function popupNode(record) {
  const wrap = document.createElement('div');
  wrap.className = 'map-popup';

  if (record.image instanceof Blob && record.image.size > 0) {
    const img = document.createElement('img');
    const url = URL.createObjectURL(record.image);
    mapImageUrls.push(url);
    img.src = url;
    img.alt = record.fields?.title || record.metadata?.filename || 'Saved photo';
    wrap.appendChild(img);
  }

  const body = document.createElement('div');
  body.className = 'map-popup-body';

  const title = document.createElement('div');
  title.className = 'map-popup-title';
  title.textContent = record.fields?.title || record.metadata?.filename || 'Untitled';

  const location = document.createElement('div');
  location.className = 'map-popup-location';
  const areaText = record.fields?.areaName ? `${record.fields.areaName} · ` : '';
  location.textContent =
    areaText +
    (record.fields?.locationName ||
      gpsDisplay(record.metadata?.latitude, record.metadata?.longitude));

  const actions = document.createElement('div');
  actions.className = 'map-popup-actions';

  const details = document.createElement('button');
  details.type = 'button';
  details.textContent = 'Photo details';
  details.addEventListener('click', () => openDetail(record));

  const google = document.createElement('a');
  google.textContent = 'Google Maps';
  google.href = `https://www.google.com/maps/search/?api=1&query=${record.metadata.latitude},${record.metadata.longitude}`;
  google.target = '_blank';
  google.rel = 'noopener';

  actions.append(details, google);
  body.append(title, location, actions);
  wrap.appendChild(body);

  return wrap;
}

function waitForMapLayout() {
  return new Promise(resolve => {
    requestAnimationFrame(() => {
      requestAnimationFrame(resolve);
    });
  });
}

async function renderMap() {
  await waitForMapLayout();
  ensureMap();
  if (!photoMap || !mapLayer) {
    mapStatus.textContent = 'Map library could not load. Check your internet connection and refresh.';
    return;
  }

  // iPhone Safari can report a zero/incorrect map size immediately after
  // switching from a hidden tab. Force Leaflet to recalculate before
  // setting the camera or adding/fitting markers.
  photoMap.invalidateSize({ pan: false, animate: false });

  const records = filtered(await getRecords());
  const geotagged = records.filter(record => Number.isFinite(record.metadata?.latitude) && Number.isFinite(record.metadata?.longitude));
  mapPinCount.textContent = String(geotagged.length);
  mapEmptyState.classList.toggle('hidden', geotagged.length > 0);
  photoMapEl.classList.toggle('hidden', geotagged.length === 0);
  fitMapBtn.classList.toggle('hidden', geotagged.length === 0);
  mapLayer.clearLayers();
  clearMapImageUrls();
  mapBounds = null;

  if (!geotagged.length) {
    mapStatus.textContent = records.length ? 'Your saved photos do not contain GPS coordinates.' : 'Photos with GPS coordinates appear here automatically.';
    return;
  }

  const points = [];
  geotagged.forEach(record => {
    const lat = record.metadata.latitude;
    const lon = record.metadata.longitude;
    const marker = L.marker([lat, lon], { icon: mapMarkerIcon(record), title: record.fields?.title || 'Papa Golf photo' });
    marker.bindPopup(() => popupNode(record), { className: 'pg-popup', maxWidth: 240 });
    marker.addTo(mapLayer);
    points.push([lat, lon]);
  });
  mapBounds = L.latLngBounds(points);

  await waitForMapLayout();
  photoMap.invalidateSize({ pan: false, animate: false });

  if (points.length === 1) {
    photoMap.setView(points[0], 15, { animate: false });
  } else {
    photoMap.fitBounds(mapBounds, { padding: [28, 28], maxZoom: 16, animate: false });
  }

  mapStatus.textContent = `${geotagged.length} photo location${geotagged.length === 1 ? '' : 's'} shown. Tap a pin to open the photo.`;

  // One final resize after tiles/controls have had a chance to paint.
  setTimeout(() => {
    if (!photoMap) return;
    photoMap.invalidateSize({ pan: false, animate: false });
    if (points.length === 1) photoMap.setView(points[0], 15, { animate: false });
  }, 180);
}

function areaDisplayName(record) {
  return String(record.fields?.areaName || '').trim();
}

async function renderAreas() {
  const records = filtered(await getRecords());
  const grouped = new Map();

  records.forEach(record => {
    const area = areaDisplayName(record);
    if (!area) return;
    const key = area.toLocaleLowerCase();
    if (!grouped.has(key)) grouped.set(key, { name: area, records: [] });
    grouped.get(key).records.push(record);
  });

  const groups = [...grouped.values()].sort((a, b) => a.name.localeCompare(b.name));
  areaCount.textContent = String(groups.length);
  areasList.innerHTML = '';
  areasEmptyState.classList.toggle('hidden', groups.length > 0);

  groups.forEach(group => {
    const card = document.createElement('section');
    card.className = 'area-card';

    const head = document.createElement('div');
    head.className = 'area-card-head';

    const copy = document.createElement('div');
    const eyebrow = document.createElement('div');
    eyebrow.className = 'eyebrow';
    const uniqueLocations = new Set(
      group.records.map(record => String(record.fields?.locationName || '').trim()).filter(Boolean)
    );
    eyebrow.textContent = `${group.records.length} PHOTO RECORD${group.records.length === 1 ? '' : 'S'} · ${uniqueLocations.size || group.records.length} LOCATION${(uniqueLocations.size || group.records.length) === 1 ? '' : 'S'}`;

    const title = document.createElement('h3');
    title.textContent = group.name;
    copy.append(eyebrow, title);
    head.append(copy);
    card.append(head);

    const list = document.createElement('div');
    list.className = 'area-location-list';

    group.records.forEach(record => {
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'area-location-row';

      if (record.image instanceof Blob && record.image.size > 0) {
        const img = document.createElement('img');
        const url = URL.createObjectURL(record.image);
        img.src = url;
        img.alt = record.fields?.title || record.metadata?.filename || 'Saved photo';
        img.onload = () => URL.revokeObjectURL(url);
        img.onerror = () => URL.revokeObjectURL(url);
        row.appendChild(img);
      }

      const text = document.createElement('div');
      text.className = 'area-location-copy';
      const location = document.createElement('strong');
      location.textContent = record.fields?.locationName || record.fields?.title || 'Unnamed location';
      const subtitle = document.createElement('span');
      const category = record.fields?.category ? `${record.fields.category} · ` : '';
      const gps = Number.isFinite(record.metadata?.latitude) ? 'GPS ✓' : 'No GPS';
      subtitle.textContent = `${category}${gps}`;
      text.append(location, subtitle);
      row.append(text);

      row.addEventListener('click', () => openDetail(record));
      list.appendChild(row);
    });

    card.append(list);
    areasList.appendChild(card);
  });
}

async function switchView(view) {
  const showPhotos = view === 'photos';
  const showMap = view === 'map';
  const showAreas = view === 'areas';

  photosView.classList.toggle('hidden', !showPhotos);
  mapView.classList.toggle('hidden', !showMap);
  areasView.classList.toggle('hidden', !showAreas);

  photosTabBtn.classList.toggle('active', showPhotos);
  mapTabBtn.classList.toggle('active', showMap);
  areasTabBtn.classList.toggle('active', showAreas);

  photosTabBtn.setAttribute('aria-selected', String(showPhotos));
  mapTabBtn.setAttribute('aria-selected', String(showMap));
  areasTabBtn.setAttribute('aria-selected', String(showAreas));

  if (showMap) await renderMap();
  if (showAreas) await renderAreas();
}

photosTabBtn.addEventListener('click', () => switchView('photos'));
mapTabBtn.addEventListener('click', () => switchView('map'));
areasTabBtn.addEventListener('click', () => switchView('areas'));
fitMapBtn.addEventListener('click', () => {
  if (!photoMap || !mapBounds) return;
  if (mapBounds.getNorthEast().equals(mapBounds.getSouthWest())) photoMap.setView(mapBounds.getCenter(), 15);
  else photoMap.fitBounds(mapBounds, { padding: [28, 28], maxZoom: 16 });
});

const FIELD_TYPES = [
  ['text','Short text'], ['textarea','Long text'], ['number','Number'], ['date','Date'],
  ['boolean','Yes / No'], ['select','Single choice'], ['multiselect','Multiple choice'],
  ['rating','Rating 1–5'], ['url','URL / Website'], ['tel','Phone number']
];

function fieldTypeSelect(value='text') {
  const select = document.createElement('select');
  select.dataset.role = 'type';
  FIELD_TYPES.forEach(([id,label]) => {
    const option = document.createElement('option');
    option.value=id; option.textContent=label; select.appendChild(option);
  });
  select.value=value;
  return select;
}

function buildFieldRow(field) {
  field = normalizeField(field);
  const row = document.createElement('div');
  row.className='field-row';
  row.dataset.id=field.id;

  const top=document.createElement('div'); top.className='field-row-main';
  const label=document.createElement('input'); label.value=field.label; label.placeholder='Field name'; label.dataset.role='label';
  const type=fieldTypeSelect(field.type);
  const remove=document.createElement('button'); remove.type='button'; remove.className='remove-field'; remove.textContent='×';
  remove.addEventListener('click',()=>row.remove());
  top.append(label,type,remove);

  const settings=document.createElement('div'); settings.className='field-settings';
  const reqLabel=document.createElement('label'); reqLabel.className='required-toggle';
  const required=document.createElement('input'); required.type='checkbox'; required.checked=field.required; required.dataset.role='required';
  reqLabel.append(required,document.createTextNode(' Required'));
  settings.append(reqLabel);

  const options=document.createElement('textarea'); options.dataset.role='options'; options.className='field-options';
  options.placeholder='Choices — one per line';
  options.value=field.options.join('\n');
  settings.append(options);

  const syncOptions=()=> {
    options.classList.toggle('hidden', !['select','multiselect'].includes(type.value));
  };
  type.addEventListener('change',syncOptions); syncOptions();

  row.append(top,settings);
  return row;
}

function renderFieldManager() {
  fieldList.innerHTML='';
  customFields.forEach(field=>fieldList.appendChild(buildFieldRow(field)));
}

manageFieldsBtn.addEventListener('click', () => { renderFieldManager(); fieldsDialog.showModal(); });
addFieldBtn.addEventListener('click', () => {
  fieldList.appendChild(buildFieldRow({id:`field_${Date.now()}`,label:'',type:'text'}));
});

saveFieldsBtn.addEventListener('click', (event) => {
  event.preventDefault();
  const used=new Set();
  customFields=[...fieldList.querySelectorAll('.field-row')].map((row,index)=>{
    const label=row.querySelector('[data-role="label"]').value.trim() || `Field ${index+1}`;
    let id=row.dataset.id || slugify(label);
    if(used.has(id)) id=`${id}_${index+1}`;
    used.add(id);
    const type=row.querySelector('[data-role="type"]').value;
    const optionsText=row.querySelector('[data-role="options"]').value;
    return normalizeField({
      id,label,type,
      required:row.querySelector('[data-role="required"]').checked,
      options:['select','multiselect'].includes(type) ? optionsText.replace(/\\n/g, '\n').split(/\r?\n|,/).map(v=>v.trim()).filter(Boolean) : []
    });
  });
  localStorage.setItem(FIELD_KEY,JSON.stringify(customFields));
  fieldsDialog.close();
});
exportBackupBtn.addEventListener('click', async () => {
  exportBackupBtn.disabled = true;
  backupStatus.textContent = 'Preparing backup…';
  try { await exportBackup(); }
  catch (error) { backupStatus.textContent = `Backup failed: ${error.message || error}`; }
  finally { exportBackupBtn.disabled = false; }
});

importBackupInput.addEventListener('change', async () => {
  const file = importBackupInput.files?.[0];
  importBackupInput.value = '';
  if (!file) return;
  backupStatus.textContent = 'Checking backup…';
  try { await importBackupFile(file); }
  catch (error) { backupStatus.textContent = `Restore failed: ${error.message || error}`; }
});

clearAllBtn.addEventListener('click', async () => {
  if (!confirm('This will delete every saved Papa Golf photo record from this iPhone. Continue?')) return;
  if (!confirm('Final confirmation: delete ALL locally saved Papa Golf photos?')) return;
  await clearRecords();
  await renderGallery();
  backupStatus.textContent = 'All local records cleared.';
});

if ('serviceWorker' in navigator) {
  let refreshing = false;

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;

    // Reload once when a newly deployed Papa Golf worker takes control.
    // This affects only the app shell; IndexedDB photo records are untouched.
    const key = 'papaGolfSwReloaded0260';
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, '1');
      window.location.reload();
    }
  });

  navigator.serviceWorker.register('./service-worker.js?v=0.27.1', { updateViaCache: 'none' })
    .then(async reg => {
      try { await reg.update(); } catch (_) {}
    })
    .catch(() => {});
}
renderGallery().catch(error => { backupStatus.textContent = `Storage error: ${error.message || error}`; });


// ---- Papa Golf Welcome v0.20 ----
const WELCOME_PROPERTY_KEY = 'papaGolfWelcomeProperty';
const WELCOME_UNIT_KEY = 'papaGolfWelcomeUnit';
const WELCOME_CATEGORY_KEY = 'papaGolfWelcomeCategories';
const WELCOME_PARTNER_KEY = 'papaGolfWelcomePartners';

const PAPA_GOLF_PLACES_KEY = 'papaGolfPlacesV1';

const PAPA_GOLF_PHOTO_PLACE_LINKS_KEY='papaGolfPhotoPlaceLinksV1';

const PAPA_GOLF_GATEWAYS_KEY='papaGolfGatewaysV1';
const PAPA_GOLF_GATEWAY_TYPES=[{id:'property',label:'Property / Villa'},{id:'restaurant',label:'Restaurant'},{id:'bar',label:'Bar'},{id:'cafe',label:'Café'},{id:'tour',label:'Tour Operator'},{id:'attraction',label:'Attraction'},{id:'other',label:'Other'}];
function getPapaGolfGateways(){const x=readWelcomeJson(PAPA_GOLF_GATEWAYS_KEY,[]);return Array.isArray(x)?x:[]}
function savePapaGolfGateways(x){localStorage.setItem(PAPA_GOLF_GATEWAYS_KEY,JSON.stringify(x||[]))}
function gatewayDefaultTiles(t){if(['restaurant','bar','cafe'].includes(t))return['menu','specials','nearby','tours','transport'];if(t==='tour')return['tours','nearby','food','transport','help'];if(t==='attraction')return['guide','nearby','food','tours','transport'];return['guide','wifi','nearby','food','transport','things','help']}
function gatewayForPlace(id){return getPapaGolfGateways().find(g=>g.placeId===id)||null}
function ensureDefaultPropertyGateway(){let a=getPapaGolfGateways();if(a.length)return a;const d=effectiveWelcome();a=[{id:'gateway-property-'+Date.now(),type:'property',placeId:'',brandName:d.propertyName||d.name||'Magic Dragon Villa',subtitle:d.locationLabel||'Bangrak, Samui',enabled:true,tiles:gatewayDefaultTiles('property'),createdAt:new Date().toISOString()}];savePapaGolfGateways(a);return a}
function createGatewayForPlace(placeId,type='other'){const p=getPapaGolfPlace(placeId);if(!p)return null;const a=getPapaGolfGateways(),e=a.find(g=>g.placeId===placeId);if(e)return e;const g={id:'gateway-'+Date.now(),placeId,type,brandName:papaGolfPlaceDisplayName(p),subtitle:'',enabled:true,tiles:gatewayDefaultTiles(type),createdAt:new Date().toISOString()};a.push(g);savePapaGolfGateways(a);renderPapaGolfGatewayManager();return g}
function renderPapaGolfGatewayManager(){const host=document.getElementById('gatewayManagerList');if(!host)return;const a=ensureDefaultPropertyGateway();host.innerHTML=a.map(g=>`<article class="gateway-row"><div><div class="gateway-name">${escapeHtml(g.brandName||'Gateway')}</div><div class="small muted">${escapeHtml(PAPA_GOLF_GATEWAY_TYPES.find(x=>x.id===g.type)?.label||'Gateway')}</div><div class="gateway-tile-summary">${(g.tiles||[]).map(t=>`<span>${escapeHtml(t)}</span>`).join('')}</div></div><button type="button" class="secondary-btn" data-edit-gateway="${escapeHtml(g.id)}">Edit Gateway</button></article>`).join('')}
function openGatewayEditor(id){window.papaGolfOpenAdminSection?.('gateways');const g=getPapaGolfGateways().find(x=>x.id===id),p=document.getElementById('gatewayEditPanel');if(!g||!p)return;p.classList.remove('hidden');p.dataset.gatewayId=id;const set=(x,v)=>{const e=document.getElementById(x);if(e)e.value=v??''};set('gatewayEditName',g.brandName);set('gatewayEditSubtitle',g.subtitle);set('gatewayEditType',g.type);set('gatewayEditTiles',(g.tiles||[]).join(', '));const e=document.getElementById('gatewayEditEnabled');if(e)e.checked=g.enabled!==false;p.scrollIntoView({behavior:'smooth',block:'start'})}
function saveGatewayEditor(){const p=document.getElementById('gatewayEditPanel'),id=p?.dataset.gatewayId||'',a=getPapaGolfGateways(),i=a.findIndex(x=>x.id===id);if(i<0)return;const v=x=>document.getElementById(x)?.value?.trim?.()||'';a[i]={...a[i],brandName:v('gatewayEditName'),subtitle:v('gatewayEditSubtitle'),type:v('gatewayEditType')||'other',tiles:v('gatewayEditTiles').split(',').map(x=>x.trim()).filter(Boolean),enabled:!!document.getElementById('gatewayEditEnabled')?.checked};savePapaGolfGateways(a);p.classList.add('hidden');renderPapaGolfGatewayManager()}


function getPapaGolfPhotoPlaceLinks(){
  const saved=readWelcomeJson(PAPA_GOLF_PHOTO_PLACE_LINKS_KEY,{});
  return saved&&typeof saved==='object'&&!Array.isArray(saved)?saved:{};
}
function savePapaGolfPhotoPlaceLinks(map){localStorage.setItem(PAPA_GOLF_PHOTO_PLACE_LINKS_KEY,JSON.stringify(map||{}))}
function linkPhotoRecordToPlace(recordId,placeId){
  if(!recordId||!placeId)return;
  const links=getPapaGolfPhotoPlaceLinks(); links[String(recordId)]=String(placeId); savePapaGolfPhotoPlaceLinks(links);
}
function papaGolfPlaceForPhoto(recordId){
  const links=getPapaGolfPhotoPlaceLinks();
  return getPapaGolfPlaces().find(p=>p.id===links[String(recordId)])||null;
}
function getPapaGolfPlace(placeId){return getPapaGolfPlaces().find(p=>p.id===placeId)||null}
function resolvedWelcomePartner(partner){
  const place=partner?.placeId?getPapaGolfPlace(partner.placeId):null;
  if(!place)return partner;
  return {...partner,name:place.name||partner.name,category:place.category||partner.category,
    lat:Number.isFinite(Number(place.lat))?Number(place.lat):partner.lat,
    lng:Number.isFinite(Number(place.lng))?Number(place.lng):partner.lng,
    note:place.note??partner.note,googlePlaceId:place.googlePlaceId||partner.googlePlaceId||'',
    googleMapsUri:place.googleMapsUri||partner.googleMapsUri||'',website:place.website||partner.website||'',
    phone:place.phone||partner.phone||'',tags:place.tags||partner.tags||[],
    features:place.features||partner.features||[],bestTime:place.bestTime||partner.bestTime||[],
    suggestedVisit:place.suggestedVisit||partner.suggestedVisit||'',cost:place.cost||partner.cost||'',
    accessDifficulty:place.accessDifficulty||partner.accessDifficulty||'',transport:place.transport||partner.transport||'',
    warnings:place.warnings||partner.warnings||'',rating:place.rating??partner.rating??''};
}
function getResolvedWelcomePartners(){return getWelcomePartners().map(resolvedWelcomePartner)}

function papaGolfPlaceDisplayName(place){return place?.name||place?.locationName||place?.areaName||'Unnamed place'}
function formatCoordinate(value,decimals=6){
  const n=Number(value);
  return Number.isFinite(n)?n.toFixed(decimals):'';
}
function placeFeatureList(place){
  if(Array.isArray(place?.features))return place.features.filter(Boolean);
  if(typeof place?.features==='string')return place.features.split(',').map(x=>x.trim()).filter(Boolean);
  return [];
}
function placeBestTimeList(place){
  if(Array.isArray(place?.bestTime))return place.bestTime.filter(Boolean);
  if(typeof place?.bestTime==='string')return place.bestTime.split(',').map(x=>x.trim()).filter(Boolean);
  return [];
}

function papaGolfPlaceSourceLabel(place){
  const sources=new Set(place?.sources||[]),bits=[];
  if(sources.has('photos'))bits.push('Photo');
  if(sources.has('welcome'))bits.push('Curated');
  if(sources.has('google-discovery'))bits.push('Google');
  return bits.join(' + ')||'Papa Golf';
}
function papaGolfPlaceDistanceFromProperty(place){
  const d=effectiveWelcome();
  if(!Number.isFinite(Number(place?.lat))||!Number.isFinite(Number(place?.lng)))return null;
  return welcomeDistanceKm(Number(d.lat),Number(d.lng),Number(place.lat),Number(place.lng));
}
function updatePapaGolfPlace(placeId,changes={}){
  const items=getPapaGolfPlaces();
  const idx=items.findIndex(p=>p.id===placeId);
  if(idx<0)return null;
  const current=items[idx];
  const next=mergePapaGolfPlace(current,{...changes,id:current.id,sources:current.sources||[]});
  items[idx]=next;
  savePapaGolfPlaces(items);

  const partners=getWelcomePartners();
  let changed=false;
  const synced=partners.map(p=>{
    if(p.placeId!==placeId)return p;
    changed=true;
    return {...p,name:next.name||p.name,category:next.category||p.category,
      lat:Number.isFinite(Number(next.lat))?Number(next.lat):p.lat,
      lng:Number.isFinite(Number(next.lng))?Number(next.lng):p.lng,
      note:next.note??p.note,googlePlaceId:next.googlePlaceId||p.googlePlaceId||'',
      googleMapsUri:next.googleMapsUri||p.googleMapsUri||''};
  });
  if(changed)saveWelcomePartners(synced);
  renderPapaGolfPlaceStatus(); renderWelcomePartnerEditor(); renderGuestWelcome();
  return next;
}
function placeEditorValue(id){return document.getElementById(id)?.value?.trim?.()||''}
function openPapaGolfPlaceEditor(placeId){
  window.papaGolfOpenAdminSection?.('places');
  const place=getPapaGolfPlace(placeId),panel=document.getElementById('sharedPlaceEditPanel');
  if(!place||!panel)return;
  panel.classList.remove('hidden');panel.dataset.placeId=place.id;
  const set=(id,val)=>{const el=document.getElementById(id);if(el)el.value=val??''};
  set('sharedPlaceEditName',papaGolfPlaceDisplayName(place));
  set('sharedPlaceEditCategory',place.category||'');
  set('sharedPlaceEditLat',formatCoordinate(place.lat));
  set('sharedPlaceEditLng',formatCoordinate(place.lng));
  set('sharedPlaceEditNote',place.note||''); set('sharedPlaceEditWebsite',place.website||'');
  set('sharedPlaceEditPhone',place.phone||'');
  set('sharedPlaceEditCost',place.cost||'');
  set('sharedPlaceEditAccessDifficulty',place.accessDifficulty||'');
  set('sharedPlaceEditSuggestedVisit',place.suggestedVisit||'');
  set('sharedPlaceEditRating',place.rating??'');
  set('sharedPlaceEditFeatures',placeFeatureList(place).join(', '));
  set('sharedPlaceEditBestTime',placeBestTimeList(place).join(', '));
  set('sharedPlaceEditTransport',place.transport||'');
  set('sharedPlaceEditWarnings',place.warnings||'');
  set('sharedPlaceEditTags',Array.isArray(place.tags)?place.tags.join(', '):(place.tags||''));
  const a=document.getElementById('sharedPlaceEditApproved');if(a)a.checked=!!place.approved;
  const f=document.getElementById('sharedPlaceEditAffiliate');if(f)f.checked=!!place.affiliate;
  const src=document.getElementById('sharedPlaceEditSource');if(src)src.textContent=`${papaGolfPlaceSourceLabel(place)}${place.googlePlaceId?' · Google linked':''} · Papa Golf is the master record`;
  panel.scrollIntoView({behavior:'smooth',block:'start'});
}
function closePapaGolfPlaceEditor(){const p=document.getElementById('sharedPlaceEditPanel');if(p){p.classList.add('hidden');p.dataset.placeId=''}}
function savePapaGolfPlaceEditor(){
  const panel=document.getElementById('sharedPlaceEditPanel'),placeId=panel?.dataset.placeId||'';
  if(!placeId)return;
  const lat=Number(placeEditorValue('sharedPlaceEditLat')),lng=Number(placeEditorValue('sharedPlaceEditLng'));
  updatePapaGolfPlace(placeId,{
    name:placeEditorValue('sharedPlaceEditName'),category:placeEditorValue('sharedPlaceEditCategory'),
    lat:Number.isFinite(lat)?lat:null,lng:Number.isFinite(lng)?lng:null,
    note:placeEditorValue('sharedPlaceEditNote'),website:placeEditorValue('sharedPlaceEditWebsite'),
    phone:placeEditorValue('sharedPlaceEditPhone'),
    cost:placeEditorValue('sharedPlaceEditCost'),
    accessDifficulty:placeEditorValue('sharedPlaceEditAccessDifficulty'),
    suggestedVisit:placeEditorValue('sharedPlaceEditSuggestedVisit'),
    rating:placeEditorValue('sharedPlaceEditRating'),
    features:placeEditorValue('sharedPlaceEditFeatures').split(',').map(x=>x.trim()).filter(Boolean),
    bestTime:placeEditorValue('sharedPlaceEditBestTime').split(',').map(x=>x.trim()).filter(Boolean),
    transport:placeEditorValue('sharedPlaceEditTransport'),
    warnings:placeEditorValue('sharedPlaceEditWarnings'),
    tags:placeEditorValue('sharedPlaceEditTags').split(',').map(x=>x.trim()).filter(Boolean),
    approved:!!document.getElementById('sharedPlaceEditApproved')?.checked,
    affiliate:!!document.getElementById('sharedPlaceEditAffiliate')?.checked
  });
  closePapaGolfPlaceEditor();
}


function promotePlaceToCurated(placeId){
  const place=getPapaGolfPlace(placeId); if(!place)return null;
  const partners=getWelcomePartners();
  const existing=partners.find(p=>p.placeId===place.id||(place.googlePlaceId&&p.googlePlaceId===place.googlePlaceId));
  if(existing)return existing;
  const partner={
    id:'wp-'+Date.now(),placeId:place.id,name:papaGolfPlaceDisplayName(place),
    category:place.category||'restaurant',lat:Number(place.lat),lng:Number(place.lng),
    note:place.note||'',approved:true,googlePlaceId:place.googlePlaceId||'',
    googleMapsUri:place.googleMapsUri||'',website:place.website||'',phone:place.phone||'',
    features:place.features||[],bestTime:place.bestTime||[],suggestedVisit:place.suggestedVisit||'',
    cost:place.cost||'',accessDifficulty:place.accessDifficulty||'',transport:place.transport||'',
    warnings:place.warnings||'',rating:place.rating??'',createdAt:new Date().toISOString()
  };
  partners.push(partner); saveWelcomePartners(partners);
  upsertPapaGolfPlace({...place,approved:true,sources:[...(place.sources||[]),'welcome']});
  renderWelcomePartnerEditor(); renderWelcomeExistingPlacePicker(); renderPapaGolfPlaceStatus(); renderGuestWelcome();
  return partner;
}

const WELCOME_LANGUAGE_KEY = 'papaGolfWelcomeLanguage';

function papaGolfSlug(value){
  return String(value||'').normalize('NFKD').toLowerCase()
    .replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9\u0E00-\u0E7F]+/g,'-')
    .replace(/^-+|-+$/g,'').slice(0,80);
}
function papaGolfPlaceIdentity(input={}){
  if(input.googlePlaceId) return `google:${input.googlePlaceId}`;
  const lat=Number(input.lat),lng=Number(input.lng);
  const coord=(Number.isFinite(lat)&&Number.isFinite(lng))?`${lat.toFixed(5)},${lng.toFixed(5)}`:'';
  const name=papaGolfSlug(input.name||input.locationName||input.areaName||'place');
  return `papa:${name}:${coord}`;
}
function getPapaGolfPlaces(){
  const saved=readWelcomeJson(PAPA_GOLF_PLACES_KEY,[]);
  return Array.isArray(saved)?saved:[];
}
function savePapaGolfPlaces(items){
  localStorage.setItem(PAPA_GOLF_PLACES_KEY,JSON.stringify(items));
  renderPapaGolfPlaceStatus();
}
function mergePapaGolfPlace(existing={},incoming={}){
  const sources=new Set([...(existing.sources||[]),...(incoming.sources||[])].filter(Boolean));
  const photos=new Set([...(existing.photoRecordIds||[]),...(incoming.photoRecordIds||[])].filter(Boolean));
  return {
    ...existing,...incoming,
    id:existing.id||incoming.id||papaGolfPlaceIdentity(incoming),
    name:incoming.name||existing.name||'Unnamed place',
    areaName:incoming.areaName||existing.areaName||'',
    locationName:incoming.locationName||existing.locationName||'',
    category:incoming.category||existing.category||'',
    lat:Number.isFinite(Number(incoming.lat))?Number(incoming.lat):existing.lat,
    lng:Number.isFinite(Number(incoming.lng))?Number(incoming.lng):existing.lng,
    googlePlaceId:incoming.googlePlaceId||existing.googlePlaceId||'',
    googleMapsUri:incoming.googleMapsUri||existing.googleMapsUri||'',
    note:incoming.note??existing.note??'',
    website:incoming.website??existing.website??'',
    phone:incoming.phone??existing.phone??'',
    tags:Array.isArray(incoming.tags)?incoming.tags:(Array.isArray(existing.tags)?existing.tags:[]),
    features:Array.isArray(incoming.features)?incoming.features:(Array.isArray(existing.features)?existing.features:[]),
    bestTime:Array.isArray(incoming.bestTime)?incoming.bestTime:(Array.isArray(existing.bestTime)?existing.bestTime:[]),
    suggestedVisit:incoming.suggestedVisit??existing.suggestedVisit??'',
    cost:incoming.cost??existing.cost??'',
    accessDifficulty:incoming.accessDifficulty??existing.accessDifficulty??'',
    transport:incoming.transport??existing.transport??'',
    warnings:incoming.warnings??existing.warnings??'',
    rating:incoming.rating??existing.rating??'',
    approved:incoming.approved===true||existing.approved===true,
    affiliate:incoming.affiliate===true||existing.affiliate===true,
    sources:[...sources],
    photoRecordIds:[...photos],
    updatedAt:new Date().toISOString(),
    createdAt:existing.createdAt||incoming.createdAt||new Date().toISOString()
  };
}
function upsertPapaGolfPlace(input){
  const items=getPapaGolfPlaces();
  const identity=input.id||papaGolfPlaceIdentity(input);
  const idx=items.findIndex(p=>p.id===identity||(input.googlePlaceId&&p.googlePlaceId===input.googlePlaceId));
  const merged=mergePapaGolfPlace(idx>=0?items[idx]:{}, {...input,id:idx>=0?items[idx].id:identity});
  if(idx>=0) items[idx]=merged; else items.push(merged);
  savePapaGolfPlaces(items);
  return merged;
}
function legacyPhotoPlaceFields(record){
 const f=record?.fields||{},objs=[f,record?.placeFields,record?.place,record?.experience,record?.sharedFields].filter(x=>x&&typeof x==='object');
 const pick=(...ks)=>{for(const o of objs)for(const k of ks)if(o[k]!==undefined&&o[k]!==null&&o[k]!=='')return o[k];for(const k of ks)if(record?.[k]!==undefined&&record?.[k]!==null&&record?.[k]!=='')return record[k];return ''};
 const list=(...ks)=>{const v=pick(...ks);return Array.isArray(v)?v.filter(Boolean):(typeof v==='string'?v.split(',').map(x=>x.trim()).filter(Boolean):[])};
 return {note:pick('description','notes','placeDescription'),features:list('features','featureList'),bestTime:list('bestTime','bestTimeToVisit'),suggestedVisit:pick('suggestedVisit','suggestedVisitTime','visitTime'),cost:pick('cost','price'),accessDifficulty:pick('accessDifficulty','difficulty'),transport:pick('transport','transportAccess','access'),warnings:pick('warnings','considerations','warningsConsiderations'),rating:pick('rating','papaGolfRating'),website:pick('website','url'),phone:pick('phone','telephone')};
}
async function syncPapaGolfPlaces(){
  let places=getPapaGolfPlaces();
  let changed=false;

  const partners=getWelcomePartners();
  const nextPartners=partners.map(partner=>{
    const identity=partner.placeId||papaGolfPlaceIdentity(partner);
    const incoming={
      id:identity,name:partner.name,category:partner.category,
      lat:partner.lat,lng:partner.lng,note:partner.note||'',
      approved:true,affiliate:!!partner.affiliate,
      googlePlaceId:partner.googlePlaceId||'',
      googleMapsUri:partner.googleMapsUri||'',
      sources:['welcome']
    };
    const idx=places.findIndex(p=>p.id===identity);
    if(idx<0){places.push(mergePapaGolfPlace({},incoming));changed=true}
    else{
      const before=JSON.stringify(places[idx]);
      places[idx]=mergePapaGolfPlace(places[idx],incoming);
      if(JSON.stringify(places[idx])!==before)changed=true;
    }
    return partner.placeId===identity?partner:{...partner,placeId:identity};
  });
  if(JSON.stringify(nextPartners)!==JSON.stringify(partners)){
    localStorage.setItem(WELCOME_PARTNER_KEY,JSON.stringify(nextPartners));
    changed=true;
  }

  try{
    const records=await getRecords();
    for(const record of records){
      const f=record.fields||{};
      const locationName=String(f.locationName||record.locationName||'').trim();
      const areaName=String(f.areaName||record.areaName||'').trim();
      const lat=Number(record.metadata?.latitude ?? record.metadata?.lat);
      const lng=Number(record.metadata?.longitude ?? record.metadata?.lng ?? record.metadata?.lon);
      if(!locationName&&!areaName&&!(Number.isFinite(lat)&&Number.isFinite(lng)))continue;
      const legacy=legacyPhotoPlaceFields(record);
      const incoming={
        name:locationName||areaName||f.title||'Photo location',locationName,areaName,
        category:String(f.category||record.category||'').trim(),lat:Number.isFinite(lat)?lat:null,lng:Number.isFinite(lng)?lng:null,
        note:legacy.note,features:legacy.features,bestTime:legacy.bestTime,suggestedVisit:legacy.suggestedVisit,cost:legacy.cost,
        accessDifficulty:legacy.accessDifficulty,transport:legacy.transport,warnings:legacy.warnings,rating:legacy.rating,
        website:legacy.website,phone:legacy.phone,tags:Array.isArray(f.tags)?f.tags:(Array.isArray(record.tags)?record.tags:[]),
        sources:['photos'],photoRecordIds:[record.id]
      };
      const identity=papaGolfPlaceIdentity(incoming);
      const pi=places.findIndex(p=>p.id===identity);
      if(pi<0){places.push(mergePapaGolfPlace({}, {...incoming,id:identity}));changed=true}
      else{
        const before=JSON.stringify(places[pi]);
        places[pi]=mergePapaGolfPlace(places[pi],incoming);
        if(JSON.stringify(places[pi])!==before)changed=true;
      }
      linkPhotoRecordToPlace(record.id,identity);
    }
  }catch(err){console.warn('Shared place photo sync skipped',err)}

  if(changed)localStorage.setItem(PAPA_GOLF_PLACES_KEY,JSON.stringify(places));
  renderPapaGolfPlaceStatus();
  return places;
}
function renderPapaGolfPlaceStatus(){
  const host=document.getElementById('papaGolfPlaceStatus');
  if(!host)return;
  const items=getPapaGolfPlaces();
  const photos=items.filter(p=>(p.sources||[]).includes('photos')).length;
  const welcome=items.filter(p=>(p.sources||[]).includes('welcome')).length;
  const google=items.filter(p=>(p.sources||[]).includes('google-discovery')).length;
  host.textContent=`${photos} Papa Golf photo place${photos===1?'':'s'} · ${welcome} curated place${welcome===1?'':'s'} · ${google} Google discover${google===1?'y':'ies'}`;

  renderPapaGolfPlaceManager();
  renderWelcomeExistingPlacePicker();
}
function renderPapaGolfPlaceManager(){
  const host=document.getElementById('sharedPlaceManagerList'); if(!host)return;
  const filter=document.getElementById('sharedPlaceFilter')?.value||'all';
  let items=getPapaGolfPlaces().slice();
  if(filter==='photos')items=items.filter(p=>(p.sources||[]).includes('photos'));
  if(filter==='welcome')items=items.filter(p=>(p.sources||[]).includes('welcome'));
  if(filter==='google')items=items.filter(p=>(p.sources||[]).includes('google-discovery'));
  items.sort((a,b)=>{
    const da=papaGolfPlaceDistanceFromProperty(a),db=papaGolfPlaceDistanceFromProperty(b);
    if(Number.isFinite(da)&&Number.isFinite(db)&&Math.abs(da-db)>.0001)return da-db;
    return papaGolfPlaceDisplayName(a).localeCompare(papaGolfPlaceDisplayName(b));
  });
  if(!items.length){host.innerHTML='<div class="shared-place-empty">No shared places in this filter yet.</div>';return}
  host.innerHTML=items.map(place=>{
    const dist=papaGolfPlaceDistanceFromProperty(place);
    const sources=Array.isArray(place.sources)?place.sources:[];
    const curated=sources.includes('welcome')||place.approved===true;
    const photoCount=Array.isArray(place.photoRecordIds)?place.photoRecordIds.length:0;
    return `<article class="shared-place-row">
      <div class="shared-place-main">
        <div class="shared-place-name">${escapeHtml(papaGolfPlaceDisplayName(place))}</div>
        <div class="small muted">${escapeHtml(place.category||'Uncategorised')}${Number.isFinite(dist)?` · ${dist.toFixed(dist<1?2:1)} km from villa`:''}</div>
        ${place.cost||place.suggestedVisit||place.rating?`<div class="small shared-place-visitor-summary">${escapeHtml([place.cost,place.suggestedVisit,place.rating!==''&&place.rating!=null?`${place.rating}/5`:null].filter(Boolean).join(' · '))}</div>`:''}
        <div class="shared-place-badges">
          <span>${escapeHtml(papaGolfPlaceSourceLabel(place))}</span>
          ${photoCount?`<span>${photoCount} photo${photoCount===1?'':'s'}</span>`:''}
          ${place.googlePlaceId?'<span>Google linked</span>':''}
        </div>
      </div>
      <div class="shared-place-actions shared-place-actions-visible">
        <button type="button" class="secondary-btn" data-edit-place="${escapeHtml(place.id)}">Edit Place</button>${gatewayForPlace(place.id)?'<span class="shared-place-curated-label">✓ Gateway</span>':`<button type="button" class="secondary-btn" data-create-gateway="${escapeHtml(place.id)}">+ Create Gateway</button>`}
        ${!curated?`<button type="button" class="secondary-btn" data-promote-place="${escapeHtml(place.id)}">+ Add to Welcome</button>`:'<span class="shared-place-curated-label">✓ In Welcome</span>'}
        ${place.googleMapsUri?`<a class="secondary-btn link-btn shared-place-google-link" href="${escapeHtml(place.googleMapsUri)}" target="_blank" rel="noopener">Google Maps</a>`:''}
      </div>
    </article>`;
  }).join('');
}
function renderWelcomeExistingPlacePicker(){
  const select=document.getElementById('welcomeExistingPlaceSelect'); if(!select)return;
  const keep=select.value;
  const items=getPapaGolfPlaces().filter(p=>Number.isFinite(Number(p.lat))&&Number.isFinite(Number(p.lng))).slice()
    .sort((a,b)=>papaGolfPlaceDisplayName(a).localeCompare(papaGolfPlaceDisplayName(b)));
  select.innerHTML='<option value="">Choose a shared place…</option>'+items.map(p=>`<option value="${escapeHtml(p.id)}">${escapeHtml(papaGolfPlaceDisplayName(p))} · ${escapeHtml(papaGolfPlaceSourceLabel(p))}</option>`).join('');
  if(items.some(p=>p.id===keep))select.value=keep;
}
function fillCuratedFormFromPlace(place){
  if(!place)return;
  const ids={welcomePartnerName:papaGolfPlaceDisplayName(place),welcomePartnerLat:Number(place.lat),welcomePartnerLng:Number(place.lng),welcomePartnerNote:place.note||''};
  Object.entries(ids).forEach(([id,value])=>{const el=document.getElementById(id);if(el)el.value=value});
  const category=document.getElementById('welcomePartnerCategory');
  if(category&&[...category.options].some(o=>o.value===place.category))category.value=place.category;
}



const WELCOME_DEFAULT_PROPERTY = {
  name:'Magic Dragon Villa',
  developer:'',
  address:'Bangrak, Samui',
  lat:9.5487116,
  lng:100.0513577,
  host:'',
  emergency:'',
  logo:'magic-dragon-villa-logo.png'
};

const WELCOME_DEFAULT_UNIT = {
  name:'Magic Dragon Villa',
  wifiName:'PaulHup_2.4GHz',
  wifiPassword:'FrameBalls555',
  bluetooth:'',
  villaInfo:'',
  overrideHost:false,
  host:'',
  overrideEmergency:false,
  emergency:''
};


const WELCOME_I18N={
  en:{all:'All',back:'Main menu',refresh:'Refresh Nearby',convenience:'Convenience Stores',supermarket:'Supermarkets',petrol:'Petrol Stations',atm:'ATMs / Banks',pharmacy:'Pharmacies',medical:'Hospitals / Clinics',restaurant:'Restaurants',bar:'Bars',cafe:'Cafés',activity:'Things To Do',transport:'Transport / Rental',spa:'Massage / Spa',away:'km away',navigate:'Navigate with Google Maps',googleNearby:'Google nearby',nearbyUtility:'Nearby utility',approved:'Papa Golf approved',searching:'Searching nearby places…',none:'No places found for this filter yet.',youAreHere:'YOU ARE HERE'},
  fr:{all:'Tous',back:'Menu principal',refresh:'Actualiser à proximité',convenience:'Supérettes',supermarket:'Supermarchés',petrol:'Stations-service',atm:'Distributeurs / Banques',pharmacy:'Pharmacies',medical:'Hôpitaux / Cliniques',restaurant:'Restaurants',bar:'Bars',cafe:'Cafés',activity:'À faire',transport:'Transport / Location',spa:'Massage / Spa',away:'km',navigate:'Itinéraire avec Google Maps',googleNearby:'Google à proximité',nearbyUtility:'Service à proximité',approved:'Recommandé par Papa Golf',searching:'Recherche de lieux à proximité…',none:'Aucun lieu trouvé pour ce filtre.',youAreHere:'VOUS ÊTES ICI'},
  th:{all:'ทั้งหมด',back:'เมนูหลัก',refresh:'ค้นหาใกล้เคียงอีกครั้ง',convenience:'ร้านสะดวกซื้อ',supermarket:'ซูเปอร์มาร์เก็ต',petrol:'ปั๊มน้ำมัน',atm:'ATM / ธนาคาร',pharmacy:'ร้านขายยา',medical:'โรงพยาบาล / คลินิก',restaurant:'ร้านอาหาร',bar:'บาร์',cafe:'คาเฟ่',activity:'กิจกรรมน่าสนใจ',transport:'การเดินทาง / รถเช่า',spa:'นวด / สปา',away:'กม.',navigate:'นำทางด้วย Google Maps',googleNearby:'Google ใกล้เคียง',nearbyUtility:'บริการใกล้เคียง',approved:'Papa Golf แนะนำ',searching:'กำลังค้นหาสถานที่ใกล้เคียง…',none:'ไม่พบสถานที่สำหรับตัวกรองนี้',youAreHere:'คุณอยู่ที่นี่'}
};
function welcomeStoredLanguage(){return localStorage.getItem(WELCOME_LANGUAGE_KEY)||'auto'}
function welcomeDeviceLanguage(){
  const list=Array.isArray(navigator.languages)&&navigator.languages.length?navigator.languages:[navigator.language||'en'];
  for(const raw of list){
    const code=String(raw||'').toLowerCase().split('-')[0];
    if(['en','fr','th'].includes(code))return code;
  }
  return 'en';
}
function welcomeResolvedLanguage(){
  const stored=welcomeStoredLanguage();
  return stored==='auto'?welcomeDeviceLanguage():(['en','fr','th'].includes(stored)?stored:'en');
}
function welcomeT(key){
  const lang=welcomeResolvedLanguage();
  return WELCOME_I18N[lang]?.[key]??WELCOME_I18N.en[key]??key;
}
function welcomeCategoryLabel(cat){return welcomeT(cat?.id)||cat?.label||'Place'}
function applyWelcomeLanguage(){
  const select=document.getElementById('welcomeLanguageSelect');
  if(select)select.value=welcomeStoredLanguage();
  const back=document.getElementById('guestExploreBackBtn');
  if(back)back.textContent=`← ${welcomeT('back')}`;
  const refresh=document.getElementById('refreshWelcomeNearbyBtn');
  if(refresh)refresh.textContent=`↻ ${welcomeT('refresh')}`;
  renderWelcomeGuestFilters();
  if(!document.getElementById('guestExplorePanel')?.classList.contains('hidden'))renderWelcomeNearbyMap();
}

const WELCOME_CATEGORY_DEFS = [
  {id:'convenience',label:'Convenience Stores',icon:'🛒',source:'automatic',enabled:true,radiusKm:2},
  {id:'supermarket',label:'Supermarkets',icon:'🛍',source:'automatic',enabled:true,radiusKm:3},
  {id:'petrol',label:'Petrol Stations',icon:'⛽',source:'automatic',enabled:true,radiusKm:3},
  {id:'atm',label:'ATMs / Banks',icon:'🏧',source:'automatic',enabled:true,radiusKm:2},
  {id:'pharmacy',label:'Pharmacies',icon:'💊',source:'automatic',enabled:true,radiusKm:3},
  {id:'medical',label:'Hospitals / Clinics',icon:'🏥',source:'automatic',enabled:true,radiusKm:8},
  {id:'restaurant',label:'Restaurants',icon:'🍽',source:'approved',enabled:true},
  {id:'bar',label:'Bars',icon:'🍹',source:'approved',enabled:true},
  {id:'cafe',label:'Cafés',icon:'☕',source:'approved',enabled:true},
  {id:'activity',label:'Things To Do',icon:'🏝',source:'approved',enabled:true},
  {id:'transport',label:'Transport / Rental',icon:'🛵',source:'approved',enabled:true},
  {id:'spa',label:'Massage / Spa',icon:'🌺',source:'approved',enabled:true}
];

let welcomeNearbyMap = null;
let welcomeNearbyLayer = null;
let welcomeNearbyMarkers = new Map();
let welcomeActiveFilter = 'all';
let welcomeAutomaticPlaces = [];
let welcomeAutomaticLoading = false;
let welcomeAutomaticError = '';
const WELCOME_AUTO_CACHE_KEY = 'papaGolfWelcomeAutomaticPlacesV1';
const WELCOME_GOOGLE_PLACES_KEY = 'papaGolfGooglePlacesApiKey';
const WELCOME_GOOGLE_TEST_RADIUS_METERS = 2500;
let welcomeNearbyLoadGeneration = 0;
let welcomeNearbyProvider = '';
const WELCOME_AUTO_CACHE_MS = 6 * 60 * 60 * 1000;
const WELCOME_AUTO_MAX_QUERY_RADIUS_METERS = 10000;
const WELCOME_MAP_HALF_SPAN_METERS = 750;
const WELCOME_MAP_INITIAL_ZOOM = 16;


function readWelcomeJson(key,fallback){
  try{
    const raw=localStorage.getItem(key);
    return raw?JSON.parse(raw):fallback;
  }catch{return fallback}
}
function getWelcomeProperty(){
  const saved=readWelcomeJson(WELCOME_PROPERTY_KEY,{});
  return {...WELCOME_DEFAULT_PROPERTY,...saved};
}
function getWelcomeUnit(){
  const saved=readWelcomeJson(WELCOME_UNIT_KEY,{});
  return {...WELCOME_DEFAULT_UNIT,...saved};
}
function getWelcomeCategories(){
  const saved=readWelcomeJson(WELCOME_CATEGORY_KEY,null);
  if(!Array.isArray(saved)) return WELCOME_CATEGORY_DEFS.map(x=>({...x}));
  return WELCOME_CATEGORY_DEFS.map(def=>({...def,...(saved.find(x=>x.id===def.id)||{})}));
}
function getWelcomePartners(){
  const saved=readWelcomeJson(WELCOME_PARTNER_KEY,[]);
  return Array.isArray(saved)?saved:[];
}
function saveWelcomePartners(items){
  localStorage.setItem(WELCOME_PARTNER_KEY,JSON.stringify(items));
}
function welcomeVal(id){const e=document.getElementById(id);return e?e.value.trim():''}
function welcomeSet(id,v){const e=document.getElementById(id);if(e)e.value=(v??'')}
function welcomeToggle(cbId,fieldId){const cb=document.getElementById(cbId),field=document.getElementById(fieldId);if(cb&&field)field.disabled=!cb.checked}
function welcomeCategoryDef(id){return getWelcomeCategories().find(x=>x.id===id)||WELCOME_CATEGORY_DEFS.find(x=>x.id===id)}
function welcomeDistanceKm(lat1,lng1,lat2,lng2){
  const R=6371,toRad=x=>x*Math.PI/180;
  const dLat=toRad(lat2-lat1),dLng=toRad(lng2-lng1);
  const a=Math.sin(dLat/2)**2+Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLng/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}
function welcomeGoogleMapsUrl(lat,lng){
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(lat+','+lng)}`;
}
function welcomeShow(target){
  const photos=document.getElementById('photosView');
  const map=document.getElementById('mapView');
  const areas=document.getElementById('areasView');
  const tools=document.querySelector('.library-tools');
  const welcome=document.getElementById('welcomeModule');
  const preview=document.getElementById('welcomeGuestPreview');
  const a5=document.getElementById('welcomeA5Preview');
  [photos,map,areas,welcome,preview,a5].forEach(el=>{if(el)el.classList.add('hidden')});
  if(tools)tools.classList.add('hidden');
  if(target)target.classList.remove('hidden');
  document.querySelectorAll('.view-tab').forEach(el=>el.classList.remove('active'));
  if(target===welcome)document.getElementById('openWelcomeModuleBtn')?.classList.add('active');
  window.scrollTo(0,0);
}
function loadWelcomeEditor(){
  const p=getWelcomeProperty(),u=getWelcomeUnit();
  welcomeSet('welcomePropertyName',p.name);
  welcomeSet('welcomePropertyDeveloper',p.developer);
  welcomeSet('welcomePropertyAddress',p.address);
  welcomeSet('welcomePropertyLat',p.lat);
  welcomeSet('welcomePropertyLng',p.lng);
  welcomeSet('welcomePropertyHost',p.host);
  welcomeSet('welcomePropertyEmergency',p.emergency);
  welcomeSet('welcomeUnitName',u.name);
  welcomeSet('welcomeWifiName',u.wifiName);
  welcomeSet('welcomeWifiPassword',u.wifiPassword);
  welcomeSet('welcomeBluetooth',u.bluetooth);
  welcomeSet('welcomeVillaInfo',u.villaInfo);
  welcomeSet('welcomeUnitHost',u.host);
  welcomeSet('welcomeUnitEmergency',u.emergency);
  const oh=document.getElementById('overrideWelcomeHost'),oe=document.getElementById('overrideWelcomeEmergency');
  if(oh)oh.checked=!!u.overrideHost;
  if(oe)oe.checked=!!u.overrideEmergency;
  welcomeToggle('overrideWelcomeHost','welcomeUnitHost');
  welcomeToggle('overrideWelcomeEmergency','welcomeUnitEmergency');
  renderWelcomeCategoryEditor();
  renderWelcomePartnerEditor();
  renderPapaGolfPlaceStatus();
}
function effectiveWelcome(){
  const p=getWelcomeProperty(),u=getWelcomeUnit();
  return {
    propertyName:p.name||'Magic Dragon Villa',
    developer:p.developer||'',
    unitName:u.name||p.name||'Your Villa',
    address:p.address||'',
    lat:Number(p.lat),
    lng:Number(p.lng),
    logo:p.logo||'magic-dragon-villa-logo.png',
    host:u.overrideHost?(u.host||''):(p.host||''),
    emergency:u.overrideEmergency?(u.emergency||''):(p.emergency||''),
    wifiName:u.wifiName||'',
    wifiPassword:u.wifiPassword||'',
    bluetooth:u.bluetooth||'',
    villaInfo:u.villaInfo||''
  };
}
function saveWelcomeProperty(){
  const old=getWelcomeProperty();
  const lat=Number(welcomeVal('welcomePropertyLat')),lng=Number(welcomeVal('welcomePropertyLng'));
  const data={
    ...old,
    name:welcomeVal('welcomePropertyName')||WELCOME_DEFAULT_PROPERTY.name,
    developer:welcomeVal('welcomePropertyDeveloper'),
    address:welcomeVal('welcomePropertyAddress'),
    lat:Number.isFinite(lat)?lat:WELCOME_DEFAULT_PROPERTY.lat,
    lng:Number.isFinite(lng)?lng:WELCOME_DEFAULT_PROPERTY.lng,
    host:welcomeVal('welcomePropertyHost'),
    emergency:welcomeVal('welcomePropertyEmergency'),
    logo:'magic-dragon-villa-logo.png'
  };
  localStorage.setItem(WELCOME_PROPERTY_KEY,JSON.stringify(data));
}
function saveWelcomeUnit(){
  localStorage.setItem(WELCOME_UNIT_KEY,JSON.stringify({
    name:welcomeVal('welcomeUnitName')||WELCOME_DEFAULT_UNIT.name,
    wifiName:welcomeVal('welcomeWifiName'),
    wifiPassword:welcomeVal('welcomeWifiPassword'),
    bluetooth:welcomeVal('welcomeBluetooth'),
    villaInfo:welcomeVal('welcomeVillaInfo'),
    overrideHost:!!document.getElementById('overrideWelcomeHost')?.checked,
    host:welcomeVal('welcomeUnitHost'),
    overrideEmergency:!!document.getElementById('overrideWelcomeEmergency')?.checked,
    emergency:welcomeVal('welcomeUnitEmergency')
  }));
}
function renderWelcomeCategoryEditor(){
  const host=document.getElementById('welcomeCategoryEditor');
  if(!host)return;
  host.innerHTML=getWelcomeCategories().map(cat=>`
    <div class="welcome-category-row" data-category-id="${escapeHtml(cat.id)}">
      <label class="welcome-category-enable">
        <input type="checkbox" data-role="enabled" ${cat.enabled?'checked':''}>
        <span>${cat.icon} <strong>${escapeHtml(cat.label)}</strong></span>
      </label>
      <select data-role="source">
        <option value="automatic" ${cat.source==='automatic'?'selected':''}>Automatic nearby search</option>
        <option value="approved" ${cat.source==='approved'?'selected':''}>Approved / affiliate only</option>
      </select>
      ${cat.source==='automatic'?`
        <div class="welcome-auto-rules">
          <label>Search radius
            <select data-role="radius">
              ${[0.5,1,1.5,2,2.5,3,4,5,6,8,10].map(n=>`<option value="${n}" ${Number(cat.radiusKm)===n?'selected':''}>${n} km</option>`).join('')}
            </select>
          </label>
          <div class="welcome-auto-rule-note">
            All matching places within this radius are shown nearest first.
          </div>
        </div>`:''}
    </div>
  `).join('');
}
function saveWelcomeCategories(){
  const rows=[...document.querySelectorAll('#welcomeCategoryEditor .welcome-category-row')];
  const current=getWelcomeCategories();
  const next=current.map(cat=>{
    const row=rows.find(r=>r.dataset.categoryId===cat.id);
    return {
      ...cat,
      enabled:!!row?.querySelector('[data-role="enabled"]')?.checked,
      source:row?.querySelector('[data-role="source"]')?.value||cat.source,
      radiusKm:Number(row?.querySelector('[data-role="radius"]')?.value)||cat.radiusKm,
    };
  });
  localStorage.setItem(WELCOME_CATEGORY_KEY,JSON.stringify(next));
  try{localStorage.removeItem(WELCOME_AUTO_CACHE_KEY)}catch{}
}
function renderWelcomePartnerCategorySelect(){
  const sel=document.getElementById('welcomePartnerCategory');
  if(!sel)return;
  const cats=getWelcomeCategories().filter(x=>x.source==='approved');
  sel.innerHTML=cats.map(c=>`<option value="${escapeHtml(c.id)}">${c.icon} ${escapeHtml(c.label)}</option>`).join('');
}
function renderWelcomePartnerEditor(){
  renderWelcomePartnerCategorySelect();
  const host=document.getElementById('welcomePartnerList');
  if(!host)return;
  const p=getWelcomeProperty(),items=getWelcomePartners();
  if(!items.length){
    host.innerHTML='<div class="small muted welcome-empty-note">No curated places yet. Add your first affiliate or recommendation above.</div>';
    return;
  }
  host.innerHTML=items.map((item,index)=>{
    const cat=welcomeCategoryDef(item.category)||{};
    const dist=(Number.isFinite(Number(item.lat))&&Number.isFinite(Number(item.lng)))?welcomeDistanceKm(Number(p.lat),Number(p.lng),Number(item.lat),Number(item.lng)):null;
    return `<div class="welcome-partner-row">
      <div><strong>${cat.icon||'📍'} ${escapeHtml(item.name||'Unnamed place')}</strong>
      <div class="small muted">${escapeHtml(cat.label||item.category||'Place')}${dist!=null?' · '+dist.toFixed(dist<1?2:1)+' km':''}${item.note?' · '+escapeHtml(item.note):''}</div></div>
      <button type="button" class="text-danger" data-remove-welcome-partner="${index}">Remove</button>
    </div>`;
  }).join('');
}
function addWelcomePartner(){
  const name=welcomeVal('welcomePartnerName');
  const category=welcomeVal('welcomePartnerCategory');
  const lat=Number(welcomeVal('welcomePartnerLat')),lng=Number(welcomeVal('welcomePartnerLng'));
  const note=welcomeVal('welcomePartnerNote');
  const selectedId=document.getElementById('welcomeExistingPlaceSelect')?.value||'';
  const selected=selectedId?getPapaGolfPlace(selectedId):null;
  if(!name){alert('Add a place name first.');return}
  if(!Number.isFinite(lat)||!Number.isFinite(lng)){alert('Add valid latitude and longitude for the place.');return}
  const placeId=selected?.id||papaGolfPlaceIdentity({name,lat,lng,googlePlaceId:selected?.googlePlaceId||''});
  const items=getWelcomePartners();
  items.push({
    id:'wp-'+Date.now(),placeId,name,category,lat,lng,note,approved:true,
    googlePlaceId:selected?.googlePlaceId||'',googleMapsUri:selected?.googleMapsUri||'',
    createdAt:new Date().toISOString()
  });
  saveWelcomePartners(items);
  upsertPapaGolfPlace({
    ...(selected||{}),id:placeId,name,category,lat,lng,note,approved:true,
    googlePlaceId:selected?.googlePlaceId||'',googleMapsUri:selected?.googleMapsUri||'',
    sources:[...(selected?.sources||[]),'welcome']
  });
  ['welcomePartnerName','welcomePartnerLat','welcomePartnerLng','welcomePartnerNote'].forEach(id=>{const el=document.getElementById(id);if(el)el.value=''});
  const picker=document.getElementById('welcomeExistingPlaceSelect');if(picker)picker.value='';
  renderWelcomePartnerEditor(); renderWelcomeExistingPlacePicker(); renderPapaGolfPlaceStatus(); renderGuestWelcome();
}
function showGuestWelcomeHome(){
  document.body.classList.remove('guest-explore-mode');
  document.querySelector('#welcomeGuestPreview .guest-welcome-shell')?.classList.remove('explore-focused');
  document.getElementById('guestWelcomeHome')?.classList.remove('hidden');
  document.querySelectorAll('.guest-welcome-panel').forEach(el=>el.classList.add('hidden'));
  window.scrollTo(0,0);
}
function openGuestWelcomePanel(id){
  const shell=document.querySelector('#welcomeGuestPreview .guest-welcome-shell');
  const exploring=id==='guestExplorePanel';
  document.body.classList.toggle('guest-explore-mode',exploring);
  document.getElementById('guestWelcomeHome')?.classList.add('hidden');
  document.querySelectorAll('.guest-welcome-panel').forEach(el=>el.classList.toggle('hidden',el.id!==id));
  shell?.classList.toggle('explore-focused',exploring);
  if(exploring){
    const d=effectiveWelcome();
    const logo=document.getElementById('guestExploreLogo');
    if(logo)logo.src=d.logo;
    applyWelcomeLanguage();
    setTimeout(()=>{renderWelcomeNearbyMap();refreshWelcomeNearbyPlaces()},40);
  }
  if(id==='guestFoodPanel')renderGuestFoodList();
  window.scrollTo(0,0);
}
function renderGuestWelcome(){
  const d=effectiveWelcome();
  const logo=document.getElementById('guestWelcomeLogo');
  if(logo)logo.src=d.logo;
  const dev=document.getElementById('guestWelcomeDeveloper');
  if(dev)dev.textContent=d.developer?`Developed by ${d.developer}`:'';
  const prop=document.getElementById('guestWelcomeProperty');
  if(prop)prop.textContent=[d.propertyName,d.address].filter(Boolean).join(' · ');
  const head=document.getElementById('guestWelcomeHeading');
  if(head)head.textContent='Welcome to '+d.unitName;

  const wifi=document.getElementById('guestWifiInfo');
  if(wifi)wifi.innerHTML=(d.wifiName||d.wifiPassword)?`<p><strong>Wi-Fi:</strong> ${escapeHtml(d.wifiName||'—')}</p><p><strong>Password:</strong> ${escapeHtml(d.wifiPassword||'—')}</p>`:'<p class="muted">Wi-Fi information has not been added yet.</p>';
  const bt=document.getElementById('guestBluetoothInfo');
  if(bt)bt.innerHTML=d.bluetooth?`<p>${escapeHtml(d.bluetooth)}</p>`:'';
  const vi=document.getElementById('guestVillaInfo');
  if(vi)vi.innerHTML=d.villaInfo?`<p>${escapeHtml(d.villaInfo).replace(/\n/g,'<br>')}</p>`:'<p class="muted">Villa instructions have not been added yet.</p>';
  const host=document.getElementById('guestHostInfo');
  if(host)host.innerHTML=d.host?`<p><strong>Host / manager:</strong> ${escapeHtml(d.host)}</p>`:'';
  const em=document.getElementById('guestEmergencyInfo');
  if(em)em.innerHTML=d.emergency?`<p>${escapeHtml(d.emergency).replace(/\n/g,'<br>')}</p>`:'<p class="muted">Emergency information has not been added yet.</p>';

  renderWelcomeGuestFilters();
  renderGuestFoodList();
  showGuestWelcomeHome();
}

function welcomeAutoCacheRead(){
  try{
    const raw=JSON.parse(localStorage.getItem(WELCOME_AUTO_CACHE_KEY)||'null');
    if(!raw||!Array.isArray(raw.items)||!Number.isFinite(raw.savedAt))return null;
    return raw;
  }catch{return null}
}
function welcomeAutoCacheWrite(items){
  try{
    localStorage.setItem(WELCOME_AUTO_CACHE_KEY,JSON.stringify({savedAt:Date.now(),items}));
  }catch{}
}
function welcomeAutomaticQuery(lat,lng){
  const radii=getWelcomeCategories()
    .filter(c=>c.enabled&&c.source==='automatic')
    .map(c=>Math.max(.5,Math.min(10,Number(c.radiusKm)||3))*1000);
  const r=Math.min(WELCOME_AUTO_MAX_QUERY_RADIUS_METERS,Math.max(1000,...radii));
  // Fetch candidates once, then Papa Golf applies each category's own radius and display rules.
  return `[out:json][timeout:20];
(
  nwr["shop"="convenience"](around:${r},${lat},${lng});
  nwr["shop"="supermarket"](around:${r},${lat},${lng});
  nwr["shop"="general"](around:${r},${lat},${lng});
  nwr["amenity"="fuel"](around:${r},${lat},${lng});
  nwr["amenity"="atm"](around:${r},${lat},${lng});
  nwr["amenity"="bank"](around:${r},${lat},${lng});
  nwr["amenity"="pharmacy"](around:${r},${lat},${lng});
  nwr["amenity"="hospital"](around:${r},${lat},${lng});
  nwr["amenity"="clinic"](around:${r},${lat},${lng});
  nwr["healthcare"="hospital"](around:${r},${lat},${lng});
  nwr["healthcare"="clinic"](around:${r},${lat},${lng});
);
out center tags;`;
}
function welcomeAutoCategory(tags={}){
  const text=`${tags.name||''} ${tags['name:en']||''} ${tags.brand||''} ${tags.operator||''}`.toLowerCase();
  if(tags.shop==='convenience')return 'convenience';
  if(tags.shop==='supermarket'){
    if(/big\s*c\s*mini|mini\s*big\s*c|lotus'?s?\s*go\s*fresh|tops\s*daily/.test(text))return 'convenience';
    return 'supermarket';
  }
  if(tags.shop==='general' && /7[- ]?eleven|big\s*c\s*mini|mini\s*big\s*c|familymart|lotus'?s?\s*go\s*fresh|tops\s*daily/.test(text))return 'convenience';
  if(tags.amenity==='fuel')return 'petrol';
  if(tags.amenity==='atm'||tags.amenity==='bank')return 'atm';
  if(tags.amenity==='pharmacy')return 'pharmacy';
  if(tags.amenity==='hospital'||tags.amenity==='clinic'||tags.healthcare==='hospital'||tags.healthcare==='clinic')return 'medical';
  return '';
}
function welcomeAutoName(tags={},category=''){
  return String(
    tags.name ||
    tags['name:en'] ||
    tags.brand ||
    tags.operator ||
    welcomeCategoryDef(category)?.label ||
    'Nearby place'
  ).trim();
}
function welcomeAutoNormalize(elements=[]){
  const seen=new Set();
  const out=[];
  for(const el of elements){
    const tags=el.tags||{};
    const category=welcomeAutoCategory(tags);
    if(!category)continue;
    const lat=Number(el.lat ?? el.center?.lat);
    const lng=Number(el.lon ?? el.center?.lon);
    if(!Number.isFinite(lat)||!Number.isFinite(lng))continue;
    const key=`${category}|${lat.toFixed(5)}|${lng.toFixed(5)}|${welcomeAutoName(tags,category).toLowerCase()}`;
    if(seen.has(key))continue;
    seen.add(key);
    out.push({
      id:`osm-${el.type||'x'}-${el.id}`,
      name:welcomeAutoName(tags,category),
      category,
      lat,
      lng,
      note:[tags.brand,tags.opening_hours].filter(Boolean).join(' · '),
      source:'openstreetmap',
      automatic:true,
      tags
    });
  }
  return out;
}
async function fetchWelcomeAutomaticPlaces(force=false){
  if(welcomeAutomaticLoading)return;
  const d=effectiveWelcome();
  if(!Number.isFinite(d.lat)||!Number.isFinite(d.lng)){
    welcomeAutomaticError='Villa coordinates are missing.';
    renderWelcomeNearbyMap();
    return;
  }

  const cached=welcomeAutoCacheRead();
  if(!force && cached && Date.now()-cached.savedAt < WELCOME_AUTO_CACHE_MS){
    welcomeAutomaticPlaces=cached.items;
    welcomeAutomaticError='';
    renderWelcomeNearbyMap();
    return;
  }

  welcomeAutomaticLoading=true;
  welcomeAutomaticError='';
  renderWelcomeNearbyMap();
  try{
    const query=welcomeAutomaticQuery(d.lat,d.lng);
    const endpoints=[
      'https://overpass-api.de/api/interpreter',
      'https://overpass.kumi.systems/api/interpreter'
    ];
    let lastErr=null,data=null;
    for(const endpoint of endpoints){
      try{
        const controller=new AbortController();
        const timer=setTimeout(()=>controller.abort(),18000);
        const res=await fetch(endpoint,{
          method:'POST',
          headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},
          body:'data='+encodeURIComponent(query),
          signal:controller.signal
        });
        clearTimeout(timer);
        if(!res.ok)throw new Error(`Nearby service returned ${res.status}`);
        data=await res.json();
        break;
      }catch(err){lastErr=err}
    }
    if(!data)throw lastErr||new Error('Nearby service unavailable');
    welcomeAutomaticPlaces=welcomeAutoNormalize(data.elements||[]);
    welcomeAutoCacheWrite(welcomeAutomaticPlaces);
  }catch(err){
    welcomeAutomaticError='Live nearby search is temporarily unavailable. Curated places are still shown.';
  }finally{
    welcomeAutomaticLoading=false;
    renderWelcomeNearbyMap();
  }
}
function welcomeEnabledAutomaticCategories(){
  return new Set(getWelcomeCategories().filter(c=>c.enabled&&c.source==='automatic').map(c=>c.id));
}
function welcomeBearingDeg(lat1,lng1,lat2,lng2){
  const toRad=x=>x*Math.PI/180,toDeg=x=>x*180/Math.PI;
  const a=toRad(lat1),b=toRad(lat2),dLng=toRad(lng2-lng1);
  const y=Math.sin(dLng)*Math.cos(b);
  const x=Math.cos(a)*Math.sin(b)-Math.sin(a)*Math.cos(b)*Math.cos(dLng);
  return (toDeg(Math.atan2(y,x))+360)%360;
}

function getPapaGolfGooglePlacesKey(){
  return (localStorage.getItem(WELCOME_GOOGLE_PLACES_KEY)||'').trim();
}
function savePapaGolfGooglePlacesKey(value){
  const clean=String(value||'').trim();
  if(clean)localStorage.setItem(WELCOME_GOOGLE_PLACES_KEY,clean);
  else localStorage.removeItem(WELCOME_GOOGLE_PLACES_KEY);
  return clean;
}
async function testPapaGolfGooglePlaces(){
  const status=document.getElementById('welcomeGooglePlacesStatus');
  const list=document.getElementById('welcomeGooglePlacesTestResults');
  const input=document.getElementById('welcomeGooglePlacesApiKey');
  const apiKey=savePapaGolfGooglePlacesKey(input?.value||'');
  const d=effectiveWelcome();
  if(status)status.textContent='';
  if(list)list.innerHTML='';
  if(!apiKey){if(status)status.textContent='Paste your Google Places API key first.';return;}
  if(!Number.isFinite(Number(d.lat))||!Number.isFinite(Number(d.lng))){if(status)status.textContent='This property needs valid latitude and longitude first.';return;}
  if(status)status.textContent='Testing Google Places near this property…';
  const body={
    includedTypes:['convenience_store','supermarket','grocery_store','gas_station','pharmacy','hospital','atm'],
    maxResultCount:20,
    rankPreference:'DISTANCE',
    locationRestriction:{circle:{center:{latitude:Number(d.lat),longitude:Number(d.lng)},radius:WELCOME_GOOGLE_TEST_RADIUS_METERS}}
  };
  try{
    const res=await fetch('https://places.googleapis.com/v1/places:searchNearby',{
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'X-Goog-Api-Key':apiKey,
        'X-Goog-FieldMask':'places.id,places.displayName,places.primaryType,places.types,places.location,places.formattedAddress,places.googleMapsUri'
      },
      body:JSON.stringify(body)
    });
    const text=await res.text();
    let data={};try{data=text?JSON.parse(text):{}}catch{}
    if(!res.ok)throw new Error(data?.error?.message||`Google Places returned HTTP ${res.status}.`);
    const places=(Array.isArray(data.places)?data.places:[]).map(p=>{
      const lat=Number(p?.location?.latitude),lng=Number(p?.location?.longitude);
      return {id:p?.id||'',name:p?.displayName?.text||'Unnamed place',type:p?.primaryType||'',address:p?.formattedAddress||'',lat,lng,googleMapsUri:p?.googleMapsUri||'',distanceKm:welcomeDistanceKm(Number(d.lat),Number(d.lng),lat,lng)};
    }).filter(p=>Number.isFinite(p.lat)&&Number.isFinite(p.lng)).sort((a,b)=>a.distanceKm-b.distanceKm);
    if(status)status.textContent=places.length?`Google Places found ${places.length} nearby places, nearest first.`:'Google Places returned no matching places in this test radius.';
    if(list)list.innerHTML=places.map((p,i)=>`<div class="welcome-google-test-card"><div class="welcome-google-test-rank">${i+1}</div><div class="welcome-google-test-main"><strong>${escapeHtml(p.name)}</strong><div class="small muted">${escapeHtml(p.type||'place')} · ${p.distanceKm.toFixed(2)} km</div>${p.address?`<div class="small muted">${escapeHtml(p.address)}</div>`:''}</div>${p.googleMapsUri?`<a href="${String(p.googleMapsUri).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}" target="_blank" rel="noopener">Google Maps</a>`:''}</div>`).join('');
  }catch(err){if(status)status.textContent=`Google Places test failed: ${err?.message||err}`;}
}


function welcomeGoogleCategory(place){
  const primary=String(place?.primaryType||'').toLowerCase();
  const types=Array.isArray(place?.types)?place.types.map(x=>String(x).toLowerCase()):[];
  const all=new Set([primary,...types]);

  if(all.has('convenience_store')) return 'convenience';
  if(all.has('supermarket') || all.has('grocery_store')) return 'supermarket';
  if(all.has('gas_station')) return 'petrol';
  if(all.has('atm') || all.has('bank')) return 'atm';
  if(all.has('pharmacy')) return 'pharmacy';
  if(all.has('hospital') || all.has('medical_clinic') || all.has('doctor')) return 'medical';
  return '';
}

async function fetchGoogleAutomaticPlaces(){
  const apiKey=getPapaGolfGooglePlacesKey();
  if(!apiKey) throw new Error('Google Places API key is not saved on this device.');

  const d=effectiveWelcome();
  const cats=getWelcomeCategories().filter(c=>c.enabled&&c.source==='automatic');
  if(!cats.length) return [];

  const maxRadiusKm=Math.min(
    10,
    Math.max(...cats.map(c=>Math.max(.5,Number(c.radiusKm)||3)))
  );

  const includedTypes=[
    'convenience_store',
    'supermarket',
    'grocery_store',
    'gas_station',
    'atm',
    'bank',
    'pharmacy',
    'hospital',
    'medical_clinic',
    'doctor'
  ];

  const body={
    includedTypes,
    maxResultCount:20,
    rankPreference:'DISTANCE',
    languageCode:welcomeResolvedLanguage(),
    locationRestriction:{
      circle:{
        center:{latitude:Number(d.lat),longitude:Number(d.lng)},
        radius:Math.round(maxRadiusKm*1000)
      }
    }
  };

  const res=await fetch('https://places.googleapis.com/v1/places:searchNearby',{
    method:'POST',
    headers:{
      'Content-Type':'application/json',
      'X-Goog-Api-Key':apiKey,
      'X-Goog-FieldMask':'places.id,places.displayName,places.primaryType,places.types,places.location,places.formattedAddress,places.googleMapsUri'
    },
    body:JSON.stringify(body)
  });

  const text=await res.text();
  let data={};
  try{ data=text?JSON.parse(text):{}; }catch(_){}

  if(!res.ok){
    throw new Error(data?.error?.message||`Google Places returned HTTP ${res.status}.`);
  }

  const wantedIds=new Set(cats.map(c=>c.id));
  const places=(Array.isArray(data.places)?data.places:[])
    .map(p=>{
      const category=welcomeGoogleCategory(p);
      const lat=Number(p?.location?.latitude);
      const lng=Number(p?.location?.longitude);
      return {
        id:`google:${p?.id||Math.random().toString(36).slice(2)}`,
        googlePlaceId:p?.id||'',
        name:p?.displayName?.text||'Unnamed place',
        category,
        lat,
        lng,
        address:p?.formattedAddress||'',
        googleMapsUri:p?.googleMapsUri||'',
        source:'google',
        automatic:true,
        googlePrimaryType:p?.primaryType||'',
        googleTypes:Array.isArray(p?.types)?p.types:[]
      };
    })
    .filter(p=>p.category && wantedIds.has(p.category) && Number.isFinite(p.lat) && Number.isFinite(p.lng));

  // Respect each category's configured search radius, but do not apply
  // directional or maximum-result filtering.
  const filtered=places
    .map(p=>({...p,distanceKm:welcomeDistanceKm(Number(d.lat),Number(d.lng),p.lat,p.lng)}))
    .filter(p=>{
      const cat=cats.find(c=>c.id===p.category);
      const radiusKm=Math.max(.5,Math.min(10,Number(cat?.radiusKm)||3));
      return Number.isFinite(p.distanceKm)&&p.distanceKm<=radiusKm;
    })
    .sort((a,b)=>a.distanceKm-b.distanceKm);

  // Google remains a discovery/reference source. We store its stable Place ID,
  // while Papa Golf-owned notes/approval live in our shared Place record.
  filtered.forEach(place=>{
    const id=place.googlePlaceId?`google:${place.googlePlaceId}`:papaGolfPlaceIdentity(place);
    const existing=getPapaGolfPlaces();
    if(!existing.some(p=>p.id===id)){
      upsertPapaGolfPlace({...place,id,sources:['google-discovery']});
    }
  });
  return filtered;
}

async function refreshWelcomeNearbyPlaces(){
  const generation=++welcomeNearbyLoadGeneration;
  const status=document.getElementById('welcomeNearbyStatus');
  const hasGoogle=!!getPapaGolfGooglePlacesKey();

  // Clear prior automatic data immediately so an older provider result
  // cannot remain visible while a new request is in flight.
  welcomeAutomaticPlaces=[];
  welcomeNearbyProvider='';
  renderWelcomeNearbyMap();

  if(hasGoogle){
    try{
      if(status) status.textContent='Loading nearby places from Google…';
      const googlePlaces=await fetchGoogleAutomaticPlaces();

      // Ignore stale responses from an earlier request.
      if(generation!==welcomeNearbyLoadGeneration) return;

      welcomeNearbyProvider='google';
      welcomeAutomaticPlaces=googlePlaces;
      try{
        localStorage.setItem(WELCOME_AUTO_CACHE_KEY,JSON.stringify({
          provider:'google',
          language:welcomeResolvedLanguage(),
          savedAt:Date.now(),
          places:googlePlaces
        }));
      }catch{}

      if(status) status.textContent=`Google Places loaded ${googlePlaces.length} nearby utility places.`;
      renderWelcomeNearbyMap();
      return;
    }catch(err){
      if(generation!==welcomeNearbyLoadGeneration) return;
      console.warn('Google Places automatic search failed; falling back to OpenStreetMap',err);
      if(status) status.textContent='Google Places unavailable. Using OpenStreetMap fallback…';
    }
  }

  // Only reach OSM if Google is unavailable/failed. If a newer refresh starts,
  // this generation becomes stale and will not be allowed to overwrite Google.
  try{
    const beforeGeneration=generation;
    await fetchWelcomeAutomaticPlaces(true);
    if(beforeGeneration!==welcomeNearbyLoadGeneration) return;
    welcomeNearbyProvider='osm';
    renderWelcomeNearbyMap();
  }catch(err){
    if(generation!==welcomeNearbyLoadGeneration) return;
    if(status) status.textContent=`Nearby places failed: ${err?.message||err}`;
  }
}

function welcomeFilteredAutomaticPlaces(){
  const d=effectiveWelcome();
  const cats=getWelcomeCategories().filter(c=>c.enabled&&c.source==='automatic');
  const wanted=welcomeActiveFilter==='all'?cats:cats.filter(c=>c.id===welcomeActiveFilter);
  const output=[];
  wanted.forEach(cat=>{
    const radiusKm=Math.max(.5,Math.min(10,Number(cat.radiusKm)||3));
    const items=welcomeAutomaticPlaces
      .filter(p=>p.category===cat.id)
      .map(p=>({...p,distanceKm:welcomeDistanceKm(d.lat,d.lng,p.lat,p.lng)}))
      .filter(p=>Number.isFinite(p.distanceKm)&&p.distanceKm<=radiusKm)
      .sort((a,b)=>a.distanceKm-b.distanceKm);
    output.push(...items);
  });
  // One simple nearest-first list across the active automatic categories.
  return output.sort((a,b)=>a.distanceKm-b.distanceKm);
}
function welcomeAllVisiblePlaces(){
  const d=effectiveWelcome();
  const curated=welcomeFilteredPartners().map(x=>({
    ...x,
    automatic:false,
    source:x.source||'curated',
    distanceKm:welcomeDistanceKm(d.lat,d.lng,Number(x.lat),Number(x.lng))
  }));
  const automatic=welcomeFilteredAutomaticPlaces();
  return [...curated,...automatic].sort((a,b)=>(a.distanceKm??Infinity)-(b.distanceKm??Infinity));
}

function renderWelcomeGuestFilters(){
  const host=document.getElementById('welcomeGuestFilters');
  if(!host)return;
  const cats=getWelcomeCategories().filter(c=>c.enabled);
  host.innerHTML=`<button type="button" class="welcome-filter-chip ${welcomeActiveFilter==='all'?'active':''}" data-welcome-filter="all">${escapeHtml(welcomeT('all'))}</button>`+
    cats.map(c=>`<button type="button" class="welcome-filter-chip ${welcomeActiveFilter===c.id?'active':''}" data-welcome-filter="${escapeHtml(c.id)}">${c.icon} ${escapeHtml(welcomeCategoryLabel(c))}</button>`).join('');
}
function welcomeFilteredPartners(){
  const cats=getWelcomeCategories().filter(c=>c.enabled);
  const allowed=new Set(cats.map(c=>c.id));
  return getWelcomePartners().filter(p=>allowed.has(p.category)&&(welcomeActiveFilter==='all'||p.category===welcomeActiveFilter));
}

function welcomeLeafletIcon(categoryId,isVilla=false){
  if(isVilla){
    return L.divIcon({
      className:'welcome-leaflet-div-icon',
      html:`<div class="welcome-villa-marker">
        <div class="welcome-villa-pin"></div>
        <div class="welcome-villa-label">${escapeHtml(welcomeT('youAreHere'))}</div>
      </div>`,
      iconSize:[110,54],
      iconAnchor:[55,50],
      popupAnchor:[0,-48]
    });
  }
  const cat=welcomeCategoryDef(categoryId)||{};
  return L.divIcon({
    className:'welcome-leaflet-div-icon',
    html:`<div class="welcome-category-marker" title="${escapeHtml(welcomeCategoryLabel(cat))}">${cat.icon||'📍'}</div>`,
    iconSize:[38,38],
    iconAnchor:[19,19],
    popupAnchor:[0,-20]
  });
}
function welcomeMapBoundsAround(lat,lng,halfSpanMeters=WELCOME_MAP_HALF_SPAN_METERS){
  const latDelta=halfSpanMeters/111320;
  const cosLat=Math.max(.2,Math.cos(lat*Math.PI/180));
  const lngDelta=halfSpanMeters/(111320*cosLat);
  return [
    [lat-latDelta,lng-lngDelta],
    [lat+latDelta,lng+lngDelta]
  ];
}


function settleWelcomeNearbyMapLayout(map){
  if(!map || typeof map.invalidateSize!=='function') return;
  const settle=()=>{
    try{ map.invalidateSize({pan:false,animate:false}); }catch{}
  };
  requestAnimationFrame(()=>{
    settle();
    requestAnimationFrame(settle);
  });
  setTimeout(settle,120);
  setTimeout(settle,450);
}

let welcomeMapResizeTimer=null;
function scheduleWelcomeMapResize(){
  clearTimeout(welcomeMapResizeTimer);
  welcomeMapResizeTimer=setTimeout(()=>{
    if(welcomeNearbyMap) settleWelcomeNearbyMapLayout(welcomeNearbyMap);
  },100);
}
window.addEventListener('resize',scheduleWelcomeMapResize,{passive:true});
window.addEventListener('orientationchange',scheduleWelcomeMapResize,{passive:true});
if(window.visualViewport){
  window.visualViewport.addEventListener('resize',scheduleWelcomeMapResize,{passive:true});
}



function welcomePlaceDetailLine(item){
  const parts=[];
  if(item.cost)parts.push(item.cost);
  if(item.accessDifficulty)parts.push(item.accessDifficulty);
  if(item.suggestedVisit)parts.push(item.suggestedVisit);
  return parts.join(' · ');
}

function renderWelcomeNearbyMap(){
  const d=effectiveWelcome();
  const mapEl=document.getElementById('welcomeNearbyMap');
  const status=document.getElementById('welcomeNearbyStatus');
  const list=document.getElementById('welcomeNearbyList');
  if(!mapEl||!Number.isFinite(d.lat)||!Number.isFinite(d.lng))return;

  if(!welcomeNearbyMap){
    welcomeNearbyMap=L.map(mapEl,{scrollWheelZoom:false}).setView([d.lat,d.lng],15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
      maxZoom:19,
      attribution:'&copy; OpenStreetMap contributors'
    }).addTo(welcomeNearbyMap);
    welcomeNearbyLayer=L.layerGroup().addTo(welcomeNearbyMap);
  }
  welcomeNearbyMap.invalidateSize();
  welcomeNearbyLayer.clearLayers();
  welcomeNearbyMarkers.clear();

  const villa=L.marker([d.lat,d.lng],{icon:welcomeLeafletIcon('',true),zIndexOffset:1000})
    .addTo(welcomeNearbyLayer)
    .bindPopup(`<strong>${escapeHtml(d.unitName)}</strong><br>You are here`);
  welcomeNearbyMarkers.set('villa',villa);
  const items=welcomeAllVisiblePlaces();
  const bounds=[[d.lat,d.lng]];

  items.forEach(item=>{
    const lat=Number(item.lat),lng=Number(item.lng);
    if(!Number.isFinite(lat)||!Number.isFinite(lng))return;
    const cat=welcomeCategoryDef(item.category)||{};
    const dist=Number.isFinite(item.distanceKm)?item.distanceKm:welcomeDistanceKm(d.lat,d.lng,lat,lng);
    const sourceLabel=item.source==='google'?welcomeT('googleNearby'):(item.automatic?welcomeT('nearbyUtility'):welcomeT('approved'));
    const placeId=String(item.id||`${item.category}-${lat}-${lng}`);
    const placeMarker=L.marker([lat,lng],{icon:welcomeLeafletIcon(item.category,false)})
      .addTo(welcomeNearbyLayer)
      .bindPopup(`<strong>${escapeHtml(item.name)}</strong><br>${escapeHtml(welcomeCategoryLabel(cat))} · ${dist.toFixed(dist<1?2:1)} ${welcomeResolvedLanguage()==='th'?'กม.':'km'}<br><small>${escapeHtml(sourceLabel)}</small>${item.note?'<br>'+escapeHtml(item.note):''}`);
    welcomeNearbyMarkers.set(placeId,placeMarker);
    bounds.push([lat,lng]);
  });

  // Always start tightly centred on the villa. Results beyond this initial frame
  // remain available by panning/zooming or via the result cards below.
  const villaBounds=welcomeMapBoundsAround(d.lat,d.lng,WELCOME_MAP_HALF_SPAN_METERS);
  welcomeNearbyMap.fitBounds(villaBounds,{padding:[8,8],animate:false});
  if(welcomeNearbyMap.getZoom()<WELCOME_MAP_INITIAL_ZOOM){
    welcomeNearbyMap.setZoom(WELCOME_MAP_INITIAL_ZOOM);
  }

  const activeCat=welcomeActiveFilter==='all'?null:welcomeCategoryDef(welcomeActiveFilter);
  const automaticActive=(welcomeActiveFilter==='all'
    ? getWelcomeCategories().some(c=>c.enabled&&c.source==='automatic')
    : activeCat?.source==='automatic');

  if(status){
    if(welcomeAutomaticLoading && automaticActive){
      status.textContent=welcomeT('searching');
    }else if(welcomeAutomaticError && automaticActive){
      status.textContent=welcomeAutomaticError;
    }else{
      const autoCount=welcomeFilteredAutomaticPlaces().length;
      const curatedCount=welcomeFilteredPartners().length;
      const parts=[];
      if(automaticActive){
        const provider=welcomeNearbyProvider==='google'?'Google':(welcomeNearbyProvider==='osm'?'OpenStreetMap':(welcomeAutomaticPlaces.some(p=>p.source==='google')?'Google':'OpenStreetMap'));
        parts.push(`${autoCount} ${provider} utility place${autoCount===1?'':'s'}`);
      }
      if(curatedCount)parts.push(`${curatedCount} approved place${curatedCount===1?'':'s'}`);
      status.textContent=parts.length?parts.join(' · '):welcomeT('none');
    }
  }

  if(list){
    list.innerHTML=items.length?items.map(item=>{
      const cat=welcomeCategoryDef(item.category)||{};
      const dist=welcomeDistanceKm(d.lat,d.lng,Number(item.lat),Number(item.lng));
      const sourceLabel=item.source==='google'?welcomeT('googleNearby'):(item.automatic?welcomeT('nearbyUtility'):welcomeT('approved'));
      const placeId=String(item.id||`${item.category}-${item.lat}-${item.lng}`);
      return `<article class="welcome-place-card welcome-place-card-interactive" data-welcome-place-id="${escapeHtml(placeId)}" tabindex="0" role="button" aria-label="Show ${escapeHtml(item.name)} on map">
        <div class="welcome-place-icon">${cat.icon||'📍'}</div>
        <div class="welcome-place-copy">
          <strong>${escapeHtml(item.name)}</strong>
          <div class="small muted">${escapeHtml(welcomeCategoryLabel(cat))} · ${dist.toFixed(dist<1?2:1)} ${escapeHtml(welcomeT('away'))}</div>
          <div class="welcome-source-badge ${item.source==='google'?'google':(item.automatic?'automatic':'approved')}">${escapeHtml(sourceLabel)}</div>
          ${item.note?`<div class="welcome-place-note">${escapeHtml(item.note)}</div>`:''}
          <a class="welcome-map-link" href="${item.googleMapsUri||welcomeGoogleMapsUrl(item.lat,item.lng)}" target="_blank" rel="noopener">${escapeHtml(welcomeT('navigate'))}</a>
        </div>
      </article>`;
    }).join(''):'<div class="guest-info-card"><p class="muted">No approved places have been added for this filter yet.</p></div>';
  }

  settleWelcomeNearbyMapLayout(welcomeNearbyMap);
}
function renderGuestFoodList(){
  const host=document.getElementById('guestFoodList');
  if(!host)return;
  const d=effectiveWelcome();
  const categories=new Set(['restaurant','bar','cafe']);
  const items=getWelcomePartners().filter(x=>categories.has(x.category)&&welcomeCategoryDef(x.category)?.enabled);
  host.innerHTML=items.length?items.map(item=>{
    const cat=welcomeCategoryDef(item.category)||{};
    const dist=welcomeDistanceKm(d.lat,d.lng,Number(item.lat),Number(item.lng));
    return `<article class="welcome-place-card">
      <div class="welcome-place-icon">${cat.icon||'🍽'}</div>
      <div class="welcome-place-copy"><strong>${escapeHtml(item.name)}</strong>
      <div class="small muted">${escapeHtml(cat.label||'Food & Drink')} · ${dist.toFixed(dist<1?2:1)} km away</div>
      ${item.note?`<div class="welcome-place-note">${escapeHtml(item.note)}</div>`:''}
      <a class="welcome-map-link" href="${item.googleMapsUri||welcomeGoogleMapsUrl(item.lat,item.lng)}" target="_blank" rel="noopener">${escapeHtml(welcomeT('navigate'))}</a></div>
    </article>`;
  }).join(''):'<div class="guest-info-card"><p class="muted">No approved restaurants or bars have been added yet.</p></div>';
}


function focusWelcomeNearbyPlace(placeId){
  const marker=welcomeNearbyMarkers.get(String(placeId));
  const villaMarker=welcomeNearbyMarkers.get('villa');
  if(!marker||!villaMarker||!welcomeNearbyMap)return;

  const destination=marker.getLatLng();
  const villa=villaMarker.getLatLng();

  // Zoom as tightly as possible while keeping both the villa's YOU ARE HERE
  // pin and the selected place visible at the same time.
  const bounds=L.latLngBounds([villa,destination]);
  welcomeNearbyMap.fitBounds(bounds,{
    paddingTopLeft:[54,72],
    paddingBottomRight:[54,72],
    maxZoom:19,
    animate:true
  });

  // If the two points are extremely close together, Leaflet can still leave
  // excessive whitespace. Use a high zoom while retaining both markers.
  setTimeout(()=>{
    if(!welcomeNearbyMap||!welcomeNearbyMap.getBounds().contains(villa)||!welcomeNearbyMap.getBounds().contains(destination)){
      welcomeNearbyMap.fitBounds(bounds,{padding:[60,74],maxZoom:19,animate:false});
    }
    marker.openPopup();
  },280);

  const mapEl=document.getElementById('welcomeNearbyMap');
  if(mapEl){
    const rect=mapEl.getBoundingClientRect();
    const visible=rect.top>=0 && rect.bottom<=window.innerHeight;
    if(!visible){
      const top=rect.top+window.scrollY-16;
      window.scrollTo({top,behavior:'smooth'});
    }
  }
}

function welcomePublicUrl(){
  // The first real property currently uses the prototype page. This remains
  // centralized so a dedicated villa slug can replace it without changing the A5 renderer.
  return new URL('gateway-demo.html', location.href).href;
}
function renderWelcomeA5(){
  const d=effectiveWelcome();
  const logo=document.getElementById('welcomeA5Logo');
  if(logo)logo.src=d.logo||'magic-dragon-villa-logo.png';
  const wn=document.getElementById('welcomeA5WifiName');
  const wp=document.getElementById('welcomeA5WifiPassword');
  if(wn)wn.textContent=d.wifiName||'—';
  if(wp)wp.textContent=d.wifiPassword||'—';

  const qr=document.getElementById('welcomeA5Qr');
  if(qr){
    qr.innerHTML='';
    const url=welcomePublicUrl();
    if(typeof QRCode!=='undefined'){
      new QRCode(qr,{text:url,width:210,height:210,colorDark:'#000000',colorLight:'#ffffff',correctLevel:QRCode.CorrectLevel.M});
    }else{
      qr.innerHTML='<div class="a5-qr-fallback">WELCOME<br>QR</div>';
    }
  }
}
function printWelcomeA5(){
  renderWelcomeA5();
  setTimeout(()=>window.print(),80);
}


const PAPA_GOLF_NAV_SECTION_KEY='papaGolfAdminSectionV1';
function setupPapaGolfProgressiveSections(){
  const root=document.getElementById('welcomeModule');
  if(!root)return;
  const sections=[...root.querySelectorAll('.pg-nav-section[data-pg-section]')];
  if(!sections.length)return;
  // Fresh entry starts intentionally quiet: every major section is collapsed.
  // The last section is still recorded for future contextual use, but is not auto-opened.
  const stored=(()=>{try{return localStorage.getItem(PAPA_GOLF_NAV_SECTION_KEY)||''}catch{return ''}})();
  const setOpen=(id,{scroll=false}={})=>{
    sections.forEach(section=>{
      const open=section.dataset.pgSection===id;
      section.classList.toggle('pg-section-open',open);
      section.classList.toggle('pg-section-collapsed',!open);
      const toggle=section.querySelector(':scope > .pg-section-toggle');
      if(toggle){toggle.setAttribute('aria-expanded',open?'true':'false');toggle.querySelector('.pg-section-chevron').textContent=open?'⌄':'›';}
    });
    try{localStorage.setItem(PAPA_GOLF_NAV_SECTION_KEY,id)}catch{}
    if(scroll){
      const target=sections.find(x=>x.dataset.pgSection===id);
      const toggle=target?.querySelector(':scope > .pg-section-toggle');
      setTimeout(()=>toggle?.scrollIntoView({behavior:'smooth',block:'start'}),40);
    }
  };
  sections.forEach(section=>{
    if(section.querySelector(':scope > .pg-section-toggle'))return;
    const btn=document.createElement('button');
    btn.type='button';
    btn.className='pg-section-toggle';
    btn.setAttribute('aria-expanded','false');
    btn.innerHTML=`<span class="pg-section-toggle-copy"><strong>${escapeHtml(section.dataset.pgLabel||'Section')}</strong><span>${escapeHtml(section.dataset.pgSummary||'')}</span></span><span class="pg-section-chevron" aria-hidden="true">›</span>`;
    btn.addEventListener('click',()=>{
      const isOpen=section.classList.contains('pg-section-open');
      if(isOpen){section.classList.remove('pg-section-open');section.classList.add('pg-section-collapsed');btn.setAttribute('aria-expanded','false');btn.querySelector('.pg-section-chevron').textContent='›';return;}
      setOpen(section.dataset.pgSection,{scroll:true});
    });
    section.prepend(btn);
  });
  sections.forEach(section=>{
    section.classList.remove('pg-section-open');
    section.classList.add('pg-section-collapsed');
    const toggle=section.querySelector(':scope > .pg-section-toggle');
    if(toggle){toggle.setAttribute('aria-expanded','false');toggle.querySelector('.pg-section-chevron').textContent='›';}
  });
  window.papaGolfOpenAdminSection=(id,options={})=>setOpen(id,options);
}

function initWelcomeModule(){
  setupPapaGolfProgressiveSections();
  document.addEventListener('click',event=>{
    const btn=event.target.closest('[data-open-photo-place]');
    if(!btn)return;
    const id=btn.getAttribute('data-open-photo-place');
    try{document.querySelector('[data-tab="welcome"]')?.click()}catch{}
    setTimeout(()=>openPapaGolfPlaceEditor(id),80);
  });

  syncPapaGolfPlaces().catch(console.warn);
  // Seed the first real-world property only when Welcome has never been configured.
  if(!localStorage.getItem(WELCOME_PROPERTY_KEY))localStorage.setItem(WELCOME_PROPERTY_KEY,JSON.stringify(WELCOME_DEFAULT_PROPERTY));
  if(!localStorage.getItem(WELCOME_UNIT_KEY)){
    localStorage.setItem(WELCOME_UNIT_KEY,JSON.stringify(WELCOME_DEFAULT_UNIT));
  }else{
    const existingUnit=readWelcomeJson(WELCOME_UNIT_KEY,{});
    if(!String(existingUnit.wifiName||'').trim() && !String(existingUnit.wifiPassword||'').trim()){
      localStorage.setItem(WELCOME_UNIT_KEY,JSON.stringify({...WELCOME_DEFAULT_UNIT,...existingUnit,wifiName:WELCOME_DEFAULT_UNIT.wifiName,wifiPassword:WELCOME_DEFAULT_UNIT.wifiPassword}));
    }
  }

  const open=document.getElementById('openWelcomeModuleBtn'),page=document.getElementById('welcomeModule'),preview=document.getElementById('welcomeGuestPreview'),a5=document.getElementById('welcomeA5Preview');
  const googlePlacesInput=document.getElementById('welcomeGooglePlacesApiKey');
  if(googlePlacesInput)googlePlacesInput.value=getPapaGolfGooglePlacesKey();
  open?.addEventListener('click',()=>{loadWelcomeEditor();welcomeShow(page)});

  document.getElementById('welcomeBackBtn')?.addEventListener('click',()=>{
    page?.classList.add('hidden');preview?.classList.add('hidden');a5?.classList.add('hidden');
    document.getElementById('photosView')?.classList.remove('hidden');
    document.querySelector('.library-tools')?.classList.remove('hidden');
    document.querySelectorAll('.view-tab').forEach(el=>el.classList.remove('active'));
    document.getElementById('photosTabBtn')?.classList.add('active');
    window.scrollTo(0,0);
  });
  document.getElementById('welcomeGuestBackBtn')?.addEventListener('click',()=>welcomeShow(page));

  [['overrideWelcomeHost','welcomeUnitHost'],['overrideWelcomeEmergency','welcomeUnitEmergency']].forEach(([a,b])=>{
    document.getElementById(a)?.addEventListener('change',()=>welcomeToggle(a,b));
  });

  document.getElementById('saveWelcomePropertyBtn')?.addEventListener('click',()=>{saveWelcomeProperty();alert('Property information saved.')});
  document.getElementById('saveWelcomeUnitBtn')?.addEventListener('click',()=>{saveWelcomeUnit();alert('Villa information saved.')});
  document.getElementById('welcomeSaveGooglePlacesKey')?.addEventListener('click',()=>{
    const input=document.getElementById('welcomeGooglePlacesApiKey');
    const status=document.getElementById('welcomeGooglePlacesStatus');
    const saved=savePapaGolfGooglePlacesKey(input?.value||'');
    if(status)status.textContent=saved?'Google Places key saved on this device.':'Google Places key removed.';
  });
  document.getElementById('welcomeTestGooglePlaces')?.addEventListener('click',testPapaGolfGooglePlaces);

  document.getElementById('welcomeCategoryEditor')?.addEventListener('change',event=>{
    if(event.target?.dataset?.role!=='source')return;
    const rows=[...document.querySelectorAll('#welcomeCategoryEditor .welcome-category-row')];
    const current=getWelcomeCategories();
    const next=current.map(cat=>{
      const row=rows.find(r=>r.dataset.categoryId===cat.id);
      return {...cat,enabled:!!row?.querySelector('[data-role="enabled"]')?.checked,source:row?.querySelector('[data-role="source"]')?.value||cat.source};
    });
    localStorage.setItem(WELCOME_CATEGORY_KEY,JSON.stringify(next));
    renderWelcomeCategoryEditor();
  });

  document.getElementById('saveWelcomeCategoriesBtn')?.addEventListener('click',()=>{saveWelcomeCategories();renderWelcomePartnerCategorySelect();alert('Explore Nearby categories saved.')});
  document.getElementById('addWelcomePartnerBtn')?.addEventListener('click',addWelcomePartner);

  document.getElementById('sharedPlaceFilter')?.addEventListener('change',renderPapaGolfPlaceManager);
  document.getElementById('refreshSharedPlacesBtn')?.addEventListener('click',async()=>{
    await syncPapaGolfPlaces(); renderWelcomeExistingPlacePicker(); renderPapaGolfPlaceManager();
  });
  document.getElementById('sharedPlaceManagerList')?.addEventListener('click',event=>{
    const editBtn=event.target.closest('[data-edit-place]');
    if(editBtn){openPapaGolfPlaceEditor(editBtn.getAttribute('data-edit-place'));return}
    const gatewayBtn=event.target.closest('[data-create-gateway]');
    if(gatewayBtn){const p=getPapaGolfPlace(gatewayBtn.getAttribute('data-create-gateway'));const type=['restaurant','bar','cafe','tour','attraction'].includes(p?.category)?p.category:'other';const g=createGatewayForPlace(p.id,type);if(g)openGatewayEditor(g.id);renderPapaGolfPlaceManager();return}
    const btn=event.target.closest('[data-promote-place]');
    if(btn)promotePlaceToCurated(btn.getAttribute('data-promote-place'));
  });
  document.getElementById('sharedPlaceEditCloseBtn')?.addEventListener('click',closePapaGolfPlaceEditor);
  document.getElementById('sharedPlaceEditSaveBtn')?.addEventListener('click',savePapaGolfPlaceEditor);
  document.getElementById('gatewayManagerList')?.addEventListener('click',e=>{const b=e.target.closest('[data-edit-gateway]');if(b)openGatewayEditor(b.getAttribute('data-edit-gateway'))});
  document.getElementById('gatewayEditCloseBtn')?.addEventListener('click',()=>document.getElementById('gatewayEditPanel')?.classList.add('hidden'));
  document.getElementById('gatewayEditSaveBtn')?.addEventListener('click',saveGatewayEditor);
  renderPapaGolfGatewayManager();
  document.getElementById('welcomeUseExistingPlaceBtn')?.addEventListener('click',()=>{
    const id=document.getElementById('welcomeExistingPlaceSelect')?.value||'';
    if(id)fillCuratedFormFromPlace(getPapaGolfPlace(id));
  });


  document.getElementById('welcomePartnerList')?.addEventListener('click',event=>{
    const btn=event.target.closest('[data-remove-welcome-partner]');
    if(!btn)return;
    const index=Number(btn.dataset.removeWelcomePartner);
    const items=getWelcomePartners();
    items.splice(index,1);
    saveWelcomePartners(items);
    syncPapaGolfPlaces().catch(console.warn);
    renderWelcomePartnerEditor();
    renderWelcomeExistingPlacePicker();
    renderPapaGolfPlaceStatus();
  });

  document.getElementById('previewWelcomeGuestBtn')?.addEventListener('click',()=>{
    saveWelcomeProperty();
    saveWelcomeUnit();
    saveWelcomeCategories();
    renderGuestWelcome();
    welcomeShow(preview);
  });

  document.getElementById('previewWelcomeA5Btn')?.addEventListener('click',()=>{
    saveWelcomeProperty();
    saveWelcomeUnit();
    renderWelcomeA5();
    welcomeShow(a5);
  });
  document.getElementById('printWelcomeA5Btn')?.addEventListener('click',()=>{
    saveWelcomeProperty();
    saveWelcomeUnit();
    renderWelcomeA5();
    welcomeShow(a5);
    setTimeout(()=>printWelcomeA5(),120);
  });
  document.getElementById('welcomeA5BackBtn')?.addEventListener('click',()=>welcomeShow(page));
  document.getElementById('welcomeA5PrintBtn')?.addEventListener('click',printWelcomeA5);

  document.getElementById('welcomeNearbyList')?.addEventListener('click',event=>{
    if(event.target.closest('a'))return;
    const card=event.target.closest('[data-welcome-place-id]');
    if(card)focusWelcomeNearbyPlace(card.dataset.welcomePlaceId);
  });
  document.getElementById('welcomeNearbyList')?.addEventListener('keydown',event=>{
    if(!['Enter',' '].includes(event.key))return;
    const card=event.target.closest('[data-welcome-place-id]');
    if(!card)return;
    event.preventDefault();
    focusWelcomeNearbyPlace(card.dataset.welcomePlaceId);
  });

  document.getElementById('refreshWelcomeNearbyBtn')?.addEventListener('click',async()=>{
    try{localStorage.removeItem(WELCOME_AUTO_CACHE_KEY)}catch{}
    await refreshWelcomeNearbyPlaces();
  });

  document.getElementById('welcomeLanguageSelect')?.addEventListener('change',async event=>{
    localStorage.setItem(WELCOME_LANGUAGE_KEY,event.target.value||'auto');
    welcomeAutomaticPlaces=[];
    welcomeNearbyProvider='';
    try{localStorage.removeItem(WELCOME_AUTO_CACHE_KEY)}catch{}
    applyWelcomeLanguage();
    await refreshWelcomeNearbyPlaces();
  });

  document.getElementById('welcomeGuestPreview')?.addEventListener('click',event=>{
    const tile=event.target.closest('[data-welcome-panel]');
    if(tile){openGuestWelcomePanel(tile.dataset.welcomePanel);return}
    if(event.target.closest('.guest-panel-back')){showGuestWelcomeHome();return}
    const filter=event.target.closest('[data-welcome-filter]');
    if(filter){
      welcomeActiveFilter=filter.dataset.welcomeFilter;
      renderWelcomeGuestFilters();
      renderWelcomeNearbyMap();
      const cat=welcomeActiveFilter==='all'?null:welcomeCategoryDef(welcomeActiveFilter);
      if(welcomeActiveFilter==='all'||cat?.source==='automatic')refreshWelcomeNearbyPlaces();
    }
  });

  ['photosTabBtn','mapTabBtn','areasTabBtn'].forEach(id=>{
    document.getElementById(id)?.addEventListener('click',()=>{
      page?.classList.add('hidden');preview?.classList.add('hidden');
      document.querySelector('.library-tools')?.classList.remove('hidden');
    });
  });
}
window.addEventListener('DOMContentLoaded',initWelcomeModule);
