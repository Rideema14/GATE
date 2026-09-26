# DA Prep — Full-Stack GATE DA Study Planner

A production-ready Next.js + Prisma application for GATE Data Science & AI
exam preparation: adaptive study plans, syllabus tracking, resource/YouTube
playlist tracking, and test/PYQ tracking, all backed by real per-user data
in a database.

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript
- Prisma 6 + PostgreSQL
- Cookie-based sessions (JWT via `jose`), bcrypt password hashing
- API routes for all backend logic — no external backend needed

## Application flow

```
Register → Login → Exam Setup → Dashboard → Syllabus → Resources
                                     ↓
                        YouTube Playlist Tracking
                                     ↓
                           Tests / PYQs → Progress
                                     ↓
                        Adaptive Study Plan (recalculates
                        automatically from real progress)
```

Every number shown in the app (dashboard stats, progress bars, plan pacing)
is computed from real database rows tied to the signed-in user. There is no
mock or placeholder data.

## 1. Get a PostgreSQL database

The app uses PostgreSQL for both local development and production, so there
is no dev/prod mismatch to debug later. Any Postgres works, but the two
easiest free options:

- **Neon** — https://neon.tech (recommended: serverless, generous free tier,
  works great with Vercel)
- **Supabase** — https://supabase.com

Create a project, then copy its connection string (it looks like
`postgresql://user:password@host/dbname?sslmode=require`).

## 2. Local setup

```bash
npm install
cp .env.example .env      # on Windows: copy .env.example .env
```

Fill in `.env`:

```env
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
AUTH_SECRET="a long random string"   # generate with: openssl rand -base64 32
NEXT_PUBLIC_APP_URL="http://localhost:3000"
YOUTUBE_API_KEY=""                    # optional, see below
```

Then push the schema and seed the GATE DA syllabus:

```bash
npm run db:setup
npm run dev
```

Open http://localhost:3000 — you'll land on `/login` since no session exists
yet. Register an account, complete exam setup, and you're in.

## 3. Deploying to Vercel

1. Push this repo to GitHub.
2. Import it into Vercel.
3. In the Vercel project's Environment Variables, set `DATABASE_URL`,
   `AUTH_SECRET`, `NEXT_PUBLIC_APP_URL` (your production URL), and optionally
   `YOUTUBE_API_KEY`. Use the **same** Postgres connection string approach as
   local dev (a Neon/Supabase project is reachable from anywhere, so the same
   database — or a separate production one — works out of the box).
4. Deploy. The build runs `prisma generate && next build` automatically
   (see `package.json`).
5. After the first deploy, run the schema push once against your production
   database (from your machine, with the production `DATABASE_URL` in your
   shell): `npx prisma db push && npx tsx prisma/seed.ts`. You only need to
   do this once per database — after that, the schema already exists.

No SQLite file is ever committed or required in production — Vercel's
serverless functions have an ephemeral, read-only-outside-`/tmp` filesystem,
so a file-based database would not persist between requests anyway.

If you already have a running database from an earlier version of this
project, `prisma/schema.prisma` gained new nullable columns since then
(`Test.subject`, and now `Resource.subjectId`). Run `npx prisma db push`
again — it's additive and safe, existing rows just get the new column set
to `null`.

## How the adaptive plan actually works

There is no persisted timetable stored anywhere — `lib/plan.ts` recomputes
the whole plan from scratch on every request, from whatever is true right
now:

- **Missed a day?** Nothing to "catch up" — yesterday's unfinished topics are
  still in `remaining`, so today's plan just starts there.
- **Ahead of pace?** `remaining` runs out before the calendar window does, so
  the extra days automatically show as revision/practice days instead of
  forcing new topics.
- **Weak in a subject?** Every subject gets a weakness score from two
  signals: how much of it is still unfinished, and — when you've tagged a
  scored test with that subject on the Tests page — your average score
  there (weighted more heavily, since it reflects real exam-condition
  performance rather than just "haven't studied it yet"). Weak subjects'
  topics are moved to the front of the queue everywhere: today's plan, the
  day-by-day calendar, and the Plan page's "Subjects by priority" list.
