import {NextResponse} from 'next/server';
import {db} from '@/lib/db';
import {user} from '@/lib/auth';
import {makePlan} from '@/lib/plan';

export async function GET() {
  const u = await user();
  if (!u || !u.profile) return NextResponse.json({error: 'Setup required'}, {status: 400});
  const [topics, progress, tests, resources] = await Promise.all([
    db.topic.findMany({include: {subject: true}, orderBy: {order: 'asc'}}),
    db.topicProgress.findMany({where: {userId: u.id}}),
    db.test.findMany({where: {userId: u.id}}),
    db.resource.findMany({where: {userId: u.id}, select: {subjectId: true, totalUnits: true, completedUnits: true}}),
  ]);
  return NextResponse.json(makePlan(u.profile, topics, progress, tests, resources));
}