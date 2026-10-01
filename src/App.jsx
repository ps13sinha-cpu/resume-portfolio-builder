import React, { useState, useEffect } from 'react';
import { PortfolioProvider, usePortfolio } from './context/PortfolioContext';
import { Navbar } from './components/Navbar';
import { SplitLayout } from './components/SplitLayout';
import { CustomCursor } from './components/CustomCursor';
import { AIModal } from './components/AIModal';
import { ATSModal } from './components/ATSModal';
import { ShareModal } from './components/ShareModal';
import { ResumeImportModal } from './components/ResumeImportModal';
import { AuthScreen } from './components/AuthScreen';
import { ResumeImportScreen } from './components/ResumeImportScreen';
import { TemplateSelectScreen } from './components/TemplateSelectScreen';
import { PathChoiceScreen, ResumeModeScreen } from './components/PathChoiceScreen';
import { ResumeOptimizerScreen } from './components/ResumeOptimizerScreen';
import { TailoredIntakeScreen } from './components/TailoredIntakeScreen';
import { ResumeOutputScreen } from './components/ResumeOutputScreen';
import { TemplateFitScreen } from './components/TemplateFitScreen';
import { ChatAssistant } from './components/ChatAssistant';

import { renderTheme } from './templates/registry';
import { WizardStepHeader } from './components/CinematicStage';

const PublicViewer = ({ slug }) => {
  const [portfolioData, setPortfolioData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPublicPortfolio();
  }, [slug]);

  const fetchPublicPortfolio = async () => {
    try {
      const res = await fetch(`/api/public/${encodeURIComponent(slug)}`);
      if (res.ok) {
        const data = await res.json();
        setPortfolioData(data);
      } else {
        const errData = await res.json();
        setError(errData.error?.message || 'Portfolio not found or private.');
      }
    } catch (err) {
      setError('Unable to load public portfolio at this moment.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080a11] flex items-center justify-center text-slate-300">
        <div className="space-y-3 text-center">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mx-auto" />
          <p className="font-syne text-sm">Loading portfolio...</p>
        </div>
      </div>
    );
  }

  if (error || !portfolioData) {
    return (
      <div className="min-h-screen bg-[#080a11] flex items-center justify-center p-6 text-center font-outfit">
        <div className="max-w-md p-8 glass-panel rounded-2xl border border-slate-800 space-y-4">
          <h2 className="font-syne text-2xl font-bold text-rose-400">404 — Portfolio Private or Not Found</h2>
          <p className="text-sm text-slate-400">{error || 'This portfolio is private or does not exist.'}</p>
          <a href="/" className="inline-block px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs">
            Return to Builder Home
          </a>
        </div>
      </div>
    );
  }

  // Theme rendering comes from the shared registry — one source of truth
  // for every consumer (viewer, live preview, pickers).
  return renderTheme(portfolioData.layout_id, portfolioData);
};


