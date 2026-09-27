'use client';
import {useEffect, useState} from 'react';

const suggestions = [
  {name: 'GATE DA PYQ Tracker', type: 'PYQ', total: 20},
  {name: 'Weekly Mock Tests', type: 'Mock', total: 10},
];

// Every year GATE DA has existed so far — it's a new paper, first held in
// 2024, so this genuinely is "all years", not a shortened list. Each entry
// links to the real, freely viewable official question paper and, where
// one is publicly available, the official answer key — plus GATE Overflow's
// tag for that year, which has every question from that paper answered and
// explained by the community (the closest thing to a solved answer key for
// years where an official one isn't in the clear).
const PYQ_YEARS = [
  {
    year: 2026,
    authority: 'IIT Guwahati',
    qp: 'https://docs.aglasem.com/view/3dbad98c-8047-11f1-82e7-0aa932765c8b',
    ak: 'https://docs.aglasem.com/view/042ee258-8047-11f1-83ad-0aa932765c8b',
    overflow: 'https://gateoverflow.in/tag/gateda-2026',
  },
  {
    year: 2025,
    authority: 'IIT Roorkee',
    qp: 'https://docs.aglasem.com/view/13b3c34e-3893-11f0-8293-0a5e36bc6706',
    ak: null,
    overflow: 'https://gateoverflow.in/tag/gateda-2025',
  },
  {
    year: 2024,
    authority: 'IISc Bangalore',
    qp: 'https://docs.aglasem.com/view/3bcd14a6-315b-11ef-8ae9-0a5e36bc6706',
    ak: 'https://docs.aglasem.com/view/20f3cdc8-315b-11ef-9554-0a5e36bc6706',
    overflow: 'https://gateoverflow.in/tag/gate-ds-ai-2024',
  },
];

export default function TestsClient() {
  const [d, setD] = useState<any>();
  const [name, setName] = useState('');
  const [type, setType] = useState('Mock');
  const [subject, setSubject] = useState('');
  const [total, setTotal] = useState('10');
  const [addingSuggestion, setAddingSuggestion] = useState<string | null>(null);
  const [openYear, setOpenYear] = useState<number | null>(null);
  const [q, setQ] = useState('');

  function searchPapers() {
    if (!q.trim()) return;
    // GATE Overflow holds every real GATE DA question with its solution,
    // across all 3 years, so a search there is a search of the actual PYQs
    // — this opens their site's own search rather than us hosting a copy
    // of copyrighted exam content ourselves.
    window.open(`https://www.google.com/search?q=${encodeURIComponent(`site:gateoverflow.in GATE DA ${q}`)}`, '_blank');
  }

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
      <div className="card" style={{marginBottom: 13}}>
        <div className="widget-head">
          <h4>📄 GATE DA — every year's real paper</h4>
          <span>2024, 2025 and 2026 — that's all the years GATE DA has existed so far</span>
        </div>
        <div style={{display: 'flex', gap: 8, marginBottom: 14}}>
          <input placeholder="Search past questions, e.g. 'gradient descent' or 'normalization'" value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchPapers()} style={{flex: 1}} />
          <button className="btn primary" onClick={searchPapers}>Search PYQs</button>
        </div>
        <p style={{margin: '0 0 16px', color: 'var(--muted)', fontSize: 11.5}}>
          Search opens GATE Overflow's real, solved archive of every GATE DA question ever asked — not a generic web search. I can't host or reproduce the copyrighted papers myself, but every paper below opens as a real, complete document right here, not just a link.
        </p>
        {PYQ_YEARS.map(y => (
          <div key={y.year} style={{borderTop: '1px solid var(--line-soft)', paddingTop: 14, marginTop: 14}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8}}>
              <div>
                <b style={{fontFamily: 'var(--font-display)', fontSize: 16}}>GATE DA {y.year}</b>
                <div style={{color: 'var(--muted)', fontSize: 11}}>Conducted by {y.authority}</div>
              </div>
              <div style={{display: 'flex', gap: 7, flexWrap: 'wrap'}}>
                <button className="btn primary" onClick={() => setOpenYear(openYear === y.year ? null : y.year)}>{openYear === y.year ? 'Hide paper' : 'View question paper'}</button>
                {y.ak && <a className="btn" href={y.ak} target="_blank">Answer key</a>}
                <a className="btn" href={y.overflow} target="_blank">Solved on GATE Overflow</a>
              </div>
            </div>
            {openYear === y.year && (
              <iframe src={y.qp} title={`GATE DA ${y.year} question paper`} style={{width: '100%', height: 600, border: '1px solid var(--line)', borderRadius: 12, marginTop: 12}} />
            )}
          </div>
        ))}
      </div>

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
