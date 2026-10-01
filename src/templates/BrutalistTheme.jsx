import React from 'react';
import { ArrowUpRight, Zap, Terminal, Sparkles, Star } from 'lucide-react';

export const BrutalistTheme = ({ portfolio }) => {
  const { profile = {}, experience = [], education = [], skills = [], projects = [], certifications = [] } = portfolio;

  return (
    <div className="min-h-full bg-slate-950 text-white font-space selection:bg-yellow-400 selection:text-black p-4 sm:p-10 space-y-10">
      <div className="max-w-4xl mx-auto space-y-10">
        
        {/* Hero Card */}
        <div className="p-8 bg-amber-300 text-slate-950 border-4 border-white shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] rounded-xl space-y-6">
          <div className="inline-block px-3 py-1 bg-black text-white text-xs font-bold uppercase tracking-wider">
            ⚡ {profile.title || 'Creator'}
          </div>
          <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tight leading-none">
            {profile.fullName || 'YOUR NAME'}
          </h1>
          <p className="text-base sm:text-lg font-bold leading-relaxed max-w-2xl border-l-4 border-black pl-4">
            {profile.bio}
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            {profile.email && (
              <a href={`mailto:${profile.email}`} className="px-5 py-2.5 bg-black text-white font-bold text-xs hover:bg-white hover:text-black transition-all border-2 border-black">
                {profile.email} ✉
              </a>
            )}
            {profile.github && (
              <a href={profile.github} target="_blank" rel="noreferrer" className="px-5 py-2.5 bg-white text-black font-bold text-xs border-2 border-black hover:bg-black hover:text-white transition-all">
                GITHUB ↗
              </a>
            )}
          </div>
        </div>

        {/* Skills Section */}
        {skills.length > 0 && (
          <div className="p-6 bg-cyan-400 text-black border-4 border-white shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] rounded-xl space-y-4">
            <h2 className="text-xl font-black uppercase tracking-wider">SKILLS & ARSENAL</h2>
            <div className="flex flex-wrap gap-2">
              {skills.map((sk, i) => (
                <span key={i} className="px-3 py-1.5 bg-black text-yellow-300 font-extrabold text-xs uppercase border-2 border-black">
                  ★ {sk.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Projects Section */}
        {projects.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-black uppercase tracking-wider text-pink-400">FEATURED PROJECTS</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {projects.map((proj, idx) => (
                <div key={idx} className="p-6 bg-slate-900 border-4 border-pink-400 shadow-[6px_6px_0px_0px_#f472b6] rounded-xl space-y-3">
                  <div className="flex justify-between items-start">
                    <h3 className="text-xl font-black text-white uppercase">{proj.title}</h3>
                    {proj.liveUrl && (
                      <a href={proj.liveUrl} target="_blank" rel="noreferrer" className="p-1 bg-pink-400 text-black font-bold text-xs">
                        <ArrowUpRight className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 font-bold leading-relaxed">{proj.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Experience Section */}
        {experience.length > 0 && (
          <div className="p-6 bg-slate-900 border-4 border-white shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] rounded-xl space-y-6">
            <h2 className="text-2xl font-black uppercase text-yellow-400">EXPERIENCE & ROLES</h2>
            <div className="space-y-6">
              {experience.map((exp, idx) => (
                <div key={idx} className="p-4 bg-slate-950 border-2 border-slate-700 rounded space-y-2">
                  <div className="flex justify-between items-baseline">
                    <h3 className="text-lg font-black text-white">{exp.role} @ {exp.company}</h3>
                    <span className="text-xs font-mono font-bold text-cyan-400">{exp.start} - {exp.isCurrent ? 'NOW' : exp.end}</span>
                  </div>
                  {exp.bullets && exp.bullets.map((b, i) => (
                    <p key={i} className="text-xs text-slate-300 font-bold pl-3 border-l-2 border-yellow-400">⚡ {b}</p>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
