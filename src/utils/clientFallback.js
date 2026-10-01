// Client-side fallback parser & optimizer so resume reading / optimization
// NEVER crashes if the backend server is unreachable or fails.

import { termPresent, resumeText } from './keywords';

export const heuristicParse = (rawText) => {
  const lines = (rawText || '').split('\n').map(l => l.trim()).filter(Boolean);
  const fullText = rawText || '';

  const email = fullText.match(/[\w.+-]+@[\w-]+\.[\w.]+/)?.[0] || '';
  const phone = fullText.match(/(\+?\d[\d\s().-]{7,}\d)/)?.[0] || '';
  const location = fullText.match(/\b([A-Z][a-zA-Z.]+(?:\s[A-Z][a-zA-Z.]+)*,\s?(?:[A-Z]{2}|[A-Z][a-z]+))\b/)?.[1] || '';
  const githubUrl = fullText.match(/https?:\/\/(www\.)?github\.com\/[\w-]+/i)?.[0] || '';
  const linkedinUrl = fullText.match(/https?:\/\/(www\.)?linkedin\.com\/in\/[\w-]+/i)?.[0] || '';

  // Name heuristic: first line that doesn't look like contact info
  const nameLine = lines.find(l => 
    l.length >= 2 && l.length <= 40 && 
    !l.includes('@') && !/github|linkedin|http/i.test(l) &&
    !/\d{5,}/.test(l) && !/resume|curriculum|vitae/i.test(l)
  ) || 'Your Name';

  const cleanHeader = (l) => l.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9)]+$/g, '').replace(/^\d+[.)\s]+/, '').trim();
  const isHeader = (l, words) => {
    const c = cleanHeader(l).toLowerCase();
    return c.length < 40 && words.some(w => c === w || c.startsWith(w) || c.includes(w));
  };

  const bioIdx = lines.findIndex(l => isHeader(l, ['summary', 'objective', 'about', 'profile']));
  const experienceIdx = lines.findIndex(l => isHeader(l, ['experience', 'work experience', 'employment', 'professional experience', 'work history']));
  const projectsIdx = lines.findIndex(l => isHeader(l, ['projects', 'personal projects', 'selected projects', 'key projects']));
  const eduIdx = lines.findIndex(l => isHeader(l, ['education', 'academic', 'academics', 'education & training']));
  const skillsIdx = lines.findIndex(l => isHeader(l, ['skills', 'technical skills', 'core skills', 'skills & tools', 'technologies']));
  const certsIdx = lines.findIndex(l => isHeader(l, ['certifications', 'certificates', 'licenses & certifications', 'courses & certifications']));

  const headerIdxs = [bioIdx, experienceIdx, projectsIdx, eduIdx, skillsIdx, certsIdx].filter(i => i !== -1).sort((a, b) => a - b);
  const nextHeader = (from) => {
    const later = headerIdxs.filter(i => i > from);
    return later.length ? later[0] : lines.length;
  };

  const sectionLines = (idx) => (idx === -1 ? [] : lines.slice(idx + 1, nextHeader(idx)));

  const expLines = sectionLines(experienceIdx);
  const eduLines = sectionLines(eduIdx);
  const skillLines = sectionLines(skillsIdx);
  const projLines = sectionLines(projectsIdx);
  const certLines = sectionLines(certsIdx);
  const bioLines = sectionLines(bioIdx);

  // Parse bio / summary
  const bio = bioLines.join(' ').slice(0, 800) || '';

  // Parse experience
  const dateRangeRe = /\b(19|20)\d{2}\b|\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*(19|20)?\d{2}\b|\bpresent\b|\bcurrent\b/i;
  const experience = [];
  let currentExp = null;

  expLines.forEach((line) => {
    const isBullet = /^[-•*·>|]/.test(line);
    const hasDate = dateRangeRe.test(line);

    if (hasDate || (!isBullet && line.length < 80 && (!currentExp || currentExp.bullets.length > 0))) {
      const cleanLine = line.replace(/^[-•*·>\s]+/, '').trim();
      const parts = cleanLine.split(/\s+[—–|@-]\s+/);
      const role = parts[0] || cleanLine;
      const company = parts[1] || '';
      
      const startMatch = line.match(/\b(19|20)\d{2}\b/g);
      const startDate = startMatch ? startMatch[0] : '';
      const isCurrent = /present|current/i.test(line);
      const endDate = isCurrent ? 'Present' : (startMatch && startMatch[1] ? startMatch[1] : '');

      currentExp = {
        role,
        company,
        startDate,
        endDate,
        isCurrent,
        bullets: []
      };
      experience.push(currentExp);
    } else if (currentExp) {
      const bulletText = line.replace(/^[-•*·>\s]+/, '').trim();
      if (bulletText) currentExp.bullets.push(bulletText);
    }
  });

  // If no experience entry was extracted, build a fallback entry if expLines has content
  if (experience.length === 0 && expLines.length > 0) {
    experience.push({
      role: 'Position',
      company: 'Company',
      startDate: '',
      endDate: '',
      isCurrent: false,
      bullets: expLines.slice(0, 10).map(l => l.replace(/^[-•*·>\s]+/, '').trim()).filter(Boolean)
    });
  }

  // Parse skills
  const rawSkillsText = skillLines.join(' ');
  const skills = rawSkillsText
    .split(/[,•·|\n]/)
    .map(s => s.replace(/^[-*\s]+/, '').trim())
    .filter(s => s.length >= 2 && s.length <= 40 && !/^(skills|tools|technologies)$/i.test(s))
    .slice(0, 30)
    .map(name => ({ name, category: 'Core' }));

  // Parse education
  const education = [];
  eduLines.forEach((line) => {
    if (line.length >= 5) {
      const degMatch = line.match(/(bachelor|master|phd|b\.s|m\.s|b\.a|m\.a|b\.tech|m\.tech|degree|diploma)/i)?.[0] || 'Degree';
      education.push({
        institution: line.replace(/^[-•*·>\s]+/, '').trim(),
        degree: degMatch,
        field: '',
        startDate: '',
        endDate: ''
      });
    }
  });

  // Parse projects
  const projects = [];
  projLines.forEach((line) => {
    if (/^[-•*·>]/.test(line) || line.length < 60) {
      projects.push({
        title: line.replace(/^[-•*·>\s]+/, '').trim(),
        description: '',
        techStack: []
      });
    }
  });

  // Parse certifications
  const certifications = certLines.map(l => ({
    name: l.replace(/^[-•*·>\s]+/, '').trim(),
    issuer: '',
    date: ''
  })).filter(c => c.name.length >= 3);

  return {
    profile: {
      fullName: nameLine,
      title: experience[0]?.role || '',
      email,
      phone,
      location,
      githubUrl,
      linkedinUrl,
      websiteUrl: '',
      bio
    },
    experience: experience.slice(0, 10),
    education: education.slice(0, 5),
    skills,
    projects: projects.slice(0, 8),
    certifications: certifications.slice(0, 5)
  };
};

