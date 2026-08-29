const RUNTIME_VERSION = '0.19';
const DB_NAME = 'papa-golf-v01';
const STORE_NAME = 'photos';
const FIELD_KEY = 'papaGolfCustomFields';

const defaultFields = [
  { id: 'title', label: 'Title', type: 'text' },
  { id: 'description', label: 'Description / Notes', type: 'textarea' },
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

async function exportBackup() {
  const records = await getRecords();
  if (!records.length) throw new Error('There are no saved photos to back up yet.');
  const serialized = [];
  for (let i = 0; i < records.length; i++) {
    backupStatus.textContent = `Preparing backup ${i + 1} of ${records.length}…`;
    const record = records[i];
    const imageDataUrl = await blobToDataUrl(record.image);
    serialized.push({
      ...record,
      image: {
        dataUrl: imageDataUrl,
        name: record.metadata?.filename || 'photo.jpg',
        type: record.metadata?.type || record.image?.type || 'image/jpeg',
        lastModified: record.metadata?.lastModified || Date.now(),
      },
    });
  }
  const payload = {
    format: 'papa-golf-backup',
    version: 1,
    exportedAt: new Date().toISOString(),
    customFields,
    records: serialized,
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
  backupStatus.textContent = `Backup ready: ${records.length} photo${records.length === 1 ? '' : 's'}. Save the downloaded file in iPhone Files.`;
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

async function importBackupFile(file) {
  const text = await file.text();
  let payload;
  try { payload = JSON.parse(text); } catch { throw new Error('That file is not valid JSON.'); }
  if (payload?.format !== 'papa-golf-backup' || payload?.version !== 1 || !Array.isArray(payload.records)) {
    throw new Error('That is not a compatible Papa Golf backup file.');
  }
  mergeCustomFields(payload.customFields);
  let restored = 0;
  for (let i = 0; i < payload.records.length; i++) {
    backupStatus.textContent = `Restoring ${i + 1} of ${payload.records.length}…`;
    const saved = payload.records[i];
    if (!saved?.id || !saved?.image?.dataUrl) continue;
    const blob = dataUrlToBlob(saved.image.dataUrl);
    const restoredRecord = {
      ...saved,
      image: blob,
      restoredAt: new Date().toISOString(),
    };
    await putRecord(restoredRecord);
    restored++;
  }
  await renderGallery();
  backupStatus.textContent = `Restore complete: ${restored} photo${restored === 1 ? '' : 's'} added or updated. Existing photos were not deleted.`;
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
  editStatus.textContent = '';
  editDialog.showModal();
}

function closeEdit() {
  if (editDialog.open) editDialog.close();
  editStatus.textContent = '';
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
      <label>Photo story / notes
        <textarea data-related-field="description" rows="2" placeholder="Optional story specific to this photo"></textarea>
      </label>
      <label>Photo tags
        <input data-related-field="tags" type="text" placeholder="e.g. pigs, beach, jetski">
      </label>
      <details class="related-inherited-editor">
        <summary>Inherited place information · edit for this photo</summary>
        <p class="small muted">Leave an override blank to keep inheriting the main place information.</p>
        <label>Photo-specific place description override
          <textarea data-place-override="description" rows="3" placeholder="Inherited unless you type a different description here"></textarea>
        </label>
        <label>Category override
          <input data-place-override="category" type="text" placeholder="Inherited category">
        </label>
        <label>Location name override
          <input data-place-override="locationName" type="text" placeholder="Inherited location name">
        </label>
        <label>Area / Place override
          <input data-place-override="areaName" type="text" placeholder="Inherited area / place">
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
      input.placeholder='Inherited unless overridden';
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
        activePhotoDescription.textContent=active.description || '';
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
    const updated = { ...activeRecord, image: safeImage, fields: values, supportingPhotos: pendingSupportingPhotos,
      updatedAt: new Date().toISOString() };
    await putRecord(updated);
    activeRecord = updated;
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
    const actions = document.createElement('div'); actions.className = 'gallery-actions';
    const del = document.createElement('button'); del.className = 'delete-record'; del.type = 'button'; del.textContent = 'Delete';
    del.addEventListener('click', async (event) => {
      event.stopPropagation();
      if (confirm('Delete this saved photo from this device?')) { await deleteRecord(record.id); await renderGallery(); }
    });
    actions.appendChild(del); info.append(title, meta, actions); card.append(img, info);
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
  navigator.serviceWorker.register('./service-worker.js', { updateViaCache: 'none' })
    .then(reg => reg.update())
    .catch(() => {});
}
renderGallery().catch(error => { backupStatus.textContent = `Storage error: ${error.message || error}`; });


// ---- Papa Golf Welcome v0.18 ----
const WELCOME_PROPERTY_KEY = 'papaGolfWelcomeProperty';
const WELCOME_UNIT_KEY = 'papaGolfWelcomeUnit';

function getWelcomeProperty(){try{return JSON.parse(localStorage.getItem(WELCOME_PROPERTY_KEY)||'{}')}catch{return {}}}
function getWelcomeUnit(){try{return JSON.parse(localStorage.getItem(WELCOME_UNIT_KEY)||'{}')}catch{return {}}}
function welcomeVal(id){const e=document.getElementById(id);return e?e.value.trim():''}
function welcomeSet(id,v){const e=document.getElementById(id);if(e)e.value=v||''}
function welcomeToggle(cbId,fieldId){const c=document.getElementById(cbId),f=document.getElementById(fieldId);if(c&&f)f.disabled=!c.checked}
function welcomeShow(target){
  const photos=document.getElementById('photosView');
  const map=document.getElementById('mapView');
  const areas=document.getElementById('areasView');
  const tools=document.querySelector('.library-tools');
  const welcome=document.getElementById('welcomeModule');
  const preview=document.getElementById('welcomeGuestPreview');
  [photos,map,areas,welcome,preview].forEach(el=>{if(el)el.classList.add('hidden')});
  if(tools)tools.classList.add('hidden');
  if(target)target.classList.remove('hidden');
  document.querySelectorAll('.view-tab').forEach(el=>el.classList.remove('active'));
  if(target===welcome){
    const b=document.getElementById('openWelcomeModuleBtn');
    if(b)b.classList.add('active');
  }
  window.scrollTo(0,0);
}
function loadWelcomeEditor(){
  const p=getWelcomeProperty(),u=getWelcomeUnit();
  welcomeSet('welcomePropertyName',p.name); welcomeSet('welcomePropertyHost',p.host);
  welcomeSet('welcomePropertyAddress',p.address); welcomeSet('welcomePropertyEmergency',p.emergency);
  welcomeSet('welcomePropertyRecommendations',p.recommendations);
  welcomeSet('welcomeUnitName',u.name); welcomeSet('welcomeWifiName',u.wifiName);
  welcomeSet('welcomeWifiPassword',u.wifiPassword); welcomeSet('welcomeBluetooth',u.bluetooth);
  welcomeSet('welcomeVillaInfo',u.villaInfo); welcomeSet('welcomeUnitHost',u.host);
  welcomeSet('welcomeUnitEmergency',u.emergency); welcomeSet('welcomeUnitRecommendations',u.recommendations);
  const oh=document.getElementById('overrideWelcomeHost'), oe=document.getElementById('overrideWelcomeEmergency'), or=document.getElementById('overrideWelcomeRecommendations');
  if(oh)oh.checked=!!u.overrideHost; if(oe)oe.checked=!!u.overrideEmergency; if(or)or.checked=!!u.overrideRecommendations;
  welcomeToggle('overrideWelcomeHost','welcomeUnitHost'); welcomeToggle('overrideWelcomeEmergency','welcomeUnitEmergency'); welcomeToggle('overrideWelcomeRecommendations','welcomeUnitRecommendations');
}
function effectiveWelcome(){
  const p=getWelcomeProperty(),u=getWelcomeUnit();
  return {
    propertyName:p.name||'Papa Golf Property', unitName:u.name||'Your Villa', address:p.address||'',
    host:u.overrideHost?(u.host||''):(p.host||''),
    emergency:u.overrideEmergency?(u.emergency||''):(p.emergency||''),
    recommendations:u.overrideRecommendations?(u.recommendations||''):(p.recommendations||''),
    wifiName:u.wifiName||'', wifiPassword:u.wifiPassword||'', bluetooth:u.bluetooth||'', villaInfo:u.villaInfo||''
  };
}
function renderGuestWelcome(){
  const d=effectiveWelcome();
  const title=document.getElementById('guestWelcomeTitle'), prop=document.getElementById('guestWelcomeProperty'), head=document.getElementById('guestWelcomeHeading');
  if(title)title.textContent=d.unitName; if(prop)prop.textContent=d.propertyName+(d.address?' · '+d.address:''); if(head)head.textContent='Welcome to '+d.unitName;
  const wifi=document.getElementById('guestWifiInfo');
  if(wifi)wifi.innerHTML=(d.wifiName||d.wifiPassword)?`<p><strong>Wi-Fi:</strong> ${escapeHtml(d.wifiName||'—')}</p><p><strong>Password:</strong> ${escapeHtml(d.wifiPassword||'—')}</p>`:'<p class="muted">No Wi-Fi information added yet.</p>';
  const bt=document.getElementById('guestBluetoothInfo'); if(bt)bt.innerHTML=d.bluetooth?`<p>${escapeHtml(d.bluetooth)}</p>`:'';
  const vi=document.getElementById('guestVillaInfo'); if(vi)vi.innerHTML=d.villaInfo?`<p>${escapeHtml(d.villaInfo)}</p>`:'<p class="muted">No villa instructions added yet.</p>';
  const host=document.getElementById('guestHostInfo'); if(host)host.innerHTML=d.host?`<p><strong>Host / manager:</strong> ${escapeHtml(d.host)}</p>`:'';
  const rec=document.getElementById('guestRecommendationsInfo'); if(rec)rec.innerHTML=d.recommendations?`<p>${escapeHtml(d.recommendations)}</p>`:'<p class="muted">No recommendations added yet.</p>';
  const em=document.getElementById('guestEmergencyInfo'); if(em)em.innerHTML=d.emergency?`<p>${escapeHtml(d.emergency)}</p>`:'<p class="muted">No emergency information added yet.</p>';
}
function initWelcomeModule(){
  const open=document.getElementById('openWelcomeModuleBtn'), page=document.getElementById('welcomeModule'), preview=document.getElementById('welcomeGuestPreview');
  if(open)open.addEventListener('click',()=>{loadWelcomeEditor();welcomeShow(page)});
  const back=document.getElementById('welcomeBackBtn');
  if(back)back.addEventListener('click',()=>{
    const welcome=document.getElementById('welcomeModule'), preview=document.getElementById('welcomeGuestPreview');
    if(welcome)welcome.classList.add('hidden'); if(preview)preview.classList.add('hidden');
    const photos=document.getElementById('photosView'), tools=document.querySelector('.library-tools');
    if(photos)photos.classList.remove('hidden'); if(tools)tools.classList.remove('hidden');
    document.querySelectorAll('.view-tab').forEach(el=>el.classList.remove('active'));
    const photosBtn=document.getElementById('photosTabBtn'); if(photosBtn)photosBtn.classList.add('active');
    window.scrollTo(0,0);
  });
  const pback=document.getElementById('welcomeGuestBackBtn'); if(pback)pback.addEventListener('click',()=>welcomeShow(page));
  [['overrideWelcomeHost','welcomeUnitHost'],['overrideWelcomeEmergency','welcomeUnitEmergency'],['overrideWelcomeRecommendations','welcomeUnitRecommendations']].forEach(([a,b])=>{
    const e=document.getElementById(a); if(e)e.addEventListener('change',()=>welcomeToggle(a,b));
  });
  const sp=document.getElementById('saveWelcomePropertyBtn');
  if(sp)sp.addEventListener('click',()=>{localStorage.setItem(WELCOME_PROPERTY_KEY,JSON.stringify({name:welcomeVal('welcomePropertyName'),host:welcomeVal('welcomePropertyHost'),address:welcomeVal('welcomePropertyAddress'),emergency:welcomeVal('welcomePropertyEmergency'),recommendations:welcomeVal('welcomePropertyRecommendations')}));alert('Property information saved.')});
  const su=document.getElementById('saveWelcomeUnitBtn');
  if(su)su.addEventListener('click',()=>{localStorage.setItem(WELCOME_UNIT_KEY,JSON.stringify({name:welcomeVal('welcomeUnitName'),wifiName:welcomeVal('welcomeWifiName'),wifiPassword:welcomeVal('welcomeWifiPassword'),bluetooth:welcomeVal('welcomeBluetooth'),villaInfo:welcomeVal('welcomeVillaInfo'),overrideHost:!!document.getElementById('overrideWelcomeHost')?.checked,host:welcomeVal('welcomeUnitHost'),overrideEmergency:!!document.getElementById('overrideWelcomeEmergency')?.checked,emergency:welcomeVal('welcomeUnitEmergency'),overrideRecommendations:!!document.getElementById('overrideWelcomeRecommendations')?.checked,recommendations:welcomeVal('welcomeUnitRecommendations')}));alert('Accommodation unit saved.')});
  
  ['photosTabBtn','mapTabBtn','areasTabBtn'].forEach(id=>{
    const b=document.getElementById(id);
    if(b)b.addEventListener('click',()=>{
      const welcome=document.getElementById('welcomeModule'), preview=document.getElementById('welcomeGuestPreview');
      if(welcome)welcome.classList.add('hidden');
      if(preview)preview.classList.add('hidden');
      const tools=document.querySelector('.library-tools');
      if(tools)tools.classList.remove('hidden');
    });
  });

  const pv=document.getElementById('previewWelcomeGuestBtn');
  if(pv)pv.addEventListener('click',()=>{sp?.click();su?.click();renderGuestWelcome();welcomeShow(preview)});
}
window.addEventListener('DOMContentLoaded',initWelcomeModule);
