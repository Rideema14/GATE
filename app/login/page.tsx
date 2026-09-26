'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';

export default function Login() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const r = useRouter();

  async function go(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    if (mode === 'register' && password !== confirmPassword) {
      setErr('Passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/auth/' + mode, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email, password, name}),
      });
      const d = await res.json();
      if (!res.ok) {
        setErr(d.error || 'Something went wrong');
        return;
      }
      r.push(d.next || '/setup');
      r.refresh();
    } finally {
      setBusy(false);
    }
  }

  function switchMode() {
    setErr('');
    setPassword('');
    setConfirmPassword('');
    setMode(mode === 'login' ? 'register' : 'login');
  }

  return (
    <div className="center">
      <form className="auth" onSubmit={go}>
        <div style={{display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18}}>
          <div className="brand-mark">D</div>
          <b style={{fontFamily: 'var(--font-display)', fontSize: 15}}>DA Prep</b>
        </div>
        <h1>{mode === 'login' ? 'Welcome back' : 'Build your study system'}</h1>
        <p>
          {mode === 'login'
            ? 'Your plan, resources and progress in one place.'
            : 'Create your account and start your adaptive GATE DA plan.'}
        </p>
        {err && <div className="error">{err}</div>}
        {mode === 'register' && (
          <div className="field">
            <label>Name</label>
            <input value={name} onChange={e => setName(e.target.value)} required />
          </div>
        )}
        <div className="field">
          <label>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
        </div>
        <div className="field">
          <label>Password</label>
          <input
            type="password"
            minLength={6}
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          />
        </div>
        {mode === 'register' && (
          <div className="field">
            <label>Confirm password</label>
            <input
              type="password"
              minLength={6}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>
        )}
        <button className="btn primary" style={{width: '100%'}} disabled={busy}>
          {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
        </button>
        <button type="button" className="btn" style={{width: '100%', marginTop: 8}} onClick={switchMode}>
          {mode === 'login' ? 'Create new account' : 'I already have an account'}
        </button>
      </form>
    </div>
  );
}
