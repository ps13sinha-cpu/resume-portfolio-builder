// Client-side keyword matching, mirroring server/tailor.js termRe so the
// optimizer's match score can be recomputed live as the user toggles changes.

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const stem = (t) => t.replace(/(ibility|ability|ility|ing|ship|ment|ed|es|s)$/, '');

export const termPresent = (term, text) => {
  const single = /^[a-z]+$/.test(term) && stem(term).length >= 5;
  const body = single ? `${escapeRe(stem(term))}[a-z]*` : escapeRe(term);
  return new RegExp(`(^|[^a-z0-9+#.])${body}(?=$|[^a-z0-9+#])`, 'i').test(text);
};

const WEIGHT = { high: 3, medium: 2, low: 1 };

// ATS-style match (same rule as server/optimizer.js scoreKeywords):
// importance-weighted coverage; full credit when the keyword is in Skills or
// the summary, 60% when it only appears in the body of the resume.
export const keywordScore = (keywords, resume) => {
  const strongText = [resume.profile?.title, resume.profile?.bio, ...(resume.skills || []).map((s) => s.name)].filter(Boolean).join(' | ');
  const fullText = resumeText(resume);
  const total = keywords.reduce((s, k) => s + WEIGHT[k.importance], 0);
  const have = keywords.reduce((s, k) => {
    if (termPresent(k.term, strongText)) return s + WEIGHT[k.importance];
    if (termPresent(k.term, fullText)) return s + WEIGHT[k.importance] * 0.6;
    return s;
  }, 0);
  return total ? Math.round((have / total) * 100) : 0;
};

// Canonical resume → one text blob (what an ATS would read).
export const resumeText = (r = {}) => [
  r.profile?.title, r.profile?.bio,
  ...(r.experience || []).flatMap((e) => [e.role, e.company, ...(e.bullets || [])]),
  ...(r.skills || []).map((s) => s.name),
  ...(r.projects || []).flatMap((p) => [p.title, p.description, ...(p.techStack || [])]),
  ...(r.education || []).flatMap((e) => [e.degree, e.field, e.institution]),
  ...(r.certifications || []).map((c) => c.name)
].filter(Boolean).join(' \n ');
