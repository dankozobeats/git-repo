import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { DateTime } from 'luxon';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { user_id, habit_id, time_local, timezone } = body;

        if (!user_id || !habit_id || !time_local || !timezone) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        const supabase = await createClient();

        // 🔐 Bypass spécial CRON/serveur (VPS) via CRON_SECRET
        const authHeader = request.headers.get('Authorization');
        const isCronCall =
            authHeader &&
            process.env.CRON_SECRET &&
            authHeader === `Bearer ${process.env.CRON_SECRET}`;

        if (!isCronCall) {
            // 🔐 Appel normal depuis le navigateur → on vérifie la session Supabase
            const { data: { user } } = await supabase.auth.getUser();
            if (!user || user.id !== user_id) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
        }

        // 🕒 Conversion heure locale → UTC ISO via Luxon
        // time_local est attendu au format "yyyy-MM-dd HH:mm"
        const localTime = DateTime.fromFormat(time_local, "yyyy-MM-dd HH:mm", { zone: timezone });

        if (!localTime.isValid) {
            return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
        }

        const utcISO = localTime.toUTC().toISO();

        const { data, error } = await supabase
            .from('reminders')
            .insert({
                user_id,
                habit_id,
                channel: 'push',
                schedule: 'once',
                time_local: utcISO,
                timezone,
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
        console.error('Create reminder error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
