import React, { useMemo, useState } from 'react';
import {
  Sparkles, Check, AlertTriangle, ArrowLeft, ArrowRight,
  User, Briefcase, GraduationCap, FolderGit2, Award, Cpu, Info
} from 'lucide-react';
import { sanitizeText, sanitizeUrl } from '../utils/resumeExtraction';
import { SPOT_BLUE, CHROME_MID, INK, PAPER } from './CinematicStage';

// -------------------------------------------------------------
// REVIEW-BEFORE-COMMIT — extracted data is NEVER auto-published.
// Every field lands here pre-filled (marked "AI-filled") and the
// user confirms before it reaches the builder + themes.
// -------------------------------------------------------------

const AI_TAG = (
  <span
    className="inline-flex items-center gap-1 px-1.5 py-px rounded text-[8px] font-bold uppercase tracking-wider shrink-0"
    style={{ color: SPOT_BLUE, background: 'rgba(127,168,232,0.10)', border: '1px solid rgba(127,168,232,0.25)' }}
  >
    <Sparkles className="w-2 h-2" /> AI-filled
  </span>
);

const Field = ({ label, value, onChange, flagged, placeholder, type = 'text' }) => (
  <div className="space-y-1">
    <div className="flex items-center justify-between gap-2">
      <label className="text-[10px] font-medium uppercase tracking-wider" style={{ color: CHROME_MID }}>
        {label}
      </label>
      {value ? AI_TAG : flagged ? (
        <span className="inline-flex items-center gap-1 px-1.5 py-px rounded text-[8px] font-bold uppercase tracking-wider" style={{ color: '#D9A03F', background: 'rgba(217,160,63,0.08)', border: '1px solid rgba(217,160,63,0.3)' }}>
          <AlertTriangle className="w-2 h-2" /> Review
        </span>
      ) : null}
    </div>
    <input
      type={type}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder || 'Not found in resume — add manually'}
      className="w-full px-3 py-2 rounded-lg text-xs focus:outline-none transition-colors"
      style={{
        background: 'rgba(0,0,0,0.25)',
        border: `1px solid ${flagged && !value ? 'rgba(217,160,63,0.45)' : 'rgba(255,255,255,0.10)'}`,
        color: PAPER
      }}
      onFocus={(e) => { e.currentTarget.style.borderColor = SPOT_BLUE; }}
      onBlur={(e) => { e.currentTarget.style.borderColor = flagged && !value ? 'rgba(217,160,63,0.45)' : 'rgba(255,255,255,0.10)'; }}
    />
  </div>
);

const SectionCard = ({ icon: Icon, title, count, children }) => (
  <div
    className="rounded-xl p-4 space-y-3"
    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
  >
    <div className="flex items-center gap-2 pb-1" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <Icon className="w-4 h-4" style={{ color: SPOT_BLUE }} />
      <h3 className="text-xs font-bold" style={{ color: PAPER }}>{title}</h3>
      {count > 0 && <span className="text-[10px]" style={{ color: CHROME_MID }}>({count})</span>}
    </div>
    {children}
  </div>
);

const BulletList = ({ items, onChange }) => (
  <div className="space-y-1.5">
    {items.map((b, i) => (
      <div key={i} className="flex gap-1.5">
        <textarea
          rows={2}
          value={b}
          onChange={(e) => onChange(i, e.target.value)}
          className="flex-1 px-2.5 py-1.5 rounded-lg text-[11px] leading-relaxed focus:outline-none resize-none"
          style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(245,245,247,0.85)' }}
        />
        <button
          onClick={() => onChange(i, null)}
          className="self-start p-1 rounded text-[10px] transition-colors"
          style={{ color: CHROME_MID }}
          title="Remove bullet"
        >✕</button>
      </div>
    ))}
  </div>
);

