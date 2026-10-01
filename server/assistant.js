// AI chat assistant: suggests updates to the user's resume/portfolio data
// for a target job description. Replies with advice plus structured,
// one-click "suggestions" the client applies after the user reviews a diff.
//
// Same guarantees as the rest of the builder: facts only from the user's
// data or what they say in the chat; anything that looks new is flagged.
// Without ANTHROPIC_API_KEY a rule-based coach answers instead (and says so).
import { z } from 'zod';
import { claudeChatJson } from './claude.js';
import { analyzeJobFit, unsupportedTerms, newNumbers } from './tailor.js';

const clip = (s, n) => String(s ?? '').slice(0, n);

// Portfolio → the candidate shape the job-fit analysis expects.
const toCandidate = (pf) => ({
  profile: pf.profile || {},
  experience: (pf.experience || []).map((e) => ({ role: e.role, company: e.company, bullets: e.bullets || [] })),
  skills: (pf.skills || []).map((s) => ({ name: s.name, category: s.category })),
  projects: (pf.projects || []).map((p) => ({ title: p.title, description: p.description, techStack: p.techTags || p.techStack || [] })),
  education: pf.education || [],
  certifications: pf.certifications || []
});

// Compact, index-addressable view of the data for the model.
const contextView = (pf) => ({
  profile: { fullName: pf.profile?.fullName, title: pf.profile?.title, bio: pf.profile?.bio, statusPill: pf.profile?.statusPill },
  experience: (pf.experience || []).slice(0, 10).map((e, i) => ({
    expIndex: i, role: e.role, company: e.company, dates: [e.start, e.end].filter(Boolean).join(' – '),
    bullets: (e.bullets || []).slice(0, 10).map((b, j) => ({ bulletIndex: j, text: clip(b, 400) }))
  })),
  projects: (pf.projects || []).slice(0, 10).map((p, i) => ({ projectIndex: i, title: p.title, description: clip(p.description, 500), tech: p.techTags || p.techStack || [] })),
  skills: (pf.skills || []).map((s) => s.name),
  education: (pf.education || []).map((e) => [e.degree, e.field, e.institution].filter(Boolean).join(', ')),
  certifications: (pf.certifications || []).map((c) => c.name)
});

const SuggestionSchema = z.object({
  type: z.enum(['set_bio', 'set_title', 'set_status', 'edit_bullet', 'reorder_bullets', 'edit_project', 'add_skill', 'reorder_skills']),
  label: z.string().max(120),
  reason: z.string().max(300).optional().default(''),
  expIndex: z.number().int().optional(),
  bulletIndex: z.number().int().optional(),
  projectIndex: z.number().int().optional(),
  after: z.string().max(800).optional(),
  skill: z.object({ name: z.string().max(60), category: z.string().max(40).optional() }).optional(),
  order: z.array(z.string().max(400)).max(60).optional()
});
const ReplySchema = z.object({
  reply: z.string().max(3000),
  suggestions: z.array(SuggestionSchema).max(6).optional().default([])
});

const SYSTEM_PROMPT = (ctx, jd) => `You are the AI career assistant inside a resume and portfolio-website builder. The user's resume data also powers their portfolio website, so a change updates both.

The user's current data (indices address items):
${JSON.stringify(ctx)}

Target job description:
${jd ? jd : '(none provided yet — ask the user to paste one if they want tailoring)'}

Respond with ONLY JSON: { "reply": string, "suggestions": Suggestion[] }
- "reply": plain text, friendly and specific, under 150 words. No markdown headings. Refer to concrete items ("your Acme bullet about checkout").
- "suggestions": 0-5 concrete edits the user can apply with one click. Types:
  { "type": "set_bio", "label", "reason", "after" }
  { "type": "set_title", "label", "reason", "after" }
  { "type": "set_status", "label", "reason", "after" }            // short availability line
  { "type": "edit_bullet", "label", "reason", "expIndex", "bulletIndex", "after" }
  { "type": "reorder_bullets", "label", "reason", "expIndex", "order": [bullet texts, most relevant first] }
  { "type": "edit_project", "label", "reason", "projectIndex", "after" }   // new description
  { "type": "add_skill", "label", "reason", "skill": { "name", "category" } }
  { "type": "reorder_skills", "label", "reason", "order": [skill names, most relevant first] }
Hard rules:
1. Use ONLY facts in the user's data or stated by the user in this chat. Never invent employers, tools, metrics, numbers, dates or outcomes.
2. When the job asks for something the user hasn't mentioned, ASK whether they have that experience — do not add it. Only use add_skill after the user confirms it in the chat.
3. Rewrites keep every fact of the original; reframe emphasis and wording toward the job's language.
4. Don't suggest a change that's already in place.`;

