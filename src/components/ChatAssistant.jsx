import React, { useEffect, useRef, useState } from 'react';
import { Bot, X, Send, Loader2, Check, Target, AlertTriangle, Trash2, Sparkles, PencilLine } from 'lucide-react';
import confetti from 'canvas-confetti';
import { usePortfolio } from '../context/PortfolioContext';
import { wordDiff } from '../utils/wordDiff';
import { SPOT_BLUE, CHROME_MID, INK, PAPER } from './CinematicStage';

const STORE_KEY = 'aura_assistant_chat';
const SEEN_KEY = 'aura_assistant_seen';

const QUICK_PROMPTS = [
  "What's missing for this job?",
  'Improve my summary',
  'Tailor my experience bullets',
  'Which skills should I highlight?'
];

const loadChat = () => {
  try { return JSON.parse(localStorage.getItem(STORE_KEY)) || []; } catch { return []; }
};

// Apply one suggestion to the portfolio. Returns null if the target changed
// since the suggestion was made (stale), so nothing is overwritten blindly.
const applySuggestion = (pf, s) => {
  const out = { ...pf, profile: { ...(pf.profile || {}) } };
  const exp = (pf.experience || []).map((e) => ({ ...e, bullets: [...(e.bullets || [])] }));
  switch (s.type) {
    case 'set_bio':
      if ((pf.profile?.bio || '') !== s.before) return null;
      out.profile.bio = s.after; return out;
    case 'set_title':
      if ((pf.profile?.title || '') !== s.before) return null;
      out.profile.title = s.after; return out;
    case 'set_status':
      if ((pf.profile?.statusPill || '') !== s.before) return null;
      out.profile.statusPill = s.after; return out;
    case 'edit_bullet':
      if (exp[s.expIndex]?.bullets[s.bulletIndex] !== s.before) return null;
      exp[s.expIndex].bullets[s.bulletIndex] = s.after; out.experience = exp; return out;
    case 'reorder_bullets':
      if ((exp[s.expIndex]?.bullets || []).join('\n') !== s.before) return null;
      exp[s.expIndex].bullets = s.after.split('\n'); out.experience = exp; return out;
    case 'edit_project': {
      const projects = [...(pf.projects || [])];
      if (!projects[s.projectIndex] || (projects[s.projectIndex].description || '') !== s.before) return null;
      projects[s.projectIndex] = { ...projects[s.projectIndex], description: s.after };
      out.projects = projects; return out;
    }
    case 'add_skill': {
      const skills = pf.skills || [];
      if (skills.some((k) => k.name.toLowerCase() === s.after.toLowerCase())) return null;
      out.skills = [...skills, { id: `sk-${Date.now()}`, name: s.after, category: s.skill?.category || 'Core', level: 80, order_index: skills.length }];
      return out;
    }
    case 'reorder_skills': {
      const skills = pf.skills || [];
      if (skills.map((k) => k.name).join(', ') !== s.before) return null;
      const order = s.after.split(', ');
      out.skills = order.map((name, i) => ({ ...skills.find((k) => k.name === name), order_index: i }));
      return out;
    }
    default:
      return null;
  }
};

const Diff = ({ before, after }) => (
  <p className="text-[11.5px] leading-relaxed">
    {wordDiff(before || '', after || '').map((w, i) => (
      <span
        key={i}
        style={w.t === 'del' ? { color: '#F87171', textDecoration: 'line-through', opacity: 0.8 } : w.t === 'add' ? { color: '#4ADE80' } : { color: '#D4D4D8' }}
      >{w.w} </span>
    ))}
  </p>
);

const ListChange = ({ before, after, sep }) => (
  <div className="grid grid-cols-2 gap-2 text-[10.5px]">
    {[['Now', before], ['After', after]].map(([label, val]) => (
      <div key={label}>
        <p className="uppercase tracking-wider text-[9px] mb-1" style={{ color: CHROME_MID }}>{label}</p>
        <ol className="space-y-0.5 list-decimal pl-4" style={{ color: label === 'After' ? '#E4E4E7' : CHROME_MID }}>
          {val.split(sep).slice(0, 8).map((x, i) => <li key={i} className="line-clamp-2">{x}</li>)}
        </ol>
      </div>
    ))}
  </div>
);

