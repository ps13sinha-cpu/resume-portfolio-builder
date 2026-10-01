import React from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { GraduationCap, Plus, Trash2 } from 'lucide-react';

export const EducationEditor = () => {
  const { portfolio, updatePortfolio } = usePortfolio();
  const education = portfolio.education || [];

  const handleUpdate = (id, field, value) => {
    updatePortfolio(prev => ({
      ...prev,
      education: (prev.education || []).map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  const handleAdd = () => {
    const newEdu = {
      id: `edu-${Date.now()}`,
      institution: 'University Name',
      degree: 'Bachelor of Science',
      field: 'Computer Science',
      start: '2019',
      end: '2023',
      grade: '3.8 / 4.0',
      description: 'Relevant coursework in Algorithms and Web Architecture.',
      order_index: education.length
    };
    updatePortfolio(prev => ({ ...prev, education: [...(prev.education || []), newEdu] }));
  };

  const handleRemove = (id) => {
    updatePortfolio(prev => ({
      ...prev,
      education: (prev.education || []).filter(item => item.id !== id)
    }));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-syne text-lg font-bold text-white flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-[#7FA8E8]" />
            <span>Education</span>
          </h3>
          <p className="text-xs text-slate-400">Academic qualifications, degrees, and grade honors.</p>
        </div>
        <button
          onClick={handleAdd}
          className="px-3 py-1.5 rounded-xl bg-[#F5F5F7] hover:bg-white text-[#06060A] text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>Add Education</span>
        </button>
      </div>

      <div className="space-y-4">
        {education.map((edu) => (
          <div key={edu.id} className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-[#7FA8E8]">Education Entry</span>
              <button onClick={() => handleRemove(edu.id)} className="text-slate-500 hover:text-rose-400">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Institution</label>
                <input
                  type="text"
                  value={edu.institution}
                  onChange={(e) => handleUpdate(edu.id, 'institution', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-[#7FA8E8]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Degree</label>
                <input
                  type="text"
                  value={edu.degree}
                  onChange={(e) => handleUpdate(edu.id, 'degree', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-[#7FA8E8]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Field of Study</label>
                <input
                  type="text"
                  value={edu.field}
                  onChange={(e) => handleUpdate(edu.id, 'field', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-[#7FA8E8]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Grade / CGPA</label>
                <input
                  type="text"
                  value={edu.grade || ''}
                  onChange={(e) => handleUpdate(edu.id, 'grade', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-[#7FA8E8]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Start Date</label>
                <input
                  type="text"
                  value={edu.start}
                  onChange={(e) => handleUpdate(edu.id, 'start', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-[#7FA8E8]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">End Date</label>
                <input
                  type="text"
                  value={edu.end}
                  onChange={(e) => handleUpdate(edu.id, 'end', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-[#7FA8E8]"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
