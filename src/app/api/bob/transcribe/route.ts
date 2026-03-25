import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
