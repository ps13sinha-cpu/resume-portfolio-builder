import React, { useMemo, useRef, useState } from 'react';
import {
  Upload, ClipboardPaste, UserCheck, Target, Wand2, Loader2, Check, AlertTriangle, ArrowRight, RotateCw, FileText, Plus
} from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';
import { extractResumeText, normalizeText } from '../utils/resumeExtraction';
import { canonicalToPortfolioPatch, portfolioToCanonical } from '../utils/portfolioPatch';
import { keywordScore, resumeText, termPresent } from '../utils/keywords';
import { wordDiff } from '../utils/wordDiff';
import { renderResume } from '../resume/registry';
import { heuristicParse, heuristicOptimize } from '../utils/clientFallback';
import {
  CinematicStage,
  WizardStepHeader,
  StageKeyframes,
  StageBackButton,
  useWizardProgress,
  SPOT_BLUE,
  CHROME_MID,
  INK,
  PAPER
} from './CinematicStage';

const glass = {
  background: 'rgba(20, 20, 26, 0.45)',
  backdropFilter: 'blur(24px) saturate(140%)',
  WebkitBackdropFilter: 'blur(24px) saturate(140%)',
  border: '1px solid rgba(255, 255, 255, 0.10)',
  boxShadow: '0 25px 70px rgba(0, 0, 0, 0.85)'
};
const inputCls = 'w-full px-3 py-2.5 rounded-lg text-xs bg-black/40 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-[#7FA8E8] leading-relaxed';

const STAGES = { reading: 'Reading your resume…', parsing: 'Understanding its sections…', keywords: 'Finding the job’s keywords and scoring your match…' };
const IMPORTANCE = { high: { label: 'Required', color: '#F87171' }, medium: { label: 'Mentioned', color: '#FBBF24' }, low: { label: 'Nice to have', color: CHROME_MID } };

// Apply the ticked suggestions to the parsed resume.
const applyOptimization = (resume, suggestions, on) => {
  const out = JSON.parse(JSON.stringify(resume));
  out.skills = out.skills || [];
  suggestions.forEach((s) => {
    if (!on[s.id]) return;
    if (s.type === 'add_skill' && !out.skills.some((k) => k.name.toLowerCase() === s.term.toLowerCase())) {
      out.skills.push({ name: s.term, category: '' });
    } else if (s.type === 'set_summary') {
      out.profile = { ...(out.profile || {}), bio: s.after };
    } else if (s.type === 'edit_bullet' && out.experience?.[s.expIndex]?.bullets?.[s.bulletIndex] !== undefined) {
      out.experience[s.expIndex].bullets[s.bulletIndex] = s.after;
    }
  });
  return out;
};

// Animated circular score
const ScoreRing = ({ value, label, muted }) => {
  const r = 34;
  const c = 2 * Math.PI * r;
  const color = muted ? 'rgba(255,255,255,0.35)' : value >= 75 ? '#4ADE80' : value >= 50 ? '#FBBF24' : '#F87171';
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-[84px] h-[84px]">
        <svg viewBox="0 0 84 84" className="w-full h-full -rotate-90">
          <circle cx="42" cy="42" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="7" />
          <circle cx="42" cy="42" r={r} fill="none" stroke={color} strokeWidth="7" strokeLinecap="round"
            strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)}
            style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16,1,0.3,1), stroke 0.4s' }} />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center font-syne text-xl font-bold" style={{ color: muted ? CHROME_MID : PAPER }}>{value}%</span>
      </div>
      <span className="text-[10px] uppercase tracking-wider" style={{ color: CHROME_MID }}>{label}</span>
    </div>
  );
};

const Diff = ({ before, after }) => (
  <p className="text-[11.5px] leading-relaxed">
    {wordDiff(before || '', after || '').map((w, i) => (
      <span key={i} style={w.t === 'del' ? { color: '#F87171', textDecoration: 'line-through', opacity: 0.8 } : w.t === 'add' ? { color: '#4ADE80' } : { color: '#D4D4D8' }}>{w.w} </span>
    ))}
  </p>
);

/**
 * ResumeOptimizerScreen — "Optimize my existing resume". Takes an existing
 * resume (upload, paste, or the one saved in the account) and a job
 * description; extracts the job's ATS keywords, scores the match, and works
 * the keywords in. Keywords the resume already evidences are added
 * automatically; ones it never mentions need an explicit "I have this".
 */
