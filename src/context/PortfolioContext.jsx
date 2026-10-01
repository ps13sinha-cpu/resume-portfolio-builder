import React, { createContext, useContext, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { samplePortfolios } from '../../server/data/samplePortfolio.js';

const PortfolioContext = createContext(null);
const API_BASE = 'http://localhost:5000/api';

export const PortfolioProvider = ({ children }) => {
  const [portfolio, setPortfolio] = useState(samplePortfolios.fullstack);
  const [activeTab, setActiveTab] = useState('profile');
  const [saveState, setSaveState] = useState('saved');
  const [authToken, setAuthToken] = useState(localStorage.getItem('aura_token') || 'token-user-demo');
  const [user, setUser] = useState({ id: 'user-demo', name: 'Piyush Sharma', email: 'piyush.dev@example.com' });

  // Default starting step is 'resume_import' so user directly generates portfolio without mandatory login!
  const [onboardingStep, setOnboardingStep] = useState(
    localStorage.getItem('aura_wizard_step') || 'auth'
  );

  // Which post-login path the user took: 'tailored' | 'gallery_first'.
  // Drives the wizard step order; also persisted on the portfolio as
  // entry_path for analytics.
  const [entryPath, setEntryPathState] = useState(localStorage.getItem('aura_entry_path') || '');

  const [isMobilePreviewOpen, setIsMobilePreviewOpen] = useState(false);
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiTargetBullet, setAiTargetBullet] = useState(null);
  const [isAtsModalOpen, setIsAtsModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const fetchPortfolio = async () => {
    try {
      const res = await fetch(`${API_BASE}/portfolio/me`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPortfolio(data);
      }
    } catch (err) {
      console.warn('Backend server offline, using client state');
    }
  };

  const loginUser = async (email, password) => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (res.ok) {
        const data = await res.json();
        setAuthToken(data.token);
        setUser(data.user);
        localStorage.setItem('aura_token', data.token);
      }
    } catch (err) {}
    setOnboardingStep('workspace');
    localStorage.setItem('aura_wizard_step', 'workspace');
  };

  const registerUser = async (name, email, password) => {
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      if (res.ok) {
        const data = await res.json();
        setAuthToken(data.token);
        setUser(data.user);
        localStorage.setItem('aura_token', data.token);
      }
    } catch (err) {}
    setOnboardingStep('workspace');
    localStorage.setItem('aura_wizard_step', 'workspace');
  };

  const logoutUser = () => {
    setAuthToken('token-user-demo');
    setUser({ id: 'user-demo', name: 'Piyush Sharma', email: 'piyush.dev@example.com' });
    setOnboardingStep('auth');
    localStorage.setItem('aura_wizard_step', 'auth');
    setEntryPathState('');
    localStorage.removeItem('aura_entry_path');
  };

  const updatePortfolio = async (updater) => {
    setSaveState('saving');
    const updated = typeof updater === 'function' ? updater(portfolio) : { ...portfolio, ...updater };
    setPortfolio(updated);

    try {
      const res = await fetch(`${API_BASE}/portfolio/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(updated)
      });
      if (res.ok) {
        const result = await res.json();
        if (result.portfolio) {
          setPortfolio(result.portfolio);
        }
        setSaveState('saved');
      } else {
        setSaveState('error');
      }
    } catch (err) {
      setTimeout(() => setSaveState('saved'), 400);
    }
  };

  const reorderSectionItems = async (sectionName, items) => {
    updatePortfolio(prev => ({
      ...prev,
      [sectionName]: items
    }));
    try {
      await fetch(`${API_BASE}/portfolio/me/reorder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ section: sectionName, items })
      });
    } catch (e) {}
  };

  const resetToSample = async () => {
    const sample = JSON.parse(JSON.stringify(samplePortfolios.fullstack));
    setPortfolio(sample);
    setSaveState('saved');
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
  };

  const triggerPublishConfetti = () => {
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 }
    });
  };

  const goToStep = (step) => {
    setOnboardingStep(step);
    localStorage.setItem('aura_wizard_step', step);
  };

  const chooseEntryPath = (path) => {
    setEntryPathState(path);
    localStorage.setItem('aura_entry_path', path);
    updatePortfolio(prev => ({ ...prev, entry_path: path }));
  };

  return (
    <PortfolioContext.Provider value={{
      portfolio,
      setPortfolio,
      updatePortfolio,
      reorderSectionItems,
      activeTab,
      setActiveTab,
      saveState,
      authToken,
      user,
      loginUser,
      registerUser,
      logoutUser,
      resetToSample,
      triggerPublishConfetti,
      onboardingStep,
      setOnboardingStep: goToStep,
      entryPath,
      chooseEntryPath,
      isMobilePreviewOpen,
      setIsMobilePreviewOpen,
      isPreviewFullscreen,
      setIsPreviewFullscreen,
      isAiModalOpen,
      setIsAiModalOpen,
      aiTargetBullet,
      setAiTargetBullet,
      isAtsModalOpen,
      setIsAtsModalOpen,
      isShareModalOpen,
      setIsShareModalOpen,
      isResumeModalOpen,
      setIsResumeModalOpen
    }}>
      {children}
    </PortfolioContext.Provider>
  );
};

export const usePortfolio = () => {
  const context = useContext(PortfolioContext);
  if (!context) throw new Error('usePortfolio must be used within PortfolioProvider');
  return context;
};
