// ============================================================================
// TEMPLATE REGISTRY — JSON-file store (this backend has no SQL engine; user
// decision). Same fields/statuses as the spec's `templates` table:
//   id, name, source_repo_url, source_path, stack('react'|'nextjs'|'vue'|'static'),
//   status('pending'|'manifest_generated'|'adapter_generated'|'verified'|'rejected'),
//   manifest_json, adapter_code, preview_image_url, created_at
// plus review fields (reviewed_at, reject_reason, review_note).
// The end-user template picker MUST read through verifiedOnly() — the
// `status = 'verified'` hard filter of the spec, enforced in data access,
// not just hidden in UI.
// ============================================================================
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REGISTRY_FILE = path.join(__dirname, 'registry.json');

export const TEMPLATE_STATUSES = ['pending', 'manifest_generated', 'adapter_generated', 'verified', 'rejected'];
export const TEMPLATE_STACKS = ['react', 'nextjs', 'vue', 'static'];

let _cache = null;

const load = () => {
  if (_cache) return _cache;
  try {
    _cache = JSON.parse(fs.readFileSync(REGISTRY_FILE, 'utf-8'));
    if (!_cache.templates) _cache.templates = [];
  } catch {
    _cache = { templates: [] };
  }
  return _cache;
};

const save = (db) => {
  fs.writeFileSync(REGISTRY_FILE, JSON.stringify(db, null, 2));
  _cache = db;
};

export const registry = {
  all() {
    return load().templates;
  },

  verifiedOnly() {
    return load().templates.filter((t) => t.status === 'verified');
  },

  get(id) {
    return load().templates.find((t) => t.id === id) || null;
  },

  // Upsert on id; resets to `pending` when source changes (hash guard).
  upsert(entry) {
    const db = load();
    const now = new Date().toISOString();
    const existing = db.templates.find((t) => t.id === entry.id);
    const sourceHash = crypto.createHash('sha256').update(JSON.stringify(entry.sourceFiles || {})).digest('hex').slice(0, 16);
    if (existing && existing.source_hash && existing.source_hash !== sourceHash) {
      // Template source changed → re-verification required.
      existing.status = 'pending';
      existing.manifest_json = null;
      existing.adapter_code = null;
    }
    const row = existing || { id: entry.id, created_at: now };
    Object.assign(row, {
      name: entry.name ?? row.name,
      source_repo_url: entry.source_repo_url ?? row.source_repo_url ?? null,
      source_path: entry.source_path ?? row.source_path ?? null,
      stack: entry.stack ?? row.stack,
      source_hash: sourceHash,
      source_files: entry.sourceFiles ?? row.source_files ?? null,
      preview_image_url: entry.preview_image_url ?? row.preview_image_url ?? null,
      updated_at: now
    });
    if (!existing) db.templates.push(row);
    save(db);
    return row;
  },

  setStatus(id, status, extra = {}) {
    const db = load();
    const row = db.templates.find((t) => t.id === id);
    if (!row) return null;
    if (!TEMPLATE_STATUSES.includes(status)) throw new Error(`Unknown status: ${status}`);
    row.status = status;
    if (status !== 'rejected') delete row.reject_reason;
    Object.assign(row, extra);
    row.updated_at = new Date().toISOString();
    save(db);
    return row;
  },

  setManifest(id, manifest) {
    const db = load();
    const row = db.templates.find((t) => t.id === id);
    if (!row) return null;
    row.manifest_json = manifest;
    save(db);
    return row;
  },

  setAdapter(id, adapterCode) {
    const db = load();
    const row = db.templates.find((t) => t.id === id);
    if (!row) return null;
    row.adapter_code = adapterCode;
    save(db);
    return row;
  },

  remove(id) {
    const db = load();
    const before = db.templates.length;
    db.templates = db.templates.filter((t) => t.id !== id);
    save(db);
    return db.templates.length < before;
  }
};
