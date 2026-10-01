import React from 'react';
import { Github, Linkedin, Twitter, Globe, Mail, MapPin, ExternalLink } from 'lucide-react';

// Noir Spotlight — the cinematic login/resume stage carried into a portfolio:
// near-black stage, spotlight cone, glass panels, monochrome + one spot-blue accent.
const ACCENT = '#7FA8E8';
const INK = '#06060A';
const PAPER = '#F5F5F7';
const CHROME = '#6B7280';

const GlassCard = ({ children, className = '', style = {} }) => (
  <div
    className={`rounded-xl ${className}`}
    style={{
      background: 'rgba(20, 20, 26, 0.45)',
      backdropFilter: 'blur(24px) saturate(140%)',
      WebkitBackdropFilter: 'blur(24px) saturate(140%)',
      border: '1px solid rgba(255, 255, 255, 0.10)',
      ...style
    }}
  >
    {children}
  </div>
);

const SectionLabel = ({ index, title }) => (
  <div className="flex items-center gap-3 mb-6">
    <span className="text-[10px] font-bold tracking-[0.25em] uppercase" style={{ color: ACCENT }}>
      {index}
    </span>
    <h2 className="font-syne text-sm font-bold uppercase tracking-[0.2em]" style={{ color: PAPER }}>
      {title}
    </h2>
    <span className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.10)' }} />
  </div>
);