export const ResumeOptimizerScreen = ({ onNext, onBack }) => {
  const { portfolio, updatePortfolio, triggerPublishConfetti } = usePortfolio();
  const progress = useWizardProgress();
  const fileRef = useRef(null);

  const hasSaved = (portfolio.experience || []).length > 0 || !!portfolio.profile?.bio;
  const [source, setSource] = useState('upload');          // upload | paste | saved
  const [fileName, setFileName] = useState('');
  const [fileText, setFileText] = useState('');
  const [pasted, setPasted] = useState('');
  const [jd, setJd] = useState(portfolio.target_job?.description || '');
  const [phase, setPhase] = useState('input');            // input | working | review
  const [stage, setStage] = useState('');
  const [error, setError] = useState('');
  const [resume, setResume] = useState(null);             // parsed canonical resume
  const [result, setResult] = useState(null);             // { keywords, scoreBefore, suggestions, engine }
  const [on, setOn] = useState({});
  const [saving, setSaving] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    setFileName(file.name);
    setFileText('');
    try {
      setStage('reading');
      const { text } = await extractResumeText(file, (s) => setStage(s === 'ocr' ? 'reading' : s));
      setFileText(text);
    } catch (err) {
      setError(err.message || 'Could not read that file. Try pasting the text instead.');
      setFileName('');
    } finally {
      setStage('');
    }
  };

  const resumeReady = source === 'saved' ? hasSaved : source === 'paste' ? pasted.trim().length >= 80 : fileText.trim().length >= 80;
  const jdReady = jd.trim().length >= 40;

  const analyze = async () => {
    if (!resumeReady || !jdReady) return;
    setError('');
    setPhase('working');
    try {
      let parsed;
      if (source === 'saved') {
        parsed = portfolioToCanonical(portfolio);
      } else {
        setStage('parsing');
        const text = source === 'paste' ? normalizeText(pasted) : fileText;
        try {
          const res = await fetch('/api/parse-resume', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, kind: source }) });
          const contentType = res.headers.get('content-type') || '';
          if (res.ok && contentType.includes('application/json')) {
            const json = await res.json();
            parsed = json.data || heuristicParse(text);
          } else {
            parsed = heuristicParse(text);
          }
        } catch {
          parsed = heuristicParse(text);
        }
      }

      setStage('keywords');
      let optResult;
      try {
        const res2 = await fetch('/api/optimize', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ resume: parsed, jobDescription: jd }) });
        const contentType2 = res2.headers.get('content-type') || '';
        if (res2.ok && contentType2.includes('application/json')) {
          optResult = await res2.json();
        } else {
          optResult = heuristicOptimize(parsed, jd);
        }
      } catch {
        optResult = heuristicOptimize(parsed, jd);
      }

      if (!optResult || !optResult.suggestions) {
        optResult = heuristicOptimize(parsed, jd);
      }

      setResume(parsed);
      setResult(optResult);
      setOn(Object.fromEntries((optResult.suggestions || []).map((s) => [s.id, !!s.defaultOn])));
      setPhase('review');
    } catch (err) {
      setError(err.message || 'Failed to analyze resume.');
      setPhase('input');
    } finally {
      setStage('');
    }
  };

  const optimized = useMemo(() => (resume && result ? applyOptimization(resume, result.suggestions, on) : null), [resume, result, on]);
  const optimizedText = useMemo(() => (optimized ? resumeText(optimized) : ''), [optimized]);
  const scoreAfter = result && optimized ? keywordScore(result.keywords, optimized) : 0;
  const previewPortfolio = useMemo(() => (optimized ? { ...portfolio, ...canonicalToPortfolioPatch(optimized) } : portfolio), [optimized, portfolio]);

  const save = async () => {
    if (!optimized || saving) return;
    setSaving(true);
    const patch = canonicalToPortfolioPatch(optimized);
    await updatePortfolio((prev) => ({
      ...prev,
      ...patch,
      // keep things the resume text doesn't carry
      profile: { ...(prev.profile || {}), ...patch.profile, statusPill: prev.profile?.statusPill || '', avatarUrl: prev.profile?.avatarUrl || '' },
      target_job: {
        description: jd.trim().slice(0, 12000),
        requirements: result.keywords.map((k) => ({ requirement: k.term, status: termPresent(k.term, optimizedText) ? 'met' : 'missing' })),
        analyzed_at: new Date().toISOString()
      }
    }));
    triggerPublishConfetti();
    setSaving(false);
    onNext();
  };

  const groups = result ? {
    found: result.suggestions.filter((s) => s.type === 'add_skill' && s.source === 'found'),
    summary: result.suggestions.filter((s) => s.type === 'set_summary'),
    bullets: result.suggestions.filter((s) => s.type === 'edit_bullet'),
    missing: result.suggestions.filter((s) => s.type === 'add_skill' && s.source === 'missing')
  } : null;

  const Toggle = ({ s, children }) => (
    <label className="flex items-start gap-3 cursor-pointer">
      <input type="checkbox" checked={!!on[s.id]} onChange={(e) => setOn((o) => ({ ...o, [s.id]: e.target.checked }))} className="mt-0.5 accent-[#7FA8E8]" />
      <span className="min-w-0 flex-1">{children}</span>
    </label>
  );

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex flex-col items-center p-4 py-10 font-outfit" style={{ backgroundColor: INK, color: PAPER }}>
      <StageKeyframes />
      <CinematicStage />

      <div className="relative z-10 w-full max-w-7xl mb-3">
        <StageBackButton label={phase === 'review' ? 'Start over' : 'Back'} onClick={phase === 'review' ? () => { setPhase('input'); setResult(null); } : onBack} />
      </div>
      <WizardStepHeader />

      <div className="relative z-10 w-full max-w-7xl rounded-2xl p-6 md:p-8 space-y-6" style={glass}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest block mb-1" style={{ color: SPOT_BLUE }}>Step {progress.number} of {progress.total}</span>
            <h1 className="font-syne text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2" style={{ color: PAPER }}>
              <Wand2 className="w-5 h-5" style={{ color: SPOT_BLUE }} /> Optimize your resume for a job
            </h1>
            <p className="text-xs mt-1 max-w-2xl" style={{ color: CHROME_MID }}>
              We pull out the keywords recruiters and applicant-tracking systems scan for, check which ones your resume has, and work them in.
              Keywords you've never mentioned are only added if you confirm you have them.
            </p>
          </div>
          {result && (
            <span className="hidden sm:inline-flex shrink-0 px-3 py-1 rounded-full text-[10px] uppercase tracking-wider" style={{ color: CHROME_MID, border: '1px solid rgba(255,255,255,0.15)' }}>
              {result.engine === 'claude' ? 'AI analysis' : 'Keyword analysis (no AI key)'}
            </span>
          )}
        </div>

        {/* ───────────── INPUT ───────────── */}
        {phase === 'input' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 rise-in">
            {/* Resume */}
            <section className="space-y-3">
              <h2 className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2" style={{ color: CHROME_MID }}><FileText className="w-3.5 h-3.5" /> 1. Your current resume</h2>
              <div className="flex rounded-lg p-1 bg-black/40 border border-white/10 text-xs">
                {[['upload', 'Upload file', Upload], ['paste', 'Paste text', ClipboardPaste], ...(hasSaved ? [['saved', 'Use my saved resume', UserCheck]] : [])].map(([id, label, Icon]) => (
                  <button key={id} type="button" onClick={() => setSource(id)}
                    className={`flex-1 py-2 rounded-md flex items-center justify-center gap-1.5 transition-all ${source === id ? 'bg-white/10 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'}`}>
                    <Icon className="w-3.5 h-3.5" /> {label}
                  </button>
                ))}
              </div>
              {source === 'upload' && (
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="spot-card w-full rounded-xl py-10 flex flex-col items-center gap-2 border border-dashed transition-colors hover:border-[#7FA8E8]"
                  style={{ borderColor: fileText ? 'rgba(74,222,128,0.5)' : 'rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.02)' }}>
                  {stage === 'reading' ? <Loader2 className="w-6 h-6 animate-spin" style={{ color: SPOT_BLUE }} />
                    : fileText ? <Check className="w-6 h-6" style={{ color: '#4ADE80' }} /> : <Upload className="icon-bob w-6 h-6" style={{ color: SPOT_BLUE }} />}
                  <span className="text-xs font-semibold" style={{ color: PAPER }}>
                    {stage === 'reading' ? 'Reading…' : fileName ? fileName : 'Choose a PDF, Word (.docx), image (PNG/JPG), or text file'}
                  </span>
                  <span className="text-[11px]" style={{ color: CHROME_MID }}>{fileText ? `${fileText.split(/\s+/).length} words read. Click to replace.` : 'Max 10 MB. Scanned PDFs and images are read with OCR.'}</span>
                  <input ref={fileRef} type="file" accept=".pdf,.docx,.doc,.txt,.md,.json,.png,.jpg,.jpeg,.webp" className="hidden" onChange={handleFile} />
                </button>
              )}
              {source === 'paste' && (
                <textarea rows={12} className={`${inputCls} resize-y`} value={pasted} onChange={(e) => setPasted(e.target.value)} placeholder="Paste your whole resume here…" />
              )}
              {source === 'saved' && (
                <div className="rounded-xl p-4 text-xs space-y-1" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.10)' }}>
                  <p style={{ color: PAPER }} className="font-semibold">{portfolio.profile?.fullName} · {portfolio.profile?.title}</p>
                  <p style={{ color: CHROME_MID }}>{(portfolio.experience || []).length} positions, {(portfolio.skills || []).length} skills, {(portfolio.projects || []).length} projects</p>
                </div>
              )}
            </section>

            {/* Job description */}
            <section className="space-y-3">
              <h2 className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2" style={{ color: CHROME_MID }}><Target className="w-3.5 h-3.5" /> 2. The job description</h2>
              <textarea rows={source === 'upload' ? 11 : 14} className={`${inputCls} resize-y`} value={jd} onChange={(e) => setJd(e.target.value)}
                placeholder="Paste the full job posting: responsibilities, requirements, nice-to-haves…" />
              <p className="text-[11px] text-right" style={{ color: jdReady ? CHROME_MID : '#FBBF24' }}>
                {jdReady ? `${jd.length.toLocaleString()} characters` : 'Paste at least a few lines of the job description'}
              </p>
            </section>

            {error && <p className="lg:col-span-2 text-xs" style={{ color: '#F87171' }}>{error}</p>}

            <div className="lg:col-span-2 flex justify-end pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.10)' }}>
              <button type="button" onClick={analyze} disabled={!resumeReady || !jdReady || !!stage}
                className="btn-shine mt-4 px-8 py-3.5 rounded-[3px] font-bold uppercase tracking-wider text-xs flex items-center gap-2 disabled:opacity-50"
                style={{ backgroundColor: PAPER, color: INK }}>
                <Wand2 className="w-3.5 h-3.5" /> Analyze &amp; optimize <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ───────────── WORKING ───────────── */}
        {phase === 'working' && (
          <div className="space-y-4 py-4" aria-busy="true">
            <p className="flex items-center gap-2 text-xs" style={{ color: CHROME_MID }}>
              <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: SPOT_BLUE }} /> {STAGES[stage] || 'Working…'}
            </p>
            <div className="flex gap-6">{[0, 1].map((i) => <div key={i} className="skeleton w-[84px] h-[84px] !rounded-full" />)}</div>
            <div className="flex flex-wrap gap-1.5">{[64, 90, 52, 110, 70, 84, 58, 96].map((w, i) => <div key={i} className="skeleton h-6" style={{ width: w }} />)}</div>
            {[0, 1, 2].map((i) => <div key={i} className="skeleton h-16 w-full" />)}
          </div>
        )}

        {/* ───────────── REVIEW ───────────── */}
        {phase === 'review' && result && (
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-6 items-start">
            <div className="space-y-6 min-w-0">
              {/* Score */}
              <section className="flex flex-wrap items-center gap-6 rounded-xl p-4 rise-in" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <ScoreRing value={result.scoreBefore} label="Before" muted />
                <ArrowRight className="w-5 h-5" style={{ color: CHROME_MID }} />
                <ScoreRing value={scoreAfter} label="After" />
                <p className="flex-1 min-w-[180px] text-[11.5px] leading-relaxed" style={{ color: CHROME_MID }}>
                  Keyword match with this job, weighted by importance, the way applicant-tracking systems rank resumes.
                  {result.keywords.some((k) => k.importance === 'high' && !termPresent(k.term, optimizedText)) && ' Required keywords you tick below raise it most.'}
                </p>
              </section>

              {/* Keywords */}
              <section className="space-y-2 rise-in" style={{ '--i': 1 }}>
                <h2 className="text-[10px] font-bold uppercase tracking-widest" style={{ color: CHROME_MID }}>Keywords in this job ({result.keywords.length})</h2>
                <div className="flex flex-wrap gap-1.5">
                  {result.keywords.map((k) => {
                    const had = k.inResume;
                    const now = termPresent(k.term, optimizedText);
                    const color = now ? '#4ADE80' : IMPORTANCE[k.importance].color;
                    return (
                      <span key={k.term} title={`${IMPORTANCE[k.importance].label}${had ? ' · already in your resume' : now ? ' · added' : ' · missing'}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] transition-colors duration-300"
                        style={{ color, background: now ? 'rgba(74,222,128,0.10)' : 'rgba(255,255,255,0.04)', border: `1px solid ${now ? 'rgba(74,222,128,0.35)' : 'rgba(255,255,255,0.10)'}` }}>
                        {now ? (had ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />) : <AlertTriangle className="w-3 h-3" />}
                        {k.term}
                        {k.importance === 'high' && !now && <span className="text-[9px] uppercase opacity-80">req</span>}
                      </span>
                    );
                  })}
                </div>
              </section>

              {/* Changes */}
              {groups.found.length > 0 && (
                <section className="space-y-2 rise-in" style={{ '--i': 2 }}>
                  <h2 className="text-[10px] font-bold uppercase tracking-widest" style={{ color: CHROME_MID }}>Add to Skills: already shown in your experience</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {groups.found.map((s) => (
                      <div key={s.id} className="rounded-lg px-3 py-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <Toggle s={s}><span className="block text-xs font-semibold" style={{ color: PAPER }}>{s.term}</span><span className="block text-[10.5px]" style={{ color: CHROME_MID }}>{s.reason}</span></Toggle>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {[...groups.summary, ...groups.bullets].length > 0 && (
                <section className="space-y-2 rise-in" style={{ '--i': 3 }}>
                  <h2 className="text-[10px] font-bold uppercase tracking-widest" style={{ color: CHROME_MID }}>Rewrites using the job's keywords</h2>
                  {[...groups.summary, ...groups.bullets].map((s) => (
                    <div key={s.id} className="rounded-lg p-3 space-y-2" style={{ background: on[s.id] ? 'rgba(127,168,232,0.05)' : 'rgba(255,255,255,0.02)', border: on[s.id] ? '1px solid rgba(127,168,232,0.4)' : '1px solid rgba(255,255,255,0.08)' }}>
                      <Toggle s={s}>
                        <span className="block text-xs font-semibold" style={{ color: PAPER }}>{s.label}</span>
                        <span className="block text-[10.5px]" style={{ color: CHROME_MID }}>{s.reason}</span>
                      </Toggle>
                      <div className="pl-6"><Diff before={s.before} after={s.after} /></div>
                      {s.warnings?.map((w, i) => (
                        <p key={i} className="pl-6 flex items-start gap-1.5 text-[10.5px]" style={{ color: '#FBBF24' }}><AlertTriangle className="w-3 h-3 shrink-0 mt-px" /> {w}</p>
                      ))}
                    </div>
                  ))}
                  {result.engine !== 'claude' && groups.bullets.length === 0 && (
                    <p className="text-[10.5px]" style={{ color: CHROME_MID }}>Rewording individual bullets needs the AI engine (ANTHROPIC_API_KEY on the server).</p>
                  )}
                </section>
              )}

              {groups.missing.length > 0 && (
                <section className="space-y-2 rise-in" style={{ '--i': 4 }}>
                  <h2 className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#FBBF24' }}>Missing from your resume: tick only the ones you really have</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {groups.missing.map((s) => (
                      <div key={s.id} className="rounded-lg px-3 py-2 transition-colors" style={{ background: on[s.id] ? 'rgba(74,222,128,0.06)' : 'rgba(255,255,255,0.02)', border: `1px solid ${on[s.id] ? 'rgba(74,222,128,0.35)' : 'rgba(255,255,255,0.08)'}` }}>
                        <Toggle s={s}><span className="block text-xs font-semibold" style={{ color: PAPER }}>{s.label}</span><span className="block text-[10.5px]" style={{ color: CHROME_MID }}>{s.reason}</span></Toggle>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10.5px]" style={{ color: CHROME_MID }}>Ticked skills go into your Skills section. Be ready to talk about each one in an interview.</p>
                </section>
              )}
            </div>

            {/* Live preview */}
            <div className="lg:sticky lg:top-4 min-w-0 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: CHROME_MID }}>Live preview</p>
              <div className="rounded-sm overflow-hidden bg-white shadow-[0_30px_80px_rgba(0,0,0,0.7)] max-h-[720px] overflow-y-auto">
                {renderResume(portfolio.resume_template, previewPortfolio, portfolio.resume_accent)}
              </div>
            </div>

            <div className="lg:col-span-2 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.10)' }}>
              <button type="button" onClick={analyze} className="inline-flex items-center gap-1.5 text-xs underline self-center sm:self-auto" style={{ color: CHROME_MID }}>
                <RotateCw className="w-3 h-3" /> Re-analyze
              </button>
              <button type="button" onClick={save} disabled={saving}
                className="btn-shine px-8 py-3.5 rounded-[3px] font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ backgroundColor: PAPER, color: INK }}>
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Save optimized resume <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
