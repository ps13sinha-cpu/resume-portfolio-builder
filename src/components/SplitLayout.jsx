import React, { useEffect } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import {
  User,
  Briefcase,
  GraduationCap,
  Sparkles,
  FolderGit2,
  Award,
  Palette,
  Layers,
  Globe,
  ShieldCheck,
  X,
  Eye,
  EyeOff,
  XCircle,
  LayoutGrid,
  Newspaper,
  FileText,
  Waves,
  Moon,
  Zap,
  Terminal,
  BookOpen,
  Star
} from 'lucide-react';

import { ProfileEditor } from '../editor/ProfileEditor';
import { ExperienceEditor } from '../editor/ExperienceEditor';
import { EducationEditor } from '../editor/EducationEditor';
import { SkillsEditor } from '../editor/SkillsEditor';
import { ProjectsEditor } from '../editor/ProjectsEditor';
import { CertificationsEditor } from '../editor/CertificationsEditor';
import { LayoutPicker } from '../editor/LayoutPicker';
import { ReorderSection } from '../editor/ReorderSection';
import { HtmlTemplateBrowser } from './HtmlTemplateBrowser';
import { FitReportScreen } from './FitReportScreen';
import { AdminTemplateReview } from './AdminTemplateReview';

import { THEMES, renderTheme, getTheme } from '../templates/registry';
import { SPOT_BLUE } from './CinematicStage';
import { PortfolioPreviewFrame } from './PortfolioPreviewFrame';
import { AnimatedBackdrop } from './AnimatedBackdrop';

const NAV_TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'experience', label: 'Experience', icon: Briefcase },
  { id: 'education', label: 'Education', icon: GraduationCap },
  { id: 'skills', label: 'Skills', icon: Sparkles },
  { id: 'projects', label: 'Projects', icon: FolderGit2 },
  { id: 'certifications', label: 'Certifications', icon: Award },
  { id: 'themes', label: 'Themes', icon: Palette },
  { id: 'htmlsites', label: 'HTML Websites', icon: Globe },
  { id: 'review', label: 'Template Review', icon: ShieldCheck },
  { id: 'reorder', label: 'Reorder Sections', icon: Layers }
];

