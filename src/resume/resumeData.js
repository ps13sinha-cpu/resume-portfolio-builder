// Normalizes the builder's portfolio object into what every resume design
// needs, so each design only deals with layout. Plain text only — no icons
// carry meaning — so exported PDFs stay readable by applicant-tracking systems.

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// "2023-01" → "Jan 2023"; anything else (e.g. "Jan 2023", "2019") is kept.
export const fmtDate = (d) => {
  const m = String(d || '').trim().match(/^(\d{4})-(\d{1,2})$/);
  return m ? `${MONTHS[Number(m[2]) - 1] || ''} ${m[1]}`.trim() : String(d || '').trim();
};

export const fmtRange = (start, end, isCurrent) => {
  const s = fmtDate(start);
  const e = isCurrent || /present|current/i.test(end || '') ? 'Present' : fmtDate(end);
  return [s, e].filter(Boolean).join(' – ');
};

const stripUrl = (u) => String(u || '').replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');

export const resumeData = (portfolio = {}) => {
  const p = portfolio.profile || {};
  const byCat = new Map();
  (portfolio.skills || []).forEach((s) => {
    const cat = s.category && !/^core$/i.test(s.category) ? s.category : 'Skills';
    if (!byCat.has(cat)) byCat.set(cat, []);
    byCat.get(cat).push(s.name);
  });

  return {
    name: p.fullName || 'Your Name',
    title: p.title || '',
    summary: p.bio || '',
    initials: (p.fullName || 'Y N').split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase(),
    contacts: [
      p.email && { label: 'Email', text: p.email, href: `mailto:${p.email}` },
      p.phone && { label: 'Phone', text: p.phone, href: `tel:${p.phone}` },
      p.location && { label: 'Location', text: p.location },
      p.website && { label: 'Website', text: stripUrl(p.website), href: p.website },
      p.linkedin && { label: 'LinkedIn', text: stripUrl(p.linkedin), href: p.linkedin },
      p.github && { label: 'GitHub', text: stripUrl(p.github), href: p.github }
    ].filter(Boolean),
    experience: (portfolio.experience || []).map((e) => ({
      role: e.role || '',
      company: e.company || '',
      location: e.location || '',
      dates: fmtRange(e.start, e.end, e.isCurrent),
      bullets: (e.bullets || []).filter(Boolean)
    })),
    education: (portfolio.education || []).map((e) => ({
      degree: [e.degree, e.field].filter(Boolean).join(', '),
      institution: e.institution || '',
      dates: fmtRange(e.start, e.end),
      grade: e.grade || ''
    })),
    skillGroups: [...byCat.entries()],
    allSkills: (portfolio.skills || []).map((s) => s.name),
    projects: (portfolio.projects || []).map((pr) => ({
      title: pr.title || '',
      description: pr.description || '',
      tech: pr.techTags || pr.techStack || [],
      link: pr.liveUrl || pr.githubUrl || ''
    })),
    certifications: (portfolio.certifications || []).map((c) => ({
      name: c.name || '',
      issuer: c.issuer || '',
      date: fmtDate(c.date)
    }))
  };
};
