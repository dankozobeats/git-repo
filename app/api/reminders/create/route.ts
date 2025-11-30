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

        const { data: { user } } = await supabase.auth.getUser();
        if (!user || user.id !== user_id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 🔥 Force un rappel "immédiat"
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes() + 1).padStart(2, '0'); // +1 min pour test

        const localTime = `${hours}:${minutes}`;

        const { data, error } = await supabase
            .from('reminders')
            .insert({
                user_id,
                habit_id,
                channel: 'push',
                schedule: 'once',
                weekday: null,
                time_local: localTime,
                active: true,
            })
            .select()
            .single();

        if (error) {
            console.error('Supabase error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, reminder: data });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
