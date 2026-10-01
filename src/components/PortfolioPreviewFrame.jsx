import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Monitor, Smartphone, Maximize2, X, ExternalLink, Lock, RotateCw } from 'lucide-react';
import { renderTheme, getTheme } from '../templates/registry';
import { SPOT_BLUE, CHROME_MID, PAPER, INK } from './CinematicStage';

const VIEWPORTS = {
  desktop: { width: 1280, label: 'Desktop', icon: Monitor },
  mobile: { width: 390, label: 'Mobile', icon: Smartphone }
};

/**
 * PortfolioPreviewFrame — live, scaled-down render of a design with the
 * user's portfolio data, dressed as a browser window so it reads as "your
 * website". The design is laid out at a real viewport width (1280 / 390px)
 * and CSS-scaled to fit, so it looks exactly like the published site, just
 * smaller. Works for React themes and the HTML library (renderTheme routes
 * HTML ids to the sandboxed iframe viewer).
 *
 * The scaled wrapper has a transform, which also makes it the containing
 * block for any position:fixed elements inside a theme — they stay inside
 * the preview instead of escaping over the page.
 *
 * Props:
 *   height     fixed viewport height in px (ignored when `fill`)
 *   fill       take the parent's full height instead
 *   url        address shown in the bar; also what "Open website" opens
 *   contentId  DOM id for the rendered site (PDF export captures it)
 */
export const PortfolioPreviewFrame = ({ layoutId, portfolio, height = 540, fill = false, caption, url, contentId }) => {
  const boxRef = useRef(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [viewport, setViewport] = useState('desktop');
  const [fullscreen, setFullscreen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setBox({ w: entry.contentRect.width, h: entry.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e) => { if (e.key === 'Escape') setFullscreen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fullscreen]);

  const theme = layoutId ? getTheme(layoutId) : null;
  // Only HTML-library designs (own iframe, own viewport) respond to the
  // frame width. React themes render inline, so their breakpoints follow the
  // real browser window — a "mobile" frame would show a broken layout.
  const canMobile = !!theme?.isHtml;
  const activeViewport = canMobile ? viewport : 'desktop';
  const vpWidth = VIEWPORTS[activeViewport].width;
  const boxHeight = fill ? box.h : height;
  // Mobile renders at 1:1 when it fits; desktop always scales to the box.
  const scale = box.w ? Math.min(1, box.w / vpWidth) : 0;
  const frameHeight = scale ? boxHeight / scale : boxHeight;
  const displayUrl = url ? url.replace(/^https?:\/\//, '') : '';

  const iconBtn = 'p-1.5 rounded transition-colors hover:text-white disabled:opacity-40';

  return (
    <div
      className={`flex flex-col min-w-0 rounded-xl overflow-hidden ${fill ? 'h-full' : ''}`}
      style={{ border: '1px solid rgba(255,255,255,0.10)', background: '#0B0B10', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}
    >
      {/* Browser chrome */}
      <div className="flex items-center gap-3 px-3 py-2 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: '#111117' }}>
        <div className="hidden sm:flex items-center gap-1.5 shrink-0" aria-hidden="true">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#FF5F57' }} />
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#FEBC2E' }} />
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#28C840' }} />
        </div>

        {/* Address bar */}
        <div
          className="flex-1 min-w-0 flex items-center gap-2 px-3 py-1 rounded-md text-[11px]"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)' }}
          title={url || theme?.name}
        >
          <Lock className="w-3 h-3 shrink-0" style={{ color: CHROME_MID }} />
          <span className="truncate" style={{ color: PAPER }}>{displayUrl || theme?.name || 'Live preview'}</span>
          {caption && <span className="hidden xl:inline truncate" style={{ color: CHROME_MID }}>· {caption}</span>}
        </div>

        <div className="flex items-center gap-0.5 shrink-0">
          {canMobile && Object.entries(VIEWPORTS).map(([key, vp]) => {
            const Icon = vp.icon;
            const active = activeViewport === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setViewport(key)}
                title={`${vp.label} view`}
                aria-pressed={active}
                className="p-1.5 rounded transition-colors"
                style={{ color: active ? INK : CHROME_MID, background: active ? SPOT_BLUE : 'transparent' }}
              >
                <Icon className="w-3.5 h-3.5" />
              </button>
            );
          })}
          <button type="button" onClick={() => setReloadKey((k) => k + 1)} disabled={!layoutId} title="Reload preview" className={iconBtn} style={{ color: CHROME_MID }}>
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          <button type="button" onClick={() => setFullscreen(true)} disabled={!layoutId} title="Full-screen preview" className={iconBtn} style={{ color: CHROME_MID }}>
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              title="Open your website in a new tab"
              className="ml-1 flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider"
              style={{ background: PAPER, color: INK }}
            >
              <ExternalLink className="w-3 h-3" />
              <span className="hidden md:inline">Open website</span>
            </a>
          )}
        </div>
      </div>

      {/* Scaled viewport */}
      <div ref={boxRef} className={`relative w-full overflow-hidden ${fill ? 'flex-1 min-h-0' : ''}`} style={fill ? undefined : { height }}>
        {!layoutId ? (
          <div className="absolute inset-0 flex items-center justify-center text-xs" style={{ color: CHROME_MID }}>
            Select a design to preview it with your details.
          </div>
        ) : scale > 0 && boxHeight > 0 && (
          <div
            className="pf-frame absolute top-0 bg-white"
            style={{
              width: vpWidth,
              height: frameHeight,
              left: Math.max(0, (box.w - vpWidth * scale) / 2),
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              overflowY: 'auto',
              overflowX: 'hidden'
            }}
          >
            {/* key remounts the design on switch/reload so each starts fresh.
                HTML designs fill the frame (their iframe scrolls); React
                themes grow with their content and the frame scrolls. */}
            <div
              key={`${layoutId}-${reloadKey}`}
              id={contentId}
              className="frame-fade"
              style={theme?.isHtml ? { height: '100%' } : { minHeight: '100%' }}
            >
              {renderTheme(layoutId, portfolio)}
            </div>
          </div>
        )}
      </div>

      {/* HTML-library designs render in an iframe sized to the browser
          viewport; inside the preview it should fill the frame instead. */}
      <style>{`.pf-frame iframe { height: 100% !important; min-height: 100% !important; }`}</style>

      {/* Full-screen overlay */}
      {fullscreen && layoutId && (
        <div className="fixed inset-0 z-[80] overflow-y-auto" style={{ backgroundColor: INK }} role="dialog" aria-label={`${theme?.name} full-screen preview`}>
          <button
            type="button"
            onClick={() => setFullscreen(false)}
            className="fixed top-4 right-4 z-[90] flex items-center gap-2 px-4 py-2.5 rounded-[3px] text-xs font-bold uppercase tracking-wider shadow-lg"
            style={{ backgroundColor: PAPER, color: INK }}
          >
            <X className="w-3.5 h-3.5" /> Close preview
          </button>
          <div style={{ transform: 'translateZ(0)', minHeight: '100vh' }}>
            {renderTheme(layoutId, portfolio)}
          </div>
        </div>
      )}
    </div>
  );
};