export const NoirTheme = ({ portfolio }) => {
  const { profile = {}, experience = [], education = [], skills = [], projects = [], certifications = [] } = portfolio;
  const socials = [
    profile.github && { icon: Github, url: profile.github },
    profile.linkedin && { icon: Linkedin, url: profile.linkedin },
    profile.twitter && { icon: Twitter, url: profile.twitter },
    profile.website && { icon: Globe, url: profile.website }
  ].filter(Boolean);

  return (
    <div className="relative min-h-full font-outfit overflow-hidden" style={{ backgroundColor: INK, color: PAPER }}>
      {/* Stage atmosphere */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, #0c0e18 0%, #06060A 55%, #000000 100%)' }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          top: '-10vh', left: '50%', transform: 'translateX(-50%)', width: '640px', height: '70vh',
          clipPath: 'polygon(50% 0%, 16% 100%, 84% 100%)',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.16) 0%, rgba(127,168,232,0.08) 45%, transparent 100%)',
          opacity: 0.8
        }}
      />
      <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: 'inset 0 0 240px 80px #000000' }} />

      <div className="relative z-10 max-w-4xl mx-auto px-5 sm:px-8 py-14 space-y-14">
        {/* HERO */}
        <header className="pt-10 text-center space-y-5">
          {profile.statusPill && (
            <span
              className="inline-block px-3 py-1 rounded-full text-[10px] font-medium uppercase tracking-[0.2em]"
              style={{ color: ACCENT, border: `1px solid rgba(127,168,232,0.35)`, background: 'rgba(127,168,232,0.08)' }}
            >
              {profile.statusPill}
            </span>
          )}
          <h1 className="font-syne font-black tracking-tight leading-[0.95]" style={{ fontSize: 'clamp(2.6rem, 7vw, 4.8rem)' }}>
            {profile.fullName || 'Your Name'}
          </h1>
          <p className="text-sm sm:text-base tracking-wide" style={{ color: 'rgba(245,245,247,0.65)' }}>
            {profile.title}
          </p>
          <p className="max-w-2xl mx-auto text-xs sm:text-sm leading-relaxed" style={{ color: CHROME }}>
            {profile.bio}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
            {profile.location && (
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px]"
                style={{ color: CHROME, border: '1px solid rgba(255,255,255,0.14)' }}
              >
                <MapPin className="w-3 h-3" /> {profile.location}
              </span>
            )}
            {socials.map(({ icon: Icon, url }, i) => (
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-full transition-all duration-200 hover:-translate-y-0.5"
                style={{ color: 'rgba(245,245,247,0.75)', border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.04)' }}
                title={url}
              >
                <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />
              </a>
            ))}
            {profile.email && (
              <a
                href={`mailto:${profile.email}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[3px] text-[11px] font-bold uppercase tracking-wider transition-transform active:scale-95"
                style={{ backgroundColor: PAPER, color: INK }}
              >
                <Mail className="w-3.5 h-3.5" /> Contact
              </a>
            )}
          </div>
        </header>

        {/* EXPERIENCE */}
        {experience.length > 0 && (
          <section>
            <SectionLabel index="01" title="Experience" />
            <div className="relative pl-6 space-y-5">
              <span className="absolute left-[5px] top-2 bottom-2 w-px" style={{ background: 'rgba(255,255,255,0.12)' }} />
              {experience.map((job, idx) => (
                <div key={idx} className="relative">
                  <span
                    className="absolute -left-6 top-5 w-[9px] h-[9px] rounded-full"
                    style={{ backgroundColor: idx === 0 ? ACCENT : 'rgba(255,255,255,0.3)', boxShadow: idx === 0 ? '0 0 10px rgba(127,168,232,0.6)' : 'none' }}
                  />
                  <GlassCard className="p-5 space-y-2">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h3 className="font-syne text-base font-bold">{job.role}</h3>
                      <span className="text-[11px] tracking-wide" style={{ color: CHROME }}>
                        {job.start} — {job.end}
                      </span>
                    </div>
                    <p className="text-xs font-medium" style={{ color: ACCENT }}>
                      {job.company}{job.location ? ` · ${job.location}` : ''}
                    </p>
                    <ul className="space-y-1.5 pt-1">
                      {(job.bullets || []).map((b, i) => (
                        <li key={i} className="text-xs leading-relaxed flex gap-2" style={{ color: 'rgba(245,245,247,0.7)' }}>
                          <span className="mt-[7px] w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: 'rgba(255,255,255,0.35)' }} />
                          {b}
                        </li>
                      ))}
                    </ul>
                  </GlassCard>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* PROJECTS */}
        {projects.length > 0 && (
          <section>
            <SectionLabel index="02" title="Selected Work" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {projects.map((proj, idx) => (
                <GlassCard key={idx} className="p-5 space-y-3 overflow-hidden group" style={{ transition: 'border-color 0.2s ease' }}>
                  {proj.imageUrl && (
                    <div className="rounded-lg overflow-hidden mb-3" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                      <img
                        src={proj.imageUrl}
                        alt={proj.title}
                        className="w-full h-32 object-cover"
                        style={{ filter: 'grayscale(0.5) brightness(0.85)', transition: 'filter 0.3s ease' }}
                        onMouseEnter={(e) => { e.currentTarget.style.filter = 'grayscale(0) brightness(1)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.filter = 'grayscale(0.5) brightness(0.85)'; }}
                      />
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-syne text-sm font-bold">{proj.title}</h3>
                    <div className="flex gap-2 shrink-0">
                      {proj.liveUrl && <a href={proj.liveUrl} target="_blank" rel="noreferrer" title="Live demo" style={{ color: CHROME }} className="hover:text-white"><ExternalLink className="w-3.5 h-3.5" /></a>}
                      {proj.githubUrl && <a href={proj.githubUrl} target="_blank" rel="noreferrer" title="Source" style={{ color: CHROME }} className="hover:text-white"><Github className="w-3.5 h-3.5" /></a>}
                    </div>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: CHROME }}>{proj.description}</p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {(proj.techTags || []).map((t, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-full text-[10px]" style={{ color: CHROME, border: '1px solid rgba(255,255,255,0.14)' }}>
                        {t}
                      </span>
                    ))}
                  </div>
                </GlassCard>
              ))}
            </div>
          </section>
        )}

        {/* SKILLS */}
        {skills.length > 0 && (
          <section>
            <SectionLabel index="03" title="Capabilities" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
              {skills.map((sk, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span style={{ color: 'rgba(245,245,247,0.85)' }}>{sk.name}</span>
                    <span className="text-[10px]" style={{ color: CHROME }}>{sk.level}%</span>
                  </div>
                  <div className="h-[3px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${sk.level}%`,
                        background: sk.level >= 95 ? ACCENT : 'rgba(255,255,255,0.55)'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* EDUCATION + CERTS */}
        {(education.length > 0 || certifications.length > 0) && (
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {education.length > 0 && (
              <div>
                <SectionLabel index="04" title="Education" />
                <div className="space-y-4">
                  {education.map((edu, i) => (
                    <GlassCard key={i} className="p-4 space-y-1">
                      <h4 className="text-sm font-semibold">{edu.degree}{edu.field ? `, ${edu.field}` : ''}</h4>
                      <p className="text-xs" style={{ color: ACCENT }}>{edu.institution}</p>
                      <p className="text-[11px]" style={{ color: CHROME }}>{edu.start} — {edu.end}{edu.grade ? ` · ${edu.grade}` : ''}</p>
                    </GlassCard>
                  ))}
                </div>
              </div>
            )}
            {certifications.length > 0 && (
              <div>
                <SectionLabel index="05" title="Certifications" />
                <div className="space-y-4">
                  {certifications.map((c, i) => (
                    <GlassCard key={i} className="p-4 space-y-1">
                      <h4 className="text-sm font-semibold">{c.name}</h4>
                      <p className="text-[11px]" style={{ color: CHROME }}>{c.issuer} · {c.date}</p>
                    </GlassCard>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        <footer className="pt-6 pb-2 text-center">
          <div className="w-8 h-px mx-auto mb-4" style={{ background: 'rgba(255,255,255,0.2)' }} />
          <p className="text-[10px] tracking-[0.3em] uppercase" style={{ color: CHROME }}>
            {profile.fullName || 'Portfolio'} — Built with Aura
          </p>
        </footer>
      </div>
    </div>
  );
};
