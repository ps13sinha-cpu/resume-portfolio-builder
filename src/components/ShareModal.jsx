import React, { useState } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { Globe, X, Copy, Check, ExternalLink, Lock, Eye, QrCode } from 'lucide-react';

export const ShareModal = () => {
  const { isShareModalOpen, setIsShareModalOpen, portfolio, updatePortfolio, triggerPublishConfetti } = usePortfolio();
  
  const [slugInput, setSlugInput] = useState(portfolio.slug || 'piyush-dev');
  const [isCopied, setIsCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [slugError, setSlugError] = useState('');

  if (!isShareModalOpen) return null;

  const publicUrl = `${window.location.origin}/#p/${portfolio.slug || slugInput}`;

  const handleSaveSlug = () => {
    const cleanSlug = slugInput.toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (!cleanSlug) {
      setSlugError('Slug cannot be empty.');
      return;
    }
    setSlugError('');
    updatePortfolio({ slug: cleanSlug });
    triggerPublishConfetti();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const toggleVisibility = () => {
    const nextPublic = !portfolio.is_public;
    updatePortfolio({ is_public: nextPublic });
    if (nextPublic) {
      triggerPublishConfetti();
    }
  };

  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(publicUrl)}&color=818cf8&bgcolor=0f172a`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl glass-panel rounded-2xl border border-white/10 p-6 shadow-2xl shadow-black/60">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/[0.06] border border-white/10 text-[#7FA8E8]">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-syne text-lg font-bold text-white">Share Portfolio & Public Slug</h3>
              <p className="text-xs text-slate-400">Manage your shareable web link and visibility settings.</p>
            </div>
          </div>
          <button
            onClick={() => setIsShareModalOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-4 space-y-5">
          
          {/* Visibility Toggle Card */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${portfolio.is_public ? 'bg-white/[0.06] text-[#7FA8E8]' : 'bg-rose-500/10 text-rose-400'}`}>
                {portfolio.is_public ? <Eye className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Portfolio Visibility</h4>
                <p className="text-xs text-slate-400">
                  {portfolio.is_public
                    ? 'Public — Anyone with the link can view your portfolio'
                    : 'Private — Portfolio is hidden from public access'}
                </p>
              </div>
            </div>
            <button
              onClick={toggleVisibility}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                portfolio.is_public
                  ? 'bg-[#7FA8E8] hover:bg-[#a8c4ef] text-[#06060A]'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              {portfolio.is_public ? 'Public' : 'Private'}
            </button>
          </div>

          {/* Custom Slug Config */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Custom URL Slug
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus-within:border-[#7FA8E8]">
                <span className="text-xs text-slate-500 font-mono select-none">{window.location.host}/#p/</span>
                <input
                  type="text"
                  value={slugInput}
                  onChange={(e) => setSlugInput(e.target.value)}
                  className="flex-1 bg-transparent text-xs font-mono text-[#7FA8E8] focus:outline-none ml-1"
                  placeholder="your-custom-slug"
                />
              </div>
              <button
                onClick={handleSaveSlug}
                className="px-4 py-2.5 rounded-xl bg-[#F5F5F7] hover:bg-white text-[#06060A] text-xs font-semibold transition-all"
              >
                Save
              </button>
            </div>
            {slugError && <p className="text-xs text-rose-400 mt-1">{slugError}</p>}
          </div>

          {/* Copyable Share Link & QR code toggle */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Shareable Web Link</span>
              <button
                onClick={() => setShowQr(!showQr)}
                className="text-xs text-[#7FA8E8] hover:text-[#a8c4ef] flex items-center gap-1"
              >
                <QrCode className="h-3.5 w-3.5" />
                <span>{showQr ? 'Hide QR Code' : 'Show QR Code'}</span>
              </button>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-xs text-slate-300 font-mono truncate mr-2">{publicUrl}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-[#7FA8E8] text-xs font-semibold flex items-center gap-1 transition-all"
                >
                  {isCopied ? <Check className="h-3.5 w-3.5 text-[#7FA8E8]" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{isCopied ? 'Copied!' : 'Copy'}</span>
                </button>
                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                  title="Open in new tab"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>

            {/* QR Code Container */}
            {showQr && (
              <div className="pt-3 border-t border-slate-800/60 flex flex-col items-center justify-center space-y-2 animate-fade-in">
                <img
                  src={qrApiUrl}
                  alt="Portfolio QR Code"
                  className="w-40 h-40 rounded-xl border border-white/15 shadow-lg"
                />
                <p className="text-[11px] text-slate-400">Scan with mobile camera to view live portfolio</p>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
