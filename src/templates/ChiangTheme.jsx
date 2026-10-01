import React, { useState } from 'react';
import { Github, Linkedin, ExternalLink, Star, GitFork, Mail, MapPin, FileText, ChevronRight } from 'lucide-react';

// Chiang-style developer portfolio — faithful rebuild of the famous
// brittanychiang.com/v4 design language (recreated from its public
// design reference; all content comes from YOUR resume data):
// deep navy #0A192F, light-navy cards #112240, mint #64FFDA accents,
// slate body text, numbered monospace section headers, left-rail social
// links, sideways email link, experience as an interactive tab list,
// featured projects as large offset cards with folder icon + links.
const NAVY = '#0A192F';
const LIGHT_NAVY = '#112240';
const LIGHTER_NAVY = '#233554';
const SLATE = '#8892B0';
const LIGHT_SLATE = '#A8B2D1';
const LIGHTEST_SLATE = '#CCD6F6';
const WHITE = '#E6F1FF';
const MINT = '#64FFDA';
const MONO = "'Fira Code', monospace";

const SectionHeading = ({ num, title }) => (
  <div className="flex items-center gap-3 mb-10">
    <h2 className="font-syne text-2xl sm:text-3xl font-bold whitespace-nowrap" style={{ color: LIGHTEST_SLATE }}>
      <span style={{ color: MINT, fontFamily: MONO, fontSize: '0.8em', marginRight: '10px' }}>{num}.</span>
      {title}
    </h2>
    <span className="h-px flex-1 max-w-[220px]" style={{ backgroundColor: LIGHTER_NAVY }} />
  </div>
);

const TechList = ({ tags }) => (
  <ul className="flex flex-wrap font-mono text-[12px] gap-x-3 gap-y-1" style={{ fontFamily: MONO, color: SLATE }}>
    {(tags || []).map((t, i) => <li key={i}>{t}</li>)}
  </ul>
);

