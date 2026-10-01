import React, { useState, useEffect, useMemo } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { 
  Palette, 
  Check, 
  Globe, 
  Sparkles, 
  Search, 
  FileUp, 
  ExternalLink, 
  LayoutGrid, 
  Loader2, 
  ArrowRight,
  Zap,
  Layers
} from 'lucide-react';
import { THEMES } from '../templates/registry';
import { pulseSpot, SPOT_BLUE, CHROME_MID, PAPER, INK } from '../components/CinematicStage';

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

export const LayoutPicker = () => {
  const { 
    portfolio, 
    updatePortfolio, 
    triggerPublishConfetti, 
    setIsResumeModalOpen 
  } = usePortfolio();

  const [activeCollection, setActiveCollection] = useState('react'); // 'react' | 'html'
  const [htmlTemplates, setHtmlTemplates] = useState([]);
  const [loadingHtml, setLoadingHtml] = useState(false);
  const [htmlCategory, setHtmlCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [buildingId, setBuildingId] = useState(null);

  // Fetch HTML catalog when opening HTML tab
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

  const handleSelectTemplate = async (templateId, templateName, e) => {
    if (buildingId) return;
    setBuildingId(templateId);
    
    // Animate radio spot if clicked on element
    const radio = e?.currentTarget?.querySelector('[data-radio]');
    if (radio) pulseSpot(radio);

    // Update portfolio layout to this template
    await updatePortfolio({ layout_id: templateId });
    triggerPublishConfetti();

    setTimeout(() => {
      setBuildingId(null);
    }, 600);
  };

  const currentLayoutId = portfolio.layout_id || 'awwwards';
  const profileName = portfolio.profile?.fullName || 'Your Name';
  const profileTitle = portfolio.profile?.title || 'Professional';
  const skillsCount = portfolio.skills?.length || 0;
  const projectsCount = portfolio.projects?.length || 0;
  const experienceCount = portfolio.experience?.length || 0;

  return (
    <div className="space-y-6 animate-fade-in font-outfit">
      
      {/* Title & Description */}
      <div>
        <h3 className="font-syne text-lg font-bold text-[#F5F5F7] flex items-center gap-2">
          <Palette className="w-5 h-5 text-[#7FA8E8]" />
          <span>Templates & Layouts</span>
        </h3>
        <p className="text-xs text-[#6B7280] mt-0.5">
          Select any template below — your extracted resume data is automatically injected and the website is built in real-time.
        </p>
      </div>

      {/* Extracted Resume Data Summary Banner */}
      <div 
        className="p-3.5 rounded-xl space-y-2.5 transition-all"
        style={{
          background: 'linear-gradient(135deg, rgba(127,168,232,0.08) 0%, rgba(20,20,26,0.6) 100%)',
          border: '1px solid rgba(127,168,232,0.25)'
        }}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#7FA8E8] animate-pulse" />
            <span className="text-[11px] font-bold text-white uppercase tracking-wider">
              Resume Data Injected
            </span>
          </div>
          <button
            onClick={() => setIsResumeModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-semibold text-[#7FA8E8] hover:text-white bg-[#7FA8E8]/10 hover:bg-[#7FA8E8]/20 border border-[#7FA8E8]/30 transition-all active:scale-95"
          >
            <FileUp className="w-3 h-3" />
            <span>Import / Replace Resume</span>
          </button>
        </div>

        <div className="text-xs text-slate-300">
          <span className="font-semibold text-white">{profileName}</span>
          <span className="text-slate-400"> · {profileTitle}</span>
        </div>

        <div className="flex flex-wrap gap-2 text-[10px] text-slate-400">
          <span className="px-2 py-0.5 rounded bg-black/40 border border-white/5">
            {skillsCount} Skills
          </span>
          <span className="px-2 py-0.5 rounded bg-black/40 border border-white/5">
            {experienceCount} Roles
          </span>
          <span className="px-2 py-0.5 rounded bg-black/40 border border-white/5">
            {projectsCount} Projects
          </span>
        </div>
      </div>

      {/* Collection Switcher Tabs */}
      <div className="flex rounded-lg p-1 bg-black/40 border border-white/10">
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

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: CURATED REACT THEMES                                    */}
      {/* ------------------------------------------------------------- */}
      {activeCollection === 'react' && (
        <div className="space-y-3.5">
          {THEMES.map((theme) => {
            const isActive = currentLayoutId === theme.id;
            const isThisBuilding = buildingId === theme.id;
            const IconComp = theme.icon;

            return (
              <div
                key={theme.id}
                onClick={(e) => handleSelectTemplate(theme.id, theme.name, e)}
                data-cursor="Select Theme"
                className="p-4 rounded-xl transition-all duration-200 cursor-pointer relative overflow-hidden group space-y-3"
                style={{
                  background: isActive ? 'rgba(127,168,232,0.06)' : 'rgba(255,255,255,0.02)',
                  border: isActive ? `1.5px solid ${SPOT_BLUE}` : '1px solid rgba(255,255,255,0.10)',
                  boxShadow: isActive ? '0 0 24px rgba(127,168,232,0.18)' : 'none'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className="p-2.5 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                      <IconComp className="w-4 h-4 text-white/90" strokeWidth={1.75} />
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-syne text-sm font-bold text-[#F5F5F7]">{theme.name}</h4>
                        <span
                          className="px-2 py-0.5 rounded-full text-[9px] font-medium uppercase tracking-wide"
                          style={{ color: CHROME_MID, border: '1px solid rgba(255,255,255,0.15)' }}
                        >
                          {theme.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#7FA8E8] font-medium">{theme.subtitle}</p>
                    </div>
                  </div>

                  {/* Radio Indicator */}
                  <div
                    data-radio
                    className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all duration-200 mt-0.5"
                    style={{
                      border: isActive ? `1.5px solid ${SPOT_BLUE}` : '1.5px solid rgba(255,255,255,0.25)',
                      background: isActive ? SPOT_BLUE : 'transparent'
                    }}
                  >
                    {isActive && <Check className="w-3 h-3 text-[#06060A]" strokeWidth={3} />}
                  </div>
                </div>

                <p className="text-xs text-[#6B7280] leading-relaxed line-clamp-2">
                  {theme.description}
                </p>

                {/* Build Action / Status */}
                <div 
                  className="pt-2.5 flex items-center justify-between text-xs"
                  style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
                >
                  {isActive ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7FA8E8]">
                      <span className="w-2 h-2 rounded-full bg-[#7FA8E8]" />
                      <span>Built & Active in Live Preview</span>
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400 group-hover:text-white transition-colors">
                      Click to build website on this template
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectTemplate(theme.id, theme.name, e);
                    }}
                    disabled={isThisBuilding}
                    className="px-3 py-1.5 rounded-[3px] text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5"
                    style={isActive 
                      ? { background: 'rgba(127,168,232,0.15)', color: SPOT_BLUE, border: `1px solid ${SPOT_BLUE}` }
                      : { background: '#F5F5F7', color: '#06060A' }
                    }
                  >
                    {isThisBuilding ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Building…</span>
                      </>
                    ) : isActive ? (
                      <>
                        <Check className="w-3 h-3" />
                        <span>Selected</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-3 h-3" />
                        <span>Build Website</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: HTML MULTI-PAGE SHOWCASE LIBRARY (229 SITES)           */}
      {/* ------------------------------------------------------------- */}
      {activeCollection === 'html' && (
        <div className="space-y-4">
          {/* Search bar */}
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

          {/* Category Filter Chips */}
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
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

          {/* Loading state */}
          {loadingHtml ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400 text-xs">
              <Loader2 className="w-5 h-5 animate-spin text-[#7FA8E8]" />
              <span>Loading 229 website templates…</span>
            </div>
          ) : (
            <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
              {filteredHtml.map((tpl) => {
                const isActive = currentLayoutId === tpl.id;
                const isThisBuilding = buildingId === tpl.id;

                return (
                  <div
                    key={tpl.id}
                    onClick={(e) => handleSelectTemplate(tpl.id, tpl.name, e)}
                    className="p-4 rounded-xl transition-all duration-200 cursor-pointer relative overflow-hidden group space-y-3"
                    style={{
                      background: isActive ? 'rgba(127,168,232,0.06)' : 'rgba(255,255,255,0.02)',
                      border: isActive ? `1.5px solid ${SPOT_BLUE}` : '1px solid rgba(255,255,255,0.10)',
                      boxShadow: isActive ? '0 0 24px rgba(127,168,232,0.18)' : 'none'
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
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
                          border: isActive ? `1.5px solid ${SPOT_BLUE}` : '1.5px solid rgba(255,255,255,0.25)',
                          background: isActive ? SPOT_BLUE : 'transparent'
                        }}
                      >
                        {isActive && <Check className="w-3 h-3 text-[#06060A]" strokeWidth={3} />}
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {tpl.description}
                    </p>

                    {/* Build Action */}
                    <div 
                      className="pt-2.5 flex items-center justify-between text-xs"
                      style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
                    >
                      {isActive ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7FA8E8]">
                          <span className="w-2 h-2 rounded-full bg-[#7FA8E8]" />
                          <span>Built & Active in Live Preview</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 group-hover:text-white transition-colors">
                          Click to build on this website
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectTemplate(tpl.id, tpl.name, e);
                        }}
                        disabled={isThisBuilding}
                        className="px-3 py-1.5 rounded-[3px] text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5"
                        style={isActive 
                          ? { background: 'rgba(127,168,232,0.15)', color: SPOT_BLUE, border: `1px solid ${SPOT_BLUE}` }
                          : { background: '#F5F5F7', color: '#06060A' }
                        }
                      >
                        {isThisBuilding ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>Building…</span>
                          </>
                        ) : isActive ? (
                          <>
                            <Check className="w-3 h-3" />
                            <span>Selected</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-3 h-3" />
                            <span>Build Website</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}

              {filteredHtml.length === 0 && (
                <p className="text-xs text-center py-8 text-slate-500">
                  No website templates match "{searchQuery}".
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
