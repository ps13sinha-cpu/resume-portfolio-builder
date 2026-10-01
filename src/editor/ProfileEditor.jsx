import React from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { User, Mail, Github, Linkedin, Twitter, MapPin, Sparkles, Image, Globe } from 'lucide-react';

export const ProfileEditor = () => {
  const { portfolio, updatePortfolio } = usePortfolio();
  const profile = portfolio.profile || {};

  const handleChange = (field, value) => {
    updatePortfolio(prev => ({
      ...prev,
      profile: {
        ...(prev.profile || {}),
        [field]: value
      }
    }));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h3 className="font-syne text-lg font-bold text-white flex items-center gap-2">
          <User className="w-5 h-5 text-[#7FA8E8]" />
          <span>Profile & Bio Information</span>
        </h3>
        <p className="text-xs text-slate-400">Personal branding, tagline, and contact channels.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* Full Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Full Name
          </label>
          <input
            type="text"
            value={profile.fullName || ''}
            onChange={(e) => handleChange('fullName', e.target.value)}
            placeholder="Piyush Sharma"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-[#7FA8E8]"
          />
        </div>

        {/* Professional Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Professional Title / Role
          </label>
          <input
            type="text"
            value={profile.title || ''}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="Senior Full-Stack Architect"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-[#7FA8E8]"
          />
        </div>

        {/* Status Pill */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Availability / Status Pill
          </label>
          <input
            type="text"
            value={profile.statusPill || ''}
            onChange={(e) => handleChange('statusPill', e.target.value)}
            placeholder="🚀 Open for High-Impact Roles"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-[#7FA8E8] font-medium focus:outline-none focus:border-[#7FA8E8]"
          />
        </div>

        {/* Bio */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Professional Bio Statement
          </label>
          <textarea
            rows={3}
            value={profile.bio || ''}
            onChange={(e) => handleChange('bio', e.target.value)}
            placeholder="Describe your expertise, tech stack, and career passion..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-[#7FA8E8]"
          />
        </div>

        {/* Avatar Image URL */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Avatar Image URL
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={profile.avatarUrl || ''}
              onChange={(e) => handleChange('avatarUrl', e.target.value)}
              placeholder="https://images.unsplash.com/photo-..."
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-[#7FA8E8]"
            />
            {profile.avatarUrl && (
              <img src={profile.avatarUrl} alt="Avatar Preview" className="w-10 h-10 rounded-xl object-cover border border-slate-700" />
            )}
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Location
          </label>
          <input
            type="text"
            value={profile.location || ''}
            onChange={(e) => handleChange('location', e.target.value)}
            placeholder="San Francisco, CA"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-[#7FA8E8]"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Email Address
          </label>
          <input
            type="email"
            value={profile.email || ''}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="piyush@example.com"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-[#7FA8E8]"
          />
        </div>

        {/* GitHub */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            GitHub URL
          </label>
          <input
            type="url"
            value={profile.github || ''}
            onChange={(e) => handleChange('github', e.target.value)}
            placeholder="https://github.com/username"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-[#7FA8E8]"
          />
        </div>

        {/* LinkedIn */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            LinkedIn URL
          </label>
          <input
            type="url"
            value={profile.linkedin || ''}
            onChange={(e) => handleChange('linkedin', e.target.value)}
            placeholder="https://linkedin.com/in/username"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-[#7FA8E8]"
          />
        </div>

      </div>
    </div>
  );
};
