import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Globe, Search, ExternalLink, Download, X, Loader2, LayoutGrid, Check, Zap, FileUp, Maximize2, ShieldCheck } from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';
import { SPOT_BLUE, CHROME_MID, PAPER, INK } from './CinematicStage';
import { FitReportScreen } from './FitReportScreen';

const CATEGORY_LABELS = {
  technology: 'Technology',
  creative: 'Creative',
  business: 'Business',
  academic: 'Academic',
  services: 'Services',
  retail: 'Retail',
  'health-wellness': 'Health & Wellness',
  startup: 'Startup',
  gaming: 'Gaming',
  music: 'Music',
  events: 'Events',
  medical: 'Medical'
};

export const HtmlTemplateBrowser = () => {
  const { 
    portfolio, 
    updatePortfolio, 
    triggerPublishConfetti, 
    setIsResumeModalOpen 
  } = usePortfolio();

  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);      // template entry
  const [injecting, setInjecting] = useState(false);
  const [buildingTemplateId, setBuildingTemplateId] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);  // { indexUrl, blobUrl }
  const [injectEngine, setInjectEngine] = useState(''); // 'claude' | 'heuristic'
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');
  const frameRef = useRef(null);
  const fsUrlRef = useRef(null);   // ready-made full-screen site blob URL

  // Universal Compatibility Layer: verified external templates + fit report
  const [v2Templates, setV2Templates] = useState([]);
  const [v2Preview, setV2Preview] = useState(null); // { template, html, fitReport }
  const [condensing, setCondensing] = useState(false);

  useEffect(() => {
    fetch('/api/templates-v2')
      .then(r => r.json())
      .then(j => setV2Templates(j.templates || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch('/api/templates')
      .then(r => r.json())
      .then(j => setTemplates(j.templates || []))
      .catch(() => setError('Could not load the template library (backend offline?)'))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(
    () => [...new Set(templates.map(t => t.category))].sort(),
    [templates]
  );

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return templates.filter(t =>
      (category === 'all' || t.category === category) &&
      (!q || t.name.toLowerCase().includes(q) || t.role.toLowerCase().includes(q) || (t.tags || []).some(x => x.toLowerCase().includes(q)))
    );
  }, [templates, category, query]);

  // Select and build the portfolio on this template
  const handleBuildPortfolio = async (tpl) => {
    if (buildingTemplateId) return;
    setBuildingTemplateId(tpl.id);
    await updatePortfolio({ layout_id: tpl.id });
    triggerPublishConfetti();
    setTimeout(() => {
      setBuildingTemplateId(null);
    }, 600);
  };

  // Inject resume data → build a blob URL for the entry page preview
  const handlePreview = async (tpl) => {
    if (injecting) return;
    setSelected(tpl);
    setInjecting(true);
    setError('');
    try {
      const res = await fetch(`/api/templates/${encodeURIComponent(tpl.id)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(portfolio)
      });
      if (!res.ok) throw new Error('Injection failed');
      const { files, engine } = await res.json();
      setInjectEngine(engine || 'heuristic');

      const blobMap = {};
      files.forEach(f => {
        blobMap[f.path] = URL.createObjectURL(
          new Blob([f.content], { type: f.encoding === 'base64' ? f.type : f.type + ';charset=utf-8' })
        );
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
      if (!entry) throw new Error('Template has no index.html');
      const baseUrl = blobMap[entry.path] || resolve(entry.path);
      const rebased = rebase(entry.content).replace(
        /<head(\s[^>]*)?>/i,
        (m) => `${m}\n<base href="${baseUrl}">`
      );
      setPreviewDoc(rebased);

      // Pre-build the full-screen version NOW (same response): entry page with
      // a nav interceptor that resolves internal links to the other pages'
      // blob URLs. Ready synchronously when the user clicks "Open Full Screen",
      // so window.open stays inside the user gesture (popup-blocker safe).
      const navScript = `<script>(function(){
        var MAP = ${JSON.stringify(blobMap)};
        function resolve(p){
          var c = String(p).replace(/^\\.?\\//, '').replace(/^\\.\\.\\//, '');
          if (MAP[c]) return MAP[c];
          var hit = Object.keys(MAP).filter(function(k){ return k.indexOf('/' + c, k.length - c.length - 1) !== -1; })[0];
          return hit ? MAP[hit] : null;
        }
        document.addEventListener('click', function(e){
          var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
          if (!a) return;
          var href = a.getAttribute('href') || '';
          if (!href || /^(https?:|#|mailto:|tel:|data:|blob:)/i.test(href)) return;
          var url = resolve(href);
          if (url) { e.preventDefault(); window.location.href = url; }
        }, true);
      })();<\/script>`;
      const fsHtml = entry.content.replace(/<body([^>]*)>/i, (m, attrs) => `${m}\n${navScript}`);
      fsUrlRef.current = URL.createObjectURL(new Blob([fsHtml], { type: 'text/html;charset=utf-8' }));
    } catch (e) {
      setError(e.message || 'Preview failed');
    } finally {
      setInjecting(false);
    }
  };

  // Verified external template: fit + sandboxed preview (adapter-isolated)
  const handleV2Preview = async (tpl, condenseTarget = null) => {
    if (injecting) return;
    setInjecting(true);
    setError('');
    try {
      const fitRes = await fetch('/api/fit', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId: tpl.id, portfolio, condenseTarget })
      });
      const fitJ = await fitRes.json();
      const prevRes = await fetch('/api/templates-v2/preview', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId: tpl.id, portfolio })
      });
      const prevJ = await prevRes.json();
      if (!prevRes.ok) throw new Error(prevJ.error?.message || 'Preview failed');
      setV2Preview({ template: tpl, html: prevJ.html, fitReport: fitJ.fitReport || {} });
    } catch (e) {
      setError(e.message || 'Preview failed');
    } finally {
      setInjecting(false);
    }
  };

  // Download the COMPLETE multi-page site as a .zip (index/about/projects/
  // contact + css + js + assets — all injected with resume data). Extract it
  // anywhere and open index.html: every page is fully populated.
  const handleDownload = async () => {
    if (!selected || downloading) return;
    setDownloading(true);
    setError('');
    try {
      const res = await fetch(`/api/templates/${encodeURIComponent(selected.id)}/zip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(portfolio)
      });
      if (!res.ok) throw new Error('Could not build the site archive');
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${selected.id}-portfolio.zip`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (e) {
      setError(e.message || 'Download failed');
    } finally {
      setDownloading(false);
    }
  };

  // Open the pre-built full-screen site in a real browser tab — synchronous,
  // so the browser treats it as part of the click (no popup-blocker issues).
  const handleOpenFullScreen = () => {
    if (!selected) return;
    const url = fsUrlRef.current;
    if (!url) { setError('Full-screen site is still preparing — try again in a second.'); return; }
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.click();
  };

  const currentLayoutId = portfolio.layout_id || 'awwwards';

  // ------------------------- PREVIEW DRAWER -------------------------
  if (selected && previewDoc) {
    const isCurrentlyBuilt = currentLayoutId === selected.id;

    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-syne text-base font-bold" style={{ color: PAPER }}>{selected.name}</h3>
            <p className="text-xs" style={{ color: CHROME_MID }}>
              {selected.role} · resume data injected
              {injectEngine === 'claude' ? ' · AI-enhanced' : ' · auto-enriched'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenFullScreen}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[3px] text-[11px] font-bold uppercase tracking-wider transition-all active:scale-95"
              style={{ color: SPOT_BLUE, border: `1px solid ${SPOT_BLUE}`, background: 'rgba(127,168,232,0.08)' }}
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Open Full Screen</span>
            </button>
            <button
              onClick={() => handleBuildPortfolio(selected)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[3px] text-[11px] font-bold uppercase tracking-wider transition-all active:scale-95"
              style={isCurrentlyBuilt
                ? { background: 'rgba(127,168,232,0.15)', color: SPOT_BLUE, border: `1px solid ${SPOT_BLUE}` }
                : { backgroundColor: PAPER, color: INK }}
            >
              {isCurrentlyBuilt ? <Check className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />}
              <span>{isCurrentlyBuilt ? 'Active Portfolio' : 'Build on this Template'}</span>
            </button>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[3px] text-[11px] font-semibold"
              style={{ color: CHROME_MID, border: '1px solid rgba(255,255,255,0.15)' }}
              title="Download the complete multi-page site (.zip)"
            >
              {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => { setSelected(null); setPreviewDoc(null); }}
              className="p-2 rounded-[3px]"
              style={{ color: CHROME_MID, border: '1px solid rgba(255,255,255,0.15)' }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div
          className="rounded-xl overflow-hidden"
          style={{ border: '1px solid rgba(255,255,255,0.12)', background: '#fff' }}
        >
          <iframe
            ref={frameRef}
            srcDoc={previewDoc}
            title={selected.name}
            className="w-full bg-white"
            style={{ height: '560px', border: 'none' }}
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
          />
        </div>
        <p className="text-[11px]" style={{ color: CHROME_MID }}>
          Fully populated from your extracted resume data. "Open Full Screen" launches the whole multi-page site in a real browser tab; "Download" saves the complete site as a .zip.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5 font-outfit">
      <div>
        <h3 className="font-syne text-lg font-bold flex items-center gap-2" style={{ color: PAPER }}>
          <Globe className="w-5 h-5" style={{ color: SPOT_BLUE }} />
          <span>HTML Website Library</span>
        </h3>
        <p className="text-xs mt-1" style={{ color: CHROME_MID }}>
          {loading ? 'Loading library…' : `${templates.length} real multi-page website templates. Select any template to build your portfolio on it with your extracted resume data.`}
        </p>
      </div>

      {/* ============ Universal Compatibility Layer: verified external templates ============ */}
      {v2Templates.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" style={{ color: SPOT_BLUE }} />
            <h4 className="font-syne text-sm font-bold" style={{ color: PAPER }}>Verified External Templates</h4>
            <span className="text-[10px] uppercase tracking-wide" style={{ color: CHROME_MID }}>
              sandboxed adapter · fit-checked · human-approved
            </span>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {v2Templates.map((t) => (
              <div key={t.id} className="p-3.5 rounded-xl space-y-2" style={{ background: 'rgba(127,168,232,0.04)', border: `1px solid ${SPOT_BLUE}44` }}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h5 className="font-semibold text-sm" style={{ color: PAPER }}>{t.name}</h5>
                    <p className="text-[11px]" style={{ color: CHROME_MID }}>
                      {t.stack} · fit-checked · human-approved
                    </p>
                  </div>
                  <button
                    onClick={() => handleV2Preview(t)}
                    disabled={injecting}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] text-[10px] font-bold uppercase tracking-wider transition-all"
                    style={{ backgroundColor: PAPER, color: INK }}
                  >
                    <Zap className="w-3 h-3" />
                    <span>Preview & Fit</span>
      
                  </button>
                </div>
              </div>
            ))}
          </div>

          {v2Preview && (
            <div className="space-y-3">
              <FitReportScreen
                templateName={v2Preview.template.name}
                fitReport={v2Preview.fitReport}
                onSwitch={() => setV2Preview(null)}
                onCondenseFurther={() => handleV2Preview(v2Preview.template, 140)}
                condensing={condensing}
              />
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.12)', background: '#fff' }}>
                <iframe
                  title={v2Preview.template.name}
                  srcDoc={v2Preview.html}
                  sandbox="allow-scripts"
                  className="w-full bg-white"
                  style={{ height: '560px', border: 'none' }}
                />
              </div>            </div>
          )}
        </div>
      )}

      {/* Extracted Resume Data Summary Banner */}
      <div 
        className="p-3 rounded-xl flex items-center justify-between gap-3 text-xs"
        style={{
          background: 'rgba(127,168,232,0.06)',
          border: '1px solid rgba(127,168,232,0.2)'
        }}
      >
        <div className="space-y-0.5 min-w-0">
          <p className="font-semibold text-white truncate">
            {portfolio.profile?.fullName || 'Your Profile'} · {portfolio.profile?.title || 'Professional'}
          </p>
          <p className="text-[11px] text-slate-400">
            {portfolio.skills?.length || 0} skills · {portfolio.projects?.length || 0} projects · {portfolio.experience?.length || 0} roles
          </p>
        </div>
        <button
          onClick={() => setIsResumeModalOpen(true)}
          className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-semibold text-[#7FA8E8] bg-[#7FA8E8]/10 hover:bg-[#7FA8E8]/20 border border-[#7FA8E8]/30 transition-all"
        >
          <FileUp className="w-3 h-3" />
          <span>Import Resume</span>
        </button>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: CHROME_MID }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search templates (developer, minimal, neon, portfolio…)"
            className="w-full pl-9 pr-3 py-2 rounded-lg text-xs focus:outline-none"
            style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.10)', color: PAPER }}
          />
        </div>
        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
          <button
            onClick={() => setCategory('all')}
            className="px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide transition-all"
            style={{
              backgroundColor: category === 'all' ? SPOT_BLUE : 'rgba(255,255,255,0.05)',
              color: category === 'all' ? INK : CHROME_MID,
              border: '1px solid rgba(255,255,255,0.12)'
            }}
          >
            All ({templates.length})
          </button>
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className="px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide transition-all"
              style={{
                backgroundColor: category === c ? SPOT_BLUE : 'rgba(255,255,255,0.05)',
                color: category === c ? INK : CHROME_MID,
                border: '1px solid rgba(255,255,255,0.12)'
              }}
            >
              {CATEGORY_LABELS[c] || c}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="text-xs p-3 rounded-lg" style={{ color: '#F87171', background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.3)' }}>
          {error}
        </p>
      )}

      {/* Grid */}
      {loading ? (
        <div className="flex items-center gap-2 text-xs py-12 justify-center" style={{ color: CHROME_MID }}>
          <Loader2 className="w-4 h-4 animate-spin text-[#7FA8E8]" /> Loading 229 template websites…
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 max-h-[560px] overflow-y-auto pr-1">
          {filtered.map(t => {
            const isCurrentlyBuilt = currentLayoutId === t.id;
            const isThisBuilding = buildingTemplateId === t.id;

            return (
              <div
                key={t.id}
                onClick={() => handleBuildPortfolio(t)}
                className="p-3.5 rounded-xl transition-all duration-200 group cursor-pointer space-y-2.5"
                style={{
                  background: isCurrentlyBuilt ? 'rgba(127,168,232,0.06)' : 'rgba(255,255,255,0.02)',
                  border: isCurrentlyBuilt ? `1.5px solid ${SPOT_BLUE}` : '1px solid rgba(255,255,255,0.08)',
                  boxShadow: isCurrentlyBuilt ? '0 0 20px rgba(127,168,232,0.15)' : 'none'
                }}
                onMouseEnter={(e) => { if (!isCurrentlyBuilt) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; }}
                onMouseLeave={(e) => { if (!isCurrentlyBuilt) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-sm truncate" style={{ color: PAPER }}>{t.name}</h4>
                      <span
                        className="px-2 py-px rounded-full text-[9px] font-medium uppercase tracking-wide shrink-0"
                        style={{ color: CHROME_MID, border: '1px solid rgba(255,255,255,0.14)' }}
                      >
                        {CATEGORY_LABELS[t.category] || t.category}
                      </span>
                    </div>
                    <p className="text-[11px] mt-0.5 truncate text-[#7FA8E8]">
                      {t.role} · {t.theme}
                    </p>
                  </div>

                  {isCurrentlyBuilt && (
                    <span className="shrink-0 flex items-center gap-1 text-[10px] font-bold text-[#7FA8E8]">
                      <Check className="w-3.5 h-3.5" /> Active
                    </span>
                  )}
                </div>

                <p className="text-[11px] leading-relaxed line-clamp-2" style={{ color: 'rgba(107,114,128,0.85)' }}>
                  {t.description}
                </p>

                <div className="pt-2 flex items-center justify-between gap-2 border-t border-white/5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePreview(t);
                    }}
                    disabled={injecting}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-medium text-slate-400 hover:text-white border border-white/10 hover:border-white/20 transition-all"
                  >
                    <LayoutGrid className="w-3 h-3" />
                    <span>Preview Details</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBuildPortfolio(t);
                    }}
                    disabled={isThisBuilding}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[3px] text-[10px] font-bold uppercase tracking-wider transition-all"
                    style={isCurrentlyBuilt
                      ? { backgroundColor: 'rgba(127,168,232,0.15)', color: SPOT_BLUE, border: `1px solid ${SPOT_BLUE}` }
                      : { backgroundColor: PAPER, color: INK }}
                  >
                    {isThisBuilding ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Building…</span>
                      </>
                    ) : isCurrentlyBuilt ? (
                      <>
                        <Check className="w-3 h-3" />
                        <span>Built</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-3 h-3" />
                        <span>Build Website</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-xs text-center py-6" style={{ color: CHROME_MID }}>No templates match that search.</p>
          )}
        </div>
      )}
    </div>
  );
};
