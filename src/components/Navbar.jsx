import React, { useState } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { 
  Sparkles, 
  BarChart3, 
  Share2, 
  FileDown, 
  Eye, 
  Check, 
  RefreshCw, 
  RotateCcw,
  Palette,
  Globe,
  Sliders
} from 'lucide-react';
import { exportToPDF } from '../utils/pdfExport';
import { THEMES } from '../templates/registry';
import { SPOT_BLUE } from './CinematicStage';

export const Navbar = () => {
  const { 
    portfolio, 
    updatePortfolio, 
    saveState, 
    resetToSample,
    setIsPreviewFullscreen,
    setIsAiModalOpen,
    setIsAtsModalOpen,
    setIsShareModalOpen
  } = usePortfolio();

  const [isExporting, setIsExporting] = useState(false);

  const handlePdfExport = async () => {
    setIsExporting(true);
    await exportToPDF('portfolio-live-preview', `${portfolio.profile.fullName.replace(/\s+/g, '_')}_Portfolio.pdf`);
    setIsExporting(false);
  };

  // layouts now come from the shared THEMES registry

  return (
    <header
      className="sticky top-0 z-40 w-full px-4 lg:px-8 py-3 transition-all"
      style={{
        background: 'rgba(11, 11, 16, 0.75)',
        backdropFilter: 'blur(24px) saturate(140%)',
        WebkitBackdropFilter: 'blur(24px) saturate(140%)',
        borderBottom: '1px solid rgba(255,255,255,0.10)'
      }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Brand & Auto-save Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div
              className="h-9 w-9 rounded-[4px] flex items-center justify-center"
              style={{ background: '#F5F5F7', border: '1px solid rgba(255,255,255,0.2)' }}
            >
              <Sparkles className="h-4.5 w-4.5" style={{ color: '#06060A' }} strokeWidth={2} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-syne text-lg font-bold tracking-wide text-[#F5F5F7]">Aura<span className="text-[#7FA8E8]">Portfolio</span></span>
                <span
                  className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded-full"
                  style={{ color: '#6B7280', border: '1px solid rgba(255,255,255,0.15)' }}
                >Awwwards Tier</span>
              </div>
              <p className="text-[11px] font-medium hidden md:block text-[#6B7280]">Interactive Resume Portfolio Builder</p>
            </div>
          </div>

          {/* Auto-save Status Badge — spot-blue when saved, no green */}
          <div
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ml-2"
            style={{ border: '1px solid rgba(255,255,255,0.12)', color: '#6B7280' }}
          >
            {saveState === 'saving' && (
              <>
                <RefreshCw className="h-3 w-3 animate-spin text-[#7FA8E8]" />
                <span>Autosaving...</span>
              </>
            )}
            {saveState === 'saved' && (
              <>
                <Check className="h-3 w-3 text-[#7FA8E8]" />
                <span>All changes saved</span>
              </>
            )}
            {saveState === 'error' && (
              <span className="text-rose-400">Saved locally</span>
            )}
          </div>
        </div>

        {/* Theme Quick Switcher — horizontal scroll container with fade edges,
            so adding themes never truncates or wraps the row */}
        <div
          className="hidden md:flex items-center p-1 rounded-lg border border-white/10 bg-white/[0.03] max-w-[340px] lg:max-w-[420px]"
          style={{
            maskImage: 'linear-gradient(to right, black 88%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to right, black 88%, transparent 100%)'
          }}
        >
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
            {THEMES.map(theme => {
              const isActive = portfolio.layout_id === theme.id;
              return (
                <button
                  key={theme.id}
                  onClick={() => updatePortfolio({ layout_id: theme.id })}
                  data-cursor="Switch Layout"
                  title={theme.name}
                  className={`px-2 py-1.5 text-xs font-medium transition-all rounded-[3px] flex items-center gap-1.5 shrink-0 ${
                    isActive
                      ? 'bg-[#F5F5F7] text-[#06060A] font-semibold'
                      : 'text-[#6B7280] hover:text-white'
                  }`}
                >
                  <theme.icon className="w-3.5 h-3.5" strokeWidth={1.75} />
                  <span className="hidden xl:inline">{theme.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          
          {/* AI Enhancer Drawer Toggle */}
          <button
            onClick={() => setIsAiModalOpen(true)}
            data-cursor="AI Rewrite"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] text-xs font-semibold transition-all"
            style={{
              color: SPOT_BLUE,
              border: `1px solid rgba(127,168,232,0.35)`,
              background: 'rgba(127,168,232,0.08)'
            }}
            title="AI Experience Bullet Enhancer"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">AI Bullet Enhancer</span>
          </button>

          {/* ATS Analyzer Toggle */}
          <button
            onClick={() => setIsAtsModalOpen(true)}
            data-cursor="ATS Score"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] text-xs font-semibold transition-all"
            style={{ color: '#6B7280', border: '1px solid rgba(255,255,255,0.15)' }}
            title="Check ATS Compatibility Score"
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">ATS Score</span>
          </button>

          {/* Share & Slug Settings — the one solid white CTA */}
          <button
            onClick={() => setIsShareModalOpen(true)}
            data-cursor="Share Link"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] text-xs font-bold uppercase tracking-wider transition-all active:scale-95"
            style={{ backgroundColor: '#F5F5F7', color: '#06060A' }}
          >
            <Globe className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Share</span>
          </button>

          {/* PDF Download */}
          <button
            onClick={handlePdfExport}
            disabled={isExporting}
            data-cursor="Download PDF"
            className="p-2 rounded-[3px] transition-all"
            style={{ color: '#6B7280', border: '1px solid rgba(255,255,255,0.15)' }}
            title="Export as High-Res PDF"
          >
            {isExporting ? <RefreshCw className="h-4 w-4 animate-spin text-[#7FA8E8]" /> : <FileDown className="h-4 w-4" />}
          </button>

          {/* Full-Screen Preview Toggle — expands preview over the whole viewport */}
          <button
            onClick={() => setIsPreviewFullscreen(true)}
            data-cursor="Full Preview"
            className="p-2 rounded-[3px] transition-all"
            style={{ color: '#6B7280', border: '1px solid rgba(255,255,255,0.15)' }}
            title="Full-screen preview (renders at 100% scale)"
          >
            <Eye className="h-4 w-4" />
          </button>

          {/* Sample Data Reset */}
          <button
            onClick={resetToSample}
            className="p-2 rounded-[3px] transition-all hidden xl:block"
            style={{ color: '#6B7280', border: '1px solid rgba(255,255,255,0.15)' }}
            title="Reset to Sample Portfolio"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>

      </div>
    </header>
  );
};