export const SplitLayout = () => {
  const {
    portfolio,
    activeTab,
    setActiveTab,
    isMobilePreviewOpen,
    setIsMobilePreviewOpen,
    isPreviewFullscreen,
    setIsPreviewFullscreen
  } = usePortfolio();

  // Esc exits full-screen preview
  useEffect(() => {
    if (!isPreviewFullscreen) return;
    const onKey = (e) => { if (e.key === 'Escape') setIsPreviewFullscreen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isPreviewFullscreen, setIsPreviewFullscreen]);

  const renderLiveTemplate = () => renderTheme(portfolio.layout_id, portfolio);

  const renderEditorForm = () => {
    switch (activeTab) {
      case 'experience': return <ExperienceEditor />;
      case 'education': return <EducationEditor />;
      case 'skills': return <SkillsEditor />;
      case 'projects': return <ProjectsEditor />;
      case 'certifications': return <CertificationsEditor />;
      case 'themes': return <LayoutPicker />;
      case 'htmlsites': return <HtmlTemplateBrowser />;
      case 'review': return <AdminTemplateReview />;
      case 'reorder': return <ReorderSection />;
      case 'profile':
      default: return <ProfileEditor />;
    }
  };

  // -------------------------------------------------------------------
  // FULL-SCREEN PREVIEW — position:fixed inset:0 over everything,
  // renders the theme at real 100% scale with an exit affordance.
  // -------------------------------------------------------------------
  if (isPreviewFullscreen) {
    return (
      <div
        className="fixed inset-0 z-[60] overflow-y-auto"
        style={{ backgroundColor: '#06060A' }}
        id="portfolio-fullscreen-preview"
      >
        <button
          onClick={() => setIsPreviewFullscreen(false)}
          className="fixed top-4 right-4 z-[70] flex items-center gap-2 px-4 py-2.5 rounded-[3px] text-xs font-bold uppercase tracking-wider transition-all active:scale-95"
          style={{ backgroundColor: '#F5F5F7', color: '#06060A' }}
          title="Exit full preview (Esc)"
        >
          <XCircle className="w-4 h-4" />
          <span>Exit Preview</span>
        </button>
        {renderLiveTemplate()}
      </div>
    );
  }

  const publicUrl = `${window.location.origin}/#p/${portfolio.slug || 'piyush-dev'}`;

  return (
    <div className="relative flex-1 flex min-h-0 overflow-hidden">
      {/* Calm animated backdrop for the workspace: aurora + drifting dots
          (no floating pages, they'd distract while editing). The side panels
          are slightly translucent so it glows faintly through. */}
      <AnimatedBackdrop docs={0} floor={false} dots intensity={0.75} />

      {/* ----------------------------------------------------------- */}
      {/* ICON RAIL — vertical section nav, 64px, never truncates      */}
      {/* ----------------------------------------------------------- */}
      <nav
        aria-label="Builder sections"
        className="relative hidden lg:flex flex-col items-center gap-1 py-3 shrink-0 overflow-y-auto scrollbar-none"
        style={{
          width: '64px',
          backgroundColor: 'rgba(10,10,13,0.82)',
          backdropFilter: 'blur(12px)',
          borderRight: '1px solid rgba(255,255,255,0.06)'
        }}
      >
        {NAV_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              data-cursor={tab.label}
              title={tab.label}
              className="relative w-11 h-11 rounded-lg flex items-center justify-center transition-all duration-200 group"
              style={{
                backgroundColor: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                color: isActive ? '#F5F5F7' : '#6B7280'
              }}
              onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; }}
              onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              {isActive && (
                <span
                  className="absolute left-0 top-2 bottom-2 w-[2px] rounded-full"
                  style={{ backgroundColor: SPOT_BLUE }}
                />
              )}
              <Icon className="w-[18px] h-[18px]" strokeWidth={isActive ? 2 : 1.5} />
              {/* tooltip */}
              <span
                className="absolute left-full ml-2 px-2 py-1 rounded text-[10px] font-medium whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50"
                style={{
                  backgroundColor: '#1A1A20',
                  color: '#F5F5F7',
                  border: '1px solid rgba(255,255,255,0.12)'
                }}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* ----------------------------------------------------------- */}
      {/* FORM PANEL — fixed width, independent scroll                 */}
      {/* ----------------------------------------------------------- */}
      <div
        className={`relative w-full lg:w-[400px] shrink-0 overflow-y-auto ${isMobilePreviewOpen ? 'hidden lg:block' : 'block'}`}
        style={{
          backgroundColor: 'rgba(14,14,18,0.84)',
          backdropFilter: 'blur(14px)',
          borderRight: '1px solid rgba(255,255,255,0.06)'
        }}
      >
        <div key={activeTab} className="rise-in p-5 lg:p-6">
          {renderEditorForm()}
        </div>
      </div>

      {/* ----------------------------------------------------------- */}
      {/* PREVIEW PANEL — flex:1, independently scrollable, scaled     */}
      {/* ----------------------------------------------------------- */}
      <div
        className={`flex-1 min-w-0 relative overflow-hidden ${isMobilePreviewOpen ? 'block' : 'hidden lg:block'}`}
      >
        {/* The user's portfolio website, live: browser-style frame with the
            public address, desktop/mobile view, full screen, and a link that
            opens the real site in a new tab. */}
        <div className="relative h-full p-4">
          <PortfolioPreviewFrame
            fill
            layoutId={portfolio.layout_id}
            portfolio={portfolio}
            url={publicUrl}
            caption={portfolio.is_public === false ? 'private — publish via Share to make this link work' : undefined}
            contentId="portfolio-live-preview"
          />
        </div>
      </div>

      {/* ----------------------------------------------------------- */}
      {/* MOBILE (< lg): bottom tab bar + form/preview toggle          */}
      {/* ----------------------------------------------------------- */}
      <div
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center gap-1 px-2 py-1.5 overflow-x-auto scrollbar-none"
        style={{ backgroundColor: '#0A0A0D', borderTop: '1px solid rgba(255,255,255,0.08)' }}
      >
        {NAV_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-md text-[9px] font-medium shrink-0 transition-colors"
              style={{
                color: isActive ? '#F5F5F7' : '#6B7280',
                backgroundColor: isActive ? 'rgba(255,255,255,0.08)' : 'transparent'
              }}
            >
              <Icon className="w-4 h-4" strokeWidth={isActive ? 2 : 1.5} />
              <span>{tab.label.split(' ')[0]}</span>
            </button>
          );
        })}
        <button
          onClick={() => setIsMobilePreviewOpen(!isMobilePreviewOpen)}
          className="flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-md text-[9px] font-medium shrink-0 ml-auto"
          style={{
            color: isMobilePreviewOpen ? '#06060A' : '#F5F5F7',
            backgroundColor: isMobilePreviewOpen ? SPOT_BLUE : 'rgba(255,255,255,0.08)'
          }}
        >
          {isMobilePreviewOpen ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          <span>Preview</span>
        </button>
      </div>

      {/* bottom padding so content clears the mobile bar */}
      <div className="lg:hidden h-14 shrink-0" />

      {/* Mobile fullscreen preview (kept for phones — renders theme unscaled) */}
      {isMobilePreviewOpen && (
        <div className="lg:hidden fixed inset-0 z-50 overflow-y-auto" style={{ backgroundColor: '#06060A' }}>
          <div className="fixed top-3 right-3 z-10 flex gap-2">
            <button
              onClick={() => setIsPreviewFullscreen(true)}
              className="px-3 py-2 rounded-[3px] text-[10px] font-bold uppercase tracking-wider"
              style={{ backgroundColor: '#F5F5F7', color: '#06060A' }}
            >
              100%
            </button>
            <button
              onClick={() => setIsMobilePreviewOpen(false)}
              className="p-2 rounded-[3px]"
              style={{ backgroundColor: '#1A1A20', color: '#F5F5F7', border: '1px solid rgba(255,255,255,0.15)' }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div id="portfolio-live-preview-mobile" className="min-h-full">
            {renderLiveTemplate()}
          </div>
        </div>
      )}
    </div>
  );
};
