import React from 'react';
import { resumeData } from './resumeData';

// Resume designs. Every design:
//  - renders on an 820px-wide white page (≈ A4 at screen resolution)
//  - uses real text for everything (no text in images/icons) so the PDF is
//    ATS-readable
//  - takes { portfolio, accent } — accent is a hex colour for designs that
//    use one
const INK = '#16181D';
const SOFT = 'rgba(22,24,29,0.72)';
const FAINT = 'rgba(22,24,29,0.5)';

const Page = ({ children, font = "'Outfit', sans-serif", className = 'px-14 py-12' }) => (
  <div className="bg-white" style={{ color: INK, fontFamily: font }}>
    <div className={`max-w-[820px] mx-auto ${className}`}>{children}</div>
  </div>
);

const Bullets = ({ items, marker = '•', color = FAINT, className = 'text-[12px]' }) => (
  <ul className="mt-1.5 space-y-1">
    {items.map((b, i) => (
      <li key={i} className={`${className} leading-relaxed flex gap-2`} style={{ color: 'rgba(22,24,29,0.86)' }}>
        <span className="shrink-0" style={{ color }}>{marker}</span>
        <span>{b}</span>
      </li>
    ))}
  </ul>
);

const Row = ({ left, right, rightStyle }) => (
  <div className="flex flex-wrap items-baseline justify-between gap-x-4">
    {left}
    {right && <span className="text-[11px] whitespace-nowrap" style={{ color: FAINT, ...rightStyle }}>{right}</span>}
  </div>
);

// ---------------------------------------------------------------------------
// 1. Classic — traditional serif, centered header, small-caps rules
// ---------------------------------------------------------------------------
export const ClassicResume = ({ portfolio }) => {
  const d = resumeData(portfolio);
  const H = ({ children }) => (
    <h2 className="mt-6 mb-2.5 text-[13px] font-bold tracking-[0.14em] uppercase pb-1" style={{ fontVariant: 'small-caps', borderBottom: `1px solid ${INK}` }}>
      {children}
    </h2>
  );
  return (
    <Page font="Georgia, 'Times New Roman', serif">
      <header className="text-center">
        <h1 className="text-[34px] leading-tight" style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700 }}>{d.name}</h1>
        {d.title && <p className="text-[13px] italic mt-1" style={{ color: SOFT }}>{d.title}</p>}
        <p className="text-[11px] mt-2" style={{ color: SOFT }}>{d.contacts.map((c) => c.text).join('  ·  ')}</p>
      </header>
      {d.summary && (<><H>Summary</H><p className="text-[12.5px] leading-relaxed">{d.summary}</p></>)}
      {d.experience.length > 0 && (
        <><H>Experience</H>
          <div className="space-y-4">
            {d.experience.map((e, i) => (
              <div key={i}>
                <Row left={<h3 className="text-[13.5px] font-bold">{e.company}{e.location ? <span className="font-normal">, {e.location}</span> : null}</h3>} right={e.dates} />
                <p className="text-[12.5px] italic">{e.role}</p>
                <Bullets items={e.bullets} marker="–" />
              </div>
            ))}
          </div>
        </>
      )}
      {d.projects.length > 0 && (
        <><H>Projects</H>
          <div className="space-y-2.5">
            {d.projects.map((p, i) => (
              <div key={i} className="text-[12.5px] leading-relaxed">
                <span className="font-bold">{p.title}</span>
                {p.tech.length > 0 && <span className="italic" style={{ color: SOFT }}> ({p.tech.join(', ')})</span>}
                {p.description && <span>. {p.description}</span>}
              </div>
            ))}
          </div>
        </>
      )}
      {d.education.length > 0 && (
        <><H>Education</H>
          {d.education.map((e, i) => (
            <div key={i} className="mb-2">
              <Row left={<h3 className="text-[13px] font-bold">{e.institution}</h3>} right={e.dates} />
              <p className="text-[12.5px] italic">{e.degree}{e.grade ? ` — ${e.grade}` : ''}</p>
            </div>
          ))}
        </>
      )}
      {d.skillGroups.length > 0 && (
        <><H>Skills</H>
          {d.skillGroups.map(([cat, names]) => (
            <p key={cat} className="text-[12.5px] leading-relaxed"><span className="font-bold">{cat}:</span> {names.join(', ')}</p>
          ))}
        </>
      )}
      {d.certifications.length > 0 && (
        <><H>Certifications</H>
          {d.certifications.map((c, i) => (
            <p key={i} className="text-[12.5px]"><span className="font-bold">{c.name}</span>{c.issuer ? `, ${c.issuer}` : ''}{c.date ? ` (${c.date})` : ''}</p>
          ))}
        </>
      )}
    </Page>
  );
};

