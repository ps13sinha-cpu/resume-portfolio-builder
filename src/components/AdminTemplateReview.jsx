import React, { useEffect, useState } from 'react';
import { ShieldCheck, Check, X, RefreshCw, FlaskConical, FlaskConicalOff } from 'lucide-react';
import { SPOT_BLUE, CHROME_MID, PAPER, INK } from './CinematicStage';
import { RICH_SEED, SPARSE_SEED } from '../../shared/canonicalSchema.js';

// ============================================================================
// HUMAN REVIEW GATE (spec §6) — internal screen at the spirit of
// /admin/templates/review/:id. Renders the template twice in sandboxed
// iframes: a "rich" canonical seed (stress overflow) and a "sparse" seed
// (stress empty states). Approve → status 'verified'; Reject requires a
// reason. Only verified rows reach the end-user picker (hard query filter
// in server registry access).
// ============================================================================
export const AdminTemplateReview = () => {
  const [templates, setTemplates] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [renders, setRenders] = useState({ rich: null, sparse: null });
  const [loading, setLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const r = await fetch('/api/registry/templates');
      const j = await r.json();
      setTemplates(j.templates || []);
    } catch {
      setError('Registry unreachable (backend offline?)');
    }
  };
  useEffect(() => { load(); }, []);

  const selected = templates.find((t) => t.id === selectedId) || null;

  const renderSeeds = async (tpl) => {
    setLoading(true);
    setError('');
    try {
      const renderSeed = async (seed) => {
        const res = await fetch('/api/templates-v2/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ templateId: tpl.id, portfolio: seed, canonical: true })
        });
        const j = await res.json();
        if (!res.ok) throw new Error(j.error?.message || 'render failed');
        return j.html;
      };
      const [rich, sparse] = await Promise.all([renderSeed(RICH_SEED), renderSeed(SPARSE_SEED)]);
      setRenders({ rich, sparse });
    } catch (e) {
      setError(e.message || 'Render failed');
      setRenders({ rich: null, sparse: null });
    } finally {
      setLoading(false);
    }
  };

  const decide = async (action) => {
    if (action === 'reject' && !rejectReason.trim()) {
      setError('A rejection reason is required.');
      return;
    }
    await fetch(`/api/registry/${selected.id}/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(action === 'reject' ? { reason: rejectReason } : {})
    });
    setRejectReason('');
    await load();
  };

  return (
    <div className="space-y-5 font-outfit">
      <div>
        <h3 className="font-syne text-lg font-bold flex items-center gap-2" style={{ color: PAPER }}>
          <ShieldCheck className="w-5 h-5" style={{ color: SPOT_BLUE }} />
          <span>Template Review Gate</span>
        </h3>
        <p className="text-xs mt-1" style={{ color: CHROME_MID }}>
          Ingested templates must pass rich + sparse render review before users ever see them.
        </p>
      </div>

      {error && (
        <p className="text-xs p-3 rounded-lg" style={{ color: '#F87171', background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.3)' }}>
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-1.5">
        {templates.map((t) => (
          <button
            key={t.id}
            onClick={() => { setSelectedId(t.id); renderSeeds(t); }}
            className={`px-2.5 py-1 rounded text-[10px] font-semibold uppercase tracking-wide transition-all ${
              selectedId === t.id ? 'bg-[#7FA8E8] text-[#06060A]' : 'text-slate-400 border border-white/10 hover:border-white/25'
            }`}
          >
            {t.name} · {t.status}
          </button>
        ))}
        {!templates.length && <p className="text-xs" style={{ color: CHROME_MID }}>No templates ingested yet.</p>}
      </div>

      {selected && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {['rich', 'sparse'].map((kind) => (
              <div key={kind} className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: kind === 'rich' ? SPOT_BLUE : CHROME_MID }}>
                  {kind === 'rich' ? <FlaskConical className="w-3 h-3" /> : <FlaskConicalOff className="w-3 h-3" />}
                  {kind} seed
                </p>
                <div className="rounded-xl overflow-hidden bg-white" style={{ border: '1px solid rgba(255,255,255,0.12)' }}>
                  {renders[kind]
                    ? <iframe title={`${kind} render`} srcDoc={renders[kind]} sandbox="allow-scripts" className="w-full" style={{ height: 420, border: 'none' }} />
                    : <div className="h-[420px] flex items-center justify-center text-xs text-slate-400">{loading ? 'Rendering…' : 'Select a template'}</div>}
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => decide('approve')} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[3px] text-[11px] font-bold uppercase tracking-wider" style={{ backgroundColor: PAPER, color: INK }}>
              <Check className="w-3.5 h-3.5" /> Approve → verified
            </button>
            <input
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Rejection reason (required to reject)"
              className="flex-1 min-w-[200px] px-3 py-2 rounded-lg text-xs"
              style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.10)', color: PAPER }}
            />
            <button onClick={() => decide('reject')} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[3px] text-[11px] font-bold uppercase tracking-wider" style={{ color: '#F87171', border: '1px solid rgba(248,113,113,0.4)' }}>
              <X className="w-3.5 h-3.5" /> Reject
            </button>
            <button onClick={() => renderSeeds(selected)} className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-[3px]" style={{ color: CHROME_MID, border: '1px solid rgba(255,255,255,0.15)' }}>
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
