// ============================================================================
// FITTING ENGINE (runs at user-facing runtime, after template selection)
// fitContentToTemplate(canonicalData, manifest) → { fittedData, fitReport }.
// Rank/truncate to maxItems (most-recent-first), condense over-limit bullets
// via Claude (only when actually over the limit; heuristic trim without a
// key), apply the configured overflowStrategy for unsupported sections, and
// produce the structured fitReport the UI renders. Results are cached by
// (portfolioId, templateId, canonicalDataHash) — recomputed only when the
// underlying resume data changes.
// ============================================================================
import crypto from 'crypto';
import { claudeJson } from './claude.js';

export const OVERFLOW_STRATEGIES = ['condense-then-hide', 'overflow-panel', 'hide-and-flag'];

const condenseViaClaude = async (text, limit) => {
  if (process.env.ANTHROPIC_API_KEY) {
    const out = await claudeJson(
      `Condense this resume bullet to under ${limit} characters. Preserve the concrete achievement or number if present. Do not invent new information. Respond with ONLY the condensed bullet text.`,
      text,
      300
    );
    return String(out).slice(0, limit);
  }
  // Heuristic fallback: keep the first sentence, then trim on a word boundary.
  const first = String(text).split(/(?<=[.!?])\s+/)[0] || String(text);
  if (first.length <= limit) return first;
  return first.slice(0, limit - 1).replace(/\s+\S*$/, '') + '…';
};

const canonicalDataHash = (data) =>
  crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');

// In-memory cache; the registry JSON is the durable source of truth for
// manifests, while fits are cheap to recompute after a server restart.
const fitCache = new Map();

export const fitContentToTemplate = async (canonicalData, manifest, {
  portfolioId = 'default',
  templateId = 'unknown',
  overflowStrategy = 'condense-then-hide',
  condenseTarget = null // set by the UI's "Let AI condense further" action
} = {}) => {
  const hash = canonicalDataHash(canonicalData);
  const cacheKey = `${portfolioId}::${templateId}::${hash}::${overflowStrategy}::${condenseTarget || 0}`;
  if (fitCache.has(cacheKey)) return { ...fitCache.get(cacheKey), cached: true };

  const fittedData = JSON.parse(JSON.stringify(canonicalData));
  const fitReport = {
    itemsShown: {},
    itemsHidden: {},
    bulletsCondensed: [],
    sectionsUnsupported: []
  };

  const sections = manifest?.sections || {};
  const maxOf = (k) => (Number.isFinite(sections[k]?.maxItems) ? sections[k].maxItems : null);

  // 1. Rank + truncate arrays most-recent-first (input order is assumed
  //    most-recent-first already, matching the extraction pipeline).
  const arraySections = ['education', 'experience', 'skills', 'projects', 'certifications'];
  for (const key of arraySections) {
    const arr = fittedData[key] || [];
    const cap = maxOf(key);
    if (cap != null && arr.length > cap) {
      fitReport.itemsShown[key] = cap;
      fitReport.itemsHidden[key] = arr.length - cap;
      fittedData[key] = arr.slice(0, cap);
    } else {
      fitReport.itemsShown[key] = arr.length;
    }
  }

  // 2. Condense over-limit text only where a charLimit is actually set.
  for (const key of ['profile', 'projects', 'experience']) {
    const limits = sections[key]?.charLimits || {};
    const condenseStr = async (s) => {
      if (typeof s !== 'string') return s;
      const limit = condenseTarget ?? limits.__default__;
      if (!limit || s.length <= limit) return s;
      const condensed = await condenseViaClaude(s, limit);
      if (condensed !== s) fitReport.bulletsCondensed.push({ original: s, condensed });
      return condensed;
    };
    if (key === 'profile') {
      fittedData.profile.bio = await condenseStr(fittedData.profile.bio);
    } else if (key === 'projects') {
      for (const p of fittedData.projects) p.description = await condenseStr(p.description);
    } else {
      for (const e of fittedData.experience) {
        e.bullets = await Promise.all(e.bullets.map(condenseStr));
      }
    }
  }

  // 3. Unsupported sections → strategy.
  const foldable = {
    // Fold certifications into skills as tag strings when the template shows
    // skills but not certifications.
    certifications: (data) => {
      if (!sections.skills?.supported) return null;
      const tags = (data.certifications || []).slice(0, 4).map((c) => c.name);
      if (!tags.length) return null;
      data.skills = [...(data.skills || []), ...tags.map((name) => ({ name, category: 'Certification' }))];
      return tags.length;
    }
  };

  for (const key of Object.keys(sections)) {
    const supported = sections[key]?.supported;
    const hasData = key === 'profile' || key === 'contact'
      ? true
      : (fittedData[key] || []).length > 0;
    if (supported || !hasData) continue;

    fitReport.sectionsUnsupported.push(key);
    if (overflowStrategy === 'condense-then-hide' && foldable[key]) {
      const folded = foldable[key](fittedData);
      if (folded) {
        fitReport.sectionsUnsupported = fitReport.sectionsUnsupported.filter((k) => k !== key);
        fitReport.notes = fitReport.notes || [];
        fitReport.notes.push(`${key} folded into skills (${folded} tags)`);
        fitReport.itemsShown.skills = (fitReport.itemsShown.skills || 0) + folded;
      }
    } else if (overflowStrategy === 'overflow-panel') {
      fittedData.overflowContent = fittedData.overflowContent || {};
      fittedData.overflowContent[key] = canonicalData[key];
    }
    // 'hide-and-flag': nothing further — already recorded in the report.
  }

  const result = { fittedData, fitReport, cacheKey };
  fitCache.set(cacheKey, result);
  return result;
};
