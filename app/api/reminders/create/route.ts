import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { user_id, habit_id } = body;

        if (!user_id || !habit_id) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const supabase = await createClient();

        // Rappel test → exécution dans 1 minute
        const schedule = 'once';
        const time_local = new Date(Date.now() + 60000).toISOString();

        const { data, error } = await supabase
            .from('reminders')
            .insert({
                user_id,
                habit_id,
                channel: 'push',
                schedule,
                time_local,
                weekday: null,
                active: true,
            })
            .select()
            .single();

        if (error) {
            console.error('Supabase error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, reminder: data }, { status: 200 });
    } catch (err: any) {
        console.error('Route /reminders/create failed:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
