const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

export type GroqUsage = { prompt_tokens: number; completion_tokens: number; total_tokens: number };
export type GroqResult = { content: string; usage: GroqUsage; latencyMs: number; model: string; raw?: unknown };

function requiredKey() {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error('GROQ_API_KEY is missing. Add it to .env.local on the server.');
  return key;
}

export async function groqChat(args: {
  model: string;
  system: string;
  user: string;
  temperature?: number;
  maxTokens?: number;
}): Promise<GroqResult> {
  const started = Date.now();
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${requiredKey()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: args.model,
      temperature: args.temperature ?? 0.6,
      max_tokens: args.maxTokens ?? 700,
      messages: [
        { role: 'system', content: args.system },
        { role: 'user', content: args.user },
      ],
    }),
    cache: 'no-store',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Groq ${res.status}: ${data?.error?.message || 'request failed'}`);
  return {
    content: data.choices?.[0]?.message?.content || '',
    usage: data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
    latencyMs: Date.now() - started,
    model: data.model || args.model,
    raw: data,
  };
}
