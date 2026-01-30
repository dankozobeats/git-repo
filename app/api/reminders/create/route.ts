import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { DateTime } from 'luxon';
import { checkRateLimit } from '@/lib/api/ratelimit';
import { CreateReminderSchema } from '@/lib/validation/schemas';
import { parseRequestBody } from '@/lib/validation/validate';

export async function POST(request: Request) {
    // 1. Rate Limiting protection
    const rateLimit = await checkRateLimit(request as any, 'WRITE');
    if (!rateLimit.allowed) {
        return NextResponse.json(
            { error: 'Too many requests', retryAfter: rateLimit.reset },
            { status: 429, headers: { 'Retry-After': rateLimit.reset.toString() } }
        );
    }

    try {
        // 2. Safe Body Parsing
        const bodyResult = await parseRequestBody(request);
        if (!bodyResult.success) return bodyResult.response;
        const body = bodyResult.data as any;

        const supabase = await createClient();

        // 3. Authentication & Authorization (User vs CRON)
        const authHeader = request.headers.get('Authorization');
        const isCronCall =
            authHeader &&
            process.env.CRON_SECRET &&
            authHeader === `Bearer ${process.env.CRON_SECRET}`;

        let targetUserId: string;

        if (isCronCall) {
            if (!body.user_id) {
                return NextResponse.json({ error: 'Missing user_id for system call' }, { status: 400 });
            }
            targetUserId = body.user_id;
        } else {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
            // Securité: On force l'utilisation de l'ID de la session authentifiée
            targetUserId = user.id;
        }

        // 4. Data Validation with Zod
        const validation = CreateReminderSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: (validation.error as any).errors },
                { status: 400 }
            );
        }

        const { habit_id, time_local, timezone, schedule, channel, active } = validation.data;

        // 5. Robust Date Parsing (ISO or Format)
        let dt = DateTime.fromISO(time_local, { zone: timezone });
        if (!dt.isValid) {
            dt = DateTime.fromFormat(time_local, "yyyy-MM-dd HH:mm", { zone: timezone });
        }

        if (!dt.isValid) {
            return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
        }

        const utcISO = dt.toUTC().toISO();

        // 6. DB Insertion
        const { data, error } = await supabase
            .from('reminders')
            .insert({
                user_id: targetUserId,
                habit_id,
                channel,
                schedule,
                time_local: utcISO,
                timezone,
                weekday: validation.data.weekday ?? dt.weekday, // Utilise le jour du mois ou celui spécifié
                active,
            })
            .select()
            .single();

        if (error) {
            console.error('Supabase error:', error);
            // Ne pas exposer les erreurs brutes de DB en prod idéalement, mais ok pour l'instant
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, reminder: data });

    } catch (err: any) {
        console.error('Create reminder error:', err);
        return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
    }
}