- **Test day**: whichever weekday you set in Exam Setup is marked on the
  calendar as a mock-test/PYQ day rather than given new topics.

## Authentication

- Registration collects name, email, password and password confirmation
  (checked client-side before submit, and the server independently validates
  email format and password length).
- Passwords are hashed with bcrypt (cost factor 12) — never stored in
  plaintext.
- Sessions are signed JWTs in an HTTP-only, `SameSite=Lax` cookie (30-day
  expiry), marked `Secure` automatically in production.
- Every protected page and API route resolves the current user from that
  cookie server-side; unauthenticated visitors are redirected to `/login`.
- All data (profile, resources, progress, tests) is scoped to the
  authenticated user's ID on every read and write — one account can never
  see or modify another account's data.
- Logging out clears the session cookie.

## YouTube playlist tracking

1. Paste a public YouTube playlist URL into Resources.
2. With `YOUTUBE_API_KEY` set, the backend reads the playlist through the
   YouTube Data API v3 and imports the exact current video count and every
   video's title/ID.
3. The dashboard and Resources page show `4 / 37 completed`, etc.
4. Tick each video as done — every tick is saved to the database — and the
   progress bar updates automatically. Each video has its own **Watch**
   button (opens on YouTube).

Without a key, playlist import is disabled but the rest of the app — manual
resource creation with a total count and a "+ Complete next" tracker — still
works fully.

To get a key: create a Google Cloud project, enable **YouTube Data API v3**,
create an API key, and put it in `YOUTUBE_API_KEY`. Keep it server-side only
(never expose it as a `NEXT_PUBLIC_` variable — this app never does).

## Resources: real linkage, not free text

Every resource you add on the Resources page — a YouTube playlist, a PYQ
set, a notes pack — is tied to one of the *actual* seeded syllabus subjects
through a real dropdown (`Subject`/`subjectId` in the database), not a
free-typed label that could drift out of sync. Two things follow from that:

- **Auto-differentiation**: pasting a link auto-detects whether it's a
  YouTube video/playlist or a known PYQ/test-prep site and pre-selects the
  matching resource type. You can still change the dropdown before saving —
  detection only sets a starting point, it never locks the choice.
- **Real progress linkage**: once a resource is linked to a subject,
  completing its items feeds into that subject's progress bar on the
  Progress page and into the adaptive plan's weakness scoring (see
  `subjectProgress` in `lib/plan.ts`). Topics you've ticked off remain the
  primary signal; linked resources blend in as a secondary one. Leave a
  resource as "All subjects / general" and it still counts in the overall
  video/test stats, just not toward any single subject's bar.

The "Suggested references" on the Resources page work the same way as
before: they are real, named links (NPTEL, GeeksforGeeks, GATE Overflow,
well-known YouTube channels, etc.) covering all 8 syllabus subjects plus
general aptitude — but nothing is ever added automatically. Each suggestion
needs your own tap on "+ Add to my list", and you're always free to ignore
it and add your own link instead.

## Main features

- Register / login / logout with isolated per-user data
- Exam setup (exam name, exam date, daily study hours, preferred test day)
- Preloaded GATE DA syllabus (General Aptitude, Probability & Statistics,
  Linear Algebra, Calculus & Optimization, Programming & Data Structures,
  Databases, Machine Learning, Artificial Intelligence) with topic-level
  completion tracking
- Adaptive study plan that recalculates from real remaining topics and days
  left until the exam
- Dashboard with live syllabus/video/test stats and today's suggested tasks
- Resources: study material, PYQs, test series, and YouTube courses, with
  exact playlist import and per-video completion
- Test/PYQ tracker with attempt counts and scores
- Progress analytics broken down by subject

## Project structure

```
app/            Pages (App Router) and API routes
components/     Client components for each page
lib/            Auth, database client, and study-plan logic
prisma/         Schema and syllabus seed data
```
#   G A T E  
 