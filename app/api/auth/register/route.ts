import {NextResponse} from 'next/server';
import {db} from '@/lib/db';
import {hash, setSession} from '@/lib/auth';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  try {
    const {email, password, name} = await req.json();
    if (!email || typeof email !== 'string' || !EMAIL_RE.test(email)) {
      return NextResponse.json({error: 'Enter a valid email address.'}, {status: 400});
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json({error: 'Password must be at least 6 characters.'}, {status: 400});
    }
    const normalizedEmail = email.toLowerCase().trim();
    const exists = await db.user.findUnique({where: {email: normalizedEmail}});
    if (exists) return NextResponse.json({error: 'An account with this email already exists.'}, {status: 409});
    const u = await db.user.create({
      data: {
        email: normalizedEmail,
        name: (typeof name === 'string' && name.trim()) || 'Student',
        passwordHash: await hash(password),
      },
    });
    await setSession(u.id);
    return NextResponse.json({next: '/setup'});
  } catch {
    return NextResponse.json({error: 'Could not create account.'}, {status: 500});
  }
}
