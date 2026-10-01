// ============================================================================
// STAGE 3 — ADAPTER GENERATION
// Data-driven templates get canonicalToTemplateProps(canonicalData).
// Hardcoded (static) templates get patchTemplateSource(canonicalData, sourceCode).
// Generated functions must be PURE: no imports, no require, no network, no
// process access. Enforced statically (reject-list) and at runtime by
// executing them in a bare node:vm context with a timeout.
// ============================================================================
import vm from 'node:vm';
import { claudeJson } from './claude.js';

const PURITY_REJECT = [
  { re: /\brequire\s*\(/, why: 'uses require()' },
  { re: /(^|\n)\s*import\s/, why: 'uses import' },
  { re: /\bfetch\s*\(|\bXMLHttpRequest\b/, why: 'performs network access' },
  { re: /\bprocess\b\s*\./, why: 'touches process' },
  { re: /\bglobalThis\b|\bwindow\b|\bdocument\b(?=\s*\.)\s*\./, why: 'touches globals/DOM' },
  { re: /\beval\s*\(|new\s+Function\s*\(/, why: 'uses eval/Function constructor' },
  { re: /\bfs\b\s*\.\s*(read|write|append|unlink)/, why: 'touches the filesystem' },
  { re: /\bwhile\s*\(\s*true\s*\)/, why: 'unbounded loop' }
];

export const assertPureAdapter = (code) => {
  for (const { re, why } of PURITY_REJECT) {
    if (re.test(code)) throw new Error(`Adapter rejected — not pure: ${why}`);
  }
  if (code.length > 60_000) throw new Error('Adapter rejected — too large');
};

// Evaluate adapter code in a bare sandbox: no require, no process, no fs,
// no network. The context global allow-list is deliberately tiny.
const SANDBOX_GLOBALS = { JSON, Math, Date, String, Number, Boolean, Array, Object };

const runFnInSandbox = (code, fnName, argNames, args, timeoutMs = 2000) => {
  assertPureAdapter(code);
  const ctx = vm.createContext({ ...SANDBOX_GLOBALS });
  vm.runInContext(code, ctx, { filename: `adapter-${fnName}.js`, timeout: 1000 });
  const probe = vm.runInContext(
    `typeof ${fnName} === 'function' ? ${fnName} : undefined`,
    ctx, { timeout: 500 }
  );
  if (typeof probe !== 'function') throw new Error(`Adapter does not define function ${fnName}`);
  argNames.forEach((n, i) => { ctx[`__${n}__`] = args[i]; });
  return vm.runInContext(
    `${fnName}(${argNames.map((n) => `__${n}__`).join(', ')})`,
    ctx, { timeout: timeoutMs }
  );
};

// Public: run canonicalToTemplateProps in the sandbox.
export const runPropsAdapter = (code, canonicalData) =>
  runFnInSandbox(code, 'canonicalToTemplateProps', ['data'], [canonicalData]);

// Public: run patchTemplateSource in the sandbox.
export const runPatchAdapter = (code, canonicalData, sourceCode) =>
  runFnInSandbox(code, 'patchTemplateSource', ['data', 'src'], [canonicalData, sourceCode]);

const ADAPTER_SYSTEM_PROMPT = `You generate a PURE JavaScript adapter function for a portfolio template. Respond with ONLY the function code (no markdown fences, no prose, no imports, no require).

Rules:
- The function must be deterministic and side-effect free: no require/import, no fetch, no process, no DOM, no eval, no unbounded loops.
- Use only plain JavaScript (ES2019). Return a plain JSON-serializable object.
- Perform only field renames, restructuring, date formatting, and array-to-paragraph joins.

If the template is DATA-DRIVEN, emit exactly:
function canonicalToTemplateProps(canonicalData) {
  // map canonical portfolio fields to the template's expected props shape
  return { ... };
}

If the template HARDCODES content in markup, emit exactly:
function patchTemplateSource(canonicalData, sourceCode) {
  // targeted string replacement of placeholder demo content with real values,
  // preserving all surrounding markup and styling untouched
  return sourceCodeString;
}

Template manifest (expected shapes per section):
`;

// Heuristic fallback props adapter: identity-ish mapping with common aliases.
const HEURISTIC_PROPS_ADAPTER = `function canonicalToTemplateProps(canonicalData) {
  const d = canonicalData || {};
  const p = d.profile || {};
  const fmt = function (start, end, current) {
    var s = start || ''; var e = current ? 'Present' : (end || '');
    return [s, e].filter(Boolean).join(' - ');
  };
  return {
    profile: {
      name: p.fullName || '', role: p.title || '', email: p.email || '',
      location: p.location || '', bio: p.bio || '', avatarUrl: p.avatarUrl || ''
    },
    about: { heading: 'About', body: p.bio || '' },
    education: (d.education || []).map(function (x) {
      return { school: x.institution, degree: x.degree, field: x.field, period: fmt(x.startDate, x.endDate, false), grade: x.grade };
    }),
    experience: (d.experience || []).map(function (x) {
      return { company: x.company, title: x.role, period: fmt(x.startDate, x.endDate, x.isCurrent), summary: (x.bullets || []).join(' '), bullets: x.bullets || [] };
    }),
    skills: (d.skills || []).map(function (s) { return { name: s.name, category: s.category }; }),
    projects: (d.projects || []).map(function (x) {
      return { name: x.title, description: x.description, tech: x.techStack || [], links: x.links || {} };
    }),
    certifications: (d.certifications || []).map(function (c) {
      return { title: c.name, issuer: c.issuer, date: c.date, url: c.credentialUrl };
    })
  };
}`;

// Heuristic fallback patch adapter: esc() + replace known demo literals in
// static markup; keyed by explicit regex list, no blind overwrites.
const HEURISTIC_PATCH_ADAPTER = `function patchTemplateSource(canonicalData, sourceCode) {
  var d = canonicalData || {};
  var p = d.profile || {};
  var esc = function (s) { return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;'); };
  var out = String(sourceCode);
  var name = esc(p.fullName || '');
  var role = esc(p.title || '');
  var bio = esc(p.bio || '');
  var email = esc(p.email || '');
  var titleRe = /<title>[^<]*<\\/title>/i;
  if (titleRe.test(out)) out = out.replace(titleRe, '<title>' + name + ' — ' + role + '</title>');
  var h1Re = /(<h1[^>]*>)([^<]{2,80})(<\\/h1>)/;
  if (h1Re.test(out)) out = out.replace(h1Re, '$1' + name + '$3');
  var bioRe = /(<p[^>]*class="[^"]*(?:bio|about|intro|lead)[^"]*"[^>]*>)[\\s\\S]*?(<\\/p>)/i;
  if (bioRe.test(out)) out = out.replace(bioRe, '$1' + bio + '$3');
  var mailRe = /mailto:[^"']+/gi;
  out = out.replace(mailRe, 'mailto:' + email);
  var projRe = /(<div[^>]*class="[^"]*(?:project|card)[^"]*"[^>]*>)[\\s\\S]{0,400}?(<\\/div>)\\s*(?=<div[^>]*class="[^"]*(?:project|card))/gi;
  return out;
}`;

export const generatePropsAdapter = async (manifest, sourceFiles) => {
  const keyFiles = Object.keys(sourceFiles).slice(0, 8)
    .map((p) => `----- FILE: ${p} -----\n${String(sourceFiles[p]).slice(0, 8000)}`)
    .join('\n\n');
  const user = `${JSON.stringify(manifest, null, 2)}\n\nTemplate source:\n${keyFiles}`;
  if (process.env.ANTHROPIC_API_KEY) {
    const code = await claudeJson('You emit only pure JavaScript function code. No fences.', user, 3000);
    const fn = /canonicalToTemplateProps/.test(code) ? code : `${code}\n${HEURISTIC_PROPS_ADAPTER}`;
    return fn.trim();
  }
  return HEURISTIC_PROPS_ADAPTER;
};

export const generatePatchAdapter = async (manifest, sourceFiles) => {
  const keyFiles = Object.keys(sourceFiles).slice(0, 8)
    .map((p) => `--- FILE: ${p} ---\n${String(sourceFiles[p]).slice(0, 8000)}`).join('\n\n');
  if (process.env.ANTHROPIC_API_KEY) {
    const user = `${JSON.stringify(manifest, null, 2)}\n\nTemplate source:\n${keyFiles}`;
    const code = await claudeJson('You emit only pure JavaScript function code. No fences.', user, 3000);
    const fn = /patchTemplateSource/.test(code) ? code : `${code}\n${HEURISTIC_PATCH_ADAPTER}`;
    return fn.trim();
  }
  return HEURISTIC_PATCH_ADAPTER;
};
