import {NextResponse} from 'next/server';
import {db} from '@/lib/db';
import {user} from '@/lib/auth';
import {getSubjects, getTopics} from '@/lib/syllabus';

export async function GET() {
  const u = await user();
  if (!u) return NextResponse.json({error: 'Unauthorized'}, {status: 401});
  const [subjects, topics, progress, resources, tests, noteRows] = await Promise.all([
    getSubjects(),
    getTopics(),
    db.topicProgress.findMany({where: {userId: u.id}}),
    db.resource.findMany({where: {userId: u.id}, orderBy: {createdAt: 'asc'}, include: {items: {orderBy: {position: 'asc'}}}}),
    db.test.findMany({where: {userId: u.id}, orderBy: {createdAt: 'asc'}}),
    db.videoNote.findMany({where: {userId: u.id}, select: {resourceItemId: true}}),
  ]);
  return NextResponse.json({user: {id: u.id, name: u.name, email: u.email, profile: u.profile}, subjects, topics, progress, resources, tests, noteItemIds: noteRows.map((n: {resourceItemId: string}) => n.resourceItemId)});
}