// ---------------------------------------------------------------------------
// 2. Sidebar — tinted left column for contact/skills/education
// ---------------------------------------------------------------------------
export const SidebarResume = ({ portfolio, accent }) => {
  const d = resumeData(portfolio);
  const SideH = ({ children }) => <h2 className="text-[10px] font-bold uppercase tracking-[0.16em] mb-2 mt-6 first:mt-0" style={{ color: accent }}>{children}</h2>;
  const MainH = ({ children }) => (
    <h2 className="text-[12px] font-bold uppercase tracking-[0.14em] mb-3 mt-7 first:mt-0 flex items-center gap-3" style={{ color: accent }}>
      {children}<span className="flex-1 h-px" style={{ background: `${accent}40` }} />
    </h2>
  );
  return (
    <div className="bg-white" style={{ color: INK, fontFamily: "'Outfit', sans-serif" }}>
      <div className="max-w-[820px] mx-auto grid" style={{ gridTemplateColumns: '255px 1fr' }}>
        <aside className="px-7 py-12" style={{ background: `${accent}12` }}>
          <h1 className="text-[26px] font-bold leading-tight">{d.name}</h1>
          {d.title && <p className="text-[12px] mt-1 font-medium" style={{ color: accent }}>{d.title}</p>}
          <div className="mt-8">
            <SideH>Contact</SideH>
            {d.contacts.map((c, i) => (
              <p key={i} className="text-[11px] leading-snug mb-2 break-words">
                <span className="block text-[9px] uppercase tracking-wider" style={{ color: FAINT }}>{c.label}</span>{c.text}
              </p>
            ))}
            {d.skillGroups.length > 0 && <SideH>Skills</SideH>}
            {d.skillGroups.map(([cat, names]) => (
              <div key={cat} className="mb-3">
                {d.skillGroups.length > 1 && <p className="text-[11px] font-semibold mb-0.5">{cat}</p>}
                <p className="text-[11px] leading-relaxed" style={{ color: SOFT }}>{names.join(', ')}</p>
              </div>
            ))}
            {d.education.length > 0 && <SideH>Education</SideH>}
            {d.education.map((e, i) => (
              <div key={i} className="mb-3">
                <p className="text-[11.5px] font-semibold leading-snug">{e.degree}</p>
                <p className="text-[11px]" style={{ color: SOFT }}>{e.institution}</p>
                <p className="text-[10.5px]" style={{ color: FAINT }}>{[e.dates, e.grade].filter(Boolean).join(' · ')}</p>
              </div>
            ))}
            {d.certifications.length > 0 && <SideH>Certifications</SideH>}
            {d.certifications.map((c, i) => (
              <p key={i} className="text-[11px] leading-snug mb-2"><span className="font-semibold">{c.name}</span><br /><span style={{ color: FAINT }}>{[c.issuer, c.date].filter(Boolean).join(' · ')}</span></p>
            ))}
          </div>
        </aside>
        <main className="px-9 py-12">
          {d.summary && (<><MainH>Profile</MainH><p className="text-[12.5px] leading-relaxed" style={{ color: 'rgba(22,24,29,0.86)' }}>{d.summary}</p></>)}
          {d.experience.length > 0 && <MainH>Experience</MainH>}
          <div className="space-y-5">
            {d.experience.map((e, i) => (
              <div key={i}>
                <Row left={<h3 className="text-[14px] font-bold">{e.role}</h3>} right={e.dates} />
                <p className="text-[12px] font-medium" style={{ color: accent }}>{e.company}{e.location ? ` · ${e.location}` : ''}</p>
                <Bullets items={e.bullets} color={accent} />
              </div>
            ))}
          </div>
          {d.projects.length > 0 && <MainH>Projects</MainH>}
          <div className="space-y-3">
            {d.projects.map((p, i) => (
              <div key={i}>
                <h3 className="text-[13px] font-bold">{p.title}</h3>
                {p.description && <p className="text-[12px] leading-relaxed" style={{ color: 'rgba(22,24,29,0.86)' }}>{p.description}</p>}
                {p.tech.length > 0 && <p className="text-[10.5px] mt-0.5" style={{ color: FAINT }}>{p.tech.join(' · ')}</p>}
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 3. Executive — accent bar, strong name, shaded summary
// ---------------------------------------------------------------------------
export const ExecutiveResume = ({ portfolio, accent }) => {
  const d = resumeData(portfolio);
  const H = ({ children }) => <h2 className="mt-7 mb-3 text-[11px] font-extrabold uppercase tracking-[0.2em]" style={{ color: accent }}>{children}</h2>;
  return (
    <div className="bg-white" style={{ color: INK, fontFamily: "'Outfit', sans-serif" }}>
      <div className="h-2.5" style={{ background: accent }} />
      <div className="max-w-[820px] mx-auto px-14 pt-10 pb-12">
        <header className="flex flex-wrap items-end justify-between gap-4 pb-5" style={{ borderBottom: `2px solid ${INK}` }}>
          <div>
            <h1 className="text-[38px] font-extrabold uppercase tracking-tight leading-none">{d.name}</h1>
            {d.title && <p className="text-[14px] font-semibold mt-2 uppercase tracking-[0.12em]" style={{ color: accent }}>{d.title}</p>}
          </div>
          <div className="text-right text-[11px] leading-relaxed" style={{ color: SOFT }}>
            {d.contacts.map((c, i) => <div key={i}>{c.text}</div>)}
          </div>
        </header>
        {d.summary && (
          <div className="mt-6 px-5 py-4 text-[12.5px] leading-relaxed" style={{ background: `${accent}0F`, borderLeft: `3px solid ${accent}` }}>{d.summary}</div>
        )}
        {d.experience.length > 0 && <H>Professional Experience</H>}
        <div className="space-y-5">
          {d.experience.map((e, i) => (
            <div key={i}>
              <Row left={<h3 className="text-[14.5px] font-extrabold uppercase tracking-wide">{e.company}</h3>} right={e.dates} rightStyle={{ fontWeight: 600 }} />
              <p className="text-[12.5px] font-semibold" style={{ color: accent }}>{e.role}{e.location ? <span style={{ color: FAINT, fontWeight: 400 }}> · {e.location}</span> : null}</p>
              <Bullets items={e.bullets} marker="■" color={accent} />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-x-10">
          {d.education.length > 0 && (
            <div>
              <H>Education</H>
              {d.education.map((e, i) => (
                <div key={i} className="mb-2.5">
                  <p className="text-[12.5px] font-bold">{e.degree}</p>
                  <p className="text-[11.5px]" style={{ color: SOFT }}>{e.institution}{e.dates ? ` · ${e.dates}` : ''}</p>
                </div>
              ))}
            </div>
          )}
          {d.skillGroups.length > 0 && (
            <div>
              <H>Core Competencies</H>
              <p className="text-[12px] leading-relaxed" style={{ color: 'rgba(22,24,29,0.86)' }}>{d.allSkills.join('  •  ')}</p>
            </div>
          )}
        </div>
        {d.projects.length > 0 && <H>Key Initiatives</H>}
        {d.projects.map((p, i) => (
          <p key={i} className="text-[12px] leading-relaxed mb-1.5"><span className="font-bold">{p.title}</span>{p.description ? ` — ${p.description}` : ''}</p>
        ))}
        {d.certifications.length > 0 && <H>Certifications</H>}
        {d.certifications.map((c, i) => (
          <p key={i} className="text-[12px] mb-1"><span className="font-semibold">{c.name}</span>{c.issuer ? `, ${c.issuer}` : ''}{c.date ? ` · ${c.date}` : ''}</p>
        ))}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 4. Technical — dense, skills table first, monospace dates
// ---------------------------------------------------------------------------
export const TechnicalResume = ({ portfolio, accent }) => {
  const d = resumeData(portfolio);
  const mono = "'Fira Code', ui-monospace, monospace";
  const H = ({ children }) => (
    <h2 className="mt-5 mb-2 text-[11px] font-bold uppercase tracking-[0.12em] flex items-center gap-2" style={{ fontFamily: mono, color: accent }}>
      <span>{'//'}</span>{children}
    </h2>
  );
  return (
    <Page className="px-12 py-10">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-[28px] font-bold tracking-tight">{d.name}</h1>
        {d.title && <p className="text-[12px] font-semibold" style={{ fontFamily: mono, color: accent }}>{d.title}</p>}
      </header>
      <p className="text-[10.5px] mt-1.5 pb-3" style={{ fontFamily: mono, color: SOFT, borderBottom: `1px dashed ${FAINT}` }}>
        {d.contacts.map((c) => c.text).join(' | ')}
      </p>
      {d.skillGroups.length > 0 && (
        <><H>Technical Skills</H>
          <table className="w-full text-[11.5px]">
            <tbody>
              {d.skillGroups.map(([cat, names]) => (
                <tr key={cat} className="align-top">
                  <td className="pr-4 py-0.5 font-semibold whitespace-nowrap" style={{ width: 150 }}>{cat}</td>
                  <td className="py-0.5" style={{ color: 'rgba(22,24,29,0.86)' }}>{names.join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
      {d.summary && (<><H>Summary</H><p className="text-[11.5px] leading-relaxed">{d.summary}</p></>)}
      {d.experience.length > 0 && <H>Experience</H>}
      <div className="space-y-3.5">
        {d.experience.map((e, i) => (
          <div key={i}>
            <Row
              left={<h3 className="text-[13px] font-bold">{e.role} <span className="font-normal" style={{ color: SOFT }}>@ {e.company}</span></h3>}
              right={e.dates}
              rightStyle={{ fontFamily: mono, fontSize: 10.5 }}
            />
            <Bullets items={e.bullets} marker="›" color={accent} className="text-[11.5px]" />
          </div>
        ))}
      </div>
      {d.projects.length > 0 && <H>Projects</H>}
      <div className="space-y-2">
        {d.projects.map((p, i) => (
          <div key={i} className="text-[11.5px] leading-relaxed">
            <span className="font-bold">{p.title}</span>
            {p.tech.length > 0 && <span style={{ fontFamily: mono, fontSize: 10.5, color: accent }}> [{p.tech.join(', ')}]</span>}
            {p.description && <span style={{ color: 'rgba(22,24,29,0.86)' }}> — {p.description}</span>}
            {p.link && <span style={{ fontFamily: mono, fontSize: 10, color: FAINT }}> {p.link.replace(/^https?:\/\//, '')}</span>}
          </div>
        ))}
      </div>
      {(d.education.length > 0 || d.certifications.length > 0) && <H>Education &amp; Certifications</H>}
      {d.education.map((e, i) => (
        <Row key={i} left={<p className="text-[11.5px]"><span className="font-bold">{e.degree}</span>, {e.institution}{e.grade ? ` (${e.grade})` : ''}</p>} right={e.dates} rightStyle={{ fontFamily: mono, fontSize: 10.5 }} />
      ))}
      {d.certifications.map((c, i) => (
        <Row key={`c${i}`} left={<p className="text-[11.5px]"><span className="font-bold">{c.name}</span>{c.issuer ? `, ${c.issuer}` : ''}</p>} right={c.date} rightStyle={{ fontFamily: mono, fontSize: 10.5 }} />
      ))}
    </Page>
  );
};

// ---------------------------------------------------------------------------
// 5. Timeline — dates in a left gutter, generous whitespace
// ---------------------------------------------------------------------------
export const TimelineResume = ({ portfolio, accent }) => {
  const d = resumeData(portfolio);
  const H = ({ children }) => <h2 className="mt-9 mb-4 text-[10.5px] font-semibold uppercase tracking-[0.28em]" style={{ color: FAINT }}>{children}</h2>;
  const Item = ({ date, children }) => (
    <div className="grid gap-6 mb-5" style={{ gridTemplateColumns: '120px 1fr' }}>
      <p className="text-[11px] pt-0.5 text-right" style={{ color: FAINT }}>{date}</p>
      <div className="pl-5" style={{ borderLeft: `1.5px solid ${accent}55` }}>{children}</div>
    </div>
  );
  return (
    <Page className="px-14 py-14">
      <header>
        <h1 className="text-[40px] font-light tracking-tight leading-none">{d.name}</h1>
        {d.title && <p className="text-[13px] mt-2" style={{ color: accent }}>{d.title}</p>}
        <p className="text-[11px] mt-3" style={{ color: SOFT }}>{d.contacts.map((c) => c.text).join('   /   ')}</p>
      </header>
      {d.summary && <p className="mt-8 text-[13px] leading-relaxed max-w-[600px]" style={{ color: 'rgba(22,24,29,0.86)' }}>{d.summary}</p>}
      {d.experience.length > 0 && <H>Experience</H>}
      {d.experience.map((e, i) => (
        <Item key={i} date={e.dates}>
          <h3 className="text-[14px] font-semibold">{e.role}</h3>
          <p className="text-[12px]" style={{ color: SOFT }}>{e.company}{e.location ? `, ${e.location}` : ''}</p>
          <Bullets items={e.bullets} marker="—" />
        </Item>
      ))}
      {d.projects.length > 0 && <H>Projects</H>}
      {d.projects.map((p, i) => (
        <Item key={i} date={p.tech.slice(0, 2).join(', ')}>
          <h3 className="text-[13px] font-semibold">{p.title}</h3>
          {p.description && <p className="text-[12px] leading-relaxed mt-0.5" style={{ color: 'rgba(22,24,29,0.86)' }}>{p.description}</p>}
        </Item>
      ))}
      {d.education.length > 0 && <H>Education</H>}
      {d.education.map((e, i) => (
        <Item key={i} date={e.dates}>
          <h3 className="text-[13px] font-semibold">{e.degree}</h3>
          <p className="text-[12px]" style={{ color: SOFT }}>{e.institution}{e.grade ? ` · ${e.grade}` : ''}</p>
        </Item>
      ))}
      {d.skillGroups.length > 0 && <H>Skills</H>}
      {d.skillGroups.map(([cat, names]) => (
        <Item key={cat} date={d.skillGroups.length > 1 ? cat : ''}>
          <p className="text-[12px] leading-relaxed">{names.join(', ')}</p>
        </Item>
      ))}
      {d.certifications.length > 0 && <H>Certifications</H>}
      {d.certifications.map((c, i) => (
        <Item key={i} date={c.date}>
          <p className="text-[12px]"><span className="font-semibold">{c.name}</span>{c.issuer ? `, ${c.issuer}` : ''}</p>
        </Item>
      ))}
    </Page>
  );
};

// ---------------------------------------------------------------------------
// 6. Accent — monogram, coloured headings; for creative roles
// ---------------------------------------------------------------------------
export const AccentResume = ({ portfolio, accent }) => {
  const d = resumeData(portfolio);
  const H = ({ children }) => (
    <h2 className="mt-7 mb-3 text-[15px] font-bold flex items-center gap-2" style={{ fontFamily: "'Syne', sans-serif", color: accent }}>
      <span className="w-5 h-[3px] rounded-full" style={{ background: accent }} />{children}
    </h2>
  );
  return (
    <Page className="px-14 py-12">
      <header className="flex items-center gap-5">
        <div className="w-[68px] h-[68px] rounded-full flex items-center justify-center shrink-0 text-white text-[24px] font-bold" style={{ background: accent, fontFamily: "'Syne', sans-serif" }}>
          {d.initials}
        </div>
        <div className="min-w-0">
          <h1 className="text-[32px] font-bold leading-tight" style={{ fontFamily: "'Syne', sans-serif" }}>{d.name}</h1>
          {d.title && <p className="text-[13px] font-medium" style={{ color: accent }}>{d.title}</p>}
        </div>
      </header>
      <div className="flex flex-wrap gap-x-5 gap-y-1 mt-4 text-[11px]" style={{ color: SOFT }}>
        {d.contacts.map((c, i) => <span key={i}><span style={{ color: accent }}>{c.label}:</span> {c.text}</span>)}
      </div>
      {d.summary && (<><H>About me</H><p className="text-[12.5px] leading-relaxed" style={{ color: 'rgba(22,24,29,0.86)' }}>{d.summary}</p></>)}
      {d.experience.length > 0 && <H>Experience</H>}
      <div className="space-y-4">
        {d.experience.map((e, i) => (
          <div key={i}>
            <Row left={<h3 className="text-[14px] font-bold">{e.role} <span style={{ color: accent }}>·</span> <span className="font-medium" style={{ color: SOFT }}>{e.company}</span></h3>} right={e.dates} />
            <Bullets items={e.bullets} marker="●" color={accent} />
          </div>
        ))}
      </div>
      {d.projects.length > 0 && <H>Selected projects</H>}
      <div className="grid grid-cols-2 gap-3">
        {d.projects.map((p, i) => (
          <div key={i} className="rounded-lg p-3" style={{ border: `1px solid ${accent}33`, background: `${accent}08` }}>
            <h3 className="text-[12.5px] font-bold">{p.title}</h3>
            {p.description && <p className="text-[11.5px] leading-relaxed mt-0.5" style={{ color: 'rgba(22,24,29,0.86)' }}>{p.description}</p>}
            {p.tech.length > 0 && <p className="text-[10.5px] mt-1" style={{ color: accent }}>{p.tech.join(' · ')}</p>}
          </div>
        ))}
      </div>
      {d.skillGroups.length > 0 && <H>Skills</H>}
      <div className="flex flex-wrap gap-1.5">
        {d.allSkills.map((s) => (
          <span key={s} className="px-2.5 py-0.5 rounded-full text-[11px]" style={{ background: `${accent}14`, color: INK }}>{s}</span>
        ))}
      </div>
      {(d.education.length > 0 || d.certifications.length > 0) && <H>Education &amp; certifications</H>}
      {d.education.map((e, i) => (
        <Row key={i} left={<p className="text-[12px]"><span className="font-bold">{e.degree}</span> — {e.institution}{e.grade ? ` (${e.grade})` : ''}</p>} right={e.dates} />
      ))}
      {d.certifications.map((c, i) => (
        <Row key={`c${i}`} left={<p className="text-[12px]"><span className="font-bold">{c.name}</span>{c.issuer ? ` — ${c.issuer}` : ''}</p>} right={c.date} />
      ))}
    </Page>
  );
};
