'use client';
import {useEffect, useState} from 'react';
import Link from 'next/link';
import ResourceIcon from './ResourceIcon';

export default function DashboardClient() {
  const [d, setD] = useState<any>(null);
  const [plan, setPlan] = useState<any>(null);

  async function load() {
    const [a, b] = await Promise.all([fetch('/api/me'), fetch('/api/plan')]);
    setD(await a.json());
    setPlan(await b.json());
  }
  useEffect(() => {
    load();
  }, []);
  if (!d) return <div className="empty">Loading your study system…</div>;

  const days = plan?.days || 0;
  const topics = d.topics || [];
  const done = d.progress?.filter((x: any) => x.completed).length || 0;
  const video = d.resources?.filter((x: any) => x.type === 'video') || [];
  const vd = video.reduce((a: any, x: any) => a + x.completedUnits, 0);
  const vt = video.reduce((a: any, x: any) => a + x.totalUnits, 0);
  const td = d.tests?.reduce((a: any, x: any) => a + x.completed, 0) || 0;
  const tt = d.tests?.reduce((a: any, x: any) => a + x.total, 0) || 0;
  const today = plan?.calendar?.[0];
  const weakSubjects = plan?.weakSubjects || [];

  async function topic(id: string, completed: boolean) {
    await fetch('/api/progress/topic', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({topicId: id, completed})});
    load();
  }

  return (
    <>
      <div className="hero">
        <div>
          <div className="eyebrow">Your preparation</div>
          <h2>{days} days to build your DA score.</h2>
          <p>The app divides your remaining syllabus into learning, practice and revision. When you complete work — or score a test — the next plan recalculates.</p>
        </div>
        <div className="days">{days}<span>days left</span></div>
      </div>

      <div className="grid four" style={{marginTop: 14}}>
        <Metric label="Syllabus left" value={`${pct(done, topics.length)}%`} hint={`${done}/${topics.length} topics done`} />
        <Metric label="Videos" value={`${vd}/${vt}`} hint="your selected resources" />
        <Metric label="Tests" value={`${td}/${tt}`} hint="tests and PYQs" />
        <Metric label="Phase" value={plan?.phase || '—'} hint={`${d.user.profile.dailyHours} hrs a day`} />
      </div>

      <div className="section">
        <h3>What am I weak at?</h3>
        <span>Ranked from your test scores where you have them, otherwise from how much is unfinished</span>
      </div>
      <div className="card">
        {weakSubjects.length ? (
          weakSubjects.map((s: any) => (
            <div className="task" key={s.subjectId}>
              <div style={{flex: 1}}>
                <b>{s.name}</b>
                <small>{s.avgScore != null ? 'Based on your scored tests for this subject' : 'No scored tests yet for this subject — tag one on the tests page'}</small>
              </div>
              <span className="pill">{s.avgScore != null ? `${s.avgScore}% avg` : `${s.completionPct}% done`}</span>
            </div>
          ))
        ) : (
          <div className="empty">Nothing stands out as weak yet — keep going, or score a tagged test to get a real signal.</div>
        )}
      </div>

      <div className="section">
        <h3>Today's plan</h3>
        <span>{new Date().toLocaleDateString('en-IN', {weekday: 'long', day: 'numeric', month: 'short'})}</span>
      </div>
      <div className="card">
        {today?.isTestDay ? (
          <div className="task">
            <div style={{flex: 1}}>
              <b>Mock test / PYQ practice</b>
              <small>Your preferred weekly test day — no new topics today, log a score on the tests page.</small>
            </div>
            <span className="pill">Test day</span>
          </div>
        ) : today?.topics?.length ? (
          today.topics.map((t: any) => (
            <div className="task" key={t.id}>
              <button className="check" onClick={() => topic(t.id, true)}>✓</button>
              <div style={{flex: 1}}>
                <b>{t.subject}: {t.name}</b>
                <small>Study the concept, solve a few questions, then mark it complete.</small>
              </div>
              <span className="pill">Learn</span>
            </div>
          ))
        ) : (
          <div className="empty">{today?.label || 'All current topics are complete. Move to revision and mocks.'}</div>
        )}
      </div>

      <div className="section">
        <h3>Your selected resources</h3>
        <Link href="/resources" className="btn">Manage</Link>
      </div>
      <div className="grid two">
        {(d.resources || []).slice(0, 4).map((r: any) => (
          <div className="card" key={r.id}>
            <div className="resource">
              <div className="resleft">
                <div className="icon"><ResourceIcon type={r.type} /></div>
                <div>
                  <h4>{r.name}</h4>
                  <p>{r.description || r.subject}</p>
                </div>
              </div>
              <b>{r.completedUnits}/{r.totalUnits}</b>
            </div>
            <div className="bar" style={{marginTop: 14}}><i style={{width: `${pct(r.completedUnits, r.totalUnits)}%`}} /></div>
          </div>
        ))}
      </div>
    </>
  );
}
function Metric({label, value, hint}: {label: string; value: string; hint: string}) {
  return (
    <div className="card metric">
      <div className="label">{label}</div>
      <strong>{value}</strong>
      <small>{hint}</small>
    </div>
  );
}
function pct(a: number, b: number) {
  return b ? Math.round((a / b) * 100) : 0;
}
