import {YoutubeTranscript} from 'youtube-transcript';

// Fetches the caption track of a YouTube video (manual or auto-generated).
// Uses YouTube's public caption endpoint — no API key needed, but YouTube can
// refuse it (no captions, age/region lock, or blocking of cloud IPs), so the
// caller must handle failure and offer a paste-your-own-transcript fallback.
export async function fetchTranscript(videoId: string): Promise<string> {
  const parts = await YoutubeTranscript.fetchTranscript(videoId);
  const text = parts
    .map(p => p.text)
    .join(' ')
    .replace(/&amp;#39;|&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) throw new Error('empty transcript');
  return text;
}
