import React, { useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { Wand2, Check, AlertTriangle, CircleDashed, Info, Loader2, ArrowRight, RotateCw } from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';
import { getTheme } from '../templates/registry';
import { PortfolioPreviewFrame } from './PortfolioPreviewFrame';
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

const SECTION_LABELS = {
  about: 'About', skills: 'Skills', projects: 'Projects', experience: 'Experience', education: 'Education',
  certifications: 'Certifications', stats: 'Stats counters', services: 'Services', testimonials: 'Testimonials',
  publications: 'Publications'
};

const inputCls = 'w-full px-3 py-2 rounded-lg text-xs bg-black/40 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-[#7FA8E8] leading-relaxed';

// Accepted suggestions → a new portfolio object (used for the live preview
// and, on confirm, saved).
const applyFit = (pf, suggestions, decisions) => {
  const out = { ...pf, profile: { ...(pf.profile || {}) } };
  suggestions.forEach((s) => {
    const d = decisions[s.id];
    if (!d?.on) return;
    if (s.id === 'bio' || s.id === 'aboutHeadline' || s.id === 'statusPill') {
      out.profile[s.id] = String(d.value || '').trim();
    } else if (s.id.startsWith('project:')) {
      out.projects = (out.projects || []).map((p, i) => (i === s.projectIndex ? { ...p, description: String(d.value || '').trim() } : p));
    } else if (s.id === 'skillCategories') {
      out.skills = (out.skills || []).map((sk) => ({ ...sk, category: d.value[sk.name] || sk.category }));
    } else if (s.id === 'skillGroupDesc') {
      out.skillGroupDesc = d.value;
    }
  });
  return out;
};

/**
 * TemplateFitScreen — the AI layer between "your data" and "your chosen
 * design". The server works out what this design displays, compares it with
 * the user's data (uploaded resume or typed details), and writes the missing
 * pieces in the design's tone. The user reviews each one against a live
 * preview; only accepted suggestions are saved.
 */
export const TemplateFitScreen = ({ onNext, onBack }) => {
  const { portfolio, updatePortfolio, triggerPublishConfetti } = usePortfolio();
  const progress = useWizardProgress();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [decisions, setDecisions] = useState({});
  const [saving, setSaving] = useState(false);

  const containerRef = useRef(null);
  const spotlightRef = useRef(null);
  const dustCanvasRef = useRef(null);
  const headerRef = useRef(null);

  const layoutId = portfolio.layout_id;
  const theme = getTheme(layoutId);

  const loadPlan = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/template-fit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ layoutId, portfolio })
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error?.message || 'Could not analyze this design.');
      setPlan(json);
      setDecisions(Object.fromEntries(json.suggestions.map((s) => [s.id, { on: s.defaultOn, value: s.suggested }])));
    } catch (e) {
      setError(e.message === 'Failed to fetch' ? 'Could not reach the server. Is the backend running?' : e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlan();
    // Only on entry: re-running on every portfolio change would discard edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layoutId]);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = gsap.context(() => {
      gsap.from(spotlightRef.current, { opacity: 0, duration: 0.4 });
      gsap.from(headerRef.current, { opacity: 0, y: -12, duration: 0.3 });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const suggestions = plan?.suggestions || [];
  const previewPortfolio = useMemo(
    () => (plan ? applyFit(portfolio, suggestions, decisions) : portfolio),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [plan, portfolio, decisions]
  );
  const acceptedCount = suggestions.filter((s) => decisions[s.id]?.on).length;

  const setDecision = (id, patch) => setDecisions((d) => ({ ...d, [id]: { ...d[id], ...patch } }));
  const setAll = (on) => setDecisions((d) => Object.fromEntries(Object.entries(d).map(([k, v]) => [k, { ...v, on }])));

  const handleApply = async () => {
    if (saving) return;
    setSaving(true);
    await updatePortfolio(() => applyFit(portfolio, suggestions, decisions));
    triggerPublishConfetti();
    setSaving(false);
    onNext();
  };

  const renderValueEditor = (s) => {
    const d = decisions[s.id] || {};
    if (s.kind === 'map') {
      // Short values (skill → category) fit two per row; sentences get a full row.
      const entries = Object.entries(d.value || {});
      const long = entries.some(([, v]) => String(v).length > 24);
      return (
        <div className={`grid grid-cols-1 ${long ? '' : 'sm:grid-cols-2'} gap-2`}>
          {entries.map(([k, v]) => (
            <label key={k} className="flex items-center gap-2 text-[11px]">
              <span className="w-28 shrink-0 truncate" style={{ color: CHROME_MID }} title={k}>{k}</span>
              <input
                className={inputCls}
                value={v}
                onChange={(e) => setDecision(s.id, { value: { ...d.value, [k]: e.target.value }, on: true })}
              />
            </label>
          ))}
        </div>
      );
    }
    return (
      <textarea
        className={`${inputCls} resize-y`}
        rows={String(d.value || '').length > 110 ? 3 : 2}
        value={d.value || ''}
        onChange={(e) => setDecision(s.id, { value: e.target.value, on: true })}
      />
    );
  };

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen w-full overflow-hidden flex flex-col items-center p-4 py-10 font-outfit"
      style={{ backgroundColor: INK, color: PAPER }}
    >
      <StageKeyframes />
      <CinematicStage spotlightRef={spotlightRef} dustCanvasRef={dustCanvasRef} />

      <div className="relative z-10 w-full max-w-7xl mb-3">
        <StageBackButton label="Back" onClick={onBack} />
      </div>

      <WizardStepHeader headerRef={headerRef} />

      <div className="relative z-10 w-full max-w-7xl rounded-2xl p-6 md:p-8 space-y-6" style={glass}>
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest block mb-1" style={{ color: SPOT_BLUE }}>
              Step {progress.number} of {progress.total}
            </span>
            <h1 className="font-syne text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2" style={{ color: PAPER }}>
              <Wand2 className="w-5 h-5" style={{ color: SPOT_BLUE }} />
              Fit your details to {plan?.template?.name || theme?.name || 'this design'}
            </h1>
            <p className="text-xs mt-1 max-w-2xl" style={{ color: CHROME_MID }}>
              We checked what this design shows against your details. AI wrote the missing pieces in the design's style,
              using only facts you gave us. Review each one; the preview updates as you go.
            </p>
          </div>
          {plan && (
            <span className="hidden sm:inline-flex shrink-0 px-3 py-1 rounded-full text-[10px] uppercase tracking-wider" style={{ color: CHROME_MID, border: '1px solid rgba(255,255,255,0.15)' }}>
              {plan.engine === 'claude' ? 'AI-written' : 'Rule-based (no AI key)'}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-6 items-start">
          {/* Left: analysis + suggestions */}
          <div className="space-y-5 min-w-0">
            {loading && (
              <div className="space-y-4" aria-busy="true">
                <p className="flex items-center gap-2 text-xs" style={{ color: CHROME_MID }}>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: SPOT_BLUE }} />
                  Reading the design and your details…
                </p>
                <div className="flex gap-1.5">{[70, 58, 76, 88].map((w, i) => <div key={i} className="skeleton h-6" style={{ width: w }} />)}</div>
                {[0, 1, 2].map((i) => (
                  <div key={i} className="rounded-xl p-4 space-y-2.5 border border-white/5">
                    <div className="skeleton h-3.5 w-40" />
                    <div className="skeleton h-3 w-64" />
                    <div className="skeleton h-14 w-full" />
                  </div>
                ))}
              </div>
            )}

            {error && (
              <div className="text-xs space-y-2">
                <p style={{ color: '#F87171' }}>{error}</p>
                <button type="button" onClick={loadPlan} className="inline-flex items-center gap-1 underline" style={{ color: CHROME_MID }}>
                  <RotateCw className="w-3 h-3" /> Try again
                </button>
              </div>
            )}

            {plan && !loading && (
              <>
                {/* What the design shows */}
                <section className="space-y-2">
                  <h2 className="text-[10px] font-bold uppercase tracking-widest" style={{ color: CHROME_MID }}>What this design shows</h2>
                  <div className="flex flex-wrap gap-1.5">
                    {plan.coverage.map((c) => {
                      const color = c.status === 'filled' ? '#4ADE80' : c.status === 'missing' ? '#FBBF24' : CHROME_MID;
                      const Icon = c.status === 'filled' ? Check : c.status === 'missing' ? AlertTriangle : CircleDashed;
                      return (
                        <span key={c.section} title={c.note} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] bg-white/[0.03] border border-white/10" style={{ color }}>
                          <Icon className="w-3 h-3" /> {SECTION_LABELS[c.section] || c.section}
                        </span>
                      );
                    })}
                  </div>
                  {plan.coverage.filter((c) => c.note).map((c) => (
                    <p key={c.section} className="text-[11px] leading-relaxed" style={{ color: CHROME_MID }}>
                      <span style={{ color: PAPER }}>{SECTION_LABELS[c.section] || c.section}:</span> {c.note}
                    </p>
                  ))}
                </section>

                {/* AI suggestions */}
                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-[10px] font-bold uppercase tracking-widest" style={{ color: CHROME_MID }}>
                      Added for this design ({acceptedCount}/{suggestions.length} selected)
                    </h2>
                    {suggestions.length > 1 && (
                      <div className="flex gap-3 text-[11px]">
                        <button type="button" onClick={() => setAll(true)} className="underline" style={{ color: SPOT_BLUE }}>Select all</button>
                        <button type="button" onClick={() => setAll(false)} className="underline" style={{ color: CHROME_MID }}>None</button>
                      </div>
                    )}
                  </div>

                  {suggestions.length === 0 && (
                    <p className="flex items-center gap-2 text-xs rounded-lg px-3 py-3 bg-white/[0.02] border border-white/10" style={{ color: '#4ADE80' }}>
                      <Check className="w-4 h-4" /> Your details already cover everything this design needs.
                    </p>
                  )}

                  {suggestions.map((s, sIdx) => {
                    const d = decisions[s.id] || {};
                    return (
                      <div
                        key={s.id}
                        className="rise-in rounded-xl p-4 space-y-2.5 transition-colors"
                        style={{
                          '--i': sIdx,
                          background: d.on ? 'rgba(127,168,232,0.05)' : 'rgba(255,255,255,0.02)',
                          border: d.on ? '1px solid rgba(127,168,232,0.45)' : '1px solid rgba(255,255,255,0.08)'
                        }}
                      >
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!d.on}
                            onChange={(e) => setDecision(s.id, { on: e.target.checked })}
                            className="mt-0.5 accent-[#7FA8E8]"
                          />
                          <span className="min-w-0">
                            <span className="block text-xs font-semibold" style={{ color: PAPER }}>{s.label}</span>
                            <span className="block text-[11px]" style={{ color: CHROME_MID }}>{s.reason}</span>
                          </span>
                        </label>
                        {s.current && typeof s.current === 'string' && (
                          <p className="text-[11px] pl-6" style={{ color: CHROME_MID }}>
                            Now: <span className="line-through opacity-80">{s.current}</span>
                          </p>
                        )}
                        <div className="pl-6">{renderValueEditor(s)}</div>
                        {s.warnings?.map((w, i) => (
                          <p key={i} className="pl-6 flex items-start gap-1.5 text-[11px]" style={{ color: '#FBBF24' }}>
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-px" /> {w}
                          </p>
                        ))}
                      </div>
                    );
                  })}
                </section>

                {/* Things only the user can add */}
                {plan.manual.length > 0 && (
                  <section className="space-y-1.5">
                    <h2 className="text-[10px] font-bold uppercase tracking-widest" style={{ color: CHROME_MID }}>You can add later</h2>
                    {plan.manual.map((m, i) => (
                      <p key={i} className="flex items-start gap-1.5 text-[11px]" style={{ color: CHROME_MID }}>
                        <Info className="w-3.5 h-3.5 shrink-0 mt-px" style={{ color: SPOT_BLUE }} /> {m}
                      </p>
                    ))}
                  </section>
                )}
              </>
            )}
          </div>

          {/* Right: live preview with the selected suggestions applied */}
          <div className="lg:sticky lg:top-4 min-w-0">
            <PortfolioPreviewFrame layoutId={layoutId} portfolio={previewPortfolio} height={600} caption="with the selected additions" />
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3" style={{ borderTop: '1px solid rgba(255,255,255,0.10)' }}>
          <button type="button" onClick={onNext} className="text-xs underline self-center sm:self-auto" style={{ color: CHROME_MID }}>
            Skip, keep my details as they are
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={loading || saving || !!error}
            className="btn-shine px-8 py-3.5 rounded-[3px] font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ backgroundColor: PAPER, color: INK }}
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
            {acceptedCount ? `Apply ${acceptedCount} & build website` : 'Build website'}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
