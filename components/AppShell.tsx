'use client';
import {useEffect, useMemo, useState} from 'react';
import Link from 'next/link';
import {usePathname, useRouter} from 'next/navigation';
import {LayoutDashboard, CalendarRange, ListChecks, Library, ClipboardCheck, LineChart, Menu, X, Settings, LogOut} from 'lucide-react';

const nav = [
  {href: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard},
  {href: '/plan', label: 'My plan', Icon: CalendarRange},
  {href: '/syllabus', label: 'Syllabus', Icon: ListChecks},
  {href: '/resources', label: 'Resources', Icon: Library},
  {href: '/tests', label: 'Tests & PYQs', Icon: ClipboardCheck},
  {href: '/progress', label: 'Progress', Icon: LineChart},
];

export default function AppShell({children, title, sub}: {children: React.ReactNode; title: string; sub?: string}) {
  const [me, setMe] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const router = useRouter();

  useEffect(() => {
    fetch('/api/me').then(r => r.json()).then(setMe);
  }, []);
  useEffect(() => {
    setOpen(false);
  }, [path]);

  const days = useMemo(
    () => (me?.user?.profile ? Math.max(0, Math.ceil((new Date(me.user.profile.examDate).getTime() - Date.now()) / 86400000)) : 0),
    [me]
  );
  const topics = me?.topics?.length || 0;
  const done = me?.progress?.filter((x: any) => x.completed).length || 0;

  async function logout() {
    await fetch('/api/auth/logout', {method: 'POST'});
    router.push('/login');
  }

  return (
    <div className="shell">
      <div className="mobiletop">
        <button className="menubtn" aria-label="Open menu" onClick={() => setOpen(true)}><Menu size={18} /></button>
        <b>DA Prep</b>
      </div>
      <div className={`scrim ${open ? 'show' : ''}`} onClick={() => setOpen(false)} />
      <aside className={`side ${open ? 'open' : ''}`}>
        <div className="brand">
          <div className="brand-mark">🎯</div>
          <div>
            <b>DA Prep</b>
            <small>Your exam control desk</small>
          </div>
          <button className="closebtn" aria-label="Close menu" onClick={() => setOpen(false)}><X size={18} /></button>
        </div>
        <nav className="nav">
          {nav.map(({href, label, Icon}) => (
            <Link key={href} href={href} className={path === href ? 'active' : ''} aria-current={path === href ? 'page' : undefined}>
              <Icon size={17} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="ticket">
          <span className="k">Exam countdown</span>
          <b className="n">{days} days</b>
          <span className="d">
            {me?.user?.profile ? new Date(me.user.profile.examDate).toLocaleDateString('en-IN', {day: 'numeric', month: 'short', year: 'numeric'}) : 'Complete setup'}
          </span>
          <div className="bar" style={{marginTop: 10}}><i style={{width: `${topics ? pct(done, topics) : 0}%`}} /></div>
        </div>
      </aside>
      <main className="main">
        <header className="top">
          <div>
            <div className="eyebrow">{me?.user?.profile?.examName || 'Exam control desk'}</div>
            <h1>{title}</h1>
            <p>{sub || `${me?.user?.profile?.dailyHours || 4} hours a day, ${days} days to go.`}</p>
          </div>
          <div className="actions">
            <Link className="btn" href="/setup"><Settings size={15} /> Setup</Link>
            <button className="btn" onClick={logout}><LogOut size={15} /> Log out</button>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
function pct(a: number, b: number) {
  return b ? Math.round((a / b) * 100) : 0;
}
