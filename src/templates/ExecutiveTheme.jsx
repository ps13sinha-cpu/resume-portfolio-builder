import React from 'react';
import { Mail, Phone, MapPin, Globe, Linkedin, Github, ExternalLink } from 'lucide-react';

export const ExecutiveTheme = ({ portfolio }) => {
  const { profile = {}, experience = [], education = [], skills = [], projects = [], certifications = [] } = portfolio;

  return (
    <div className="min-h-full bg-[#faf9f6] text-slate-900 font-outfit p-6 sm:p-12 selection:bg-slate-900 selection:text-white">
      <div className="max-w-4xl mx-auto bg-white p-8 sm:p-14 shadow-xl rounded-sm border border-slate-200/80 space-y-12">
        
        {/* Editorial Header */}
        <header className="border-b-2 border-slate-900 pb-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="font-playfair text-4xl sm:text-6xl font-bold tracking-tight text-slate-950">
                {profile.fullName || 'Executive Name'}
              </h1>
              <p className="font-playfair italic text-lg sm:text-xl text-slate-700 mt-1">
                {profile.title || 'Senior Executive & Leader'}
              </p>
            </div>

            {/* Contact Column */}
            <div className="text-xs space-y-1 text-slate-600 font-medium sm:text-right">
              {profile.email && <p>{profile.email}</p>}
              {profile.location && <p>{profile.location}</p>}
              {profile.linkedin && <p className="text-slate-900 font-bold">{profile.linkedin}</p>}
            </div>
          </div>

          <p className="text-sm text-slate-700 leading-relaxed pt-2 max-w-3xl font-light">
            {profile.bio}
          </p>
        </header>

        {/* Experience Section */}
        {experience.length > 0 && (
          <section className="space-y-6">
            <h2 className="font-playfair text-xl font-bold uppercase tracking-wider text-slate-950 border-b border-slate-300 pb-1.5">
              Leadership & Professional Experience
            </h2>
            <div className="space-y-8">
              {experience.map((exp, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                    <h3 className="font-bold text-lg text-slate-950">{exp.role} — <span className="font-semibold text-slate-700">{exp.company}</span></h3>
                    <span className="text-xs font-mono text-slate-500 font-semibold">{exp.start} – {exp.isCurrent ? 'Present' : exp.end}</span>
                  </div>
                  {exp.bullets && exp.bullets.length > 0 && (
                    <ul className="space-y-1.5 pl-4 list-disc text-xs sm:text-sm text-slate-700 leading-relaxed">
                      {exp.bullets.map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Selected Projects */}
        {projects.length > 0 && (
          <section className="space-y-6">
            <h2 className="font-playfair text-xl font-bold uppercase tracking-wider text-slate-950 border-b border-slate-300 pb-1.5">
              Key Strategic Initiatives & Projects
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {projects.map((proj, idx) => (
                <div key={idx} className="p-4 rounded border border-slate-200 bg-slate-50/50 space-y-2">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-slate-900 text-base">{proj.title}</h3>
                    {proj.liveUrl && (
                      <a href={proj.liveUrl} target="_blank" rel="noreferrer" className="text-xs text-slate-700 hover:text-black font-semibold">
                        Link ↗
                      </a>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{proj.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Core Competencies & Credentials */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-200">
          
          {skills.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-playfair text-sm font-bold uppercase tracking-wider text-slate-950">Core Competencies</h3>
              <div className="flex flex-wrap gap-1.5">
                {skills.map((sk, idx) => (
                  <span key={idx} className="px-2.5 py-1 rounded bg-slate-100 text-slate-800 text-xs font-medium border border-slate-300">
                    {sk.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {education.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-playfair text-sm font-bold uppercase tracking-wider text-slate-950">Education & Academic Background</h3>
              {education.map((edu, idx) => (
                <div key={idx} className="text-xs text-slate-800 space-y-0.5">
                  <p className="font-bold text-slate-950">{edu.degree} in {edu.field}</p>
                  <p className="text-slate-600">{edu.institution} ({edu.start} - {edu.end})</p>
                </div>
              ))}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