// ---------------------------------------------------------------------------
// Rule-based coach (no API key)
// ---------------------------------------------------------------------------
const INTENTS = [
  ['bio', /summary|bio|about|intro|headline/i],
  ['bullets', /bullet|experience|achievement|responsibilit/i],
  ['skills', /skill|keyword|technolog|stack|tool/i]
];

const heuristicReply = async (pf, jd, lastUser) => {
  if (!jd) {
    return {
      reply: 'Paste the job description you are applying for (use "Set job" at the top of this panel) and I will check your resume against it, then suggest changes you can apply with one click.',
      suggestions: []
    };
  }
  const fit = await analyzeJobFit(toCandidate(pf), jd);
  const met = fit.requirements.filter((r) => r.status === 'met').map((r) => r.requirement);
  const missing = fit.requirements.filter((r) => r.status === 'missing').map((r) => r.requirement);
  const intent = (INTENTS.find(([, rx]) => rx.test(lastUser || '')) || ['overview'])[0];
  const suggestions = [];

  const skills = (pf.skills || []).map((s) => s.name);
  const isMet = (name) => met.some((m) => name.toLowerCase().includes(m.toLowerCase()));
  const reordered = [...skills.filter(isMet), ...skills.filter((n) => !isMet(n))];
  const skillsChange = reordered.join('|') !== skills.join('|');

  if ((intent === 'overview' || intent === 'skills') && skillsChange) {
    suggestions.push({ type: 'reorder_skills', label: 'Put the skills this job asks for first', reason: `The job mentions ${met.join(', ')}; recruiters skim the first few skills.`, order: reordered });
  }
  if (intent === 'overview' || intent === 'bullets') {
    (pf.experience || []).forEach((e, i) => {
      const bullets = e.bullets || [];
      const score = (b) => met.filter((m) => b.toLowerCase().includes(m.toLowerCase())).length;
      const sorted = [...bullets].sort((a, b) => score(b) - score(a));
      if (bullets.length > 1 && sorted.join('|') !== bullets.join('|')) {
        suggestions.push({ type: 'reorder_bullets', expIndex: i, label: `Lead with the most relevant bullet at ${e.company || e.role}`, reason: 'Bullets that mention what the job asks for move to the top.', order: sorted });
      }
    });
  }
  if ((intent === 'overview' || intent === 'bio') && fit.suggestedBio && fit.suggestedBio !== pf.profile?.bio) {
    suggestions.push({ type: 'set_bio', label: 'Summary aimed at this job', reason: 'Built only from your own title, employer, skills and projects.', after: fit.suggestedBio });
  }

  const lines = [];
  if (intent === 'bio') lines.push(suggestions.some((s) => s.type === 'set_bio') ? "Here's a summary aimed at this job, using only your own details." : 'Your summary already reads well for this job.');
  if (intent === 'bullets') lines.push(suggestions.some((s) => s.type === 'reorder_bullets') ? 'I moved the bullets that match this job to the top of each role.' : 'Your most relevant bullets are already first. Rewording bullets needs the AI engine.');
  if (intent === 'skills') lines.push(skillsChange ? 'Recruiters skim the first few skills, so put the ones this job asks for first.' : 'Your matching skills are already listed first.');
  if (fit.requirements.length) {
    lines.push(`Your details cover ${met.length} of the ${fit.requirements.length} skills I found in this job${met.length ? ` (${met.join(', ')})` : ''}.`);
    if (missing.length) lines.push(`Not mentioned yet: ${missing.join(', ')}. If you have real experience with any of these, tell me what you did and add it in your details; I won't add it for you.`);
  } else {
    lines.push("I couldn't pick out specific skills from this job description. Try pasting the full requirements section.");
  }
  if (suggestions.length) lines.push('Below are changes you can apply with one click.');
  lines.push('(Rule-based coach: set ANTHROPIC_API_KEY on the server for AI rewrites and free-form answers.)');
  return { reply: lines.join(' '), suggestions: suggestions.slice(0, 5) };
};

