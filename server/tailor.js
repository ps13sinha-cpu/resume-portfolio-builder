// Job-description tailoring for the "Build tailored resume" entry path.
// Two operations, both suggestion-only (the UI shows them for approval,
// nothing is applied silently):
//   analyzeJobFit — which JD requirements the candidate's input reflects,
//                   plus a suggested bio built only from their own facts
//   tailorBullet  — reframe one experience bullet toward the JD
// Claude when ANTHROPIC_API_KEY is set, keyword heuristics otherwise. Every
// AI output is checked for skills or numbers that aren't in the candidate's
// input, and anything suspicious is returned as a warning rather than hidden.
import { z } from 'zod';
import { claudeJson } from './claude.js';

// Skill / requirement vocabulary used by the heuristic path and by the
// "did the AI add something new?" guard. Matched case-insensitively on word
// bounds; the casing here is what the UI shows. Words that are also common
// English ("go", "rest", "r") are deliberately left out.
const VOCAB = [
  // languages
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Golang', 'Rust', 'Ruby', 'PHP', 'Kotlin', 'Swift', 'Scala', 'SQL',
  // frontend
  'React', 'Next.js', 'Vue', 'Angular', 'Svelte', 'HTML', 'CSS', 'Tailwind', 'Redux', 'WebGL', 'Three.js', 'accessibility',
  // backend / data
  'Node.js', 'Express', 'Django', 'Flask', 'FastAPI', 'Spring', 'GraphQL', 'REST API', 'gRPC', 'microservices', 'distributed systems',
  'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Kafka', 'Elasticsearch', 'DynamoDB', 'data pipelines', 'ETL', 'Spark', 'Airflow',
  // cloud / ops
  'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Terraform', 'CI/CD', 'Linux', 'serverless', 'observability', 'security',
  // ml
  'machine learning', 'deep learning', 'PyTorch', 'TensorFlow', 'LLM', 'NLP', 'computer vision', 'MLOps', 'RAG',
  // design / product
  'Figma', 'UX', 'UI design', 'user research', 'prototyping', 'design systems', 'product management', 'A/B testing', 'analytics',
  // practices / soft
  'system design', 'testing', 'unit testing', 'Agile', 'Scrum', 'leadership', 'mentoring', 'communication', 'stakeholder management',
  'cross-functional', 'performance optimization', 'scalability', 'code review'
];

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// Plain lowercase words also match other forms of the same word
// ("mentoring" ↔ "mentored", "accessibility" ↔ "accessible"); product
// names (capitalised in VOCAB) match exactly.
const stem = (t) => t.replace(/(ibility|ability|ility|ing|ship|ment|ed|es|s)$/, '');
export const termRe = (t) => {
  const single = /^[a-z]+$/.test(t) && stem(t).length >= 5;
  const body = single ? `${escapeRe(stem(t))}[a-z]*` : escapeRe(t);
  return new RegExp(`(^|[^a-z0-9+#.])${body}(?=$|[^a-z0-9+#])`, 'i');
};
export const vocabIn = (text) => VOCAB.filter((t) => termRe(t).test(text));

const clip = (s, n) => String(s ?? '').slice(0, n);

// Flatten the candidate input into text blobs per section (for evidence).
const candidateBlobs = (c) => ({
  profile: [c.profile?.title, c.profile?.bio].filter(Boolean).join(' '),
  experience: (c.experience || []).map((e) => [e.role, e.company, ...(e.bullets || [])].join(' ')).join(' '),
  skills: (c.skills || []).map((s) => s.name).join(', '),
  projects: (c.projects || []).map((p) => [p.title, p.description, ...(p.techStack || [])].join(' ')).join(' '),
  education: (c.education || []).map((e) => [e.degree, e.field, e.institution].join(' ')).join(' '),
  certifications: (c.certifications || []).map((x) => [x.name, x.issuer].join(' ')).join(' ')
});

// Trim and cap everything that goes to the model or back to the client.
export const sanitizeCandidate = (raw = {}) => ({
  profile: {
    fullName: clip(raw.profile?.fullName, 120),
    title: clip(raw.profile?.title, 160),
    bio: clip(raw.profile?.bio, 1500)
  },
  experience: (raw.experience || []).slice(0, 15).map((e) => ({
    company: clip(e.company, 200),
    role: clip(e.role, 200),
    bullets: (e.bullets || []).filter(Boolean).slice(0, 12).map((b) => clip(b, 600))
  })),
  skills: (raw.skills || []).slice(0, 60).map((s) => ({ name: clip(s.name, 80), category: clip(s.category, 60) })),
  projects: (raw.projects || []).slice(0, 12).map((p) => ({
    title: clip(p.title, 200),
    description: clip(p.description, 1200),
    techStack: (p.techStack || []).slice(0, 15).map((t) => clip(t, 60))
  })),
  education: (raw.education || []).slice(0, 10).map((e) => ({
    institution: clip(e.institution, 200), degree: clip(e.degree, 200), field: clip(e.field, 200)
  })),
  certifications: (raw.certifications || []).slice(0, 15).map((x) => ({ name: clip(x.name, 240), issuer: clip(x.issuer, 160) }))
});

// Terms the AI wrote that exist in the JD vocabulary but nowhere in the
// candidate's own input — i.e. likely invented.
export const unsupportedTerms = (generated, candidateText) =>
  vocabIn(generated).filter((t) => !termRe(t).test(candidateText));

export const newNumbers = (generated, sourceText) => {
  const src = new Set(sourceText.match(/\d+(?:[.,]\d+)?/g) || []);
  return [...new Set((generated.match(/\d+(?:[.,]\d+)?/g) || []).filter((n) => !src.has(n)))];
};

