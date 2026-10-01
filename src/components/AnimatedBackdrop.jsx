import React, { useEffect, useRef } from 'react';

/**
 * AnimatedBackdrop — the app's animated background, shared by every page.
 * Layers (each optional), all dim so page content stays the focus:
 *   1. aurora    — slow-drifting blue/indigo light clouds (CSS)
 *   2. stage     — perspective grid floor gliding toward the viewer (CSS)
 *   3. documents — faint résumé / portfolio-page silhouettes floating up at
 *                  different depths, with mouse parallax (canvas)
 *   4. dots      — slowly drifting dot matrix (workspace)
 * Props tune it per page: `docs`/`mobileDocs` (0 = no canvas at all),
 * `intensity` (0–1 brightness), `floor`, `aurora`, `dots`, and `fixed` (pin to
 * the viewport so long, scrolling pages keep it behind them).
 * With prefers-reduced-motion everything renders as a still frame.
 */

const SPOT = '127,168,232';

// One floating page. z (0.25–1) is depth: nearer = bigger, brighter, faster.
const makeDoc = (w, h, spreadY = true) => {
  const z = 0.25 + Math.random() * 0.75;
  const width = 46 + z * 92;
  return {
    z,
    kind: Math.random() < 0.62 ? 'resume' : 'site',
    w: width,
    h: width * 1.32,
    x: Math.random() * w,
    y: spreadY ? Math.random() * (h + 200) - 100 : h + 60 + Math.random() * 120,
    vy: 0.08 + z * 0.32,
    rot: (Math.random() - 0.5) * 0.5,
    vr: (Math.random() - 0.5) * 0.0012,
    sway: Math.random() * Math.PI * 2,
    lines: Array.from({ length: 6 }, () => 0.35 + Math.random() * 0.6)
  };
};

const roundRect = (ctx, x, y, w, h, r) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

