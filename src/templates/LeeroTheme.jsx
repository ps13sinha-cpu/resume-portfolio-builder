import React from 'react';
import { ArrowUpRight, Github, Twitter, Mail, MapPin } from 'lucide-react';

// Leerob-style minimal engineer/writer portfolio — faithful rebuild of
// leerob.com's design language (recreated from the public site; all
// content comes from YOUR resume data): plain white-on-near-black,
// small gray labels, generous prose bio, link-list sections with
// ArrowUpRight hovers, understated footer. No decorations at all —
// typography IS the design.
const BG = '#0A0A0A';
const FG = '#EDEDED';
const MUTED = '#A1A1A1';
const FAINT = '#666666';
const BORDER = 'rgba(255,255,255,0.10)';

const Label = ({ children }) => (
  <p className="text-[13px] font-medium mb-3 tracking-wide" style={{ color: MUTED }}>{children}</p>
);

const LinkList = ({ items }) => (
  <ul className="divide-y" style={{ borderColor: BORDER }}>
    {items.map((it, i) => (
      <li key={i}>
        <a
          href={it.href || '#'}
          target={it.href?.startsWith('http') ? '_blank' : undefined}
          rel="noreferrer"
          className="group flex items-center justify-between py-2.5 text-[14px] transition-colors hover:text-white"
          style={{ color: FG }}
        >
          <span>{it.label}</span>
          <span className="flex items-center gap-3">
            {it.meta && <span className="text-[13px]" style={{ color: FAINT }}>{it.meta}</span>}
            <ArrowUpRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </span>
        </a>
      </li>
    ))}
  </ul>
);

export const LeeroTheme = ({ portfolio }) => {
  const { profile = {}, experience = [], education = [], skills = [], projects = [], certifications = [] } = portfolio;

  return (
    <div className="min-h-full font-outfit" style={{ backgroundColor: BG, color: FG }}>
      <div className="max-w-[640px] mx-auto px-6 py-20 space-y-14">

        {/* HEADER */}
        <header className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[13px]" style={{ color: MUTED }}>
              @{(profile.fullName || 'yourname').toLowerCase().replace(/\s+/g, '')}
            </p>
            {profile.location && (
              <p className="flex items-center gap-1 text-[13px]" style={{ color: FAINT }}>
                <MapPin className="w-3 h-3" /> {profile.location}
              </p>
            )}
          </div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: FG }}>
            {profile.fullName || 'Your Name'}
          </h1>
          <p className="text-[15px] leading-relaxed" style={{ color: MUTED }}>
            {profile.bio || profile.title}
          </p>
        </header>

        {/* NOW / EXPERIENCE — plain statement rows like leerob's bio */}
        {experience.length > 0 && (
          <section>
            <Label>Now</Label>
            <div className="space-y-4">
              {experience.slice(0, 3).map((j, i) => (
                <div key={i} className="text-[15px] leading-relaxed">
                  <p>
                    <span style={{ color: FG }}>{j.role}</span>
                    <span style={{ color: FAINT }}> at </span>
                    <span style={{ color: FG }}>{j.company}</span>
                  </p>
                  {(j.bullets || [])[0] && (
                    <p className="text-[14px] mt-1" style={{ color: MUTED }}>{j.bullets[0]}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* PROJECTS — archive list with links */}
        {projects.length > 0 && (
          <section>
            <Label>Projects</Label>
            <LinkList
              items={projects.slice(0, 8).map(p => ({
                label: p.title,
                meta: (p.techTags || []).slice(0, 2).join(' · ') || (p.description || '').slice(0, 48),
                href: p.liveUrl || p.githubUrl
              }))}
            />
          </section>
        )}

        {/* SKILLS — as simple text line (no bars, no pills) */}
        {skills.length > 0 && (
          <section>
            <Label>Stack</Label>
            <p className="text-[14px] leading-relaxed" style={{ color: MUTED }}>
              {skills.slice(0, 14).map(s => s.name).join(' · ')}
            </p>
          </section>
        )}

        {/* WRITING/NOTES-style section fed by experience bullets */}
        {experience.some(j => (j.bullets || []).length > 1) && (
          <section>
            <Label>Selected Work Highlights</Label>
            <LinkList
              items={experience.slice(0, 4).flatMap(j =>
                (j.bullets || []).slice(0, 2).map((b, bi) => ({
                  label: b.length > 70 ? b.slice(0, 70) + '…' : b,
                  meta: j.company,
                  href: null
                }))
              ).slice(0, 6)}
            />
          </section>
        )}

        {/* EDUCATION + CERTS */}
        {(education.length > 0 || certifications.length > 0) && (
          <section>
            <Label>Education & Certifications</Label>
            <LinkList
              items={[
                ...education.map(e => ({
                  label: `${e.degree || ''}${e.field ? `, ${e.field}` : ''} — ${e.institution}`,
                  meta: e.end || '',
                  href: null
                })),
                ...certifications.map(c => ({
                  label: c.name,
                  meta: c.issuer || c.date || '',
                  href: c.credentialUrl
                }))
              ]}
            />
          </section>
        )}

        {/* CONTACT — plain mailto row */}
        <section>
          <Label>Contact</Label>
          <div className="flex flex-wrap gap-4 text-[14px]">
            {profile.email && (
              <a href={`mailto:${profile.email}`} className="flex items-center gap-1.5 hover:text-white transition-colors" style={{ color: MUTED }}>
                <Mail className="w-4 h-4" /> {profile.email}
              </a>
            )}
            {profile.github && (
              <a href={profile.github} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-white transition-colors" style={{ color: MUTED }}>
                <Github className="w-4 h-4" /> GitHub
              </a>
            )}
            {profile.linkedin && (
              <a href={profile.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-white transition-colors" style={{ color: MUTED }}>
                <Twitter className="w-4 h-4" /> LinkedIn
              </a>
            )}
          </div>
        </section>

        <footer className="pt-6 text-[13px]" style={{ color: FAINT, borderTop: `1px solid ${BORDER}` }}>
          <p>© {new Date().getFullYear()} {profile.fullName || ''} · Built with Aura Portfolio</p>
        </footer>
      </div>
    </div>
  );
};
