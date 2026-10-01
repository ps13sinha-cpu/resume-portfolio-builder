import React from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { Award, Plus, Trash2 } from 'lucide-react';

export const CertificationsEditor = () => {
  const { portfolio, updatePortfolio } = usePortfolio();
  const certifications = portfolio.certifications || [];

  const handleUpdate = (id, field, value) => {
    updatePortfolio(prev => ({
      ...prev,
      certifications: (prev.certifications || []).map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  const handleAdd = () => {
    const newCert = {
      id: `cert-${Date.now()}`,
      name: 'AWS Solutions Architect',
      issuer: 'Amazon Web Services',
      date: '2023-09',
      credentialUrl: 'https://aws.amazon.com/verification',
      order_index: certifications.length
    };
    updatePortfolio(prev => ({ ...prev, certifications: [...(prev.certifications || []), newCert] }));
  };

  const handleRemove = (id) => {
    updatePortfolio(prev => ({
      ...prev,
      certifications: (prev.certifications || []).filter(item => item.id !== id)
    }));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-syne text-lg font-bold text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-[#7FA8E8]" />
            <span>Certifications & Honors</span>
          </h3>
          <p className="text-xs text-slate-400">Verified credentials, cloud certifications, and awards.</p>
        </div>
        <button
          onClick={handleAdd}
          className="px-3 py-1.5 rounded-xl bg-[#F5F5F7] hover:bg-white text-[#06060A] text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>Add Certification</span>
        </button>
      </div>

      <div className="space-y-4">
        {certifications.map((cert) => (
          <div key={cert.id} className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-[#7FA8E8]">Certification Entry</span>
              <button onClick={() => handleRemove(cert.id)} className="text-slate-500 hover:text-rose-400">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Certification Name</label>
                <input
                  type="text"
                  value={cert.name}
                  onChange={(e) => handleUpdate(cert.id, 'name', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-[#7FA8E8]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Issuing Organization</label>
                <input
                  type="text"
                  value={cert.issuer}
                  onChange={(e) => handleUpdate(cert.id, 'issuer', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-[#7FA8E8]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Issue Date</label>
                <input
                  type="text"
                  value={cert.date}
                  onChange={(e) => handleUpdate(cert.id, 'date', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-[#7FA8E8]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Credential URL</label>
                <input
                  type="url"
                  value={cert.credentialUrl || ''}
                  onChange={(e) => handleUpdate(cert.id, 'credentialUrl', e.target.value)}
                  placeholder="https://..."
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
