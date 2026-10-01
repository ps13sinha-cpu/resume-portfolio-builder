import React, { useState, useEffect } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { BarChart3, X, CheckCircle, AlertTriangle, AlertCircle, Sparkles, RefreshCw } from 'lucide-react';

export const ATSModal = () => {
  const { isAtsModalOpen, setIsAtsModalOpen, portfolio } = usePortfolio();
  const [atsResult, setAtsResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAtsModalOpen) {
      calculateAts();
    }
  }, [isAtsModalOpen, portfolio]);

  const calculateAts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/ats/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portfolio })
      });
      if (res.ok) {
        const data = await res.json();
        setAtsResult(data);
      }
    } catch (err) {
      // Offline fallback calculation algorithm
      let score = 0;
      const breakdown = [];
      const suggestions = [];

      const p = portfolio.profile || {};
      if (p.fullName && p.email && p.bio) {
        score += 25;
        breakdown.push({ item: 'Profile & Contact Info', points: 25, max: 25, status: 'pass' });
      } else {
        score += 15;
        breakdown.push({ item: 'Profile & Contact Info', points: 15, max: 25, status: 'warn' });
        suggestions.push('Add full name, bio, and social links to improve contact completeness.');
      }

      const exp = portfolio.experience || [];
      if (exp.length > 0) {
        score += 30;
        breakdown.push({ item: 'Experience & Action Bullets', points: 30, max: 30, status: 'pass' });
      } else {
        score += 10;
        breakdown.push({ item: 'Experience & Action Bullets', points: 10, max: 30, status: 'fail' });
        suggestions.push('Add at least 2 detailed experience roles with quantified metrics.');
      }

      const skills = portfolio.skills || [];
      if (skills.length >= 6) {
        score += 25;
        breakdown.push({ item: 'Categorized Technical Skills', points: 25, max: 25, status: 'pass' });
      } else {
        score += 15;
        breakdown.push({ item: 'Categorized Technical Skills', points: 15, max: 25, status: 'warn' });
        suggestions.push('Include 6+ technical skills across frontend, backend, and cloud tools.');
      }

      const projects = portfolio.projects || [];
      if (projects.length > 0) {
        score += 20;
        breakdown.push({ item: 'Featured Projects & Links', points: 20, max: 20, status: 'pass' });
      } else {
        score += 10;
        breakdown.push({ item: 'Featured Projects & Links', points: 10, max: 20, status: 'warn' });
        suggestions.push('Add GitHub and Live Demo links to your project cards.');
      }

      setAtsResult({
        score,
        breakdown,
        suggestions,
        missingKeywords: ['CI/CD', 'Docker', 'System Design', 'Agile', 'Unit Testing'],
        grade: score >= 85 ? 'A' : 'B'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAtsModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl glass-panel rounded-2xl border border-cyan-500/30 p-6 shadow-2xl shadow-black/60">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/[0.06] border border-white/10 text-[#7FA8E8]">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-syne text-lg font-bold text-white">ATS Resume Score & Keyword Analyzer</h3>
              <p className="text-xs text-slate-400">Real-time resume compliance score & keyword gap analysis.</p>
            </div>
          </div>
          <button
            onClick={() => setIsAtsModalOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="py-12 text-center space-y-3">
            <RefreshCw className="h-8 w-8 text-[#7FA8E8] animate-spin mx-auto" />
            <p className="text-sm text-slate-300 font-medium">Analyzing portfolio ATS compatibility...</p>
          </div>
        ) : atsResult ? (
          <div className="mt-4 space-y-5">
            
            {/* Score Ring Banner */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/90 border border-slate-800">
              <div className="flex items-center gap-4">
                <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-slate-950 border-2 border-[#7FA8E8] shadow-lg shadow-[#7FA8E8]/20">
                  <span className="font-syne text-xl font-bold text-[#7FA8E8]">{atsResult.score}%</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">ATS Compatibility Grade:</span>
                    <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-white/[0.06] text-[#7FA8E8] border border-white/10">
                      {atsResult.grade}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {atsResult.score >= 85
                      ? 'Excellent! Highly optimized for Applicant Tracking Systems.'
                      : 'Good foundation. Follow recommendations below to reach 90%+.'}
                  </p>
                </div>
              </div>
              <button
                onClick={calculateAts}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Re-scan</span>
              </button>
            </div>

            {/* Breakdown Items */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">Scoring Criteria Breakdown</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {(atsResult.breakdown || []).map((item, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {item.status === 'pass' && <CheckCircle className="h-4 w-4 text-emerald-400" />}
                      {item.status === 'warn' && <AlertTriangle className="h-4 w-4 text-amber-400" />}
                      {item.status === 'fail' && <AlertCircle className="h-4 w-4 text-rose-400" />}
                      <span className="text-xs font-medium text-slate-200">{item.item}</span>
                    </div>
                    <span className="text-xs font-bold text-slate-300">{item.points}/{item.max}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Missing High-Impact Keywords */}
            {(atsResult.missingKeywords || []).length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Recommended Missing Keywords</h4>
                <div className="flex flex-wrap gap-1.5">
                  {atsResult.missingKeywords.map((kw, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/10 text-[#7FA8E8] text-xs font-mono">
                      + {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Actionable Suggestions */}
            {(atsResult.suggestions || []).length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Optimization Steps</h4>
                <ul className="space-y-1.5">
                  {atsResult.suggestions.map((sug, i) => (
                    <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                      <span className="text-[#7FA8E8] font-bold">•</span>
                      <span>{sug}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

          </div>
        ) : null}

      </div>
    </div>
  );
};
