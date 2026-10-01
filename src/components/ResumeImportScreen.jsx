import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { usePortfolio } from '../context/PortfolioContext';
import {
  Upload,
  Sparkles,
  ArrowRight,
  Check,
  Code2,
  BrainCircuit,
  Palette,
  Zap,
  FileText,
  BrainCircuit as Brain,
  ScanLine,
  AlertCircle,
  FileJson
} from 'lucide-react';
import { samplePortfolios } from '../../server/data/samplePortfolio.js';
import { extractResumeText, normalizeText } from '../utils/resumeExtraction';
import { ResumeReviewScreen } from './ResumeReviewScreen';
import { canonicalToPortfolioPatch } from '../utils/portfolioPatch';
import { heuristicParse } from '../utils/clientFallback';
import {
  CinematicStage,
  WizardStepHeader,
  StageKeyframes,
  StageBackButton,
  pulseSpot,
  useWizardProgress,
  SPOT_BLUE,
  CHROME_MID,
  INK,
  PAPER
} from './CinematicStage';

// Staged pipeline status shown during extraction + structuring
const PIPELINE_STAGES = [
  { id: 'reading', label: 'Reading your resume…' },
  { id: 'structuring', label: 'Understanding your experience…' },
  { id: 'mapping', label: 'Almost there…' }
];

