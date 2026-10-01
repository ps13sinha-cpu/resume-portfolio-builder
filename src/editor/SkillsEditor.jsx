import React from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { Sparkles, Plus, Trash2, Sliders } from 'lucide-react';

export const SkillsEditor = () => {
  const { portfolio, updatePortfolio } = usePortfolio();
  const skills = portfolio.skills || [];

  const handleUpdate = (id, field, value) => {
    updatePortfolio(prev => ({
      ...prev,
      skills: (prev.skills || []).map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  const handleAdd = () => {
    const newSkill = {
      id: `sk-${Date.now()}`,
      name: 'New Technology',
      category: 'Frontend',
      level: 90,
      order_index: skills.length
    };
    updatePortfolio(prev => ({ ...prev, skills: [...(prev.skills || []), newSkill] }));
  };

  const handleRemove = (id) => {
    updatePortfolio(prev => ({
      ...prev,
      skills: (prev.skills || []).filter(item => item.id !== id)
    }));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-syne text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#7FA8E8]" />
            <span>Skills & Tech Stack</span>
          </h3>
          <p className="text-xs text-slate-400">Technical stack, frameworks, tools, and proficiency levels.</p>
        </div>
        <button
          onClick={handleAdd}
          className="px-3 py-1.5 rounded-xl bg-[#F5F5F7] hover:bg-white text-[#06060A] text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>Add Skill</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {skills.map((sk) => (
          <div key={sk.id} className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 relative group">
            <div className="flex items-center justify-between gap-2">
              <input
                type="text"
                value={sk.name}
                onChange={(e) => handleUpdate(sk.id, 'name', e.target.value)}
                className="font-bold text-xs text-white bg-transparent border-b border-transparent hover:border-slate-700 focus:border-[#7FA8E8] focus:outline-none"
              />
              <button onClick={() => handleRemove(sk.id)} className="text-slate-500 hover:text-rose-400 p-1">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center justify-between gap-2">
              <input
                type="text"
                value={sk.category || 'Frontend'}
                onChange={(e) => handleUpdate(sk.id, 'category', e.target.value)}
                placeholder="Category"
                className="text-[10px] font-mono text-[#7FA8E8] bg-slate-950 px-2 py-0.5 rounded border border-slate-800 focus:outline-none"
              />
              <span className="text-[11px] font-mono font-bold text-slate-300">{sk.level || 90}%</span>
            </div>

            {/* Range Slider */}
            <input
              type="range"
              min="10"
              max="100"
              value={sk.level || 90}
              onChange={(e) => handleUpdate(sk.id, 'level', parseInt(e.target.value))}
              className="w-full accent-[#7FA8E8] h-1 bg-slate-800 rounded appearance-none cursor-pointer"
            />
          </div>
        ))}
      </div>
    </div>
  );
};
