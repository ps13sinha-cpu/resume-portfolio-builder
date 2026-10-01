import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ArrowRight } from 'lucide-react';
import { tiltCard, resetTilt } from '../utils/motion';
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

/**
 * ChoiceScreen — a full-page fork with large tilt cards, used for the
 * post-login path choice and the "create or optimize" resume choice.
 * options: [{ id, icon, title, body, cta }]
 */
export const ChoiceScreen = ({ title, subtitle, options, onChoose, onBack, backLabel = 'Back' }) => {

  const containerRef = useRef(null);
  const spotlightRef = useRef(null);
  const dustCanvasRef = useRef(null);
  const headerRef = useRef(null);
  const titleRef = useRef(null);
  const cardsRef = useRef([]);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = gsap.context(() => {
      if (reducedMotion) return;
      gsap.set(spotlightRef.current, { opacity: 0 });
      gsap.set([headerRef.current, titleRef.current], { opacity: 0, y: -12 });
      gsap.set(cardsRef.current, { opacity: 0, y: 16, scale: 0.98 });
      gsap.timeline({ defaults: { ease: 'power2.out' } })
        .to(spotlightRef.current, { opacity: 1, duration: 0.4 }, 0.15)
        .to(headerRef.current, { opacity: 1, y: 0, duration: 0.3 }, 0.1)
        .to(titleRef.current, { opacity: 1, y: 0, duration: 0.35 }, 0.3)
        .to(cardsRef.current, { opacity: 1, y: 0, scale: 1, duration: 0.4, stagger: 0.1 }, 0.45);
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

      {onBack && (
        <div className="relative z-10 w-full max-w-4xl mb-3">
          <StageBackButton label={backLabel} onClick={onBack} />
        </div>
      )}

      <WizardStepHeader headerRef={headerRef} />

      <div ref={titleRef} className="relative z-10 text-center mb-8 max-w-xl">
        <h1 className="font-syne text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: PAPER }}>
          {title}
        </h1>
        {subtitle && <p className="text-sm mt-2" style={{ color: CHROME_MID }}>{subtitle}</p>}
      </div>

      <div className="relative z-10 w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-5">
        {options.map((p, idx) => {
          const Icon = p.icon;
          return (
            <button
              key={p.id}
              type="button"
              ref={(el) => { cardsRef.current[idx] = el; }}
              onClick={() => onChoose(p.id)}
              className="spot-card border-beam group text-left rounded-2xl p-7 md:p-8 flex flex-col gap-5 focus:outline-none focus-visible:ring-2"
              style={{
                background: 'rgba(20, 20, 26, 0.45)',
                backdropFilter: 'blur(24px) saturate(140%)',
                WebkitBackdropFilter: 'blur(24px) saturate(140%)',
                border: '1px solid rgba(255, 255, 255, 0.10)',
                boxShadow: '0 25px 70px rgba(0, 0, 0, 0.85)',
                '--tw-ring-color': SPOT_BLUE,
                transition: 'transform 0.25s cubic-bezier(0.16,1,0.3,1), border-color 0.3s'
              }}
              onMouseMove={(e) => tiltCard(e, 6)}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(127,168,232,0.35)'; }}
              onMouseLeave={(e) => { resetTilt(e); e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)'; }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(127,168,232,0.10)', border: '1px solid rgba(127,168,232,0.25)' }}
              >
                <Icon className="icon-bob w-6 h-6" style={{ color: SPOT_BLUE }} strokeWidth={1.6} />
              </div>
              <div className="space-y-2 flex-1">
                <h2 className="font-syne text-xl font-bold tracking-tight" style={{ color: PAPER }}>{p.title}</h2>
                <p className="text-sm leading-relaxed" style={{ color: CHROME_MID }}>{p.body}</p>
              </div>
              <span
                className="btn-shine inline-flex items-center gap-2 self-start px-5 py-3 rounded-[3px] font-bold uppercase tracking-wider text-xs"
                style={{ backgroundColor: PAPER, color: INK }}
              >
                {p.cta}
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
