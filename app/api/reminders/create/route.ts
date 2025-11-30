import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

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

        // 🕒 Conversion heure locale → UTC ISO
        // time_local et timezone viennent du front ou du script (ex: "2025-11-30T03:05:00" et "Europe/Paris")
        const localDate = new Date(time_local);
        const utcISO = new Date(
            localDate.toLocaleString('en-US', { timeZone: timezone })
        ).toISOString();

        const { data, error } = await supabase
            .from('reminders')
            .insert({
                user_id,
                habit_id,
                channel: 'push',
                schedule: 'once',
                time_local: utcISO,
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