const SuggestionCard = ({ s, index, state, onApply, onDismiss }) => (
  <div className="msg-in rounded-lg p-3 space-y-2 transition-colors duration-500" style={{ '--i': index + 1, background: state === 'applied' ? 'rgba(74,222,128,0.05)' : 'rgba(255,255,255,0.03)', border: `1px solid ${state === 'applied' ? 'rgba(74,222,128,0.4)' : 'rgba(255,255,255,0.10)'}` }}>
    <div>
      <p className="text-[12px] font-semibold" style={{ color: PAPER }}>{s.label}</p>
      {s.reason && <p className="text-[10.5px] mt-0.5" style={{ color: CHROME_MID }}>{s.reason}</p>}
    </div>
    {s.type === 'reorder_skills' && <ListChange before={s.before} after={s.after} sep=", " />}
    {s.type === 'reorder_bullets' && <ListChange before={s.before} after={s.after} sep={'\n'} />}
    {s.type === 'add_skill' && <p className="text-[11.5px]" style={{ color: '#4ADE80' }}>+ {s.after}</p>}
    {!['reorder_skills', 'reorder_bullets', 'add_skill'].includes(s.type) && <Diff before={s.before} after={s.after} />}
    {s.warnings?.map((w, i) => (
      <p key={i} className="flex items-start gap-1.5 text-[10.5px]" style={{ color: '#FBBF24' }}>
        <AlertTriangle className="w-3 h-3 shrink-0 mt-px" /> {w}
      </p>
    ))}
    {state === 'applied' && <p className="flex items-center gap-1 text-[10.5px] font-semibold" style={{ color: '#4ADE80' }}><Check className="w-3 h-3" /> Applied to your resume and website</p>}
    {state === 'dismissed' && <p className="text-[10.5px]" style={{ color: CHROME_MID }}>Dismissed</p>}
    {state === 'stale' && <p className="text-[10.5px]" style={{ color: '#FBBF24' }}>This part changed since the suggestion; ask again for a fresh one.</p>}
    {!state && (
      <div className="flex gap-2">
        <button type="button" onClick={onApply} className="btn-shine px-3 py-1.5 rounded text-[11px] font-bold flex items-center gap-1" style={{ background: PAPER, color: INK }}>
          <Check className="w-3 h-3" /> Apply
        </button>
        <button type="button" onClick={onDismiss} className="px-3 py-1.5 rounded text-[11px] font-semibold border border-white/15 hover:text-white" style={{ color: CHROME_MID }}>
          Dismiss
        </button>
      </div>
    )}
  </div>
);

/**
 * ChatAssistant — floating AI career assistant. Knows the user's resume /
 * portfolio data and the target job description, answers questions, and
 * proposes concrete edits the user applies with one click (shown as a diff
 * first). The same data drives the resume and the website, so applied edits
 * update both.
 */
