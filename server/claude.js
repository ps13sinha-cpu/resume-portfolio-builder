// Minimal Anthropic client using global fetch (this backend has no SDK).
// Mirrors the existing callAnthropic* helpers in server/server.js.
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5';

export const claudeJson = async (system, userContent, maxTokens = 4000) => {
  const key = process.env.ANTHROPIC_API_KEY || '';
  if (!key) throw new Error('ANTHROPIC_API_KEY not configured');
  const res = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: userContent }]
    })
  });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`Anthropic API ${res.status}: ${t.slice(0, 300)}`);
  }
  const json = await res.json();
  const text = (json.content || []).map((c) => c.text || '').join('');
  // Strip prose/markdown fences if any; the Zod gate is the real authority.
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) throw new Error('Model returned no JSON object');
  return JSON.parse(m[0]);
};

// Multi-turn variant: `messages` is [{ role: 'user'|'assistant', content }].
export const claudeChatJson = async (system, messages, maxTokens = 2000) => {
  const key = process.env.ANTHROPIC_API_KEY || '';
  if (!key) throw new Error('ANTHROPIC_API_KEY not configured');
  const res = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, system, messages })
  });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`Anthropic API ${res.status}: ${t.slice(0, 300)}`);
  }
  const json = await res.json();
  const text = (json.content || []).map((c) => c.text || '').join('');
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) throw new Error('Model returned no JSON object');
  return JSON.parse(m[0]);
};
