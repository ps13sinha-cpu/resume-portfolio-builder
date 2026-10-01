import React, { useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import {
  User, Briefcase, GraduationCap, Wrench, FolderGit2, Award, Target, ClipboardCheck,
  Plus, Trash2, ArrowRight, ArrowLeft, Loader2, Check, X, Sparkles, AlertTriangle
} from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';
import { canonicalToPortfolioPatch } from '../utils/portfolioPatch';
import { wordDiff } from '../utils/wordDiff';
import {
  CinematicStage,
  WizardStepHeader,
  StageKeyframes,
  StageBackButton,
  SPOT_BLUE,
  CHROME_MID,
  INK,
  PAPER
} from './CinematicStage';

const DRAFT_KEY = 'aura_tailored_draft';

const STEPS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'experience', label: 'Experience', icon: Briefcase },
  { id: 'education', label: 'Education', icon: GraduationCap },
  { id: 'skills', label: 'Skills', icon: Wrench },
  { id: 'projects', label: 'Projects', icon: FolderGit2 },
  { id: 'certifications', label: 'Certifications', icon: Award },
  { id: 'job', label: 'Job description', icon: Target },
  { id: 'review', label: 'Review', icon: ClipboardCheck }
];

const EMPTY = {
  experience: { company: '', role: '', startDate: '', endDate: '', isCurrent: false, bulletsText: '' },
  education: { institution: '', degree: '', field: '', startDate: '', endDate: '', grade: '' },
  projects: { title: '', description: '', techText: '', liveUrl: '', githubUrl: '' },
  certifications: { name: '', issuer: '', date: '', credentialUrl: '' }
};

const blankDraft = (user) => ({
  profile: { fullName: user?.name || '', title: '', email: user?.email || '', phone: '', location: '', githubUrl: '', linkedinUrl: '', bio: '' },
  experience: [{ ...EMPTY.experience }],
  education: [{ ...EMPTY.education }],
  skillsText: '',
  projects: [{ ...EMPTY.projects }],
  certifications: [],
  jobDescription: ''
});

const loadDraft = (user) => {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (raw) return { ...blankDraft(user), ...JSON.parse(raw) };
  } catch {}
  return blankDraft(user);
};

const splitList = (s) => String(s || '').split(/[,\n]/).map((x) => x.trim()).filter(Boolean);
const splitLines = (s) => String(s || '').split('\n').map((x) => x.replace(/^[\s•\-*]+/, '').trim()).filter(Boolean);
const hasAny = (obj) => Object.values(obj).some((v) => typeof v === 'string' && v.trim());

// Form draft → canonical sections (drops empty rows).
const draftToCanonical = (d) => ({
  profile: d.profile,
  experience: d.experience.filter(hasAny).map((e) => ({
    company: e.company.trim(), role: e.role.trim(), startDate: e.startDate.trim(),
    endDate: e.isCurrent ? '' : e.endDate.trim(), isCurrent: e.isCurrent, bullets: splitLines(e.bulletsText)
  })),
  education: d.education.filter(hasAny),
  skills: [...new Set(splitList(d.skillsText))].map((name) => ({ name, category: 'Core' })),
  projects: d.projects.filter((p) => p.title.trim()).map((p) => ({
    title: p.title.trim(), description: p.description.trim(), techStack: splitList(p.techText),
    liveUrl: p.liveUrl.trim(), githubUrl: p.githubUrl.trim()
  })),
  certifications: d.certifications.filter((c) => c.name.trim())
});

// ---------------------------------------------------------------------------
// Small form primitives in the stage's visual language
// ---------------------------------------------------------------------------
const inputCls = 'w-full px-3 py-2.5 rounded-lg text-xs bg-black/40 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-[#7FA8E8]';

const Field = ({ label, required, className = '', children }) => (
  <label className={`block space-y-1.5 ${className}`}>
    <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: CHROME_MID }}>
      {label}{required && <span style={{ color: SPOT_BLUE }}> *</span>}
    </span>
    {children}
  </label>
);

