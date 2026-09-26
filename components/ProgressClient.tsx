'use client';
import {useEffect, useState} from 'react';
import {subjectProgress} from '@/lib/plan';

export default function ProgressClient() {
  const [d, setD] = useState<any>();
  useEffect(() => {
    fetch('/api/me').then(r => r.json()).then(setD);
  }, []);
  if (!d) return <div className="empty">Loading analytics…</div>;

  const topics = d.topics.length;
  const done = d.progress.filter((x: any) => x.completed).length;
  const vd = d.resources.filter((r: any) => r.type === 'video').reduce((a: number, r: any) => a + r.completedUnits, 0);
  const vt = d.resources.filter((r: any) => r.type === 'video').reduce((a: number, r: any) => a + r.totalUnits, 0);
  const td = d.tests.reduce((a: number, t: any) => a + t.completed, 0);
  const tt = d.tests.reduce((a: number, t: any) => a + t.total, 0);

  return (
    <>
      <div className="grid three">
        <Metric l="Syllabus" v={pct(done, topics) + '%'} s={`${done}/${topics} topics`} />
        <Metric l="Videos" v={`${vd}/${vt}`} s="selected course progress" />
        <Metric l="Tests + PYQs" v={`${td}/${tt}`} s="practice tracked" />
      </div>
      <div className="section">
        <h3>Subject progress</h3>
        <span>Syllabus topics, blended with any resources you've linked to that subject</span>
      </div>
      <div className="card">
        {d.subjects.map((s: any) => {
          const sp = subjectProgress(s.id, d.topics, d.progress, d.resources);
          return (
            <div style={{marginBottom: 16}} key={s.id}>
              <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 12}}>
                <b>{s.name}</b>
                <span>{sp.pct}%</span>
              </div>
              <div className="bar" style={{marginTop: 7}}><i style={{width: sp.pct + '%'}} /></div>
              <small style={{color: 'var(--muted)'}}>
                {sp.topicDone}/{sp.topicTotal} topics
                {sp.resTotal > 0 ? ` • ${sp.resDone}/${sp.resTotal} linked resource units (${sp.resPct}%)` : ' • no resources linked to this subject yet'}
              </small>
            </div>
          );
        })}
      </div>
    </>
  );
}
function Metric({l, v, s}: {l: string; v: string; s: string}) {
  return (
    <div className="card metric">
      <div className="label">{l}</div>
      <strong>{v}</strong>
      <small>{s}</small>
    </div>
  );
}
function pct(a: number, b: number) {
  return b ? Math.round((a / b) * 100) : 0;
}