// ---------------------------------------------------------------------------
// analyzeJobFit
// ---------------------------------------------------------------------------
const FitSchema = z.object({
  requirements: z.array(z.object({
    requirement: z.string().max(160),
    status: z.enum(['met', 'partial', 'missing']),
    evidence: z.string().max(300).nullable().optional()
  })).max(20),
  suggestedBio: z.string().max(600)
});

const FIT_SYSTEM_PROMPT = `Given a job description and a candidate's entered experience and skills, respond with ONLY JSON:
{
  "requirements": [{ "requirement": string, "status": "met" | "partial" | "missing", "evidence": string | null }],
  "suggestedBio": string
}
(a) "requirements": the job description's 5-12 most important requirements. For each, say whether the candidate's input reflects it ("met"), reflects it only loosely ("partial"), or does not mention it ("missing"). "evidence" quotes or names the part of the candidate's input that supports it, or null when missing.
(b) "suggestedBio": a tailored 2-3 sentence first-person bio emphasizing the candidate's strengths most relevant to this role.
Rules: use ONLY facts the candidate entered. Do not invent experience, skills, employers, numbers or years. Do not claim a "missing" requirement in the bio. No markdown, no commentary — JSON only.`;

const listJoin = (xs) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);

const heuristicFit = (cand, jd) => {
  const blobs = candidateBlobs(cand);
  const jdTerms = vocabIn(jd).slice(0, 14);
  const requirements = jdTerms.map((term) => {
    const where = Object.entries(blobs).filter(([, text]) => termRe(term).test(text)).map(([k]) => k);
    return {
      requirement: term,
      status: where.length ? 'met' : 'missing',
      evidence: where.length ? `Mentioned in your ${where.join(', ')}` : null
    };
  });

  const met = requirements.filter((r) => r.status === 'met').map((r) => r.requirement);
  const top = (cand.experience || []).find((e) => e.role || e.company);
  const title = cand.profile?.title || top?.role || 'Professional';
  const article = /^[aeiou]/i.test(title) ? 'an' : 'a';
  const parts = [`I'm ${article} ${title}${top?.company ? `, most recently at ${top.company}` : ''}.`];
  if (met.length) parts.push(`My work centers on ${listJoin(met.slice(0, 4))}.`);
  const proj = (cand.projects || []).find((p) => p.title);
  if (proj) parts.push(`Recent work includes ${proj.title}.`);
  return { requirements, suggestedBio: parts.join(' ') };
};

export const analyzeJobFit = async (rawCandidate, rawJd) => {
  const cand = sanitizeCandidate(rawCandidate);
  const jd = clip(rawJd, 12000);
  const candText = Object.values(candidateBlobs(cand)).join(' ');

  let engine = 'heuristic';
  let result = null;
  const warnings = [];

  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const raw = await claudeJson(
        FIT_SYSTEM_PROMPT,
        `Job description:\n${jd}\n\nCandidate input (JSON):\n${JSON.stringify(cand)}`,
        2000
      );
      result = FitSchema.parse(raw);
      engine = 'claude';
    } catch (err) {
      console.error('[tailor] fit analysis via Claude failed, using heuristics:', err.message);
    }
  }
  if (!result) {
    result = heuristicFit(cand, jd);
    if (!result.requirements.length) {
      warnings.push("Couldn't pick out specific skills from this job description. Try pasting the full requirements section.");
    }
  }

  const invented = unsupportedTerms(result.suggestedBio, candText);
  if (invented.length) warnings.push(`The suggested bio mentions ${invented.join(', ')}, which isn't in your details. Edit it out or add it to your details if it's true.`);

  return { ok: true, engine, ...result, warnings };
};

// ---------------------------------------------------------------------------
// tailorBullet
// ---------------------------------------------------------------------------
const BulletSchema = z.object({ tailored: z.string().min(1).max(600) });

const BULLET_SYSTEM_PROMPT = `Rewrite one resume bullet so its emphasis matches the job description. Respond with ONLY JSON: { "tailored": string }.
Rules: keep every fact exactly as given — same employer, scope, tools and numbers. Do not add tools, metrics, outcomes or responsibilities that aren't in the original bullet. You may reorder, lead with the most relevant part, and use the job description's terminology for things the bullet already describes. One sentence, under 220 characters. No markdown.`;

export const tailorBullet = async ({ bullet, jobDescription, role }) => {
  const original = clip(bullet, 600).trim();
  if (!original) return { ok: false, message: 'Bullet text required' };
  if (!process.env.ANTHROPIC_API_KEY) {
    return { ok: false, message: 'Bullet tailoring needs AI (ANTHROPIC_API_KEY is not set on the server). Your bullet is unchanged.' };
  }
  try {
    const raw = await claudeJson(
      BULLET_SYSTEM_PROMPT,
      `Job description:\n${clip(jobDescription, 8000)}\n\nRole held: ${clip(role, 200)}\n\nOriginal bullet: "${original}"`,
      400
    );
    const { tailored } = BulletSchema.parse(raw);
    const warnings = [];
    const invented = unsupportedTerms(tailored, original);
    const nums = newNumbers(tailored, original);
    if (invented.length) warnings.push(`Adds ${invented.join(', ')}, which the original doesn't mention.`);
    if (nums.length) warnings.push(`Adds number(s) ${nums.join(', ')} not in the original.`);
    return { ok: true, engine: 'claude', original, tailored: tailored.trim(), warnings };
  } catch (err) {
    console.error('[tailor] bullet via Claude failed:', err.message);
    return { ok: false, message: 'AI tailoring failed. Your bullet is unchanged.' };
  }
};
