// The adaptive planning engine.
//
// There is no persisted timetable anywhere — every call recomputes the plan
// from whatever is true right now (topics completed, tests scored, days
// left). That is what makes it "adaptive" without any special-case code for
// "missed a day" or "got ahead": if you did nothing yesterday, `remaining`
// still contains yesterday's topics and today's plan simply starts there.
// If you finished ahead of pace, `remaining` empties out early and the
// calendar naturally fills the rest with revision days instead of forcing
// new topics.

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export type PlanTopic = {
  id: string;
  name: string;
  order: number;
  subjectId: string;
  subject: {id: string; name: string; code: string};
};
type PlanProgress = {topicId: string; completed: boolean};
type PlanTest = {subject: string | null; score: number | null};
export type PlanResource = {subjectId: string | null; totalUnits: number; completedUnits: number};
type Profile = {examDate: Date | string; dailyHours: number; testDay: string};

// Shared by the plan engine (server) and the Progress page (client) so both
// ever show the exact same number for "how much of this subject is done".
// A subject's number blends two REAL signals only — nothing invented:
//  - syllabus topics you ticked complete on the Syllabus page
//  - resources (a YouTube playlist, a notes pack, a PYQ set — anything you
//    explicitly linked to this subject when adding it) whose units you've
//    marked done
// If you haven't linked any resource to a subject yet, its number is just
// the topic completion — exactly what it was before resources existed.
export function subjectProgress(subjectId: string, topics: PlanTopic[], progress: PlanProgress[], resources: PlanResource[] = []) {
  const doneIds = new Set(progress.filter(p => p.completed).map(p => p.topicId));
  const ts = topics.filter(t => t.subjectId === subjectId);
  const topicDone = ts.filter(t => doneIds.has(t.id)).length;
  const topicTotal = ts.length;
  const topicPct = topicTotal ? (topicDone / topicTotal) * 100 : 0;

  const rs = resources.filter(r => r.subjectId === subjectId);
  const resTotal = rs.reduce((a, r) => a + (r.totalUnits || 0), 0);
  const resDone = rs.reduce((a, r) => a + (r.completedUnits || 0), 0);
  const resPct = resTotal ? (resDone / resTotal) * 100 : null;

  // Topics stay the primary signal (they ARE the syllabus); resources you
  // chose to link in nudge the number rather than dominate it.
  const pct = resPct == null ? topicPct : topicPct * 0.65 + resPct * 0.35;

  return {
    topicDone, topicTotal, topicPct: Math.round(topicPct),
    resDone, resTotal, resPct: resPct == null ? null : Math.round(resPct),
    pct: Math.round(pct),
  };
}

export function makePlan(profile: Profile, topics: PlanTopic[], progress: PlanProgress[], tests: PlanTest[] = [], resources: PlanResource[] = []) {
  const days = Math.max(1, Math.ceil((new Date(profile.examDate).getTime() - Date.now()) / 86400000));
  const dailyHours = Math.max(1, Math.floor(profile.dailyHours) || 1);
  const doneIds = new Set(progress.filter(p => p.completed).map(p => p.topicId));

  // --- Per-subject stats: blended completion % (see subjectProgress above)
  // plus average scored-test performance. A test only informs a subject's
  // weakness if the student tagged it with that subject when they logged
  // the score — untagged tests are ignored here (they still count toward
  // the overall practice-tracker numbers elsewhere, just not toward "what
  // am I weak at").
  const subjectIds = Array.from(new Set(topics.map(t => t.subjectId)));
  const namesById = new Map(topics.map(t => [t.subjectId, t.subject.name]));
  const scoresBySubject = new Map<string, number[]>();
  for (const test of tests) {
    if (!test.subject || test.score == null) continue;
    for (const id of subjectIds) {
      if (namesById.get(id) === test.subject) scoresBySubject.set(id, [...(scoresBySubject.get(id) || []), test.score]);
    }
  }

  const subjectStats = subjectIds
    .map(id => {
      const prog = subjectProgress(id, topics, progress, resources);
      const scores = scoresBySubject.get(id) || [];
      const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
      // Weakness combines how much is still unlearned with how the student
      // actually performs when tested on it. A tested weakness (low score)
      // is weighted more heavily than raw incompletion, since it reflects
      // real exam-condition performance rather than just "haven't gotten to
      // it yet".
      const weaknessScore = avgScore != null ? (100 - avgScore) * 0.7 + (100 - prog.pct) * 0.3 : 100 - prog.pct;
      return {subjectId: id, name: namesById.get(id)!, completionPct: prog.pct, topicPct: prog.topicPct, resourcePct: prog.resPct, avgScore, weaknessScore};
    })
    .sort((a, b) => b.weaknessScore - a.weaknessScore);

  const weaknessRank = new Map(subjectStats.map((s, i) => [s.subjectId, i]));

  // Remaining topics, weakest subjects first (this single ordering is what
  // drives "give weak topics more attention" everywhere below — today's
  // tasks, the calendar, and the plan-remaining count all just read off the
  // front of this list).
  const remaining = topics
    .filter(t => !doneIds.has(t.id))
    .sort((a, b) => {
      const wa = weaknessRank.get(a.subjectId) ?? 999;
      const wb = weaknessRank.get(b.subjectId) ?? 999;
      return wa !== wb ? wa - wb : a.order - b.order;
    });

  const phase = days < 21 ? 'Final revision' : days < 60 ? 'Practice + revision' : 'Concepts + practice';
  // Rough pacing: a topic being learned for the first time takes longer than
  // one that's just being reinforced closer to the exam.
  const hoursPerTopic = phase === 'Final revision' ? 0.75 : phase === 'Practice + revision' ? 1 : 1.5;
  const perDay = Math.max(1, Math.min(4, Math.round(dailyHours / hoursPerTopic)));

  // Day-by-day calendar for the visible window. The student's preferred
  // weekly test day is marked as a test/PYQ day rather than given new
  // topics, whatever the pace looks like.
  const windowSize = Math.min(days, 21);
  const testDayIndex = WEEKDAYS.indexOf(profile.testDay);
  let cursor = 0;
  const calendar = Array.from({length: windowSize}, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const isTestDay = testDayIndex >= 0 && date.getDay() === testDayIndex;
    if (isTestDay) {
      return {date: date.toISOString(), isTestDay: true, topics: [] as {id: string; name: string; subject: string}[], label: 'Mock test / PYQ day'};
    }
    const slice = remaining.slice(cursor, cursor + perDay);
    cursor += slice.length;
    return {
      date: date.toISOString(),
      isTestDay: false,
      topics: slice.map(t => ({id: t.id, name: t.name, subject: t.subject.name})),
      label: slice.length ? '' : 'Ahead of schedule — revision & practice',
    };
  });

  return {
    days,
    dailyHours,
    phase,
    perDay,
    remaining,
    subjectStats,
    weakSubjects: subjectStats.filter(s => s.completionPct < 100 || s.avgScore != null).slice(0, 3),
    calendar,
  };
}
