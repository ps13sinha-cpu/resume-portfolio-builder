// Template content-fit layer for the "Portfolio website" path.
//
// Given the user's portfolio data (from an uploaded resume or typed details)
// and the design they picked, work out what that specific design displays,
// what the user's data already covers, and use AI to fill the gaps — in the
// design's tone. Every suggestion comes back for review; nothing is applied
// here. Rules the AI must follow (and that we check afterwards):
//   - only facts present in the user's data: no new employers, tools,
//     numbers, clients or dates
//   - never fabricate testimonials, stats, publications or services
import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import { claudeJson } from './claude.js';
import { unsupportedTerms, newNumbers } from './tailor.js';

// Fields each built-in React theme renders (derived from the theme sources).
const REACT_THEME_FIELDS = {
  awwwards: ['bio', 'statusPill', 'avatarUrl', 'imageUrl'],
  developer: ['bio', 'level'],
  executive: ['bio'],
  brutalist: ['bio'],
  noir: ['bio', 'statusPill', 'imageUrl', 'level'],
  swiss: ['bio', 'imageUrl'],
  aurora: ['bio', 'statusPill', 'avatarUrl', 'imageUrl', 'level'],
  bento: ['bio', 'statusPill', 'avatarUrl', 'imageUrl', 'level'],
  magazine: ['bio', 'statusPill', 'avatarUrl', 'imageUrl'],
  resume: ['bio', 'statusPill'],
  chiang: ['bio', 'imageUrl'],
  snellenberg: ['bio'],
  leero: ['bio']
};

const HTML_SECTION_RX = {
  about: /about/,
  skills: /skill|expertise|tech-stack/,
  projects: /project|portfolio|work|case-stud/,
  experience: /experience|timeline|career|employment/,
  education: /education|academic/,
  services: /service|what-i-do/,
  testimonials: /testimonial|client-say/,
  publications: /publication|paper/,
  stats: /stat-|counter|stat"/,
  availability: /available|freelance|hire-me/
};

// ---------------------------------------------------------------------------
// 1. What does the chosen design display?
// ---------------------------------------------------------------------------
export const profileTemplate = (layoutId, { catalog, tplRoot }) => {
  const id = String(layoutId || '').replace(/^html:/i, '');
  if (REACT_THEME_FIELDS[id]) {
    const f = new Set(REACT_THEME_FIELDS[id]);
    return {
      id, kind: 'react', category: 'technology', role: '',
      sections: ['about', 'skills', 'projects', 'experience', 'education', 'certifications'],
      uses: {
        statusPill: f.has('statusPill'), avatar: f.has('avatarUrl'), projectImages: f.has('imageUrl'),
        skillLevels: f.has('level'), aboutHeadline: false, skillGroupDesc: false
      }
    };
  }
  const entry = catalog.find((t) => t.id === id);
  const dir = path.join(tplRoot, id);
  if (!entry || !fs.existsSync(dir)) return null;
  let markup = '';
  for (const f of fs.readdirSync(dir)) {
    if (!/\.html?$/i.test(f)) continue;
    const html = fs.readFileSync(path.join(dir, f), 'utf-8').toLowerCase();
    markup += ` page-${f.replace(/\.html?$/, '')} `;
    markup += (html.match(/(?:id|class)="[^"]+"/g) || []).join(' ');
    markup += (html.match(/<h[1-3][^>]*>[^<]*</g) || []).join(' ');
  }
  const sections = Object.keys(HTML_SECTION_RX).filter((k) => HTML_SECTION_RX[k].test(markup) && k !== 'availability');
  return {
    id, kind: 'html', name: entry.name, category: entry.category, role: entry.role,
    sections,
    uses: {
      statusPill: HTML_SECTION_RX.availability.test(markup),
      avatar: /avatar|profile-img|hero-img|headshot/.test(markup),
      projectImages: false,
      skillLevels: false,
      aboutHeadline: sections.includes('about'),
      skillGroupDesc: /skill-card/.test(markup)
    }
  };
};

// ---------------------------------------------------------------------------
// 2. Heuristic content (used without an API key, or to fill AI gaps)
// ---------------------------------------------------------------------------
const CATEGORY_RULES = [
  ['Frontend', /react|vue|angular|svelte|next\.?js|html|css|tailwind|redux|javascript|typescript|webgl|three/i],
  ['Backend', /node|express|django|flask|fastapi|spring|graphql|rest|grpc|microservice|java\b|golang|\bgo\b|php|ruby|rails/i],
  ['Database', /sql|postgres|mysql|mongo|redis|dynamo|firebase|elastic|database/i],
  ['DevOps & Cloud', /docker|kubernetes|aws|azure|gcp|terraform|ci\/cd|linux|vercel|netlify|jenkins|github actions/i],
  ['AI & Data', /python|pytorch|tensorflow|pandas|numpy|machine learning|\bml\b|llm|nlp|data|spark|scikit/i],
  ['Design', /figma|sketch|adobe|photoshop|illustrator|ux|ui\b|prototyp|design/i]
];
const guessCategory = (name) => (CATEGORY_RULES.find(([, rx]) => rx.test(name)) || ['Tools'])[0];

const GROUP_DESC = {
  Frontend: 'Interfaces and experiences built with modern web frameworks',
  Backend: 'Server-side systems, APIs and services',
  Database: 'Data modeling, storage and query layers',
  'DevOps & Cloud': 'Deployment, infrastructure and automation',
  'AI & Data': 'Machine learning, data processing and analysis',
  Design: 'Visual design and design tools',
  Tools: 'Everyday tools and workflow'
};

const listJoin = (xs) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);