const TextInput = ({ value, onChange, ...rest }) => (
  <input className={inputCls} value={value} onChange={(e) => onChange(e.target.value)} {...rest} />
);

const TextArea = ({ value, onChange, rows = 4, ...rest }) => (
  <textarea className={`${inputCls} resize-y leading-relaxed`} rows={rows} value={value} onChange={(e) => onChange(e.target.value)} {...rest} />
);

const RowCard = ({ title, onRemove, children }) => (
  <div className="rounded-xl p-4 space-y-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}>
    <div className="flex items-center justify-between">
      <span className="text-[11px] font-semibold" style={{ color: PAPER }}>{title}</span>
      {onRemove && (
        <button type="button" onClick={onRemove} className="p-1 rounded text-slate-500 hover:text-rose-400" aria-label={`Remove ${title}`}>
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
    {children}
  </div>
);

const AddButton = ({ onClick, label }) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors hover:text-white"
    style={{ color: CHROME_MID, border: '1px dashed rgba(255,255,255,0.18)' }}
  >
    <Plus className="w-3.5 h-3.5" /> {label}
  </button>
);

const StatusPill = ({ status }) => {
  const map = {
    met: { label: 'Covered', color: '#4ADE80', bg: 'rgba(74,222,128,0.10)' },
    partial: { label: 'Partly', color: '#FBBF24', bg: 'rgba(251,191,36,0.10)' },
    missing: { label: 'Missing', color: '#F87171', bg: 'rgba(248,113,113,0.10)' }
  };
  const s = map[status] || map.missing;
  return (
    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide shrink-0" style={{ color: s.color, background: s.bg }}>
      {s.label}
    </span>
  );
};

// ---------------------------------------------------------------------------

export const TailoredIntakeScreen = ({ onNext, onBack }) => {
  const { user, updatePortfolio, triggerPublishConfetti } = usePortfolio();

  const [draft, setDraft] = useState(() => loadDraft(user));
  const [stepIdx, setStepIdx] = useState(0);
  const [error, setError] = useState('');

  // Review-step state
  const [analysis, setAnalysis] = useState(null);      // { requirements, suggestedBio, warnings, engine }
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState('');
  const [bioChoice, setBioChoice] = useState('mine');  // 'mine' | 'suggested'
  const [suggestedBio, setSuggestedBio] = useState('');
  const [bulletTailor, setBulletTailor] = useState({}); // key "e-b" → { loading, tailored, warnings, error }
  const [committing, setCommitting] = useState(false);
  const analyzedFor = useRef('');

  const containerRef = useRef(null);
  const spotlightRef = useRef(null);
  const dustCanvasRef = useRef(null);
  const headerRef = useRef(null);
  const cardRef = useRef(null);

  const step = STEPS[stepIdx];

  useEffect(() => {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); } catch {}
  }, [draft]);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = gsap.context(() => {
      gsap.set(spotlightRef.current, { opacity: 0 });
      gsap.set(headerRef.current, { opacity: 0, y: -12 });
      gsap.set(cardRef.current, { opacity: 0, scale: 0.98 });
      gsap.timeline({ defaults: { ease: 'power2.out' } })
        .to(spotlightRef.current, { opacity: 1, duration: 0.4 }, 0.15)
        .to(headerRef.current, { opacity: 1, y: 0, duration: 0.3 }, 0.1)
        .to(cardRef.current, { opacity: 1, scale: 1, duration: 0.4 }, 0.3);
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const canonical = useMemo(() => draftToCanonical(draft), [draft]);

  // --- draft updaters -------------------------------------------------------
  const setProfile = (k, v) => setDraft((d) => ({ ...d, profile: { ...d.profile, [k]: v } }));
  const setRow = (section, idx, k, v) => setDraft((d) => ({
    ...d, [section]: d[section].map((r, i) => (i === idx ? { ...r, [k]: v } : r))
  }));
  const addRow = (section) => setDraft((d) => ({ ...d, [section]: [...d[section], { ...EMPTY[section] }] }));
  const removeRow = (section, idx) => setDraft((d) => ({ ...d, [section]: d[section].filter((_, i) => i !== idx) }));

  // --- navigation -----------------------------------------------------------
  const validate = () => {
    if (step.id === 'profile') {
      if (!draft.profile.fullName.trim() || !draft.profile.title.trim()) return 'Your name and headline are required.';
    }
    return '';
  };

  const goNext = () => {
    const msg = validate();
    if (msg) { setError(msg); return; }
    setError('');
    setStepIdx((i) => Math.min(i + 1, STEPS.length - 1));
  };
  const goPrev = () => { setError(''); setStepIdx((i) => Math.max(i - 1, 0)); };

  // --- AI analysis (runs when entering Review with a JD) --------------------
  const jd = draft.jobDescription.trim();
  const analysisKey = JSON.stringify([jd, canonical]);

  const runAnalysis = async () => {
    setAnalyzing(true);
    setAnalysisError('');
    try {
      const res = await fetch('/api/tailor/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidate: canonical, jobDescription: jd })
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error?.message || 'Analysis failed.');
      setAnalysis(json);
      setSuggestedBio(json.suggestedBio || '');
      analyzedFor.current = analysisKey;
    } catch (e) {
      setAnalysisError(e.message === 'Failed to fetch' ? 'Could not reach the server. Is the backend running?' : e.message);
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    if (step.id === 'review' && jd && analyzedFor.current !== analysisKey && !analyzing) runAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step.id]);

  const tailorOne = async (ei, bi, bullet, role) => {
    const key = `${ei}-${bi}`;
    setBulletTailor((m) => ({ ...m, [key]: { loading: true } }));
    try {
      const res = await fetch('/api/tailor/bullet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bullet, jobDescription: jd, role })
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error?.message || 'Tailoring failed.');
      setBulletTailor((m) => ({ ...m, [key]: { tailored: json.tailored, warnings: json.warnings || [] } }));
    } catch (e) {
      setBulletTailor((m) => ({ ...m, [key]: { error: e.message } }));
    }
  };

  // Accepting a tailored bullet writes it back into the draft's text.
  const acceptBullet = (ei, bi) => {
    const key = `${ei}-${bi}`;
    const t = bulletTailor[key]?.tailored;
    if (!t) return;
    // canonical.experience is filtered; map back to the draft row by position among non-empty rows
    const draftIdx = draft.experience.map((e, i) => (hasAny(e) ? i : -1)).filter((i) => i >= 0)[ei];
    const lines = splitLines(draft.experience[draftIdx].bulletsText);
    lines[bi] = t;
    setRow('experience', draftIdx, 'bulletsText', lines.join('\n'));
    setBulletTailor((m) => ({ ...m, [key]: { accepted: true } }));
  };
  const dismissBullet = (ei, bi) => setBulletTailor((m) => { const n = { ...m }; delete n[`${ei}-${bi}`]; return n; });

  // --- commit ---------------------------------------------------------------
  const handleCommit = async () => {
    if (committing) return;
    setCommitting(true);
    const finalBio = bioChoice === 'suggested' && suggestedBio.trim() ? suggestedBio.trim() : draft.profile.bio.trim();
    const patch = canonicalToPortfolioPatch({ ...canonical, profile: { ...canonical.profile, bio: finalBio } });
    await updatePortfolio((prev) => ({
      ...prev,
      ...patch,
      entry_path: 'tailored',
      target_job: jd ? {
        description: jd.slice(0, 12000),
        requirements: analysis?.requirements || [],
        analyzed_at: new Date().toISOString()
      } : null
    }));
    // Draft is kept so "Edit details" on the resume screen reopens it filled in.
    triggerPublishConfetti();
    setCommitting(false);
    onNext();
  };

  // --- step bodies ----------------------------------------------------------
  const renderStep = () => {
    switch (step.id) {
      case 'profile':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full name" required><TextInput value={draft.profile.fullName} onChange={(v) => setProfile('fullName', v)} placeholder="Jane Doe" /></Field>
            <Field label="Headline / title" required><TextInput value={draft.profile.title} onChange={(v) => setProfile('title', v)} placeholder="Frontend Engineer" /></Field>
            <Field label="Email"><TextInput type="email" value={draft.profile.email} onChange={(v) => setProfile('email', v)} /></Field>
            <Field label="Phone"><TextInput value={draft.profile.phone} onChange={(v) => setProfile('phone', v)} /></Field>
            <Field label="Location"><TextInput value={draft.profile.location} onChange={(v) => setProfile('location', v)} placeholder="City, Country" /></Field>
            <Field label="GitHub URL"><TextInput value={draft.profile.githubUrl} onChange={(v) => setProfile('githubUrl', v)} placeholder="https://github.com/…" /></Field>
            <Field label="LinkedIn URL" className="sm:col-span-2"><TextInput value={draft.profile.linkedinUrl} onChange={(v) => setProfile('linkedinUrl', v)} placeholder="https://linkedin.com/in/…" /></Field>
            <Field label="Short bio (optional — we can suggest one from the job description)" className="sm:col-span-2">
              <TextArea rows={3} value={draft.profile.bio} onChange={(v) => setProfile('bio', v)} />
            </Field>
          </div>
        );

      case 'experience':
        return (
          <div className="space-y-3">
            {draft.experience.map((e, i) => (
              <RowCard key={i} title={e.role || e.company || `Position ${i + 1}`} onRemove={() => removeRow('experience', i)}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Role"><TextInput value={e.role} onChange={(v) => setRow('experience', i, 'role', v)} /></Field>
                  <Field label="Company"><TextInput value={e.company} onChange={(v) => setRow('experience', i, 'company', v)} /></Field>
                  <Field label="Start"><TextInput value={e.startDate} onChange={(v) => setRow('experience', i, 'startDate', v)} placeholder="Jan 2022" /></Field>
                  <Field label="End">
                    <TextInput value={e.isCurrent ? 'Present' : e.endDate} disabled={e.isCurrent} onChange={(v) => setRow('experience', i, 'endDate', v)} placeholder="Dec 2023" />
                  </Field>
                </div>
                <label className="flex items-center gap-2 text-xs" style={{ color: CHROME_MID }}>
                  <input type="checkbox" checked={e.isCurrent} onChange={(ev) => setRow('experience', i, 'isCurrent', ev.target.checked)} className="accent-[#7FA8E8]" />
                  I currently work here
                </label>
                <Field label="What you did — one bullet per line">
                  <TextArea rows={4} value={e.bulletsText} onChange={(v) => setRow('experience', i, 'bulletsText', v)} placeholder={'Built the checkout flow in React, cutting drop-off by 12%\nMentored two junior engineers'} />
                </Field>
              </RowCard>
            ))}
            <AddButton onClick={() => addRow('experience')} label="Add position" />
          </div>
        );

      case 'education':
        return (
          <div className="space-y-3">
            {draft.education.map((e, i) => (
              <RowCard key={i} title={e.institution || `Education ${i + 1}`} onRemove={() => removeRow('education', i)}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Institution" className="sm:col-span-2"><TextInput value={e.institution} onChange={(v) => setRow('education', i, 'institution', v)} /></Field>
                  <Field label="Degree"><TextInput value={e.degree} onChange={(v) => setRow('education', i, 'degree', v)} placeholder="B.Tech" /></Field>
                  <Field label="Field"><TextInput value={e.field} onChange={(v) => setRow('education', i, 'field', v)} placeholder="Computer Science" /></Field>
                  <Field label="Start"><TextInput value={e.startDate} onChange={(v) => setRow('education', i, 'startDate', v)} /></Field>
                  <Field label="End"><TextInput value={e.endDate} onChange={(v) => setRow('education', i, 'endDate', v)} /></Field>
                  <Field label="Grade (optional)"><TextInput value={e.grade} onChange={(v) => setRow('education', i, 'grade', v)} placeholder="8.7 CGPA" /></Field>
                </div>
              </RowCard>
            ))}
            <AddButton onClick={() => addRow('education')} label="Add education" />
          </div>
        );

      case 'skills': {
        const chips = [...new Set(splitList(draft.skillsText))];
        return (
          <div className="space-y-3">
            <Field label="Skills — separated by commas or new lines">
              <TextArea rows={4} value={draft.skillsText} onChange={(v) => setDraft((d) => ({ ...d, skillsText: v }))} placeholder="React, TypeScript, Node.js, PostgreSQL, Figma" />
            </Field>
            {chips.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {chips.map((c) => (
                  <span key={c} className="px-2.5 py-1 rounded-full text-[11px] text-slate-200 bg-white/5 border border-white/10">{c}</span>
                ))}
              </div>
            )}
          </div>
        );
      }

      case 'projects':
        return (
          <div className="space-y-3">
            {draft.projects.map((p, i) => (
              <RowCard key={i} title={p.title || `Project ${i + 1}`} onRemove={() => removeRow('projects', i)}>
                <Field label="Title"><TextInput value={p.title} onChange={(v) => setRow('projects', i, 'title', v)} /></Field>
                <Field label="Description"><TextArea rows={3} value={p.description} onChange={(v) => setRow('projects', i, 'description', v)} /></Field>
                <Field label="Tech used (comma separated)"><TextInput value={p.techText} onChange={(v) => setRow('projects', i, 'techText', v)} placeholder="React, Firebase" /></Field>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Live URL"><TextInput value={p.liveUrl} onChange={(v) => setRow('projects', i, 'liveUrl', v)} /></Field>
                  <Field label="Repo URL"><TextInput value={p.githubUrl} onChange={(v) => setRow('projects', i, 'githubUrl', v)} /></Field>
                </div>
              </RowCard>
            ))}
            <AddButton onClick={() => addRow('projects')} label="Add project" />
          </div>
        );

      case 'certifications':
        return (
          <div className="space-y-3">
            {draft.certifications.length === 0 && (
              <p className="text-xs" style={{ color: CHROME_MID }}>Optional. Skip this step if you don't have any.</p>
            )}
            {draft.certifications.map((c, i) => (
              <RowCard key={i} title={c.name || `Certification ${i + 1}`} onRemove={() => removeRow('certifications', i)}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Name" className="sm:col-span-2"><TextInput value={c.name} onChange={(v) => setRow('certifications', i, 'name', v)} /></Field>
                  <Field label="Issuer"><TextInput value={c.issuer} onChange={(v) => setRow('certifications', i, 'issuer', v)} /></Field>
                  <Field label="Date"><TextInput value={c.date} onChange={(v) => setRow('certifications', i, 'date', v)} /></Field>
                  <Field label="Credential URL" className="sm:col-span-2"><TextInput value={c.credentialUrl} onChange={(v) => setRow('certifications', i, 'credentialUrl', v)} /></Field>
                </div>
              </RowCard>
            ))}
            <AddButton onClick={() => addRow('certifications')} label="Add certification" />
          </div>
        );

      case 'job':
        return (
          <div className="space-y-3">
            <p className="text-xs leading-relaxed" style={{ color: CHROME_MID }}>
              Paste the job posting you're applying for. We'll show which of its requirements your details already cover,
              suggest a bio aimed at the role, and let you tailor individual bullets. Suggestions only use facts you entered,
              and nothing is applied without your OK. Leave it empty to skip.
            </p>
            <TextArea
              rows={12}
              value={draft.jobDescription}
              onChange={(v) => setDraft((d) => ({ ...d, jobDescription: v }))}
              placeholder="Paste the full job description here: responsibilities, requirements, nice-to-haves…"
            />
            <p className="text-[11px] text-right" style={{ color: CHROME_MID }}>{draft.jobDescription.length.toLocaleString()} characters</p>
          </div>
        );

      case 'review':
        return renderReview();

      default:
        return null;
    }
  };

  const renderReview = () => {
    const counts = [
      ['positions', canonical.experience.length],
      ['education', canonical.education.length],
      ['skills', canonical.skills.length],
      ['projects', canonical.projects.length],
      ['certifications', canonical.certifications.length]
    ];
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2">
          {counts.map(([label, n]) => (
            <span key={label} className="px-3 py-1 rounded-full text-[11px] bg-white/5 border border-white/10" style={{ color: n ? PAPER : CHROME_MID }}>
              {n} {label}
            </span>
          ))}
        </div>

        {!jd && (
          <p className="text-xs" style={{ color: CHROME_MID }}>
            No job description added, so there's nothing to tailor. You can go back and paste one, or create your resume as it is.
          </p>
        )}

        {jd && analyzing && (
          <div className="flex items-center gap-2 text-xs" style={{ color: CHROME_MID }}>
            <Loader2 className="w-4 h-4 animate-spin" style={{ color: SPOT_BLUE }} /> Comparing your details with the job description…
          </div>
        )}

        {jd && analysisError && (
          <div className="text-xs space-y-2">
            <p style={{ color: '#F87171' }}>{analysisError}</p>
            <button type="button" onClick={runAnalysis} className="underline" style={{ color: CHROME_MID }}>Try again</button>
          </div>
        )}

        {jd && analysis && !analyzing && (
          <>
            {/* Gap analysis */}
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-syne text-sm font-bold" style={{ color: PAPER }}>How your details match the role</h3>
                <span className="text-[10px] uppercase tracking-wider" style={{ color: CHROME_MID }}>
                  {analysis.engine === 'claude' ? 'AI analysis' : 'Keyword match'}
                </span>
              </div>
              {analysis.requirements.length === 0 ? (
                <p className="text-xs" style={{ color: CHROME_MID }}>No specific requirements detected.</p>
              ) : (
                <ul className="space-y-1.5">
                  {analysis.requirements.map((r, i) => (
                    <li key={i} className="flex items-start gap-3 text-xs rounded-lg px-3 py-2 bg-white/[0.02] border border-white/5">
                      <StatusPill status={r.status} />
                      <div className="min-w-0">
                        <p style={{ color: PAPER }}>{r.requirement}</p>
                        {r.evidence
                          ? <p className="text-[11px] mt-0.5" style={{ color: CHROME_MID }}>{r.evidence}</p>
                          : r.status === 'missing' && <p className="text-[11px] mt-0.5" style={{ color: CHROME_MID }}>Not mentioned yet. If you have this experience, go back and add it.</p>}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Bio */}
            <section className="space-y-2">
              <h3 className="font-syne text-sm font-bold" style={{ color: PAPER }}>Bio</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { id: 'mine', label: 'Keep my bio', body: draft.profile.bio || '(empty)' },
                  { id: 'suggested', label: 'Use suggested bio', body: null }
                ].map((opt) => {
                  const active = bioChoice === opt.id;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => setBioChoice(opt.id)}
                      className="rounded-xl p-3 space-y-2 cursor-pointer transition-colors"
                      style={{
                        background: active ? 'rgba(127,168,232,0.06)' : 'rgba(255,255,255,0.02)',
                        border: active ? `1.5px solid ${SPOT_BLUE}` : '1px solid rgba(255,255,255,0.10)'
                      }}
                    >
                      <div className="flex items-center gap-2 text-[11px] font-semibold" style={{ color: PAPER }}>
                        <span className="w-4 h-4 rounded-full flex items-center justify-center" style={{ border: `1.5px solid ${active ? SPOT_BLUE : 'rgba(255,255,255,0.3)'}`, background: active ? SPOT_BLUE : 'transparent' }}>
                          {active && <Check className="w-2.5 h-2.5" style={{ color: INK }} strokeWidth={3} />}
                        </span>
                        {opt.label}
                      </div>
                      {opt.body !== null
                        ? <p className="text-xs leading-relaxed" style={{ color: CHROME_MID }}>{opt.body}</p>
                        : <TextArea rows={4} value={suggestedBio} onChange={setSuggestedBio} onFocus={() => setBioChoice('suggested')} />}
                    </div>
                  );
                })}
              </div>
              {analysis.warnings?.map((w, i) => (
                <p key={i} className="flex items-start gap-1.5 text-[11px]" style={{ color: '#FBBF24' }}>
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-px" /> {w}
                </p>
              ))}
            </section>

            {/* Per-bullet tailoring (opt-in) */}
            {canonical.experience.some((e) => e.bullets.length) && (
              <section className="space-y-3">
                <div>
                  <h3 className="font-syne text-sm font-bold" style={{ color: PAPER }}>Tailor experience bullets (optional)</h3>
                  <p className="text-[11px] mt-0.5" style={{ color: CHROME_MID }}>
                    Reframes a bullet toward this role without changing its facts. You'll see the changes before accepting.
                  </p>
                </div>
                {canonical.experience.map((e, ei) => e.bullets.length > 0 && (
                  <div key={ei} className="space-y-2">
                    <p className="text-[11px] font-semibold" style={{ color: PAPER }}>{[e.role, e.company].filter(Boolean).join(' · ')}</p>
                    {e.bullets.map((b, bi) => {
                      const st = bulletTailor[`${ei}-${bi}`] || {};
                      return (
                        <div key={bi} className="rounded-lg px-3 py-2.5 bg-white/[0.02] border border-white/5 space-y-2">
                          {st.tailored ? (
                            <>
                              <p className="text-xs leading-relaxed">
                                {wordDiff(b, st.tailored).map((w, k) => (
                                  <span
                                    key={k}
                                    style={w.t === 'del'
                                      ? { color: '#F87171', textDecoration: 'line-through', opacity: 0.8 }
                                      : w.t === 'add' ? { color: '#4ADE80' } : { color: PAPER }}
                                  >{w.w} </span>
                                ))}
                              </p>
                              {st.warnings?.map((w, k) => (
                                <p key={k} className="flex items-start gap-1.5 text-[11px]" style={{ color: '#FBBF24' }}>
                                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-px" /> {w}
                                </p>
                              ))}
                              <div className="flex gap-2">
                                <button type="button" onClick={() => acceptBullet(ei, bi)} className="px-3 py-1.5 rounded text-[11px] font-bold flex items-center gap-1" style={{ background: PAPER, color: INK }}>
                                  <Check className="w-3 h-3" /> Accept
                                </button>
                                <button type="button" onClick={() => dismissBullet(ei, bi)} className="px-3 py-1.5 rounded text-[11px] font-semibold flex items-center gap-1 border border-white/15" style={{ color: CHROME_MID }}>
                                  <X className="w-3 h-3" /> Keep original
                                </button>
                              </div>
                            </>
                          ) : (
                            <div className="flex items-start justify-between gap-3">
                              <p className="text-xs leading-relaxed" style={{ color: PAPER }}>{b}</p>
                              {st.accepted ? (
                                <span className="text-[10px] font-bold uppercase shrink-0 flex items-center gap-1" style={{ color: '#4ADE80' }}><Check className="w-3 h-3" /> Tailored</span>
                              ) : (
                                <button
                                  type="button"
                                  disabled={st.loading}
                                  onClick={() => tailorOne(ei, bi, b, e.role)}
                                  className="shrink-0 px-2.5 py-1 rounded text-[10px] font-semibold flex items-center gap-1 border transition-colors hover:text-white disabled:opacity-60"
                                  style={{ color: SPOT_BLUE, borderColor: 'rgba(127,168,232,0.35)' }}
                                >
                                  {st.loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                  Tailor to this role
                                </button>
                              )}
                            </div>
                          )}
                          {st.error && <p className="text-[11px]" style={{ color: '#F87171' }}>{st.error}</p>}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </section>
            )}
          </>
        )}
      </div>
    );
  };

  const isLast = step.id === 'review';
  const StepIcon = step.icon;

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen w-full overflow-hidden flex flex-col items-center p-4 py-10 font-outfit"
      style={{ backgroundColor: INK, color: PAPER }}
    >
      <StageKeyframes />
      <CinematicStage spotlightRef={spotlightRef} dustCanvasRef={dustCanvasRef} />

      {onBack && (
        <div className="relative z-10 w-full max-w-3xl mb-3">
          <StageBackButton label="Change path" onClick={onBack} />
        </div>
      )}

      <WizardStepHeader headerRef={headerRef} />

      <div
        ref={cardRef}
        className="relative z-10 w-full max-w-3xl rounded-2xl p-6 md:p-8 space-y-6"
        style={{
          background: 'rgba(20, 20, 26, 0.45)',
          backdropFilter: 'blur(24px) saturate(140%)',
          WebkitBackdropFilter: 'blur(24px) saturate(140%)',
          border: '1px solid rgba(255, 255, 255, 0.10)',
          boxShadow: '0 25px 70px rgba(0, 0, 0, 0.85)'
        }}
      >
        {/* Sub-step progress */}
        <div className="flex gap-1" aria-label="Form progress">
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              title={s.label}
              onClick={() => { if (i < stepIdx) { setError(''); setStepIdx(i); } }}
              disabled={i >= stepIdx}
              className="h-1 flex-1 rounded-full transition-colors duration-500"
              style={{ background: i <= stepIdx ? SPOT_BLUE : 'rgba(255,255,255,0.10)', cursor: i < stepIdx ? 'pointer' : 'default' }}
            />
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg" style={{ background: 'rgba(127,168,232,0.10)', border: '1px solid rgba(127,168,232,0.25)' }}>
            <StepIcon className="w-5 h-5" style={{ color: SPOT_BLUE }} strokeWidth={1.6} />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest block" style={{ color: SPOT_BLUE }}>
              Step {stepIdx + 1} of {STEPS.length}
            </span>
            <h1 className="font-syne text-xl font-bold tracking-tight" style={{ color: PAPER }}>{step.label}</h1>
          </div>
        </div>

        {/* keyed so each form step slides in */}
        <div key={step.id} className="rise-in">{renderStep()}</div>

        {error && <p className="text-xs" style={{ color: '#F87171' }}>{error}</p>}

        <div className="pt-4 flex items-center justify-between gap-3" style={{ borderTop: '1px solid rgba(255,255,255,0.10)' }}>
          <button
            type="button"
            onClick={goPrev}
            disabled={stepIdx === 0}
            className="px-4 py-2.5 rounded-[3px] text-xs font-semibold uppercase tracking-wider flex items-center gap-2 disabled:opacity-0"
            style={{ color: CHROME_MID, border: '1px solid rgba(255,255,255,0.15)' }}
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
          <button
            type="button"
            onClick={isLast ? handleCommit : goNext}
            disabled={committing || (isLast && analyzing)}
            className="btn-shine px-6 py-3 rounded-[3px] font-bold uppercase tracking-wider text-xs flex items-center gap-2 disabled:opacity-60"
            style={{ backgroundColor: PAPER, color: INK }}
          >
            {committing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            {isLast ? 'Create my resume' : step.id === 'job' && !jd ? 'Skip' : 'Next'}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
