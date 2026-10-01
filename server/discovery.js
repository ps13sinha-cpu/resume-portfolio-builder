// ============================================================================
// STAGE 1 — STRUCTURAL DISCOVERY (automated, per template)
// Walks a template folder, detects the stack, locates the entry component and
// the data entry point, and decides data-driven vs hardcoded markup.
// Analysis only: nothing is executed.
// ============================================================================
import fs from 'fs';
import path from 'path';

const isDir = (p) => { try { return fs.statSync(p).isDirectory(); } catch { return false; } };

export const discoverTemplateStructure = (repoPath) => {
  if (!isDir(repoPath)) throw new Error(`Template path not found: ${repoPath}`);

  // --- stack detection ---
  let stack = 'static';
  let pkg = null;
  try {
    pkg = JSON.parse(fs.readFileSync(path.join(repoPath, 'package.json'), 'utf-8'));
  } catch { /* static template */ }
  if (pkg) {
    const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
    const has = (n) => Object.keys(deps).some((d) => d === n || d.startsWith(`${n}/`));
    if (has('next')) stack = 'nextjs';
    else if (has('react')) stack = 'react';
    else if (has('vue')) stack = 'vue';
    else stack = 'react'; // build tooling present but no framework dep — assume react
  } else {
    // No package.json — infer from file extensions present.
    const walk = (d, depth = 0, out = []) => {
      if (depth > 4) return out;
      for (const f of fs.readdirSync(d)) {
        const full = path.join(d, f);
        if (fs.statSync(full).isDirectory()) out.push(...walk(full, depth + 1));
        else out.push(full);
      }
      return out;
    };
    const files = walk(repoPath);
    if (files.some((f) => /\.(jsx|tsx)$/.test(f))) stack = 'react';
    else if (files.some((f) => /\.vue$/.test(f))) stack = 'vue';
  }

  // --- entry component ---
  const entryCandidates = {
    react: ['src/main.jsx', 'src/main.tsx', 'src/App.jsx', 'src/App.tsx', 'app/page.tsx', 'pages/index.jsx'],
    nextjs: ['app/page.tsx', 'pages/index.tsx', 'pages/index.jsx', 'src/app/page.tsx', 'app/layout.tsx'],
    vue: ['src/main.js', 'src/App.vue', 'src/main.ts'],
    static: ['index.html']
  }[stack];

  const entryFile = entryCandidates
    .map((p) => path.join(repoPath, p))
    .find((p) => fs.existsSync(p)) ||
    // last resort: shallowest index-ish file
    (() => {
      const top = fs.readdirSync(repoPath).find((f) => /^index\.(html|jsx|tsx|js)$/i.test(f));
      return top ? path.join(repoPath, top) : null;
    })();

  // --- data source ---
  let dataEntryPoint = null;
  let isDataDriven = false;
  for (const candidate of ['data.json', 'content.json', 'src/data.json', 'content.js', 'src/data/content.js', 'src/data.js', 'src/content.js']) {
    const p = path.join(repoPath, candidate);
    if (fs.existsSync(p)) { dataEntryPoint = candidate.replace(/\\/g, '/'); isDataDriven = true; break; }
  }

  let dataMode = dataEntryPoint ? 'data-file' : null;
  if (!dataEntryPoint) {
    // Props-driven? Look for component props destructuring from a data import
    // or `export const portfolio =` style modules referenced by the entry.
    const entrySrc = entryFile && /\.(jsx|tsx|js|ts|vue)$/.test(entryFile) ? fs.readFileSync(entryFile, 'utf-8') : '';
    if (entrySrc) {
      const importsData = /import\s+.*\s+from\s+['"][^'"]*(data|content|portfolio)[^'"]*['"]/i.test(entrySrc);
      const propsPattern = /function\s+\w+\s*\(\s*\{[^}]*\}\s*\)|const\s+\w+\s*=\s*\(\s*\{[^}]*\}\s*\)\s*=>/.test(entrySrc);
      if (importsData) { dataEntryPoint = '(entry imports)'; isDataDriven = true; dataMode = 'props'; }
      else if (propsPattern) { dataEntryPoint = '(component props)'; isDataDriven = true; dataMode = 'props'; }
    }
  }

  // --- source file collection (for Stage 2 + adapter generation) ---
  const sourceFiles = {};
  const collect = (d, rel = '', depth = 0) => {
    if (depth > 5) return;
    for (const f of fs.readdirSync(d)) {
      if (f === 'node_modules' || f === '.git' || f === 'dist' || f === 'build' || f.startsWith('.')) continue;
      const full = path.join(d, f);
      const relPath = path.join(rel, f).replace(/\\/g, '/');
      if (fs.statSync(full).isDirectory()) collect(full, relPath, depth + 1);
      else if (/\.(jsx?|tsx?|vue|html|css|json)$/i.test(f) && fs.statSync(full).size < 200_000) {
        sourceFiles[relPath] = fs.readFileSync(full, 'utf-8');
      }
    }
  };
  collect(repoPath);

  return {
    stack,
    entryFile: entryFile ? path.relative(repoPath, entryFile).replace(/\\/g, '/') : null,
    dataEntryPoint,
    dataMode,
    isDataDriven,
    sourceFiles
  };
};
