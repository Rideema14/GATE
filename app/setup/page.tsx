'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';

export default function Setup() {
  const [examName, setExamName] = useState('GATE DA 2027');
  const [date, setDate] = useState('');
  const [hours, setHours] = useState('4');
  const [testDay, setTestDay] = useState('Sunday');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const r = useRouter();

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const x = await fetch('/api/setup', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({examName, examDate: date, dailyHours: +hours, testDay}),
      });
      const d = await x.json();
      if (!x.ok) {
        setErr(d.error);
        return;
      }
      r.push('/dashboard');
      r.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="center">
      <form className="auth form" onSubmit={save}>
        <div style={{display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18}}>
          <div className="brand-mark">D</div>
          <b style={{fontFamily: 'var(--font-display)', fontSize: 15}}>DA Prep</b>
        </div>
        <h1>Set up your exam</h1>
        <p>Tell the app when your exam is and how much time you really have. It builds your plan from this.</p>
        {err && <div className="error">{err}</div>}
        <div className="field">
          <label>Exam</label>
          <input value={examName} onChange={e => setExamName(e.target.value)} />
        </div>
        <div className="field">
          <label>Exam date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} required />
        </div>
        <div className="field">
          <label>Daily study time</label>
          <select value={hours} onChange={e => setHours(e.target.value)}>
            {[2, 3, 4, 5, 6, 7, 8].map(x => <option key={x} value={x}>{x} hours a day</option>)}
          </select>
        </div>
        <div className="field">
          <label>Weekly test / mock day</label>
          <select value={testDay} onChange={e => setTestDay(e.target.value)}>
            {['Sunday', 'Saturday', 'Wednesday'].map(x => <option key={x}>{x}</option>)}
          </select>
        </div>
        <button className="btn primary" style={{width: '100%'}} disabled={busy}>{busy ? 'Building your plan…' : 'Build my plan'}</button>
      </form>
    </div>
  );
}
