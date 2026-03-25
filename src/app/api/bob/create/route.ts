import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function isValidDate(str: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(str) && !isNaN(Date.parse(str));
}

function isValidTime(str: string): boolean {
  return /^\d{2}:\d{2}$/.test(str);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { event } = await request.json();

  // Re-validate everything server-side
  if (!event || typeof event !== 'object') {
    return NextResponse.json({ error: 'Invalid event' }, { status: 400 });
  }

  const { title, description, location, start_date, end_date, start_time, end_time, is_all_day, is_private } = event;

  if (typeof title !== 'string' || title.trim().length === 0 || title.length > 200) {
    return NextResponse.json({ error: 'Invalid title' }, { status: 400 });
  }
  if (!isValidDate(start_date) || !isValidDate(end_date) || end_date < start_date) {
    return NextResponse.json({ error: 'Invalid dates' }, { status: 400 });
  }
  if (typeof is_all_day !== 'boolean' || typeof is_private !== 'boolean') {
    return NextResponse.json({ error: 'Invalid flags' }, { status: 400 });
  }
  if (!is_all_day) {
    if (start_time !== null && !isValidTime(start_time)) {
      return NextResponse.json({ error: 'Invalid start_time' }, { status: 400 });
    }
    if (end_time !== null && !isValidTime(end_time)) {
      return NextResponse.json({ error: 'Invalid end_time' }, { status: 400 });
    }
  }

  const eventData = {
    title: title.trim(),
    description: typeof description === 'string' ? description.trim() || null : null,
    location: typeof location === 'string' ? location.trim() || null : null,
    start_date,
    end_date,
    start_time: is_all_day ? null : (start_time ?? null),
    end_time: is_all_day ? null : (end_time ?? null),
    is_all_day,
    is_private,
    event_type_id: null,
    user_id: user.id,
  };

  const { data, error } = await supabase
    .from('events')
    .insert(eventData)
    .select('*, event_types(name, icon)')
    .single();

  if (error) {
    console.error('[bob/create] Insert error:', error.message);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }

  return NextResponse.json({ event: data });
}
