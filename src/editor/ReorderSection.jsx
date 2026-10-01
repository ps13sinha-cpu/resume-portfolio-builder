import React, { useState } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { ArrowUp, ArrowDown, GripVertical, Check, Layers } from 'lucide-react';

export const ReorderSection = () => {
  const { portfolio, reorderSectionItems } = usePortfolio();
  const [selectedSection, setSelectedSection] = useState('projects');

  const sectionsMap = {
    projects: { label: 'Featured Projects', items: portfolio.projects || [] },
    experience: { label: 'Work Experience', items: portfolio.experience || [] },
    skills: { label: 'Skills & Tech Stack', items: portfolio.skills || [] },
    education: { label: 'Education Entries', items: portfolio.education || [] }
  };

  const currentItems = sectionsMap[selectedSection]?.items || [];

  const handleMove = (index, direction) => {
    const newItems = [...currentItems];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;

    if (targetIdx < 0 || targetIdx >= newItems.length) return;

    const temp = newItems[index];
    newItems[index] = newItems[targetIdx];
    newItems[targetIdx] = temp;

    // Update order_index
    const reordered = newItems.map((item, i) => ({ ...item, order_index: i }));
    reorderSectionItems(selectedSection, reordered);
  };

  const getItemLabel = (item) => {
    if (item.title) return item.title;
    if (item.role && item.company) return `${item.role} @ ${item.company}`;
    if (item.name) return item.name;
    if (item.degree && item.institution) return `${item.degree} — ${item.institution}`;
    return 'Item';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h3 className="font-syne text-lg font-bold text-white flex items-center gap-2">
          <Layers className="w-5 h-5 text-[#7FA8E8]" />
          <span>Drag & Reorder Manager</span>
        </h3>
        <p className="text-xs text-slate-400">Reorder items within any section with batch order index persistence.</p>
      </div>

      {/* Section selector tabs */}
      <div className="flex flex-wrap gap-2 p-1 bg-slate-900/90 rounded-xl border border-slate-800">
        {Object.entries(sectionsMap).map(([key, sec]) => (
          <button
            key={key}
            onClick={() => setSelectedSection(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedSection === key
                ? 'bg-[#F5F5F7] text-[#06060A] shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {sec.label} ({sec.items.length})
          </button>
        ))}
      </div>

      {/* Reorder List */}
      <div className="space-y-2">
        {currentItems.map((item, idx) => (
          <div
            key={item.id || idx}
            className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3 group hover:border-[#7FA8E8]/50 transition-all"
          >
            <div className="flex items-center gap-3">
              <GripVertical className="w-4 h-4 text-slate-600 group-hover:text-[#7FA8E8] transition-colors cursor-grab" />
              <span className="w-6 h-6 rounded-md bg-slate-950 flex items-center justify-center text-xs font-mono font-bold text-[#7FA8E8]">
                #{idx + 1}
              </span>
              <span className="text-xs font-semibold text-slate-200">{getItemLabel(item)}</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => handleMove(idx, 'up')}
                disabled={idx === 0}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white disabled:opacity-30 disabled:hover:text-slate-300"
                title="Move Up"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleMove(idx, 'down')}
                disabled={idx === currentItems.length - 1}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white disabled:opacity-30 disabled:hover:text-slate-300"
                title="Move Down"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