// Heuristic optimizer fallback when backend AI is unreachable
export const heuristicOptimize = (resume = {}, jobDescription = '') => {
  const jd = (jobDescription || '').slice(0, 12000).trim();
  const text = resumeText(resume);

  // Extract candidate keywords from job description
  const words = jd.split(/\s+/).map(w => w.replace(/^[^a-zA-Z0-9+#.]+|[^a-zA-Z0-9+#.]+$/g, '')).filter(Boolean);
  const freq = new Map();
  const STOP = new Set(['and', 'the', 'for', 'with', 'you', 'your', 'are', 'our', 'this', 'that', 'will', 'have', 'from', 'must', 'work', 'team', 'skills', 'experience', 'role', 'about', 'join', 'help', 'building', 'create', 'using']);

  words.forEach(w => {
    if (w.length >= 3 && !STOP.has(w.toLowerCase())) {
      const key = w.toLowerCase();
      freq.set(key, (freq.get(key) || 0) + 1);
    }
  });

  const sortedTerms = [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([term, count]) => ({
      term: words.find(w => w.toLowerCase() === term) || term,
      importance: count >= 3 ? 'high' : count === 2 ? 'medium' : 'low',
      inResume: termPresent(term, text),
      where: termPresent(term, text) ? ['experience'] : []
    }));

  const WEIGHT = { high: 3, medium: 2, low: 1 };
  const totalWeight = sortedTerms.reduce((s, k) => s + WEIGHT[k.importance], 0);
  const matchedWeight = sortedTerms.reduce((s, k) => s + (k.inResume ? WEIGHT[k.importance] : 0), 0);
  const scoreBefore = totalWeight ? Math.round((matchedWeight / totalWeight) * 100) : 50;

  const suggestions = sortedTerms.map((k, idx) => ({
    id: `sug-${idx}`,
    type: 'add_skill',
    term: k.term,
    label: `Add ${k.term} to Skills`,
    reason: k.inResume ? `Already mentioned in your experience` : `Listed in job requirements (${k.importance} priority)`,
    source: k.inResume ? 'found' : 'missing',
    defaultOn: k.inResume
  }));

  return {
    ok: true,
    engine: 'heuristic',
    scoreBefore,
    keywords: sortedTerms,
    suggestions
  };
};
