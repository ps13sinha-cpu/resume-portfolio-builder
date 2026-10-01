import React, { useMemo } from 'react';
import { ArrowLeft, Zap, ShieldCheck, AlertTriangle, Info } from 'lucide-react';
import { SPOT_BLUE, CHROME_MID, PAPER, INK } from './CinematicStage';

// ============================================================================
// FIT REPORT SCREEN (spec §8) — renders the fitting engine's fitReport after
// template selection, before publish. Skipped entirely when everything fits
// natively (fitReport has nothing to say).
// ============================================================================

const hasIssues = (report) =>
  report && (
    Object.values(report.itemsHidden || {}).some((n) => n > 0) ||
    (report.bulletsCondensed || []).length > 0 ||
    (report.sectionsUnsupported || []).length > 0
  );

const SectionLine = ({ icon: Icon, children }) => (
  <li className="flex items-start gap-2 text-xs leading-relaxed" style={{ color: CHROME_MID }}>
    <Icon className="w-3.5 h-3.5 mt-0.5 shrink-0" />
    <span>{children}</span>
  </li>
);

export const FitReportScreen = ({ templateName, fitReport, onSwitch, onCondenseFurther, onContinue, condensing }) => {
  const { itemsShown = {}, itemsHidden = {}, bulletsCondensed = [], sectionsUnsupported = [], notes = [] } = fitReport || {};

  const lines = useMemo(() => {
    const out = [];
    for (const [section, hidden] of Object.entries(itemsHidden)) {
      if (hidden > 0) {
        const shown = itemsShown[section] ?? 0;
        const label = section === 'experience' ? 'work experiences' : section;
        out.push({ icon: Info, text: `${hidden} of ${hidden + shown} ${label} shown (most recent)` });
      }
    }
    if (sectionsUnsupported.length) {
      out.push({ icon: AlertTriangle, text: `${sectionsUnsupported.join(', ')} won't appear in this layout` });
    }
    if (bulletsCondensed.length) {
      out.push({ icon: Zap, text: `${bulletsCondensed.length} bullet point${bulletsCondensed.length === 1 ? ' was' : 's were'} shortened to fit` });
    }
    return out;
  }, [itemsShown, itemsHidden, bulletsCondensed, sectionsUnsupported]);

  // Spec: empty report → skip the screen entirely.
  if (!hasIssues(fitReport)) return null;

  return (
    <div className="space-y-4 p-4 rounded-xl" style={{ background: 'rgba(127,168,232,0.05)', border: '1px solid rgba(127,168,232,0.25)' }}>
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-4 h-4" style={{ color: SPOT_BLUE }} />
        <h3 className="font-syne text-sm font-bold" style={{ color: PAPER }}>
          "{templateName}" is tight
        </h3>
      </div>

      <ul className="space-y-2 pl-1">
        {lines.map((l, i) => <SectionLine key={i} icon={l.icon}>{l.text}</SectionLine>)}
        {(notes || []).map((n, i) => <SectionLine key={`n${i}`} icon={Info}>{n}</SectionLine>)}
      </ul>

      <div className="flex flex-wrap gap-2 pt-1">
        <button
          onClick={onSwitch}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[3px] text-[11px] font-bold uppercase tracking-wider transition-all active:scale-95"
          style={{ color: CHROME_MID, border: '1px solid rgba(255,255,255,0.15)' }}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Switch template</span>
        </button>
        {bulletsCondensed.length > 0 && (
          <button
            onClick={onCondenseFurther}
            disabled={condensing}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[3px] text-[11px] font-bold uppercase tracking-wider transition-all active:scale-95"
            style={{ color: SPOT_BLUE, border: `1px solid ${SPOT_BLUE}`, background: 'rgba(127,168,232,0.08)' }}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{condensing ? 'Condensing…' : 'Let AI condense further'}</span>
          </button>
        )}
        <button
          onClick={onContinue}
          className="px-3 py-2 rounded-[3px] text-[11px] font-bold uppercase tracking-wider transition-all active:scale-95"
          style={{ backgroundColor: PAPER, color: INK }}
        >
          Continue anyway
        </button>
      </div>
    </div>
  );
};
