'use client';
import {useEffect, useState} from 'react';

export default function SyllabusClient() {
  const [d, setD] = useState<any>();
  async function load() {
    setD(await (await fetch('/api/me')).json());
  }
  useEffect(() => {
    load();
  }, []);
  if (!d) return <div className="empty">Loading syllabus…</div>;

  async function toggle(id: string, completed: boolean) {
    await fetch('/api/progress/topic', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({topicId: id, completed})});
    load();
  }

  return (
    <div className="grid two">
      {d.subjects.map((s: any) => {
        const ts = d.topics.filter((t: any) => t.subjectId === s.id);
        const done = ts.filter((t: any) => d.progress.some((p: any) => p.topicId === t.id && p.completed)).length;
        return (
          <div className="subject" key={s.id}>
            <div className="subjecthead">
              <div>
                <h4>{s.code}: {s.name}</h4>
                <small>{done}/{ts.length} topics complete</small>
              </div>
              <b>{pct(done, ts.length)}%</b>
            </div>
            <div className="bar" style={{marginTop: 11}}><i style={{width: `${pct(done, ts.length)}%`}} /></div>
            <div className="subjectlist">
              {ts.map((t: any) => {
                const yes = d.progress.some((p: any) => p.topicId === t.id && p.completed);
                return (
                  <div className="task" key={t.id}>
                    <button className={`check ${yes ? 'done' : ''}`} onClick={() => toggle(t.id, !yes)}>{yes ? '✓' : ''}</button>
                    <div>
                      <b>{t.name}</b>
                      <small>{yes ? 'Completed — tap to reopen' : 'Not completed yet'}</small>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
function pct(a: number, b: number) {
  return b ? Math.round((a / b) * 100) : 0;
}
