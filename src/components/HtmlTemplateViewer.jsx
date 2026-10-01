import React, { useEffect, useState, useRef } from 'react';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { SPOT_BLUE, CHROME_MID, PAPER, INK } from './CinematicStage';

export const HtmlTemplateViewer = ({ templateId, portfolio, className = '' }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [previewDoc, setPreviewDoc] = useState(null);
  const [templateMeta, setTemplateMeta] = useState(null);
  const activeBlobUrlsRef = useRef([]);
  const requestSeqRef = useRef(0);   // ignore responses from superseded builds

  // Clean up blob URLs when unmounting or loading new template
  const revokeBlobs = () => {
    activeBlobUrlsRef.current.forEach(url => {
      try { URL.revokeObjectURL(url); } catch (e) {}
    });
    activeBlobUrlsRef.current = [];
  };

  useEffect(() => {
    return () => revokeBlobs();
  }, []);

  const buildWebsite = async () => {
    if (!templateId) return;
    const seq = ++requestSeqRef.current;
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/templates/${encodeURIComponent(templateId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(portfolio)
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson?.error?.message || `Failed to build template ${templateId}`);
      }

      const { template, files } = await res.json();
      if (seq !== requestSeqRef.current) return;
      revokeBlobs();
      setTemplateMeta(template);

      // Rebase all pages and assets onto blob URLs
      const blobMap = {};
      files.forEach(f => {
        const blobUrl = URL.createObjectURL(
          new Blob([f.content], { type: f.encoding === 'base64' ? f.type : f.type + ';charset=utf-8' })
        );
        blobMap[f.path] = blobUrl;
        activeBlobUrlsRef.current.push(blobUrl);
      });

      const resolve = (p) => {
        const clean = p.replace(/^\.?\//, '').replace(/^\.\.\//, '');
        if (blobMap[clean]) return blobMap[clean];
        const hit = Object.entries(blobMap).find(([k]) => k.endsWith('/' + clean));
        return hit?.[1] || null;
      };

      const rebase = (html) =>
        html.replace(/(src|href)=("|')(?!https?:|#|mailto:|tel:|data:|blob:)([^"']+)\2/gi, (m, attr, q, p) => {
          const hit = resolve(p);
          return hit ? `${attr}=${q}${hit}${q}` : m;
        });

      const entry = files.find(f => /(^|\/)index\.html?$/i.test(f.path));
      if (!entry) throw new Error('Template has no index.html entry point');

      const baseUrl = blobMap[entry.path] || resolve(entry.path);
      const rebased = rebase(entry.content).replace(
        /<head(\s[^>]*)?>/i,
        (m) => `${m}\n<base href="${baseUrl}">`
      );

      setPreviewDoc(rebased);
    } catch (err) {
      if (seq !== requestSeqRef.current) return;
      console.error('Error building HTML template website:', err);
      setError(err.message || 'Unable to build website on this template.');
    } finally {
      if (seq === requestSeqRef.current) setLoading(false);
    }
  };

  // Rebuild whenever any of the portfolio content changes (debounced so
  // typing in the editor doesn't fire a server build per keystroke).
  const dataKey = JSON.stringify(portfolio ?? {});
  useEffect(() => {
    const t = setTimeout(buildWebsite, previewDoc ? 450 : 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId, dataKey]);

  if (loading && !previewDoc) {
    return (
      <div className={`min-h-[500px] h-full flex flex-col items-center justify-center p-8 text-center bg-[#06060A] text-slate-200 ${className}`}>
        <div className="p-6 rounded-2xl max-w-md w-full space-y-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="w-10 h-10 rounded-full border-2 border-[#7FA8E8] border-t-transparent animate-spin mx-auto" />
          <div className="space-y-1">
            <h4 className="font-syne text-base font-bold text-white">Building Portfolio Website</h4>
            <p className="text-xs text-slate-400">
              Injecting your resume data into <span className="text-[#7FA8E8] font-semibold">{templateMeta?.name || templateId}</span>…
            </p>
          </div>
          <div className="pt-2 flex items-center justify-center gap-2 text-[10px] text-slate-500 font-mono">
            <span>Name: {portfolio?.profile?.fullName || 'Active Profile'}</span>
            <span>•</span>
            <span>{portfolio?.skills?.length || 0} Skills</span>
            <span>•</span>
            <span>{portfolio?.projects?.length || 0} Projects</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-[400px] h-full flex items-center justify-center p-6 text-center bg-[#06060A] ${className}`}>
        <div className="max-w-md p-6 rounded-xl space-y-3" style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.3)' }}>
          <AlertCircle className="w-6 h-6 text-rose-400 mx-auto" />
          <h4 className="font-syne text-sm font-bold text-rose-300">Template Build Error</h4>
          <p className="text-xs text-slate-400">{error}</p>
          <button
            onClick={buildWebsite}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded text-xs font-semibold uppercase tracking-wider text-black bg-white hover:bg-slate-200 transition-all active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Rebuilding</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full min-h-[600px] bg-white overflow-hidden ${className}`}>
      {loading && (
        <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-semibold bg-black/80 text-white backdrop-blur shadow-lg border border-white/10">
          <Loader2 className="w-3 h-3 animate-spin text-[#7FA8E8]" />
          <span>Updating template data…</span>
        </div>
      )}
      <iframe
        srcDoc={previewDoc}
        title={templateMeta?.name || templateId}
        className="w-full h-full min-h-[700px] border-none bg-white"
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
        style={{ display: 'block', minHeight: '100vh', width: '100%' }}
      />
    </div>
  );
};
