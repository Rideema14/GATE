import {NextResponse} from 'next/server';
import {authId} from '@/lib/auth';

function playlistIdFromUrl(value: string) {
  try {
    return new URL(value).searchParams.get('list');
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const u = await authId();
  if (!u) return NextResponse.json({error: 'Unauthorized'}, {status: 401});

  const {url} = await req.json();
  const playlistId = playlistIdFromUrl(url || '');
  if (!playlistId) return NextResponse.json({error: 'Paste a valid YouTube playlist URL containing ?list='}, {status: 400});

  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return NextResponse.json({error: 'Add YOUTUBE_API_KEY to .env to sync the exact playlist video count. Manual tracking still works.'}, {status: 503});

  const base = 'https://www.googleapis.com/youtube/v3/';
  const p = await fetch(`${base}playlists?part=snippet,contentDetails&id=${encodeURIComponent(playlistId)}&key=${key}`, {cache: 'no-store'});
  if (!p.ok) return NextResponse.json({error: 'YouTube could not read this playlist. Check the URL and API key.'}, {status: 400});
  const pj = await p.json();
  if (!pj.items?.length) return NextResponse.json({error: 'Playlist not found or not public.'}, {status: 404});

  const pl = pj.items[0];
  const rawItems: {videoId: string; title: string}[] = [];
  let pageToken = '';
  do {
    const q = new URLSearchParams({part: 'snippet,contentDetails', playlistId, maxResults: '50', key});
    if (pageToken) q.set('pageToken', pageToken);
    const r = await fetch(`${base}playlistItems?${q}`, {cache: 'no-store'});
    if (!r.ok) break;
    const j = await r.json();
    for (const x of j.items || []) {
      const vid = x.contentDetails?.videoId;
      if (vid) rawItems.push({videoId: vid, title: x.snippet?.title || 'Untitled video'});
    }
    pageToken = j.nextPageToken || '';
  } while (pageToken);

  // A playlist can legitimately contain the same video more than once (or
  // the API can occasionally return a duplicate row). Our schema tracks one
  // row per (resource, videoId), so de-duplicate here — keep the first
  // occurrence and re-number positions sequentially.
  const seen = new Set<string>();
  const items = rawItems
    .filter(x => (seen.has(x.videoId) ? false : (seen.add(x.videoId), true)))
    .map((x, i) => ({videoId: x.videoId, title: x.title, position: i}));

  return NextResponse.json({
    playlistId,
    title: pl.snippet?.title || 'YouTube Playlist',
    channel: pl.snippet?.channelTitle || '',
    total: items.length,
    items,
  });
}
