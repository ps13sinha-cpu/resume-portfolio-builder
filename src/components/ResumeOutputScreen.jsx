import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import { Download, PencilLine, Globe, Target, Check, AlertCircle, ArrowRight, LayoutTemplate } from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';
import { RESUME_TEMPLATES, RESUME_ACCENTS, getResumeTemplate, renderResume } from '../resume/registry';
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

const glass = {
  background: 'rgba(20, 20, 26, 0.45)',
  backdropFilter: 'blur(24px) saturate(140%)',
  WebkitBackdropFilter: 'blur(24px) saturate(140%)',
  border: '1px solid rgba(255, 255, 255, 0.10)',
  boxShadow: '0 25px 70px rgba(0, 0, 0, 0.85)'
};

/**
 * ResumeOutputScreen — the deliverable of the "Resume builder" path: the
 * user's tailored resume as a printable document.
 *
 * Download uses the browser's print → Save as PDF rather than an image
 * capture, so the PDF keeps real, selectable text that applicant-tracking
 * systems can parse. A second copy of the resume is portaled straight into
 * <body> and is the only thing shown in print media.
 */
export const ResumeOutputScreen = ({ onEdit, onBuildWebsite, editLabel = 'Edit details' }) => {
  const { portfolio, updatePortfolio } = usePortfolio();
  const templateId = getResumeTemplate(portfolio.resume_template).id;
  const accentId = portfolio.resume_accent || RESUME_ACCENTS[0].id;
  const activeTemplate = getResumeTemplate(templateId);
  const chooseTemplate = (id) => updatePortfolio({ resume_template: id });
  const chooseAccent = (id) => updatePortfolio({ resume_accent: id });
  const containerRef = useRef(null);
  const spotlightRef = useRef(null);
  const dustCanvasRef = useRef(null);
  const headerRef = useRef(null);
  const paperRef = useRef(null);
  const sideRef = useRef(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = gsap.context(() => {
      gsap.timeline({ defaults: { ease: 'power2.out' } })
        .from(spotlightRef.current, { opacity: 0, duration: 0.4 }, 0.1)
        .from(headerRef.current, { opacity: 0, y: -12, duration: 0.3 }, 0.1)
        .from(paperRef.current, { opacity: 0, y: 24, duration: 0.5 }, 0.25)
        .from(sideRef.current, { opacity: 0, x: 20, duration: 0.4 }, 0.4);
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const fileTitle = `${(portfolio.profile?.fullName || 'Resume').replace(/\s+/g, '_')}_Resume`;

  const handleDownload = () => {
    // The print dialog's "Save as PDF" uses the document title as file name.
    const prevTitle = document.title;
    document.title = fileTitle;
    const restore = () => { document.title = prevTitle; window.removeEventListener('afterprint', restore); };
    window.addEventListener('afterprint', restore);
    window.print();
  };

  const reqs = portfolio.target_job?.requirements || [];
  const met = reqs.filter((r) => r.status === 'met').length;
  const partial = reqs.filter((r) => r.status === 'partial').length;
  const missing = reqs.filter((r) => r.status === 'missing');
  const pct = reqs.length ? Math.round(((met + partial * 0.5) / reqs.length) * 100) : null;

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen w-full overflow-hidden flex flex-col items-center p-4 py-10 font-outfit"
      style={{ backgroundColor: INK, color: PAPER }}
    >
      <StageKeyframes />
      <CinematicStage spotlightRef={spotlightRef} dustCanvasRef={dustCanvasRef} />

      <div className="relative z-10 w-full max-w-6xl mb-3">
        <StageBackButton label={editLabel} onClick={onEdit} />
      </div>

      <WizardStepHeader headerRef={headerRef} />

      <div className="relative z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start">
        {/* The resume, on paper */}
        <div ref={paperRef} className="min-w-0 space-y-4">
          {/* Design picker: live mini-renders of every design with the user's data */}
          <div className="rounded-2xl p-4 space-y-3" style={glass}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest" style={{ color: PAPER }}>
                <LayoutTemplate className="w-4 h-4" style={{ color: SPOT_BLUE }} /> Design
              </h2>
              {activeTemplate.usesAccent && (
                <div className="flex items-center gap-1.5" role="radiogroup" aria-label="Accent colour">
                  {RESUME_ACCENTS.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      role="radio"
                      aria-checked={accentId === a.id}
                      title={a.name}
                      onClick={() => chooseAccent(a.id)}
                      className="w-5 h-5 rounded-full transition-transform hover:scale-110"
                      style={{ background: a.hex, outline: accentId === a.id ? `2px solid ${PAPER}` : 'none', outlineOffset: 2 }}
                    />
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {RESUME_TEMPLATES.map((t) => {
                const active = t.id === templateId;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => chooseTemplate(t.id)}
                    aria-pressed={active}
                    className="shrink-0 text-left group"
                    style={{ width: 132 }}
                  >
                    <div
                      className="relative overflow-hidden rounded-md bg-white transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_14px_30px_rgba(0,0,0,0.5)]"
                      style={{
                        height: 170,
                        outline: active ? `2px solid ${SPOT_BLUE}` : '1px solid rgba(255,255,255,0.12)',
                        outlineOffset: active ? 2 : 0,
                        boxShadow: active ? '0 0 22px rgba(127,168,232,0.35)' : 'none'
                      }}
                    >
                      <div className="pointer-events-none absolute top-0 left-0" style={{ width: 820, transform: `scale(${132 / 820})`, transformOrigin: 'top left' }} aria-hidden="true">
                        {renderResume(t.id, portfolio, accentId)}
                      </div>
                    </div>
                    <div className="mt-1.5 flex items-center justify-between gap-1">
                      <span className="text-[11px] font-semibold truncate" style={{ color: active ? PAPER : CHROME_MID }}>{t.name}</span>
                      <span className="text-[9px] uppercase tracking-wide shrink-0" style={{ color: t.ats === 'Best' ? '#4ADE80' : t.ats === 'Good' ? SPOT_BLUE : '#FBBF24' }} title="How reliably applicant-tracking systems read this layout">
                        ATS {t.ats}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px]" style={{ color: CHROME_MID }}>
              {activeTemplate.description}
              {activeTemplate.ats === 'Fair' && ' Two-column and decorative layouts can be read out of order by some applicant-tracking systems; use a "Best" design for online applications.'}
            </p>
          </div>

          {/* key replays the page-flip entrance whenever the design or colour changes */}
          <div key={`${templateId}-${accentId}`} className="paper-swap rounded-sm overflow-hidden bg-white shadow-[0_30px_80px_rgba(0,0,0,0.7)]">
            {renderResume(templateId, portfolio, accentId)}
          </div>
        </div>

        {/* Actions + job match */}
        <aside ref={sideRef} className="lg:sticky lg:top-6 space-y-4">
          <div className="rounded-2xl p-5 space-y-4" style={glass}>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: SPOT_BLUE }}>Your resume is ready</span>
              <h1 className="font-syne text-xl font-bold tracking-tight mt-1" style={{ color: PAPER }}>
                {portfolio.profile?.fullName || 'Your resume'}
              </h1>
              {portfolio.profile?.title && <p className="text-xs mt-0.5" style={{ color: CHROME_MID }}>{portfolio.profile.title}</p>}
            </div>

            <button
              type="button"
              onClick={handleDownload}
              className="btn-shine w-full py-3 rounded-[3px] font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-colors hover:bg-transparent hover:text-white border"
              style={{ backgroundColor: PAPER, color: INK, borderColor: PAPER }}
            >
              <Download className="w-3.5 h-3.5" /> Download PDF
            </button>
            <p className="text-[11px] leading-relaxed" style={{ color: CHROME_MID }}>
              Opens your browser's print dialog. Choose <span style={{ color: PAPER }}>Save as PDF</span>. The PDF keeps real text,
              so recruiters' applicant-tracking systems can read it.
            </p>

            <button
              type="button"
              onClick={onEdit}
              className="w-full py-2.5 rounded-[3px] font-semibold uppercase tracking-wider text-[11px] flex items-center justify-center gap-2 border transition-colors hover:text-white"
              style={{ color: CHROME_MID, borderColor: 'rgba(255,255,255,0.15)' }}
            >
              <PencilLine className="w-3.5 h-3.5" /> {editLabel}
            </button>
          </div>

          {/* Job match summary (only when a job description was analyzed) */}
          {reqs.length > 0 && (
            <div className="rounded-2xl p-5 space-y-3" style={glass}>
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4" style={{ color: SPOT_BLUE }} />
                <h2 className="font-syne text-sm font-bold" style={{ color: PAPER }}>Match with the job</h2>
              </div>
              <div className="flex items-end gap-2">
                <span className="font-syne text-3xl font-bold" style={{ color: PAPER }}>{pct}%</span>
                <span className="text-[11px] pb-1" style={{ color: CHROME_MID }}>
                  {met} of {reqs.length} requirements covered{partial ? `, ${partial} partly` : ''}
                </span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: SPOT_BLUE }} />
              </div>
              {missing.length > 0 ? (
                <div className="space-y-1.5 pt-1">
                  <p className="text-[11px]" style={{ color: CHROME_MID }}>Not in your resume yet. Add them under Edit details if you have this experience:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {missing.map((r, i) => (
                      <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px]" style={{ color: '#F87171', background: 'rgba(248,113,113,0.10)' }}>
                        <AlertCircle className="w-3 h-3" /> {r.requirement}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="flex items-center gap-1.5 text-[11px]" style={{ color: '#4ADE80' }}>
                  <Check className="w-3.5 h-3.5" /> Every requirement we found is covered.
                </p>
              )}
            </div>
          )}

          {/* Optional next step: turn it into a website */}
          <button
            type="button"
            onClick={onBuildWebsite}
            className="group w-full text-left rounded-2xl p-5 space-y-1.5 transition-colors"
            style={glass}
          >
            <span className="flex items-center gap-2 text-sm font-bold" style={{ color: PAPER }}>
              <Globe className="w-4 h-4" style={{ color: SPOT_BLUE }} /> Also make a portfolio website
              <ArrowRight className="w-3.5 h-3.5 ml-auto transition-transform group-hover:translate-x-0.5" />
            </span>
            <span className="block text-[11px]" style={{ color: CHROME_MID }}>
              Optional. Use these same details on one of 242 website designs.
            </span>
          </button>
        </aside>
      </div>

      {/* Print-only copy: the single thing on the page when printing */}
      {createPortal(
        <div id="resume-print-root">
          {renderResume(templateId, portfolio, accentId)}
        </div>,
        document.body
      )}
      <style>{`
        #resume-print-root { display: none; }
        @media print {
          @page { size: A4; margin: 10mm; }
          body > *:not(#resume-print-root) { display: none !important; }
          #resume-print-root { display: block !important; }
          body { background: #fff !important; }
          #resume-print-root * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          #resume-print-root section, #resume-print-root article { break-inside: avoid; }
        }
      `}</style>
    </div>
  );
};
