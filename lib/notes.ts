export type NoteContent = {
  summary: string;
  formulas: {name: string; formula: string; meaning: string; verify?: boolean}[];
  notes: {heading: string; points: string[]}[];
};

const MAX_CHARS = 120_000;

const SYSTEM = `You turn a lecture transcript into exam-prep material for GATE Data Science & AI.
Return ONLY a JSON object, no markdown fences, no commentary, in this exact shape:
{
  "summary": "2-3 sentence overview of what the video teaches",
  "formulas": [{"name": "...", "formula": "...", "meaning": "what each symbol means / when to use it", "verify": false}],
  "notes": [{"heading": "...", "points": ["...", "..."]}]
}
Rules:
- Extract every formula, identity, theorem statement and rule the speaker states or derives. Do not invent formulas that were not covered in the transcript.
- Write formulas in plain text with Unicode math (e.g. P(A|B) = P(A∩B) / P(B), Σ, √, ², ∂, ∈). No LaTeX.
- Transcripts come from speech recognition, so spoken maths is often garbled. If you had to reconstruct a formula from ambiguous wording, set "verify": true so the student re-checks it against the video. Otherwise false.
- Notes: concise, grouped by concept, in the order taught. Include definitions, key intuitions, worked-example takeaways and common exam traps mentioned.
- If the transcript contains no formulas, return an empty "formulas" array.`;

export async function generateNotes(transcript: string, title: string): Promise<NoteContent> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error('NO_KEY');

  // Groq exposes an OpenAI-compatible chat completions endpoint.
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {'content-type': 'application/json', authorization: `Bearer ${key}`},
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
      temperature: 0.2,
      // Generous ceiling: reasoning models spend part of this budget thinking.
      max_completion_tokens: 8000,
      messages: [
        {role: 'system', content: SYSTEM},
        {role: 'user', content: `Video title: ${title}\n\nTranscript:\n${transcript.slice(0, MAX_CHARS)}`},
      ],
    }),
  });
  if (!res.ok) throw new Error(`LLM_${res.status}`);
  const j = await res.json();
  const raw: string = j.choices?.[0]?.message?.content || '';
  const a = raw.indexOf('{');
  const b = raw.lastIndexOf('}');
  if (a < 0 || b < 0) throw new Error('BAD_OUTPUT');
  const p = JSON.parse(raw.slice(a, b + 1));
  return {
    summary: String(p.summary || ''),
    formulas: Array.isArray(p.formulas)
      ? p.formulas.map((f: any) => ({name: String(f.name || ''), formula: String(f.formula || ''), meaning: String(f.meaning || ''), verify: !!f.verify}))
      : [],
    notes: Array.isArray(p.notes)
      ? p.notes.map((n: any) => ({heading: String(n.heading || ''), points: Array.isArray(n.points) ? n.points.map(String) : []}))
      : [],
  };
}