// ---------------------------------------------------------------------------
// Validate + enrich suggestions against the real data
// ---------------------------------------------------------------------------
const finalize = (raw, pf, allowedText) => {
  const exp = pf.experience || [];
  const projects = pf.projects || [];
  const skills = (pf.skills || []).map((s) => s.name);
  const out = [];
  raw.forEach((s, i) => {
    const sug = { ...s, id: `s${Date.now().toString(36)}${i}`, warnings: [] };
    switch (s.type) {
      case 'set_bio': sug.before = pf.profile?.bio || ''; break;
      case 'set_title': sug.before = pf.profile?.title || ''; break;
      case 'set_status': sug.before = pf.profile?.statusPill || ''; break;
      case 'edit_bullet': {
        const b = exp[s.expIndex]?.bullets?.[s.bulletIndex];
        if (b === undefined) return;
        sug.before = b;
        break;
      }
      case 'reorder_bullets': {
        const cur = exp[s.expIndex]?.bullets || [];
        // Must be a permutation of the existing bullets — nothing added or lost
        if (!s.order || s.order.length !== cur.length || [...s.order].sort().join('\n') !== [...cur].sort().join('\n')) return;
        sug.before = cur.join('\n');
        sug.after = s.order.join('\n');
        break;
      }
      case 'edit_project': {
        const p = projects[s.projectIndex];
        if (!p) return;
        sug.before = p.description || '';
        sug.label = sug.label || `Rewrite “${p.title}”`;
        break;
      }
      case 'add_skill':
        if (!s.skill?.name || skills.some((n) => n.toLowerCase() === s.skill.name.toLowerCase())) return;
        sug.before = '';
        sug.after = s.skill.name;
        sug.warnings.push('Only add this if you really have the skill.');
        break;
      case 'reorder_skills': {
        if (!s.order || [...s.order].sort().join('\n') !== [...skills].sort().join('\n')) return;
        sug.before = skills.join(', ');
        sug.after = s.order.join(', ');
        break;
      }
      default: return;
    }
    if (['set_bio', 'set_title', 'set_status', 'edit_bullet', 'edit_project'].includes(s.type)) {
      if (!s.after || s.after.trim() === String(sug.before).trim()) return;
      const terms = unsupportedTerms(s.after, allowedText);
      const nums = newNumbers(s.after, allowedText);
      if (terms.length) sug.warnings.push(`Mentions ${terms.join(', ')}, which isn't in your details.`);
      if (nums.length) sug.warnings.push(`Adds number(s) ${nums.join(', ')} not in your details.`);
    }
    out.push(sug);
  });
  return out;
};

export const assistantChat = async ({ messages = [], portfolio = {}, jobDescription = '' }) => {
  const jd = clip(jobDescription, 12000).trim();
  const history = messages
    .filter((m) => (m.role === 'user' || m.role === 'assistant') && m.content)
    .slice(-12)
    .map((m) => ({ role: m.role, content: clip(m.content, 4000) }));
  if (!history.length || history[history.length - 1].role !== 'user') {
    return { ok: false, message: 'Send a message to the assistant.' };
  }
  // Facts the user stated in the chat count as "their data" for the checks.
  const userSaid = history.filter((m) => m.role === 'user').map((m) => m.content).join(' ');
  const allowedText = JSON.stringify(portfolio).replace(/"[a-zA-Z_]+":/g, ' ') + ' ' + userSaid;

  let engine = 'heuristic';
  let result = null;
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      result = ReplySchema.parse(await claudeChatJson(SYSTEM_PROMPT(contextView(portfolio), jd), history, 2500));
      engine = 'claude';
    } catch (err) {
      console.error('[assistant] AI failed, using rule-based coach:', err.message);
    }
  }
  if (!result) result = await heuristicReply(portfolio, jd, history[history.length - 1].content);

  return { ok: true, engine, reply: result.reply, suggestions: finalize(result.suggestions || [], portfolio, allowedText) };
};
