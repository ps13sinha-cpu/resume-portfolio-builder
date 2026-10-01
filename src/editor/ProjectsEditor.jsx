import React from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { FolderGit2, Plus, Trash2, ExternalLink, Image } from 'lucide-react';

export const ProjectsEditor = () => {
  const { portfolio, updatePortfolio } = usePortfolio();
  const projects = portfolio.projects || [];

  const handleUpdate = (id, field, value) => {
    updatePortfolio(prev => ({
      ...prev,
      projects: (prev.projects || []).map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  const handleTagsChange = (id, text) => {
    const tags = text.split(',').map(t => t.trim()).filter(Boolean);
    handleUpdate(id, 'techTags', tags);
  };

  const handleAdd = () => {
    const newProj = {
      id: `proj-${Date.now()}`,
      title: 'New Innovation Project',
      description: 'An interactive web application solving real-world challenges.',
      techTags: ['React', 'TypeScript', 'Node.js'],
      liveUrl: 'https://example.com',
      githubUrl: 'https://github.com',
      imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
      featured: true,
      order_index: projects.length
    };
    updatePortfolio(prev => ({ ...prev, projects: [...(prev.projects || []), newProj] }));
  };

  const handleRemove = (id) => {
    updatePortfolio(prev => ({
      ...prev,
      projects: (prev.projects || []).filter(item => item.id !== id)
    }));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-syne text-lg font-bold text-white flex items-center gap-2">
            <FolderGit2 className="w-5 h-5 text-[#7FA8E8]" />
            <span>Featured Projects</span>
          </h3>
          <p className="text-xs text-slate-400">Showcase your finest engineering works, tech stack tags, and links.</p>
        </div>
        <button
          onClick={handleAdd}
          className="px-3 py-1.5 rounded-xl bg-[#F5F5F7] hover:bg-white text-[#06060A] text-xs font-semibold flex items-center gap-1.5 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Project</span>
        </button>
      </div>

      <div className="space-y-5">
        {projects.map((proj) => (
          <div key={proj.id} className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-[#7FA8E8]">Project Card</span>
              <button onClick={() => handleRemove(proj.id)} className="text-slate-500 hover:text-rose-400">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Project Title</label>
                <input
                  type="text"
                  value={proj.title}
                  onChange={(e) => handleUpdate(proj.id, 'title', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-[#7FA8E8]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Description</label>
                <textarea
                  rows={2}
                  value={proj.description}
                  onChange={(e) => handleUpdate(proj.id, 'description', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-[#7FA8E8]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Tech Stack Tags (Comma Separated)</label>
                <input
                  type="text"
                  value={(proj.techTags || []).join(', ')}
                  onChange={(e) => handleTagsChange(proj.id, e.target.value)}
                  placeholder="React, TypeScript, Node.js, WebGL"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-[#7FA8E8] focus:outline-none focus:border-[#7FA8E8]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Live Demo URL</label>
                  <input
                    type="url"
                    value={proj.liveUrl || ''}
                    onChange={(e) => handleUpdate(proj.id, 'liveUrl', e.target.value)}
                    placeholder="https://example.com"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-[#7FA8E8]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">GitHub Repo URL</label>
                  <input
                    type="url"
                    value={proj.githubUrl || ''}
                    onChange={(e) => handleUpdate(proj.id, 'githubUrl', e.target.value)}
                    placeholder="https://github.com/..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-[#7FA8E8]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Project Thumbnail Image URL</label>
                <input
                  type="text"
                  value={proj.imageUrl || ''}
                  onChange={(e) => handleUpdate(proj.id, 'imageUrl', e.target.value)}
                  placeholder="https://images.unsplash.com/..."
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
