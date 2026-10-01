import React from 'react';
import { Mail, Phone, Globe, Linkedin, Github, MapPin, ExternalLink } from 'lucide-react';

// Resume One-Pager — "your CV as a website" (SitesPlaced #16, Colorlib
// CV-style-layout trend): recruiter-first single column, ATS-safe markup,
// print-ready, zero decoration. The whole point is skimmability.
const INK = '#16181D';

const SectionTitle = ({ children }) => (
  <h2
    className="text-[11px] font-bold uppercase tracking-[0.18em] pb-1.5 mb-4 border-b"
    style={{ color: INK, borderColor: 'rgba(22,24,29,0.15)' }}
  >
    {children}
  </h2>
);

export const ResumeTheme = ({ portfolio }) => {
  const { profile = {}, experience = [], education = [], skills = [], projects = [], certifications = [] } = portfolio;
  const contacts = [
    profile.email && { icon: Mail, text: profile.email, href: `mailto:${profile.email}` },
    profile.phone && { icon: Phone, text: profile.phone, href: `tel:${profile.phone}` },
    profile.location && { icon: MapPin, text: profile.location },
    profile.website && { icon: Globe, text: profile.website.replace(/^https?:\/\//, ''), href: profile.website },
    profile.linkedin && { icon: Linkedin, text: profile.linkedin.replace(/^https?:\/\/(www\.)?/, ''), href: profile.linkedin },
    profile.github && { icon: Github, text: profile.github.replace(/^https?:\/\/(www\.)?/, ''), href: profile.github }
  ].filter(Boolean);

  const skillCategories = [...new Set(skills.map(s => s.category).filter(Boolean))];

  return (
    <div className="min-h-full font-outfit" style={{ backgroundColor: '#FFFFFF', color: INK }}>
      <div className="max-w-[820px] mx-auto px-8 sm:px-14 py-10">

        {/* Header block — name, title, contacts. No photo (ATS best practice). */}
        <header className="pb-6" style={{ borderBottom: '2px solid ' + INK }}>
          <h1 className="text-4xl sm:text-[2.75rem] font-bold tracking-tight leading-none">
            {profile.fullName || 'Your Name'}
          </h1>
          {profile.title && (
            <p className="text-sm mt-1.5 font-medium" style={{ color: 'rgba(22,24,29,0.75)' }}>
              {profile.title}
            </p>
          )}
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-[11px]" style={{ color: 'rgba(22,24,29,0.65)' }}>
            {contacts.map(({ icon: Icon, text, href }, i) => (
              <span key={i} className="inline-flex items-center gap-1">
                <Icon className="w-3 h-3" />
                {href ? <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer" className="hover:underline">{text}</a> : text}
              </span>
            ))}
          </div>
        </header>

        {/* Summary */}
        {profile.bio && (
          <section className="mt-6">
            <SectionTitle>Professional Summary</SectionTitle>
            <p className="text-[13px] leading-relaxed" style={{ color: 'rgba(22,24,29,0.85)' }}>
              {profile.bio}
            </p>
          </section>
        )}

        {/* Experience — strict, scannable, metric-forward */}
        {experience.length > 0 && (
          <section className="mt-6">
            <SectionTitle>Experience</SectionTitle>
            <div className="space-y-5">
              {experience.map((job, idx) => (
                <div key={idx}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                    <h3 className="text-[15px] font-bold">{job.role}</h3>
                    <span className="text-[11px] font-medium whitespace-nowrap" style={{ color: 'rgba(22,24,29,0.6)' }}>
                      {job.start} — {job.end}
                    </span>
                  </div>
                  <p className="text-xs font-semibold mt-0.5" style={{ color: 'rgba(22,24,29,0.75)' }}>
                    {job.company}{job.location ? ` · ${job.location}` : ''}
                  </p>
                  <ul className="mt-1.5 space-y-1">
                    {(job.bullets || []).map((b, i) => (
                      <li key={i} className="text-xs leading-relaxed flex gap-2" style={{ color: 'rgba(22,24,29,0.85)' }}>
                        <span className="mt-[7px] w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: 'rgba(22,24,29,0.5)' }} />
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <section className="mt-6">
            <SectionTitle>Projects</SectionTitle>
            <div className="space-y-4">
              {projects.map((proj, idx) => (
                <div key={idx}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                    <h3 className="text-sm font-bold">
                      {proj.title}
                      {proj.liveUrl && (
                        <a href={proj.liveUrl} target="_blank" rel="noreferrer" className="ml-2 text-[10px] font-medium underline underline-offset-2" style={{ color: 'rgba(22,24,29,0.6)' }}>
                          <ExternalLink className="w-3 h-3 inline mr-0.5" />view
                        </a>
                      )}
                      {proj.githubUrl && (
                        <a href={proj.githubUrl} target="_blank" rel="noreferrer" className="ml-2 text-[10px] font-medium underline underline-offset-2" style={{ color: 'rgba(22,24,29,0.6)' }}>
                          <Github className="w-3 h-3 inline mr-0.5" />code
                        </a>
                      )}
                    </h3>
                    {(proj.techTags || []).length > 0 && (
                      <span className="text-[10px] font-medium" style={{ color: 'rgba(22,24,29,0.55)' }}>
                        {proj.techTags.join(' · ')}
                      </span>
                    )}
                  </div>
                  <p className="text-xs leading-relaxed mt-0.5" style={{ color: 'rgba(22,24,29,0.8)' }}>
                    {proj.description}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Skills — categorized single lines, ATS-parseable */}
        {skills.length > 0 && (
          <section className="mt-6">
            <SectionTitle>Skills</SectionTitle>
            <div className="space-y-1.5">
              {(skillCategories.length > 0 ? skillCategories : ['Core']).map((cat) => (
                <p key={cat} className="text-xs leading-relaxed">
                  <span className="font-bold">{cat}:</span>{' '}
                  <span style={{ color: 'rgba(22,24,29,0.8)' }}>
                    {skills.filter(s => (s.category || 'Core') === cat).map(s => s.name).join(', ')}
                  </span>
                </p>
              ))}
            </div>
          </section>
        )}

        {/* Education + Certifications */}
        {(education.length > 0 || certifications.length > 0) && (
          <section className="mt-6">
            <SectionTitle>Education & Certifications</SectionTitle>
            <div className="space-y-3">
              {education.map((edu, i) => (
                <div key={i}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                    <h3 className="text-sm font-bold">
                      {edu.degree}{edu.field ? `, ${edu.field}` : ''}
                    </h3>
                    <span className="text-[11px]" style={{ color: 'rgba(22,24,29,0.6)' }}>{edu.start} — {edu.end}</span>
                  </div>
                  <p className="text-xs" style={{ color: 'rgba(22,24,29,0.75)' }}>
                    {edu.institution}{edu.grade ? ` · ${edu.grade}` : ''}
                  </p>
                </div>
              ))}
              {certifications.map((c, i) => (
                <div key={`c${i}`}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                    <h3 className="text-sm font-bold">{c.name}</h3>
                    <span className="text-[11px]" style={{ color: 'rgba(22,24,29,0.6)' }}>{c.date}</span>
                  </div>
                  <p className="text-xs" style={{ color: 'rgba(22,24,29,0.75)' }}>{c.issuer}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <footer className="mt-10 pt-4 text-center" style={{ borderTop: '1px solid rgba(22,24,29,0.12)' }}>
          <p className="text-[10px]" style={{ color: 'rgba(22,24,29,0.45)' }}>
            {profile.statusPill ? profile.statusPill : `${profile.fullName || 'Portfolio'} — résumé as a website`}
          </p>
        </footer>
      </div>
    </div>
  );
};