export const ChatAssistant = ({ bottomOffsetClass = 'bottom-6' }) => {
  const { portfolio, updatePortfolio } = usePortfolio();
  const [open, setOpen] = useState(false);
  // The launcher pulses until the assistant has been opened once.
  const [seen, setSeen] = useState(() => { try { return !!localStorage.getItem(SEEN_KEY); } catch { return true; } });
  const openPanel = () => {
    setOpen(true);
    if (!seen) { setSeen(true); try { localStorage.setItem(SEEN_KEY, '1'); } catch {} }
  };
  const [messages, setMessages] = useState(loadChat);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [editingJd, setEditingJd] = useState(false);
  const [jdDraft, setJdDraft] = useState('');
  const listRef = useRef(null);
  const inputRef = useRef(null);

  const jd = portfolio.target_job?.description || '';

  useEffect(() => {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(messages.slice(-40))); } catch {}
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, open]);

  useEffect(() => { if (open && !editingJd) inputRef.current?.focus(); }, [open, editingJd]);

  // jdOverride: a just-saved job description (state updates land next render)
  const send = async (text, jdOverride) => {
    const content = String(text ?? input).trim();
    if (!content || sending) return;
    setInput('');
    const next = [...messages, { role: 'user', content }];
    setMessages(next);
    setSending(true);
    try {
      const res = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: next.map(({ role, content: c }) => ({ role, content: c })),
          portfolio,
          jobDescription: jdOverride ?? jd
        })
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error?.message || 'The assistant could not answer.');
      setMessages((m) => [...m, { role: 'assistant', content: json.reply, suggestions: json.suggestions || [], engine: json.engine, states: {} }]);
    } catch (e) {
      const msg = e.message === 'Failed to fetch' ? 'I could not reach the server. Is the backend running?' : e.message;
      setMessages((m) => [...m, { role: 'assistant', content: msg, suggestions: [], error: true }]);
    } finally {
      setSending(false);
    }
  };

  const setSuggestionState = (msgIdx, id, state) =>
    setMessages((m) => m.map((msg, i) => (i === msgIdx ? { ...msg, states: { ...(msg.states || {}), [id]: state } } : msg)));

  const handleApply = (msgIdx, s, e) => {
    const updated = applySuggestion(portfolio, s);
    if (!updated) { setSuggestionState(msgIdx, s.id, 'stale'); return; }
    updatePortfolio(updated);
    setSuggestionState(msgIdx, s.id, 'applied');
    // Small celebratory burst from the Apply button
    if (e?.currentTarget && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const r = e.currentTarget.getBoundingClientRect();
      confetti({
        particleCount: 28, spread: 55, startVelocity: 22, scalar: 0.7, ticks: 90, zIndex: 9999,
        colors: ['#7FA8E8', '#4ADE80', '#F5F5F7'],
        origin: { x: (r.left + r.width / 2) / window.innerWidth, y: (r.top + r.height / 2) / window.innerHeight }
      });
    }
  };

  const saveJd = () => {
    const description = jdDraft.trim();
    updatePortfolio((prev) => ({ ...prev, target_job: { ...(prev.target_job || {}), description, analyzed_at: null } }));
    setEditingJd(false);
    if (description) send("I've set the job description. What's missing for this job?", description);
  };

  return (
    <>
      {/* Launcher */}
      {!open && (
        <button
          type="button"
          onClick={openPanel}
          className={`btn-shine ${seen ? '' : 'ring-pulse'} fixed right-5 ${bottomOffsetClass} z-[70] flex items-center gap-2 pl-3 pr-4 py-3 rounded-full font-bold text-xs shadow-[0_12px_40px_rgba(0,0,0,0.6)] hover:-translate-y-0.5`}
          style={{ background: PAPER, color: INK }}
          aria-label="Open AI assistant"
        >
          <span className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: INK }}>
            <Bot className="w-3.5 h-3.5" style={{ color: SPOT_BLUE }} />
          </span>
          AI Assistant
        </button>
      )}

      {/* Panel */}
      {open && (
        <div
          role="dialog"
          aria-label="AI assistant"
          className={`pop-in fixed z-[70] right-0 sm:right-5 ${bottomOffsetClass} w-full sm:w-[400px] flex flex-col rounded-t-2xl sm:rounded-2xl overflow-hidden font-outfit`}
          style={{
            height: 'min(640px, calc(100vh - 110px))',
            background: 'rgba(14,14,20,0.97)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.12)',
            boxShadow: '0 30px 80px rgba(0,0,0,0.75)'
          }}
        >
          {/* Header */}
          <div className="flex items-center gap-2.5 px-4 py-3 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <span className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(127,168,232,0.12)', border: '1px solid rgba(127,168,232,0.3)' }}>
              <Bot className="w-4 h-4" style={{ color: SPOT_BLUE }} />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold" style={{ color: PAPER }}>AI Assistant</p>
              <p className="text-[10.5px] truncate" style={{ color: CHROME_MID }}>Suggests updates to your resume &amp; website for a job</p>
            </div>
            {messages.length > 0 && (
              <button type="button" onClick={() => setMessages([])} title="Clear conversation" className="p-1.5 rounded hover:text-white" style={{ color: CHROME_MID }}>
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button type="button" onClick={() => setOpen(false)} title="Close" className="p-1.5 rounded hover:text-white" style={{ color: CHROME_MID }}>
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Target job */}
          <div className="px-4 py-2.5 shrink-0 space-y-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
            {!editingJd ? (
              <div className="flex items-center gap-2">
                <Target className="w-3.5 h-3.5 shrink-0" style={{ color: jd ? '#4ADE80' : '#FBBF24' }} />
                <p className="flex-1 text-[11px] truncate" style={{ color: jd ? '#D4D4D8' : '#FBBF24' }}>
                  {jd ? jd.replace(/\s+/g, ' ').slice(0, 90) : 'No job description yet'}
                </p>
                <button
                  type="button"
                  onClick={() => { setJdDraft(jd); setEditingJd(true); }}
                  className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded text-[10.5px] font-semibold border hover:text-white"
                  style={{ color: SPOT_BLUE, borderColor: 'rgba(127,168,232,0.35)' }}
                >
                  <PencilLine className="w-3 h-3" /> {jd ? 'Change job' : 'Set job'}
                </button>
              </div>
            ) : (
              <>
                <textarea
                  autoFocus
                  rows={6}
                  value={jdDraft}
                  onChange={(e) => setJdDraft(e.target.value)}
                  placeholder="Paste the job description you're applying for…"
                  className="w-full px-3 py-2 rounded-lg text-[11.5px] bg-black/40 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-[#7FA8E8] resize-y"
                />
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setEditingJd(false)} className="px-3 py-1.5 rounded text-[11px]" style={{ color: CHROME_MID }}>Cancel</button>
                  <button type="button" onClick={saveJd} className="px-3 py-1.5 rounded text-[11px] font-bold" style={{ background: PAPER, color: INK }}>Save job</button>
                </div>
              </>
            )}
          </div>

          {/* Messages */}
          <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {messages.length === 0 && (
              <div className="space-y-3">
                <p className="text-[12.5px] leading-relaxed" style={{ color: '#D4D4D8' }}>
                  Hi{portfolio.profile?.fullName ? ` ${portfolio.profile.fullName.split(' ')[0]}` : ''}! I compare your resume with the job you're applying for and
                  suggest changes you can apply in one click. I only use facts from your details, and I'll ask before adding anything new.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_PROMPTS.map((q, qi) => (
                    <button key={q} type="button" onClick={() => send(q)} className="msg-in px-2.5 py-1.5 rounded-full text-[11px] border hover:text-white hover:bg-[rgba(127,168,232,0.12)] transition-colors" style={{ '--i': qi + 1, color: SPOT_BLUE, borderColor: 'rgba(127,168,232,0.35)' }}>
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, idx) => (
              m.role === 'user' ? (
                <div key={idx} className="msg-in flex justify-end">
                  <p className="max-w-[85%] px-3 py-2 rounded-2xl rounded-br-sm text-[12.5px] leading-relaxed" style={{ background: SPOT_BLUE, color: INK }}>{m.content}</p>
                </div>
              ) : (
                <div key={idx} className="msg-in space-y-2">
                  <div className="flex gap-2">
                    <Sparkles className="w-3.5 h-3.5 shrink-0 mt-1" style={{ color: m.error ? '#F87171' : SPOT_BLUE }} />
                    <p className="text-[12.5px] leading-relaxed whitespace-pre-wrap" style={{ color: m.error ? '#F87171' : '#E4E4E7' }}>{m.content}</p>
                  </div>
                  {(m.suggestions || []).map((s, sIdx) => (
                    <SuggestionCard
                      key={s.id}
                      s={s}
                      state={m.states?.[s.id]}
                      index={sIdx}
                      onApply={(e) => handleApply(idx, s, e)}
                      onDismiss={() => setSuggestionState(idx, s.id, 'dismissed')}
                    />
                  ))}
                </div>
              )
            ))}

            {sending && (
              <div className="msg-in flex items-center gap-2 px-3 py-2.5 rounded-2xl rounded-bl-sm w-fit" style={{ background: 'rgba(255,255,255,0.05)' }} aria-label="Assistant is typing">
                <span className="typing-dots"><span /><span /><span /></span>
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => { e.preventDefault(); send(); }}
            className="flex items-end gap-2 px-3 py-3 shrink-0"
            style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
          >
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Ask about your resume or this job…"
              className="flex-1 max-h-28 px-3 py-2 rounded-xl text-[12.5px] bg-black/40 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-[#7FA8E8] resize-none"
            />
            <button type="submit" disabled={!input.trim() || sending} aria-label="Send" className="p-2.5 rounded-xl disabled:opacity-40" style={{ background: PAPER, color: INK }}>
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