export const ChiangTheme = ({ portfolio }) => {
  const { profile = {}, experience = [], education = [], skills = [], projects = [], certifications = [] } = portfolio;
  const [activeJob, setActiveJob] = useState(0);
  const job = experience[activeJob] || {};

  const featured = projects.slice(0, 6);
  const socials = [
    profile.github && { icon: Github, url: profile.github, label: 'GitHub' },
    profile.linkedin && { icon: Linkedin, url: profile.linkedin, label: 'LinkedIn' }
  ].filter(Boolean);

  return (
    <div style={{ backgroundColor: NAVY, color: SLATE }} className="min-h-full font-outfit">
      {/* Left social rail */}
      <div className="hidden md:flex fixed left-6 bottom-0 z-10 flex-col items-center gap-4" style={{ color: LIGHT_SLATE }}>
        {socials.map(({ icon: Icon, url, label }, i) => (
          <a key={i} href={url} target="_blank" rel="noreferrer" title={label} className="hover:-translate-y-1 transition-transform duration-200" style={{ color: LIGHT_SLATE }}>
            <Icon className="w-5 h-5" />
          </a>
        ))}
        <span className="w-px h-24" style={{ backgroundColor: LIGHT_SLATE }} />
      </div>
      {/* Right sideways email */}
      <div className="hidden md:flex fixed right-6 bottom-0 z-10 flex-col items-center gap-4">
        <a
          href={profile.email ? `mailto:${profile.email}` : '#'}
          className="hover:-translate-y-1 transition-transform duration-200"
          style={{ color: LIGHT_SLATE, writingMode: 'vertical-rl', fontFamily: MONO, fontSize: '13px', letterSpacing: '0.05em' }}
        >
          {profile.email || 'Email me'}
        </a>
        <span className="w-px h-24" style={{ backgroundColor: LIGHT_SLATE }} />
      </div>

      <div className="max-w-3xl mx-auto px-6 sm:px-10">
        {/* HERO */}
        <section className="pt-24 pb-28 min-h-[80vh] flex flex-col justify-center">
          <p className="mb-4" style={{ color: MINT, fontFamily: MONO }}>Hi, my name is</p>
          <h1 className="font-syne font-bold tracking-tight leading-[1.05]" style={{ fontSize: 'clamp(2.4rem, 6vw, 4rem)', color: LIGHTEST_SLATE }}>
            {profile.fullName || 'Your Name'}.
          </h1>
          <h2 className="font-syne font-bold tracking-tight leading-[1.1] mt-1" style={{ fontSize: 'clamp(2rem, 5vw, 3.4rem)', color: SLATE }}>
            {profile.title || 'I build things for the web.'}
          </h2>
          <p className="mt-6 max-w-xl text-base leading-relaxed" style={{ color: SLATE }}>
            {profile.bio}
          </p>
          {profile.location && (
            <p className="mt-4 flex items-center gap-1.5 text-sm" style={{ color: SLATE, fontFamily: MONO, fontSize: '13px' }}>
              <MapPin className="w-3.5 h-3.5" style={{ color: MINT }} /> {profile.location}
            </p>
          )}
        </section>

        {/* ABOUT + SKILLS */}
        <section id="about" className="pb-28">
          <SectionHeading num="01" title="About Me" />
          <div className="grid grid-cols-3 gap-10">
            <div className="col-span-3 md:col-span-2 space-y-4 text-[15px] leading-relaxed">
              <p>{profile.bio}</p>
              <p>
                Here are a few technologies I've been working with recently:
              </p>
              <ul className="grid grid-cols-2 gap-2 mt-4 font-mono text-[13px]" style={{ fontFamily: MONO, color: LIGHT_SLATE }}>
                {skills.slice(0, 8).map((s, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <ChevronRight className="w-3.5 h-3.5 shrink-0" style={{ color: MINT }} />
                    {s.name}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* EXPERIENCE — interactive job tabs (the signature element) */}
        {experience.length > 0 && (
          <section id="experience" className="pb-28">
            <SectionHeading num="02" title="Where I've Worked" />
            <div className="flex flex-col md:flex-row gap-6">
              {/* Tab list */}
              <div
                className="flex md:flex-col overflow-x-auto md:overflow-visible gap-0 shrink-0 font-mono text-[13px] border-b md:border-b-0 md:border-l"
                style={{ fontFamily: MONO, borderColor: LIGHT_NAVY }}
              >
                {experience.slice(0, 6).map((j, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveJob(i)}
                    className="text-left py-3 md:py-3 px-4 md:px-5 whitespace-nowrap transition-colors border-b-2 md:border-b-0 md:border-l-2 hover:bg-white/[0.03]"
                    style={{
                      borderColor: i === activeJob ? MINT : LIGHTER_NAVY,
                      color: i === activeJob ? MINT : SLATE,
                      backgroundColor: i === activeJob ? 'rgba(100,255,218,0.04)' : 'transparent'
                    }}
                  >
                    {(j.company || `Company ${i + 1}`).split(' ')[0]}
                  </button>
                ))}
              </div>
              {/* Panel */}
              <div className="flex-1 space-y-3 min-h-[220px]">
                <h3 className="text-xl font-semibold" style={{ color: LIGHTEST_SLATE }}>
                  {job.role} <span style={{ color: SLATE }}>@ {job.company}</span>
                </h3>
                <p style={{ fontFamily: MONO, fontSize: '13px', color: SLATE }}>
                  {job.start} — {job.end}
                </p>
                <ul className="space-y-3 mt-4">
                  {(job.bullets || []).map((b, i) => (
                    <li key={i} className="flex gap-3 text-[15px] leading-relaxed">
                      <ChevronRight className="w-4 h-4 shrink-0 mt-1" style={{ color: MINT }} />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        )}

        {/* FEATURED PROJECTS — big offset cards */}
        {featured.length > 0 && (
          <section id="projects" className="pb-28">
            <SectionHeading num="03" title="Some Things I've Built" />
            <div className="space-y-16">
              {featured.map((proj, i) => (
                <div
                  key={i}
                  className="rounded-md relative overflow-hidden group"
                  style={{ backgroundColor: LIGHT_NAVY }}
                >
                  {proj.imageUrl && (
                    <div className="h-48 overflow-hidden opacity-60 group-hover:opacity-90 transition-opacity">
                      <img src={proj.imageUrl} alt={proj.title} className="w-full h-full object-cover" style={{ mixBlendMode: 'luminosity' }} />
                    </div>
                  )}
                  <div className="p-6 space-y-3 relative">
                    <div className="flex items-center justify-between">
                      <span style={{ color: MINT }}>
                        <Star className="w-9 h-9" strokeWidth={1} />
                      </span>
                      <div className="flex gap-3">
                        {proj.githubUrl && <a href={proj.githubUrl} target="_blank" rel="noreferrer" style={{ color: LIGHT_SLATE }}><Github className="w-5 h-5" /></a>}
                        {proj.liveUrl && <a href={proj.liveUrl} target="_blank" rel="noreferrer" style={{ color: LIGHT_SLATE }}><ExternalLink className="w-5 h-5" /></a>}
                      </div>
                    </div>
                    <h3 className="text-2xl font-semibold transition-colors group-hover:text-[#64FFDA]" style={{ color: LIGHTEST_SLATE }}>
                      {proj.title}
                    </h3>
                    <p
                      className="rounded-md p-4 text-[14px] leading-relaxed relative z-10"
                      style={{ backgroundColor: NAVY, color: LIGHT_SLATE, boxShadow: '0 10px 30px -15px rgba(2,12,27,0.7)' }}
                    >
                      {proj.description}
                    </p>
                    <TechList tags={proj.techTags} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* OTHER — education + certifications mini-archive */}
        <section id="other" className="pb-24">
          <SectionHeading num="04" title="Other Noteworthy Info" />
          <div className="grid md:grid-cols-2 gap-5">
            <div className="rounded p-6 space-y-3" style={{ backgroundColor: LIGHT_NAVY, boxShadow: '0 10px 30px -15px rgba(2,12,27,0.7)' }}>
              <div className="flex items-center justify-between">
                <FileText className="w-8 h-8" style={{ color: MINT }} strokeWidth={1} />
              </div>
              <h3 className="text-lg font-semibold" style={{ color: LIGHTEST_SLATE }}>Education</h3>
              {(education || []).slice(0, 2).map((e, i) => (
                <div key={i} className="text-[14px] space-y-0.5">
                  <p style={{ color: LIGHT_SLATE }}>{e.institution}</p>
                  <p style={{ color: SLATE, fontFamily: MONO, fontSize: '12px' }}>
                    {e.degree}{e.field ? `, ${e.field}` : ''} · {e.start}—{e.end}
                    {e.grade ? ` · ${e.grade}` : ''}
                  </p>
                </div>
              ))}
            </div>
            <div className="rounded p-6 space-y-3" style={{ backgroundColor: LIGHT_NAVY, boxShadow: '0 10px 30px -15px rgba(2,12,27,0.7)' }}>
              <div className="flex items-center justify-between">
                <Star className="w-8 h-8" style={{ color: MINT }} strokeWidth={1} />
              </div>
              <h3 className="text-lg font-semibold" style={{ color: LIGHTEST_SLATE }}>Certifications</h3>
              {(certifications || []).slice(0, 3).map((c, i) => (
                <p key={i} className="text-[14px]" style={{ color: LIGHT_SLATE }}>
                  {c.name} <span style={{ color: SLATE, fontFamily: MONO, fontSize: '12px' }}>· {c.issuer} {c.date ? `(${c.date})` : ''}</span>
                </p>
              ))}
              {(certifications || []).length === 0 && <p className="text-[14px]" style={{ color: SLATE }}>Add certifications in the editor.</p>}
            </div>
          </div>
        </section>

        {/* CONTACT */}
        <section className="pb-28 text-center">
          <p style={{ color: MINT, fontFamily: MONO, fontSize: '14px' }}>05. What's Next?</p>
          <h2 className="font-syne text-4xl font-bold mt-4" style={{ color: LIGHTEST_SLATE }}>Get In Touch</h2>
          <p className="max-w-md mx-auto mt-5 text-[15px] leading-relaxed">
            I'm currently open to new opportunities. Whether you have a question or just want to say hi, I'll do my best to get back to you!
          </p>
          {profile.email && (
            <a
              href={`mailto:${profile.email}`}
              className="inline-block mt-8 px-7 py-4 rounded font-mono text-[13px] transition-all hover:-translate-y-1"
              style={{ fontFamily: MONO, color: MINT, border: `1px solid ${MINT}`, backgroundColor: 'transparent' }}
            >
              Say Hello
            </a>
          )}
          <footer className="mt-24 pb-10 text-[13px]" style={{ fontFamily: MONO, color: SLATE }}>
            Built with Aura Portfolio
          </footer>
        </section>
      </div>
    </div>
  );
};
