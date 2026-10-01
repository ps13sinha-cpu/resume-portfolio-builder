import React from 'react';
import { ExternalLink, Github, Mail, MapPin } from 'lucide-react';

// Bento Grid — the Apple-style tile mosaic that dominated 2026 portfolios
// (bentogrids.com, bento.me pattern): compact cards of varying span in a
// dense grid, each tile a self-contained unit, generous radius, dark base.
const ACCENT = '#7FA8E8';
const INK = '#0A0A0F';
const TILE = 'rgba(255,255,255,0.045)';
const TILE_BORDER = 'rgba(255,255,255,0.09)';

const Tile = ({ children, className = '', style = {}, hover = true }) => (
  <div
    className={`rounded-3xl p-5 ${className}`}
    style={{
      background: TILE,
      border: `1px solid ${TILE_BORDER}`,
      transition: 'transform 0.25s ease, border-color 0.25s ease, background 0.25s ease',
      ...style
    }}
    onMouseEnter={hover ? (e) => {
      e.currentTarget.style.transform = 'translateY(-3px)';
      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.20)';
      e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
    } : undefined}
    onMouseLeave={hover ? (e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.borderColor = TILE_BORDER;
      e.currentTarget.style.background = TILE;
    } : undefined}
  >
    {children}
  </div>
);

const TileLabel = ({ icon: Icon, children }) => (
  <div className="flex items-center gap-2 mb-3">
    {Icon && <Icon className="w-3.5 h-3.5" style={{ color: ACCENT }} />}
    <span className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: '#6B7280' }}>
      {children}
    </span>
  </div>
);

