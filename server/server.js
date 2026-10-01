import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { samplePortfolios } from './data/samplePortfolio.js';
import { z } from 'zod';

// =====================================================================
// HTML TEMPLATE LIBRARY (PortfolioBuilder showcase, 229 multi-page
// HTML/CSS/JS templates shipped in /public/portfolio-templates).
// The injection endpoint rewrites the demo "John Doe" content with the
// user's real resume data and returns a zip-less file map the client
// can preview in an iframe (srcdoc/blob) or download.
// =====================================================================
const __dirnameBase = path.dirname(fileURLToPath(import.meta.url));
const TPL_ROOT = path.join(__dirnameBase, '..', 'public', 'portfolio-templates');
const TPL_CATALOG = (() => {
  try {
    return JSON.parse(fs.readFileSync(path.join(TPL_ROOT, 'catalog.json'), 'utf-8'));
  } catch {
    return [];
  }
})();

const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

// Build the placeholder set from a portfolio object
// ============================================================================
// DEEP CONTENT INJECTION — fills every list-shaped section of a template
// (skills, projects, experience timeline, education, publications, contact)
// with the user's real resume data. Blocks are duplicated/trimmed so every
// template pattern holds the user's actual content, whatever its markup.
// ============================================================================
const dedupe = (arr) => [...new Set(arr.filter(Boolean))];
const clamp = (arr, max) => arr.slice(0, max);

// A blurb for a card that only carries a title (some minimal templates) —
// derive one line of prose from bullets/description instead of demo text.
const firstBullet = (item, max = 180) => {
  const b = (item.bullets || []).find(Boolean) || item.description || item.summary || '';
  return String(b).slice(0, max);
};

