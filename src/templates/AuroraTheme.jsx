import React from 'react';
import { ExternalLink, Github, Mail, MapPin } from 'lucide-react';

// Aurora Glass — light glassmorphism: soft animated aurora field behind
// frosted white panels, violet accent, generous rounded surfaces.
const VIOLET = '#7C6CF0';
const MIST = 'rgba(30, 27, 55, 0.65)';

const Glass = ({ children, className = '', style = {} }) => (
  <div
    className={`rounded-3xl ${className}`}
    style={{
      background: 'rgba(255, 255, 255, 0.55)',
      backdropFilter: 'blur(24px) saturate(160%)',
      WebkitBackdropFilter: 'blur(24px) saturate(160%)',
      border: '1px solid rgba(255, 255, 255, 0.7)',
      boxShadow: '0 8px 32px rgba(31, 38, 90, 0.08)',
      ...style
    }}
  >
    {children}
  </div>
);

export const AuroraTheme = ({ portfolio }) => {
  const { profile = {}, experience = [], education = [], skills = [], projects = [], certifications = [] } = portfolio;

  return (
    <div className="relative min-h-full font-outfit overflow-hidden" style={{ backgroundColor: '#EEF0FB', color: '#1E1B37' }}>
      {/* Aurora field */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(600px 400px at 15% 10%, rgba(124, 108, 240, 0.35), transparent 65%),
            radial-gradient(700px 450px at 85% 20%, rgba(96, 205, 220, 0.30), transparent 65%),
            radial-gradient(650px 500px at 55% 85%, rgba(240, 121, 187, 0.22), transparent 65%),
            linear-gradient(180deg, #EEF0FB 0%, #F4F2FC 50%, #EDF0FA 100%)
          `
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          background: 'radial-gradient(500px 300px at 70% 60%, rgba(124,108,240,0.18), transparent 70%)',
          animation: 'auroraDrift 14s ease-in-out infinite alternate'
        }}
      />

      <style>{`
        @keyframes auroraDrift {
          0% { transform: translate(-4%, -2%) scale(1); opacity: 0.35; }
          100% { transform: translate(4%, 3%) scale(1.08); opacity: 0.5; }
        }
      `}</style>

      <div className="relative z-10 max-w-4xl mx-auto px-5 sm:px-8 py-14 space-y-12">

        {/* HERO */}
        <Glass className="p-8 sm:p-10 text-center space-y-4">
          {profile.statusPill && (
            <span
              className="inline-block px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: VIOLET, background: 'rgba(124,108,240,0.10)', border: '1px solid rgba(124,108,240,0.25)' }}
            >
              {profile.statusPill}
            </span>
          )}
          {profile.avatarUrl && (
            <img
              src={profile.avatarUrl}
              alt={profile.fullName}
              className="w-24 h-24 rounded-full object-cover mx-auto ring-4 ring-white/80 shadow-lg"
            />
          )}
          <h1 className="font-syne font-black tracking-tight" style={{ fontSize: 'clamp(2.2rem, 6vw, 3.6rem)', color: '#1E1B37' }}>
            {profile.fullName || 'Your Name'}
          </h1>
          <p className="text-sm font-medium" style={{ color: VIOLET }}>{profile.title}</p>
          <p className="max-w-xl mx-auto text-xs sm:text-sm leading-relaxed" style={{ color: MIST }}>
            {profile.bio}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
            {profile.location && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px]" style={{ color: MIST, border: '1px solid rgba(30,27,55,0.12)' }}>
                <MapPin className="w-3 h-3" /> {profile.location}
              </span>
            )}
            {profile.email && (
              <a
                href={`mailto:${profile.email}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-bold text-white transition-transform active:scale-95"
                style={{ background: `linear-gradient(135deg, ${VIOLET}, #9F8CF5)` }}
              >
                <Mail className="w-3.5 h-3.5" /> Get in touch
              </a>
            )}
            {profile.github && (
              <a href={profile.github} target="_blank" rel="noreferrer" className="p-2 rounded-full transition-colors" style={{ border: '1px solid rgba(30,27,55,0.12)' }} title="GitHub">
                <Github className="w-3.5 h-3.5" style={{ color: MIST }} />
              </a>
            )}
          </div>
        </Glass>

        {/* EXPERIENCE */}
        {experience.length > 0 && (
          <section className="space-y-4">
            <h2 className="font-syne text-lg font-bold px-2" style={{ color: '#1E1B37' }}>Experience</h2>
            {experience.map((job, idx) => (
              <Glass key={idx} className="p-6 space-y-2">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-syne text-base font-bold">{job.role}</h3>
                  <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full" style={{ color: VIOLET, background: 'rgba(124,108,240,0.08)' }}>
                    {job.start} — {job.end}
                  </span>
                </div>
                <p className="text-xs font-semibold">{job.company}{job.location ? ` · ${job.location}` : ''}</p>
                <ul className="space-y-1.5 pt-1">
                  {(job.bullets || []).map((b, i) => (
                    <li key={i} className="text-xs leading-relaxed flex gap-2" style={{ color: MIST }}>
                      <span className="mt-[6px] w-1.5 h-1.5 rounded-full shrink-0" style={{ background: `linear-gradient(135deg, ${VIOLET}, #60CDDC)` }} />
                      {b}
                    </li>
                  ))}
                </ul>
              </Glass>
            ))}
          </section>
        )}

        {/* PROJECTS */}
        {projects.length > 0 && (
          <section className="space-y-4">
            <h2 className="font-syne text-lg font-bold px-2">Selected Work</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {projects.map((proj, idx) => (
                <Glass key={idx} className="p-5 space-y-3 overflow-hidden group" style={{ transition: 'transform 0.25s ease, box-shadow 0.25s ease' }}>
                  {proj.imageUrl && (
                    <div className="rounded-2xl overflow-hidden mb-2">
                      <img src={proj.imageUrl} alt={proj.title} className="w-full h-36 object-cover" />
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-syne text-sm font-bold">{proj.title}</h3>
                    <div className="flex gap-2 shrink-0">
                      {proj.liveUrl && <a href={proj.liveUrl} target="_blank" rel="noreferrer" title="Live" style={{ color: VIOLET }}><ExternalLink className="w-3.5 h-3.5" /></a>}
                      {proj.githubUrl && <a href={proj.githubUrl} target="_blank" rel="noreferrer" title="Source" style={{ color: VIOLET }}><Github className="w-3.5 h-3.5" /></a>}
                    </div>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: MIST }}>{proj.description}</p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {(proj.techTags || []).map((t, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ color: VIOLET, background: 'rgba(124,108,240,0.08)' }}>
                        {t}
                      </span>
                    ))}
                  </div>
                </Glass>
              ))}
            </div>
          </section>
        )}

        {/* SKILLS */}
        {skills.length > 0 && (
          <section className="space-y-4">
            <h2 className="font-syne text-lg font-bold px-2">Capabilities</h2>
            <Glass className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
              {skills.map((sk, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span>{sk.name}</span>
                    <span className="text-[10px]" style={{ color: VIOLET }}>{sk.level}%</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(30,27,55,0.08)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${sk.level}%`, background: `linear-gradient(90deg, ${VIOLET}, #60CDDC)` }}
                    />
                  </div>
                </div>
              ))}
            </Glass>
          </section>
        )}

        {/* EDUCATION + CERTS */}
        {(education.length > 0 || certifications.length > 0) && (
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {education.length > 0 && (
              <div className="space-y-4">
                <h2 className="font-syne text-lg font-bold px-2">Education</h2>
                {education.map((edu, i) => (
                  <Glass key={i} className="p-5 space-y-1">
                    <h4 className="text-sm font-bold">{edu.degree}{edu.field ? `, ${edu.field}` : ''}</h4>
                    <p className="text-xs font-semibold" style={{ color: VIOLET }}>{edu.institution}</p>
                    <p className="text-[11px]" style={{ color: MIST }}>{edu.start} — {edu.end}{edu.grade ? ` · ${edu.grade}` : ''}</p>
                  </Glass>
                ))}
              </div>
            )}
            {certifications.length > 0 && (
              <div className="space-y-4">
                <h2 className="font-syne text-lg font-bold px-2">Certifications</h2>
                {certifications.map((c, i) => (
                  <Glass key={i} className="p-5 space-y-1">
                    <h4 className="text-sm font-bold">{c.name}</h4>
                    <p className="text-[11px]" style={{ color: MIST }}>{c.issuer} · {c.date}</p>
                  </Glass>
                ))}
              </div>
            )}
          </section>
        )}

        <footer className="text-center pb-4">
          <p className="text-[10px] tracking-[0.3em] uppercase" style={{ color: MIST }}>
            {profile.fullName || 'Portfolio'} — Built with Aura
          </p>
        </footer>
      </div>
    </div>
  );
};