export const ResumeImportScreen = ({ onNext, onBack, backLabel = 'Back to Login' }) => {
  const { updatePortfolio, triggerPublishConfetti, setOnboardingStep } = usePortfolio();

  const [activeTab, setActiveTab] = useState('preset');
  const [pastedText, setPastedText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState('fullstack');
  const [isBuilding, setIsBuilding] = useState(false);

  // Resume-to-portfolio pipeline state
  const [pipelineStage, setPipelineStage] = useState(null);      // 'reading' | 'structuring' | 'mapping' | 'ocr'
  const [pipelineError, setPipelineError] = useState('');
  const [extraction, setExtraction] = useState(null);            // result from /api/parse-resume
  const [isCommitting, setIsCommitting] = useState(false);

  const progress = useWizardProgress();

  // DOM refs for animation
  const containerRef = useRef(null);
  const spotlightRef = useRef(null);
  const backRef = useRef(null);
  const dustCanvasRef = useRef(null);
  const wizardHeaderRef = useRef(null);
  const cardRef = useRef(null);
  const heroRef = useRef(null);
  const tabsRef = useRef(null);
  const presetCardsRef = useRef([]);
  const contentRef = useRef(null);
  const tabListRef = useRef(null);

  const presets = [
    {
      id: 'fullstack',
      title: 'Full-Stack Engineer & Architect',
      description: 'React, Next.js, Node.js, WebGL, PostgreSQL, Redis, System Design',
      icon: Code2,
      badge: 'Popular'
    },
    {
      id: 'ai_ml',
      title: 'AI / ML Engineer & Researcher',
      description: 'Python, PyTorch, LLMs, Vector Databases, Transformers, MLOps',
      icon: BrainCircuit,
      badge: 'Trending'
    },
    {
      id: 'designer',
      title: 'Lead Product Designer & UX Specialist',
      description: 'Figma, UI Architecture, Motion Design, User Research',
      icon: Palette,
      badge: 'Creative'
    }
  ];

  // Presets are built on the sample portfolio, which carries its own
  // layout_id. Keep the user's template: in the template-first path it was
  // chosen on the previous screen.
  const applyPresetData = (data) =>
    updatePortfolio((prev) => ({ ...prev, ...data, layout_id: prev.layout_id || data.layout_id }));

  const handleInstantBuild = () => {
    if (isBuilding) return;
    setIsBuilding(true);
    applyPresetData(samplePortfolios.fullstack);
    setTimeout(() => {
      triggerPublishConfetti();
      setOnboardingStep('workspace');
    }, 600);
  };

  const handleApplyPreset = (presetId) => {
    setSelectedPreset(presetId);
    if (presetId === 'fullstack') {
      applyPresetData(samplePortfolios.fullstack);
    } else if (presetId === 'ai_ml') {
      applyPresetData({
        ...samplePortfolios.fullstack,
        profile: {
          fullName: "Piyush Sharma",
          title: "Senior AI / ML Research Engineer",
          bio: "Specializing in Large Language Models (LLMs), RAG architectures, and scalable vector search pipelines. Published researcher in generative AI.",
          location: "San Francisco, CA",
          email: "piyush.ai@example.com",
          statusPill: "⚡ Open for AI Leadership Roles"
        },
        skills: [
          { id: "sk-1", name: "PyTorch & TensorFlow", category: "ML", level: 98, order_index: 0 },
          { id: "sk-2", name: "Python / C++", category: "Languages", level: 96, order_index: 1 },
          { id: "sk-3", name: "LLM Fine-Tuning & RAG", category: "AI", level: 94, order_index: 2 },
          { id: "sk-4", name: "Vector DBs (Pinecone, Qdrant)", category: "Data", level: 90, order_index: 3 },
          { id: "sk-5", name: "LangChain & LlamaIndex", category: "Frameworks", level: 92, order_index: 4 }
        ]
      });
    } else if (presetId === 'designer') {
      applyPresetData({
        ...samplePortfolios.fullstack,
        profile: {
          fullName: "Piyush Sharma",
          title: "Principal Product Designer & Design Systems Lead",
          bio: "Building accessible, high-conversion design systems and fluid interactive digital products for global brands.",
          location: "New York, NY",
          email: "piyush.design@example.com",
          statusPill: "✨ Available for Design System Consulting"
        }
      });
    }
  };

  // -------------------------------------------------------------
  // RESUME → PORTFOLIO PIPELINE
  // extract text (client) → structure (server LLM) → review → commit.
  // Data never auto-publishes: it always lands on the review screen.
  // -------------------------------------------------------------
  const runPipeline = async (getTextPromise, sourceLabel) => {
    setPipelineError('');
    try {
      // Step 1 — read the file / accept paste
      setPipelineStage('reading');
      const { text, kind, confidence, needsOcr } = await getTextPromise;

      if (!text || text.trim().length < 30) {
        throw new Error('Could not find enough readable text. If this is a scanned PDF, try pasting your resume text instead.');
      }

      // Step 2 — AI structuring (server)
      setPipelineStage('structuring');
      await new Promise(r => setTimeout(r, 400)); // let the stage render before the await
      const res = await fetch('/api/parse-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, kind })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message || 'Structuring failed. You can paste your resume text instead.');
      }
      const result = await res.json();

      // Step 3 — mapping to builder fields (brief UI beat)
      setPipelineStage('mapping');
      await new Promise(r => setTimeout(r, 500));

      setExtraction({
        ...result,
        source: sourceLabel,
        sourceKind: kind,
        extractedConfidence: confidence,
        ocrUsed: needsOcr
      });
    } catch (err) {
      setPipelineError(err.message || 'Something went wrong while reading your resume.');
    } finally {
      setPipelineStage(null);
    }
  };

  const handleParseText = () => {
    if (!pastedText.trim() || pipelineStage) return;
    runPipeline(Promise.resolve({ text: normalizeText(pastedText), kind: 'paste', confidence: 'high', needsOcr: false }), 'Pasted text');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file || pipelineStage) return;
    e.target.value = ''; // allow re-uploading the same file

    // JSON exports skip structuring entirely — apply after a confirm beat
    if (file.name.toLowerCase().endsWith('.json')) {
      file.text().then(raw => {
        try {
          const parsed = JSON.parse(raw);
          // JSON is trusted data from a previous export, but still show review
          setExtraction({
            ok: true, engine: 'json-import', confidence: 'high', warnings: [],
            data: {
              profile: parsed.profile || {},
              education: parsed.education || [],
              experience: parsed.experience || [],
              skills: parsed.skills || [],
              projects: parsed.projects || [],
              certifications: parsed.certifications || [],
              meta: { lowConfidenceFields: [], notes: null }
            },
            source: file.name, sourceKind: 'json', extractedConfidence: 'high', ocrUsed: false
          });
        } catch {
          setPipelineError('Invalid JSON file format.');
        }
      });
      return;
    }

    runPipeline(extractResumeText(file, (stage, i, n) => {
      if (stage === 'ocr') setPipelineStage('ocr');
    }), file.name);
  };

  // Commit reviewed data into the builder data model (shapes the themes
  // already consume) and advance to the workspace.
  const handleCommitExtraction = async (reviewed) => {
    if (isCommitting) return;
    setIsCommitting(true);
    const patch = canonicalToPortfolioPatch(reviewed);
    await updatePortfolio(patch);
    setExtraction(null);
    setIsCommitting(false);
    triggerPublishConfetti();
    onNext();
  };

  // Ambient dust canvas now lives in the shared CinematicStage module.

  // -------------------------------------------------------------
  // GSAP ENTRANCE — continuation of the same scene, not a fresh
  // reload. Dimmer spotlight, then header, then glass card, then
  // staggered preset cards.
  // -------------------------------------------------------------
  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const elementsToReset = [
      spotlightRef.current,
      wizardHeaderRef.current,
      backRef.current,
      cardRef.current,
      heroRef.current,
      tabsRef.current,
      contentRef.current,
      ...presetCardsRef.current
    ].filter(Boolean);

    const ctx = gsap.context(() => {
      if (reducedMotion) {
        gsap.set(elementsToReset, { opacity: 1, y: 0, scale: 1 });
        return;
      }

      gsap.set(spotlightRef.current, { opacity: 0 });
      gsap.set(wizardHeaderRef.current, { opacity: 0, y: -18 });
      if (backRef.current) gsap.set(backRef.current, { opacity: 0, x: -12 });
      gsap.set(cardRef.current, { opacity: 0, scale: 0.98 });
      gsap.set([heroRef.current, tabsRef.current, contentRef.current], { opacity: 0 });
      gsap.set(presetCardsRef.current, { opacity: 0, y: 12 });

      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
      tl.to(spotlightRef.current, { opacity: 1, duration: 0.4 }, 0.2)
        .to(wizardHeaderRef.current, { opacity: 1, y: 0, duration: 0.3 }, 0.1)
        .to(backRef.current, { opacity: 1, x: 0, duration: 0.3 }, 0.45)
        .to(cardRef.current, { opacity: 1, scale: 1, duration: 0.4 }, 0.3)
        .to(heroRef.current, { opacity: 1, duration: 0.35 }, 0.5)
        .to(tabsRef.current, { opacity: 1, duration: 0.3 }, 0.65)
        .to(contentRef.current, { opacity: 1, duration: 0.3 }, 0.75)
        .to(presetCardsRef.current, { opacity: 1, y: 0, duration: 0.35, stagger: 0.08 }, 0.6);
    }, containerRef);

    return () => ctx.revert();
  }, []);

  // -------------------------------------------------------------
  // SLIDING TAB UNDERLINE — shared-layout style. A single underline
  // element animates its left/width between tab buttons.
  // -------------------------------------------------------------
  useEffect(() => {
    const listEl = tabListRef.current;
    if (!listEl) return;
    const activeBtn = listEl.querySelector(`[data-tab-btn="${activeTab}"]`);
    const underline = listEl.querySelector('[data-tab-underline]');
    if (!activeBtn || !underline) return;

    const moveUnderline = () => {
      const listRect = listEl.getBoundingClientRect();
      const btnRect = activeBtn.getBoundingClientRect();
      gsap.to(underline, {
        left: btnRect.left - listRect.left,
        width: btnRect.width,
        duration: 0.3,
        ease: 'power2.out',
        overwrite: 'auto'
      });
    };

    moveUnderline();
    window.addEventListener('resize', moveUnderline);
    return () => window.removeEventListener('resize', moveUnderline);
  }, [activeTab]);

  // -------------------------------------------------------------
  // SELECTION PULSE — when a preset is picked, the radio circle
  // scale-pulses (0.9 → 1.1 → 1.0) via the shared helper.
  // -------------------------------------------------------------
  const pulseRadio = (presetId, event) => {
    const el = event?.currentTarget?.querySelector(`[data-radio="${presetId}"]`);
    pulseSpot(el);
  };

  // -------------------------------------------------------------
  // BUILD BUTTON LOADING — brief loading state before navigation.
  // -------------------------------------------------------------
  const handleBuildPortfolio = () => {
    if (isBuilding) return;
    setIsBuilding(true);
    setTimeout(() => {
      onNext();
    }, 700);
  };

  const wizardTitles = { preset: 'Role Presets', paste: 'Paste Resume Text', upload: 'Upload PDF / JSON' };

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen w-full overflow-hidden flex flex-col items-center justify-center p-4 py-10 font-outfit"
      style={{ backgroundColor: INK, color: PAPER }}
    >
      <StageKeyframes />

      <CinematicStage spotlightRef={spotlightRef} dustCanvasRef={dustCanvasRef} />

      {/* --------------------------------------------------------- */}
      {/* REVIEW SCREEN — extraction lands here, never auto-publishes */}
      {/* --------------------------------------------------------- */}
      {extraction && (
        <div className="flex flex-col items-center w-full px-4 py-10">
          <div className="w-full max-w-3xl mb-4">
            <StageBackButton label="Discard & Go Back" onClick={() => setExtraction(null)} />
          </div>
          <ResumeReviewScreen
            extraction={extraction}
            onBack={() => setExtraction(null)}
            onCommit={handleCommitExtraction}
            isCommitting={isCommitting}
          />
        </div>
      )}

      {/* --------------------------------------------------------- */}
      {/* PIPELINE STAGES — upload/paste UI hides while running      */}
      {/* --------------------------------------------------------- */}
      {!extraction && pipelineStage && (
        <div className="relative z-10 w-full max-w-2xl my-auto">
          <div
            className="rounded-2xl p-8 space-y-5 text-center"
            style={{ background: 'rgba(20,20,26,0.45)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.10)' }}
          >
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 rounded-full border-2 border-white/10" />
              <div className="absolute inset-0 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: SPOT_BLUE }} />
              <Sparkles className="absolute inset-0 m-auto w-6 h-6" style={{ color: SPOT_BLUE }} />
            </div>
            <div className="space-y-4 pt-2">
              {PIPELINE_STAGES.map((stage, idx) => {
                const order = ['reading', 'structuring', 'mapping'];
                const currentIdx = order.indexOf(pipelineStage === 'ocr' ? 'reading' : pipelineStage);
                const state = idx < currentIdx ? 'done' : idx === currentIdx ? 'active' : 'pending';
                return (
                  <div key={stage.id} className="flex items-center gap-3 text-left">
                    <span
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-all duration-300"
                      style={{
                        background: state === 'done' ? SPOT_BLUE : state === 'active' ? 'rgba(127,168,232,0.15)' : 'rgba(255,255,255,0.05)',
                        border: state === 'pending' ? '1px solid rgba(255,255,255,0.15)' : `1px solid ${SPOT_BLUE}`,
                        color: state === 'done' ? INK : state === 'active' ? SPOT_BLUE : CHROME_MID
                      }}
                    >
                      {state === 'done' ? <Check className="w-3 h-3" strokeWidth={3} /> : idx + 1}
                    </span>
                    <span
                      className="text-xs transition-colors duration-300"
                      style={{
                        color: state === 'active' ? PAPER : state === 'done' ? 'rgba(245,245,247,0.6)' : CHROME_MID,
                        fontWeight: state === 'active' ? 600 : 400
                      }}
                    >
                      {stage.label}
                      {stage.id === 'reading' && pipelineStage === 'ocr' && ' (scanned PDF — running OCR, this can take ~30s)'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Back navigation — hidden while the pipeline or review runs */}
      {onBack && !extraction && !pipelineStage && (
        <div ref={backRef} className="relative z-10 w-full max-w-2xl mb-3">
          <StageBackButton label={backLabel} onClick={onBack} />
        </div>
      )}

      {/* Wizard step header — hidden on review (own title block) */}
      {!extraction && (
        <WizardStepHeader headerRef={wizardHeaderRef} />
      )}

      {/* Main glass card — hidden while pipeline or review is active */}
      {!extraction && !pipelineStage && (
      <div
        ref={cardRef}
        className="relative z-10 w-full max-w-2xl rounded-2xl p-6 md:p-8 space-y-6"
        style={{
          background: 'rgba(20, 20, 26, 0.45)',
          backdropFilter: 'blur(24px) saturate(140%)',
          WebkitBackdropFilter: 'blur(24px) saturate(140%)',
          border: '1px solid rgba(255, 255, 255, 0.10)',
          boxShadow: '0 25px 70px rgba(0, 0, 0, 0.85)'
        }}
      >
        {/* Instant Portfolio — glass banner, white CTA */}
        <div
          ref={heroRef}
          className="p-5 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          <div className="space-y-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <Sparkles className="w-4 h-4" style={{ color: SPOT_BLUE }} />
              <h2 className="font-syne text-base font-bold text-[#F5F5F7] tracking-tight">Instant Portfolio Generator</h2>
            </div>
            <p className="text-xs text-[#6B7280]">Generate a high-converting Awwwards-tier portfolio site in 1 click.</p>
          </div>
          <button
            onClick={handleInstantBuild}
            disabled={isBuilding}
            className="w-full sm:w-auto px-5 py-2.5 rounded-[3px] font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 whitespace-nowrap transition-all duration-200 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              backgroundColor: '#F5F5F7',
              color: '#06060A',
              border: '1px solid rgba(255,255,255,0.2)'
            }}
          >
            {isBuilding ? (
              <div className="w-3.5 h-3.5 border-2 border-[#06060A] border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Zap className="w-3.5 h-3.5" fill="#06060A" />
                <span>Generate Portfolio Instantly</span>
              </>
            )}
          </button>
        </div>

        {/* Section header */}
        <div className="space-y-1">
          <h1 className="font-syne text-lg font-bold text-[#F5F5F7] tracking-tight">Customize Resume Input</h1>
          <p className="text-xs text-[#6B7280]">Choose a professional role preset, paste resume text, or upload a resume file.</p>
        </div>

        {/* Tab switcher — text tabs with sliding underline */}
        <div ref={tabsRef}>
          <div ref={tabListRef} className="relative flex border-b border-white/10">
            {[
              { id: 'preset', label: 'Role Presets' },
              { id: 'paste', label: 'Paste Resume Text' },
              { id: 'upload', label: 'Upload PDF / JSON' }
            ].map(tab => (
              <button
                key={tab.id}
                data-tab-btn={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 pb-2.5 text-xs font-medium transition-colors duration-200 ${
                  activeTab === tab.id ? 'text-[#F5F5F7]' : 'text-[#6B7280] hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
            <span
              data-tab-underline
              className="absolute bottom-0 h-[2px] rounded-full"
              style={{ backgroundColor: '#F5F5F7', left: 0, width: 0 }}
            />
          </div>
        </div>

        {/* Tab content */}
        <div ref={contentRef}>
          {/* Tab 1: Role Presets */}
          {activeTab === 'preset' && (
            <div className="space-y-3">
              {presets.map((preset, idx) => {
                const IconComp = preset.icon;
                const isSelected = selectedPreset === preset.id;
                return (
                  <div
                    key={preset.id}
                    ref={(el) => { presetCardsRef.current[idx] = el; }}
                    onClick={() => { handleApplyPreset(preset.id); pulseRadio(preset.id); }}
                    className="p-4 rounded-xl cursor-pointer transition-all duration-200 flex items-center justify-between gap-4"
                    style={{
                      background: isSelected ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
                      border: isSelected ? `1px solid ${SPOT_BLUE}` : '1px solid rgba(255,255,255,0.10)',
                      boxShadow: isSelected ? '0 0 20px rgba(127,168,232,0.15)' : 'none'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }
                    }}
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className="p-2.5 rounded-lg flex items-center justify-center"
                        style={{
                          background: 'rgba(255,255,255,0.06)',
                          border: '1px solid rgba(255,255,255,0.08)'
                        }}
                      >
                        <IconComp className="w-5 h-5 text-white/80" strokeWidth={1.5} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold text-sm text-[#F5F5F7]">{preset.title}</h4>
                          <span
                            className="px-2 py-px rounded-full text-[10px] font-medium tracking-wide"
                            style={{
                              color: '#6B7280',
                              border: '1px solid rgba(255,255,255,0.15)',
                              background: 'transparent'
                            }}
                          >
                            {preset.badge}
                          </span>
                        </div>
                        <p className="text-xs text-[#6B7280] mt-0.5">{preset.description}</p>
                      </div>
                    </div>

                    <div
                      data-radio={preset.id}
                      className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all duration-200"
                      style={{
                        border: isSelected ? `1.5px solid ${SPOT_BLUE}` : '1.5px solid rgba(255,255,255,0.25)',
                        background: isSelected ? SPOT_BLUE : 'transparent'
                      }}
                    >
                      {isSelected && <Check className="w-3 h-3 text-[#06060A]" strokeWidth={3} />}
                    </div>
                  </div>
                );
              })}

              <button
                onClick={handleBuildPortfolio}
                disabled={isBuilding}
                className="w-full py-3 mt-2 rounded-[3px] font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.99] disabled:cursor-not-allowed"
                style={isBuilding
                  ? { backgroundColor: '#E4E4E9', color: '#06060A', transform: 'scaleX(0.96)' }
                  : { backgroundColor: '#F5F5F7', color: '#06060A' }}
              >
                {isBuilding ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-[#06060A] border-t-transparent rounded-full animate-spin" />
                    <span>Building…</span>
                  </>
                ) : (
                  <>
                    <span>Build Portfolio</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* Tab 2: Paste Resume Text — runs through the same pipeline */}
          {activeTab === 'paste' && (
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-medium text-[#6B7280] uppercase tracking-wider mb-1.5">
                  Paste Resume Text / Bullets
                </label>
                <textarea
                  rows={6}
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder={"Piyush Sharma\nSenior Full-Stack Engineer\nEXPERIENCE\nApex Tech Labs — Lead Frontend Architect (2023 - Present)\n- Architected dashboards serving 1.2M daily users\n\nEDUCATION\nUC Berkeley — BS Computer Science\n\nSKILLS\nReact, TypeScript, Node.js, PostgreSQL"}
                  className="w-full px-4 py-3 rounded-lg text-xs text-[#F5F5F7] placeholder-white/25 focus:outline-none transition-colors duration-200 resize-none"
                  style={{
                    background: 'rgba(0,0,0,0.25)',
                    border: '1px solid rgba(255,255,255,0.10)'
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = SPOT_BLUE; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)'; }}
                />
              </div>

              <button
                onClick={handleParseText}
                disabled={isParsing || !pastedText.trim() || !!pipelineStage}
                className="w-full py-3 rounded-[3px] font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#F5F5F7', color: '#06060A' }}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Structure My Resume with AI</span>
              </button>
            </div>
          )}

          {/* Tab 3: Upload File — real extraction pipeline */}
          {activeTab === 'upload' && (
            <div className="space-y-4 text-center">
              <div
                className="p-8 rounded-xl space-y-3 transition-colors duration-200"
                style={{ border: '1px dashed rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.2)' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.30)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
              >
                <Upload className="w-7 h-7 text-white/50 mx-auto" strokeWidth={1.5} />
                <div>
                  <h4 className="font-semibold text-sm text-[#F5F5F7]">Upload Your Resume</h4>
                  <p className="text-xs text-[#6B7280] mt-0.5">
                    PDF, DOCX, TXT or JSON · max 10MB — auto-fills every builder section
                  </p>
                  <p className="text-[10px] mt-1" style={{ color: CHROME_MID }}>
                    Works best with single-column, text-based resumes. Scanned PDFs run OCR (slower).
                  </p>
                </div>
                <label
                  className="inline-block px-4 py-2 rounded-[3px] text-xs font-bold uppercase tracking-wider cursor-pointer transition-all duration-200 active:scale-95"
                  style={{ backgroundColor: '#F5F5F7', color: '#06060A' }}
                >
                  <span>Browse File</span>
                  <input type="file" accept=".pdf,.docx,.doc,.txt,.json" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>

              <button
                onClick={handleInstantBuild}
                disabled={isBuilding}
                className="w-full py-3 rounded-[3px] font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: 'transparent',
                  color: '#F5F5F7',
                  border: '1px solid rgba(255,255,255,0.25)'
                }}
              >
                <span>Skip — Use Sample Portfolio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
      )}

      {/* Pipeline error */}
      {!extraction && !pipelineStage && pipelineError && (
        <div
          className="relative z-10 w-full max-w-2xl mt-4 p-4 rounded-xl flex items-start gap-3"
          style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.3)' }}
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#F87171' }} />
          <div className="text-xs space-y-1">
            <p style={{ color: '#F87171' }}>{pipelineError}</p>
            <button onClick={() => setPipelineError('')} className="text-[11px] underline" style={{ color: CHROME_MID }}>
              Dismiss
            </button>
          </div>
        </div>
      )}

      <p className="relative z-10 mt-6 text-[11px] text-[#6B7280] tracking-wide">
        Step {progress.number} of {progress.total} — Resume Input
      </p>
    </div>
  );
};
