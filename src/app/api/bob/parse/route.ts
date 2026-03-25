import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';

const anthropic = new Anthropic();

interface ParsedEvent {
  title: string;
  description: string | null;
  location: string | null;
  start_date: string;
  end_date: string;
  start_time: string | null;
  end_time: string | null;
  is_all_day: boolean;
  is_private: boolean;
}

function isValidDate(str: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(str) && !isNaN(Date.parse(str));
}

function isValidTime(str: string): boolean {
  return /^\d{2}:\d{2}$/.test(str);
}

function validateParsedEvent(data: unknown): ParsedEvent | null {
  if (!data || typeof data !== 'object') return null;
  const d = data as Record<string, unknown>;

  // Title required
  if (typeof d.title !== 'string' || d.title.trim().length === 0) return null;
  if (d.title.length > 200) return null;

  // Dates required
  if (typeof d.start_date !== 'string' || !isValidDate(d.start_date)) return null;
  if (typeof d.end_date !== 'string' || !isValidDate(d.end_date)) return null;
  if (d.end_date < d.start_date) return null;

  // Booleans required
  if (typeof d.is_all_day !== 'boolean') return null;
  if (typeof d.is_private !== 'boolean') return null;

  // Times: null or valid HH:MM
  const start_time = d.start_time === null || d.start_time === undefined ? null
    : typeof d.start_time === 'string' && isValidTime(d.start_time) ? d.start_time : 'INVALID';
  const end_time = d.end_time === null || d.end_time === undefined ? null
    : typeof d.end_time === 'string' && isValidTime(d.end_time) ? d.end_time : 'INVALID';

  if (start_time === 'INVALID' || end_time === 'INVALID') return null;

  return {
    title: d.title.trim().slice(0, 200),
    description: typeof d.description === 'string' ? d.description.trim() || null : null,
    location: typeof d.location === 'string' ? d.location.trim() || null : null,
    start_date: d.start_date,
    end_date: d.end_date,
    start_time: d.is_all_day ? null : start_time,
    end_time: d.is_all_day ? null : end_time,
    is_all_day: d.is_all_day,
    is_private: d.is_private,
  };
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { transcript, locale } = await request.json();

  if (!transcript || typeof transcript !== 'string' || transcript.trim().length === 0) {
    return NextResponse.json({ error: 'Empty transcript' }, { status: 400 });
  }

  const today = new Date().toISOString().split('T')[0];
  const dayOfWeek = new Date().toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'long' });

  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system: `You extract calendar event data from natural speech. Return ONLY valid JSON, no explanation, no markdown.

Today is ${today} (${dayOfWeek}). User locale is ${locale}.

Extract from the user's speech:
- title (string, required — the event name)
- description (string or null)
- location (string or null)
- start_date (YYYY-MM-DD, required)
- end_date (YYYY-MM-DD, required, same as start_date if single day)
- start_time (HH:MM or null if all-day)
- end_time (HH:MM or null if all-day. If start_time given but no end_time, add 1 hour)
- is_all_day (boolean — true if no specific times mentioned)
- is_private (boolean — true ONLY if user explicitly says "privé", "private", or "perso")

Return ONLY a JSON object with these fields.`,
      messages: [
        { role: 'user', content: transcript.trim() },
      ],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';

    // Extract JSON from response (handle potential markdown wrapping)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Could not parse response' }, { status: 422 });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const validated = validateParsedEvent(parsed);

    if (!validated) {
      return NextResponse.json({ error: 'Invalid event data' }, { status: 422 });
    }

    return NextResponse.json({ event: validated, transcript: transcript.trim() });
  } catch (err) {
    console.error('[bob/parse] Error:', err);
    return NextResponse.json({ error: 'Failed to parse' }, { status: 500 });
  }
}
