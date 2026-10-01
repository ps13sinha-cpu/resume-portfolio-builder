import React, { useEffect, useRef, useState, useMemo } from 'react';
import gsap from 'gsap';
import { usePortfolio } from '../context/PortfolioContext';
import {
  Sparkles, Check, ArrowRight, Layers, Globe, Search, Loader2, Zap
} from 'lucide-react';
import {
  CinematicStage,
  WizardStepHeader,
  StageKeyframes,
  StageBackButton,
  pulseSpot,
  useWizardProgress,
  SPOT_BLUE,
  CHROME_MID,
  INK,
  PAPER
} from './CinematicStage';
import { THEMES } from '../templates/registry';
import { PortfolioPreviewFrame } from './PortfolioPreviewFrame';
import { trackSpot } from '../utils/motion';

const CATEGORY_LABELS = {
  technology: 'Technology',
  creative: 'Creative',
  business: 'Business',
  academic: 'Academic',
  services: 'Services',
  retail: 'Retail',
  'health-wellness': 'Health',
  startup: 'Startup',
  gaming: 'Gaming',
  music: 'Music',
  events: 'Events',
  medical: 'Medical'
};

export const TemplateSelectScreen = ({ onBuild, onBack, backLabel = 'Back to Resume', templateFirst = false }) => {
  const { portfolio, updatePortfolio, triggerPublishConfetti } = usePortfolio();
  const [selectedLayout, setSelectedLayout] = useState(portfolio.layout_id || 'awwwards');
  const [isBuilding, setIsBuilding] = useState(false);

  // HTML library state
  // Template-first users came here for the 229-design library
  const [activeCollection, setActiveCollection] = useState(templateFirst ? 'html' : 'react');
  const [htmlTemplates, setHtmlTemplates] = useState([]);
  const [loadingHtml, setLoadingHtml] = useState(false);
  const [htmlCategory, setHtmlCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // DOM refs for animation
  const containerRef = useRef(null);
  const spotlightRef = useRef(null);
  const backRef = useRef(null);
  const dustCanvasRef = useRef(null);
  const wizardHeaderRef = useRef(null);
  const cardRef = useRef(null);
  const headerRowRef = useRef(null);
  const gridRef = useRef(null);
  const cardsRef = useRef([]);
  const footerRef = useRef(null);

  const progress = useWizardProgress();

  // Fetch HTML catalog when switching to HTML tab
  useEffect(() => {
    if (activeCollection === 'html' && htmlTemplates.length === 0) {
      setLoadingHtml(true);
      fetch('/api/templates')
        .then(r => r.json())
        .then(j => setHtmlTemplates(j.templates || []))
        .catch(err => console.error('Failed to load HTML template catalog', err))
        .finally(() => setLoadingHtml(false));
    }
  }, [activeCollection, htmlTemplates.length]);

  const categories = useMemo(
    () => [...new Set(htmlTemplates.map(t => t.category))].sort(),
    [htmlTemplates]
  );

  const filteredHtml = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return htmlTemplates.filter(t =>
      (htmlCategory === 'all' || t.category === htmlCategory) &&
      (!q || t.name.toLowerCase().includes(q) || t.role.toLowerCase().includes(q) || (t.tags || []).some(x => x.toLowerCase().includes(q)))
    );
  }, [htmlTemplates, htmlCategory, searchQuery]);

  const handleSelect = (id, event) => {
    setSelectedLayout(id);
    updatePortfolio({ layout_id: id });
    const radio = event?.currentTarget?.querySelector('[data-radio]');
    if (radio) pulseSpot(radio);
  };

  const handleFinishBuild = () => {
    if (isBuilding) return;
    setIsBuilding(true);
    updatePortfolio({ layout_id: selectedLayout });
    setTimeout(() => {
      // Template-first: the portfolio isn't built yet — resume comes next
      if (!templateFirst) triggerPublishConfetti();
      onBuild();
    }, templateFirst ? 250 : 700);
  };

  // GSAP entrance animation
  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const elements = [
      spotlightRef.current,
      wizardHeaderRef.current,
      backRef.current,
      cardRef.current,
      headerRowRef.current,
      gridRef.current,
      footerRef.current,
      ...cardsRef.current
    ].filter(Boolean);

    const ctx = gsap.context(() => {
      if (reducedMotion) {
        gsap.set(elements, { opacity: 1, y: 0, scale: 1 });
        return;
      }

      gsap.set(spotlightRef.current, { opacity: 0 });
      gsap.set(wizardHeaderRef.current, { opacity: 0, y: -18 });
      if (backRef.current) gsap.set(backRef.current, { opacity: 0, x: -12 });
      gsap.set(cardRef.current, { opacity: 0, scale: 0.98 });
      gsap.set([headerRowRef.current, gridRef.current, footerRef.current], { opacity: 0 });
      gsap.set(cardsRef.current, { opacity: 0, y: 12 });

      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
      tl.to(spotlightRef.current, { opacity: 1, duration: 0.4 }, 0.2)
        .to(wizardHeaderRef.current, { opacity: 1, y: 0, duration: 0.3 }, 0.1)
        .to(backRef.current, { opacity: 1, x: 0, duration: 0.3 }, 0.45)
        .to(cardRef.current, { opacity: 1, scale: 1, duration: 0.4 }, 0.3)
        .to(headerRowRef.current, { opacity: 1, duration: 0.35 }, 0.5)
        .to(gridRef.current, { opacity: 1, duration: 0.3 }, 0.65)
        .to(cardsRef.current, { opacity: 1, y: 0, duration: 0.35, stagger: 0.06 }, 0.6)
        .to(footerRef.current, { opacity: 1, duration: 0.3 }, 0.95);
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen w-full overflow-hidden flex flex-col items-center justify-center p-4 py-10 font-outfit"
      style={{ backgroundColor: INK, color: PAPER }}
    >
      <StageKeyframes />
      <CinematicStage spotlightRef={spotlightRef} dustCanvasRef={dustCanvasRef} />

      {/* Back navigation */}
      {onBack && (
        <div ref={backRef} className="relative z-10 w-full max-w-7xl mb-3">
          <StageBackButton label={backLabel} onClick={onBack} />
        </div>
      )}

      <WizardStepHeader headerRef={wizardHeaderRef} />

      {/* Main glass panel */}
      <div
        ref={cardRef}
        className="relative z-10 w-full max-w-7xl rounded-2xl p-6 md:p-8 space-y-6"
        style={{
          background: 'rgba(20, 20, 26, 0.45)',
          backdropFilter: 'blur(24px) saturate(140%)',
          WebkitBackdropFilter: 'blur(24px) saturate(140%)',
          border: '1px solid rgba(255, 255, 255, 0.10)',
          boxShadow: '0 25px 70px rgba(0, 0, 0, 0.85)'
        }}
      >
        {/* Header row */}
        <div ref={headerRowRef} className="flex items-center justify-between gap-4">
          <div>
            <span
              className="text-[10px] font-bold uppercase tracking-widest block mb-1"
              style={{ color: SPOT_BLUE }}
            >
              Step {progress.number} of {progress.total}
            </span>
            <h1 className="font-syne text-xl sm:text-2xl font-bold tracking-tight" style={{ color: PAPER }}>
              {templateFirst ? 'Pick your design first' : 'Choose Your Portfolio Website Template'}
            </h1>
            <p className="text-xs mt-1" style={{ color: CHROME_MID }}>
              {templateFirst
                ? "Choose the look you want. Next you'll add your resume, and we'll fit it into this design."
                : 'Pick any theme — your resume data is injected automatically and the website is built in real-time.'}
            </p>
          </div>
          <div
            className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium shrink-0"
            style={{ color: CHROME_MID, border: '1px solid rgba(255,255,255,0.15)' }}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{THEMES.length} React + 229 HTML</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] gap-6 items-start">
        <div className="space-y-4 min-w-0">
        {/* Collection Tabs */}
        <div ref={gridRef} className="flex rounded-lg p-1 bg-black/40 border border-white/10">
          <button
            type="button"
            onClick={() => setActiveCollection('react')}
            className={`flex-1 py-2 text-xs font-semibold rounded-md flex items-center justify-center gap-2 transition-all ${
              activeCollection === 'react'
                ? 'bg-white/10 text-white shadow font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#7FA8E8]" />
            <span>Interactive Themes ({THEMES.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveCollection('html')}
            className={`flex-1 py-2 text-xs font-semibold rounded-md flex items-center justify-center gap-2 transition-all ${
              activeCollection === 'html'
                ? 'bg-white/10 text-white shadow font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-[#7FA8E8]" />
            <span>HTML Website Library (229)</span>
          </button>
        </div>

        {/* ───── TAB 1: React Themes ───── */}
        {activeCollection === 'react' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4 max-h-[560px] overflow-y-auto pr-1">
            {THEMES.map((tpl, idx) => {
              const IconComp = tpl.icon;
              const isSelected = selectedLayout === tpl.id;

              return (
                <div
                  key={tpl.id}
                  ref={(el) => { cardsRef.current[idx] = el; }}
                  onClick={(e) => handleSelect(tpl.id, e)}
                      onMouseMove={trackSpot}
                  className="spot-card p-5 rounded-xl cursor-pointer transition-all duration-200 relative overflow-hidden group flex flex-col justify-between space-y-4"
                  style={{
                    background: isSelected ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
                    border: isSelected ? `1px solid ${SPOT_BLUE}` : '1px solid rgba(255,255,255,0.10)',
                    boxShadow: isSelected ? '0 0 20px rgba(127,168,232,0.15)' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="p-2 rounded-lg flex items-center justify-center"
                          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
                        >
                          <IconComp className="w-5 h-5 text-white/80" strokeWidth={1.5} />
                        </div>
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide"
                          style={{ color: CHROME_MID, border: '1px solid rgba(255,255,255,0.15)', background: 'transparent' }}
                        >
                          {tpl.badge}
                        </span>
                      </div>

                      <div
                        data-radio
                        className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all duration-200"
                        style={{
                          border: isSelected ? `1.5px solid ${SPOT_BLUE}` : '1.5px solid rgba(255,255,255,0.25)',
                          background: isSelected ? SPOT_BLUE : 'transparent'
                        }}
                      >
                        {isSelected && <Check className="w-3 h-3" style={{ color: INK }} strokeWidth={3} />}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-syne text-base font-bold tracking-tight" style={{ color: PAPER }}>
                        {tpl.name}
                      </h3>
                      <p className="text-xs font-medium mt-0.5" style={{ color: CHROME_MID }}>{tpl.subtitle}</p>
                    </div>

                    <p className="text-xs leading-relaxed font-light line-clamp-2" style={{ color: CHROME_MID }}>
                      {tpl.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ───── TAB 2: HTML Website Library ───── */}
        {activeCollection === 'html' && (
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search 229 websites (cyberpunk, developer, minimal, dark)..."
                className="w-full pl-9 pr-3 py-2.5 rounded-lg text-xs bg-black/40 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-[#7FA8E8]"
              />
            </div>

            {/* Category chips */}
            <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto pr-1">
              <button
                onClick={() => setHtmlCategory('all')}
                className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide transition-all ${
                  htmlCategory === 'all'
                    ? 'bg-[#7FA8E8] text-[#06060A] font-bold'
                    : 'bg-white/5 text-slate-400 border border-white/10 hover:text-white'
                }`}
              >
                All ({htmlTemplates.length})
              </button>
              {categories.map(c => (
                <button
                  key={c}
                  onClick={() => setHtmlCategory(c)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide transition-all ${
                    htmlCategory === c
                      ? 'bg-[#7FA8E8] text-[#06060A] font-bold'
                      : 'bg-white/5 text-slate-400 border border-white/10 hover:text-white'
                  }`}
                >
                  {CATEGORY_LABELS[c] || c}
                </button>
              ))}
            </div>

            {/* Loading */}
            {loadingHtml ? (
              <div className="py-12 flex flex-col items-center gap-3 text-slate-400 text-xs">
                <Loader2 className="w-5 h-5 animate-spin text-[#7FA8E8]" />
                <span>Loading 229 website templates…</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-1">
                {filteredHtml.map((tpl) => {
                  const isSelected = selectedLayout === tpl.id;

                  return (
                    <div
                      key={tpl.id}
                      onClick={(e) => handleSelect(tpl.id, e)}
                      onMouseMove={trackSpot}
                      className="spot-card p-4 rounded-xl transition-all duration-200 cursor-pointer relative overflow-hidden group space-y-2"
                      style={{
                        background: isSelected ? 'rgba(127,168,232,0.06)' : 'rgba(255,255,255,0.02)',
                        border: isSelected ? `1.5px solid ${SPOT_BLUE}` : '1px solid rgba(255,255,255,0.10)',
                        boxShadow: isSelected ? '0 0 24px rgba(127,168,232,0.18)' : 'none'
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-syne text-sm font-bold text-white">{tpl.name}</h4>
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-medium uppercase tracking-wide text-slate-400 border border-white/10">
                              {CATEGORY_LABELS[tpl.category] || tpl.category}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#7FA8E8] mt-0.5">{tpl.role} · {tpl.theme}</p>
                        </div>
                        <div
                          data-radio
                          className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all duration-200 mt-0.5"
                          style={{
                            border: isSelected ? `1.5px solid ${SPOT_BLUE}` : '1.5px solid rgba(255,255,255,0.25)',
                            background: isSelected ? SPOT_BLUE : 'transparent'
                          }}
                        >
                          {isSelected && <Check className="w-3 h-3 text-[#06060A]" strokeWidth={3} />}
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{tpl.description}</p>
                    </div>
                  );
                })}

                {filteredHtml.length === 0 && !loadingHtml && (
                  <p className="text-xs text-center py-8 text-slate-500 col-span-2">
                    No website templates match "{searchQuery}".
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        </div>

        {/* Live preview of the selected design, rendered with the user's data */}
        <div className="lg:sticky lg:top-4">
          <PortfolioPreviewFrame
            layoutId={selectedLayout}
            portfolio={portfolio}
            height={560}
            caption={templateFirst ? 'shown with sample details until you add your resume' : 'with your details'}
          />
        </div>
        </div>

        {/* Build action footer */}
        <div ref={footerRef} className="pt-4 flex items-center justify-between gap-4" style={{ borderTop: '1px solid rgba(255,255,255,0.10)' }}>
          <div className="text-xs hidden sm:block" style={{ color: CHROME_MID }}>
            {selectedLayout
              ? <>Selected: <span className="text-white font-semibold">{selectedLayout}</span></>
              : 'Select any template above — you can switch anytime in the editor.'}
          </div>
          <button
            onClick={handleFinishBuild}
            disabled={isBuilding || !selectedLayout}
            className="btn-shine w-full sm:w-auto px-8 py-3.5 rounded-[3px] font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.99] disabled:cursor-not-allowed whitespace-nowrap"
            style={isBuilding
              ? { backgroundColor: '#E4E4E9', color: INK, transform: 'scaleX(0.97)' }
              : { backgroundColor: PAPER, color: INK, border: '1px solid rgba(255,255,255,0.2)' }}
          >
            {isBuilding ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-[#06060A] border-t-transparent rounded-full animate-spin" />
                <span>{templateFirst ? 'Saving…' : 'Building…'}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>{templateFirst ? 'Continue: add your resume' : 'Build Portfolio Website'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>

      <p className="relative z-10 mt-6 text-[11px] tracking-wide" style={{ color: CHROME_MID }}>
        Step {progress.number} of {progress.total} — {progress.label}
      </p>
    </div>
  );
};
