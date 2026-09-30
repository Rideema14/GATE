'use client';
import {useEffect, useState} from 'react';

type Note = {
  content: {
    summary: string;
    formulas: {name: string; formula: string; meaning: string; verify?: boolean}[];
    notes: {heading: string; points: string[]}[];
  };
  source: string;
};

function toMarkdown(title: string, n: Note['content']) {
  let s = `# ${title}\n\n${n.summary}\n\n## Formulas\n\n`;
  if (!n.formulas.length) s += '_No formulas in this video._\n\n';
  for (const f of n.formulas) s += `- **${f.name}**${f.verify ? ' (verify against video)' : ''}: \`${f.formula}\`  \n  ${f.meaning}\n`;
  s += '\n## Notes\n\n';
  for (const g of n.notes) s += `### ${g.heading}\n${g.points.map(p => `- ${p}`).join('\n')}\n\n`;
  return s;
}

export default function NotesPanel({itemId, title, onChanged}: {itemId: string; title: string; onChanged: () => void}) {
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [needPaste, setNeedPaste] = useState(false);
  const [paste, setPaste] = useState('');

  useEffect(() => {
    (async () => {
      const r = await fetch(`/api/notes?itemId=${itemId}`);
      const j = await r.json();
      setNote(j.note || null);
      setLoading(false);
    })();
  }, [itemId]);

  async function generate(withPaste?: boolean) {
    setBusy(true);
    setErr('');
    try {
      const r = await fetch('/api/notes', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({itemId, transcript: withPaste ? paste : undefined})});
      const j = await r.json();
      if (!r.ok) {
        setErr(j.error || 'Failed');
        setNeedPaste(!!j.needTranscript);
        return;
      }
      setNote(j.note);
      setNeedPaste(false);
      setPaste('');
      onChanged();
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (!confirm('Delete these notes?')) return;
    await fetch('/api/notes', {method: 'DELETE', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({itemId})});
    setNote(null);
    onChanged();
  }
  function download() {
    if (!note) return;
    const blob = new Blob([toMarkdown(title, note.content)], {type: 'text/markdown'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${title.replace(/[^\w\-]+/g, '_').slice(0, 60) || 'notes'}.md`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  if (loading) return <div style={{padding: '8px 0', fontSize: 12}}>Loading notes…</div>;

  return (
    <div style={{background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 13, padding: 14, margin: '4px 0 10px'}}>
      {err && <div className="error">{err}</div>}

      {!note && !needPaste && (
        <div style={{display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap'}}>
          <button className="btn primary" disabled={busy} onClick={() => generate()}>{busy ? 'Reading video & writing notes…' : '✨ Generate formulas & notes'}</button>
          <small style={{color: 'var(--muted)'}}>Uses the video's captions. Takes ~20–40 seconds.</small>
        </div>
      )}

      {needPaste && (
        <div>
          <small style={{display: 'block', color: 'var(--muted)', marginBottom: 6}}>On YouTube: open the video → “…more” → “Show transcript” → copy all, then paste here.</small>
          <textarea value={paste} onChange={e => setPaste(e.target.value)} rows={6} placeholder="Paste transcript here" style={{width: '100%', padding: 10, borderRadius: 10, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--text)'}} />
          <button className="btn primary" style={{marginTop: 8}} disabled={busy || paste.trim().length < 200} onClick={() => generate(true)}>{busy ? 'Writing notes…' : 'Generate from pasted transcript'}</button>
        </div>
      )}

      {note && (
        <div>
          <p style={{fontSize: 13, marginTop: 0}}>{note.content.summary}</p>

          <h4 style={{margin: '14px 0 8px'}}>Formulas</h4>
          {note.content.formulas.length === 0 && <small style={{color: 'var(--muted)'}}>No formulas were covered in this video.</small>}
          {note.content.formulas.map((f, i) => (
            <div key={i} style={{padding: '8px 0', borderBottom: '1px solid var(--line-soft)'}}>
              <b style={{fontSize: 13}}>{f.name}</b>
              {f.verify && <span className="tag" style={{marginLeft: 8, color: 'var(--rust)'}}>CHECK AGAINST VIDEO</span>}
              <div style={{fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 14, margin: '5px 0', overflowX: 'auto'}}>{f.formula}</div>
              <small style={{color: 'var(--muted)'}}>{f.meaning}</small>
            </div>
          ))}

          <h4 style={{margin: '16px 0 8px'}}>Notes</h4>
          {note.content.notes.map((g, i) => (
            <div key={i} style={{marginBottom: 10}}>
              <b style={{fontSize: 13}}>{g.heading}</b>
              <ul style={{margin: '4px 0 0 18px', padding: 0, fontSize: 13}}>
                {g.points.map((p, k) => <li key={k}>{p}</li>)}
              </ul>
            </div>
          ))}

          <div style={{display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap'}}>
            <button className="btn primary" onClick={download}>⬇ Download .md</button>
            <button className="btn" disabled={busy} onClick={() => generate()}>{busy ? 'Regenerating…' : 'Regenerate'}</button>
            <button className="btn" style={{color: '#d33'}} onClick={remove}>Delete</button>
          </div>
        </div>
      )}
    </div>
  );
}
