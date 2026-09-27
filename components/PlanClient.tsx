'use client';
import {useEffect, useState} from 'react';
import {makePlan} from '@/lib/plan';

export default function PlanClient() {
  const [d, setD] = useState<any>();
  useEffect(() => {
    fetch('/api/me').then(r => r.json()).then(m => {
      // Computed locally from the same data the page already needed to
      // fetch — no separate /api/plan round trip.
      const p = makePlan(m.user.profile, m.topics, m.progress, m.tests, m.resources);
      setD({p, m});
    });
  }, []);
  if (!d) return <div className="empty">Building your plan…</div>;

  const p = d.p;
  const remaining = p.remaining || [];
  const days = Math.max(1, p.days || 1);
  const perDay = p.perDay || 1;
  const calendar = p.calendar || [];
  const subjectStats = p.subjectStats || [];

  return (
    <>
      <div className="card hero">
        <div>
          <div className="eyebrow">How this plan adapts</div>
          <h2>{p.phase}</h2>
          <p>
            {remaining.length} topics remain. At your current pace the planner targets about {perDay} topic{perDay === 1 ? '' : 's'} in a study day, ordered so your weakest subjects come first, with room left for practice and revision.
            {d.m.user.profile.testDay ? ` ${d.m.user.profile.testDay}s are reserved for mock tests and PYQs.` : ''}
          </p>
        </div>
        <div className="days">{days}<span>days</span></div>
      </div>

      <div className="section">
        <h3>Subjects by priority</h3>
        <span>Weakest first — this is the order the planner is working through</span>
      </div>
      <div className="grid two">
        {subjectStats.map((s: any) => (
          <div className="card" key={s.subjectId}>
            <div className="section" style={{marginTop: 0}}>
              <h3>{s.name}</h3>
              <span>{s.completionPct}% done{s.avgScore != null ? ` • ${s.avgScore}% avg score` : ''}</span>
            </div>
            <div className="bar"><i style={{width: `${s.completionPct}%`}} /></div>
          </div>
        ))}
      </div>

      <div className="section">
        <h3>Next {calendar.length} days</h3>
        <span>Recalculated from your current progress and test scores every time you open this page</span>
      </div>
      <div className="grid two">
        {calendar.map((day: any, i: number) => {
          const date = new Date(day.date);
          return (
            <div className="card" key={i} style={i === 0 ? {borderColor: 'var(--brass)'} : undefined}>
              <div className="eyebrow">{i === 0 ? 'Today' : date.toLocaleDateString('en-IN', {weekday: 'short'})}</div>
              <h3 style={{margin: '7px 0', fontSize: 17}}>{date.toLocaleDateString('en-IN', {day: 'numeric', month: 'short'})}</h3>
              {day.isTestDay ? (
                <p style={{margin: 0, color: 'var(--muted)', fontSize: 12}}>Mock test / PYQ day</p>
              ) : day.topics.length ? (
                <p style={{margin: 0, color: 'var(--muted)', fontSize: 12}}>{day.topics.map((t: any) => `${t.subject}: ${t.name}`).join(', ')}</p>
              ) : (
                <p style={{margin: 0, color: 'var(--muted)', fontSize: 12}}>{day.label}</p>
              )}
              <span className="tag">{day.isTestDay ? 'Test day' : `${d.m.user.profile.dailyHours} hrs planned`}</span>
            </div>
          );
        })}
      </div>
    </>
  );
}
