const DB_NAME = 'papa-golf-v01';
const STORE_NAME = 'photos';
const FIELD_KEY = 'papaGolfCustomFields';

const defaultFields = [
  { id: 'title', label: 'Title', type: 'text' },
  { id: 'description', label: 'Description / Notes', type: 'textarea' },
  { id: 'category', label: 'Category', type: 'text' },
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
const detailImage = document.querySelector('#detailImage');
const detailCustomFields = document.querySelector('#detailCustomFields');
const detailMetadata = document.querySelector('#detailMetadata');
const closeDetailBtn = document.querySelector('#closeDetailBtn');
const editDetailBtn = document.querySelector('#editDetailBtn');
const editDialog = document.querySelector('#editDialog');
const editForm = document.querySelector('#editForm');
const editTitle = document.querySelector('#editTitle');
const editFields = document.querySelector('#editFields');
const closeEditBtn = document.querySelector('#closeEditBtn');
const cancelEditBtn = document.querySelector('#cancelEditBtn');
const editStatus = document.querySelector('#editStatus');
let detailImageUrl = null;
let activeRecord = null;

let pending = [];
let customFields = loadFields();

function loadFields() {
  try {
    const raw = localStorage.getItem(FIELD_KEY);
    return raw ? JSON.parse(raw) : defaultFields;
  } catch {
    return defaultFields;
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
  const wrap = document.createElement('div');
  wrap.className = 'field';
  const label = document.createElement('label');
  label.textContent = field.label;
  label.htmlFor = field.id;
  let input;
  if (field.type === 'textarea') input = document.createElement('textarea');
  else input = document.createElement('input');
  input.id = field.id;
  input.name = field.id;
  input.value = value;
  input.dataset.fieldId = field.id;
  input.autocomplete = 'off';
  wrap.append(label, input);
  return wrap;
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
    const values = {};
    node.querySelectorAll('[data-field-id]').forEach(input => values[input.dataset.fieldId] = input.value.trim());
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

function openDetail(record) {
  activeRecord = record;
  if (detailImageUrl) URL.revokeObjectURL(detailImageUrl);
  detailImageUrl = null;
  detailImage.removeAttribute('src');
  if (record.image instanceof Blob && record.image.size > 0) {
    detailImageUrl = URL.createObjectURL(record.image);
    detailImage.src = detailImageUrl;
  } else {
    detailImage.alt = 'Photo data needs restore from backup';
  }
  detailTitle.textContent = record.fields?.title || record.metadata?.filename || 'Photo details';

  detailCustomFields.innerHTML = '';
  const fieldEntries = Object.entries(record.fields || {});
  const populated = fieldEntries.filter(([, value]) => String(value || '').trim());
  if (populated.length) {
    const heading = document.createElement('div');
    heading.className = 'detail-section-title';
    heading.textContent = 'Your information';
    detailCustomFields.appendChild(heading);
    const list = document.createElement('div');
    list.className = 'detail-list';
    populated.forEach(([id, value]) => list.appendChild(detailRow(fieldLabelFor(id), value)));
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
  const recordFields = record.fields || {};
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
  editFields.querySelectorAll('[data-field-id]').forEach(input => {
    values[input.dataset.fieldId] = input.value.trim();
  });
  editStatus.textContent = 'Saving changes…';
  try {
    // Safari/iOS can produce unreliable IndexedDB File objects after a read→write cycle.
    // Materialize the stored bytes and always write back a plain Blob.
    let safeImage = activeRecord.image;
    if (activeRecord.image && typeof activeRecord.image.arrayBuffer === 'function') {
      const bytes = await activeRecord.image.arrayBuffer();
      if (!bytes.byteLength) throw new Error('The stored photo has no image bytes. Restore the last backup before editing.');
      safeImage = new Blob([bytes], { type: activeRecord.image.type || activeRecord.metadata?.type || 'image/jpeg' });
    }
    const updated = { ...activeRecord, image: safeImage, fields: values, updatedAt: new Date().toISOString() };
    await putRecord(updated);
    activeRecord = updated;
    editStatus.textContent = 'Changes saved.';
    await renderGallery();
    closeEdit();

    // The photo itself does not change during a metadata/custom-field edit.
    // Keep the existing object URL alive and refresh only the record text.
    detailTitle.textContent = updated.fields?.title || updated.metadata?.filename || 'Photo details';
    detailCustomFields.innerHTML = '';
    const fieldEntries = Object.entries(updated.fields || {});
    const populated = fieldEntries.filter(([, value]) => String(value || '').trim());
    if (populated.length) {
      const heading = document.createElement('div');
      heading.className = 'detail-section-title';
      heading.textContent = 'Your information';
      detailCustomFields.appendChild(heading);
      const list = document.createElement('div');
      list.className = 'detail-list';
      populated.forEach(([id, value]) => list.appendChild(detailRow(fieldLabelFor(id), value)));
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

async function renderGallery() {
  const records = await getRecords();
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
    meta.textContent = `${location}${new Date(record.savedAt).toLocaleDateString()}${gps}`;
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

function renderFieldManager() {
  fieldList.innerHTML = '';
  customFields.forEach((field) => {
    const row = document.createElement('div'); row.className = 'field-row'; row.dataset.id = field.id;
    const label = document.createElement('input'); label.value = field.label; label.placeholder = 'Field name'; label.dataset.role = 'label';
    const type = document.createElement('select'); type.dataset.role = 'type';
    type.innerHTML = '<option value="text">Short text</option><option value="textarea">Long text</option>';
    type.value = field.type;
    const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'remove-field'; remove.textContent = '×';
    remove.addEventListener('click', () => row.remove());
    row.append(label, type, remove); fieldList.appendChild(row);
  });
}

manageFieldsBtn.addEventListener('click', () => { renderFieldManager(); fieldsDialog.showModal(); });
addFieldBtn.addEventListener('click', () => {
  const row = document.createElement('div'); row.className = 'field-row'; row.dataset.id = `field_${Date.now()}`;
  row.innerHTML = '<input data-role="label" placeholder="Field name"><select data-role="type"><option value="text">Short text</option><option value="textarea">Long text</option></select><button type="button" class="remove-field">×</button>';
  row.querySelector('.remove-field').addEventListener('click', () => row.remove());
  fieldList.appendChild(row);
});

saveFieldsBtn.addEventListener('click', (event) => {
  event.preventDefault();
  const used = new Set();
  customFields = [...fieldList.querySelectorAll('.field-row')].map((row, index) => {
    const label = row.querySelector('[data-role="label"]').value.trim() || `Field ${index + 1}`;
    let id = row.dataset.id || slugify(label);
    if (used.has(id)) id = `${id}_${index + 1}`;
    used.add(id);
    return { id, label, type: row.querySelector('[data-role="type"]').value };
  });
  localStorage.setItem(FIELD_KEY, JSON.stringify(customFields));
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

if ('serviceWorker' in navigator) navigator.serviceWorker.register('./service-worker.js').catch(() => {});
renderGallery().catch(error => { backupStatus.textContent = `Storage error: ${error.message || error}`; });