const heuristicContent = (pf, tpl, needs) => {
  const p = pf.profile || {};
  const top = (pf.experience || [])[0];
  const title = p.title || top?.role || 'Professional';
  // Split on separators with spaces around them, so "Full-Stack" stays whole.
  const shortRole = title.split(/\s+[/&|—–-]\s+|,/)[0].trim() || title;
  const topSkills = (pf.skills || []).slice(0, 4).map((s) => s.name);
  const out = { projectDescriptions: {}, skillCategories: {}, skillGroupDesc: {} };

  if (needs.bio) {
    const parts = [`${title}${top?.company ? ` at ${top.company}` : ''}.`];
    if (topSkills.length) parts.push(`I work with ${listJoin(topSkills)}.`);
    const proj = (pf.projects || []).find((x) => x.title);
    if (proj) parts.push(`Recent work includes ${proj.title}.`);
    out.bio = parts.join(' ');
  }
  if (needs.aboutHeadline) {
    out.aboutHeadline = tpl.category === 'academic'
      ? `Researcher focused on ${shortRole.toLowerCase()}`
      : tpl.category === 'creative'
        ? `${shortRole} creating work people remember`
        : `${shortRole}${top?.company ? ` at ${top.company}` : ''}, building things that work well`;
  }
  if (needs.statusPill) out.statusPill = `Open to ${shortRole} opportunities`;
  needs.projectTitles.forEach((t) => {
    const proj = (pf.projects || []).find((x) => x.title === t);
    const tech = proj?.techTags || proj?.techStack || [];
    if (tech.length) out.projectDescriptions[t] = `${t}, built with ${listJoin(tech.slice(0, 4))}.`;
  });
  if (needs.skillCategories) {
    (pf.skills || []).forEach((s) => { out.skillCategories[s.name] = guessCategory(s.name); });
  }
  if (needs.skillGroupDesc) {
    const cats = new Set(needs.skillCategories
      ? Object.values(out.skillCategories)
      : (pf.skills || []).map((s) => s.category).filter(Boolean));
    cats.forEach((c) => { out.skillGroupDesc[c] = GROUP_DESC[c] || `Skills and tools in ${String(c).toLowerCase()}`; });
  }
  return out;
};

// ---------------------------------------------------------------------------
// 3. AI content
// ---------------------------------------------------------------------------
const AiSchema = z.object({
  bio: z.string().max(600).nullable().optional(),
  aboutHeadline: z.string().max(200).nullable().optional(),
  statusPill: z.string().max(80).nullable().optional(),
  projectDescriptions: z.record(z.string(), z.string().max(400)).nullable().optional(),
  skillCategories: z.record(z.string(), z.string().max(40)).nullable().optional(),
  skillGroupDesc: z.record(z.string(), z.string().max(200)).nullable().optional()
});