const drawDoc = (ctx, d, k = 1) => {
  const a = (0.05 + d.z * 0.16) * k;     // strength by depth × page intensity
  const { w, h } = d;
  const x = -w / 2;
  const y = -h / 2;
  const pad = w * 0.12;

  roundRect(ctx, x, y, w, h, Math.max(3, w * 0.06));
  ctx.fillStyle = `rgba(18,22,38,${a * 1.6})`;
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = `rgba(${SPOT},${a * 1.4})`;
  ctx.stroke();

  ctx.fillStyle = `rgba(${SPOT},${a * 1.5})`;
  if (d.kind === 'resume') {
    // name block + photo dot, then text lines with a section break
    ctx.beginPath();
    ctx.arc(x + pad + w * 0.07, y + pad + w * 0.07, w * 0.07, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(x + pad + w * 0.2, y + pad + w * 0.02, w * 0.42, Math.max(2, w * 0.05));
    ctx.fillStyle = `rgba(${SPOT},${a})`;
    ctx.fillRect(x + pad + w * 0.2, y + pad + w * 0.1, w * 0.28, Math.max(1.5, w * 0.03));
    let ly = y + pad + w * 0.3;
    d.lines.forEach((len, i) => {
      if (i === 3) { ly += w * 0.06; ctx.fillStyle = `rgba(${SPOT},${a * 1.5})`; ctx.fillRect(x + pad, ly, w * 0.3, Math.max(1.5, w * 0.035)); ly += w * 0.1; ctx.fillStyle = `rgba(${SPOT},${a})`; }
      ctx.fillRect(x + pad, ly, (w - pad * 2) * len, Math.max(1, w * 0.025));
      ly += w * 0.095;
    });
  } else {
    // portfolio page: browser bar, hero image block, card row
    ctx.fillRect(x, y, w, Math.max(4, w * 0.1));
    ctx.fillStyle = `rgba(${SPOT},${a * 0.9})`;
    roundRect(ctx, x + pad, y + w * 0.18, w - pad * 2, h * 0.34, 3);
    ctx.fill();
    const cw = (w - pad * 2 - w * 0.06) / 2;
    ctx.fillStyle = `rgba(${SPOT},${a * 0.7})`;
    roundRect(ctx, x + pad, y + h * 0.58, cw, h * 0.22, 2); ctx.fill();
    roundRect(ctx, x + pad + cw + w * 0.06, y + h * 0.58, cw, h * 0.22, 2); ctx.fill();
    ctx.fillRect(x + pad, y + h * 0.86, (w - pad * 2) * d.lines[0], Math.max(1, w * 0.025));
  }
};

export const AnimatedBackdrop = ({
  docs: docCount = 20, mobileDocs = 9, intensity = 1,
  aurora = true, floor = true, dots = false, fixed = false
}) => {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap || docCount === 0) return;
    const ctx = canvas.getContext('2d');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let W = 0, H = 0, docs = [], animId;
    let mx = 0, my = 0, cx = 0, cy = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = wrap.clientWidth;
      H = wrap.clientHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = W < 768 ? mobileDocs : docCount;
      if (docs.length !== count) docs = Array.from({ length: count }, () => makeDoc(W, H)).sort((a, b) => a.z - b.z);
    };

    const frame = (t) => {
      ctx.clearRect(0, 0, W, H);
      cx += (mx - cx) * 0.04;
      cy += (my - cy) * 0.04;
      docs.forEach((d, i) => {
        if (!reduced) {
          d.y -= d.vy;
          d.rot += d.vr;
          if (d.y < -d.h - 40) docs[i] = Object.assign(d, makeDoc(W, H, false), { z: d.z, w: d.w, h: d.h, vy: d.vy });
        }
        const sway = reduced ? 0 : Math.sin(t / 2600 + d.sway) * 10 * d.z;
        ctx.save();
        ctx.translate(d.x + sway - cx * 26 * d.z, d.y - cy * 14 * d.z);
        ctx.rotate(d.rot);
        drawDoc(ctx, d, intensity);
        ctx.restore();
      });
      if (!reduced) animId = requestAnimationFrame(frame);
    };

    const onMove = (e) => {
      mx = (e.clientX / window.innerWidth - 0.5) * 2;
      my = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    if (!reduced) window.addEventListener('mousemove', onMove);
    animId = requestAnimationFrame(frame);

    return () => {
      ro.disconnect();
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(animId);
    };
  }, [docCount, mobileDocs, intensity]);

  return (
    <div ref={wrapRef} className={`${fixed ? 'fixed' : 'absolute'} inset-0 pointer-events-none overflow-hidden`} aria-hidden="true">
      {/* 1. aurora */}
      {aurora && (
        <div className="absolute inset-0" style={{ opacity: intensity }}>
          <div className="lb-aurora lb-a1" />
          <div className="lb-aurora lb-a2" />
          <div className="lb-aurora lb-a3" />
        </div>
      )}

      {/* 2. stage floor */}
      {floor && (
        <div className="lb-floor" style={{ opacity: intensity }}>
          <div className="lb-grid" />
        </div>
      )}

      {/* 4. dot matrix */}
      {dots && <div className="lb-dots" style={{ opacity: intensity }} />}

      {/* 3. floating documents */}
      {docCount > 0 && <canvas ref={canvasRef} className="absolute inset-0" />}

      <style>{`
        .lb-aurora {
          position: absolute;
          border-radius: 50%;
          filter: blur(70px);
          mix-blend-mode: screen;
          will-change: transform;
        }
        .lb-a1 { width: 55vw; height: 45vh; left: -10vw; top: 5vh;  background: radial-gradient(circle, rgba(46,72,160,0.42), transparent 65%); animation: lbDrift1 26s ease-in-out infinite alternate; }
        .lb-a2 { width: 50vw; height: 50vh; right: -12vw; top: 20vh; background: radial-gradient(circle, rgba(88,52,170,0.32), transparent 65%); animation: lbDrift2 32s ease-in-out infinite alternate; }
        .lb-a3 { width: 45vw; height: 35vh; left: 25vw; bottom: -8vh; background: radial-gradient(circle, rgba(30,110,150,0.28), transparent 65%); animation: lbDrift3 22s ease-in-out infinite alternate; }
        @keyframes lbDrift1 { to { transform: translate(18vw, 8vh) scale(1.25); } }
        @keyframes lbDrift2 { to { transform: translate(-16vw, -10vh) scale(1.15); } }
        @keyframes lbDrift3 { to { transform: translate(-12vw, -6vh) scale(1.3); } }

        /* Floor: a large plane tilted away from the viewer; lines scroll toward us */
        .lb-floor {
          position: absolute;
          left: -50%; right: -50%; bottom: 0;
          height: 46%;
          perspective: 420px;
          perspective-origin: 50% 0%;
          -webkit-mask-image: linear-gradient(to top, #000 10%, transparent 95%);
                  mask-image: linear-gradient(to top, #000 10%, transparent 95%);
        }
        .lb-grid {
          position: absolute;
          inset: -100% 0 0 0;
          transform: rotateX(68deg);
          transform-origin: 50% 100%;
          background-image:
            linear-gradient(rgba(${SPOT},0.24) 1px, transparent 1px),
            linear-gradient(90deg, rgba(${SPOT},0.18) 1px, transparent 1px);
          background-size: 64px 64px;
          animation: lbFloor 6s linear infinite;
        }
        @keyframes lbFloor { to { background-position: 0 64px; } }

        .lb-dots {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(rgba(${SPOT},0.22) 1px, transparent 1.4px);
          background-size: 28px 28px;
          -webkit-mask-image: radial-gradient(ellipse 75% 70% at 50% 45%, #000 20%, transparent 80%);
                  mask-image: radial-gradient(ellipse 75% 70% at 50% 45%, #000 20%, transparent 80%);
          animation: lbDots 18s linear infinite;
        }
        @keyframes lbDots { to { background-position: 28px 56px; } }

        @media (prefers-reduced-motion: reduce) {
          .lb-aurora, .lb-grid, .lb-dots { animation: none; }
        }
      `}</style>
    </div>
  );
};

// The login stage uses the full-strength default.
export const LoginBackdrop = () => <AnimatedBackdrop />;
