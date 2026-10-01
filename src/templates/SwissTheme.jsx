import React from 'react';
import { ExternalLink, Github, Mail } from 'lucide-react';

// Swiss Grid — International Typographic Style: white ground, strict grid,
// Helvetica-like Outfit grotesk, oversized black type, one red accent.
const RED = '#E11D2E';
const INKBLACK = '#111111';

export const SwissTheme = ({ portfolio }) => {
  const { profile = {}, experience = [], education = [], skills = [], projects = [], certifications = [] } = portfolio;

  return (
    <div className="min-h-full font-outfit" style={{ backgroundColor: '#FAFAF7', color: INKBLACK }}>
      <div className="max-w-5xl mx-auto px-6 sm:px-10 py-12">

        {/* Masthead — grid-ruled */}
        <header className="border-b-2 pb-6" style={{ borderColor: INKBLACK }}>
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 md:col-span-9">
              <h1
                className="font-syne font-black uppercase leading-[0.9] tracking-tight"
                style={{ fontSize: 'clamp(2.8rem, 9vw, 7rem)' }}
              >
                {profile.fullName || 'Your Name'}
              </h1>
            </div>
            <div className="col-span-12 md:col-span-3 flex md:flex-col justify-between gap-4 text-[11px] font-medium uppercase tracking-wider">
              <span style={{ color: RED }}>{profile.title}</span>
              {profile.location && <span>{profile.location}</span>}
              <span>{profile.email}</span>
            </div>
          </div>
        </header>

        {/* Statement */}
        <section className="grid grid-cols-12 gap-4 py-10 border-b" style={{ borderColor: 'rgba(17,17,17,0.15)' }}>
          <span className="col-span-12 md:col-span-3 text-[10px] font-bold uppercase tracking-[0.25em]">01 / Statement</span>
          <p className="col-span-12 md:col-span-9 text-base sm:text-lg leading-snug font-medium max-w-2xl">
            {profile.bio}
          </p>
        </section>

        {/* Experience — table-like rows */}
        {experience.length > 0 && (
          <section className="py-10 border-b" style={{ borderColor: 'rgba(17,17,17,0.15)' }}>
            <div className="grid grid-cols-12 gap-4">
              <span className="col-span-12 md:col-span-3 text-[10px] font-bold uppercase tracking-[0.25em]">02 / Experience</span>
              <div className="col-span-12 md:col-span-9 space-y-0">
                {experience.map((job, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-3 py-4 border-b last:border-b-0" style={{ borderColor: 'rgba(17,17,17,0.15)' }}>
                    <div className="col-span-12 sm:col-span-3 text-[11px] font-semibold uppercase tracking-wide">
                      {job.start}—{job.end}
                    </div>
                    <div className="col-span-12 sm:col-span-9">
                      <h3 className="text-base font-bold">{job.role}</h3>
                      <p className="text-xs font-medium" style={{ color: RED }}>{job.company}</p>
                      <ul className="mt-2 space-y-1">
                        {(job.bullets || []).map((b, i) => (
                          <li key={i} className="text-xs leading-relaxed flex gap-2">
                            <span className="shrink-0" style={{ color: RED }}>—</span>
                            <span style={{ color: 'rgba(17,17,17,0.75)' }}>{b}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Projects — hard-edged grid */}
        {projects.length > 0 && (
          <section className="py-10 border-b" style={{ borderColor: 'rgba(17,17,17,0.15)' }}>
            <div className="grid grid-cols-12 gap-4">
              <span className="col-span-12 md:col-span-3 text-[10px] font-bold uppercase tracking-[0.25em]">03 / Work</span>
              <div className="col-span-12 md:col-span-9 grid grid-cols-1 sm:grid-cols-2 gap-px" style={{ backgroundColor: 'rgba(17,17,17,0.15)' }}>
                {projects.map((proj, idx) => (
                  <div key={idx} className="p-5 space-y-2 group" style={{ backgroundColor: '#FAFAF7' }}>
                    {proj.imageUrl && (
                      <div className="overflow-hidden mb-2">
                        <img
                          src={proj.imageUrl}
                          alt={proj.title}
                          className="w-full h-36 object-cover"
                          style={{ filter: 'grayscale(1) contrast(1.1)', transition: 'filter 0.3s ease' }}
                          onMouseEnter={(e) => { e.currentTarget.style.filter = 'grayscale(0)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.filter = 'grayscale(1) contrast(1.1)'; }}
                        />
                      </div>
                    )}
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-syne text-base font-black uppercase leading-tight">{proj.title}</h3>
                      <div className="flex gap-2 shrink-0">
                        {proj.liveUrl && <a href={proj.liveUrl} target="_blank" rel="noreferrer" title="Live" className="hover:opacity-70"><ExternalLink className="w-3.5 h-3.5" /></a>}
                        {proj.githubUrl && <a href={proj.githubUrl} target="_blank" rel="noreferrer" title="Source" className="hover:opacity-70"><Github className="w-3.5 h-3.5" /></a>}
                      </div>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: 'rgba(17,17,17,0.7)' }}>{proj.description}</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1 text-[10px] font-semibold uppercase tracking-wide">
                      {(proj.techTags || []).map((t, i) => (
                        <span key={i}>{t}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Skills — numeric index list */}
        {skills.length > 0 && (
          <section className="py-10 border-b" style={{ borderColor: 'rgba(17,17,17,0.15)' }}>
            <div className="grid grid-cols-12 gap-4">
              <span className="col-span-12 md:col-span-3 text-[10px] font-bold uppercase tracking-[0.25em]">04 / Capabilities</span>
              <div className="col-span-12 md:col-span-9">
                {(skills.map(sk => sk.category).filter((c, i, a) => a.indexOf(c) === i)).map((cat) => (
                  <div key={cat} className="grid grid-cols-12 gap-3 py-2 border-b last:border-b-0" style={{ borderColor: 'rgba(17,17,17,0.15)' }}>
                    <span className="col-span-12 sm:col-span-3 text-[11px] font-bold uppercase" style={{ color: RED }}>{cat}</span>
                    <p className="col-span-12 sm:col-span-9 text-xs font-medium">
                      {skills.filter(sk => sk.category === cat).map(sk => sk.name).join(' · ')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Education + Certs */}
        {(education.length > 0 || certifications.length > 0) && (
          <section className="py-10 border-b" style={{ borderColor: 'rgba(17,17,17,0.15)' }}>
            <div className="grid grid-cols-12 gap-4">
              <span className="col-span-12 md:col-span-3 text-[10px] font-bold uppercase tracking-[0.25em]">05 / Credentials</span>
              <div className="col-span-12 md:col-span-9 grid grid-cols-1 sm:grid-cols-2 gap-6">
                {education.map((edu, i) => (
                  <div key={`e${i}`} className="space-y-0.5">
                    <h4 className="text-sm font-bold">{edu.degree}{edu.field ? `, ${edu.field}` : ''}</h4>
                    <p className="text-xs" style={{ color: RED }}>{edu.institution}</p>
                    <p className="text-[11px]" style={{ color: 'rgba(17,17,17,0.6)' }}>{edu.start}—{edu.end}{edu.grade ? ` · ${edu.grade}` : ''}</p>
                  </div>
                ))}
                {certifications.map((c, i) => (
                  <div key={`c${i}`} className="space-y-0.5">
                    <h4 className="text-sm font-bold">{c.name}</h4>
                    <p className="text-[11px]" style={{ color: 'rgba(17,17,17,0.6)' }}>{c.issuer} · {c.date}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        <footer className="flex items-center justify-between py-8 text-[10px] font-bold uppercase tracking-[0.25em]">
          <span>{profile.fullName || 'Portfolio'} — {new Date().getFullYear()}</span>
          {profile.email && (
            <a href={`mailto:${profile.email}`} className="inline-flex items-center gap-1.5 hover:opacity-70">
              <Mail className="w-3 h-3" /> Contact
            </a>
          )}
        </footer>
      </div>
    </div>
  );
};
