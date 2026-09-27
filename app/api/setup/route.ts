import {NextResponse} from 'next/server';
import {db} from '@/lib/db';
import {authId} from '@/lib/auth';

export async function POST(req: Request) {
  const u = await authId();
  if (!u) return NextResponse.json({error: 'Not signed in'}, {status: 401});
  const b = await req.json();
  if (!b.examDate) return NextResponse.json({error: 'Choose an exam date.'}, {status: 400});

  await db.profile.upsert({
    where: {userId: u},
    update: {
      examName: b.examName || 'My Exam',
      examDate: new Date(b.examDate + 'T23:59:59Z'),
      dailyHours: Number(b.dailyHours) || 4,
      testDay: b.testDay || 'Sunday',
    },
    create: {
      userId: u,
      examName: b.examName || 'My Exam',
      examDate: new Date(b.examDate + 'T23:59:59Z'),
      dailyHours: Number(b.dailyHours) || 4,
      testDay: b.testDay || 'Sunday',
    },
  });

  // Note: we deliberately do NOT auto-create any resources or tests here.
  // New users see curated suggestions on the Resources/Tests pages and add
  // only the ones they choose — nothing counts toward their plan or
  // dashboard stats until they explicitly add it.
  return NextResponse.json({ok: true});
}
