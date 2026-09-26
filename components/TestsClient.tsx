'use client';
import {useEffect, useState} from 'react';

const suggestions = [
  {name: 'GATE DA PYQ Tracker', type: 'PYQ', total: 20},
  {name: 'Weekly Mock Tests', type: 'Mock', total: 10},
];

export default function TestsClient() {
  const [d, setD] = useState<any>();
  const [name, setName] = useState('');
  const [type, setType] = useState('Mock');
  const [subject, setSubject] = useState('');
  const [total, setTotal] = useState('10');
  const [addingSuggestion, setAddingSuggestion] = useState<string | null>(null);

  async function load() {
    setD(await (await fetch('/api/me')).json());
  }
  useEffect(() => {
    load();
  }, []);
  if (!d) return <div className="empty">Loading tests…</div>;

  async function add() {
    if (!name) return;
    await fetch('/api/tests', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({name, type, subject: subject || null, total: +total})});
    setName('');
    load();
  }
  async function addSuggestion(s: (typeof suggestions)[number]) {
    setAddingSuggestion(s.name);
    try {
      await fetch('/api/tests', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(s)});
      await load();
    } finally {
      setAddingSuggestion(null);
    }
  }
  async function patch(id: string, delta?: number, score?: number) {
    await fetch('/api/tests', {method: 'PATCH', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({id, delta, score})});
    load();
  }

  const alreadyAdded = (s: (typeof suggestions)[number]) => d.tests.some((t: any) => t.name === s.name);

  return (
    <>
      <div className="card">
        <div className="grid three">
          <input placeholder="Test series / PYQ name" value={name} onChange={e => setName(e.target.value)} />
          <select value={type} onChange={e => setType(e.target.value)}>
            <option>Mock</option>
            <option>PYQ</option>
            <option>Sectional</option>
            <option>Quiz</option>
          </select>
          <select value={subject} onChange={e => setSubject(e.target.value)}>
            <option value="">Mixed / all subjects</option>
            {d.subjects.map((s: any) => <option key={s.id} value={s.name}>{s.name}</option>)}
          </select>
        </div>
        <div style={{display: 'flex', gap: 7, marginTop: 11}}>
          <input type="number" value={total} onChange={e => setTotal(e.target.value)} placeholder="Total attempts" />
          <button className="btn primary" onClick={add}>＋ Add</button>
        </div>
        <p style={{margin: '9px 0 0', color: 'var(--muted)', fontSize: 12}}>
          Tag a test with a subject when you score it and the dashboard's "weak spots" will factor in that score, not just how much of the subject you've read.
        </p>
      </div>

      {d.tests.length === 0 && <div className="empty" style={{marginTop: 13}}>No tests yet — add your own above, or add a suggestion below.</div>}
      <div className="grid two" style={{marginTop: 13}}>
        {d.tests.map((t: any) => (
          <div className="card" key={t.id}>
            <div className="section" style={{marginTop: 0}}>
              <h3>{t.name}</h3>
              <span>{t.type}{t.subject ? ` • ${t.subject}` : ''}</span>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 11}}>
              <span>{t.completed}/{t.total} completed</span>
              <b>{pct(t.completed, t.total)}%</b>
            </div>
            <div className="bar" style={{marginTop: 7}}><i style={{width: `${pct(t.completed, t.total)}%`}} /></div>
            <div style={{display: 'flex', gap: 7, marginTop: 13}}>
              <button className="btn primary" onClick={() => patch(t.id, 1)}>✓ Complete next</button>
              <button className="btn" onClick={() => patch(t.id, -1)}>Undo</button>
              <button className="btn" onClick={() => { const s = prompt('Score percentage', t.score || ''); if (s !== null) patch(t.id, 0, +s); }}>Score</button>
            </div>
            {t.score !== null && t.score !== undefined && <small style={{display: 'block', color: 'var(--muted)', marginTop: 10}}>Latest score: {t.score}%</small>}
          </div>
        ))}
      </div>

      <div className="section">
        <h3>Suggested trackers</h3>
        <span>Add the ones you'll actually use — nothing here counts until you add it</span>
      </div>
      <div className="grid two">
        {suggestions.map(s => {
          const added = alreadyAdded(s);
          return (
            <div className="card" key={s.name}>
              <div className="section" style={{marginTop: 0}}>
                <h3>{s.name}</h3>
                <span>{s.type} • {s.total} attempts</span>
              </div>
              <button className="btn primary" style={{marginTop: 11}} disabled={added || addingSuggestion === s.name} onClick={() => addSuggestion(s)}>
                {added ? 'Added ✓' : addingSuggestion === s.name ? 'Adding…' : '＋ Add to my trackers'}
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}
function pct(a: number, b: number) {
  return b ? Math.round((a / b) * 100) : 0;
}
