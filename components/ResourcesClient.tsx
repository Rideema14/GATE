'use client';
import {useEffect, useState} from 'react';
import ResourceIcon from './ResourceIcon';

// Real, well-known references only — no invented links, no fabricated video
// counts. These are SUGGESTIONS: nothing here touches your data, your plan,
// or any subject's progress until you press "+ Add to my list" yourself.
// Each is tied to the exact subject name from the seeded syllabus so that,
// once added, it counts toward the right subject's progress automatically.
const suggestions = [
  {name: 'GATE DA 2026 Question Paper', type: 'pyq', subjectName: null as string | null, url: 'https://docs.aglasem.com/view/3dbad98c-8047-11f1-82e7-0aa932765c8b', description: 'Official paper, conducted by IIT Guwahati.'},
  {name: 'GATE DA 2026 Answer Key', type: 'pyq', subjectName: null as string | null, url: 'https://docs.aglasem.com/view/042ee258-8047-11f1-83ad-0aa932765c8b', description: 'Official answer key for the 2026 paper.'},
  {name: 'GATE DA 2025 Question Paper', type: 'pyq', subjectName: null as string | null, url: 'https://docs.aglasem.com/view/13b3c34e-3893-11f0-8293-0a5e36bc6706', description: 'Official paper, conducted by IIT Roorkee.'},
  {name: 'GATE DA 2025 — Solved on GATE Overflow', type: 'pyq', subjectName: null as string | null, url: 'https://gateoverflow.in/tag/gateda-2025', description: "No clean official key is public for this year — every question from this paper, answered and explained by the community."},
  {name: 'GATE DA 2024 Question Paper', type: 'pyq', subjectName: null as string | null, url: 'https://docs.aglasem.com/view/3bcd14a6-315b-11ef-8ae9-0a5e36bc6706', description: 'Official paper, conducted by IISc Bangalore — the first year GATE DA existed.'},
  {name: 'GATE DA 2024 Answer Key', type: 'pyq', subjectName: null as string | null, url: 'https://docs.aglasem.com/view/20f3cdc8-315b-11ef-9554-0a5e36bc6706', description: 'Official answer key for the 2024 paper.'},
  {name: 'NPTEL GATE Resources', type: 'notes', subjectName: null, url: 'https://gate.nptel.ac.in/', description: 'Free NPTEL learning and practice resources for GATE.'},
  {name: 'Gate Smashers (YouTube)', type: 'video', subjectName: 'General Aptitude', url: 'https://www.youtube.com/@GateSmashers', description: 'Popular channel covering aptitude and reasoning for GATE.'},
  {name: 'StatQuest (YouTube)', type: 'video', subjectName: 'Probability & Statistics', url: 'https://www.youtube.com/@statquest', description: 'Clear, visual explanations of probability and statistics concepts.'},
  {name: 'GATE Overflow — Probability PYQs', type: 'pyq', subjectName: 'Probability & Statistics', url: 'https://gateoverflow.in/questions/mathematics/probability', description: 'Previous-year GATE questions tagged Probability, with community answers.'},
  {name: '3Blue1Brown (YouTube)', type: 'video', subjectName: 'Linear Algebra', url: 'https://www.youtube.com/@3blue1brown', description: 'Widely recommended visual-intuition series, incl. "Essence of Linear Algebra".'},
  {name: 'GATE Overflow — Linear Algebra PYQs', type: 'pyq', subjectName: 'Linear Algebra', url: 'https://gateoverflow.in/questions/mathematics/linear-algebra', description: 'Previous-year GATE questions tagged Linear Algebra.'},
  {name: 'Khan Academy — Calculus', type: 'notes', subjectName: 'Calculus & Optimization', url: 'https://www.khanacademy.org/math/calculus-1', description: 'Free structured lessons and practice on limits, derivatives, and optima.'},
  {name: 'GATE Overflow — Calculus PYQs', type: 'pyq', subjectName: 'Calculus & Optimization', url: 'https://gateoverflow.in/questions/mathematics/calculus', description: 'Previous-year GATE questions tagged Calculus.'},
  {name: 'Abdul Bari (YouTube)', type: 'video', subjectName: 'Programming & Data Structures', url: 'https://www.youtube.com/@abdul_bari', description: 'Highly rated algorithms and data structures explanations.'},
  {name: 'GeeksforGeeks — Data Structures', type: 'notes', subjectName: 'Programming & Data Structures', url: 'https://www.geeksforgeeks.org/data-structures/', description: 'Reference notes and practice problems for arrays, trees, graphs and more.'},
  {name: 'GeeksforGeeks — DBMS', type: 'notes', subjectName: 'Database Management & Warehousing', url: 'https://www.geeksforgeeks.org/dbms/', description: 'Reference notes on ER models, SQL, normalization, transactions.'},
  {name: 'Gate Smashers — DBMS (YouTube)', type: 'video', subjectName: 'Database Management & Warehousing', url: 'https://www.youtube.com/@GateSmashers', description: 'DBMS lecture series aimed at GATE-level depth.'},
  {name: 'Krish Naik (YouTube)', type: 'video', subjectName: 'Machine Learning', url: 'https://www.youtube.com/@krishnaik06', description: 'Practical machine learning tutorials, from regression to deep learning.'},
  {name: 'GATE Overflow — Subject Directory', type: 'pyq', subjectName: 'Machine Learning', url: 'https://gateoverflow.in/subject', description: 'Browse ML-tagged previous-year GATE questions by topic.'},
  {name: 'GeeksforGeeks — Artificial Intelligence', type: 'notes', subjectName: 'Artificial Intelligence', url: 'https://www.geeksforgeeks.org/artificial-intelligence/', description: 'Reference notes on search, logic, and probabilistic inference.'},
];

