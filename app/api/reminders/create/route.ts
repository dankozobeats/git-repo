import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { user_id, habit_id, weekday, time_local } = body;

        if (!user_id || !habit_id) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const supabase = await createClient();

        // Verify user session matches user_id (security)
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || user.id !== user_id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { error } = await supabase
            .from('reminders')
            .insert({
                user_id,
                habit_id,
                channel: 'push',
                schedule: 'once',
                weekday: weekday ?? new Date().getDay(),
                time_local: time_local ?? '09:00', // Default or passed value
                active: true,
            });

        if (error) {
            console.error('Supabase error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
