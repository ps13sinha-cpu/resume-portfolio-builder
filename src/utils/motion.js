// Small helpers for the motion system in src/motion.css.

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// onMouseMove handler for `.spot-card`: moves the card's light to the cursor.
export const trackSpot = (e) => {
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  el.style.setProperty('--mx', `${e.clientX - r.left}px`);
  el.style.setProperty('--my', `${e.clientY - r.top}px`);
};

// 3D tilt toward the cursor (max `deg` degrees). Pair with resetTilt on leave.
export const tiltCard = (e, deg = 5) => {
  trackSpot(e);
  if (reduced()) return;
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  const px = (e.clientX - r.left) / r.width - 0.5;
  const py = (e.clientY - r.top) / r.height - 0.5;
  el.style.transform = `perspective(900px) rotateX(${(-py * deg).toFixed(2)}deg) rotateY(${(px * deg).toFixed(2)}deg) translateY(-3px)`;
};

export const resetTilt = (e) => {
  e.currentTarget.style.transform = '';
};
