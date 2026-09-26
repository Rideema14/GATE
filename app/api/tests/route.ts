import {NextResponse} from 'next/server';
import {db} from '@/lib/db';
import {user} from '@/lib/auth';

export async function POST(req: Request) {
  const u = await user();
  if (!u) return NextResponse.json({error: 'Unauthorized'}, {status: 401});
  const b = await req.json();
  return NextResponse.json(
    await db.test.create({
      data: {
        userId: u.id,
        name: b.name,
        type: b.type || 'Mock',
        subject: b.subject || null,
        total: Number(b.total) || 1,
      },
    })
  );
}

export async function PATCH(req: Request) {
  const u = await user();
  if (!u) return NextResponse.json({error: 'Unauthorized'}, {status: 401});
  const b = await req.json();
  const t = await db.test.findFirst({where: {id: b.id, userId: u.id}});
  if (!t) return NextResponse.json({error: 'Not found'}, {status: 404});
  return NextResponse.json(
    await db.test.update({
      where: {id: t.id},
      data: {
        completed: Math.max(0, Math.min(t.total, t.completed + Number(b.delta || 0))),
        score: b.score === undefined ? t.score : Number(b.score),
      },
    })
  );
}
