import React, { useEffect, useState } from 'react';
import { ArrowUpRight, ArrowDown, Github, Linkedin, Twitter, Instagram, Mail } from 'lucide-react';

// Snellenberg-style freelance portfolio — faithful rebuild of the
// Awwwards-winning dennissnellenberg.com design language (recreated
// from the public site; all content comes from YOUR resume data):
// warm cream #E0CCBB canvas, near-black #1D1D1D type, oversized tight
// uppercase display headings, index-style project rows with year +
// role columns and ArrowUpRight hovers, pill services row, and the
// signature giant footer: availability line, huge "GET IN TOUCH",
// local-time widget, social columns.
const CREAM = '#E0CCBB';
const DARK = '#1D1D1D';
const GRAY = '#6E6E68';

export const SnellenbergTheme = ({ portfolio }) => {
  const { profile = {}, experience = [], education = [], skills = [], projects = [], certifications = [] } = portfolio;
  const [time, setTime] = useState('');

  // Local-time widget (signature element of the original site)
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    tick();
    const id = setInterval(tick, 15000);
    return () => clearInterval(id);
  }, []);

  const work = projects.slice(0, 8);
  const services = skills.slice(0, 6).map(s => s.name);
  const socials = [
    profile.github && { label: 'GitHub', url: profile.github },
    profile.linkedin && { label: 'LinkedIn', url: profile.linkedin },
    profile.twitter && { label: 'Twitter', url: profile.twitter }
  ].filter(Boolean);

  return (
    <div className="min-h-full font-outfit" style={{ backgroundColor: CREAM, color: DARK }}>
      <div className="px-6 sm:px-10 max-w-[1400px] mx-auto">

        {/* HERO */}
        <section className="pt-20 sm:pt-28 pb-24">
          <h1 className="font-syne font-bold uppercase leading-[0.9] tracking-[-0.02em]" style={{ fontSize: 'clamp(2.6rem, 8vw, 6.5rem)' }}>
            {profile.fullName || 'Your Name'}
          </h1>
          <p className="mt-6 max-w-md text-[15px] sm:text-base leading-relaxed" style={{ color: DARK }}>
            {profile.bio || profile.title}
          </p>
          <div className="flex flex-wrap gap-x-10 gap-y-2 mt-8 text-[13px] font-medium" style={{ color: GRAY }}>
            {profile.location && <span>{profile.location}</span>}
            {profile.email && <a href={`mailto:${profile.email}`} className="underline underline-offset-4" style={{ color: DARK }}>{profile.email}</a>}
          </div>
        </section>

        {/* RECENT WORK — index rows with hover arrows */}
        {work.length > 0 && (
          <section className="pb-24">
            <div className="flex items-baseline justify-between mb-6">
              <h2 className="font-syne font-bold uppercase tracking-tight text-sm">Recent Work</h2>
              <span className="text-[12px]" style={{ color: GRAY }}>{projects.length} projects</span>
            </div>
            <ul>
              {work.map((p, i) => (
                <li key={i} className="group border-t last:border-b cursor-pointer" style={{ borderColor: 'rgba(29,29,29,0.15)' }}>
                  <a
                    href={p.liveUrl || p.githubUrl || '#'}
                    target={p.liveUrl || p.githubUrl ? '_blank' : undefined}
                    rel="noreferrer"
                    className="flex items-center justify-between gap-4 py-6 sm:py-8 transition-all duration-200 group-hover:pl-3"
                  >
                    <div className="flex items-baseline gap-4 sm:gap-8 min-w-0">
                      <span className="text-[11px] font-medium w-8 shrink-0" style={{ color: GRAY, fontFamily: "'Fira Code', monospace" }}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <h3 className="font-syne font-bold uppercase text-2xl sm:text-4xl tracking-tight truncate group-hover:translate-x-1 transition-transform">
                        {p.title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-3 sm:gap-8 shrink-0">
                      <span className="hidden sm:block text-[12px] text-right max-w-[180px]" style={{ color: GRAY }}>
                        {(p.techTags || []).slice(0, 3).join(' · ') || p.description?.slice(0, 60)}
                      </span>
                      <span
                        className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 group-hover:rotate-45"
                        style={{ backgroundColor: DARK, color: CREAM }}
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </span>
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ABOUT / SERVICES pills */}
        <section className="pb-24">
          <h2 className="font-syne font-bold uppercase tracking-tight text-sm mb-6">What I Do</h2>
          <div className="flex flex-wrap gap-2.5">
            {services.map((s, i) => (
              <span
                key={i}
                className="px-5 py-2.5 rounded-full text-[13px] font-medium border transition-colors hover:bg-[#1D1D1D] hover:text-[#E0CCBB]"
                style={{ borderColor: 'rgba(29,29,29,0.35)' }}
              >
                {s}
              </span>
            ))}
          </div>
          {/* Experience condensed */}
          {experience.length > 0 && (
            <div className="grid sm:grid-cols-2 gap-x-12 gap-y-6 mt-12">
              {experience.slice(0, 4).map((j, i) => (
                <div key={i} className="border-t pt-4" style={{ borderColor: 'rgba(29,29,29,0.15)' }}>
                  <p className="text-[12px] uppercase tracking-wider" style={{ color: GRAY }}>
                    {j.start} — {j.end}
                  </p>
                  <h4 className="font-syne font-bold text-lg mt-1">{j.role}</h4>
                  <p className="text-[13px]" style={{ color: GRAY }}>{j.company}</p>
                  {(j.bullets || [])[0] && <p className="text-[13px] mt-1.5 leading-relaxed">{j.bullets[0]}</p>}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* EDUCATION + CERTS compact */}
        {(education.length > 0 || certifications.length > 0) && (
          <section className="pb-24">
            <h2 className="font-syne font-bold uppercase tracking-tight text-sm mb-6">Background</h2>
            <div className="space-y-3">
              {education.map((e, i) => (
                <div key={i} className="flex flex-wrap items-baseline justify-between gap-2 border-t pt-3" style={{ borderColor: 'rgba(29,29,29,0.15)' }}>
                  <span className="font-medium text-[15px]">{e.degree}{e.field ? `, ${e.field}` : ''} — {e.institution}</span>
                  <span className="text-[12px]" style={{ color: GRAY }}>{e.start}—{e.end}</span>
                </div>
              ))}
              {certifications.map((c, i) => (
                <div key={`c${i}`} className="flex flex-wrap items-baseline justify-between gap-2 border-t pt-3" style={{ borderColor: 'rgba(29,29,29,0.15)' }}>
                  <span className="font-medium text-[15px]">{c.name}</span>
                  <span className="text-[12px]" style={{ color: GRAY }}>{c.issuer}{c.date ? ` · ${c.date}` : ''}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* THE SIGNATURE FOOTER — dark slab, giant CTA, local time */}
      <footer className="mt-10 rounded-t-[2.5rem] px-6 sm:px-14 pt-16 pb-10" style={{ backgroundColor: DARK, color: CREAM }}>
        <div className="max-w-[1400px] mx-auto">
          <p className="text-[13px] font-medium flex items-center gap-2" style={{ color: CREAM }}>
            <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: '#4ADE80' }} />
            Available for work
          </p>
          <a
            href={profile.email ? `mailto:${profile.email}` : '#'}
            className="block font-syne font-bold uppercase leading-[0.95] tracking-tight mt-4 hover:translate-x-2 transition-transform duration-300"
            style={{ fontSize: 'clamp(2.8rem, 10vw, 8rem)' }}
          >
            Get in touch
            <ArrowUpRight className="inline-block ml-2 align-baseline" style={{ width: '0.7em', height: '0.7em' }} />
          </a>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mt-16 text-[13px]">
            <div className="space-y-1">
              <p style={{ color: 'rgba(224,204,187,0.5)' }}>Local time</p>
              <p className="font-medium" style={{ fontFamily: "'Fira Code', monospace" }}>{time}</p>
            </div>
            <div className="space-y-1">
              <p style={{ color: 'rgba(224,204,187,0.5)' }}>Location</p>
              <p className="font-medium">{profile.location || '—'}</p>
            </div>
            <div className="space-y-1">
              <p style={{ color: 'rgba(224,204,187,0.5)' }}>Socials</p>
              {socials.map(({ label, url }) => (
                <a key={label} href={url} target="_blank" rel="noreferrer" className="block font-medium hover:underline">{label}</a>
              ))}
              {socials.length === 0 && <p className="font-medium">—</p>}
            </div>
            <div className="space-y-1">
              <p style={{ color: 'rgba(224,204,187,0.5)' }}>Contact</p>
              {profile.email && <a href={`mailto:${profile.email}`} className="block font-medium hover:underline">Email</a>}
              {profile.website && <a href={profile.website} target="_blank" rel="noreferrer" className="block font-medium hover:underline">Website</a>}
            </div>
          </div>

          <div className="flex items-center justify-between mt-14 pt-6 text-[12px]" style={{ borderTop: '1px solid rgba(224,204,187,0.15)', color: 'rgba(224,204,187,0.5)' }}>
            <span>© {new Date().getFullYear()} {profile.fullName || ''}</span>
            <span>Built with Aura Portfolio</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
