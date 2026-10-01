import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { usePortfolio } from '../context/PortfolioContext';
import { LoginBackdrop } from './AnimatedBackdrop';
import { Github, ShieldCheck, HelpCircle, ArrowRight } from 'lucide-react';

/**
 * Cinematic login: a single spotlight on a dark stage, a 2D character that
 * tracks the cursor, and a two-line headline layered around it.
 *
 * Layers, bottom to top:
 *   z-0  stage gradient, animated backdrop (aurora, floor grid, floating
 *        résumé pages), spotlight cone, ground glow, dust
 *   z-1  headline line 1 ("RESUME PORTFOLIO"), which the head breaks through
 *   z-2  character body (collar down)
 *   z-3  character head (feathered at the neck so it can move on its own)
 *   z-4  headline line 2 ("BUILDER"), over the chest
 *   z-5  vignette
 *   z-10 login panel
 *   z-20 top nav
 *
 * The character is three wrappers deep so nothing fights over `transform`:
 * positioner (static centering) → entrance (GSAP, once) → idle breathing
 * (CSS) → head/body layers (per-frame parallax).
 */
export const CinematicChromeLogin = ({ onComplete }) => {
  const { loginUser, registerUser } = usePortfolio();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('piyush@example.com');
  const [password, setPassword] = useState('password123');
  const [name, setName] = useState('Piyush Sharma');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const containerRef = useRef(null);
  const spotlightRef = useRef(null);
  const spotBeamRef = useRef(null);
  const glowRef = useRef(null);
  const dustRef = useRef(null);
  const characterRef = useRef(null);
  const bodyRef = useRef(null);
  const headRef = useRef(null);
  const backLineRef = useRef(null);
  const frontLineRef = useRef(null);
  const panelRef = useRef(null);
  const navRef = useRef(null);
  const emailInputRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      if (isLogin) {
        await loginUser(email, password);
      } else {
        await registerUser(name, email, password);
      }
      setIsLoading(false);
      if (onComplete) onComplete();
    } catch (err) {
      setError(err.message || 'Authentication failed.');
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setIsLoading(true);
    await loginUser('piyush@example.com', 'password123');
    setIsLoading(false);
    if (onComplete) onComplete();
  };

  const switchToCreate = () => {
    setIsLogin(false);
    emailInputRef.current?.focus();
  };

  // -------------------------------------------------------------
  // Ambient dust (desktop only, off for reduced motion)
  // -------------------------------------------------------------
  useEffect(() => {
    const canvas = dustRef.current;
    if (!canvas) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = canvas.getContext('2d');
    let animId;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    if (window.innerWidth < 768) return () => window.removeEventListener('resize', resize);

    const dust = Array.from({ length: 22 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.2 + 0.4,
      o: Math.random() * 0.2 + 0.08,
      vy: Math.random() * 0.15 + 0.04,
      vx: (Math.random() - 0.5) * 0.06
    }));

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      dust.forEach((p) => {
        p.y -= p.vy;
        p.x += p.vx;
        if (p.y < 0) { p.y = canvas.height; p.x = Math.random() * canvas.width; }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${p.o})`;
        ctx.fill();
      });
      animId = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animId);
    };
  }, []);

  // -------------------------------------------------------------
  // Mouse-follow parallax. The head moves 1.3x the body so the
  // character reads as turning to track the cursor. Headline lines
  // drift slightly (opposite / same direction) for depth.
  // -------------------------------------------------------------
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let targetX = 0, targetY = 0, curX = 0, curY = 0;
    let animId;

    const onMove = (e) => {
      const nx = (e.clientX / window.innerWidth - 0.5) * 2;
      const ny = (e.clientY / window.innerHeight - 0.5) * 2;
      targetX = nx * 18;
      targetY = ny * 10;
    };
    window.addEventListener('mousemove', onMove);

    const loop = () => {
      curX += (targetX - curX) * 0.06;
      curY += (targetY - curY) * 0.06;
      if (bodyRef.current) {
        bodyRef.current.style.transform = `translate(${curX}px, ${curY}px) rotateY(${curX * 0.12}deg)`;
      }
      if (headRef.current) {
        headRef.current.style.transform = `translate(${curX * 1.3}px, ${curY * 1.3}px) rotateY(${curX * 0.18}deg)`;
      }
      if (backLineRef.current) {
        backLineRef.current.style.transform = `translate(${-curX * 0.35}px, ${-curY * 0.25}px)`;
      }
      if (frontLineRef.current) {
        frontLineRef.current.style.transform = `translate(${curX * 0.6}px, ${curY * 0.4}px)`;
      }
      // The spotlight leans toward the cursor, like an operator tracking you.
      if (spotBeamRef.current) {
        spotBeamRef.current.style.transform = `rotate(${-curX * 0.35}deg)`;
      }
      animId = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(animId);
    };
  }, []);

  // -------------------------------------------------------------
  // Entrance timeline (once). Animates wrapper elements only; the
  // parallax loop owns the inner layers' transforms.
  // -------------------------------------------------------------
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = gsap.context(() => {
      gsap.timeline({ defaults: { ease: 'power2.out' } })
        .from(spotlightRef.current, { opacity: 0, duration: 1.2 })
        .from(glowRef.current, { opacity: 0, scale: 0.6, duration: 1 }, '-=0.8')
        .from(characterRef.current, { opacity: 0, y: 30, duration: 1 }, '-=0.6')
        .from('.login-line-back', { opacity: 0, y: 20, duration: 0.8 }, '-=0.5')
        .from('.login-line-front', { opacity: 0, y: 20, duration: 0.8 }, '-=0.6')
        .from(panelRef.current, { opacity: 0, x: 30, duration: 0.8 }, '-=0.4')
        .from(navRef.current, { opacity: 0, duration: 0.6 }, '-=0.5');
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const inputCls =
    'login-input w-full bg-transparent border-0 border-b border-white/25 px-0 py-2 text-sm text-[#F5F5F7] placeholder-white/35 focus:outline-none focus:border-[#7FA8E8] transition-colors';

  return (
    <div
      ref={containerRef}
      className="login-root relative w-full min-h-screen lg:h-screen overflow-x-hidden lg:overflow-hidden select-none font-outfit"
      style={{ backgroundColor: '#06060A', color: '#F5F5F7' }}
    >
      {/* ─────────── STAGE (full screen on desktop, top block on mobile) ─────────── */}
      <div className="login-stage relative h-[58vh] lg:absolute lg:inset-0 lg:h-auto overflow-hidden">
        {/* z-0: background */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 0%, #14141c 0%, #06060A 60%, #000 100%)' }} />
        {/* animated backdrop: aurora, stage-floor grid, floating résumé pages */}
        <LoginBackdrop />
        <div ref={spotlightRef} className="login-spot-anchor absolute top-0 pointer-events-none">
          <div ref={spotBeamRef} className="login-spotlight" />
        </div>
        <div className="login-x login-ground-pos absolute pointer-events-none">
          <div ref={glowRef} className="login-ground-glow" />
        </div>
        <canvas ref={dustRef} className="absolute inset-0 w-full h-full pointer-events-none" />

        {/* z-1: headline line 1 — behind the character */}
        <div className="login-x login-line-back-pos absolute z-[1] pointer-events-none">
          <div className="login-line-back">
            <div ref={backLineRef} className="login-headline login-headline-1 whitespace-nowrap">RESUME PORTFOLIO</div>
          </div>
        </div>

        {/* z-2 / z-3: character (body + head layers share one canvas size) */}
        <div className="login-x login-character-pos absolute z-[2] pointer-events-none">
          <div ref={characterRef}>
            <div className="login-breathe">
              <div className="login-character relative" style={{ perspective: '900px' }}>
                <img
                  ref={bodyRef}
                  src="/character-body.webp"
                  alt=""
                  aria-hidden="true"
                  draggable="false"
                  className="login-layer absolute inset-0 w-full h-full z-[2]"
                />
                <img
                  ref={headRef}
                  src="/character-head.webp"
                  alt="Illustrated character with dark hair and a red hoodie"
                  draggable="false"
                  className="login-layer absolute inset-0 w-full h-full z-[3]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* z-4: headline line 2 — in front of the chest */}
        <div className="login-x login-line-front-pos absolute z-[4] pointer-events-none">
          <div className="login-line-front">
            <div ref={frontLineRef} className="login-headline login-headline-2 whitespace-nowrap"><span className="headline-sheen">BUILDER</span></div>
          </div>
        </div>

        {/* z-5: vignette */}
        <div className="login-vignette absolute inset-0 z-[5] pointer-events-none" />
      </div>

      {/* ─────────── LOGIN PANEL ─────────── */}
      <div className="login-panel-pos relative z-10 px-4 pb-10 lg:p-0 lg:absolute">
        <div
          ref={panelRef}
          className="w-full lg:w-[360px] p-7 lg:p-8 space-y-5 rounded-[4px]"
          style={{
            background: 'rgba(20,20,26,0.55)',
            backdropFilter: 'blur(24px) saturate(140%)',
            WebkitBackdropFilter: 'blur(24px) saturate(140%)',
            border: '1px solid rgba(255,255,255,0.10)',
            boxShadow: '0 25px 70px rgba(0,0,0,0.6)'
          }}
        >
          <div className="space-y-1.5">
            <h1 className="text-xl font-bold tracking-tight text-[#F5F5F7]">
              {isLogin ? 'Welcome back' : 'Create your account'}
            </h1>
            <p className="text-xs text-[#A1A1AA]">
              {isLogin ? 'Sign in to keep building your portfolio.' : 'Start building a portfolio in minutes.'}
            </p>
          </div>

          <div className="flex border-b border-white/10 text-xs" role="tablist">
            {[['Sign in', true], ['Create account', false]].map(([label, val]) => (
              <button
                key={label}
                type="button"
                role="tab"
                aria-selected={isLogin === val}
                onClick={() => setIsLogin(val)}
                className={`login-focus pb-2 mr-5 font-medium transition-colors -mb-px border-b-2 ${
                  isLogin === val ? 'text-[#F5F5F7] border-[#7FA8E8]' : 'text-[#A1A1AA] border-transparent hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {error && (
            <div role="alert" className="text-xs text-rose-300 bg-rose-950/40 p-2 rounded border border-rose-800/40">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <label className="block space-y-1">
                <span className="block text-[10px] uppercase tracking-wider text-[#A1A1AA]">Full name</span>
                <input type="text" required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
              </label>
            )}
            <label className="block space-y-1">
              <span className="block text-[10px] uppercase tracking-wider text-[#A1A1AA]">Email</span>
              <input ref={emailInputRef} type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={inputCls} />
            </label>
            <label className="block space-y-1">
              <span className="block text-[10px] uppercase tracking-wider text-[#A1A1AA]">Password</span>
              <input type="password" required autoComplete={isLogin ? 'current-password' : 'new-password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className={inputCls} />
            </label>

            <div className="flex items-center justify-between text-[11px]">
              <a href="#forgot" className="login-focus text-[#A1A1AA] hover:text-white underline underline-offset-4 transition-colors">Forgot password?</a>
              <button type="button" onClick={handleDemoLogin} className="login-focus text-[#7FA8E8] hover:underline font-medium">One-click demo</button>
            </div>

            <button type="submit" disabled={isLoading} className="btn-shine login-primary login-focus w-full py-3 font-bold uppercase tracking-wider text-xs rounded-[2px] flex items-center justify-center gap-2 disabled:opacity-70">
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" aria-label="Signing in" />
              ) : (
                <>
                  <span>{isLogin ? 'Sign in' : 'Create account'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* ─────────── TOP NAV ─────────── */}
      <nav
        ref={navRef}
        aria-label="Main navigation"
        className="absolute lg:fixed top-0 left-0 right-0 h-16 px-5 lg:px-12 grid grid-cols-3 items-center z-20"
      >
        <div className="flex items-center gap-4 text-[#A1A1AA]">
          <a href="https://github.com" target="_blank" rel="noreferrer" aria-label="GitHub" className="login-focus hover:text-white transition-colors"><Github className="w-4 h-4" /></a>
          <a href="#security" aria-label="Security" className="login-focus hover:text-white transition-colors"><ShieldCheck className="w-4 h-4" /></a>
          <a href="#help" aria-label="Help" className="login-focus hover:text-white transition-colors"><HelpCircle className="w-4 h-4" /></a>
        </div>
        <div className="text-center">
          <span className="font-extrabold text-[11px] lg:text-xs uppercase tracking-[0.35em] text-[#F5F5F7] whitespace-nowrap">
            AURA <span className="text-[#7FA8E8]">PORTFOLIO</span>
          </span>
        </div>
        <div className="flex justify-end">
          {isLogin && (
            <button type="button" onClick={switchToCreate} className="login-focus hidden sm:block text-[11px] uppercase tracking-wider text-[#A1A1AA] hover:text-white transition-colors">
              Create account
            </button>
          )}
        </div>
      </nav>

      <style>{`
        /* Horizontal anchor for the stage composition. Centered on mobile;
           on desktop it shifts left so the right-hand panel never covers it. */
        .login-root { --stage-x: 50%; --char-h: 38vh; }
        @media (min-width: 1024px) { .login-root { --stage-x: 36%; --char-h: 74vh; } }
        @media (min-width: 1280px) { .login-root { --stage-x: 42%; --char-h: 78vh; } }

        .login-x { left: var(--stage-x); transform: translateX(-50%); }
        .login-spot-anchor { left: var(--stage-x); transform: translateX(-50%); width: 40vw; min-width: 320px; height: 72vh; }
        .login-spotlight {
          width: 100%; height: 100%;
          transform-origin: 50% 0;
          will-change: transform;
          background: linear-gradient(to bottom, rgba(200,215,255,0.18), transparent 80%);
          clip-path: polygon(45% 0%, 55% 0%, 100% 100%, 0% 100%);
          animation: loginBreathe 4.5s ease-in-out infinite;
        }
        .login-ground-pos { bottom: -6%; }
        .login-ground-glow {
          width: min(60vw, 640px); height: 34vh;
          background: radial-gradient(ellipse at 50% 60%, rgba(140,170,230,0.30), transparent 70%);
          filter: blur(18px);
        }

        /* Character: square canvas; bottom fades into the stage since the
           source is a bust cut off at the chest. */
        .login-character-pos { bottom: 0; }
        .login-character { height: var(--char-h); width: var(--char-h); }
        .login-layer {
          will-change: transform;
          -webkit-user-drag: none;
          -webkit-mask-image: linear-gradient(to bottom, #000 70%, transparent 98%);
                  mask-image: linear-gradient(to bottom, #000 70%, transparent 98%);
          filter: drop-shadow(0 0 28px rgba(127,168,232,0.18));
        }
        .login-breathe { animation: loginIdle 5s ease-in-out infinite; transform-origin: 50% 100%; }

        /* Headline. Line 1 sits at hair level so the head breaks through it;
           line 2 crosses the chest in front of the body. */
        .login-headline { font-family: 'Archivo Black', 'Space Grotesk', sans-serif; color: #fff; line-height: 0.95; letter-spacing: -0.02em; }
        .login-headline-1 { font-size: clamp(2rem, 4.6vw, 4.6rem); }
        @media (min-width: 1024px) and (max-width: 1279px) { .login-headline-1 { font-size: 3.6vw; } }
        .login-headline-2 { font-size: clamp(4rem, 10.5vw, 8.5rem); filter: drop-shadow(0 12px 30px rgba(0,0,0,0.6)); }
        .login-line-back-pos { top: calc(100% - var(--char-h) - var(--char-h) * 0.07); }
        .login-line-front-pos { bottom: calc(var(--char-h) * 0.12); }

        @media (max-width: 1023px) {
          .login-character-pos { bottom: 0; }
          .login-line-front-pos { bottom: 4%; }
          .login-headline-1 { font-size: clamp(1.4rem, 7vw, 2.6rem); }
          .login-headline-2 { font-size: clamp(2.6rem, 14vw, 5rem); }
          .login-vignette { box-shadow: inset 0 0 90px 24px #000; }
        }
        @media (min-width: 1024px) {
          .login-panel-pos { right: 6%; top: 50%; transform: translateY(-50%); }
        }

        @media (min-width: 1024px) { .login-vignette { box-shadow: inset 0 0 220px 80px #000; } }

        /* Primary button: white fill, inverts on hover */
        .login-primary { background: #F5F5F7; color: #06060A; border: 1px solid #F5F5F7; transition: background .2s, color .2s; }
        .login-primary:hover:not(:disabled) { background: transparent; color: #F5F5F7; }

        /* Visible keyboard focus everywhere */
        .login-focus:focus-visible, .login-primary:focus-visible { outline: 2px solid #7FA8E8; outline-offset: 3px; border-radius: 2px; }
        .login-input:focus-visible { box-shadow: 0 1px 0 #7FA8E8; }

        @keyframes loginBreathe { 0%, 100% { opacity: 0.7; } 50% { opacity: 1; } }
        @keyframes loginIdle { 0%, 100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-4px) scale(1.006); } }

        @media (prefers-reduced-motion: reduce) {
          .login-spotlight, .login-breathe { animation: none; }
        }
      `}</style>
    </div>
  );
};
