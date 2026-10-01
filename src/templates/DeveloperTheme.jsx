import React from 'react';
import { Terminal, GitBranch, FolderGit2, Cpu, ExternalLink, Github, Linkedin, Mail, CheckCircle2 } from 'lucide-react';

export const DeveloperTheme = ({ portfolio }) => {
  const { profile = {}, experience = [], education = [], skills = [], projects = [], certifications = [] } = portfolio;

  return (
    <div className="min-h-full bg-[#0d1117] text-slate-200 font-code selection:bg-cyan-500 selection:text-slate-950 p-4 sm:p-8 space-y-8">
      
      {/* IDE Window Frame */}
      <div className="max-w-4xl mx-auto rounded-xl border border-slate-800 bg-[#161b22] shadow-2xl overflow-hidden">
        
        {/* IDE Title Bar */}
        <div className="bg-[#0d1117] px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
            <span className="text-xs text-slate-400 font-mono ml-2 hidden sm:inline">bash — 80x24 — {profile.slug || 'portfolio'}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <GitBranch className="w-3.5 h-3.5 text-emerald-400" />
            <span>main*</span>
          </div>
        </div>

        {/* IDE Tabs */}
        <div className="bg-[#161b22] px-2 flex border-b border-slate-800 overflow-x-auto">
          <div className="px-4 py-2 bg-[#0d1117] border-t-2 border-cyan-400 text-cyan-300 text-xs font-mono flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5" />
            <span>developer_profile.tsx</span>
          </div>
          <div className="px-4 py-2 text-slate-400 text-xs font-mono flex items-center gap-2 opacity-60">
            <FolderGit2 className="w-3.5 h-3.5" />
            <span>projects.json</span>
          </div>
        </div>

        {/* Terminal Content */}
        <div className="p-6 sm:p-10 space-y-10">
          
          {/* Header Command Prompt */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
              <span>visitor@aura-terminal:~$</span>
              <span className="text-slate-300">whoami</span>
            </div>
            <div className="p-4 rounded-lg bg-[#0d1117] border border-slate-800/80 space-y-2">
              <h1 className="text-2xl sm:text-4xl font-bold text-cyan-300">{profile.fullName || 'Developer'}</h1>
              <p className="text-sm text-purple-300">// {profile.title || 'Software Architect'}</p>
              <p className="text-xs text-slate-400 leading-relaxed">{profile.bio}</p>
              
              {/* Quick links */}
              <div className="pt-3 flex flex-wrap gap-4 text-xs text-slate-300">
                {profile.email && <a href={`mailto:${profile.email}`} className="text-emerald-400 hover:underline">email: "{profile.email}"</a>}
                {profile.github && <a href={profile.github} target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline">github: "{profile.github}"</a>}
                {profile.linkedin && <a href={profile.linkedin} target="_blank" rel="noreferrer" className="text-purple-400 hover:underline">linkedin: "{profile.linkedin}"</a>}
              </div>
            </div>
          </div>

          {/* Tech Stack Command */}
          {skills.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
                <span>visitor@aura-terminal:~$</span>
                <span className="text-slate-300">cat skills.config.ts</span>
              </div>
              <div className="p-4 rounded-lg bg-[#0d1117] border border-slate-800">
                <div className="flex flex-wrap gap-2">
                  {skills.map((sk, idx) => (
                    <span key={idx} className="px-3 py-1 rounded bg-[#161b22] border border-slate-700 text-xs font-mono text-cyan-300">
                      <span className="text-slate-500">const</span> {sk.name} <span className="text-emerald-400">= {sk.level}%</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Projects Command */}
          {projects.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
                <span>visitor@aura-terminal:~$</span>
                <span className="text-slate-300">git log --projects</span>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {projects.map((proj, idx) => (
                  <div key={idx} className="p-4 rounded-lg bg-[#0d1117] border border-slate-800 hover:border-cyan-500/50 transition-all space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <FolderGit2 className="w-4 h-4 text-cyan-400" />
                        {proj.title}
                      </h3>
                      {proj.liveUrl && (
                        <a href={proj.liveUrl} target="_blank" rel="noreferrer" className="text-xs text-cyan-400 hover:underline flex items-center gap-1">
                          <span>Live Demo</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">{proj.description}</p>
                    {proj.techTags && (
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {proj.techTags.map((t, i) => (
                          <span key={i} className="text-[10px] font-mono text-purple-400 bg-[#161b22] px-2 py-0.5 rounded border border-slate-800">
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Work History Git Branch */}
          {experience.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
                <span>visitor@aura-terminal:~$</span>
                <span className="text-slate-300">git log --oneline --graph</span>
              </div>
              <div className="space-y-4 pl-2">
                {experience.map((exp, idx) => (
                  <div key={idx} className="border-l-2 border-emerald-500/40 pl-4 py-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <h4 className="text-sm font-bold text-white">{exp.role} @ {exp.company}</h4>
                      <span className="text-[11px] text-slate-500">({exp.start} - {exp.isCurrent ? 'Present' : exp.end})</span>
                    </div>
                    {exp.bullets && exp.bullets.map((b, i) => (
                      <p key={i} className="text-xs text-slate-400 pl-4">→ {b}</p>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
