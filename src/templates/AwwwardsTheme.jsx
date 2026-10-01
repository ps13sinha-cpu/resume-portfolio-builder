import React from 'react';
import { 
  Github, 
  Linkedin, 
  Twitter, 
  Mail, 
  Globe, 
  ArrowUpRight, 
  Briefcase, 
  GraduationCap, 
  Award, 
  Sparkles,
  ExternalLink,
  Code2
} from 'lucide-react';

export const AwwwardsTheme = ({ portfolio }) => {
  const { profile = {}, experience = [], education = [], skills = [], projects = [], certifications = [] } = portfolio;

  // Group skills for marquee ticker
  const skillNames = skills.map(s => s.name);
  const marqueeItems = [...skillNames, ...skillNames, ...skillNames, ...skillNames];

  return (
    <div className="relative min-h-full bg-[#080a11] text-slate-100 font-outfit selection:bg-indigo-500 selection:text-white pb-20 overflow-hidden">
      
      {/* Background Ambient Glow Orbs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none animate-ambient" />
      <div className="absolute top-[40%] right-10 w-[450px] h-[450px] bg-purple-600/10 rounded-full blur-[130px] pointer-events-none animate-ambient" />
      <div className="absolute bottom-10 left-10 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[150px] pointer-events-none" />

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-6 pt-12 md:pt-20 space-y-24">
        
        {/* HERO SECTION */}
        <section className="space-y-8">
          
          {/* Status Pill */}
          {profile.statusPill && (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>{profile.statusPill}</span>
            </div>
          )}

          {/* Oversized Display Name */}
          <div className="space-y-3">
            <h1 className="font-syne text-5xl sm:text-7xl md:text-8xl font-extrabold tracking-tight text-gradient-awwwards leading-[0.95] capitalize">
              {profile.fullName || 'Your Name'}
            </h1>
            <p className="font-syne text-xl sm:text-2xl md:text-3xl font-bold text-slate-300 tracking-wide">
              {profile.title || 'Full-Stack Architect'}
            </p>
          </div>

          {/* Bio statement */}
          <p className="max-w-2xl text-base sm:text-lg text-slate-400 leading-relaxed font-light">
            {profile.bio || 'Crafting next-generation digital products and high-performance interactive web applications.'}
          </p>

          {/* Avatar & Social Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-6 pt-4 border-t border-slate-800/80">
            {profile.avatarUrl && (
              <div className="flex items-center gap-4">
                <img 
                  src={profile.avatarUrl} 
                  alt={profile.fullName} 
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-indigo-500/30 shadow-xl shadow-indigo-500/10"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Based in</span>
                  <span className="text-sm font-bold text-slate-200">{profile.location || 'Remote'}</span>
                </div>
              </div>
            )}

            {/* Social Icons */}
            <div className="flex items-center gap-3">
              {profile.github && (
                <a href={profile.github} target="_blank" rel="noreferrer" data-cursor="GitHub" className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 hover:text-indigo-400 text-slate-300 transition-all">
                  <Github className="w-5 h-5" />
                </a>
              )}
              {profile.linkedin && (
                <a href={profile.linkedin} target="_blank" rel="noreferrer" data-cursor="LinkedIn" className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 hover:text-indigo-400 text-slate-300 transition-all">
                  <Linkedin className="w-5 h-5" />
                </a>
              )}
              {profile.twitter && (
                <a href={profile.twitter} target="_blank" rel="noreferrer" data-cursor="Twitter" className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 hover:text-indigo-400 text-slate-300 transition-all">
                  <Twitter className="w-5 h-5" />
                </a>
              )}
              {profile.email && (
                <a href={`mailto:${profile.email}`} data-cursor="Contact" className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all">
                  <Mail className="w-4 h-4" />
                  <span>Get in Touch</span>
                </a>
              )}
            </div>
          </div>
        </section>

        {/* SKILLS MARQUEE TICKER */}
        {skills.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <h2 className="font-syne text-xs font-bold text-slate-400 uppercase tracking-widest">Technologies & Capabilities</h2>
            </div>
            
            <div className="relative w-full overflow-hidden py-4 border-y border-slate-800/80 bg-slate-950/40">
              <div className="animate-marquee flex items-center gap-8 whitespace-nowrap">
                {marqueeItems.map((sk, idx) => (
                  <div key={idx} className="flex items-center gap-8">
                    <span className="font-syne text-xl font-extrabold text-slate-300 hover:text-indigo-400 transition-colors cursor-default">
                      {sk}
                    </span>
                    <span className="w-2 h-2 rounded-full bg-indigo-500/50" />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* FEATURED PROJECTS SHOWCASE */}
        {projects.length > 0 && (
          <section className="space-y-10">
            <div className="flex items-end justify-between border-b border-slate-800/80 pb-4">
              <div>
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest block mb-1">Selected Works</span>
                <h2 className="font-syne text-3xl sm:text-4xl font-extrabold text-white">Featured Projects</h2>
              </div>
              <span className="text-xs font-mono text-slate-500">[{projects.length} Works]</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {projects.map((proj, index) => (
                <div 
                  key={proj.id || index}
                  data-cursor="View Project"
                  className="glass-panel-interactive rounded-2xl p-6 flex flex-col justify-between group relative overflow-hidden"
                >
                  {/* Image banner */}
                  {proj.imageUrl && (
                    <div className="w-full h-48 rounded-xl overflow-hidden mb-5 bg-slate-900 border border-slate-800 relative">
                      <img 
                        src={proj.imageUrl} 
                        alt={proj.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent" />
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-syne text-2xl font-bold text-white group-hover:text-indigo-400 transition-colors">
                        {proj.title}
                      </h3>
                      {proj.liveUrl && (
                        <a href={proj.liveUrl} target="_blank" rel="noreferrer" className="p-2 rounded-lg bg-slate-800 text-slate-300 group-hover:text-white group-hover:bg-indigo-600 transition-all">
                          <ArrowUpRight className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                    <p className="text-sm text-slate-400 leading-relaxed">{proj.description}</p>
                  </div>

                  {/* Tech stack pills */}
                  {proj.techTags && proj.techTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-6 pt-4 border-t border-slate-800/60">
                      {proj.techTags.map((tag, tIdx) => (
                        <span key={tIdx} className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-[11px] font-mono text-indigo-300">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* EXPERIENCE TIMELINE */}
        {experience.length > 0 && (
          <section className="space-y-10">
            <div className="border-b border-slate-800/80 pb-4">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest block mb-1">Career Journey</span>
              <h2 className="font-syne text-3xl sm:text-4xl font-extrabold text-white">Professional Experience</h2>
            </div>

            <div className="relative pl-6 sm:pl-8 border-l-2 border-indigo-500/20 space-y-12">
              {experience.map((exp, index) => (
                <div key={exp.id || index} className="relative group">
                  
                  {/* Glow timeline node */}
                  <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 w-4 h-4 rounded-full bg-slate-950 border-2 border-indigo-500 group-hover:border-purple-400 group-hover:scale-125 transition-all shadow-md shadow-indigo-500/40" />

                  <div className="glass-panel p-6 rounded-2xl space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h3 className="font-syne text-xl font-bold text-white">{exp.role}</h3>
                        <span className="text-sm font-semibold text-indigo-400">{exp.company}</span>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono text-slate-400">
                        {exp.start} — {exp.isCurrent ? 'Present' : exp.end}
                      </span>
                    </div>

                    {/* Bullet points */}
                    {exp.bullets && exp.bullets.length > 0 && (
                      <ul className="space-y-2 pt-2">
                        {exp.bullets.map((bullet, bIdx) => (
                          <li key={bIdx} className="text-sm text-slate-300 flex items-start gap-2.5 leading-relaxed">
                            <span className="text-indigo-400 font-bold mt-1 text-xs">✦</span>
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* EDUCATION & CERTIFICATIONS GRID */}
        {(education.length > 0 || certifications.length > 0) && (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Education Column */}
            {education.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                  <GraduationCap className="w-5 h-5 text-indigo-400" />
                  <h3 className="font-syne text-xl font-bold text-white">Education</h3>
                </div>
                <div className="space-y-4">
                  {education.map((edu, idx) => (
                    <div key={edu.id || idx} className="glass-panel p-5 rounded-xl space-y-2">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-white text-base">{edu.degree} in {edu.field}</h4>
                        <span className="text-xs font-mono text-slate-400">{edu.start} - {edu.end}</span>
                      </div>
                      <p className="text-sm font-medium text-indigo-400">{edu.institution}</p>
                      {edu.grade && <p className="text-xs font-mono text-slate-400">Grade: {edu.grade}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Certifications Column */}
            {certifications.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                  <Award className="w-5 h-5 text-purple-400" />
                  <h3 className="font-syne text-xl font-bold text-white">Certifications</h3>
                </div>
                <div className="space-y-4">
                  {certifications.map((cert, idx) => (
                    <div key={cert.id || idx} className="glass-panel p-5 rounded-xl space-y-2">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-white text-base">{cert.name}</h4>
                        <span className="text-xs font-mono text-slate-400">{cert.date}</span>
                      </div>
                      <p className="text-sm font-medium text-purple-400">{cert.issuer}</p>
                      {cert.credentialUrl && (
                        <a href={cert.credentialUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:underline">
                          <span>View Credential</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </section>
        )}

        {/* FOOTER CALL TO ACTION */}
        <footer className="pt-12 border-t border-slate-800/80 text-center space-y-6">
          <h2 className="font-syne text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Let's build something remarkable together.
          </h2>
          {profile.email && (
            <a 
              href={`mailto:${profile.email}`} 
              data-cursor="Say Hello"
              className="inline-block font-syne text-2xl sm:text-4xl font-bold text-indigo-400 hover:text-white transition-colors underline decoration-indigo-500 underline-offset-8"
            >
              {profile.email}
            </a>
          )}
          <p className="text-xs text-slate-500 font-mono pt-4">
            Designed & Rendered with AuraPortfolio Awwwards Engine • © {new Date().getFullYear()}
          </p>
        </footer>

      </div>
    </div>
  );
};
