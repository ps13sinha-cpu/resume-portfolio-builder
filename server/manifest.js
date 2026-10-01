// ============================================================================
// STAGE 2 — AI SCHEMA INFERENCE
// Sends the template's key files to Claude with the spec's exact system
// prompt, parses the response through a Zod gate. On parse failure the
// template is marked 'rejected' — never retried silently.
// ============================================================================
import { z } from 'zod';
import { claudeJson } from './claude.js';

export const MANIFEST_SYSTEM_PROMPT = `Given this portfolio template's source code, output ONLY valid JSON (no prose) describing:
1. sections: which of these it displays — profile, education, experience, skills, projects, certifications, contact — and for each, the exact field names/shape the template code expects
2. capacity limits inferred from the code itself:
   - array slicing (e.g. .slice(0,3)) means a hard item cap
   - CSS line-clamp or fixed-height text containers imply character limits
   - grid column counts (e.g. repeat(4, 1fr)) suggest a natural item count
3. isDataDriven: true if content comes from a data file/props, false if hardcoded directly in markup
4. Never guess silently — if a limit can't be inferred, omit it rather than inventing a number.

Output schema: { sections: { [name]: { supported, expectedShape, maxItems?, charLimits? } }, isDataDriven, notes }`;

// Runtime gate for the model's manifest output.
export const ManifestSchema = z.object({
  sections: z.record(
    z.string(),
    z.object({
      supported: z.boolean(),
      expectedShape: z.string().max(2000),
      maxItems: z.number().int().positive().optional(),
      charLimits: z.record(z.string(), z.number().int().positive()).optional()
    })
  ),
  isDataDriven: z.boolean(),
  notes: z.string().max(4000).optional()
});

const SECTION_KEYS = ['profile', 'education', 'experience', 'skills', 'projects', 'certifications', 'contact'];

// Rank source files by relevance so the prompt stays small: entry/components/
// data files first, styles for the capacity clues.
const rankFiles = (sourceFiles) => {
  const weight = (p) => {
    const n = p.toLowerCase();
    if (/^(src\/)?(main|app|index)\.[jt]sx?$/.test(n) || /page\.tsx$/.test(n)) return 0;
    if (/\/(components|sections)\//.test(n)) return 1;
    if (/(data|content)\.(js|json)$/.test(n)) return 0;
    if (n.endsWith('.css')) return 2;
    if (n.endsWith('.html')) return 2;
    return 3;
  };
  return Object.keys(sourceFiles)
    .sort((a, b) => weight(a) - weight(b))
    .slice(0, 12)
    .map((p) => `----- FILE: ${p} -----\n${String(sourceFiles[p]).slice(0, 12_000)}`)
    .join('\n\n');
};

export const inferTemplateManifest = async (sourceFiles, discoveryResult) => {
  const payload =
    `Stack: ${discoveryResult.stack}\n` +
    `Entry file: ${discoveryResult.entryFile}\n` +
    `Data entry point: ${discoveryResult.dataEntryPoint || '(none found)'}\n\n` +
    rankFiles(sourceFiles);

  const raw = await claudeJson(MANIFEST_SYSTEM_PROMPT, payload, 4000);

  // Normalize: keep only the canonical seven sections, fill defaults.
  const sections = {};
  for (const key of SECTION_KEYS) {
    const s = raw.sections?.[key];
    sections[key] = {
      supported: s ? !!s.supported : false,
      expectedShape: s ? String(s.expectedShape || '').slice(0, 2000) : 'not displayed by this template',
      ...(s && Number.isFinite(s.maxItems) ? { maxItems: Math.floor(s.maxItems) } : {}),
      ...(s && s.charLimits && typeof s.charLimits === 'object' ? { charLimits: s.charLimits } : {})
    };
  }
  const candidate = {
    sections,
    isDataDriven: !!raw.isDataDriven,
    notes: String(raw.notes || '').slice(0, 4000)
  };

  const parsed = ManifestSchema.safeParse(candidate);
  if (!parsed.success) {
    const err = new Error(`Manifest failed schema gate: ${parsed.error.issues[0].path.join('.')} — ${parsed.error.issues[0].message}`);
    err.code = 'MANIFEST_INVALID';
    throw err;
  }
  return parsed.data;
};

// Deterministic fallback when no API key is configured: infer from discovery
// + regex scans of the source. Conservative — omits limits it can't infer.
export const heuristicManifest = (sourceFiles, discoveryResult) => {
  const all = Object.values(sourceFiles).join('\n');
  const sections = {};
  const patterns = {
    profile: [/fullName|full_name|profile\.name|hero.*name/i],
    education: [/education|universit|degree/i],
    experience: [/experience|work\.map|jobs/i],
    skills: [/skills|technolog/i],
    projects: [/projects|portfolio.*work|repo/i],
    certifications: [/certification|certificate|credential/i],
    contact: [/contact|mailto|get in touch/i]
  };
  for (const [key, res] of Object.entries(patterns)) {
    const supported = res.some((re) => re.test(all));
    sections[key] = { supported, expectedShape: supported ? 'inferred from source scan (no AI key configured)' : 'not displayed by this template' };
  }
  // Hard caps visible in code: .slice(0, N)
  const sliceCaps = [...all.matchAll(/\.slice\(0,\s*(\d+)\)/g)].map((m) => parseInt(m[1], 10));
  if (sliceCaps.length) sections.projects.maxItems = Math.min(...sliceCaps);
  return {
    sections,
    isDataDriven: discoveryResult.isDataDriven,
    notes: 'Heuristic manifest (no ANTHROPIC_API_KEY at ingestion time). Regex-inferred support; limits omitted unless explicit in code.'
  };
};
