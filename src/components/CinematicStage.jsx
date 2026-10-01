import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import {
  ArrowLeft,
  Check,
  User,
  FileText,
  Palette,
  Sparkles,
  GitFork,
  Target,
  Wand2
} from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';
import { AnimatedBackdrop } from './AnimatedBackdrop';

// Shared design tokens — must mirror the cinematic login page exactly.
export const SPOT_BLUE = '#7FA8E8';
export const CHROME_MID = '#6B7280';
export const INK = '#06060A';
export const PAPER = '#F5F5F7';

// Wizard steps, shared by every post-login screen that renders its own header.
// The flow forks after login, so the step order depends on the entry path:
//   tailored      — resume builder: details + job description → resume
//                   (a portfolio website from it is optional afterwards)
//   gallery_first — website generator: pick a design, then bring a resume
const STEP_DEFS = {
  auth: { id: 'auth', label: 'Login', icon: User },
  path_choice: { id: 'path_choice', label: 'Start', icon: GitFork },
  resume_mode: { id: 'resume_mode', label: 'Create / Optimize', icon: GitFork },
  tailored_intake: { id: 'tailored_intake', label: 'Details & Job', icon: Target },
  resume_optimizer: { id: 'resume_optimizer', label: 'Optimize', icon: Wand2 },
  resume_import: { id: 'resume_import', label: 'Resume', icon: FileText },
  resume_output: { id: 'resume_output', label: 'Your Resume', icon: FileText },
  template_picker: { id: 'template_picker', label: 'Template', icon: Palette },
  template_fit: { id: 'template_fit', label: 'AI Fit', icon: Wand2 },
  workspace: { id: 'workspace', label: 'Build & Edit', icon: Sparkles }
};

const STEP_ORDER = {
  tailored: ['auth', 'path_choice', 'resume_mode', 'tailored_intake', 'resume_output', 'template_picker', 'template_fit', 'workspace'],
  optimize: ['auth', 'path_choice', 'resume_mode', 'resume_optimizer', 'resume_output', 'template_picker', 'template_fit', 'workspace'],
  gallery_first: ['auth', 'path_choice', 'template_picker', 'resume_import', 'template_fit', 'workspace'],
  // Before a path is chosen (or for portfolios created before the fork)
  default: ['auth', 'path_choice', 'resume_import', 'template_picker', 'template_fit', 'workspace']
};

export const getWizardSteps = (entryPath) =>
  (STEP_ORDER[entryPath] || STEP_ORDER.default).map((id) => STEP_DEFS[id]);

export const WIZARD_STEPS = getWizardSteps();

// { number, total, label } of the current onboarding step for the chosen path.
export const useWizardProgress = () => {
  const { entryPath, onboardingStep } = usePortfolio();
  const steps = getWizardSteps(entryPath);
  const idx = steps.findIndex((s) => s.id === onboardingStep);
  return { number: idx + 1, total: steps.length, label: steps[idx]?.label || '' };
};

export const wizardTitles = {
  preset: 'Role Presets',
  paste: 'Paste Resume Text',
  upload: 'Upload PDF / JSON'
};

export const WIZARD_STEP_IDS = WIZARD_STEPS.map((s) => s.id);

/**
 * CinematicStage — the shared stage environment carried over from the
 * cinematic login page: dark stage gradient, small dim spotlight cone,
 * vignette, ambient dust canvas. Identical constants to the login page's
 * system (breathing 0.11→0.20 vs login's 0.18→0.32), kept dimmer and
 * static per the motion budget for dense functional pages.
 *
 * The outer spotlight div is exposed via spotlightRef so a GSAP entrance
 * timeline can fade it up without fighting the CSS breathing animation
 * (which lives on the inner div).
 */
