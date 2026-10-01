import React, { useState } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { Sparkles, X, Check, Copy, ArrowRight, RefreshCw, Wand2 } from 'lucide-react';

export const AIModal = () => {
  const { isAiModalOpen, setIsAiModalOpen, aiTargetBullet, setAiTargetBullet, updatePortfolio } = usePortfolio();

  const [inputText, setInputText] = useState(aiTargetBullet ? aiTargetBullet.text : '');
  const [roleContext, setRoleContext] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [copiedIdx, setCopiedIdx] = useState(null);

  if (!isAiModalOpen) return null;

  const handleEnhance = async () => {
    const textToEnhance = inputText.trim() || (aiTargetBullet ? aiTargetBullet.text : '');
    if (!textToEnhance) return;

    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/ai/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bulletText: textToEnhance, role: roleContext, tone: 'STAR' })
      });
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.suggestions || []);
      }
    } catch (err) {
      // Offline fallback mock AI generation
      setTimeout(() => {
        setSuggestions([
          {
            id: 'star',
            title: 'STAR Method (Quantified Result)',
            text: `Architected scalable solution for ${textToEnhance.replace(/\.$/, '')}, yielding a 42% reduction in latency and boosting team velocity by 3.5x.`,
            badge: 'High Impact'
          },
          {
            id: 'metric',
            title: 'Metric & Metrics Focus',
            text: `Spearheaded optimization of ${textToEnhance.replace(/\.$/, '')}, eliminating recurring performance bottlenecks for 100k+ daily users.`,
            badge: 'Metrics'
          },
          {
            id: 'executive',
            title: 'Executive Strategic Tone',
            text: `Steered cross-functional technical initiatives surrounding ${textToEnhance.replace(/\.$/, '')}, exceeding enterprise delivery SLAs across 4 product releases.`,
            badge: 'Leadership'
          }
        ]);
        setIsLoading(false);
      }, 500);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplySuggestion = (text) => {
    if (aiTargetBullet) {
      const { expId, bulletIdx } = aiTargetBullet;
      updatePortfolio(prev => {
        const updatedExp = (prev.experience || []).map(exp => {
          if (exp.id === expId) {
            const newBullets = [...(exp.bullets || [])];
            newBullets[bulletIdx] = text;
            return { ...exp, bullets: newBullets };
          }
          return exp;
        });
        return { ...prev, experience: updatedExp };
      });
    }
    setIsAiModalOpen(false);
    setAiTargetBullet(null);
  };

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl glass-panel rounded-2xl border border-white/10 p-6 shadow-2xl shadow-black/60">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/[0.06] border border-white/10 text-[#7FA8E8]">
              <Sparkles className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-syne text-lg font-bold text-white">AI Bullet Enhancer</h3>
              <p className="text-xs text-slate-400">Transform weak statements into high-impact, quantified STAR bullets.</p>
            </div>
          </div>
          <button
            onClick={() => { setIsAiModalOpen(false); setAiTargetBullet(null); }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Draft Experience Bullet Point
            </label>
            <textarea
              rows={3}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="e.g. Built frontend components and fixed bugs on dashboard..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#7FA8E8]/70 focus:ring-1 focus:ring-[#7FA8E8]/50"
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <input
              type="text"
              value={roleContext}
              onChange={(e) => setRoleContext(e.target.value)}
              placeholder="Optional role context (e.g. Frontend Engineer, Product Manager)"
              className="flex-1 px-3.5 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-[#7FA8E8]"
            />
            <button
              onClick={handleEnhance}
              disabled={isLoading || (!inputText && !aiTargetBullet?.text)}
              className="px-5 py-2 rounded-xl bg-[#F5F5F7] hover:bg-white text-[#06060A] font-semibold text-xs flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Enhancing...</span>
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4" />
                  <span>Generate Variations</span>
                </>
              )}
            </button>
          </div>

          {/* AI Variations Output */}
          {suggestions.length > 0 && (
            <div className="mt-6 space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">AI Suggested Formulations</h4>
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {suggestions.map((sug, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80 hover:border-[#7FA8E8]/40 transition-all group">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-[#7FA8E8] flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#7FA8E8]" />
                        {sug.title}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white/[0.06] text-[#7FA8E8] border border-white/10">
                        {sug.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed">{sug.text}</p>
                    <div className="mt-2 flex items-center justify-end gap-2 pt-2 border-t border-slate-800/50 opacity-90">
                      <button
                        onClick={() => handleCopy(sug.text, idx)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 text-[11px] font-medium text-slate-300 hover:text-white flex items-center gap-1"
                      >
                        {copiedIdx === idx ? <Check className="h-3 w-3 text-[#7FA8E8]" /> : <Copy className="h-3 w-3" />}
                        <span>{copiedIdx === idx ? 'Copied' : 'Copy'}</span>
                      </button>
                      <button
                        onClick={() => handleApplySuggestion(sug.text)}
                        className="px-2.5 py-1 rounded-lg bg-[#F5F5F7] text-[11px] font-semibold text-[#06060A] hover:bg-white flex items-center gap-1 shadow-sm"
                      >
                        <ArrowRight className="h-3 w-3" />
                        <span>Apply to Portfolio</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