export const ResumeReviewScreen = ({ extraction, onBack, onCommit, isCommitting }) => {
  const [data, setData] = useState(() => JSON.parse(JSON.stringify(extraction.data)));
  const warnings = extraction.warnings || [];
  const engine = extraction.engine;
  const lowConf = new Set(extraction.data?.meta?.lowConfidenceFields || ['*'] === '*' ? ['*'] : (extraction.data?.meta?.lowConfidenceFields || []));
  const isFlagged = (path) => lowConf.has('*') || lowConf.has(path) || engine === 'heuristic';

  const setProfile = (k) => (v) => setData(d => ({ ...d, profile: { ...d.profile, [k]: v } }));
  const setArr = (key) => (idx, patch) => setData(d => {
    const arr = [...d[key]];
    arr[idx] = typeof patch === 'function' ? patch(arr[idx]) : patch;
    return { ...d, [key]: arr };
  });

  const stats = useMemo(() => ({
    experience: data.experience?.length || 0,
    education: data.education?.length || 0,
    skills: data.skills?.length || 0,
    projects: data.projects?.length || 0,
    certifications: data.certifications?.length || 0
  }), [data]);

  const filledCount = stats.experience + stats.education + stats.skills + stats.projects + stats.certifications;

  return (
    <div className="relative z-10 w-full max-w-3xl space-y-4">
      {/* Header */}
      <div
        className="rounded-2xl p-5 space-y-2"
        style={{ background: 'rgba(20,20,26,0.45)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.10)' }}
      >
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" style={{ color: SPOT_BLUE }} />
            <h1 className="font-syne text-base font-bold" style={{ color: PAPER }}>Review Your Extracted Portfolio</h1>
          </div>
          <span className="text-[10px] font-medium px-2 py-1 rounded-full" style={{ color: CHROME_MID, border: '1px solid rgba(255,255,255,0.12)' }}>
            {filledCount} sections · {engine === 'claude' ? 'AI-structured' : 'heuristic'}
          </span>
        </div>
        <p className="text-xs" style={{ color: CHROME_MID }}>
          We found the content below in your resume. Everything is editable — verify before building, since this becomes your public portfolio.
        </p>
        {warnings.length > 0 && (
          <div className="flex items-start gap-2 p-2.5 rounded-lg text-[11px]" style={{ background: 'rgba(217,160,63,0.06)', border: '1px solid rgba(217,160,63,0.25)', color: '#D9A03F' }}>
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-px" />
            <div className="space-y-0.5">{warnings.map((w, i) => <p key={i}>{w}</p>)}</div>
          </div>
        )}
        <div className="flex items-start gap-2 text-[10px]" style={{ color: CHROME_MID }}>
          <Info className="w-3 h-3 shrink-0 mt-px" />
          <span>Works best with single-column resumes. Multi-column layouts can scramble reading order — check dates and companies carefully.</span>
        </div>
      </div>

      {/* PROFILE */}
      <SectionCard icon={User} title="Profile">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Full Name" value={data.profile?.fullName} onChange={setProfile('fullName')} flagged={isFlagged('profile.fullName')} />
          <Field label="Title" value={data.profile?.title} onChange={setProfile('title')} flagged={isFlagged('profile.title')} />
          <Field label="Email" type="email" value={data.profile?.email} onChange={setProfile('email')} flagged={isFlagged('profile.email')} />
          <Field label="Phone" value={data.profile?.phone} onChange={setProfile('phone')} flagged={isFlagged('profile.phone')} />
          <Field label="Location" value={data.profile?.location} onChange={setProfile('location')} flagged={isFlagged('profile.location')} />
          <Field label="GitHub URL" value={data.profile?.githubUrl} onChange={setProfile('githubUrl')} flagged={isFlagged('profile.githubUrl')} />
          <Field label="LinkedIn URL" value={data.profile?.linkedinUrl} onChange={setProfile('linkedinUrl')} flagged={isFlagged('profile.linkedinUrl')} />
          <Field label="Website" value={data.profile?.websiteUrl} onChange={setProfile('websiteUrl')} flagged={isFlagged('profile.websiteUrl')} />
        </div>
        <Field label="Bio / Summary" value={data.profile?.bio} onChange={setProfile('bio')} flagged={isFlagged('profile.bio')} />
      </SectionCard>

      {/* EXPERIENCE */}
      <SectionCard icon={Briefcase} title="Experience" count={stats.experience}>
        {(data.experience || []).length === 0 && (
          <p className="text-xs" style={{ color: CHROME_MID }}>No experience entries detected — add them in the builder after review.</p>
        )}
        {(data.experience || []).map((job, idx) => (
          <div key={idx} className="space-y-2 p-3 rounded-lg" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Role" value={job.role} onChange={(v) => setArr('experience')(idx, j => ({ ...j, role: v }))} flagged={isFlagged(`experience[${idx}].role`)} />
              <Field label="Company" value={job.company} onChange={(v) => setArr('experience')(idx, j => ({ ...j, company: v }))} flagged={isFlagged(`experience[${idx}].company`)} />
              <Field label="Start" value={job.startDate} onChange={(v) => setArr('experience')(idx, j => ({ ...j, startDate: v }))} flagged={isFlagged(`experience[${idx}].startDate`)} />
              <Field label="End (or Present)" value={job.endDate} onChange={(v) => setArr('experience')(idx, j => ({ ...j, endDate: v, isCurrent: /present|current/i.test(v || '') }))} flagged={isFlagged(`experience[${idx}].endDate`)} />
            </div>
            {(job.bullets || []).length > 0 && (
              <div>
                <label className="text-[10px] font-medium uppercase tracking-wider block mb-1" style={{ color: CHROME_MID }}>Bullets</label>
                <BulletList
                  items={job.bullets}
                  onChange={(bi, v) => setArr('experience')(idx, j => {
                    const bullets = v === null ? j.bullets.filter((_, i) => i !== bi) : j.bullets.map((b, i) => i === bi ? v : b);
                    return { ...j, bullets };
                  })}
                />
              </div>
            )}
            <button
              onClick={() => setData(d => ({ ...d, experience: d.experience.filter((_, i) => i !== idx) }))}
              className="text-[10px] font-medium hover:underline"
              style={{ color: CHROME_MID }}
            >Remove entry</button>
          </div>
        ))}
      </SectionCard>

      {/* SKILLS */}
      <SectionCard icon={Cpu} title="Skills" count={stats.skills}>
        <div className="flex flex-wrap gap-1.5">
          {(data.skills || []).map((sk, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px]"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(245,245,247,0.85)' }}
            >
              {sk.name}
              <button
                onClick={() => setData(d => ({ ...d, skills: d.skills.filter((_, i) => i !== idx) }))}
                className="opacity-50 hover:opacity-100"
                style={{ color: CHROME_MID }}
              >✕</button>
            </span>
          ))}
        </div>
      </SectionCard>

      {/* PROJECTS */}
      {stats.projects > 0 && (
        <SectionCard icon={FolderGit2} title="Projects" count={stats.projects}>
          {data.projects.map((proj, idx) => (
            <div key={idx} className="space-y-2 p-3 rounded-lg" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <Field label="Title" value={proj.title} onChange={(v) => setArr('projects')(idx, p => ({ ...p, title: v }))} flagged={isFlagged(`projects[${idx}].title`)} />
              <Field label="Description" value={proj.description} onChange={(v) => setArr('projects')(idx, p => ({ ...p, description: v }))} flagged={isFlagged(`projects[${idx}].description`)} />
              <div className="flex flex-wrap gap-1.5">
                {(proj.techStack || []).map((t, ti) => (
                  <span key={ti} className="px-2 py-0.5 rounded text-[10px]" style={{ background: 'rgba(255,255,255,0.06)', color: CHROME_MID }}>{t}</span>
                ))}
              </div>
            </div>
          ))}
        </SectionCard>
      )}

      {/* EDUCATION */}
      <SectionCard icon={GraduationCap} title="Education" count={stats.education}>
        {(data.education || []).map((edu, idx) => (
          <div key={idx} className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 rounded-lg" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <Field label="Institution" value={edu.institution} onChange={(v) => setArr('education')(idx, e => ({ ...e, institution: v }))} flagged={isFlagged(`education[${idx}].institution`)} />
            <Field label="Degree" value={edu.degree} onChange={(v) => setArr('education')(idx, e => ({ ...e, degree: v }))} flagged={isFlagged(`education[${idx}].degree`)} />
            <Field label="Field" value={edu.field} onChange={(v) => setArr('education')(idx, e => ({ ...e, field: v }))} flagged={isFlagged(`education[${idx}].field`)} />
            <Field label="Years" value={[edu.startDate, edu.endDate].filter(Boolean).join(' — ')} onChange={(v) => setArr('education')(idx, e => ({ ...e, startDate: v.split('—')[0]?.trim() || null, endDate: v.split('—')[1]?.trim() || null }))} flagged={isFlagged(`education[${idx}].endDate`)} />
          </div>
        ))}
      </SectionCard>

      {/* CERTIFICATIONS */}
      {stats.certifications > 0 && (
        <SectionCard icon={Award} title="Certifications" count={stats.certifications}>
          {(data.certifications || []).map((c, idx) => (
            <div key={idx} className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 rounded-lg" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <Field label="Name" value={c.name} onChange={(v) => setArr('certifications')(idx, x => ({ ...x, name: v }))} flagged={isFlagged(`certifications[${idx}].name`)} />
              <Field label="Issuer" value={c.issuer} onChange={(v) => setArr('certifications')(idx, x => ({ ...x, issuer: v }))} flagged={isFlagged(`certifications[${idx}].issuer`)} />
            </div>
          ))}
        </SectionCard>
      )}

      {/* ACTIONS */}
      <div className="flex items-center justify-between gap-3 pt-2 pb-8">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[3px] text-xs font-semibold uppercase tracking-wider transition-all hover:-translate-x-0.5"
          style={{ color: CHROME_MID, border: '1px solid rgba(255,255,255,0.15)' }}
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Discard
        </button>
        <button
          onClick={() => onCommit(data)}
          disabled={isCommitting}
          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-8 py-3 rounded-[3px] text-xs font-bold uppercase tracking-wider transition-all active:scale-[0.99] disabled:opacity-60"
          style={{ backgroundColor: PAPER, color: INK }}
        >
          {isCommitting ? (
            <div className="w-3.5 h-3.5 border-2 border-[#06060A] border-t-transparent rounded-full animate-spin" />
          ) : (
            <Check className="w-3.5 h-3.5" />
          )}
          <span>{isCommitting ? 'Building…' : 'Confirm & Build Portfolio'}</span>
          {!isCommitting && <ArrowRight className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
};
