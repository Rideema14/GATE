import {NextResponse} from 'next/server';
import {db} from '@/lib/db';
import {user} from '@/lib/auth';

export async function POST(req: Request) {
  const u = await user();
  if (!u) return NextResponse.json({error: 'Unauthorized'}, {status: 401});
  const b = await req.json();

  // Defensive de-dupe: even if the caller sends duplicate videoIds, never
  // let that reach the database and trip the unique constraint.
  let items: {videoId: string; title: string; position: number}[] | undefined;
  if (b.items?.length) {
    const seen = new Set<string>();
    items = (b.items as any[])
      .filter(x => x?.videoId && !(seen.has(x.videoId) ? true : (seen.add(x.videoId), false)))
      .map((x, i) => ({videoId: x.videoId, title: x.title || 'Untitled video', position: x.position ?? i}));
  }

  // A resource only counts toward a subject's progress if it's genuinely
  // linked to one of the real syllabus subjects — never trust a free-typed
  // name from the client. "All subjects" / left blank stays unlinked
  // (subjectId null) rather than being guessed at.
  let subjectId: string | null = null;
  let subjectName = 'All subjects';
  if (b.subjectId) {
    const subj = await db.subject.findUnique({where: {id: String(b.subjectId)}});
    if (subj) {
      subjectId = subj.id;
      subjectName = subj.name;
    }
  }

  // Auto-differentiate the resource type from the link itself where it's
  // obvious, so the dropdown is a starting point, not the source of truth.
  // The person can still override it — nothing here is forced.
  const url: string = b.url || '';
  let type = b.type || 'notes';
  if (/youtube\.com|youtu\.be/i.test(url)) type = 'video';

  try {
    const resource = await db.resource.create({
      data: {
        userId: u.id,
        name: b.name,
        type,
        subject: subjectName,
        subjectId,
        totalUnits: Number(b.totalUnits) || (items?.length ?? 1),
        url: url || null,
        description: b.description || null,
        playlistId: b.playlistId || null,
        items: items?.length ? {create: items} : undefined,
      },
      include: {items: {orderBy: {position: 'asc'}}},
    });
    return NextResponse.json(resource);
  } catch (e: any) {
    if (e?.code === 'P2002') {
      return NextResponse.json({error: 'This resource has duplicate videos and could not be saved. Please try importing the playlist again.'}, {status: 409});
    }
    return NextResponse.json({error: 'Could not save this resource.'}, {status: 500});
  }
}

export async function DELETE(req: Request) {
  const u = await user();
  if (!u) return NextResponse.json({error: 'Unauthorized'}, {status: 401});
  const {id} = await req.json();
  if (!id) return NextResponse.json({error: 'Missing resource id'}, {status: 400});

  // Ownership check before delete — a user can only ever remove their own
  // resource, never anyone else's.
  const existing = await db.resource.findFirst({where: {id: String(id), userId: u.id}});
  if (!existing) return NextResponse.json({error: 'Resource not found'}, {status: 404});

  await db.resource.delete({where: {id: existing.id}});
  return NextResponse.json({ok: true});
}