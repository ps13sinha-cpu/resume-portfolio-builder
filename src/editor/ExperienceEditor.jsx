import React from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { Briefcase, Plus, Trash2, Sparkles, ArrowUp, ArrowDown } from 'lucide-react';

export const ExperienceEditor = () => {
  const { portfolio, updatePortfolio, setIsAiModalOpen, setAiTargetBullet } = usePortfolio();
  const experiences = portfolio.experience || [];

  const handleUpdate = (id, field, value) => {
    updatePortfolio(prev => ({
      ...prev,
      experience: (prev.experience || []).map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleAddExperience = () => {
    const newExp = {
      id: `exp-${Date.now()}`,
      company: 'New Company',
      role: 'Software Engineer',
      start: '2023-01',
      end: 'Present',
      isCurrent: true,
      bullets: ['Architected core feature modules and improved codebase performance.'],
      order_index: experiences.length
    };
    updatePortfolio(prev => ({
      ...prev,
      experience: [...(prev.experience || []), newExp]
    }));
  };

  const handleRemove = (id) => {
    updatePortfolio(prev => ({
      ...prev,
      experience: (prev.experience || []).filter(item => item.id !== id)
    }));
  };

  const handleBulletChange = (expId, bulletIdx, value) => {
    updatePortfolio(prev => ({
      ...prev,
      experience: (prev.experience || []).map(item => {
        if (item.id === expId) {
          const updatedBullets = [...(item.bullets || [])];
          updatedBullets[bulletIdx] = value;
          return { ...item, bullets: updatedBullets };
        }
        return item;
      })
    }));
  };

  const handleAddBullet = (expId) => {
    updatePortfolio(prev => ({
      ...prev,
      experience: (prev.experience || []).map(item => {
        if (item.id === expId) {
          return { ...item, bullets: [...(item.bullets || []), 'New accomplishment bullet point...'] };
        }
        return item;
      })
    }));
  };

  const handleRemoveBullet = (expId, bulletIdx) => {
    updatePortfolio(prev => ({
      ...prev,
      experience: (prev.experience || []).map(item => {
        if (item.id === expId) {
          const updatedBullets = (item.bullets || []).filter((_, idx) => idx !== bulletIdx);
          return { ...item, bullets: updatedBullets };
        }
        return item;
      })
    }));
  };

  const openAiForBullet = (expId, bulletIdx, text) => {
    setAiTargetBullet({ expId, bulletIdx, text });
    setIsAiModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-syne text-lg font-bold text-white flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-[#7FA8E8]" />
            <span>Work Experience</span>
          </h3>
          <p className="text-xs text-slate-400">Manage roles, responsibilities, and AI bullet points.</p>
        </div>
        <button
          onClick={handleAddExperience}
          className="px-3 py-1.5 rounded-xl bg-[#F5F5F7] hover:bg-white text-[#06060A] text-xs font-semibold flex items-center gap-1.5 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Position</span>
        </button>
      </div>

      <div className="space-y-6">
        {experiences.map((exp, expIdx) => (
          <div key={exp.id} className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 relative group">
            
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <span className="text-xs font-bold text-[#7FA8E8] uppercase tracking-wider">Role #{expIdx + 1}</span>
              <button
                onClick={() => handleRemove(exp.id)}
                className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                title="Delete Experience"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Company Name</label>
                <input
                  type="text"
                  value={exp.company}
                  onChange={(e) => handleUpdate(exp.id, 'company', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-[#7FA8E8]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Job Title / Role</label>
                <input
                  type="text"
                  value={exp.role}
                  onChange={(e) => handleUpdate(exp.id, 'role', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-[#7FA8E8]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Start Date</label>
                <input
                  type="text"
                  value={exp.start}
                  onChange={(e) => handleUpdate(exp.id, 'start', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-[#7FA8E8]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">End Date</label>
                <input
                  type="text"
                  value={exp.end}
                  disabled={exp.isCurrent}
                  onChange={(e) => handleUpdate(exp.id, 'end', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white disabled:opacity-40 focus:outline-none focus:border-[#7FA8E8]"
                />
              </div>
            </div>

            {/* Current job toggle */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`curr-${exp.id}`}
                checked={exp.isCurrent || false}
                onChange={(e) => handleUpdate(exp.id, 'isCurrent', e.target.checked)}
                className="rounded border-slate-800 bg-slate-950 text-[#7FA8E8] focus:ring-[#7FA8E8]"
              />
              <label htmlFor={`curr-${exp.id}`} className="text-xs text-slate-300 font-medium">Currently working in this role</label>
            </div>

            {/* Bullets List */}
            <div className="space-y-2 pt-2 border-t border-slate-800/60">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Bullet Achievements</span>
                <button
                  onClick={() => handleAddBullet(exp.id)}
                  className="text-[11px] font-semibold text-[#7FA8E8] hover:text-[#a8c4ef] flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Bullet</span>
                </button>
              </div>

              {(exp.bullets || []).map((bullet, bIdx) => (
                <div key={bIdx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={bullet}
                    onChange={(e) => handleBulletChange(exp.id, bIdx, e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-[#7FA8E8]"
                  />
                  {/* AI Rewrite Button */}
                  <button
                    onClick={() => openAiForBullet(exp.id, bIdx, bullet)}
                    className="p-1.5 rounded-lg border text-[#7FA8E8] hover:bg-white/10 transition-all"
                    title="Improve with AI"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleRemoveBullet(exp.id, bIdx)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

          </div>
        ))}
      </div>
    </div>
  );
};
