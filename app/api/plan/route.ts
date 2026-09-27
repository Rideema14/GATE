import {NextResponse} from 'next/server';
import {db} from '@/lib/db';
import {user} from '@/lib/auth';
import {makePlan} from '@/lib/plan';
import {getTopics} from '@/lib/syllabus';

// Kept for completeness / external callers, but the Dashboard and Plan
// pages no longer hit this — they compute the same plan client-side from
// the single /api/me payload using the same makePlan() function, saving a
// full extra request + auth check + set of queries on every page load.
export async function GET() {
  const u = await user();
  if (!u || !u.profile) return NextResponse.json({error: 'Setup required'}, {status: 400});
  const [topics, progress, tests, resources] = await Promise.all([
    getTopics(),
    db.topicProgress.findMany({where: {userId: u.id}}),
    db.test.findMany({where: {userId: u.id}}),
    db.resource.findMany({where: {userId: u.id}, select: {subjectId: true, totalUnits: true, completedUnits: true}}),
  ]);
  return NextResponse.json(makePlan(u.profile, topics, progress, tests, resources));
}