export const CinematicStage = ({ spotlightRef, dustCanvasRef, breathe = true }) => {
  const localDustRef = useRef(null);
  const canvasRef = dustCanvasRef || localDustRef;

  // Ambient dust — same system and density as the login page's dust layer.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    if (window.innerWidth < 768) return;

    const dustParticles = [];
    for (let i = 0; i < 18; i++) {
      dustParticles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 1.2 + 0.4,
        opacity: Math.random() * 0.2 + 0.08,
        speedY: Math.random() * 0.15 + 0.04,
        speedX: (Math.random() - 0.5) * 0.06
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      dustParticles.forEach((p) => {
        p.y -= p.speedY;
        p.x += p.speedX;
        if (p.y < 0) {
          p.y = canvas.height;
          p.x = Math.random() * canvas.width;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
        ctx.fill();
      });
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animId);
    };
  }, [canvasRef]);

  return (
    <>
      {/* Z-0: BACKGROUND — dark stage + spotlight cone + vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 55%, #0c0e18 0%, #06060A 50%, #000000 100%)' }}
      />

      {/* Animated backdrop — the login page's aurora, stage floor and floating
          pages, dimmer and sparser for these content-heavy screens, and pinned
          to the viewport so it stays put while long pages scroll. */}
      <AnimatedBackdrop fixed docs={10} mobileDocs={5} intensity={0.6} />

      {/* Spotlight cone — smaller and dimmer than login, top-center.
          Outer div is faded by GSAP; inner div carries the breathing
          animation so keyframes don't override the entrance fade. */}
      <div
        ref={spotlightRef}
        className="absolute pointer-events-none"
        style={{
          top: '-4vh',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '560px',
          height: '78vh'
        }}
      >
        <div
          className="w-full h-full"
          style={{
            clipPath: 'polygon(50% 0%, 18% 100%, 82% 100%)',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(127,168,232,0.10) 40%, transparent 100%)',
            animation: breathe ? 'stageSpotlightBreathing 4.5s ease-in-out infinite' : 'none'
          }}
        />
      </div>

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ boxShadow: 'inset 0 0 280px 100px #000000' }}
      />

      {/* Ambient dust canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-[1]" />
    </>
  );
};

/**
 * WizardStepHeader — Login → Start → (path-specific steps) → Build & Edit.
 * Steps and the active step come from the current entry path and
 * onboarding step, so every screen shows the same, correct sequence.
 * Completed steps: spot-blue checkmark. Active step: white text + dot
 * indicator. Inactive: chrome-mid gray. Thin low-opacity connectors.
 * onStepNavigate receives the step id of a completed step.
 */
export const WizardStepHeader = ({ headerRef, onStepNavigate }) => {
  const { entryPath, onboardingStep } = usePortfolio();
  const steps = getWizardSteps(entryPath);
  const activeIndex = Math.max(0, steps.findIndex((s) => s.id === onboardingStep));
  return (
    <div
      ref={headerRef}
      className="relative z-10 w-full max-w-4xl mb-5 flex items-center justify-center"
      aria-label="Onboarding progress"
    >
      <div className="flex items-center flex-wrap justify-center gap-y-2">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isActive = idx === activeIndex;
          const isCompleted = idx < activeIndex;
          // Completed steps become back-navigation buttons when a handler is given.
          const canNavigate = !!onStepNavigate && idx < activeIndex;
          return (
            <React.Fragment key={step.id}>
              <button
                type="button"
                onClick={canNavigate ? () => onStepNavigate(step.id) : undefined}
                disabled={!canNavigate}
                title={canNavigate ? `Back to ${step.label}` : undefined}
                className={`relative flex items-center gap-2 ${canNavigate ? 'cursor-pointer group' : 'cursor-default'}`}
              >
                {isCompleted ? (
                  <Check
                    className="w-3.5 h-3.5 transition-transform duration-200 group-hover:scale-110"
                    style={{ color: SPOT_BLUE }}
                    strokeWidth={2.5}
                  />
                ) : (
                  <Icon
                    className="w-3.5 h-3.5 transition-colors duration-200"
                    style={{ color: isActive ? PAPER : 'rgba(107,114,128,0.7)' }}
                    strokeWidth={2}
                  />
                )}
                <span
                  className={`text-xs font-medium tracking-wide transition-colors duration-200 ${
                    isCompleted ? 'text-[rgba(107,114,128,0.85)] group-hover:text-white' : ''
                  }`}
                  style={{
                    color: isActive ? PAPER : isCompleted ? undefined : 'rgba(107,114,128,0.7)',
                    fontWeight: isActive ? 600 : 400
                  }}
                >
                  {step.label}
                </span>
                {isActive && (
                  <span
                    className="dot-pulse absolute left-1/2 rounded-full"
                    style={{
                      transform: 'translateX(-50%)',
                      bottom: '-9px',
                      width: '4px',
                      height: '4px',
                      backgroundColor: 'rgba(255,255,255,0.65)',
                      boxShadow: '0 0 6px rgba(255,255,255,0.5)'
                    }}
                  />
                )}
              </button>
              {idx < steps.length - 1 && (
                <span
                  className="relative mx-3 h-px w-6 md:w-10 overflow-hidden"
                  style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}
                >
                  {/* Completed stretch of the path fills in, one segment after another */}
                  {idx < activeIndex && (
                    <span
                      className="line-fill absolute inset-0"
                      style={{ '--i': idx, background: `linear-gradient(90deg, ${SPOT_BLUE}, rgba(127,168,232,0.35))` }}
                    />
                  )}
                </span>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

/**
 * StageBackButton — ghost back-navigation button in the cinematic
 * language: outline chrome, gray label, brightens + nudges left on hover.
 */
export const StageBackButton = ({ label, onClick, className = '' }) => (
  <button
    type="button"
    onClick={onClick}
    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-[3px] text-xs font-semibold uppercase tracking-wider transition-all duration-200 hover:-translate-x-0.5 active:scale-95 ${className}`}
    style={{
      color: '#6B7280',
      border: '1px solid rgba(255,255,255,0.15)',
      background: 'transparent'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.color = PAPER;
      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.color = '#6B7280';
      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
    }}
  >
    <ArrowLeft className="w-3.5 h-3.5" />
    <span>{label}</span>
  </button>
);

/**
 * StageKeyframes — the spotlight breathing keyframes, mount-once.
 */
export const StageKeyframes = () => (
  <style>{`
    @keyframes stageSpotlightBreathing {
      0%, 100% { opacity: 0.11; }
      50% { opacity: 0.20; }
    }
  `}</style>
);

/**
 * pulseSpot — scale-pulse helper for radio/selection circles
 * (0.9 → 1.1 → 1.0 over 0.25s), matching the resume page behavior.
 */
export const pulseSpot = (el) => {
  if (!el) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  gsap.fromTo(
    el,
    { scale: 0.9 },
    {
      scale: 1.1,
      duration: 0.125,
      yoyo: true,
      repeat: 1,
      ease: 'power1.inOut',
      onComplete: () => { el.style.transform = ''; }
    }
  );
};

// Shared keyframe names kept in one place for both screens.
export const STAGE_SPOTLIGHT_KEYFRAMES = `
  @keyframes stageSpotlightBreathing {
    0%, 100% { opacity: 0.11; }
    50% { opacity: 0.20; }
  }
  @keyframes stageFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;
