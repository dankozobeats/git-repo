import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    // 🔐 Sécurité: vérification du CRON_SECRET pour empêcher les accès non autorisés
    const authHeader = req.headers.get('authorization') ?? '';
    const token = authHeader.replace('Bearer ', '').trim();

    const CRON_SECRET = process.env.CRON_SECRET;

    if (!CRON_SECRET) {
        console.error('[get-due-reminders] CRON_SECRET not configured');
        return NextResponse.json({ error: 'Service misconfigured' }, { status: 500 });
    }

    if (!token || token !== CRON_SECRET) {
        console.warn('[get-due-reminders] Unauthorized access attempt');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
        console.error('[get-due-reminders] Database error:', error);
        return NextResponse.json({ error: 'Failed to fetch reminders' }, { status: 500 });
    }

    return NextResponse.json({
        weekday,
        time_local: timeLocal,
        count: reminders?.length || 0,
        reminders: reminders || []
    });
}
