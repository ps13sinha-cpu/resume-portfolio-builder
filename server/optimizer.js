// Resume optimizer: extract the keywords that matter in a job description,
// check which ones an existing resume already contains, score the match the
// way applicant-tracking systems do (keyword coverage, weighted by
// importance), and propose changes that work the keywords in.
//
// Honesty rules, same as the rest of the builder:
//   - keywords already evidenced in the resume (e.g. used in a bullet) are
//     surfaced into Skills / the summary / reworded bullets automatically
//   - keywords the resume never mentions are only offered as "I have this"
//     checkboxes, off by default — nothing is claimed on the user's behalf
//   - AI rewrites may not add tools, numbers or facts; anything that looks
//     new is flagged
import { z } from 'zod';
import { claudeJson } from './claude.js';
import { termRe, vocabIn, unsupportedTerms, newNumbers } from './tailor.js';

const clip = (s, n) => String(s ?? '').slice(0, n);

// Non-engineering terms the tech vocabulary in tailor.js doesn't cover.
const EXTRA_VOCAB = [
  'Excel', 'PowerPoint', 'Salesforce', 'HubSpot', 'Jira', 'Confluence', 'Tableau', 'Power BI', 'Google Analytics', 'SAP', 'QuickBooks',
  'project management', 'program management', 'product strategy', 'roadmap', 'budgeting', 'forecasting', 'financial modeling',
  'sales', 'business development', 'marketing', 'SEO', 'content strategy', 'customer success', 'customer service', 'CRM',
  'data analysis', 'data visualization', 'reporting', 'KPIs', 'process improvement', 'operations', 'vendor management',
  'negotiation', 'problem solving', 'collaboration', 'teamwork', 'presentation', 'time management', 'attention to detail'
];

const STOP = new Set(('a an and are as at be by for from has have in is it of on or our the their this to we will with you your ' +
  'about across all also any build building candidate company current day design develop development ensure environment ' +
  'excellent experience first help high ideal including join key knowledge large level looking make must new nice ' +
  'other plus preferred qualifications required requirements responsibilities role skills strong support team teams ' +
  'understanding using well work working years year what who why how when where').split(' '));