const FIT_PROMPT = `You adapt a person's portfolio content to the website design they chose. You receive JSON with the design (name, role it was made for, category, sections it displays), the person's data, and "needs": the exact fields to write. Respond with ONLY JSON containing just the requested keys:
{
  "bio": string,                        // 2-3 sentence first-person hero summary, if requested
  "aboutHeadline": string,              // one-line About-page headline, if requested
  "statusPill": string,                 // short availability line (max 6 words), if requested
  "projectDescriptions": { "<project title>": string },  // 1-2 sentences each, for the listed titles
  "skillCategories": { "<skill name>": string },         // a category for every skill, if requested (use 3-6 categories)
  "skillGroupDesc": { "<category>": string }             // one short sentence per category you used, if requested
}
Rules:
1. Use ONLY facts in the person's data. Never invent employers, clients, tools, numbers, metrics, dates, awards or testimonials.
2. A project description may only use that project's title, existing description, tech stack, and facts stated elsewhere in the data.
3. Match the design's tone: academic = precise and research-minded, creative = expressive, business = crisp and outcome-focused, technology = concrete and technical.
4. No markdown, no commentary. JSON only.`;

// ---------------------------------------------------------------------------
// 4. The plan returned to the client
// ---------------------------------------------------------------------------
export const buildFitPlan = async (pf, layoutId, ctx) => {
  const tpl = profileTemplate(layoutId, ctx);
  if (!tpl) return { ok: false, message: 'Unknown design: ' + layoutId };

  const profile = pf.profile || {};
  const projects = pf.projects || [];
  const skills = pf.skills || [];
  const cats = new Set(skills.map((s) => s.category).filter((c) => c && !/^core/i.test(c)));

  const needs = {
    bio: !profile.bio || profile.bio.trim().length < 60,
    aboutHeadline: tpl.uses.aboutHeadline && !profile.aboutHeadline,
    statusPill: tpl.uses.statusPill && !profile.statusPill,
    projectTitles: tpl.sections.includes('projects')
      ? projects.filter((x) => x.title && (!x.description || x.description.trim().length < 40)).map((x) => x.title).slice(0, 8)
      : [],
    skillCategories: skills.length >= 4 && cats.size <= 1,
    skillGroupDesc: tpl.uses.skillGroupDesc && !pf.skillGroupDesc && skills.length > 0
  };

  let engine = 'heuristic';
  let content = null;
  const anyNeed = needs.bio || needs.aboutHeadline || needs.statusPill || needs.projectTitles.length || needs.skillCategories || needs.skillGroupDesc;

  if (anyNeed && process.env.ANTHROPIC_API_KEY) {
    try {
      const payload = {
        design: { name: tpl.name || tpl.id, role: tpl.role, category: tpl.category, sections: tpl.sections },
        person: {
          profile: { fullName: profile.fullName, title: profile.title, bio: profile.bio, location: profile.location },
          experience: (pf.experience || []).slice(0, 8).map((e) => ({ role: e.role, company: e.company, bullets: (e.bullets || []).slice(0, 5) })),
          projects: projects.slice(0, 10).map((x) => ({ title: x.title, description: x.description, tech: x.techTags || x.techStack || [] })),
          skills: skills.map((s) => s.name),
          education: (pf.education || []).map((e) => ({ degree: e.degree, field: e.field, institution: e.institution }))
        },
        needs
      };
      content = AiSchema.parse(await claudeJson(FIT_PROMPT, JSON.stringify(payload), 2500));
      engine = 'claude';
    } catch (err) {
      console.error('[template-fit] AI failed, using heuristics:', err.message);
    }
  }
  const fb = heuristicContent(pf, tpl, needs);
  content = content || {};

  // Everything the user entered, for the "did the AI add facts?" check.
  const userText = JSON.stringify(pf).replace(/"[a-zA-Z_]+":/g, ' ');
  const check = (text) => {
    const w = [];
    const terms = unsupportedTerms(text, userText);
    const nums = newNumbers(text, userText);
    if (terms.length) w.push(`Mentions ${terms.join(', ')}, which isn't in your details.`);
    if (nums.length) w.push(`Adds number(s) ${nums.join(', ')} not in your details.`);
    return w;
  };

  const suggestions = [];
  const pick = (key) => (typeof content[key] === 'string' && content[key].trim() ? content[key].trim() : fb[key]);

  if (needs.bio && pick('bio')) {
    const s = pick('bio');
    suggestions.push({ id: 'bio', field: 'profile.bio', label: 'Hero introduction', reason: profile.bio ? 'Your bio is very short for this design’s hero section.' : 'This design opens with an introduction and you haven’t written one.', current: profile.bio || '', suggested: s, warnings: check(s), defaultOn: true });
  }
  if (needs.aboutHeadline && pick('aboutHeadline')) {
    const s = pick('aboutHeadline');
    suggestions.push({ id: 'aboutHeadline', field: 'profile.aboutHeadline', label: 'About page headline', reason: 'This design has an About page with a headline.', current: '', suggested: s, warnings: check(s), defaultOn: true });
  }
  if (needs.statusPill && pick('statusPill')) {
    const s = pick('statusPill');
    suggestions.push({ id: 'statusPill', field: 'profile.statusPill', label: 'Availability badge', reason: 'This design shows an availability badge. Only keep it if it’s true for you.', current: '', suggested: s, warnings: [], defaultOn: false });
  }
  needs.projectTitles.forEach((t) => {
    const idx = projects.findIndex((x) => x.title === t);
    const s = (content.projectDescriptions && content.projectDescriptions[t]) || fb.projectDescriptions[t];
    if (!s) return;
    suggestions.push({ id: `project:${idx}`, field: `projects[${idx}].description`, projectIndex: idx, label: `Description for “${t}”`, reason: 'Project cards in this design show a description.', current: projects[idx].description || '', suggested: s.trim(), warnings: check(s), defaultOn: true });
  });
  if (needs.skillCategories) {
    const map = { ...fb.skillCategories, ...(content.skillCategories || {}) };
    const clean = Object.fromEntries(skills.map((s) => [s.name, map[s.name] || guessCategory(s.name)]));
    suggestions.push({ id: 'skillCategories', field: 'skills[].category', kind: 'map', label: 'Skill groups', reason: 'This design groups skills by category, and all of yours are in one group.', current: Object.fromEntries(skills.map((s) => [s.name, s.category || 'Core'])), suggested: clean, warnings: [], defaultOn: true });
  }
  if (needs.skillGroupDesc) {
    const map = { ...fb.skillGroupDesc, ...(content.skillGroupDesc || {}) };
    suggestions.push({ id: 'skillGroupDesc', field: 'skillGroupDesc', kind: 'map', label: 'Skill group descriptions', reason: 'Skill cards in this design have a one-line description.', current: {}, suggested: map, warnings: check(Object.values(map).join(' ')), defaultOn: true });
  }

  // Sections the design shows vs. what the user has
  const has = {
    about: !!(profile.bio || needs.bio),
    skills: skills.length > 0,
    projects: projects.length > 0,
    experience: (pf.experience || []).length > 0,
    education: (pf.education || []).length > 0,
    certifications: (pf.certifications || []).length > 0,
    stats: true,
    services: false,
    testimonials: false,
    publications: false
  };
  const SECTION_NOTES = {
    stats: 'Filled with honest counts from your data (projects, skills, years).',
    services: 'Not filled: we won’t invent services. Edit the site text after publishing if you offer any.',
    testimonials: 'Not filled: we never make up quotes. Demo quotes are removed.',
    publications: 'Not filled: add publications to your details if you have any.'
  };
  const coverage = tpl.sections.map((sec) => ({
    section: sec,
    status: has[sec] ? 'filled' : (sec in SECTION_NOTES ? 'not_filled' : 'missing'),
    note: SECTION_NOTES[sec] || (has[sec] ? '' : `This design has a ${sec} section, but your details have none. Add some in Build & Edit.`)
  }));

  const manual = [];
  if (tpl.uses.avatar && !profile.avatarUrl) manual.push('This design shows a profile photo. Add one in Build & Edit → Profile.');
  needs.projectTitles
    .filter((t) => !suggestions.some((s) => s.label === `Description for “${t}”`))
    .forEach((t) => manual.push(`“${t}” has no description or tech listed, so there's nothing to write from. Add a line in Build & Edit → Projects.`));
  if (tpl.uses.projectImages && projects.some((x) => !x.imageUrl)) manual.push('Project cards in this design show images. Add them in Build & Edit → Projects.');

  return { ok: true, engine, template: { id: tpl.id, kind: tpl.kind, name: tpl.name || null, category: tpl.category, role: tpl.role, sections: tpl.sections }, coverage, suggestions, manual };
};
