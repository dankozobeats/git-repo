import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { DateTime } from 'luxon';

export const runtime = 'nodejs';

export async function GET(req: Request) {
    try {
        const supabase = await createClient();

        // Fetch all reminders
        const { data: reminders, error } = await supabase
            .from('reminders')
            .select('*')
            .eq('active', true);

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        const now = DateTime.now();
        const debugInfo = reminders?.map(r => {
            const tz = r.timezone || 'Europe/Paris';
            const reminderTime = DateTime.fromISO(r.time_local).setZone(tz);
            const nowLocal = DateTime.now().setZone(tz);
            const diffInMinutes = nowLocal.diff(reminderTime, 'minutes').minutes;

            return {
                id: r.id,
                time_local_db: r.time_local,
                timezone_db: r.timezone,
                reminder_time_parsed: reminderTime.toString(),
                now_local: nowLocal.toString(),
                diff_minutes: diffInMinutes,
                should_trigger: diffInMinutes >= 0 && diffInMinutes < 2,
                user_id: r.user_id
            };
        });

        return NextResponse.json({
            server_time_utc: now.toUTC().toString(),
            reminders: debugInfo
        });

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
