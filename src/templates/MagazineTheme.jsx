import React from 'react';
import { Mail, Globe } from 'lucide-react';

// Magazine Editorial — art-directed print spread (2026 "Editorial Brutalism"
// magazine trend): masthead rule, serif display + sans body pairing, drop
// cap, asymmetric two-column text, pull quote, numbered folios.
const INK = '#1A1A18';
const ACCENT = '#C24A2E'; // editorial rust red

export const MagazineTheme = ({ portfolio }) => {
  const { profile = {}, experience = [], education = [], skills = [], projects = [], certifications = [] } = portfolio;
  const firstName = (profile.fullName || 'Portfolio').split(' ')[0];
  const bioWords = (profile.bio || '').split(' ');
  const dropCapWord = bioWords.slice(0, 1).join(' ');
  const dropCapLetter = (dropCapWord[0] || 'A');
  const dropCapRest = dropCapWord.slice(1);
  const bioRest = bioWords.slice(1).join(' ');
  const midBio = Math.floor(bioRest.length / 2);
  const bioCol1 = bioRest.slice(0, midBio);
  const bioCol2 = bioRest.slice(midBio);

  const SectionHead = ({ num, title }) => (
    <div className="flex items-baseline gap-3 mt-14 mb-5">
      <span className="text-[10px] font-bold tracking-[0.3em]" style={{ color: ACCENT }}>{num}</span>
      <h2 className="font-syne text-xl font-black uppercase tracking-tight">{title}</h2>
      <span className="flex-1 h-[2px] self-center" style={{ backgroundColor: INK }} />
      <span className="text-[10px] tracking-[0.2em] uppercase" style={{ color: '#8A8578' }}>p.{num}</span>
    </div>
  );

  return (
    <div className="min-h-full font-outfit" style={{ backgroundColor: '#F7F4EC', color: INK }}>
      <div className="max-w-5xl mx-auto px-6 sm:px-12 py-10">

        {/* Masthead */}
        <header className="border-y-[3px] py-4 mb-10" style={{ borderColor: INK }}>
          <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.25em]" style={{ color: '#8A8578' }}>
            <span>Issue No. 01</span>
            <span className="hidden sm:inline">A Portfolio Publication</span>
            <span>{new Date().getFullYear()}</span>
          </div>
          <h1 className="text-center font-playfair text-5xl sm:text-7xl font-bold tracking-tight mt-3 leading-none">
            {firstName}
          </h1>
          <div className="flex items-center justify-center gap-3 mt-3 text-[11px] uppercase tracking-[0.2em]">
            <span className="h-px w-8" style={{ backgroundColor: INK }} />
            <span className="font-semibold">{profile.title}</span>
            <span className="h-px w-8" style={{ backgroundColor: INK }} />
          </div>
        </header>

        {/* Lede with drop cap — asymmetric editorial columns */}
        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-12 md:col-span-4">
            {profile.avatarUrl && (
              <figure className="mb-4">
                <img
                  src={profile.avatarUrl}
                  alt={profile.fullName}
                  className="w-full aspect-[4/5] object-cover"
                  style={{ filter: 'sepia(0.15) contrast(1.05)' }}
                />
                <figcaption className="text-[9px] uppercase tracking-[0.2em] mt-1.5" style={{ color: '#8A8578' }}>
                  Fig. 01 — {profile.fullName}, {profile.location || 'loc. varies'}
                </figcaption>
              </figure>
            )}
            <div className="space-y-1 text-xs border-t pt-3" style={{ borderColor: 'rgba(26,26,24,0.2)' }}>
              {profile.email && <p><span className="font-bold uppercase text-[9px] tracking-widest" style={{ color: ACCENT }}>Mail</span> — {profile.email}</p>}
              {profile.website && <p className="flex items-center gap-1"><span className="font-bold uppercase text-[9px] tracking-widest" style={{ color: ACCENT }}>Web</span> — {profile.website} <Globe className="w-3 h-3 inline" /></p>}
              {profile.statusPill && <p className="font-playfair italic text-sm pt-1">{profile.statusPill}</p>}
            </div>
          </div>

          <div className="col-span-12 md:col-span-8">
            <p className="font-playfair text-lg leading-relaxed" style={{ textIndent: 0 }}>
              <span
                className="float-left font-playfair font-bold leading-[0.8] mr-2 mt-1"
                style={{ fontSize: '4.2rem', color: ACCENT }}
              >
                {dropCapLetter}
              </span>
              <span className="font-semibold">{dropCapRest}</span> {bioCol1}
            </p>
            <p className="text-sm leading-loose mt-4" style={{ color: 'rgba(26,26,24,0.8)' }}>
              {bioCol2}
            </p>

            {/* Pull quote */}
            <blockquote className="my-8 pl-6 border-l-4" style={{ borderColor: ACCENT }}>
              <p className="font-playfair italic text-2xl leading-snug">
                "{bioWords.slice(0, 12).join(' ')}…"
              </p>
            </blockquote>

            {/* Byline chips */}
            {skills.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-6">
                {skills.slice(0, 8).map((sk, i) => (
                  <span key={i} className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 border" style={{ borderColor: 'rgba(26,26,24,0.3)' }}>
                    {sk.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* FEATURES (Projects) — magazine spread cards */}
        {projects.length > 0 && (
          <section>
            <SectionHead num="01" title="Feature Stories" />
            <div className="space-y-8">
              {projects.map((proj, idx) => (
                <article key={idx} className={`grid grid-cols-12 gap-6 items-start ${idx % 2 === 1 ? '' : ''}`}>
                  {proj.imageUrl && (
                    <div className={`col-span-12 sm:col-span-5 ${idx % 2 === 1 ? 'sm:order-2' : ''}`}>
                      <img
                        src={proj.imageUrl}
                        alt={proj.title}
                        className="w-full aspect-[4/3] object-cover"
                        style={{ filter: 'sepia(0.1) contrast(1.02)' }}
                      />
                    </div>
                  )}
                  <div className={`col-span-12 ${proj.imageUrl ? 'sm:col-span-7' : 'sm:col-span-12'} space-y-2`}>
                    <div className="flex items-baseline gap-3">
                      <span className="font-playfair text-3xl font-bold" style={{ color: 'rgba(26,26,24,0.2)' }}>
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <h3 className="font-playfair text-2xl font-bold leading-tight">{proj.title}</h3>
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: ACCENT }}>
                      {(proj.techTags || []).join(' / ')}
                    </p>
                    <p className="text-sm leading-loose" style={{ color: 'rgba(26,26,24,0.85)' }}>
                      {proj.description}
                    </p>
                    <div className="flex gap-4 pt-1 text-xs">
                      {proj.liveUrl && <a href={proj.liveUrl} target="_blank" rel="noreferrer" className="underline underline-offset-4 font-semibold" style={{ color: INK }}>Read the story →</a>}
                      {proj.githubUrl && <a href={proj.githubUrl} target="_blank" rel="noreferrer" className="underline underline-offset-4" style={{ color: '#8A8578' }}>Source</a>}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* EXPERIENCE — columns like a features list */}
        {experience.length > 0 && (
          <section>
            <SectionHead num="02" title="The Body of Work" />
            <div className="columns-1 md:columns-2 gap-10 space-y-6">
              {experience.map((job, idx) => (
                <div key={idx} className="break-inside-avoid space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: '#8A8578' }}>
                    {job.start} — {job.end}
                  </p>
                  <h3 className="font-playfair text-lg font-bold leading-tight">{job.role}</h3>
                  <p className="text-xs font-semibold" style={{ color: ACCENT }}>{job.company}</p>
                  <ul className="text-xs leading-relaxed space-y-1 mt-1" style={{ color: 'rgba(26,26,24,0.8)' }}>
                    {(job.bullets || []).slice(0, 3).map((b, i) => (
                      <li key={i} className="pl-3 border-l" style={{ borderColor: 'rgba(26,26,24,0.2)' }}>{b}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* EDUCATION + CERTS — classifieds style */}
        {(education.length > 0 || certifications.length > 0) && (
          <section>
            <SectionHead num="03" title="Credentials" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-px" style={{ backgroundColor: 'rgba(26,26,24,0.25)' }}>
              {[...education.map(e => ({ type: 'Edu', ...e })), ...certifications.map(c => ({ type: 'Cert', ...c }))].map((item, i) => (
                <div key={i} className="p-5 space-y-1" style={{ backgroundColor: '#F7F4EC' }}>
                  <p className="text-[9px] font-bold uppercase tracking-[0.25em]" style={{ color: ACCENT }}>{item.type}</p>
                  <h4 className="font-playfair text-base font-bold leading-snug">{item.name || `${item.degree}${item.field ? `, ${item.field}` : ''}`}</h4>
                  <p className="text-xs" style={{ color: 'rgba(26,26,24,0.7)' }}>
                    {item.institution || item.issuer} · {item.date || `${item.start}—${item.end}`}
                    {item.grade ? ` · ${item.grade}` : ''}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Colophon footer */}
        <footer className="mt-16 border-t-[3px] pt-4 pb-2" style={{ borderColor: INK }}>
          <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.25em]" style={{ color: '#8A8578' }}>
            <span>{profile.fullName || 'Portfolio'}</span>
            {profile.email && (
              <a href={`mailto:${profile.email}`} className="flex items-center gap-1 hover:opacity-70">
                <Mail className="w-3 h-3" /> Letters welcome
              </a>
            )}
            <span>Printed with Aura</span>
          </div>
        </footer>
      </div>
    </div>
  );
};