const MainAppContent = () => {
  const { onboardingStep, setOnboardingStep, entryPath } = usePortfolio();
  const galleryFirst = entryPath === 'gallery_first';
  const resumePath = entryPath === 'tailored' || entryPath === 'optimize';
  const [hashSlug, setHashSlug] = useState('');

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#p/')) {
        setHashSlug(hash.replace('#p/', ''));
      } else {
        setHashSlug('');
      }
    };
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (hashSlug) {
    return <PublicViewer slug={hashSlug} />;
  }

  // Step 1: Login / Sign Up
  if (onboardingStep === 'auth') {
    return <AuthScreen onComplete={() => setOnboardingStep('path_choice')} />;
  }

  // Step 2: the fork.
  //   tailored      → resume builder: details + job description → resume
  //                   (optional: → website template → workspace)
  //   gallery_first → website generator: template → resume → workspace
  if (onboardingStep === 'path_choice') {
    return (
      <PathChoiceScreen
        onChoose={(path) => setOnboardingStep(path === 'tailored' ? 'resume_mode' : 'template_picker')}
        onBack={() => setOnboardingStep('auth')}
      />
    );
  }

  // Resume builder: create a new resume, or optimize an existing one
  if (onboardingStep === 'resume_mode') {
    return (
      <ResumeModeScreen
        onChoose={(mode) => setOnboardingStep(mode === 'optimize' ? 'resume_optimizer' : 'tailored_intake')}
        onBack={() => setOnboardingStep('path_choice')}
      />
    );
  }

  // Optimizer: existing resume + job description → keyword-optimized resume
  if (onboardingStep === 'resume_optimizer') {
    return (
      <div className="min-h-screen bg-[#06060A]">
        <ResumeOptimizerScreen
          onNext={() => setOnboardingStep('resume_output')}
          onBack={() => setOnboardingStep('resume_mode')}
        />
      </div>
    );
  }

  // Path A: structured details + job description
  if (onboardingStep === 'tailored_intake') {
    return (
      <div className="min-h-screen bg-[#06060A]">
        <TailoredIntakeScreen
          onNext={() => setOnboardingStep('resume_output')}
          onBack={() => setOnboardingStep('resume_mode')}
        />
      </div>
    );
  }

  // Path A result: the tailored resume, downloadable as PDF
  if (onboardingStep === 'resume_output') {
    return (
      <div className="min-h-screen bg-[#06060A]">
        <ResumeOutputScreen
          onEdit={() => setOnboardingStep(entryPath === 'optimize' ? 'resume_optimizer' : 'tailored_intake')}
          editLabel={entryPath === 'optimize' ? 'Back to optimizer' : 'Edit details'}
          onBuildWebsite={() => setOnboardingStep('template_picker')}
        />
        <ChatAssistant />
      </div>
    );
  }

  // Resume Import / Upload / Preset (Path B's content step; also the
  // legacy flow for sessions that predate the fork)
  if (onboardingStep === 'resume_import') {
    return (
      <div className="min-h-screen bg-[#06060A]">
        <ResumeImportScreen
          onNext={() => setOnboardingStep(galleryFirst ? 'template_fit' : 'template_picker')}
          onBack={() => setOnboardingStep(galleryFirst ? 'template_picker' : 'path_choice')}
          backLabel={galleryFirst ? 'Back to Templates' : 'Change path'}
        />
      </div>
    );
  }

  // Template Selector
  if (onboardingStep === 'template_picker') {
    return (
      <div className="min-h-screen bg-[#06060A]">
        <TemplateSelectScreen
          templateFirst={galleryFirst}
          onBuild={() => setOnboardingStep(galleryFirst ? 'resume_import' : 'template_fit')}
          onBack={() => setOnboardingStep(
            resumePath ? 'resume_output' : galleryFirst ? 'path_choice' : 'resume_import'
          )}
          backLabel={resumePath ? 'Back to Resume' : galleryFirst ? 'Change path' : 'Back to Resume'}
        />
      </div>
    );
  }

  // AI fit layer: adapt the user's data to the chosen design, reviewed
  // against a live preview, before the website is built
  if (onboardingStep === 'template_fit') {
    return (
      <div className="min-h-screen bg-[#06060A]">
        <TemplateFitScreen
          onNext={() => setOnboardingStep('workspace')}
          onBack={() => setOnboardingStep(galleryFirst ? 'resume_import' : 'template_picker')}
        />
      </div>
    );
  }

  // Step 4: Interactive Portfolio Workspace — fixed-viewport shell:
  // top bars take their natural height, SplitLayout consumes the rest and
  // each column scrolls independently (fixes the dead-space below preview
  // content and the truncating tab bar).
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#06060A] text-slate-100">
      <CustomCursor enabled={true} />
      <div className="pt-3 pb-2 flex justify-center items-center gap-4 px-4 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <WizardStepHeader onStepNavigate={(stepId) => setOnboardingStep(stepId)} />
      </div>
      <Navbar />
      <SplitLayout />
      <AIModal />
      <ATSModal />
      <ShareModal />
      <ResumeImportModal />
      {/* sits above the mobile bottom tab bar */}
      <ChatAssistant bottomOffsetClass="bottom-20 lg:bottom-6" />
    </div>
  );
};

// Every onboarding screen change plays the shared entrance (rise + unblur);
// keying on the step remounts the wrapper so the animation replays.
const AnimatedSteps = () => {
  const { onboardingStep } = usePortfolio();
  return (
    <div key={onboardingStep} className="step-enter">
      <MainAppContent />
    </div>
  );
};

export default function App() {
  return (
    <PortfolioProvider>
      <AnimatedSteps />
    </PortfolioProvider>
  );
}