const LINE_WEIGHT = (line) =>
  /\b(nice to have|preferred|bonus|a plus|plus\b|good to have)/i.test(line) ? 'low'
    : /\b(required|must|minimum|qualifications|requirements|you have|you'll need|essential)/i.test(line) ? 'high'
      : null;

// Heuristic keyword extraction: known vocabulary + product-like tokens
// (acronyms, CamelCase, words with digits/+/#) that repeat or look technical.
const heuristicKeywords = (jd) => {
  const lines = jd.split(/\n|(?<=[.;])\s+/).map((l) => l.trim()).filter(Boolean);
  const found = new Map(); // term -> { term, count, weight, listed }
  // Section context: lines under "Requirements:" are required, under
  // "Nice to have:" optional, until the next heading.
  let mode = null;
  const bump = (term, line, listed) => {
    const key = term.toLowerCase();
    const cur = found.get(key) || { term, count: 0, weight: null, listed: false };
    cur.count += 1;
    cur.listed = cur.listed || listed;
    const w = LINE_WEIGHT(line) || mode;
    if (w === 'high' || (w === 'low' && !cur.weight)) cur.weight = w;
    found.set(key, cur);
  };
  const vocab = [...vocabIn(jd), ...EXTRA_VOCAB.filter((t) => termRe(t).test(jd))];
  lines.forEach((line) => {
    const heading = line.length < 60 && /:\s*$/.test(line);
    if (heading) mode = LINE_WEIGHT(line);
    // a plain sentence (not a bullet) after a list ends that section
    else if (mode && !/^[-•*·]/.test(line)) mode = null;
    // "Nice to have: dbt, Snowflake" style inline lists count for this line only
    const inlineLow = /^(nice to have|preferred|bonus)[^:]*:/i.test(line);
    const listed = /^[-•*·]/.test(line) || (line.match(/,/g) || []).length >= 2 || !!mode;
    const lineMode = inlineLow ? 'low' : mode;
    const bumpHere = (t) => { const saved = mode; mode = lineMode; bump(t, line, listed); mode = saved; };
    vocab.forEach((t) => { if (termRe(t).test(line)) bumpHere(t); });
    const tokens = line.match(/\b[A-Za-z][A-Za-z0-9+#./-]{1,30}\b/g) || [];
    tokens.forEach((tok, i) => {
      const lower = tok.toLowerCase();
      if (STOP.has(lower) || vocab.some((v) => v.toLowerCase() === lower)) return;
      const productLike = /^[A-Z0-9]{2,6}$/.test(tok) || /[a-z][A-Z]/.test(tok) || /[0-9+#]/.test(tok);
      const properMid = i > 0 && /^[A-Z][a-z]+$/.test(tok);
      if (productLike || properMid) bumpHere(tok.replace(/[.,]$/, ''));
      // lowercase tool names inside a list after a colon ("Nice to have: dbt, …")
      else if (inlineLow && /^[a-z][a-z0-9]{1,15}$/.test(tok) && line.indexOf(tok) > line.indexOf(':')) bumpHere(tok);
    });
  });
  const all = [...found.values()]
    .filter((k) => k.count >= 2 || k.listed || vocab.includes(k.term) || /^[A-Z0-9]{2,6}$/.test(k.term) || /[a-z][A-Z]/.test(k.term));
  // Drop fragments of longer keywords ("BI" inside "Power BI")
  const deduped = all.filter((k) => !all.some((o) => o !== k && o.term.length > k.term.length && termRe(k.term).test(o.term)));
  return deduped
    .map((k) => ({
      term: k.term,
      importance: k.weight === 'low' ? 'low' : (k.weight === 'high' || k.count >= 2) ? 'high' : 'medium',
      category: /^[a-z ]+$/.test(k.term) ? 'skill' : 'tool'
    }))
    .sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.importance] - { high: 0, medium: 1, low: 2 }[b.importance]))
    .slice(0, 28);
};

// Resume → text per section (for "where is this keyword?")
const sections = (r) => ({
  summary: [r.profile?.title, r.profile?.bio].filter(Boolean).join(' '),
  experience: (r.experience || []).map((e) => [e.role, e.company, ...(e.bullets || [])].join(' ')).join(' '),
  skills: (r.skills || []).map((s) => s.name).join(', '),
  projects: (r.projects || []).map((p) => [p.title, p.description, ...(p.techStack || [])].join(' ')).join(' '),
  education: (r.education || []).map((e) => [e.degree, e.field, e.institution].join(' ')).join(' '),
  certifications: (r.certifications || []).map((c) => [c.name, c.issuer].join(' ')).join(' ')
});

// ATS-style score: importance-weighted keyword coverage. Keywords listed in
// Skills or the summary count fully; ones only in the body count 60%, since
// scanners and recruiters weigh the explicit skills/summary most.
const WEIGHT = { high: 3, medium: 2, low: 1 };
export const scoreKeywords = (keywords) => {
  const total = keywords.reduce((s, k) => s + WEIGHT[k.importance], 0);
  const have = keywords.reduce((s, k) => {
    if (!k.inResume) return s;
    const strong = k.where.includes('skills') || k.where.includes('summary');
    return s + WEIGHT[k.importance] * (strong ? 1 : 0.6);
  }, 0);
  return total ? Math.round((have / total) * 100) : 0;
};

const AiSchema = z.object({
  keywords: z.array(z.object({
    term: z.string().max(60),
    importance: z.enum(['high', 'medium', 'low']),
    category: z.string().max(30).optional().default('skill')
  })).max(30),
  summary: z.string().max(700).nullable().optional(),
  bulletRewrites: z.array(z.object({
    expIndex: z.number().int(),
    bulletIndex: z.number().int(),
    after: z.string().max(500),
    keywords: z.array(z.string().max(60)).max(6).optional().default([])
  })).max(10).optional().default([])
});

const AI_PROMPT = `You optimize a resume for an applicant-tracking system (ATS) and a specific job description. Respond with ONLY JSON:
{
  "keywords": [{ "term": string, "importance": "high" | "medium" | "low", "category": "skill" | "tool" | "certification" | "soft skill" | "domain" }],
  "summary": string,
  "bulletRewrites": [{ "expIndex": number, "bulletIndex": number, "after": string, "keywords": [string] }]
}
- "keywords": the 12-25 terms from the job description an ATS would match on (hard skills, tools, certifications, domain terms, key soft skills). Use the job's exact wording. "high" = required / repeated, "medium" = mentioned, "low" = nice to have.
- "summary": a 2-3 sentence professional summary using ONLY facts from the resume, naturally including the job's keywords the resume already supports.
- "bulletRewrites": up to 8 existing bullets reworded to use the job's terminology where the bullet ALREADY describes that thing (e.g. "built APIs" → "designed REST APIs" only if REST is evident). Keep every fact, number and tool; add nothing. "keywords" lists the job keywords the rewrite now contains.
Never invent experience, tools, metrics, employers or certifications. No markdown. JSON only.`;

export const optimizeResume = async ({ resume = {}, jobDescription = '' }) => {
  const jd = clip(jobDescription, 12000).trim();
  if (jd.length < 40) return { ok: false, message: 'Paste a longer job description (at least a few lines).' };
  const r = resume;
  const sec = sections(r);
  const resumeText = Object.values(sec).join(' ');

  let engine = 'heuristic';
  let ai = null;
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const view = {
        profile: { title: r.profile?.title, bio: r.profile?.bio },
        experience: (r.experience || []).slice(0, 10).map((e, i) => ({ expIndex: i, role: e.role, company: e.company, bullets: (e.bullets || []).slice(0, 10).map((b, j) => ({ bulletIndex: j, text: clip(b, 400) })) })),
        skills: (r.skills || []).map((s) => s.name),
        projects: (r.projects || []).slice(0, 8).map((p) => ({ title: p.title, description: clip(p.description, 400), tech: p.techStack || [] })),
        education: (r.education || []).map((e) => [e.degree, e.field, e.institution].filter(Boolean).join(', ')),
        certifications: (r.certifications || []).map((c) => c.name)
      };
      ai = AiSchema.parse(await claudeJson(AI_PROMPT, `Job description:\n${jd}\n\nResume (JSON):\n${JSON.stringify(view)}`, 3500));
      engine = 'claude';
    } catch (err) {
      console.error('[optimizer] AI failed, using heuristics:', err.message);
    }
  }

  // Keywords + where each already appears
  const raw = ai?.keywords?.length ? ai.keywords : heuristicKeywords(jd);
  const seen = new Set();
  const keywords = raw
    .filter((k) => { const key = k.term.toLowerCase(); if (seen.has(key)) return false; seen.add(key); return true; })
    .map((k) => {
      const where = Object.entries(sec).filter(([, text]) => termRe(k.term).test(text)).map(([s]) => s);
      return { ...k, inResume: where.length > 0, where };
    });
  const scoreBefore = scoreKeywords(keywords);

  const suggestions = [];
  const skillNames = (r.skills || []).map((s) => s.name.toLowerCase());
  const inSkills = (term) => skillNames.some((n) => termRe(term).test(n));

  // 1. Surface keywords the resume already evidences but doesn't list as skills
  keywords.filter((k) => k.inResume && !inSkills(k.term) && k.category !== 'soft skill').forEach((k) => {
    suggestions.push({ id: `found:${k.term}`, type: 'add_skill', term: k.term, source: 'found', defaultOn: true,
      label: `Add “${k.term}” to Skills`, reason: `Already in your ${k.where.join(', ')}; listing it in Skills helps ATS matching.` });
  });

  // 2. Summary that uses the supported keywords
  const presentHigh = keywords.filter((k) => k.inResume).map((k) => k.term);
  let summary = ai?.summary?.trim();
  if (!summary) {
    const top = (r.experience || [])[0];
    const title = r.profile?.title || top?.role || 'Professional';
    const parts = [`${title}${top?.company ? ` with experience at ${top.company}` : ''}.`];
    if (presentHigh.length) parts.push(`Skilled in ${presentHigh.slice(0, 6).join(', ')}.`);
    const proj = (r.projects || []).find((p) => p.title);
    if (proj) parts.push(`Recent work includes ${proj.title}.`);
    summary = parts.join(' ');
  }
  if (summary && summary !== (r.profile?.bio || '').trim()) {
    const w = [];
    const terms = unsupportedTerms(summary, resumeText);
    const nums = newNumbers(summary, resumeText);
    if (terms.length) w.push(`Mentions ${terms.join(', ')}, which isn't in your resume.`);
    if (nums.length) w.push(`Adds number(s) ${nums.join(', ')} not in your resume.`);
    suggestions.push({ id: 'summary', type: 'set_summary', before: r.profile?.bio || '', after: summary, defaultOn: w.length === 0, warnings: w,
      label: 'Keyword-rich professional summary', reason: 'The summary is one of the first places an ATS and a recruiter look.' });
  }

  // 3. Bullet rewrites (AI only — rewording needs language understanding)
  (ai?.bulletRewrites || []).forEach((b) => {
    const before = r.experience?.[b.expIndex]?.bullets?.[b.bulletIndex];
    if (!before || before.trim() === b.after.trim()) return;
    const w = [];
    const terms = unsupportedTerms(b.after, before + ' ' + resumeText);
    const nums = newNumbers(b.after, before);
    if (terms.length) w.push(`Mentions ${terms.join(', ')}, which this bullet didn't.`);
    if (nums.length) w.push(`Adds number(s) ${nums.join(', ')} not in the original.`);
    suggestions.push({ id: `bullet:${b.expIndex}:${b.bulletIndex}`, type: 'edit_bullet', expIndex: b.expIndex, bulletIndex: b.bulletIndex, before, after: b.after,
      keywords: b.keywords || [], defaultOn: w.length === 0, warnings: w,
      label: `Reword a bullet at ${r.experience[b.expIndex].company || r.experience[b.expIndex].role}`, reason: b.keywords?.length ? `Uses the job's wording: ${b.keywords.join(', ')}.` : 'Uses the job’s wording.' });
  });

  // 4. Missing keywords — only if the user confirms they have them
  keywords.filter((k) => !k.inResume && k.category !== 'soft skill').forEach((k) => {
    suggestions.push({ id: `missing:${k.term}`, type: 'add_skill', term: k.term, source: 'missing', defaultOn: false, requiresConfirm: true,
      label: `I have “${k.term}”`, reason: `${k.importance === 'high' ? 'Required' : k.importance === 'low' ? 'Nice to have' : 'Mentioned'} in the job, but not in your resume. Tick only if true.` });
  });

  return { ok: true, engine, keywords, scoreBefore, suggestions };
};
