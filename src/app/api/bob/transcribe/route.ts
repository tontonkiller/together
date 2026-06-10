import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimit, tooManyRequests } from '@/lib/rateLimit';

const MAX_AUDIO_BYTES = 25 * 1024 * 1024; // OpenAI Whisper hard limit
const RATE_LIMIT = 15; // requests
const RATE_WINDOW_MS = 60 * 1000; // per minute, per user

/**
 * POST /api/bob/transcribe
 * Receives audio blob, sends to OpenAI Whisper, returns transcript.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // Throttle the paid Whisper call per user.
  const limit = rateLimit(`bob:transcribe:${user.id}`, RATE_LIMIT, RATE_WINDOW_MS);
  if (!limit.ok) return tooManyRequests(limit);

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('[bob/transcribe] OPENAI_API_KEY not configured');
    return NextResponse.json({ error: 'Transcription not configured' }, { status: 500 });
  }

  try {
    const formData = await request.formData();
    const audio = formData.get('audio') as Blob | null;
    const locale = (formData.get('locale') as string) ?? 'fr';

    if (!audio) {
      return NextResponse.json({ error: 'No audio provided' }, { status: 400 });
    }

    if (audio.size > MAX_AUDIO_BYTES) {
      return NextResponse.json({ error: 'Audio file too large' }, { status: 413 });
    }

    // Send to Whisper API
    const whisperForm = new FormData();
    whisperForm.append('file', audio, 'audio.webm');
    whisperForm.append('model', 'whisper-1');
    whisperForm.append('language', locale === 'fr' ? 'fr' : 'en');

    const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: whisperForm,
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('[bob/transcribe] Whisper error:', err);
      return NextResponse.json({ error: 'Transcription failed' }, { status: 500 });
    }

    const data = await res.json();
    return NextResponse.json({ transcript: data.text });
  } catch (err) {
    console.error('[bob/transcribe] Error:', err);
    return NextResponse.json({ error: 'Transcription failed' }, { status: 500 });
  }
}
