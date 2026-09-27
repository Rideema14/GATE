import {db} from './db';

// The syllabus (8 subjects, ~40 topics) is seed data — it doesn't change
// while the app is running. Every single page load hits /api/me, which
// used to re-fetch this from Postgres every time. Caching it in memory for
// a few minutes turns that into a free, one-shot lookup for the vast
// majority of requests, while still refreshing itself automatically if the
// syllabus is ever reseeded.
const TTL_MS = 5 * 60 * 1000;

let subjectsCache: {id: string; name: string; code: string}[] | null = null;
let subjectsCachedAt = 0;
export async function getSubjects() {
  if (subjectsCache && Date.now() - subjectsCachedAt < TTL_MS) return subjectsCache;
  subjectsCache = await db.subject.findMany({orderBy: {name: 'asc'}});
  subjectsCachedAt = Date.now();
  return subjectsCache;
}

let topicsCache: Awaited<ReturnType<typeof fetchTopics>> | null = null;
let topicsCachedAt = 0;
function fetchTopics() {
  return db.topic.findMany({orderBy: [{subjectId: 'asc'}, {order: 'asc'}], include: {subject: true}});
}
export async function getTopics() {
  if (topicsCache && Date.now() - topicsCachedAt < TTL_MS) return topicsCache;
  topicsCache = await fetchTopics();
  topicsCachedAt = Date.now();
  return topicsCache;
}
