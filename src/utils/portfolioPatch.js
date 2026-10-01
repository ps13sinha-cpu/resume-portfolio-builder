// Maps canonical-shaped section data (the resume extraction output, or the
// tailored intake form) onto the builder's portfolio model that every theme
// consumes. Shared by both post-login entry paths so they commit identically.
export const canonicalToPortfolioPatch = (reviewed) => {
  const p = reviewed.profile || {};
  return {
    profile: {
      fullName: p.fullName || '',
      title: p.title || '',
      email: p.email || '',
      phone: p.phone || '',
      location: p.location || '',
      github: p.githubUrl || '',
      linkedin: p.linkedinUrl || '',
      website: p.websiteUrl || '',
      bio: p.bio || '',
      statusPill: ''
    },
    experience: (reviewed.experience || []).map((j, i) => ({
      id: `exp-${Date.now()}-${i}`,
      company: j.company || '',
      role: j.role || '',
      start: j.startDate || '',
      end: j.endDate || (j.isCurrent ? 'Present' : ''),
      isCurrent: !!j.isCurrent,
      location: '',
      bullets: (j.bullets || []).filter(Boolean),
      order_index: i
    })),
    education: (reviewed.education || []).map((ed, i) => ({
      id: `edu-${Date.now()}-${i}`,
      institution: ed.institution || '',
      degree: ed.degree || '',
      field: ed.field || '',
      start: ed.startDate || '',
      end: ed.endDate || '',
      grade: ed.grade || '',
      description: '',
      order_index: i
    })),
    skills: (reviewed.skills || []).map((s, i) => ({
      id: `sk-${Date.now()}-${i}`,
      name: s.name,
      category: s.category || 'Core',
      level: 80,
      order_index: i
    })),
    projects: (reviewed.projects || []).map((pr, i) => ({
      id: `proj-${Date.now()}-${i}`,
      title: pr.title,
      description: pr.description || '',
      techTags: pr.techStack || [],
      liveUrl: pr.liveUrl || '',
      githubUrl: pr.githubUrl || '',
      imageUrl: '',
      featured: i < 2,
      order_index: i
    })),
    certifications: (reviewed.certifications || []).map((c, i) => ({
      id: `cert-${Date.now()}-${i}`,
      name: c.name,
      issuer: c.issuer || '',
      date: c.date || '',
      credentialUrl: c.credentialUrl || '',
      order_index: i
    }))
  };
};

// The reverse: builder portfolio → canonical sections. Lets the optimizer
// work on the resume already saved in the account.
export const portfolioToCanonical = (pf = {}) => {
  const p = pf.profile || {};
  return {
    profile: {
      fullName: p.fullName || '', title: p.title || '', email: p.email || '', phone: p.phone || '',
      location: p.location || '', githubUrl: p.github || '', linkedinUrl: p.linkedin || '',
      websiteUrl: p.website || '', bio: p.bio || ''
    },
    experience: (pf.experience || []).map((e) => ({
      company: e.company || '', role: e.role || '', startDate: e.start || '',
      endDate: /present/i.test(e.end || '') ? '' : (e.end || ''), isCurrent: !!e.isCurrent || /present/i.test(e.end || ''),
      bullets: [...(e.bullets || [])]
    })),
    education: (pf.education || []).map((e) => ({
      institution: e.institution || '', degree: e.degree || '', field: e.field || '',
      startDate: e.start || '', endDate: e.end || '', grade: e.grade || ''
    })),
    skills: (pf.skills || []).map((s) => ({ name: s.name, category: s.category || '' })),
    projects: (pf.projects || []).map((pr) => ({
      title: pr.title || '', description: pr.description || '', techStack: [...(pr.techTags || pr.techStack || [])],
      liveUrl: pr.liveUrl || '', githubUrl: pr.githubUrl || ''
    })),
    certifications: (pf.certifications || []).map((c) => ({ name: c.name || '', issuer: c.issuer || '', date: c.date || '', credentialUrl: c.credentialUrl || '' }))
  };
};
