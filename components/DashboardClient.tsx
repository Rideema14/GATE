'use client';
import {useEffect, useState} from 'react';
import Link from 'next/link';
import {BookOpen, PlayCircle, ClipboardCheck, Compass} from 'lucide-react';
import ResourceIcon from './ResourceIcon';
import {makePlan} from '@/lib/plan';

const WEEKDAY_EMOJI: Record<string, string> = {Sunday: '🌻', Monday: '🌷', Tuesday: '🍒', Wednesday: '🦢', Thursday: '💫', Friday: '🌙', Saturday: '☀️'};
const DOT_COLORS = ['var(--brass)', 'var(--sky)', 'var(--moss)', 'var(--rust)', 'var(--pink)'];

export default function DashboardClient() {
  const [d, setD] = useState<any>(null);
  const [plan, setPlan] = useState<any>(null);

  async function load() {
    const m = await (await fetch('/api/me')).json();
    setD(m);
    // Computed locally from data we already fetched — no separate
    // /api/plan round trip needed for the dashboard.
    setPlan(makePlan(m.user.profile, m.topics, m.progress, m.tests, m.resources));
  }
  useEffect(() => {
    load();
  }, []);
  if (!d) return <div className="empty">Loading your study system…</div>;

  const days = plan?.days || 0;
  const topics = d.topics || [];
  const done = d.progress?.filter((x: any) => x.completed).length || 0;
  const syllabusPct = pct(done, topics.length);
  const video = d.resources?.filter((x: any) => x.type === 'video') || [];
  const vd = video.reduce((a: any, x: any) => a + x.completedUnits, 0);
  const vt = video.reduce((a: any, x: any) => a + x.totalUnits, 0);
  const td = d.tests?.reduce((a: any, x: any) => a + x.completed, 0) || 0;
  const tt = d.tests?.reduce((a: any, x: any) => a + x.total, 0) || 0;
  const weakSubjects = plan?.weakSubjects || [];
  const calendar = plan?.calendar || [];
  const dayCards = calendar.slice(0, 4);
  const weekStrip = calendar.slice(0, 6);
  const today = new Date();

  const r = 24;
  const circumference = 2 * Math.PI * r;
  const ringOffset = circumference * (1 - syllabusPct / 100);

  async function topic(id: string, completed: boolean) {
    await fetch('/api/progress/topic', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({topicId: id, completed})});
    load();
  }

  return (
    <>
      <div className="dash-intro">
        <div className="eyebrow">🎯 Your preparation</div>
        <h2>{days} days to build your DA score.</h2>
        <p>Your remaining syllabus, split into learning, practice and revision. Complete a topic or log a test score, and tomorrow's plan reshapes itself around it.</p>
        <span className="dash-sticker">🌷</span>
      </div>

      <div className="bento">
        <div className="bento-main">
          {/* Countdown + this-week strip, echoing a planner's clock widget */}
          <div className="widget clock-widget">
            <div className="flip">
              <b>{days}</b>
              <span className="flip-sub">days left</span>
            </div>
            <div className="flip">
              <b>{today.toLocaleDateString('en-IN', {day: 'numeric', month: 'short'})}</b>
              <span className="flip-sub">{today.toLocaleDateString('en-IN', {weekday: 'long'})}</span>
            </div>
            <div className="flip-ring">
              <svg width="62" height="62" viewBox="0 0 62 62">
                <defs>
                  <linearGradient id="miniRingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#fff" />
                    <stop offset="100%" stopColor="rgba(255,255,255,0.55)" />
                  </linearGradient>
                </defs>
                <circle cx="31" cy="31" r={r} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="7" />
                <circle cx="31" cy="31" r={r} fill="none" stroke="url(#miniRingGradient)" strokeWidth="7" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={ringOffset} />
              </svg>
              <div style={{position: 'absolute', color: '#fff', fontSize: 11, fontWeight: 600}}>{syllabusPct}%</div>
            </div>
          </div>
          {weekStrip.length > 0 && (
            <div className="widget" style={{paddingTop: 12, paddingBottom: 12}}>
              <div className="weekstrip" style={{margin: 0}}>
                {weekStrip.map((c: any, i: number) => {
                  const dt = new Date(c.date);
                  return (
                    <div key={c.date} className={`wd ${i === 0 ? 'today' : ''} ${c.isTestDay ? 'test' : ''}`} style={i === 0 ? undefined : {background: 'var(--surface-2)', color: 'var(--text)'}}>
                      <span style={{color: i === 0 ? undefined : 'var(--muted)'}}>{dt.toLocaleDateString('en-IN', {weekday: 'short'})}</span>
                      <b>{dt.getDate()}</b>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Real day-by-day plan, presented as planner-style day cards */}
          <div className="daycards">
            {dayCards.map((c: any) => {
              const dt = new Date(c.date);
              const wd = dt.toLocaleDateString('en-IN', {weekday: 'long'});
              return (
                <div className="daycard" key={c.date}>
                  <div className="daycard-head">
                    <span className="emoji">{WEEKDAY_EMOJI[wd] || '📅'}</span>
                    <b>{wd}</b>
                    <small>{dt.toLocaleDateString('en-IN', {day: 'numeric', month: 'short'})}</small>
                  </div>
                  {c.isTestDay ? (
                    <div className="daycard-item"><span className="dot" style={{background: 'var(--rust)'}} />Mock test / PYQ practice</div>
                  ) : c.topics.length ? (
                    c.topics.map((t: any, ti: number) => (
                      <div className="daycard-item" key={t.id}>
                        <button className="check" style={{width: 16, height: 16, borderRadius: 5}} onClick={() => topic(t.id, true)} />
                        <div>
                          {t.name}
                          <small>{t.subject}</small>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="daycard-empty">{c.label || 'Free — revise or rest'}</div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="widget">
            <div className="widget-head">
              <h4>🌱 What am I weak at?</h4>
              <span>Test scores where you have them, else how much is unfinished</span>
            </div>
            {weakSubjects.length ? (
              weakSubjects.slice(0, 5).map((s: any, i: number) => {
                const value = s.avgScore != null ? s.avgScore : s.completionPct;
                const color = value < 40 ? 'var(--rust)' : value < 70 ? 'var(--brass)' : 'var(--moss)';
                return (
                  <div className="weak-row" key={s.subjectId}>
                    <span className="weak-rank">{i + 1}</span>
                    <div style={{flex: 1}}>
                      <div style={{display: 'flex', justifyContent: 'space-between', gap: 10}}>
                        <b style={{fontSize: 13}}>{s.name}</b>
                        <span className={`pill ${value < 50 ? 'warm' : 'cool'}`} style={{marginLeft: 0}}>{s.avgScore != null ? `${s.avgScore}% avg` : `${s.completionPct}% done`}</span>
                      </div>
                      <div className="weak-bar-track"><span className="weak-bar-fill" style={{width: `${value}%`, background: color}} /></div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="empty">Nothing stands out as weak yet — keep going, or score a tagged test.</div>
            )}
          </div>
        </div>

        <div className="bento-aside">
          <div className="widget">
            <div className="widget-head"><h4>📌 Subjects</h4></div>
            {d.subjects.map((s: any, i: number) => {
              const st = plan?.subjectStats?.find((x: any) => x.subjectId === s.id);
              const p = st?.completionPct ?? 0;
              const color = DOT_COLORS[i % DOT_COLORS.length];
              return (
                <div className="subject-row" key={s.id}>
                  <span className="dot" style={{background: color}} />
                  <span className="name">{s.name}</span>
                  <div className="subject-track"><i style={{width: `${p}%`, background: color}} /></div>
                  <span className="subject-pct">{p}%</span>
                </div>
              );
            })}
          </div>

          <div className="widget">
            <div className="widget-head"><h4>☀️ Daily tasks</h4></div>
            <div className="stat-row" style={{'--accent': 'var(--brass)'} as React.CSSProperties}>
              <div className="stat-chip"><BookOpen size={15} /></div>
              <div className="stat-label">Syllabus</div>
              <div className="stat-value">{syllabusPct}%</div>
            </div>
            <div className="stat-row" style={{'--accent': 'var(--sky)'} as React.CSSProperties}>
              <div className="stat-chip"><PlayCircle size={15} /></div>
              <div className="stat-label">Videos</div>
              <div className="stat-value">{vd}/{vt}</div>
            </div>
            <div className="stat-row" style={{'--accent': 'var(--moss)'} as React.CSSProperties}>
              <div className="stat-chip"><ClipboardCheck size={15} /></div>
              <div className="stat-label">Tests</div>
              <div className="stat-value">{td}/{tt}</div>
            </div>
            <div className="stat-row" style={{'--accent': 'var(--rust)'} as React.CSSProperties}>
              <div className="stat-chip"><Compass size={15} /></div>
              <div className="stat-label">Phase</div>
              <div className="stat-value" style={{fontSize: 12}}>{plan?.phase || '—'}</div>
            </div>
          </div>

          <div className="widget">
            <div className="widget-head">
              <h4>📚 Resources</h4>
              <Link href="/resources" className="btn" style={{padding: '5px 9px', fontSize: 11}}>Manage</Link>
            </div>
            {(d.resources || []).length === 0 && <div className="empty" style={{padding: 16, fontSize: 11.5}}>None yet — add one on the Resources page.</div>}
            {(d.resources || []).slice(0, 4).map((r: any) => (
              <div className="mini-resource" key={r.id}>
                <div className="icon" style={{width: 30, height: 30}}><ResourceIcon type={r.type} size={14} /></div>
                <div className="name">
                  <b>{r.name}</b>
                  <div className="bar"><i style={{width: `${pct(r.completedUnits, r.totalUnits)}%`}} /></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
function pct(a: number, b: number) {
  return b ? Math.round((a / b) * 100) : 0;
}