export const BentoTheme = ({ portfolio }) => {
  const { profile = {}, experience = [], education = [], skills = [], projects = [], certifications = [] } = portfolio;
  const featuredProjects = projects.slice(0, 4);
  const topSkills = skills.slice(0, 6);

  return (
    <div className="min-h-full font-outfit" style={{ backgroundColor: INK, color: '#F5F5F7' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">

        {/* Masthead row: identity tile + status tile */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 auto-rows-auto">
          {/* Identity tile — spans 2x2 */}
          <Tile className="col-span-2 row-span-2 flex flex-col justify-between" style={{ minHeight: '220px', background: 'rgba(255,255,255,0.07)' }}>
            <div className="flex items-start justify-between">
              {profile.avatarUrl && (
                <img src={profile.avatarUrl} alt={profile.fullName} className="w-14 h-14 rounded-2xl object-cover" />
              )}
              {profile.statusPill && (
                <span
                  className="px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider"
                  style={{ color: ACCENT, background: 'rgba(127,168,232,0.12)', border: '1px solid rgba(127,168,232,0.3)' }}
                >
                  {profile.statusPill}
                </span>
              )}
            </div>
            <div className="space-y-1.5">
              <h1 className="font-syne text-2xl sm:text-3xl font-black tracking-tight leading-none">
                {profile.fullName || 'Your Name'}
              </h1>
              <p className="text-xs" style={{ color: ACCENT }}>{profile.title}</p>
              <p className="text-[11px] leading-relaxed line-clamp-3" style={{ color: '#9CA3AF' }}>
                {profile.bio}
              </p>
            </div>
          </Tile>

          {/* Location tile */}
          {profile.location && (
            <Tile className="flex flex-col justify-between" style={{ minHeight: '104px' }}>
              <TileLabel icon={MapPin}>Based in</TileLabel>
              <p className="text-xs font-medium leading-snug">{profile.location}</p>
            </Tile>
          )}

          {/* Contact tile */}
          <Tile className="flex flex-col justify-between" style={{ minHeight: '104px' }}>
            <TileLabel icon={Mail}>Contact</TileLabel>
            <div className="space-y-1">
              {profile.email && (
                <a href={`mailto:${profile.email}`} className="text-[11px] hover:underline block truncate" style={{ color: ACCENT }}>
                  {profile.email}
                </a>
              )}
              <div className="flex gap-2 pt-0.5">
                {profile.github && <a href={profile.github} target="_blank" rel="noreferrer" className="text-[10px] underline" style={{ color: '#9CA3AF' }}>GitHub</a>}
                {profile.linkedin && <a href={profile.linkedin} target="_blank" rel="noreferrer" className="text-[10px] underline" style={{ color: '#9CA3AF' }}>LinkedIn</a>}
                {profile.website && <a href={profile.website} target="_blank" rel="noreferrer" className="text-[10px] underline" style={{ color: '#9CA3AF' }}>Web</a>}
              </div>
            </div>
          </Tile>

          {/* Experience count tile */}
          {experience.length > 0 && (
            <Tile className="flex flex-col justify-between" style={{ minHeight: '104px' }}>
              <TileLabel>Experience</TileLabel>
              <div>
                <p className="font-syne text-3xl font-black leading-none">{experience.length}+</p>
                <p className="text-[10px] mt-1" style={{ color: '#9CA3AF' }}>roles & counting</p>
              </div>
            </Tile>
          )}

          {/* Projects count tile */}
          {projects.length > 0 && (
            <Tile className="flex flex-col justify-between" style={{ minHeight: '104px' }}>
              <TileLabel>Projects</TileLabel>
              <div>
                <p className="font-syne text-3xl font-black leading-none">{projects.length}</p>
                <p className="text-[10px] mt-1" style={{ color: '#9CA3AF' }}>shipped builds</p>
              </div>
            </Tile>
          )}

          {/* Skills tile — spans 2 */}
          {topSkills.length > 0 && (
            <Tile className="col-span-2" style={{ minHeight: '104px' }}>
              <TileLabel>Stack</TileLabel>
              <div className="flex flex-wrap gap-1.5">
                {topSkills.map((sk, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-full text-[10px] font-medium"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', color: '#D1D5DB' }}
                  >
                    {sk.name}
                  </span>
                ))}
              </div>
            </Tile>
          )}
        </div>

        {/* PROJECTS — bento mosaic: first tile spans 2 */}
        {featuredProjects.length > 0 && (
          <section className="mt-4">
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="font-syne text-sm font-bold uppercase tracking-[0.2em]">Selected Work</h2>
              <span className="text-[10px]" style={{ color: '#6B7280' }}>{projects.length} total</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {featuredProjects.map((proj, idx) => (
                <Tile
                  key={idx}
                  className={`overflow-hidden flex flex-col ${idx === 0 ? 'col-span-2' : ''}`}
                  style={{ minHeight: idx === 0 ? '260px' : '200px', padding: 0 }}
                >
                  {proj.imageUrl && (
                    <div className={idx === 0 ? 'h-40' : 'h-24'} style={{ overflow: 'hidden' }}>
                      <img src={proj.imageUrl} alt={proj.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-4 space-y-1.5 flex-1 flex flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-syne text-sm font-bold leading-tight">{proj.title}</h3>
                      <div className="flex gap-1.5 shrink-0">
                        {proj.liveUrl && <a href={proj.liveUrl} target="_blank" rel="noreferrer" title="Live" style={{ color: '#6B7280' }} className="hover:text-white"><ExternalLink className="w-3.5 h-3.5" /></a>}
                        {proj.githubUrl && <a href={proj.githubUrl} target="_blank" rel="noreferrer" title="Source" style={{ color: '#6B7280' }} className="hover:text-white"><Github className="w-3.5 h-3.5" /></a>}
                      </div>
                    </div>
                    <p className={`text-[11px] leading-relaxed ${idx === 0 ? '' : 'line-clamp-2'}`} style={{ color: '#9CA3AF' }}>
                      {proj.description}
                    </p>
                    <div className="flex flex-wrap gap-1 pt-auto mt-auto">
                      {(proj.techTags || []).slice(0, idx === 0 ? 6 : 3).map((t, i) => (
                        <span key={i} className="px-1.5 py-0.5 rounded text-[9px]" style={{ background: 'rgba(255,255,255,0.06)', color: '#9CA3AF' }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </Tile>
              ))}
            </div>
          </section>
        )}

        {/* TIMELINE + EDUCATION row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          {experience.length > 0 && (
            <Tile hover={false}>
              <TileLabel>Career</TileLabel>
              <div className="space-y-3">
                {experience.slice(0, 3).map((job, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: i === 0 ? ACCENT : 'rgba(255,255,255,0.25)' }} />
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold leading-tight">{job.role}</p>
                      <p className="text-[10px]" style={{ color: '#9CA3AF' }}>{job.company} · {job.start}—{job.end}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Tile>
          )}

          {(education.length > 0 || certifications.length > 0) && (
            <Tile hover={false}>
              <TileLabel>Education</TileLabel>
              <div className="space-y-3">
                {education.slice(0, 2).map((edu, i) => (
                  <div key={i} className="space-y-0.5">
                    <p className="text-xs font-semibold leading-tight">{edu.degree}{edu.field ? `, ${edu.field}` : ''}</p>
                    <p className="text-[10px]" style={{ color: '#9CA3AF' }}>{edu.institution} · {edu.end}</p>
                  </div>
                ))}
                {certifications.slice(0, 2).map((c, i) => (
                  <div key={`c${i}`} className="space-y-0.5">
                    <p className="text-xs font-semibold leading-tight">{c.name}</p>
                    <p className="text-[10px]" style={{ color: '#9CA3AF' }}>{c.issuer} · {c.date}</p>
                  </div>
                ))}
              </div>
            </Tile>
          )}
        </div>

        {/* Skills full detail */}
        {skills.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
            {skills.slice(0, 6).map((sk, i) => (
              <Tile key={i} className="space-y-2" style={{ minHeight: '88px' }}>
                <p className="text-xs font-semibold leading-tight">{sk.name}</p>
                <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <div className="h-full rounded-full" style={{ width: `${sk.level}%`, backgroundColor: ACCENT }} />
                </div>
                <p className="text-[9px]" style={{ color: '#6B7280' }}>{sk.category}</p>
              </Tile>
            ))}
          </div>
        )}

        <footer className="text-center py-8">
          <p className="text-[10px] tracking-[0.3em] uppercase" style={{ color: '#6B7280' }}>
            {profile.fullName || 'Portfolio'} — Built with Aura
          </p>
        </footer>
      </div>
    </div>
  );
};
