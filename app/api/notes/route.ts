import {NextResponse} from 'next/server';
import {db} from '@/lib/db';
import {authId} from '@/lib/auth';
import {fetchTranscript} from '@/lib/transcript';
import {generateNotes} from '@/lib/notes';

export const maxDuration = 60;

async function ownedItem(userId: string, itemId: string) {
  const item = await db.resourceItem.findFirst({where: {id: itemId}, include: {resource: {select: {userId: true}}}});
  return item && item.resource.userId === userId ? item : null;
}

export async function GET(req: Request) {
  const u = await authId();
  if (!u) return NextResponse.json({error: 'Unauthorized'}, {status: 401});
  const itemId = new URL(req.url).searchParams.get('itemId') || '';
  const note = await db.videoNote.findFirst({where: {resourceItemId: itemId, userId: u}});
  if (!note) return NextResponse.json({note: null});
  return NextResponse.json({note: {content: JSON.parse(note.content), source: note.source, updatedAt: note.updatedAt}});
}

// Generate (or regenerate) notes. Body: {itemId, transcript?}. Without a
// transcript the server pulls the video's captions; with one (pasted by the
// user) it uses that instead.
export async function POST(req: Request) {
  const u = await authId();
  if (!u) return NextResponse.json({error: 'Unauthorized'}, {status: 401});
  const {itemId, transcript} = await req.json();
  const item = await ownedItem(u, String(itemId || ''));
  if (!item) return NextResponse.json({error: 'Video not found'}, {status: 404});
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({error: 'Add GROQ_API_KEY to .env to generate notes.'}, {status: 503});
  }

  let text = typeof transcript === 'string' ? transcript.trim() : '';
  const source = text ? 'pasted' : 'captions';
  if (!text) {
    try {
      text = await fetchTranscript(item.videoId);
    } catch {
      return NextResponse.json(
        {error: "Couldn't read this video's captions (none available, or YouTube blocked the request). Paste the transcript instead.", needTranscript: true},
        {status: 422},
      );
    }
  }
  if (text.length < 200) return NextResponse.json({error: 'That transcript is too short to make notes from.', needTranscript: true}, {status: 422});

  let content;
  try {
    content = await generateNotes(text, item.title);
  } catch (e: any) {
    const m = String(e?.message || '');
    let error = 'Could not turn this transcript into notes. Try again.';
    if (m === 'LLM_401') error = 'Groq rejected the API key. Check GROQ_API_KEY.';
    else if (m === 'LLM_413' || m === 'LLM_429') error = "Groq's rate/size limit was hit (long videos use a lot of tokens on the free tier). Wait a minute and retry, or set GROQ_MODEL to a model with a higher limit.";
    else if (m.startsWith('LLM_')) error = 'The notes service returned an error. Try again in a moment.';
    return NextResponse.json({error}, {status: 502});
  }

  const saved = await db.videoNote.upsert({
    where: {resourceItemId: item.id},
    create: {userId: u, resourceItemId: item.id, content: JSON.stringify(content), source},
    update: {content: JSON.stringify(content), source},
  });
  return NextResponse.json({note: {content, source, updatedAt: saved.updatedAt}});
}

export async function DELETE(req: Request) {
  const u = await authId();
  if (!u) return NextResponse.json({error: 'Unauthorized'}, {status: 401});
  const {itemId} = await req.json();
  await db.videoNote.deleteMany({where: {resourceItemId: String(itemId || ''), userId: u}});
  return NextResponse.json({ok: true});
}
