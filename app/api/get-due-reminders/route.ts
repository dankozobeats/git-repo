import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
    const supabase = await createClient();

    const now = new Date();
    const weekday = now.getDay(); // 0-6
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const timeLocal = `${hours}:${minutes}`;

    const { data: reminders, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('active', true)
        .eq('channel', 'push')
        .eq('weekday', weekday)
        .eq('time_local', timeLocal);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
        weekday,
        time_local: timeLocal,
        count: reminders?.length || 0,
        reminders: reminders || []
    });
}