const knownVideo = /youtube\.com|youtu\.be/i;
const knownTest = /gateoverflow\.in|gate2026\.iitg\.ac\.in|docs\.aglasem\.com|testbook\.com|gradeup\.co|unacademy\.com/i;

function detectType(url: string): {type: string; label: string} | null {
  if (!url) return null;
  if (knownVideo.test(url)) return {type: 'video', label: url.includes('list=') ? 'Detected: YouTube playlist' : 'Detected: YouTube link'};
  if (knownTest.test(url)) return {type: 'pyq', label: 'Detected: PYQ / test-prep link'};
  return null;
}

export default function ResourcesClient() {
  const [d, setD] = useState<any>();
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [addingSuggestion, setAddingSuggestion] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const [f, setF] = useState({name: '', type: 'video', subjectId: '', totalUnits: '10', url: '', description: '', playlistUrl: ''});
  const [detected, setDetected] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  async function load() {
    setD(await (await fetch('/api/me')).json());
  }
  useEffect(() => {
    load();
  }, []);
  if (!d) return <div className="empty">Loading resources…</div>;

  // Auto-differentiate the link the person pastes — this only ever sets a
  // sensible starting value for the type dropdown; it's still theirs to
  // change before saving.
  function onUrlChange(value: string) {
    const det = detectType(value);
    setF(prev => ({...prev, url: value, type: det ? det.type : prev.type}));
    setDetected(det ? det.label : null);
  }
  function onPlaylistChange(value: string) {
    setF(prev => ({...prev, playlistUrl: value, type: 'video'}));
    setDetected(value ? 'Detected: YouTube playlist' : null);
  }

  async function add() {
    setBusy(true);
    setMsg('');
    try {
      let extra: any = {};
      if (f.playlistUrl) {
        const rr = await fetch('/api/youtube/playlist', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({url: f.playlistUrl})});
        const j = await rr.json();
        if (!rr.ok) throw new Error(j.error || 'Playlist sync failed');
        extra = {playlistId: j.playlistId, items: j.items, totalUnits: j.total, name: j.title, url: f.playlistUrl, description: `${j.channel} • ${j.total} videos`};
      }
      const body = {
        ...f,
        totalUnits: Number(extra.totalUnits || f.totalUnits),
        name: extra.name || f.name,
        url: extra.url || f.url,
        description: extra.description || f.description,
        playlistId: extra.playlistId,
        items: extra.items,
        subjectId: f.subjectId || null,
      };
      const r = await fetch('/api/resources', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body)});
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Could not save');
      setShow(false);
      setF({...f, name: '', playlistUrl: ''});
      setDetected(null);
      await load();
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function addSuggestion(s: (typeof suggestions)[number]) {
    setAddingSuggestion(s.name);
    try {
      const subj = s.subjectName ? d.subjects.find((x: any) => x.name === s.subjectName) : null;
      await fetch('/api/resources', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({name: s.name, type: s.type, subjectId: subj?.id || null, totalUnits: 1, url: s.url, description: s.description}),
      });
      await load();
    } finally {
      setAddingSuggestion(null);
    }
  }

  async function toggle(item: any) {
    await fetch('/api/progress/resource-item', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({id: item.id, completed: !item.completed, progress: !item.completed ? 100 : 0})});
    load();
  }
  async function plus(id: string, delta: number) {
    await fetch('/api/progress/resource', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({id, delta})});
    load();
  }
  async function remove(r: any) {
    if (!confirm(`Remove "${r.name}"? This can't be undone.`)) return;
    setRemoving(r.id);
    try {
      await fetch('/api/resources', {method: 'DELETE', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({id: r.id})});
      await load();
    } finally {
      setRemoving(null);
    }
  }

  const alreadyAdded = (s: (typeof suggestions)[number]) => d.resources.some((r: any) => r.name === s.name && r.url === s.url);

  return (
    <>
      <div className="card" style={{marginBottom: 13}}>
        <p style={{margin: 0, color: 'var(--muted)', fontSize: 12}}>
          Pick the real syllabus subject a resource belongs to and it will count toward that subject's progress on the Progress page and in your plan. Paste a link and the type (video / PYQ / notes) is detected automatically — you can still change it before saving. Nothing below is added for you; every suggestion needs your own tap.
        </p>
      </div>

      <div className="section">
        <h3>Your resource shelf</h3>
        <button className="btn primary" onClick={() => setShow(!show)}>＋ Add resource</button>
      </div>
      {show && (
        <div className="card form" style={{marginBottom: 13}}>
          <div className="field">
            <label>Resource type {detected && <span style={{color: 'var(--accent, #5b8def)'}}>· {detected}</span>}</label>
            <select value={f.type} onChange={e => setF({...f, type: e.target.value})}>
              <option value="video">YouTube / video course</option>
              <option value="notes">Notes / study material</option>
              <option value="book">Book</option>
              <option value="course">Course</option>
              <option value="pyq">PYQ / question bank</option>
              <option value="test">Practice / test series</option>
            </select>
          </div>
          <div className="field">
            <label>YouTube playlist URL (for exact video count)</label>
            <input placeholder="https://www.youtube.com/playlist?list=..." value={f.playlistUrl} onChange={e => onPlaylistChange(e.target.value)} />
          </div>
          <div className="field">
            <label>Name {f.playlistUrl ? '(optional when importing a playlist)' : ''}</label>
            <input value={f.name} onChange={e => setF({...f, name: e.target.value})} placeholder="My Probability playlist" />
          </div>
          <div className="field">
            <label>Subject (from your syllabus)</label>
            <select value={f.subjectId} onChange={e => setF({...f, subjectId: e.target.value})}>
              <option value="">All subjects / general (won't count toward one subject's progress)</option>
              {d.subjects.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          {!f.playlistUrl && (
            <div className="field">
              <label>Total videos / units</label>
              <input type="number" min="1" value={f.totalUnits} onChange={e => setF({...f, totalUnits: e.target.value})} />
            </div>
          )}
          {!f.playlistUrl && (
            <div className="field">
              <label>Link</label>
              <input value={f.url} onChange={e => onUrlChange(e.target.value)} placeholder="https://..." />
            </div>
          )}
          {msg && <div className="error" style={{marginBottom: 12}}>{msg}</div>}
          <button className="btn primary" disabled={busy} onClick={add}>{busy ? 'Importing…' : 'Save resource'}</button>
        </div>
      )}

      {d.resources.length === 0 && <div className="empty">No resources yet — add your own above, or add one of the suggestions below.</div>}
      <div className="grid two">
        {d.resources.map((r: any) => (
          <div className="card" key={r.id}>
            <div className="resource">
              <div className="resleft">
                <div className="icon"><ResourceIcon type={r.type} /></div>
                <div>
                  <h4>{r.name}</h4>
                  <p>{r.description || r.subject}</p>
                  <span className="tag">{r.type.toUpperCase()} • {r.subject} {r.playlistId ? '• SYNCED PLAYLIST' : ''}</span>
                </div>
              </div>
              <div style={{display: 'flex', gap: 7}}>
                {r.url && <a className="btn" href={r.url} target="_blank">Open</a>}
                <button className="btn" style={{color: '#d33'}} disabled={removing === r.id} onClick={() => remove(r)}>
                  {removing === r.id ? 'Removing…' : 'Remove'}
                </button>
              </div>
            </div>
            <div style={{marginTop: 14}}>
              <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 11}}>
                <span>{r.completedUnits} / {r.totalUnits} completed</span>
                <b>{pct(r.completedUnits, r.totalUnits)}%</b>
              </div>
              <div className="bar" style={{marginTop: 7}}><i style={{width: `${pct(r.completedUnits, r.totalUnits)}%`}} /></div>
              {r.items?.length > 0 ? (
                <div style={{marginTop: 14, maxHeight: 320, overflow: 'auto'}}>
                  {r.items.map((v: any, i: number) => (
                    <div className="task" key={v.id} style={{padding: '9px 0'}}>
                      <button className={`check ${v.completed ? 'done' : ''}`} onClick={() => toggle(v)}>{v.completed ? '✓' : ''}</button>
                      <div style={{flex: 1}}>
                        <b>{i + 1}. {v.title}</b>
                        <small>{v.completed ? 'Completed' : 'Not completed'}</small>
                      </div>
                      <a className="btn" style={{padding: '6px 8px'}} target="_blank" href={`https://www.youtube.com/watch?v=${v.videoId}`}>Watch</a>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{display: 'flex', gap: 8, marginTop: 11}}>
                  <button className="btn" onClick={() => plus(r.id, -1)}>−</button>
                  <button className="btn primary" onClick={() => plus(r.id, 1)}>+ Complete next</button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="section">
        <h3>Suggested references — all subjects</h3>
        <span>Real links, nothing invented. Add the ones you'll actually use — nothing counts toward your plan until you add it</span>
      </div>
      <div className="grid two">
        {suggestions.map(s => {
          const added = alreadyAdded(s);
          return (
            <div className="card" key={s.name}>
              <div className="resource">
                <div>
                  <h4>{s.name}</h4>
                  <p>{s.description}</p>
                  <span className="tag">{s.type.toUpperCase()} • {s.subjectName || 'All subjects'}</span>
                </div>
                <div style={{display: 'flex', gap: 7}}>
                  <a className="btn" href={s.url} target="_blank">Open</a>
                  <button className="btn primary" disabled={added || addingSuggestion === s.name} onClick={() => addSuggestion(s)}>
                    {added ? 'Added ✓' : addingSuggestion === s.name ? 'Adding…' : '＋ Add to my list'}
                  </button>
                </div>
              </div>
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
