// ============================================================================
// INGESTION ORCHESTRATOR — runs Stages 1-3 and prepares the isolated render
// artifact. Framework templates (react/nextjs/vue) are bundled ONCE at
// ingestion time with esbuild into a self-contained HTML file (JS inlined);
// they are NEVER imported into the main app's React tree. Static templates
// are patched per-render by their generated adapter.
// Every stage's failure marks the template 'rejected' with the raw error
// recorded — no silent retries (spec §4/§5).
// ============================================================================
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import esbuild from 'esbuild';
import { registry } from './registry.js';
import { discoverTemplateStructure } from './discovery.js';
import { inferTemplateManifest, heuristicManifest } from './manifest.js';
import { generatePropsAdapter, generatePatchAdapter, assertPureAdapter } from './adapters.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BUNDLE_DIR = path.join(__dirname, 'bundles');
fs.mkdirSync(BUNDLE_DIR, { recursive: true });

const reject = (id, err) => {
  registry.setStatus(id, 'rejected', { reject_reason: String(err.message || err).slice(0, 500) });
  console.error(`[ingest] ${id} rejected: ${err.message || err}`);
};

export const ingestTemplate = async (templateDir, meta = {}) => {
  const id = meta.id || path.basename(templateDir);
  registry.upsert({
    id,
    name: meta.name || id,
    source_repo_url: meta.source_repo_url || null,
    source_path: templateDir,
    stack: 'static', // replaced by discovery below
    sourceFiles: {} // replaced by discovery below
  });

  // ---- Stage 1: structural discovery ----
  let discovery;
  try {
    discovery = discoverTemplateStructure(templateDir);
  } catch (err) {
    reject(id, err);
    return registry.get(id);
  }
  registry.upsert({
    id,
    name: meta.name || id,
    stack: discovery.stack,
    sourceFiles: discovery.sourceFiles
  });

  // ---- Stage 2: AI schema inference (heuristic fallback w/o key) ----
  let manifest;
  try {
    manifest = process.env.ANTHROPIC_API_KEY
      ? await inferTemplateManifest(discovery.sourceFiles, discovery)
      : heuristicManifest(discovery.sourceFiles, discovery);
  } catch (err) {
    reject(id, err);
    return registry.get(id);
  }
  if (manifest.isDataDriven !== discovery.isDataDriven) {
    // The model contradicted the filesystem — trust the filesystem, note it.
    manifest.notes = `${manifest.notes || ''} [isDataDriven reconciled to filesystem value: ${discovery.isDataDriven}]`.trim();
    manifest.isDataDriven = discovery.isDataDriven;
  }
  registry.setManifest(id, manifest);
  registry.setStatus(id, 'manifest_generated');

  // ---- Stage 3: adapter generation (pure, sandbox-checked later) ----
  try {
    const adapterCode = manifest.isDataDriven
      ? await generatePropsAdapter(manifest, discovery.sourceFiles)
      : await generatePatchAdapter(manifest, discovery.sourceFiles);
    assertPureAdapter(adapterCode); // fail the ingestion, not the runtime
    registry.setAdapter(id, adapterCode);
    registry.setStatus(id, 'adapter_generated');
  } catch (err) {
    reject(id, err);
    return registry.get(id);
  }

  // ---- Isolated render artifact for framework templates ----
  if (discovery.stack !== 'static') {
    try {
      const entryPath = path.join(templateDir, discovery.entryFile || 'src/main.jsx');
      const outfile = path.join(BUNDLE_DIR, `${id}.js`);
      await esbuild.build({
        entryPoints: [entryPath],
        outfile,
        bundle: true,
        format: 'iife',
        jsx: 'automatic',
        loader: { '.jsx': 'jsx', '.tsx': 'tsx', '.ts': 'ts', '.js': 'jsx', '.vue': 'text', '.json': 'json' },
        define: { 'process.env.NODE_ENV': '"production"' },
        logLevel: 'silent'
      });
      const js = fs.readFileSync(outfile, 'utf-8');
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body><div id="root"></div><script>window.__TEMPLATE_DATA__=null;/*DATA_SLOT*/</script><script>${js}</script></body></html>`;
      fs.writeFileSync(path.join(BUNDLE_DIR, `${id}.html`), html);
      registry.setStatus(id, 'adapter_generated', { bundle_path: `server/bundles/${id}.html` });
    } catch (err) {
      reject(id, new Error(`esbuild bundle failed: ${err.message}`));
      return registry.get(id);
    }
  }

  return registry.get(id);
};

// Serve the prebuilt bundle HTML (framework templates) for iframe isolation.
export const bundleHtml = (id) => {
  const p = path.join(BUNDLE_DIR, `${id}.html`);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf-8') : null;
};
