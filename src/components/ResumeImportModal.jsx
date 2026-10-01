import React, { useState } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { 
  X, 
  Upload, 
  Sparkles, 
  FileText, 
  Check, 
  AlertCircle, 
  Loader2, 
  ArrowRight,
  Code2,
  FileCode
} from 'lucide-react';
import { extractResumeText, normalizeText } from '../utils/resumeExtraction';
import { SPOT_BLUE, CHROME_MID, PAPER, INK } from './CinematicStage';

export const ResumeImportModal = () => {
  const { 
    isResumeModalOpen, 
    setIsResumeModalOpen, 
    portfolio, 
    updatePortfolio, 
    triggerPublishConfetti 
  } = usePortfolio();

  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'paste'
  const [pastedText, setPastedText] = useState('');
  const [loadingStage, setLoadingStage] = useState(null); // 'reading' | 'structuring' | 'saving'
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isResumeModalOpen) return null;

  const handleClose = () => {
    if (loadingStage) return;
    setError('');
    setSuccessMsg('');
    setIsResumeModalOpen(false);
  };

  const processAndApplyData = async (rawStructured) => {
    setLoadingStage('saving');
    const p = rawStructured.profile || {};
    
    const patch = {
      profile: {
        ...(portfolio.profile || {}),
        fullName: p.fullName || portfolio.profile?.fullName || '',
        title: p.title || portfolio.profile?.title || '',
        email: p.email || portfolio.profile?.email || '',
        phone: p.phone || portfolio.profile?.phone || '',
        location: p.location || portfolio.profile?.location || '',
        github: p.githubUrl || portfolio.profile?.github || '',
        linkedin: p.linkedinUrl || portfolio.profile?.linkedin || '',
        website: p.websiteUrl || portfolio.profile?.website || '',
        bio: p.bio || portfolio.profile?.bio || '',
      }
    };

    if (rawStructured.experience && rawStructured.experience.length > 0) {
      patch.experience = rawStructured.experience.map((j, i) => ({
        id: `exp-${Date.now()}-${i}`,
        company: j.company || '',
        role: j.role || '',
        start: j.startDate || '',
        end: j.endDate || (j.isCurrent ? 'Present' : ''),
        isCurrent: !!j.isCurrent,
        location: '',
        bullets: (j.bullets || []).filter(Boolean),
        order_index: i
      }));
    }

    if (rawStructured.education && rawStructured.education.length > 0) {
      patch.education = rawStructured.education.map((ed, i) => ({
        id: `edu-${Date.now()}-${i}`,
        institution: ed.institution || '',
        degree: ed.degree || '',
        field: ed.field || '',
        start: ed.startDate || '',
        end: ed.endDate || '',
        grade: ed.grade || '',
        description: '',
        order_index: i
      }));
    }

    if (rawStructured.skills && rawStructured.skills.length > 0) {
      patch.skills = rawStructured.skills.map((s, i) => ({
        id: `sk-${Date.now()}-${i}`,
        name: s.name,
        category: s.category || 'Core',
        level: 85,
        order_index: i
      }));
    }

    if (rawStructured.projects && rawStructured.projects.length > 0) {
      patch.projects = rawStructured.projects.map((pr, i) => ({
        id: `proj-${Date.now()}-${i}`,
        title: pr.title,
        description: pr.description || '',
        techTags: pr.techStack || [],
        liveUrl: pr.liveUrl || '',
        githubUrl: pr.githubUrl || '',
        imageUrl: '',
        featured: i < 2,
        order_index: i
      }));
    }

    if (rawStructured.certifications && rawStructured.certifications.length > 0) {
      patch.certifications = rawStructured.certifications.map((c, i) => ({
        id: `cert-${Date.now()}-${i}`,
        name: c.name,
        issuer: c.issuer || '',
        date: c.date || '',
        credentialUrl: c.credentialUrl || '',
        order_index: i
      }));
    }

    await updatePortfolio(patch);
    triggerPublishConfetti();
    setSuccessMsg(`Extracted resume data successfully! Portfolio website rebuilt on template: ${portfolio.layout_id}`);
    
    setTimeout(() => {
      handleClose();
    }, 1200);
  };

  const handleRunExtraction = async (text, kind) => {
    setError('');
    setLoadingStage('structuring');

    try {
      const res = await fetch('/api/parse-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, kind })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message || 'Failed to structure resume with AI.');
      }

      const result = await res.json();
      if (!result.data) {
        throw new Error('No structured data returned.');
      }

      await processAndApplyData(result.data);
    } catch (err) {
      console.error('Resume structuring error:', err);
      setError(err.message || 'Error processing resume.');
    } finally {
      setLoadingStage(null);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || loadingStage) return;
    e.target.value = '';

    // If JSON export, parse directly
    if (file.name.toLowerCase().endsWith('.json')) {
      try {
        const raw = await file.text();
        const parsed = JSON.parse(raw);
        await processAndApplyData(parsed);
        return;
      } catch (err) {
        setError('Invalid JSON resume format.');
        return;
      }
    }

    setError('');
    setLoadingStage('reading');
    try {
      const { text, kind } = await extractResumeText(file);
      if (!text || text.trim().length < 30) {
        throw new Error('Not enough readable text found in file.');
      }
      await handleRunExtraction(text, kind);
    } catch (err) {
      setError(err.message || 'Failed to read file.');
      setLoadingStage(null);
    }
  };

  const handlePasteSubmit = () => {
    if (!pastedText.trim() || loadingStage) return;
    const norm = normalizeText(pastedText);
    if (norm.length < 30) {
      setError('Please paste more resume content (at least 30 characters).');
      return;
    }
    handleRunExtraction(norm, 'paste');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-xl rounded-2xl p-6 sm:p-7 space-y-6 shadow-2xl border"
        style={{
          background: 'rgba(18, 18, 24, 0.95)',
          borderColor: 'rgba(255, 255, 255, 0.12)',
          boxShadow: '0 25px 70px rgba(0, 0, 0, 0.85)'
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div 
              className="p-2.5 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(127, 168, 232, 0.15)', border: '1px solid rgba(127, 168, 232, 0.3)' }}
            >
              <FileText className="w-5 h-5 text-[#7FA8E8]" />
            </div>
            <div>
              <h3 className="font-syne text-lg font-bold text-white flex items-center gap-2">
                <span>Extract Resume Data</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-[#7FA8E8] bg-[#7FA8E8]/10 border border-[#7FA8E8]/25">
                  AI-Powered
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Upload or paste your resume to auto-populate all sections and rebuild the active template.
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex rounded-lg p-1 bg-black/40 border border-white/10">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-2 text-xs font-semibold rounded-md flex items-center justify-center gap-2 transition-all ${
              activeTab === 'upload' ? 'bg-white/10 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Document (PDF / DOCX)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('paste')}
            className={`flex-1 py-2 text-xs font-semibold rounded-md flex items-center justify-center gap-2 transition-all ${
              activeTab === 'paste' ? 'bg-white/10 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Paste Resume Text</span>
          </button>
        </div>

        {/* Tab content */}
        {activeTab === 'upload' ? (
          <div className="space-y-4">
            <div 
              className="p-8 rounded-xl border-2 border-dashed flex flex-col items-center justify-center text-center space-y-3 transition-colors hover:border-[#7FA8E8]/50"
              style={{ borderColor: 'rgba(255, 255, 255, 0.15)', background: 'rgba(0,0,0,0.2)' }}
            >
              <Upload className="w-8 h-8 text-slate-400" />
              <div>
                <p className="text-sm font-semibold text-white">Select your resume file</p>
                <p className="text-xs text-slate-400 mt-0.5">Supports PDF, DOCX, TXT, or JSON exports</p>
              </div>
              <label 
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[3px] text-xs font-bold uppercase tracking-wider bg-white text-black hover:bg-slate-200 cursor-pointer transition-all active:scale-95"
              >
                <span>Choose File</span>
                <input 
                  type="file" 
                  accept=".pdf,.docx,.doc,.txt,.json" 
                  onChange={handleFileUpload} 
                  className="hidden" 
                  disabled={!!loadingStage}
                />
              </label>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <textarea
              rows={7}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Paste your resume contents or LinkedIn profile summary here..."
              disabled={!!loadingStage}
              className="w-full p-3.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#7FA8E8] transition-colors resize-none font-mono"
            />
            <button
              onClick={handlePasteSubmit}
              disabled={!pastedText.trim() || !!loadingStage}
              className="w-full py-3 rounded-[3px] text-xs font-bold uppercase tracking-wider bg-white text-black hover:bg-slate-200 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Extract & Build Portfolio Website</span>
            </button>
          </div>
        )}

        {/* Loading state indicator */}
        {loadingStage && (
          <div className="p-4 rounded-xl flex items-center gap-3 bg-[#7FA8E8]/10 border border-[#7FA8E8]/30 text-xs text-slate-200">
            <Loader2 className="w-4 h-4 animate-spin text-[#7FA8E8] shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-white">
                {loadingStage === 'reading' && 'Reading resume document…'}
                {loadingStage === 'structuring' && 'Structuring experience, skills, and projects with AI…'}
                {loadingStage === 'saving' && 'Injecting data into active template and rebuilding site…'}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">This takes just a few seconds.</p>
            </div>
          </div>
        )}

        {/* Success message */}
        {successMsg && (
          <div className="p-4 rounded-xl flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300">
            <Check className="w-4 h-4 shrink-0 text-emerald-400" />
            <p className="font-medium">{successMsg}</p>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="p-4 rounded-xl flex items-start gap-3 bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <p className="font-medium">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};