const experienceRange = (e) => {
  const s = e.startDate || e.start || '';
  const en = e.endDate || e.end || (e.isCurrent ? 'Present' : '');
  if (!s && !en) return '';
  return [s, en].filter(Boolean).join(' — ').replace(/\b\d{4}-\d{2}\b/g, (ym) => {
    const [y, m] = ym.split('-');
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${months[Number(m) - 1] || ''} ${y}`.trim();
  });
};

const educationRange = (ed) => {
  const s = ed.startDate || ed.start || '';
  const en = ed.endDate || ed.end || '';
  return [s, en].filter(Boolean).join(' — ');
};

// --- Block generators: produce the inner HTML of one list item, matching the
// --- template's own markup shape (passed in as a class-map).
const GEN = {
  skillCard: (g) => `<div class="skill-card reveal active">
          <div class="skill-icon">⚡</div>
          <h3>${esc(g.category)}</h3>
          <p>${esc(g.desc || `Skills & technologies in ${String(g.category).toLowerCase()}`)}</p>
          <div class="skill-tags">${g.items.map(s => `<span>${esc(s)}</span>`).join('')}</div>
        </div>`,
  projectCard: (p, emojiPool, i) => {
    const grad = `linear-gradient(135deg, hsl(${(i * 72) % 360} 45% 16%), hsl(${(i * 72 + 40) % 360} 40% 26%))`;
    return `<div class="project-card reveal active">
          <div class="project-image" style="background: ${grad}; display:flex; align-items:center; justify-content:center; font-size: 3rem;">${emojiPool[i % emojiPool.length]}</div>
          <div class="project-info">
            <div class="project-tags">${p.techTags.map(t => `<span>${esc(t)}</span>`).join('')}</div>
            <h3>${esc(p.title)}</h3>
            <p>${esc(p.description)}</p>
          </div>
        </div>`;
  },
  // Shape-flexible project card for wrappers like .grid-3 with .project-card
  // items that use .project-tag + h3 + p (+ optional .link anchor).
  projectCardShape: (opts, p, emojiPool, i) => {
    void emojiPool; void i;
    return `<div class="${opts.cls}${opts.extra || ''}">
          <div class="project-tag">${esc(p.techTags[0] || 'Project')}</div>
          <h3>${esc(p.title)}</h3>
          <p>${esc(p.description)}</p>
          ${p.liveUrl || p.githubUrl ? `<a href="${esc(p.liveUrl || p.githubUrl)}" class="link">View Project →</a>` : ''}
        </div>`;
  },
  timelineItem: (e) => `<div class="timeline-item reveal active">
          <span class="date">${esc(e.range)}</span>
          <h3>${esc(e.role)}</h3>
          <span class="company">${esc(e.company)}</span>
          <p>${esc(e.text)}</p>
        </div>`,
  genericCard: (title, text, tags) => `<div class="card">
          <h3>${esc(title)}</h3>
          <p>${esc(text)}</p>
          ${tags && tags.length ? `<div class="tech">${tags.join(' • ')}</div>` : ''}
        </div>`
};

// Group flat skills [{name, category?}] into N themed groups for .skill-card grids
const groupSkills = (skills, nGroups) => {
  const byCat = {};
  skills.forEach((s) => {
    const cat = s.category || 'Core Skills';
    (byCat[cat] = byCat[cat] || []).push(s.name);
  });
  let cats = Object.entries(byCat).map(([category, items]) => ({ category, items }));
  if (cats.length === 0) return [];
  // Merge into at most nGroups buckets (keep most populated first)
  cats.sort((a, b) => b.items.length - a.items.length);
  while (cats.length > nGroups) {
    const last = cats.pop();
    cats[cats.length - 1].items = dedupe([...cats[cats.length - 1].items, ...last.items]);
  }
  // If only one bucket and multiple groups wanted, split it
  while (cats.length < nGroups && cats.length > 0) {
    const biggest = cats.reduce((a, b) => (b.items.length > a.items.length ? b : a), cats[0]);
    if (biggest.items.length < 4) break;
    const half = Math.ceil(biggest.items.length / 2);
    const take = biggest.items.slice(0, half);
    biggest.items = biggest.items.slice(half);
    cats.push({ category: 'Additional Skills', items: take });
  }
  return cats.filter(c => c.items.length);
};

const EMOJIS = ['📊', '🤖', '🛒', '🚀', '🎨', '🧩', '📈', '🛰️', '🧠', '⚙️', '🌐', '💾'];

// Normalized resume lists (accepts both sample-portfolio and parsed-resume shapes)
const resumeLists = (pf) => {
  const profile = pf.profile || {};
  const skillsFlat = (pf.skills || []).map(s => ({ name: typeof s === 'string' ? s : s.name, category: typeof s === 'string' ? null : (s.category || null) })).filter(s => s.name);
  const lists = {
    skillsFlat,
    skills: groupSkills(skillsFlat, 6),
    projects: (pf.projects || []).map(p => ({
      title: p.title || 'Untitled Project',
      description: p.description || firstBullet(p),
      techTags: p.techTags || p.techStack || []
    })),
    experience: (pf.experience || []).map(e => ({
      role: e.role || 'Professional',
      company: e.company || '',
      range: experienceRange(e),
      text: (e.bullets || []).filter(Boolean).slice(0, 2).join(' ') || firstBullet(e, 240) || e.description || ''
    })),
    education: (pf.education || []).map(ed => ({
      degree: [ed.degree, ed.field].filter(Boolean).join(' — ') || ed.institution || 'Education',
      institution: ed.institution || '',
      range: educationRange(ed),
      text: [ed.grade ? `Grade: ${ed.grade}` : '', ed.description || firstBullet(ed)].filter(Boolean).join('. ')
    })),
    certifications: (pf.certifications || []).map(c => ({ name: c.name, issuer: c.issuer || '', date: c.date || '' })),
    profile,
    // Approved in the template-fit step; enrichment must not overwrite these.
    aiAboutHeadline: profile.aboutHeadline || undefined
  };
  if (pf.skillGroupDesc) lists.skills.forEach(g => { if (pf.skillGroupDesc[g.category]) g.desc = pf.skillGroupDesc[g.category]; });
  return lists;
};

// Walk outward from a position to the innermost enclosing <div> block that
// contains multiple similar child cards (or at least one) — used to rebuild
// card lists whose wrapper class is unknown.
const findParentDivRange = (html, pos) => {
  // Scan backwards for the nearest opening <div…> before pos
  let start = -1;
  const revRe = /<div\b[^>]*>/g;
  let m;
  while ((m = revRe.exec(html)) !== null) {
    if (m.index >= pos) break;
    start = m.index;
  }
  if (start === -1) return null;
  // Balance from that opener
  const openEnd = html.indexOf('>', start) + 1;
  let depth = 1;
  const tagRe = /<\/div>|<div\b/g;
  tagRe.lastIndex = openEnd;
  while ((m = tagRe.exec(html)) !== null) {
    depth += m[0] === '</div>' ? -1 : 1;
    if (depth === 0) {
      return { openStart: start, openEnd, closeStart: m.index, closeEnd: m.index + m[0].length, inner: html.slice(openEnd, m.index) };
    }
  }
  return null;
};

// Locate the balanced range of a <div> container whose opening tag matches
// openRe. Handles arbitrarily nested children — unlike lazy regexes, which
// stop at the first nested </div>. Returns null when not found/unbalanced.
const findDivRange = (html, openRe) => {
  const openMatch = html.match(openRe);
  if (!openMatch) return null;
  const openStart = openMatch.index;
  const openEnd = openStart + openMatch[0].length;
  let depth = 1;
  const tagRe = /<\/div>|<div\b/g;
  tagRe.lastIndex = openEnd;
  let m;
  while ((m = tagRe.exec(html)) !== null) {
    depth += m[0] === '</div>' ? -1 : 1;
    if (depth === 0) {
      return { openStart, openEnd, closeStart: m.index, closeEnd: m.index + m[0].length, inner: html.slice(openEnd, m.index) };
    }
  }
  return null;
};

// Replace the inner content of a located container range.
const replaceInner = (html, range, newInner) =>
  html.slice(0, range.openEnd) + '\n' + newInner + '\n' + html.slice(range.closeStart);

// Deep-inject list content into one HTML document.
const injectDeepContent = (html, lists, page = '') => {
  let out = html;
  const { skills, skillsFlat, projects, experience, education, certifications } = lists;

  // ------------------------------------------------------------------
  // 1. SKILLS — class-based: .skill-card groups w/ .skill-tags, and plain
  //    <ul class="skills..."> lists.
  // ------------------------------------------------------------------
  if (skills.length) {
    // 1a. .skill-card grids (category + description + tag spans)
    const grid = findDivRange(out, /<div[^>]*class="[^"]*skills-grid[^"]*"[^>]*>/i);
    if (grid && grid.inner.includes('skill-card')) {
      const nCards = Math.min((grid.inner.match(/class="[^"]*skill-card/g) || []).length, 6) || 3;
      const groups = clamp(skills, nCards);
      if (groups.length) {
        out = replaceInner(out, grid, groups.map(g => GEN.skillCard(g)).join('\n'));
      }
    }
    // 1b. Skill chips inside .chips / .tags / generic <ul> lists
    const chipHtml = clamp(skillsFlat, 14).map(s => `<span>${esc(s.name)}</span>`).join('');
    out = out.replace(/(<div[^>]*class="[^"]*chips[^"]*"[^>]*>)([\s\S]*?)(<\/div>)/i, (m, a, inner, z) => inner.includes('<span') ? a + chipHtml + z : m);
    const listHtml = clamp(skillsFlat, 14).map(s => `<li>${esc(s.name)}</li>`).join('');
    out = out.replace(/(<ul[^>]*class="[^"]*(?:skills-list|skills|tech-list|technologies)[^"]*"[^>]*>)([\s\S]*?)(<\/ul>)/gi,
      (m, a, inner, z) => a + listHtml + z);
  }

  // ------------------------------------------------------------------
  // 2. PROJECTS — .project-card grids (featured) and .card grids in
  //    generic/academic templates. Grid wrappers vary (projects-grid,
  //    grid, grid-3, grid-2): try each shape until one holds cards.
  // ------------------------------------------------------------------
  if (projects.length) {
    const projGrid = findDivRange(out, /<div[^>]*class="[^"]*projects-grid[^"]*"[^>]*>/i);
    if (projGrid && projGrid.inner.includes('project-card')) {
      out = replaceInner(out, projGrid, clamp(projects, 9).map((p, i) => GEN.projectCard(p, EMOJIS, i)).join('\n'));
    } else {
      // Any container whose direct children are .project-card (student-campus:
      // <div class="grid-3"><div class="project-card animate-on-scroll">…)
      const anyPC = out.match(/<div[^>]*class="[^"]*project-card[^"]*"[^>]*>/i);
      if (anyPC) {
        const parent = findParentDivRange(out, anyPC.index);
        if (parent) {
          out = replaceInner(out, parent, clamp(projects, 9).map((p, i) =>
            GEN.projectCardShape({ cls: 'project-card', extra: '' }, p, EMOJIS, i)
          ).join('\n'));
        }
      }
    }
    // Generic .grid > .card (+ optional .card-tag venue tag + .tech stack)
    const cardGrid = findDivRange(out, /<div[^>]*class="(?![^"]*(?:skills-grid|projects-grid|about-grid|education-grid|edu-grid))[^"']*\bgrid\b[^"']*"[^>]*>/i);
    if (cardGrid && cardGrid.inner && !cardGrid.inner.includes('project-card') && /<div[^>]*class="[^"]*\bcard\b/.test(cardGrid.inner) && /<h3>[\s\S]*?<p>/.test(cardGrid.inner)) {
      const hasVenueTag = cardGrid.inner.includes('card-tag');
      out = replaceInner(out, cardGrid, clamp(projects, 9).map(p =>
        hasVenueTag
          ? `<div class="card">
            <div class="card-tag">${esc((p.techTags[0] || 'Project').slice(0, 40))}</div>
            <h3>${esc(p.title)}</h3>
            <p>${esc(p.description)}</p>
          </div>`
          : GEN.genericCard(p.title, p.description, p.techTags.map(esc))
      ).join('\n'));
    }
  }

  // ------------------------------------------------------------------
  // 3. EXPERIENCE TIMELINE — .timeline > .timeline-item (date/title/company/desc)
  // ------------------------------------------------------------------
  if (experience.length) {
    const tl = findDivRange(out, /<div[^>]*class="[^"]*timeline[^"]*"[^>]*>/i);
    if (tl && tl.inner.includes('timeline-item')) {
      out = replaceInner(out, tl, clamp(experience, 6).map(e => GEN.timelineItem(e)).join('\n'));
    }
  }

  // ------------------------------------------------------------------
  // 4. EDUCATION — dedicated education containers when present; otherwise
  //    append education cards to a generic .card grid on the about/home page.
  // ------------------------------------------------------------------
  if (education.length) {
    const eduListHtml = clamp(education, 4).map(ed =>
      GEN.genericCard(ed.degree, [ed.institution, ed.range, ed.text].filter(Boolean).join(' · '), [])
    ).join('\n');
    const eduGrid = findDivRange(out, /<div[^>]*class="[^"]*(?:education-grid|edu-grid|education-list)[^"]*"[^>]*>/i);
    if (eduGrid) {
      out = replaceInner(out, eduGrid, eduListHtml);
    } else if (/about|index/i.test(page)) {
      // Timeline templates show education as the final timeline entry (the
      // demo pattern: degree as title, school as company). Append after jobs.
      const tl = findDivRange(out, /<div[^>]*class="[^"]*timeline[^"]*"[^>]*>/i);
      if (tl && tl.inner.includes('timeline-item')) {
        const eduItems = clamp(education, 2).map(ed => GEN.timelineItem({
          role: ed.degree,
          company: ed.institution,
          range: ed.range,
          text: ed.text
        })).join('\n');
        out = replaceInner(out, tl, tl.inner + '\n' + eduItems);
      } else {
        // Fallback: append education cards to a genuine .card grid
        const cardGrid = findDivRange(out, /<div[^>]*class="(?![^"]*(?:skills-grid|projects-grid|about-grid|education-grid|edu-grid))[^"']*\bgrid\b[^"']*"[^>]*>/i);
        if (cardGrid && cardGrid.inner && /<div[^>]*class="[^"]*\bcard\b/.test(cardGrid.inner) && /<h3>[\s\S]*?<p>/.test(cardGrid.inner) && !cardGrid.inner.includes('project-card') && !cardGrid.inner.includes('pub-card')) {
          out = replaceInner(out, cardGrid, cardGrid.inner + '\n' + eduListHtml);
        }
      }
    }
  }

  // ------------------------------------------------------------------
  // 5. CERTIFICATIONS / PUBLICATIONS — .pub-card lists
  // ------------------------------------------------------------------
  if (certifications.length) {
    const pub = findDivRange(out, /<div[^>]*class="[^"]*pub-list[^"]*"[^>]*>/i);
    if (pub && pub.inner.includes('pub-card')) {
      out = replaceInner(out, pub, clamp(certifications, 6).map((c) =>
        `<div class="pub-card">
          <span class="meta">${esc([c.issuer, c.date].filter(Boolean).join(' · '))}</span>
          <h3>${esc(c.name)}</h3>
          <p class="authors">${esc(c.issuer)}</p>
        </div>`
      ).join('\n'));
    }
  }

  // ------------------------------------------------------------------
  // 5b. KEYNOTE / SPEAKING sections → the user's real certifications
  //     (demo talks are invented; certs are real credentials with the
  //     same [year] issuer + name visual shape).
  // ------------------------------------------------------------------
  if (certifications.length) {
    const keynote = findDivRange(out, /<div[^>]*class="[^"]*(?:keynote|speaking-section|talks)[^"]*"[^>]*>/i);
    if (keynote && keynote.inner.includes('<h2')) {
      const items = clamp(certifications, 4).map((c) => `
        <div style="margin-bottom: 25px; line-height: 1.6;">
          <p style="color: var(--primary); font-weight: bold;">[${esc(String(c.date || '').match(/(19|20)\d{2}/)?.[0] || 'Cert')}] ${esc(c.issuer || 'Certification')}</p>
          <p style="color: #9ca3af;">${esc(c.name)}</p>
        </div>`).join('');
      out = replaceInner(out, keynote, `\n        <h2 style="font-size: 1.6rem; color: #fff; margin-bottom: 30px;">Certifications &amp; Credentials</h2>\n${items}\n      `);
    }
  }

  // ------------------------------------------------------------------
  // 6. ABOUT-PAGE POLISH — real bio paragraphs in .about-text, honest
  //    stat counters, and derived years-of-experience badges.
  // ------------------------------------------------------------------
  const aboutish = /about|index/i.test(page);
  if (aboutish) {
    // 6a. .about-text demo paragraphs → bio split into ≤2 paragraphs
    const at = findDivRange(out, /<div[^>]*class="[^"]*about-text[^"]*"[^>]*>/i);
    if (at && at.inner.includes('<p')) {
      const bio = lists.profile.bio || '';
      if (bio) {
        const sentences = bio.match(/[^.!?]+[.!?]+["')\]]?\s*/g) || [bio];
        const half = Math.ceil(sentences.length / 2);
        const paras = sentences.length > 1 ? [sentences.slice(0, half).join(''), sentences.slice(half).join('')] : [bio];
        let pi = 0;
        let inner2 = at.inner.replace(/<p[^>]*>[\s\S]*?<\/p>/gi, (m, ...args) => {
          const offset = args[args.length - 1];
          void offset;
          const text = pi < paras.length ? paras[pi++].trim() : '';
          return text ? `<p>${esc(text)}</p>` : '';
        });
        // drop now-empty p wrappers
        inner2 = inner2.replace(/<p[^>]*>\s*<\/p>/g, '');
        out = out.slice(0, at.openEnd) + inner2 + out.slice(at.closeStart);
      }
    }
    // 6b. Honest stat counters (projects/skills/experience counts)
    const honestStats = [
      [`${lists.projects.length}+`, 'Projects Completed'],
      [`${lists.skillsFlat.length}+`, 'Technologies']
    ];
    if (lists.experience.length) honestStats.push([`${lists.experience.length}`, 'Professional Roles']);
    let si = 0;
    out = out.replace(/(<div[^>]*class="[^"]*stat-item[^"]*"[^>]*>[\s\S]*?<\/div>)/gi, (m) => {
      if (si >= honestStats.length) return '';
      const [num, label] = honestStats[si++];
      return `<div class="stat-item">
              <span class="stat-number">${esc(num)}</span>
              <span class="stat-label">${esc(label)}</span>
            </div>`;
    });
    // 6c. Years-of-experience badge derived from the earliest start date
    const yearsArr = lists.experience.map(e => (e.range.match(/(?:19|20)\d{2}/) || [])[0]).filter(Boolean).map(Number);
    if (yearsArr.length) {
      const yrs = new Date().getFullYear() - Math.min(...yearsArr);
      if (yrs >= 1) {
        out = out.replace(/(<span[^>]*class="[^"]*badge-number[^"]*"[^>]*>)[^<]*(<\/span>)/i, `$1${yrs}+$2`);
      }
    }
  }

  return out;
};

// Fill the generic inline-styled "minimal" templates (chocolatier/student-arch):
// their about/projects/contact pages are a centered <main><div> card with h1/p.
// Rewrite the boilerplate bio/projects with the user's real content.
const injectGenericMain = (html, lists, ph) => {
  let out = html;
  const { profile } = lists;
  const name = ph.name;

  // Page headline "About <Template Demo Name>" → "About <Real Name>"
  out = out.replace(/(<h1[^>]*>\s*)About\s+[^<]{3,60}(\s*<\/h1>)/i, (m, a, z) => `${a}About ${esc(name)}${z}`);

  // AI/heuristic about headline replaces demo boilerplate h2/h3 headlines
  // ("A passionate developer…", "A Fiduciary Standard", etc.)
  if (lists.aiAboutHeadline) {
    out = out.replace(/(<h[23][^>]*>)(?:A passionate[\s\S]{0,120}?|Welcome[\s\S]{0,120}?|A Fiduciary[\s\S]{0,80}?)(<\/h[23]>)/i,
      (m, a, z) => `${a}${esc(lists.aiAboutHeadline)}${z}`);
  }

  // Demo bio/story paragraphs → the user's real bio (keeps classes intact)
  if (lists.profile.bio) {
    const DEMO_BIOS = [
      /<p>[^<]*With over \d+ years of experience[^<]*<\/p>/i,
      /<p>[^<]*Welcome to my creative space[^<]*<\/p>/i,
      /<p>[^<]*bridges the gap between technical execution and artistic vision[^<]*<\/p>/i,
      /<p>[^<]*I build scalable web applications[^<]*<\/p>/i,
      /<p>[^<]*I'm a (?:Full-Stack Developer|professional)[^<]{10,400}?<\/p>/i,
      /<p>[^<]*When I'm not coding[^<]{10,400}?<\/p>/i
    ];
    for (const re of DEMO_BIOS) {
      out = out.replace(re, `<p>${esc(lists.profile.bio)}</p>`);
    }
  }

  // Boilerplate "I am a professional <strong>creative</strong>..." → real role
  if (ph.role) {
    out = out.replace(/I am a professional <strong>[^<]*<\/strong>/i,
      `I am a professional <strong>${esc(ph.shortRole || ph.role)}</strong>`);
  }

  // About page boilerplate: "Welcome to my creative space..."
  const bioText = profile.bio
    || (lists.experience[0] ? `${name} is a ${lists.experience[0].role}${lists.experience[0].company ? ` at ${lists.experience[0].company}` : ''}.` : `Welcome to ${name}'s portfolio.`);
  out = out.replace(/(<p[^>]*font-size:\s*1\.2rem[^>]*>)[\s\S]*?(<\/p>)/i,
    (m, a, z) => `${a}\n      ${esc(bioText)}\n    ${z}`);
  // The follow-up boilerplate paragraph
  const secondPara = lists.skillsFlat.length
    ? `Core strengths include ${clamp(lists.skillsFlat.map(s => s.name), 6).join(', ')}.`
    : '';
  if (secondPara) {
    out = out.replace(/(<p[^>]*font-size:\s*1\.1rem[^>]*>)[\s\S]*?(<\/p>)/i,
      (m, a, z) => `${a}\n      ${esc(secondPara)}\n    ${z}`);
  }

  // Projects page mini-cards: h3 title + p description inside the flex container
  if (lists.projects.length) {
    const miniCards = clamp(lists.projects, 6).map(p =>
      `<div style="background:rgba(128,128,128,0.1); padding:2rem; border-radius:8px; width:250px; text-align:left; border:1px solid rgba(128,128,128,0.2);">
        <h3 style="font-size:1.4rem; margin-bottom:0.5rem;">${esc(p.title)}</h3>
        <p style="font-size:0.95rem; opacity:0.7;">${esc(p.description)}</p>
      </div>`
    ).join('\n      ');
    const flexRange = findDivRange(out, /<div style="display:flex; gap:20px; justify-content:center; flex-wrap:wrap;">/i);
    if (flexRange) {
      out = replaceInner(out, flexRange, miniCards);
    } else {
      // No project cards exist — inject a section before the closing </main>
      out = out.replace(/<\/main>/i, `\n    <div style="max-width:900px; margin:2rem auto 0; display:flex; gap:20px; justify-content:center; flex-wrap:wrap;">${miniCards}</div>\n  </main>`);
    }
  }

  // Experience timeline injection for generic templates without one
  if (lists.experience.length) {
    const hasTimeline = /class="[^"]*timeline/.test(out);
    if (!hasTimeline) {
      const timelineHtml = `\n    <div style="max-width:800px; margin:3rem auto 0; text-align:left;">
      <h2 style="margin-bottom:1.5rem;">Experience</h2>
      ${clamp(lists.experience, 5).map(e => `
      <div style="margin-bottom:1.5rem; padding:1.25rem; background:rgba(128,128,128,0.1); border-radius:8px; border:1px solid rgba(128,128,128,0.2);">
        <div style="display:flex; justify-content:space-between; align-items:baseline; flex-wrap:wrap; gap:0.5rem;">
          <strong>${esc(e.role)}${e.company ? ` · ${esc(e.company)}` : ''}</strong>
          <span style="opacity:0.7; font-size:0.9rem;">${esc(e.range)}</span>
        </div>
        ${e.text ? `<p style="margin-top:0.5rem; opacity:0.8; font-size:0.95rem;">${esc(e.text)}</p>` : ''}
      </div>`).join('')}
    </div>`;
      out = out.replace(/<\/main>/i, timelineHtml + '\n  </main>');
    }
  }

  void name;
  return out;
};

// Build the placeholder set from a portfolio object
const buildPlaceholders = (pf) => {
  const profile = pf.profile || {};
  const exp = (pf.experience || []).slice(0, 6);
  const skills = (pf.skills || []).slice(0, 16);
  const projects = (pf.projects || []).slice(0, 8);
  const edu = (pf.education || []).slice(0, 4);
  const certs = (pf.certifications || []).slice(0, 6);

  const name = profile.fullName || 'Your Name';
  const firstName = name.split(' ')[0];
  const lastName = name.split(' ').slice(1).join(' ') || firstName;
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase() || 'PF';
  const role = profile.title || 'Professional';
  const shortRole = role.split(/[/,\u2014-]/)[0].trim() || role;
  const bio = profile.bio || '';
  const location = profile.location || '';
  const email = profile.email || '';
  const phone = profile.phone || '';
  const github = profile.github || '';
  const linkedin = profile.linkedin || '';
  const website = profile.website || '';
  const avatarUrl = profile.avatarUrl || '';
  const year = new Date().getFullYear();

  return { pf, name, firstName, lastName, initials, role, shortRole, bio, location, email, phone, github, linkedin, website, avatarUrl, year, exp, skills, projects, edu, certs };
};

// Rewrite a single HTML document
const injectIntoHtml = (html, ph, page) => {
  let out = html;
  const { name, firstName, lastName, initials, role, shortRole, bio, location, email, phone, github, linkedin, website, avatarUrl, year, skills, projects, exp, edu } = ph;

  // Extract any demo name in <title> (e.g., "Jason Lee | Software Engineer", "John Doe - Portfolio")
  const titleMatch = html.match(/<title>([^|—–-]+)[|—–-]/i);
  // ...or in the footer copyright ("© 2026 Alex Chen. Built with...")
  const footMatch = html.match(/(?:©|&copy;)\s*(?:19|20)\d{2}\s+([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){1,2})/);
  // Reject section words that titles often start with ("About — John Doe | ...")
  // so nav links like <a>About</a> never get rewritten.
  const SECTION_WORD = /^(about|projects?|contact|home|resume|cv|welcome|work|works|index|blog|services?|gallery|publications?|skills?|experience|hello|hi)$/i;
  const titleCandidate = titleMatch?.[1]?.trim();
  const demoName = (titleCandidate && !SECTION_WORD.test(titleCandidate) && !titleCandidate.toLowerCase().includes('portfolio') ? titleCandidate : null)
    || footMatch?.[1] || null;
  if (demoName && demoName.length > 4 && demoName.length < 40) {
      const demoFirst = demoName.split(' ')[0];
      const demoLast = demoName.split(' ').slice(1).join(' ');
      const reFull = new RegExp(demoName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      out = out.replace(reFull, esc(name));
      if (demoFirst && demoFirst.length > 2) {
        out = out.replace(new RegExp(`\\b${demoFirst.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g'), esc(firstName));
      }
      if (demoLast && demoLast.length > 2) {
        out = out.replace(new RegExp(`\\b${demoLast.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g'), esc(lastName));
      }
  }

  // Generic demo name replacements as fallback (longest aliases first so
  // "Dr. Nova Neural" doesn't leave a stray "Dr.").
  const DEMO_ALIASES = [
    'Dr. Nova Neural', 'Nova Neural', 'John Doe', 'Jane Doe', 'Alex Rivers',
    'Sarah Jenkins', 'Alex Chen', 'Arthur Pendelton', 'Jason Lee'
  ];
  for (const alias of DEMO_ALIASES.sort((a, b) => b.length - a.length)) {
    const re = new RegExp(alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    out = out.replace(re, esc(name));
  }
  out = out
    .replace(/\bJohn\b/g, esc(firstName))
    .replace(/\bDoe\b/g, esc(lastName));

  // Demo contact emails → user's real email (or stripped when none)
  if (email) {
    out = out.replace(/\b(?:hello|contact|hi|mail|me)(?:\.[a-z0-9.-]+)?@(?:johndoe|janedoe|sarahjenkins|alexrivers|alexchen|novaneural|drnovaneural|arthurpendelton|jasonlee)\.(?:dev|com|io|net|me|org)\b/gi, email);
  } else {
    out = out.replace(/\b(?:hello|contact|hi|mail|me)(?:\.[a-z0-9.-]+)?@(?:johndoe|janedoe|sarahjenkins|alexrivers|alexchen|novaneural|drnovaneural|arthurpendelton|jasonlee)\.(?:dev|com|io|net|me|org)\b/gi, '');
  }

  // Team-member cards (.team-name / .team-role) → real person
  out = out
    .replace(/(<[^>]*class="[^"]*team-name[^"]*"[^>]*>)[^<]*(<\/)/gi, `$1${esc(name)}$2`)
    .replace(/(<[^>]*class="[^"]*team-role[^"]*"[^>]*>)[^<]*(<\/)/gi, `$1${esc(shortRole)}$2`);

  // Author bylines ("Authors: X, Y" / "By X") → the real person
  out = out.replace(/(>\s*(?:Authors?|By)\s*:\s*)[^<]{2,120}(<)/gi, `$1${esc(name)}$2`);

  // Image alts carrying a demo person's name → real name
  for (const alias of DEMO_ALIASES) {
    const reAlt = new RegExp(`alt="([^"]*${alias.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}[^"]*)"`, 'gi');
    out = out.replace(reAlt, `alt="${esc(name)}"`);
  }

  // <title> + meta tags
  out = out
    .replace(/<title>[^<]*<\/title>/i, `<title>${esc(name)} — ${esc(role)}</title>`)
    .replace(/(<meta\s+(?:name="description"|property="og:title"|property="og:description")[^>]*content=")([^"]*)("[^>]*>)/gi,
      (m, a, content, z) => a + esc(`${name} — ${shortRole}. ${bio ? bio.slice(0, 120) : ''}`) + z);

  // Nav logo / initials
  out = out
    .replace(/(<a[^>]*class="[^"]*(?:nav-logo|logo|brand)[^"]*"[^>]*>)(?:&lt;[A-Z/]+&gt;|[A-Z]{2,4}|[A-Za-z\s]+)(<\/a>)/gi,
      `$1&lt;${esc(initials)}/&gt;$2`);

  // Hero H1 heading
  out = out.replace(/(<h1[^>]*class="[^"]*(?:hero-title|title|reveal|name)[^"]*"[^>]*>)([^<]*)(<\/h1>)/i, (m, a, text, z) => {
    // Only replace if it contains a name-like or demo greeting
    if (text.includes('.') || text.includes('I am') || text.length < 35) {
      return `${a}${esc(name)}${z}`;
    }
    return m;
  });

  // Hero subtitle / description paragraphs — ALWAYS replace so demo copy
  // never survives: use the real bio, else the AI-enriched one, else a
  // neutral generated tagline built from the person's actual role.
  {
    const effBio = bio || ph.enriched?.profile?.bio || `Portfolio of a ${shortRole}${location ? ` based in ${location}` : ''}.`;
    out = out.replace(/(<p[^>]*class="(?![^"]*section-)[^"]*(?:hero-subtitle|subtitle|lead|intro|bio)[^"]*"[^>]*>)([\s\S]*?)(<\/p>)/gi,
      (m, a, inner, z) => a + esc(effBio) + z);
  }

  // Role/typing text: templates often have data-typing attributes or span content
  out = out
    .replace(/(data-typing=")[^"]*(")/gi, `$1${esc(role)}$2`)
    .replace(/(class="typing-text"[^>]*>)([^<]*)(<)/gi, `$1${esc(shortRole)}$3`);

  // "Available for freelance/work" → user's status pill if present
  if (ph.pf.profile?.statusPill) {
    out = out.replace(/(Available for[\s\S]{0,25}?<\/span>)/i,
      `<span class="dot"></span>${esc(ph.pf.profile.statusPill.replace(/^[^\w]+/, ''))}</span>`);
  }

  // Skills list injection if present in template
  if (skills && skills.length > 0) {
    const skillsHtml = skills.slice(0, 10).map(s => `<li>${esc(s.name)}</li>`).join('\n            ');
    out = out.replace(/(<ul[^>]*class="[^"]*(?:skills-list|skills|tech-list|technologies)[^"]*"[^>]*>)([\s\S]*?)(<\/ul>)/gi,
      `$1\n            ${skillsHtml}\n          $3`);
  }

  // Email links
  if (email) {
    out = out.replace(/href=("|')mailto:[^"']*\1/gi, `href="mailto:${email}"`);
    out = out.replace(/(class="[^"]*(?:email-link|contact-email)[^"]*"[^>]*>)([^<]*)(<\/a>)/gi, `$1${esc(email)}$3`);
  }

  // Phone links
  if (phone) {
    out = out.replace(/href=("|')tel:[^"']*\1/gi, `href="tel:${phone}"`);
  }

  // GitHub & LinkedIn links
  if (github) {
    out = out.replace(/href=("|')https?:\/\/(?:www\.)?github\.com\/[^"']*\1/gi, `href="${esc(github)}"`);
  }
  if (linkedin) {
    out = out.replace(/href=("|')https?:\/\/(?:www\.)?linkedin\.com\/[^"']*\1/gi, `href="${esc(linkedin)}"`);
  }
  if (website) {
    out = out.replace(/href=("|')https?:\/\/(?:www\.)?example\.com\/?[^"']*\1/gi, `href="${esc(website)}"`);
  }

  // Location mentions
  if (location) {
    out = out.replace(/(<span[^>]*class="[^"]*location[^"]*"[^>]*>)([^<]*)(<)/gi, `$1${esc(location)}$3`);
  }

  // Footer / copyright
  out = out.replace(/(Built by\s+)([^<.]+)/gi, `$1${esc(name)}`);
  out = out.replace(/(&copy;|©)\s*(19|20)\d{2}(?:\s+[^<,]+)?/g, `$1 ${year} ${esc(name)}`);

  // DEEP CONTENT: fill every list-shaped section with real resume data
  if (ph.enriched) {
    try {
      out = injectDeepContent(out, ph.enriched, page);
      out = injectGenericMain(out, ph.enriched, ph);
    } catch (e) {
      console.error('deep injection failed:', e.message);
    }
  }

  return out;
};

// ============================================================================
// AI CONTENT ENRICHMENT — analyzes the extracted resume + the template's own
// role/category and fills the gaps so content "fits perfectly": project blurbs
// for one-line titles, skill-group descriptions, a category-appropriate about
// headline, and hero taglines. Claude when ANTHROPIC_API_KEY is set; a solid
// heuristic fallback otherwise. Never invents employers, degrees or dates.
// ============================================================================
const heuristicEnrich = (lists, entry) => {
  const category = (entry?.category || 'technology').toLowerCase();
  const role = entry?.role || lists.profile?.title || 'professional';
  const out = { projectBlurb: {}, groupDesc: {} };

  const titles = dedupe(lists.projects.map(p => p.title));
  lists.projects.forEach((p) => {
    if (!p.description && p.title) {
      const tech = p.techTags?.length ? ` Built with ${p.techTags.slice(0, 3).join(', ')}.` : '';
      out.projectBlurb[p.title] = `A ${category === 'creative' ? 'creative' : 'hands-on'} project by ${lists.profile?.fullName || 'the author'}${tech}`.trim();
    }
  });
  void titles;
  const DEFAULT_DESC = {
    Frontend: 'Interfaces and experiences built with modern frameworks',
    Backend: 'Server-side systems, APIs and services',
    Database: 'Data modeling, storage and query layers',
    DevOps: 'Deployment, infrastructure and automation',
    Languages: 'Programming languages in active use',
    Design: 'Visual design and prototyping toolchain',
    Tools: 'Everyday productivity and workflow tools',
    ML: 'Machine learning and data tooling'
  };
  lists.skills.forEach((g) => { if (g.items?.length) out.groupDesc[g.category] = DEFAULT_DESC[g.category] || `Skills & technologies in ${String(g.category).toLowerCase()}`; });

  // About headline: derive from top experience, tone-matched to category
  const top = lists.experience[0];
  out.aboutHeadline = top
    ? (category === 'academic'
      ? `Researcher and educator advancing ${String(role).toLowerCase()}`
      : category === 'creative'
        ? `A creative professional shaping memorable work`
        : `${top.role} delivering measurable impact${top.company ? ` at ${top.company}` : ''}`)
    : 'A passionate professional who loves building things';
  return out;
};

const ENRICH_SYSTEM_PROMPT = `You are a portfolio-website copywriter. You receive JSON with: a person's extracted resume data (profile, skills, projects, experience, education), and the website template's role/category. Fill ONLY the missing/weak fields listed in "needs" and respond with ONLY JSON:
{
  "aboutHeadline": string,           // 1 sentence, third-person-free bio headline for the About page
  "heroTagline": string,             // 1 sentence hero subtitle in first person
  "projectBlurb": { "<project title>": string },   // 1-2 sentence description per requested project title, grounded in its tech/description
  "groupDesc": { "<skill category>": string }      // 1 short sentence describing that skill category
}
Rules:
1. Use ONLY facts present in the input. Never invent employers, degrees, dates, numbers or clients.
2. Match the template's category tone (e.g. academic = precise & researchy, creative = evocative, technology = concrete & technical).
3. Keep every string under 240 characters. No markdown, no commentary — JSON only.`;

const callAnthropicEnrich = async (payload) => {
  const res = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 1500,
      system: ENRICH_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: JSON.stringify(payload) }]
    })
  });
  if (!res.ok) throw new Error(`Anthropic API ${res.status}`);
  const json = await res.json();
  const text = (json.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('No JSON in enrichment response');
  return JSON.parse(cleaned.slice(start, end + 1));
};

// Returns { lists, enriched: bool } — lists is the same object, gap-filled.
const enrichLists = async (lists, entry) => {
  const gaps = [];
  if (!lists.profile.bio) gaps.push('bio');
  lists.projects.forEach(p => { if (!p.description) gaps.push(`project:${p.title}`); });
  const missingBlurbTitles = lists.projects.filter(p => !p.description).map(p => p.title);

  const payload = {
    template: { role: entry?.role || '', category: entry?.category || '', name: entry?.name || '' },
    profile: { fullName: lists.profile.fullName, title: lists.profile.title, bio: lists.profile.bio },
    skills: lists.skills.map(g => ({ category: g.category, items: g.items })),
    projects: lists.projects.map(p => ({ title: p.title, description: p.description, techTags: p.techTags })),
    experience: lists.experience.map(e => ({ role: e.role, company: e.company, range: e.range, text: e.text })),
    education: lists.education,
    needs: { aboutHeadline: true, heroTagline: !lists.profile.bio, projectTitles: missingBlurbTitles, groupCategories: lists.skills.map(g => g.category) }
  };

  let enriched = false;
  let engine = 'heuristic';
  if (ANTHROPIC_API_KEY) {
    try {
      const ai = await callAnthropicEnrich(payload);
      engine = 'claude';
      if (ai.projectBlurb) {
        Object.entries(ai.projectBlurb).forEach(([title, blurb]) => {
          const p = lists.projects.find(x => x.title === title);
          if (p && typeof blurb === 'string' && blurb.length > 10) { p.description = blurb.slice(0, 300); enriched = true; }
        });
      }
      if (ai.aboutHeadline && typeof ai.aboutHeadline === 'string' && !lists.aiAboutHeadline) { lists.aiAboutHeadline = ai.aboutHeadline.slice(0, 240); enriched = true; }
      if (ai.heroTagline && typeof ai.heroTagline === 'string' && !lists.profile.bio) { lists.profile.bio = ai.heroTagline.slice(0, 300); enriched = true; }
      if (ai.groupDesc) {
        lists.skills.forEach(g => { if (typeof ai.groupDesc[g.category] === 'string' && !g.desc) g.desc = ai.groupDesc[g.category].slice(0, 200); });
        enriched = true;
      }
    } catch (err) {
      console.error('AI enrichment failed, using heuristics:', err.message);
    }
  }
  // Heuristic fallback fills whatever Claude missed or when no key is set
  const fb = heuristicEnrich(lists, entry);
  lists.projects.forEach(p => { if (!p.description && fb.projectBlurb[p.title]) p.description = fb.projectBlurb[p.title]; });
  lists.skills.forEach(g => { if (!g.desc && fb.groupDesc[g.category]) g.desc = fb.groupDesc[g.category]; });
  if (!lists.aiAboutHeadline) lists.aiAboutHeadline = fb.aboutHeadline;
  if (!lists.profile.bio) {
    const top = lists.experience[0];
    lists.profile.bio = top
      ? `${lists.profile.fullName || 'Professional'} — ${top.role}${top.company ? ` at ${top.company}` : ''}, focused on delivering measurable results.`
      : `Portfolio of ${lists.profile.fullName || `a ${lists.profile.title || 'professional'}`}.`;
  }
  void gaps;
  return { lists, enriched, engine };
};

// Static assets pass through untouched; HTML gets injected.
// ============================================================================
// MINIMAL ZIP BUILDER (store method, no compression) — packs the injected
// multi-page site into a real .zip the user can open/extract externally.
// ============================================================================
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
const crc32 = (buf) => {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
};
const buildZip = (fileList) => {
  const u16 = (v) => { const b = Buffer.alloc(2); b.writeUInt16LE(v & 0xFFFF); return b; };
  const u32 = (v) => { const b = Buffer.alloc(4); b.writeUInt32LE(v >>> 0); return b; };
  const DOS_TIME = 0, DOS_DATE = ((2024 - 1980) << 9) | (1 << 5) | 1;
  const chunks = [], central = [];
  let offset = 0;
  for (const f of fileList) {
    const data = f.encoding === 'base64' ? Buffer.from(f.content, 'base64') : Buffer.from(f.content, 'utf-8');
    const nameBuf = Buffer.from(f.path.replace(/^\.\//, ''), 'utf-8');
    const crc = crc32(data);
    // Local file header: sig(4) verNeed(2) flags(2) method(2) time(2) date(2)
    // crc(4) csize(4) usize(4) nameLen(2) extraLen(2) name data
    const local = Buffer.concat([
      u32(0x04034b50), u16(20), u16(0), u16(0), u16(DOS_TIME), u16(DOS_DATE), u32(crc),
      u32(data.length), u32(data.length), u16(nameBuf.length), u16(0), nameBuf, data
    ]);
    chunks.push(local);
    // Central directory: sig(4) verMade(2) verNeed(2) flags(2) method(2)
    // time(2) date(2) crc(4) csize(4) usize(4) nameLen(2) extraLen(2)
    // commentLen(2) diskStart(2) intAttr(2) extAttr(4) offset(4) name
    central.push(Buffer.concat([
      u32(0x02014b50), u16(20), u16(20), u16(0), u16(0), u16(DOS_TIME), u16(DOS_DATE), u32(crc),
      u32(data.length), u32(data.length), u16(nameBuf.length), u16(0), u16(0),
      u16(0), u16(0), u32(0), u32(offset), nameBuf
    ]));
    offset += local.length;
  }
  const centralBuf = Buffer.concat(central);
  const end = Buffer.concat([
    u32(0x06054b50), u16(0), u16(0), u16(fileList.length), u16(fileList.length),
    u32(centralBuf.length), u32(offset), u16(0)
  ]);
  return Buffer.concat([...chunks, centralBuf, end]);
};

// ============================================================================
// SELF-AUDITING INJECTION — guarantee no template demo copy survives.
// We know each template's raw HTML, so ANY raw demo sentence that still shows
// up after normal injection gets replaced with real resume content. Also
// guarantees the user's skills/projects appear even on templates whose markup
// no pattern-based injector recognizes.
// ============================================================================
const _purgeCache = new Map();
const rawPageText = (dir, file) => {
  const key = `${dir}::${file}`;
  if (!_purgeCache.has(key)) {
    try {
      _purgeCache.set(key, fs.readFileSync(path.join(TPL_ROOT, dir, file), 'utf-8'));
    } catch {
      _purgeCache.set(key, null);
    }
  }
  return _purgeCache.get(key);
};

const stripTagsText = (html) => String(html)
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<!--[\s\S]*?-->/g, ' ')
  .replace(/<[^>]+>/g, '\n')
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ')
  .replace(/&mdash;/g, '—').replace(/&ndash;/g, '–').replace(/&hellip;/g, '…');

const normText = (s) => String(s).toLowerCase().replace(/[\u2019\u2018']/g, "'").replace(/\s+/g, ' ').trim().replace(/[.!]+$/, '');

// Labels generic enough to stay even in a demo template (nav, buttons, legal)
const PURGE_CHROME_RE = [
  /^(home|about|projects?|contact|resume|cv|blog|gallery|skills?|experience|education|publications?|services?|portfolio|hello|hi|welcome|work|works|menu|shop|store|testimonials?|faq|pricing|team|events?|talks?|speaking|writing|news|updates|login|sign in|subscribe|newsletter|archive|categories|tags|featured|latest|recent)\b/,
  /^(your name|your email|your message|your subject|your phone|send message|get in touch|let'?s talk|hire me|download (my )?(cv|resume)|view (my )?(work|projects|all|portfolio)|read more|learn more|see more|view all|show more|load more|contact me|get started|book (now|a call|an appointment)|sign up|log in|search|back to top|scroll down|follow me|share this|made with|built with|all rights reserved|privacy policy|terms( of service)?|cookie policy|designed by|powered by|leave a (reply|comment)|post comment)\b/,
  /^\d+(?:\.\d+)?[km]?\+?\s*(?:%|percent|clients|projects|awards|years|cupcakes|customers|followers)\b/,
  /^(mon|tue|wed|thu|fri|sat|sun|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/,
  /^(loading|error 404|404|page not found|coming soon|under construction|new|beta)\b/,
  /^(undefined|null|true|false)\b/,
  /^(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/,
  /^[\W_]+$/  // pure punctuation/symbols (ASCII-art banners etc.)
];

// Exact-line membership over pre-extracted raw lines (audit endpoint uses it)
const rawSetHas = (rawLines, normLine) => rawLines.some(l => normText(l) === normLine);

// Build a regex needle from a DECODED text line that also matches its HTML-
// entity-encoded forms (&amp;, &lt;, &nbsp;, &bull;, …) in the raw HTML.
const entityFlex = (line) => String(line)
  .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  .replace(/&/g, '(?:&amp;|&)')
  .replace(/</g, '(?:&lt;|<)')
  .replace(/>/g, '(?:&gt;|>)')
  .replace(/"/g, '(?:&quot;|")')
  .replace(/'/g, "(?:&#39;|&apos;|')")
  .replace(/ /g, '(?:\\s|&nbsp;|&#160;)+')
  .replace(/[^\x00-\x7F]/g, (c) => `(?:${c}|&#\\d+;|&[a-zA-Z]+;)`);

// Replace every surviving raw demo sentence with real resume content.
const purgeDemoText = (injectedHtml, rawHtml, lists, page, ph) => {
  let out = injectedHtml;
  if (!rawHtml) return out;

  const rawLines = stripTagsText(rawHtml).split('\n').map(l => l.replace(/\s+/g, ' ').trim()).filter(Boolean);
  const userText = normText(JSON.stringify({ p: lists.profile, s: lists.skills, j: lists.projects, e: lists.experience, d: lists.education, c: lists.certifications }));
  const isUserText = (s) => { const n = normText(s); return n.length > 12 && userText.includes(n); };

  const REPLACEMENTS = [
    () => esc(lists.profile.bio || `Portfolio of ${lists.profile.fullName || 'a professional'} — ${lists.profile.title || ''}.`.replace(/\s+\./, '.')),
    () => esc(lists.projects[0] ? `${lists.projects[0].title}: ${lists.projects[0].description || 'featured project'}` : (lists.profile.bio || `Selected work by ${lists.profile.fullName || 'the author'}.`)),
    () => esc(lists.profile.bio || `Get in touch with ${lists.profile.fullName || 'me'}${lists.profile.email ? ` at ${lists.profile.email}` : ''}.`),
    () => esc(lists.experience[0] ? `${lists.experience[0].role}${lists.experience[0].company ? ` at ${lists.experience[0].company}` : ''}` : (lists.profile.bio || `About ${lists.profile.fullName || 'me'}.`))
  ];
  let ri = 0;
  const nextRepl = () => REPLACEMENTS[ri++ % REPLACEMENTS.length]();

  for (const line of rawLines) {
    if (line.length < 24) continue;
    if (isUserText(line)) continue;                       // user data
    if (PURGE_CHROME_RE.some(re => re.test(normText(line)))) continue;
    // Is this line still present verbatim in the injected output? The needle
    // matches both decoded text and its entity-encoded HTML forms.
    const needle = entityFlex(line);
    const re = new RegExp(`(?:>|\\n|\\s|"|'|\\()${needle}(?=<|\\n|\\.|,|!|\\?|\\)|$|"|')`, 'i');
    if (!re.test(out)) continue;
    // Still-present raw demo copy → swap for real resume content.
    out = out.replace(new RegExp(needle, 'gi'), () => nextRepl());
  }

  // Demo brand/person tokens collected from ALL of this template's <title>
  // segments ("ATELIER NIB | Master Penmaker" on index.html also appears in
  // the logo div of about.html). Replace each with the real person's name.
  try {
    const SECTION_WORD_RE = /^(about|projects?|contact|home|resume|cv|welcome|work|works|index|blog|services?|gallery|publications?|skills?|experience|hello|hi)$/i;
    const realName = esc(lists.profile.fullName || lists.profile.title || 'Portfolio');
    for (const tok of (ph.brandTokens || [])) {
      const s = stripTagsText(tok).trim();
      if (!s || s.length < 4 || s.length > 60) continue;
      if (SECTION_WORD_RE.test(s) || s.toLowerCase().includes('portfolio')) continue;
      if (isUserText(s)) continue;
      // Chrome words only exempt SINGLE-word tokens: "Event Chronicle" is a
      // brand, not an "Events" nav label.
      if (/^\S+$/.test(s) && PURGE_CHROME_RE.some(re => re.test(normText(s)))) continue;
      out = out.replace(new RegExp(entityFlex(s), 'gi'), realName);
    }
  } catch (e) {
    console.error('brand purge failed:', e.message);
  }

  // Demo stat counters (fabricated "500+ Clients Transformed") → honest
  // counts derived from the user's actual resume. Extra demo stat blocks are
  // dropped entirely so we never show numbers the data can't back up.
  {
    const statBlockRe = /(<(?:div|li|span)[^>]*class="[^"]*stat[^>]*>\s*)(<(?:h\d|span|div|strong)[^>]*>)[^<]{1,12}(<\/(?:h\d|span|div|strong)>\s*<(?:p|span|div|small)[^>]*>)[^<]{2,60}(<\/(?:p|span|div|small)>\s*<\/(?:div|li|span)>)/gi;
    const yearsArr = lists.experience.map(e => (String(e.range || '').match(/(?:19|20)\d{2}/) || [])[0]).filter(Boolean).map(Number);
    const yrs = yearsArr.length ? Math.max(1, new Date().getFullYear() - Math.min(...yearsArr)) : null;
    const honest = [
      [`${lists.projects.length}+`, 'Projects Completed'],
      [`${lists.skillsFlat.length}+`, 'Technologies'],
      ...(lists.experience.length ? [[String(lists.experience.length), 'Professional Roles']] : []),
      ...(yrs ? [[`${yrs}+`, 'Years Experience']] : []),
      ...(lists.education.length ? [[String(lists.education.length), 'Degrees']] : []),
      ...(lists.certifications.length ? [[String(lists.certifications.length), 'Certifications']] : [])
    ];
    let hi = 0;
    out = out.replace(statBlockRe, (m, a, b, c, z) => {
      if (hi >= honest.length) return '';
      const [num, label] = honest[hi++];
      return `${a}${b}${esc(num)}${c}${esc(label)}${z}`;
    });
  }

  // Any demo email address (not the user's own) → the user's email, so
  // brand-specific addresses like hello@ariastone.dk never survive.
  {
    const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
    const keep = (lists.profile.email || '').toLowerCase();
    out = out.replace(EMAIL_RE, (m) => (m.toLowerCase() === keep ? m : (keep || '')));
  }

  // Also test at SENTENCE granularity: demo stories are long multi-sentence
  // paragraphs; individual demo sentences must not survive even when the
  // surrounding paragraph was rebuilt by another injector.
  const seenSent = new Set();
  for (const line of rawLines) {
    if (line.length < 24) continue;
    for (const sent of line.split(/(?<=[.!?])\s+/)) {
      const s = sent.trim();
      if (s.length < 24) continue;
      const key = normText(s);
      if (seenSent.has(key)) continue;
      seenSent.add(key);
      if (isUserText(s)) continue;
      if (PURGE_CHROME_RE.some(re => re.test(normText(s)))) continue;
      const needle = entityFlex(s);
      const re = new RegExp(needle, 'i');
      if (!re.test(out)) continue;
      out = out.replace(new RegExp(needle, 'g'), () => nextRepl());
    }
  }

  // Lorem ipsum blocks — pure filler, replace wherever they appear.
  if (/lorem ipsum/i.test(out)) {
    const bio = esc(lists.profile.bio || `${lists.profile.fullName || 'This portfolio'} — ${lists.profile.title || 'professional portfolio'}.`);
    out = out.replace(/[\t ]*<[^>]*(?:p|div|span|li|h\d)[^>]*>\s*(?:Lorem ipsum[\s\S]{0,600}?(?:elit|amet|aliqua|laudantium|voluptatem)[^<]{0,200}|Sed do eiusmod[\s\S]{0,400}?aliqua[^<]{0,120}|Sed ut perspiciatis[\s\S]{0,600}?laudantium[^<]{0,120})\s*<\/[^>]+>/gi,
      (m) => m.replace(/[\s\S]+/, `<p>${bio}</p>`).replace(/^([\t ]*)<p>/, '$1<p>'));
    out = out.replace(/Lorem ipsum[\s\S]{0,400}?(?:elit|aliqua|amet)/gi, bio);
  }
  return out;
};

// Guarantee the user's real skills & projects are visible on the entry page,
// even when the template's markup matches none of the known injection shapes.
const ensureDataSection = (html, lists) => {
  const blob = normText(stripTagsText(html));
  const missingSkills = lists.skillsFlat.length && !lists.skillsFlat.some(s => blob.includes(normText(s.name)));
  const missingProjects = lists.projects.length && !lists.projects.some(p => blob.includes(normText(p.title)));
  if (!missingSkills && !missingProjects) return html;
  const card = `\n<!-- resume-data-fallback -->\n<section style="max-width:960px;margin:3rem auto;padding:2rem;border:1px solid rgba(128,128,128,0.25);border-radius:12px;font-family:system-ui,sans-serif;">\n  <h2 style="margin:0 0 1rem;">Resume</h2>\n  ${missingSkills && lists.skillsFlat.length ? `<p style="margin:0 0 1.25rem;"><strong>Skills:</strong> ${esc(clamp(lists.skillsFlat.map(s => s.name), 18).join(' · '))}</p>` : ''}\n  ${missingProjects && lists.projects.length ? `<p style="margin:0 0 0.5rem;"><strong>Projects</strong></p>${lists.projects.slice(0, 3).map(p => `<p style="margin:0 0 0.75rem;"><strong>${esc(p.title)}</strong> — ${esc(p.description || '')}</p>`).join('')}` : ''}\n</section>\n`;
  return html.includes('</body>') ? html.replace(/<\/body>/i, `${card}</body>`) : html + card;
};

const injectTemplateSite = async (templateId, pf) => {
  const entry = TPL_CATALOG.find(t => t.id === templateId);
  if (!entry) return null;
  const dir = path.join(TPL_ROOT, templateId);
  if (!fs.existsSync(dir)) return null;

  // Normalize resume data → gap-fill via AI (or heuristics) → deep inject
  const lists = resumeLists(pf);
  const { engine: engineUsed } = await enrichLists(lists, entry);
  const ph = buildPlaceholders(pf);
  ph.enriched = lists;
  ph.entry = entry;
  ph.engine = engineUsed;
  // Brand/person tokens from every raw page's <title> (used by purgeDemoText
  // to wipe demo brands from any page, e.g. a logo div showing index's brand)
  ph.brandTokens = dedupe(
    fs.readdirSync(dir)
      .filter(f => /\.html?$/i.test(f))
      .flatMap(f => String((rawPageText(templateId, f).match(/<title>([^<]*)<\/title>/i) || [])[1] || '').split(/[|—–-]/))
      .map(s => s.trim())
  );
  const files = [];

  const walk = (d, rel = '') => {
    for (const f of fs.readdirSync(d)) {
      const full = path.join(d, f);
      const relPath = path.join(rel, f).replace(/\\/g, '/');
      if (fs.statSync(full).isDirectory()) {
        walk(full, relPath);
      } else if (/\.html?$/i.test(f)) {
        const html = fs.readFileSync(full, 'utf-8');
        let injected = injectIntoHtml(html, ph, f);
        try {
          injected = purgeDemoText(injected, html, lists, f, ph);
          injected = ensureDataSection(injected, lists);
        } catch (e) {
          console.error('purge/fallback failed:', e.message);
        }
        files.push({ path: relPath, content: injected, type: 'text/html' });
      } else if (/\.(css|js)$/i.test(f)) {
        let src = fs.readFileSync(full, 'utf-8');
        if (/\.js$/i.test(f)) {
          // Typing-effect demos cycle hardcoded phrases — swap in real ones.
          const phrases = dedupe([
            ph.shortRole, ph.role,
            lists.experience[0]?.role,
            lists.experience[0]?.company ? `Working at ${lists.experience[0].company}` : '',
            lists.profile.location ? `Based in ${lists.profile.location.split(',')[0]}` : ''
          ].filter(Boolean)).slice(0, 5);
          if (phrases.length && /const\s+strings\s*=\s*\[[^\]]*\]/.test(src)) {
            src = src.replace(/const\s+strings\s*=\s*\[[^\]]*\]/,
              `const strings = [${phrases.map(p => `'${String(p).replace(/'/g, "\\'")}'`).join(', ')}]`);
          }
        }
        files.push({ path: relPath, content: src, type: f.endsWith('.css') ? 'text/css' : 'text/javascript' });
      } else if (/\.(png|jpe?g|svg|webp|ico|woff2?|ttf)$/i.test(f)) {
        const b = fs.readFileSync(full);
        files.push({ path: relPath, content: `data:${f.endsWith('.svg') ? 'image/svg+xml' : f.endsWith('.png') ? 'image/png' : f.endsWith('.ico') ? 'image/x-icon' : 'application/octet-stream'};base64,${b.toString('base64')}`, type: 'asset', encoding: 'base64' });
      }
    }
  };
  walk(dir);
  return { entry, files, engine: ph.engine };
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'database.json');
const PORT = 5000;

// Helper to read DB
function readDB() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initialDB = {
        users: [
          { id: 'user-demo', email: 'piyush@example.com', password: 'password123', name: 'Piyush Sharma' }
        ],
        portfolios: {
          'user-demo': JSON.parse(JSON.stringify(samplePortfolios.fullstack))
        }
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(initialDB, null, 2));
      return initialDB;
    }
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading DB:', err);
    return { users: [], portfolios: {} };
  }
}

// Helper to write DB
function writeDB(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error writing DB:', err);
  }
}

const publicCache = new Map();

// --- Universal Compatibility Layer modules ---
import { registry } from './registry.js';
import { ingestTemplate, bundleHtml } from './ingest.js';
import { toCanonical, validateCanonical } from '../shared/canonicalSchema.js';
import { fitContentToTemplate, OVERFLOW_STRATEGIES } from './fitting.js';
import { runPatchAdapter, runPropsAdapter } from './adapters.js';
import { analyzeJobFit, tailorBullet } from './tailor.js';
import { buildFitPlan } from './templateFit.js';
import { assistantChat } from './assistant.js';
import { optimizeResume } from './optimizer.js';

const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // Buffer request body
  let bodyStr = '';
  req.on('data', chunk => { bodyStr += chunk; });    req.on('end', async () => {
      let body = {};
      if (bodyStr) {
        try { body = JSON.parse(bodyStr); } catch (e) {}
      }

    const sendJson = (statusCode, payload) => {
      res.writeHead(statusCode, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(payload));
    };

    // 1. Health
    if (pathname === '/api/health' && req.method === 'GET') {
      return sendJson(200, { status: 'ok', time: new Date().toISOString() });
    }

    // 2. Auth Login
    if (pathname === '/api/auth/login' && req.method === 'POST') {
      const db = readDB();
      const user = db.users.find(u => u.email.toLowerCase() === (body.email || '').toLowerCase());
      if (!user || user.password !== body.password) {
        return sendJson(401, { error: { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' } });
      }
      return sendJson(200, { token: `token-${user.id}`, user: { id: user.id, email: user.email, name: user.name } });
    }

    // 3. Get Me Portfolio
    if (pathname === '/api/portfolio/me' && req.method === 'GET') {
      const db = readDB();
      const authHeader = req.headers.authorization || '';
      const userId = authHeader.replace('Bearer token-', '') || 'user-demo';
      const portfolio = db.portfolios[userId] || db.portfolios['user-demo'] || samplePortfolios.fullstack;
      return sendJson(200, portfolio);
    }

    // 4. Update Portfolio
    if (pathname === '/api/portfolio/me' && req.method === 'PUT') {
      const db = readDB();
      const authHeader = req.headers.authorization || '';
      const userId = authHeader.replace('Bearer token-', '') || 'user-demo';

      if (body.slug) {
        body.slug = body.slug.toLowerCase().replace(/[^a-z0-9-]/g, '');
        // Compare by storage key (the owner), not p.user_id — seeded portfolios
        // carry a user_id that differs from their key, which made every save
        // of your own slug fail as "taken".
        const isDup = Object.entries(db.portfolios).some(([key, p]) => key !== userId && p.slug === body.slug);
        if (isDup) {
          return sendJson(400, { error: { code: 'SLUG_TAKEN', message: 'Slug taken' } });
        }
      }

      body.updated_at = new Date().toISOString();
      db.portfolios[userId] = { ...db.portfolios[userId], ...body };
      writeDB(db);

      if (body.slug) publicCache.delete(body.slug);
      return sendJson(200, { success: true, portfolio: db.portfolios[userId] });
    }

    // 5. Reorder
    if (pathname === '/api/portfolio/me/reorder' && req.method === 'POST') {
      const { section, items } = body;
      const db = readDB();
      const authHeader = req.headers.authorization || '';
      const userId = authHeader.replace('Bearer token-', '') || 'user-demo';
      const pf = db.portfolios[userId];
      if (pf && section && Array.isArray(items)) {
        pf[section] = items.map((item, idx) => ({ ...item, order_index: idx }));
        db.portfolios[userId] = pf;
        writeDB(db);
      }
      return sendJson(200, { success: true, section, count: (items || []).length });
    }

    // 6. Public slug endpoint (/api/public/:slug)
    if (pathname.startsWith('/api/public/') && req.method === 'GET') {
      const slug = pathname.replace('/api/public/', '').toLowerCase();
      if (publicCache.has(slug)) {
        return sendJson(200, publicCache.get(slug));
      }
      const db = readDB();
      const portfolio = Object.values(db.portfolios).find(p => p.slug === slug);
      if (!portfolio || portfolio.is_public === false) {
        return sendJson(404, { error: { code: 'NOT_FOUND', message: 'Portfolio not found or private.' } });
      }
      publicCache.set(slug, portfolio);
      return sendJson(200, portfolio);
    }

    // 7. AI Bullet Enhancer
    if (pathname === '/api/ai/enhance' && req.method === 'POST') {
      const { bulletText, role = '' } = body;
      const clean = (bulletText || '').trim();
      if (!clean) return sendJson(400, { error: { message: 'Bullet text required' } });

      const star = `Architected scalable solution for ${clean.replace(/\.$/, '')}, yielding a 42% reduction in latency and boosting team velocity by 3.5x.`;
      const metric = `Spearheaded optimization of ${clean.replace(/\.$/, '')}, eliminating recurring performance bottlenecks for 100k+ daily users.`;
      const exec = `Steered cross-functional technical initiatives surrounding ${clean.replace(/\.$/, '')}, exceeding enterprise delivery SLAs across 4 product releases.`;

      return sendJson(200, {
        original: clean,
        suggestions: [
          { id: 'star', title: 'STAR Method (Quantified Result)', text: star, badge: 'High Impact' },
          { id: 'metric', title: 'Metric & Performance Focus', text: metric, badge: 'Metrics' },
          { id: 'executive', title: 'Executive Strategic Tone', text: exec, badge: 'Leadership' }
        ]
      });
    }

    // 8. ATS Score Calculation
    if (pathname === '/api/ats/score' && req.method === 'POST') {
      const pf = body.portfolio || {};
      let score = 0;
      const breakdown = [];
      const suggestions = [];

      const profile = pf.profile || {};
      if (profile.fullName && profile.email && profile.bio && profile.title) {
        score += 25;
        breakdown.push({ item: 'Contact & Profile Completeness', points: 25, max: 25, status: 'pass' });
      } else {
        score += 15;
        breakdown.push({ item: 'Contact & Profile Completeness', points: 15, max: 25, status: 'warn' });
        suggestions.push('Complete your bio, title, and contact links.');
      }

      const exp = pf.experience || [];
      if (exp.length > 0) {
        score += 30;
        breakdown.push({ item: 'Action-Oriented Experience Bullets', points: 30, max: 30, status: 'pass' });
      } else {
        score += 10;
        breakdown.push({ item: 'Action-Oriented Experience Bullets', points: 10, max: 30, status: 'fail' });
        suggestions.push('Add experience entries with metrics and action verbs.');
      }

      const skills = pf.skills || [];
      if (skills.length >= 6) {
        score += 25;
        breakdown.push({ item: 'Core Technical Skills', points: 25, max: 25, status: 'pass' });
      } else {
        score += 15;
        breakdown.push({ item: 'Core Technical Skills', points: 15, max: 25, status: 'warn' });
        suggestions.push('Include 6+ technical skills.');
      }

      const projects = pf.projects || [];
      if (projects.length > 0) {
        score += 20;
        breakdown.push({ item: 'Featured Projects & Links', points: 20, max: 20, status: 'pass' });
      } else {
        score += 10;
        breakdown.push({ item: 'Featured Projects & Links', points: 10, max: 20, status: 'warn' });
        suggestions.push('Add demo links to your featured projects.');
      }

      return sendJson(200, {
        score: Math.min(100, score),
        breakdown,
        suggestions,
        missingKeywords: ['CI/CD', 'Docker', 'System Design', 'Agile', 'GraphQL'],
        grade: score >= 90 ? 'A+' : score >= 75 ? 'A' : 'B'
      });
    }

    // 9. Reset sample
    if (pathname === '/api/portfolio/reset' && req.method === 'POST') {
      const db = readDB();
      const authHeader = req.headers.authorization || '';
      const userId = authHeader.replace('Bearer token-', '') || 'user-demo';
      db.portfolios[userId] = JSON.parse(JSON.stringify(samplePortfolios.fullstack));
      writeDB(db);
      return sendJson(200, { success: true, portfolio: db.portfolios[userId] });
    }

    // 10a. HTML template library: list + inject + serve
    if (pathname === '/api/templates' && req.method === 'GET') {
      return sendJson(200, { count: TPL_CATALOG.length, templates: TPL_CATALOG });
    }

    // Deep demo-leftover audit across all templates: injects the sample
    // portfolio everywhere and flags surviving raw demo sentences, demo names,
    // lorem filler, or templates missing the user's real data.
    if (pathname === '/api/templates/audit' && req.method === 'POST') {
      const auditPf = Object.keys(body || {}).length ? body : samplePortfolios.fullstack;
      const t0 = Date.now();
      let bad = 0;
      const problems = [];
      for (const t of TPL_CATALOG) {
        try {
          const site = await injectTemplateSite(t.id, auditPf);
          if (!site) { bad++; problems.push({ id: t.id, issues: ['inject failed'] }); continue; }
          const dir = path.join(TPL_ROOT, t.id);
          const rawByFile = {};
          try {
            for (const f of fs.readdirSync(dir)) {
              if (/\.html?$/i.test(f)) rawByFile[f] = fs.readFileSync(path.join(dir, f), 'utf-8');
            }
          } catch {}
          const lists = resumeLists(auditPf);
          const userBlob = normText(JSON.stringify(lists));
          const issues = [];
          for (const f of site.files.filter(x => /\.html?$/i.test(x.path))) {
            const base = f.path.split('/').pop();
            const rawHtml = rawByFile[base] || '';
            const rawLines = stripTagsText(rawHtml).split('\n').map(l => l.replace(/\s+/g, ' ').trim()).filter(Boolean);
            const injectedLines = stripTagsText(f.content).split('\n').map(l => l.replace(/\s+/g, ' ').trim()).filter(Boolean);
            const injectedSet = new Set(injectedLines.map(normText));
            for (const line of injectedLines) {
              if (line.length < 24) continue;
              const n = normText(line);
              if (rawSetHas(rawLines, n) && !PURGE_CHROME_RE.some(re => re.test(n)) && !userBlob.includes(n)) {
                issues.push(`${base}: "${line.slice(0, 80)}"`);
                break;
              }
            }
            if (/lorem ipsum/i.test(f.content)) issues.push(`${base}: lorem ipsum`);
            if (!normText(stripTagsText(f.content)).includes(normText(auditPf.profile?.fullName || '')) && base === 'index.html') {
              issues.push(`${base}: user name missing`);
            }
          }
          const allOut = normText(site.files.map(f => stripTagsText(f.content)).join('\n'));
          if (lists.projects.length && !lists.projects.some(p => allOut.includes(normText(p.title)))) issues.push('no real project title anywhere');
          if (lists.skillsFlat.length && !lists.skillsFlat.some(s => allOut.includes(normText(s.name)))) issues.push('no real skill anywhere');
          if (issues.length) { bad++; problems.push({ id: t.id, issues: issues.slice(0, 4) }); }
        } catch (e) {
          bad++; problems.push({ id: t.id, issues: ['error: ' + e.message] });
        }
      }
      return sendJson(200, { ok: true, audited: TPL_CATALOG.length, bad, problems: problems.slice(0, 40), ms: Date.now() - t0 });
    }

    // ==================== UNIVERSAL COMPATIBILITY LAYER ====================
    // Registry listing (admin): all templates with statuses.
    if (pathname === '/api/registry/templates' && req.method === 'GET') {
      return sendJson(200, { ok: true, templates: registry.all().map(({ source_files, ...rest }) => rest) });
    }

    // End-user template picker: ONLY verified rows — the spec's hard filter,
    // enforced in data access, not the UI.
    if (pathname === '/api/templates-v2' && req.method === 'GET') {
      return sendJson(200, { ok: true, templates: registry.verifiedOnly().map(({ source_files, ...rest }) => rest) });
    }

    // Ingest a template directory from disk (Stages 1-3). Body:
    // { path, name?, source_repo_url? }
    if (pathname === '/api/registry/ingest' && req.method === 'POST') {
      try {
        const row = await ingestTemplate(String(body.path || ''), {
          id: body.id, name: body.name, source_repo_url: body.source_repo_url
        });
        const { source_files, ...rest } = row;
        return sendJson(200, { ok: true, template: rest });
      } catch (e) {
        return sendJson(400, { error: { message: e.message } });
      }
    }

    // Human review gate: approve / reject.
    if (/^\/api\/registry\/[\w-]+\/(approve|reject)$/.test(pathname) && req.method === 'POST') {
      const id = pathname.split('/')[3];
      const action = pathname.endsWith('/approve') ? 'verified' : 'rejected';
      const row = registry.setStatus(id, action, action === 'rejected'
        ? { reject_reason: String(body.reason || 'unspecified').slice(0, 500) }
        : { reviewed_at: new Date().toISOString() });
      if (!row) return sendJson(404, { error: { message: 'Unknown template id' } });
      return sendJson(200, { ok: true, template: { ...row, source_files: undefined } });
    }

    // Fit engine: fit the user's canonical data to a template's manifest.
    if (pathname === '/api/fit' && req.method === 'POST') {
      try {
        const row = registry.get(String(body.templateId || ''));
        if (!row) return sendJson(404, { error: { message: 'Unknown template id' } });
        const canonical = validateCanonical(toCanonical(body.portfolio || {}));
        const strategy = OVERFLOW_STRATEGIES.includes(body.overflowStrategy) ? body.overflowStrategy : 'condense-then-hide';
        const result = await fitContentToTemplate(canonical, row.manifest_json, {
          portfolioId: String(body.portfolioId || 'default'),
          templateId: row.id,
          overflowStrategy: strategy,
          condenseTarget: Number.isFinite(body.condenseTarget) ? body.condenseTarget : null
        });
        return sendJson(200, { ok: true, engine: row.manifest_json?.notes?.includes('Heuristic') ? 'heuristic' : 'claude', ...result });
      } catch (e) {
        return sendJson(400, { error: { message: e.message } });
      }
    }

    // Preview artifact: run the sandboxed adapter + return an isolated
    // srcdoc-able HTML document. Body: { templateId, portfolio }.
    if (pathname === '/api/templates-v2/preview' && req.method === 'POST') {
      try {
        const row = registry.get(String(body.templateId || ''));
        if (!row) return sendJson(404, { error: { message: 'Unknown template id' } });
        // body.canonical=true accepts already-canonical data (review-gate seeds)
        const canonical = validateCanonical(body.canonical ? body.portfolio : toCanonical(body.portfolio || {}));
        const fit = await fitContentToTemplate(canonical, row.manifest_json, {
          portfolioId: 'preview', templateId: row.id, overflowStrategy: 'condense-then-hide'
        });
        let html = null;
        if (row.stack === 'static' && row.adapter_code && row.source_files) {
          const entry = Object.keys(row.source_files).find((f) => /(^|\/)index\.html?$/i.test(f)) || Object.keys(row.source_files).find((f) => f.endsWith('.html'));
          const src = row.source_files[entry];
          const patched = runPatchAdapter(row.adapter_code, fit.fittedData, src);
          html = patched;
        } else if (row.bundle_path && row.adapter_code) {
          // Framework template: bundle + sandboxed adapter output. The bundle
          // reads window.__TEMPLATE_DATA__ (data slot); the adapter maps
          // canonical → the template's props shape. Demo data is the built-in
          // fallback, so a failed adapter render still shows the template.
          const raw = bundleHtml(row.id);
          let props = null;
          try { props = runPropsAdapter(row.adapter_code, fit.fittedData); } catch (e) {
            console.error(`[preview] adapter failed for ${row.id}: ${e.message}`);
          }
          html = raw.replace('/*DATA_SLOT*/', `window.__TEMPLATE_DATA__=${JSON.stringify(props).replace(/</g, '\\u003c')}`);
        } else if (row.bundle_path) {
          html = bundleHtml(row.id); // prebuilt esbuild artifact, iframe-isolated
        }
        if (!html) return sendJson(400, { error: { message: 'No render artifact for this template' } });
        return sendJson(200, { ok: true, html, fitReport: fit.fitReport });
      } catch (e) {
        return sendJson(400, { error: { message: e.message } });
      }
    }

    // Full site as a downloadable .zip (all pages, css, js, assets — injected)
    // NOTE: must be checked before the plain /api/templates/:id route.
    if (/^\/api\/templates\/.+\/zip$/.test(pathname) && req.method === 'POST') {
      const templateId = decodeURIComponent(pathname.replace('/api/templates/', '').replace(/\/zip$/, ''));
      const site = await injectTemplateSite(templateId, body);
      if (!site) return sendJson(404, { error: { message: 'Template not found: ' + templateId } });
      const zip = buildZip(site.files);
      res.writeHead(200, {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${templateId.replace(/[^\w.-]/g, '_')}-portfolio.zip"`,
        'Content-Length': zip.length
      });
      return res.end(zip);
    }

    // Injected template site as JSON (preview / client-side blob building)
    if (pathname.startsWith('/api/templates/') && req.method === 'POST') {
      const templateId = decodeURIComponent(pathname.replace('/api/templates/', ''));
      const site = await injectTemplateSite(templateId, body);
      if (!site) return sendJson(404, { error: { message: 'Template not found: ' + templateId } });
      return sendJson(200, { ok: true, template: site.entry, files: site.files, engine: site.engine });
    }

    // 10. Resume → structured data (the auto-generation pipeline core)
    if (pathname === '/api/parse-resume' && req.method === 'POST') {
      const rawText = String(body.text || '').slice(0, 30000); // ~8k tokens cap
      if (rawText.trim().length < 30) {
        return sendJson(400, { error: { message: 'Resume text too short to parse.' } });
      }

      const result = await parseResumeWithLLM(rawText);
      // Defensive: on any validation failure, fall back to heuristic parsing
      // rather than failing the whole upload.
      if (!result.ok) {
        const heuristic = heuristicParse(rawText);
        return sendJson(200, {
          ok: true,
          engine: 'heuristic',
          confidence: 'low',
          warnings: ['AI structuring was unavailable — fields were extracted heuristically. Please review everything carefully.'],
          data: heuristic
        });
      }
      return sendJson(200, result);
    }

    // Portfolio-website path: what the chosen design needs vs. the user's
    // data, with AI-written suggestions for the gaps. Body: { layoutId, portfolio }
    if (pathname === '/api/template-fit' && req.method === 'POST') {
      const plan = await buildFitPlan(body.portfolio || {}, String(body.layoutId || ''), { catalog: TPL_CATALOG, tplRoot: TPL_ROOT });
      return sendJson(plan.ok ? 200 : 404, plan.ok ? plan : { error: { message: plan.message } });
    }

    // Resume optimizer. Body: { resume (canonical), jobDescription }
    if (pathname === '/api/optimize' && req.method === 'POST') {
      const result = await optimizeResume(body);
      return sendJson(result.ok ? 200 : 400, result.ok ? result : { error: { message: result.message } });
    }

    // AI chat assistant. Body: { messages, portfolio, jobDescription }
    if (pathname === '/api/assistant/chat' && req.method === 'POST') {
      const result = await assistantChat(body);
      return sendJson(result.ok ? 200 : 400, result.ok ? result : { error: { message: result.message } });
    }

    // "Build tailored resume" path: JD gap analysis + suggested bio.
    // Body: { candidate, jobDescription }. Suggestions only — never saved here.
    if (pathname === '/api/tailor/analyze' && req.method === 'POST') {
      const jd = String(body.jobDescription || '');
      if (jd.trim().length < 40) {
        return sendJson(400, { error: { message: 'Paste a longer job description (at least a few lines).' } });
      }
      return sendJson(200, await analyzeJobFit(body.candidate || {}, jd));
    }

    // Opt-in per-bullet tailoring. Body: { bullet, jobDescription, role }
    if (pathname === '/api/tailor/bullet' && req.method === 'POST') {
      const result = await tailorBullet(body);
      return sendJson(result.ok ? 200 : 400, result.ok ? result : { error: { message: result.message } });
    }

    // Fallback 404
    return sendJson(404, { error: { message: 'Route not found' } });
  });
});

server.listen(PORT, () => {
  console.log(`Pure Native Node HTTP server running on http://localhost:${PORT}`);
});

// =====================================================================
// RESUME → STRUCTURED DATA PIPELINE
// Strict JSON-schema LLM extraction with a Zod-validated response and
// a heuristic regex fallback. The model is explicitly instructed to
// omit unknown fields rather than hallucinate — extracted data lands
// on a REVIEW screen and is never auto-published.
// =====================================================================
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5';

const ResumeSchema = z.object({
  profile: z.object({
    fullName: z.string().max(120).nullable().optional(),
    title: z.string().max(160).nullable().optional(),
    email: z.string().max(200).nullable().optional(),
    phone: z.string().max(60).nullable().optional(),
    location: z.string().max(200).nullable().optional(),
    githubUrl: z.string().max(500).nullable().optional(),
    linkedinUrl: z.string().max(500).nullable().optional(),
    websiteUrl: z.string().max(500).nullable().optional(),
    bio: z.string().max(2000).nullable().optional()
  }).default({}),
  education: z.array(z.object({
    institution: z.string().max(200).nullable().optional(),
    degree: z.string().max(200).nullable().optional(),
    field: z.string().max(200).nullable().optional(),
    startDate: z.string().max(40).nullable().optional(),
    endDate: z.string().max(40).nullable().optional(),
    grade: z.string().max(120).nullable().optional()
  })).max(10).default([]),
  experience: z.array(z.object({
    company: z.string().max(200).nullable().optional(),
    role: z.string().max(200).nullable().optional(),
    startDate: z.string().max(40).nullable().optional(),
    endDate: z.string().max(40).nullable().optional(),
    isCurrent: z.boolean().nullable().optional(),
    bullets: z.array(z.string().max(600)).max(12).default([])
  })).max(15).default([]),
  skills: z.array(z.object({
    name: z.string().max(80),
    category: z.string().max(60).nullable().optional()
  })).max(40).default([]),
  projects: z.array(z.object({
    title: z.string().max(200),
    description: z.string().max(1200).nullable().optional(),
    techStack: z.array(z.string().max(60)).max(15).default([]),
    liveUrl: z.string().max(500).nullable().optional(),
    githubUrl: z.string().max(500).nullable().optional()
  })).max(12).default([]),
  certifications: z.array(z.object({
    name: z.string().max(240),
    issuer: z.string().max(160).nullable().optional(),
    date: z.string().max(40).nullable().optional(),
    credentialUrl: z.string().max(500).nullable().optional()
  })).max(15).default([]),
  meta: z.object({
    lowConfidenceFields: z.array(z.string()).max(40).default([]),
    notes: z.string().max(500).nullable().optional()
  }).default({})
});

const EXTRACTION_SYSTEM_PROMPT = `You are a resume-structuring engine. Extract structured data from the resume text below into the exact JSON schema specified. Rules:
1. NEVER invent information. If a field is not present in the text, omit it or use null. An empty field is always better than a wrong one — this data becomes the person's public portfolio.
2. Preserve the person's original wording for bios and experience bullets. Do not rewrite, embellish, or add metrics that are not in the source.
3. Split distinct roles/projects into separate array entries when dates or titles indicate separate items — never merge multiple jobs into one blob.
4. If you cannot confidently tell whether a line belongs to experience vs education, make your best guess, put it in the more likely section, and add the field path (e.g. "experience[2].company") to meta.lowConfidenceFields.
5. Dates: keep the original format from the resume (e.g. "Jan 2020", "2020-03", "2019"). Use isCurrent=true only for roles explicitly marked Present/Current.
6. Skills: infer the category only when obvious (Frontend, Backend, Database, DevOps, ML, Design, Languages, Tools). Otherwise use null.
7. URLs: include only complete, well-formed URLs found verbatim in the text.
8. Respond with ONLY the JSON object. No markdown fences, no commentary.

JSON schema:
{
  "profile": { "fullName": string|null, "title": string|null, "email": string|null, "phone": string|null, "location": string|null, "githubUrl": string|null, "linkedinUrl": string|null, "websiteUrl": string|null, "bio": string|null },
  "education": [{ "institution": string|null, "degree": string|null, "field": string|null, "startDate": string|null, "endDate": string|null, "grade": string|null }],
  "experience": [{ "company": string|null, "role": string|null, "startDate": string|null, "endDate": string|null, "isCurrent": boolean|null, "bullets": string[] }],
  "skills": [{ "name": string, "category": string|null }],
  "projects": [{ "title": string, "description": string|null, "techStack": string[], "liveUrl": string|null, "githubUrl": string|null }],
  "certifications": [{ "name": string, "issuer": string|null, "date": string|null, "credentialUrl": string|null }],
  "meta": { "lowConfidenceFields": string[], "notes": string|null }
}`;

const callAnthropic = async (rawText) => {
  const res = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 4000,
      system: EXTRACTION_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `Resume text:\n\n${rawText}` }]
    })
  });
  if (!res.ok) throw new Error(`Anthropic API ${res.status}`);
  const json = await res.json();
  const text = (json.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
  // strip accidental fences
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('No JSON object in model response');
  return JSON.parse(cleaned.slice(start, end + 1));
};

// Heuristic fallback — plain regex parsing, clearly flagged as low-confidence
const heuristicParse = (rawText) => {
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
  const email = rawText.match(/[\w.+-]+@[\w-]+\.[\w.]+/)?.[0] || null;
  const urlFor = (re) => rawText.match(re)?.[0] || null;
  const phone = rawText.match(/(\+?\d[\d\s().-]{7,}\d)/)?.[0] || null;
  const location = rawText.match(/\b([A-Z][a-zA-Z.]+(?:\s[A-Z][a-zA-Z.]+)*,\s?(?:[A-Z]{2}|[A-Z][a-z]+))\b/)?.[1] || null;

  // ----------------------------------------------------------------
  // SECTION DETECTION — tolerant of decorations, numbering, casing
  // ----------------------------------------------------------------
  const cleanHeader = (l) => l.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9)]+$/g, '').replace(/^\d+[.)\s]+/, '').trim();
  const isHeader = (l, words) => {
    const c = cleanHeader(l).toLowerCase();
    return c.length < 40 && words.some(w => c === w || c.startsWith(w) || c.includes(w));
  };
  const sumIdx = lines.findIndex(l => isHeader(l, ['summary', 'objective', 'profile', 'about'])) && lines.findIndex(l => isHeader(l, ['summary', 'objective', 'about me', 'profile summary']));
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

  // ----------------------------------------------------------------
  // EXPERIENCE — split into jobs at role/company/date header lines.
  // A new job starts when a line contains a date range OR matches a
  // typical "Company — Role" / "Role at Company" shape.
  // ----------------------------------------------------------------
  const dateRangeRe = /\b(19|20)\d{2}\b|\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*(19|20)?\d{2}\b|\bpresent\b|\bcurrent\b/i;
  // split a "Company — Role" / "Role @ Company" / "Company - Role" line
  const splitRoleCompany = (s) => {
    const m = s.match(/^(.{2,60}?)\s+[—–|@]\s+(.{2,90})$/) || s.match(/^(.{2,90}?)\s+[—–|@]\s+(.{2,60})$/);
    if (m) return { company: m[1].trim(), role: m[2].trim() };
    // spaced plain hyphen ("Acme - Role") — unspaced hyphens (Full-Stack) are safe
    const dashM = s.match(/^(.{2,60}?)\s+-\s+(.{2,90})$/);
    if (dashM) return { company: dashM[1].trim(), role: dashM[2].trim() };
    const atM = s.match(/^(.{2,60}?)\s+\bat\s+(.{2,60})$/i);
    if (atM) return { company: atM[2].trim(), role: atM[1].trim() };
    // "Role, Company" or "Company, Role" — the side with a job word is the role
    const commaM = s.match(/^([^,]{2,80}),\s+([^,]{2,80})$/);
    if (commaM) {
      const ROLE_WORD = /\b(analyst|engineer|developer|manager|designer|intern|lead|consultant|specialist|scientist|director|officer|associate|architect|assistant|coordinator|administrator|executive|head|founder|researcher|teacher|accountant)\b/i;
      return ROLE_WORD.test(commaM[1]) || !ROLE_WORD.test(commaM[2])
        ? { role: commaM[1].trim(), company: commaM[2].trim() }
        : { role: commaM[2].trim(), company: commaM[1].trim() };
    }
    return { company: null, role: s.trim() };
  };
  // Whole date spans ("Jan 2022 - Present", "(2019 – 2021)") removed before
  // splitting role/company, so their dashes aren't mistaken for separators.
  const dateSpanRe = /\((?=[^)]*(?:19|20)\d{2}|[^)]*present)[^)]*\)|(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*)?(?:19|20)\d{2}(?:\s*(?:[-–—]|to)\s*(?:(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*)?(?:19|20)\d{2}|present|current))?|\bpresent\b|\bcurrent\b/gi;
  const extractDates = (line) => {
    const datePart = (line.match(/(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*(?:19|20)?\d{2}[^|·]*/i)?.[0]
      || line.match(/\b(?:19|20)\d{2}\s*[-–—]\s*(?:(?:19|20)\d{2}|present)\b/i)?.[0]
      || line.match(/\b(?:19|20)\d{2}\b[^|·]*/i)?.[0] || '').trim();
    // split at a spaced hyphen, an en/em dash, or "to" ("Jan 2022 - Present")
    const start = datePart.split(/\s+-\s+|\s*[–—]\s*|\s+to\s+/i)[0].replace(/[-–—\s]+$/, '').trim().slice(0, 40) || null;
    const end = (datePart.match(/[-–—]\s*([^|·]+)$/i)?.[1] || (/(present|current)/i.test(datePart) ? 'Present' : null));
    return { start: start ? start.replace(/[()[\]]/g, '').trim() || null : null, end: end ? String(end).replace(/[()[\]]/g, '').trim().slice(0, 40) : null };
  };

  const jobs = [];
  expLines.forEach((line) => {
    const hasDate = dateRangeRe.test(line);
    const isBullet = /^[-•*·>|]/.test(line) || /^[a-z]/.test(line);
    const locMatch = line.match(/\b([A-Z][a-zA-Z.]+(?:\s[A-Z][a-zA-Z.]+)*,\s?(?:[A-Z]{2}|[A-Z][a-z]+))\b/);

    if (isBullet && jobs.length) {
      jobs[jobs.length - 1].bullets.push(line.replace(/^[-•*·>|]\s*/, '').slice(0, 600));
    } else if (hasDate && !isBullet) {
      const dates = extractDates(line);
      const mainClean = line.split(/\s*[|·]\s*/)[0].replace(dateSpanRe, '').replace(/[\s,|·\-–—()]+$/, '').trim();
      const prev = jobs[jobs.length - 1];
      // If the previous entry is a header line still missing dates, this
      // date line belongs to it (two-line job header format).
      if (prev && (prev.startDate === null && prev.endDate === null && prev.bullets.length === 0)) {
        prev.startDate = dates.start;
        prev.endDate = dates.end;
        prev.isCurrent = /present|current/i.test(line);
        if (locMatch && !prev.location) prev.location = locMatch[1];
        // if prev came from a bare line, try company/role split now
        if (!prev.company) {
          const sc = splitRoleCompany(prev.role || mainClean);
          prev.company = sc.company;
          prev.role = sc.role.slice(0, 200);
        }
      } else {
        const sc = splitRoleCompany(mainClean);
        jobs.push({
          company: sc.company,
          role: sc.role.slice(0, 200),
          startDate: dates.start,
          endDate: dates.end,
          isCurrent: /present|current/i.test(line),
          bullets: [],
          location: locMatch?.[1] || null
        });
      }
    } else if (!isBullet) {
      const sc = splitRoleCompany(line);
      jobs.push({
        company: sc.company,
        role: sc.role.slice(0, 200),
        startDate: null,
        endDate: null,
        isCurrent: false,
        bullets: [],
        location: locMatch?.[1] || null
      });
    }
  });
  // drop any job with no role text at all
  jobs.filter(j => (j.role && j.role.length > 1) || j.bullets.length);

  // ----------------------------------------------------------------
  // EDUCATION — split at institution-ish lines (contains a school
  // keyword or an em-dash with degree), capture degree + years + GPA
  // ----------------------------------------------------------------
  const schools = [];
  eduLines.forEach((line) => {
    const hasYears = /\b(19|20)\d{2}\b/.test(line);
    const isSchoolish = /university|college|institute|school|academy|polytechnic|b\.?tech|m\.?tech|b\.?s\b|b\.?a\b|m\.?s\b|ph\.?d|mba|associate|diploma/i.test(line);
    const prev = schools[schools.length - 1];
    // A line with years/GPA but no school words is metadata for the
    // previous school, not a new entry.
    if (prev && hasYears && !isSchoolish) {
      prev.raw += ' ' + line;
    } else if (isSchoolish || (!prev && hasYears) || /^[-•*·>|]/.test(line) === false && !prev) {
      schools.push({ raw: line, _bullets: [] });
    } else if (prev) {
      prev.raw += ' ' + line;
    } else {
      schools.push({ raw: line, _bullets: [] });
    }
  });

  // ----------------------------------------------------------------
  // PROJECTS — split at "Title — description" lines; capture URLs,
  // tech tags (Tech:/Technologies:/Stack:), and continuation prose
  // ----------------------------------------------------------------
  const projects = [];
  projLines.forEach((line) => {
    const isBullet = /^[-•*·>|]/.test(line);
    const isNew = !isBullet && (projects.length === 0 || /[-–—|:]\s/.test(line.slice(0, 90)) || /[-–—|:]$/.test(line.slice(0, 90)));
    if (isNew) {
      // "Title — description" / "Title: description" / "Title - description"
      const splitM = line.match(/^(.{2,60}?)\s*[—–]\s*(.+)$/) || line.match(/^(.{2,60}?)\s+-\s+(.+)$/) || line.match(/^(.{2,60}?):\s+(.+)$/);
      const title = (splitM ? splitM[1] : line).replace(/^\d+[.)\s]+/, '').trim().slice(0, 200);
      const rest = splitM ? splitM[2] : '';
      projects.push({ title, description: rest.trim().slice(0, 1200) || null, techStack: [], liveUrl: null, githubUrl: null, _rest: rest || '' });
    } else if (projects.length) {
      const last = projects[projects.length - 1];
      const cleanLine = line.replace(/^[-•*·>|]\s*/, '');
      last._rest = (last._rest || '') + ' ' + cleanLine;
      last.description = ((last.description || '') + ' ' + cleanLine).trim().slice(0, 1200);
    }
  });
  projects.forEach(p => {
    const rest = p._rest || '';
    // URLs are scoped to THIS project's text only; bare domains get https://
    const rawUrls = rest.match(/(?:https?:\/\/)?(?:www\.)?[^\s,|)]+\.[a-z]{2,}\/[^\s,|)]*/gi) || [];
    const urls = rawUrls.map(u => /^https?:/i.test(u) ? u : 'https://' + u.replace(/^www\./i, ''));
    p.githubUrl = urls.find(u => /github\.com/i.test(u)) || null;
    p.liveUrl = urls.find(u => !/github\.com/i.test(u)) || null;
    // remove URLs before splitting tech tags so fragments don't leak in
    const techSource = rest.replace(/https?:\/\/[^\s,|)]+/gi, '');
    const techMatch = techSource.match(/(?:tech(?:nologies)?|stack|built with)\s*[:–—-]\s*([^|]+)/i);
    if (techMatch) {
      p.techStack = techMatch[1].split(/[,|/]/).map(t => t.trim().replace(/\.\s*$/, ''))
        .filter(t => t && t.length < 40 && !/\s{2,}/.test(t)).slice(0, 15);
      p.description = (p.description || '')
        .replace(/\s*Tech\s*[:\u2013\u2014-][^|]*/i, '')
        .replace(/\s*\|\s*https?:\/\/[^\s|)]*/gi, '')   // strip trailing url pipes
        .replace(/\|\s*$/, '')
        .replace(/\s{2,}/g, ' ')
        .trim() || null;
    }
    delete p._rest;
  });

  // ----------------------------------------------------------------
  // CERTIFICATIONS — lines with cert keywords; "Name, Issuer, Date"
  // ----------------------------------------------------------------
  const certifications = certLines
    .filter(l => !isHeader(l, ['certifications', 'certificates']))
    .map(l => l.replace(/^[-•*·>|]\s*/, '').replace(/^\d+[.)]\s*/, ''))
    .filter(l => l.length > 4)
    .slice(0, 15)
    .map(l => {
      const parts = l.split(',').map(s => s.trim());
      const name = parts[0] || l;
      const issuer = parts.length > 1 ? parts[1] : null;
      const date = parts.find(p => /\b(19|20)\d{2}\b/.test(p) && p !== parts[0] && p !== issuer) || l.match(/\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(?:19|20)?\d{2}\b/i)?.[0] || null;
      return { name: name.slice(0, 240), issuer, date };
    });

  // ----------------------------------------------------------------
  // SKILLS — split across lines and delimiters; categorize by keyword
  // ----------------------------------------------------------------
  const SKILL_CATS = [
    ['Frontend', /react|next\.?js|vue|angular|svelte|html|css|tailwind|redux|frontend|front-end/i],
    ['Backend', /node|express|django|flask|spring|laravel|rails|graphql|api|backend|back-end|microservices/i],
    ['Database', /sql|postgres|mysql|mongo|redis|dynamodb|firebase|database|supabase/i],
    ['DevOps', /docker|kubernetes|aws|azure|gcp|ci\/cd|jenkins|terraform|devops|linux|nginx/i],
    ['ML', /pytorch|tensorflow|machine learning|deep learning|nlp|llm|ai\/ml|pandas|numpy/i],
    ['Languages', /javascript|typescript|python|java\b|c\+\+|c#|go\b|rust|ruby|php|kotlin|swift/i],
    ['Design', /figma|sketch|adobe|ui\/ux|design system|prototyp/i],
    ['Tools', /git|github|gitlab|jira|postman|webpack|vite|jest|agile|scrum/i]
  ];
  const categorize = (name) => {
    for (const [cat, re] of SKILL_CATS) if (re.test(name)) return cat;
    return null;
  };
  const skills = [...new Set(
    skillLines.join('\n')
      .split(/[,•|·/\n]/)
      .map(s => s.replace(/^[-*]\s*/, '').trim())
      .filter(s => s && s.length > 1 && s.length < 60 && !/^(skills|technologies|tools)$/i.test(s))
  )].slice(0, 40).map(name => ({ name, category: categorize(name) }));

  // Low-confidence: everything heuristic — but at least the parser is
  // section-aware now, so the flags inform rather than alarm.
  const lowConfidenceFields = [];
  jobs.forEach((j, i) => { if (!j.company) lowConfidenceFields.push(`experience[${i}].company`); });
  schools.forEach((s, i) => { lowConfidenceFields.push(`education[${i}].degree`); });
  if (!location) lowConfidenceFields.push('profile.location');
  if (!bioLines.length) lowConfidenceFields.push('profile.bio');

  return {
    profile: {
      fullName: lines[0] && lines[0].length < 60 && !dateRangeRe.test(lines[0]) ? lines[0] : null,
      title: lines.slice(0, 4).find(l => l !== lines[0] && l.length < 100 && !dateRangeRe.test(l) && !isHeader(l, ['summary', 'experience', 'education', 'skills', 'contact'])) || null,
      email,
      phone,
      location,
      githubUrl: (() => {
        // Prefer the profile's own GitHub (header lines / labeled) over
        // project repo links that appear later in the resume.
        const headerZone = lines.slice(0, 6).join('\n');
        const withProto = headerZone.match(/https?:\/\/(www\.)?github\.com\/[\w-]+/i)?.[0];
        const bare = headerZone.match(/\bgithub\.com\/[\w-]+/i)?.[0];
        const labeled = rawText.match(/github\s*[:\-]\s*(?:https?:\/\/)?(?:www\.)?(github\.com\/[\w-]+)/i)?.[1];
        const chosen = withProto || bare || labeled;
        return chosen ? (chosen.startsWith('http') ? chosen : 'https://' + chosen) : null;
      })(),
      linkedinUrl: urlFor(/https?:\/\/(www\.)?linkedin\.com\/(in|pub)\/[\w-]+/i) || (() => { const b = rawText.match(/\blinkedin\.com\/(?:in|pub)\/[\w-]+/i)?.[0]; return b ? 'https://' + b : null; })(),
      websiteUrl: urlFor(/https?:\/\/(?!.*(?:github|linkedin))[^\s,)]+/i) || (() => { const b = lines.slice(0, 6).map(l => l.match(/\bwebsite\s*[:\-]?\s*([\w.-]+\.[a-z]{2,})\b/i)?.[1]).find(Boolean); return b ? 'https://' + b : null; })(),
      bio: bioLines.length ? bioLines.join(' ').slice(0, 2000) : null
    },
    education: schools.slice(0, 8).map(s => {
      const raw = s.raw;
      const years = raw.match(/\b((?:19|20)\d{2})\s*[-–—]\s*((?:19|20)\d{2}|present)\b/i) || raw.match(/\b((?:19|20)\d{2})\b/g) || [];
      const grade = raw.match(/\b(gpa[:\s]*[0-9.]+\s*\/?\s*[0-9.]*| [0-9]\.\d\d?\s*\/\s*4\.0)/i)?.[1]?.trim() || raw.match(/\b(magna cum laude|summa cum laude|cum laude|first class|distinction)\b/i)?.[1] || null;
      const dashSplit = raw.split(/\s+[—–]\s+|\s+-\s+/);
      const institution = (dashSplit[0] || raw).trim().slice(0, 200);
      const degreePart = dashSplit.slice(1).join(' — ').trim();
      const degreeMatch = (degreePart || raw).match(/\b(B\.?Tech|M\.?Tech|B\.?S\.?c?|B\.?A\.?|M\.?S\.?c?|M\.?A\.?|Ph\.?D|MBA|Associate|Diploma|Certificate)\b[^,–—|]*/i);
      const degreeClean = degreeMatch ? degreeMatch[0].replace(/\s*\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*(?:19|20)?\d{2}\b.*/i, '').replace(/\s*\b(19|20)\d{2}\b\s*$/, '').trim() : null;
      const fieldClean = degreePart ?
        degreePart
          .replace(degreeMatch?.[0] || '', '')
          .replace(/\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*(?:19|20)?\d{2}\b/gi, '')
          .replace(/\b(19|20)\d{2}\b/g, '')
          .replace(/[—–]\s*.*$/, '')
          .replace(/^[\s,—–|]+|[\s,|]+$/g, '')
          .trim() || null
        : null;
      return {
        institution,
        degree: degreeClean ? degreeClean.slice(0, 200) : (degreePart && !/\b(19|20)\d{2}\b/.test(degreePart) ? degreePart.slice(0, 200) : null),
        field: fieldClean,
        startDate: Array.isArray(years) ? (years[0] || null) : (years[1] || null),
        endDate: Array.isArray(years) ? (years[1] || null) : null,
        grade: grade ? String(grade).trim() : null
      };
    }),
    experience: jobs.slice(0, 15).map(j => ({
      company: j.company,
      role: j.role,
      startDate: j.startDate,
      endDate: j.endDate,
      isCurrent: j.isCurrent,
      bullets: j.bullets,
      location: j._location || undefined
    })),
    skills,
    projects: projects.slice(0, 12).map(p => ({
      title: p.title,
      description: p.description,
      techStack: p.techStack,
      liveUrl: p.liveUrl,
      githubUrl: p.githubUrl
    })),
    certifications,
    meta: {
      lowConfidenceFields,
      notes: 'Extracted heuristically (no AI key configured). Section-aware parsing — still verify dates and company names.'
    }
  };
};

const parseResumeWithLLM = async (rawText) => {
  if (!ANTHROPIC_API_KEY) {
    return { ok: false, reason: 'no-api-key' };
  }
  try {
    const parsed = await callAnthropic(rawText);
    const validated = ResumeSchema.parse(parsed);
    const lowConf = validated.meta?.lowConfidenceFields || [];
    return {
      ok: true,
      engine: 'claude',
      model: ANTHROPIC_MODEL,
      confidence: lowConf.length > 6 ? 'medium' : 'high',
      warnings: [],
      data: validated
    };
  } catch (err) {
    console.error('parse-resume LLM failed:', err.message);
    return { ok: false, reason: err.message };
  }
};
