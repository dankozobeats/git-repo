// app/api/process-reminders/route.ts
import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

type ReminderRow = {
    id: string;
    user_id: string;
    habit_id: string | null;
    channel: string | null;
    schedule: string | null;
    time_local: string; // timestamptz → string ISO
    weekday: number | null;
    active: boolean;
};

type PushSubscriptionRow = {
    id: string;
    user_id: string;
    endpoint: string;
    p256dh: string;
    auth: string;
};

function assertEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing env var: ${name}`);
    }
    return value;
}

export async function POST(req: Request) {
    try {
        // 1) Sécurité : vérif du token CRON_SECRET
        const authHeader = req.headers.get('authorization') ?? '';
        const token = authHeader.replace('Bearer ', '').trim();

        const CRON_SECRET = assertEnv('CRON_SECRET');

        if (!token || token !== CRON_SECRET) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2) Init Supabase + WebPush
        const supabase = await createClient();

        const VAPID_PUBLIC_KEY = assertEnv('NEXT_PUBLIC_VAPID_PUBLIC_KEY');
        const VAPID_PRIVATE_KEY = assertEnv('VAPID_PRIVATE_KEY');

        webpush.setVapidDetails(
            'mailto:admin@badhabit-tracker.app',
            VAPID_PUBLIC_KEY,
            VAPID_PRIVATE_KEY
        );

        // 3) Fenêtre de temps : rappels "due" dans les 2 dernières minutes
        const now = new Date();
        const nowIso = now.toISOString();
        const windowStart = new Date(now.getTime() - 2 * 60 * 1000).toISOString();

        // 4) Récupération des rappels à traiter (PAS DE RELATION)
        const { data: reminders, error: remindersError } = await supabase
            .from('reminders')
            .select('*')
            .eq('active', true)
            .eq('channel', 'push')
            .in('schedule', ['once', 'daily']) // tu peux adapter ici
            .gte('time_local', windowStart)
            .lte('time_local', nowIso);

        if (remindersError) {
            console.error('Supabase reminders error:', remindersError);
            return NextResponse.json(
                { error: 'Error loading reminders', details: remindersError.message },
                { status: 500 }
            );
        }

        if (!reminders || reminders.length === 0) {
            return NextResponse.json({ sent: 0, message: 'No reminders due' });
        }

        const typedReminders = reminders as ReminderRow[];

        // 5) Récupérer toutes les subscriptions des users concernés (toujours SANS relation)
        const userIds = Array.from(new Set(typedReminders.map((r) => r.user_id)));

        const { data: subs, error: subsError } = await supabase
            .from('push_subscriptions')
            .select('*')
            .in('user_id', userIds);

        if (subsError) {
            console.error('Supabase subscriptions error:', subsError);
            return NextResponse.json(
                { error: 'Error loading subscriptions', details: subsError.message },
                { status: 500 }
            );
        }

        if (!subs || subs.length === 0) {
            return NextResponse.json({
                sent: 0,
                message: 'No push subscriptions for due reminders',
            });
        }

        const typedSubs = subs as PushSubscriptionRow[];

        // Map user_id → liste de subscriptions
        const subsByUser = new Map<string, PushSubscriptionRow[]>();
        for (const sub of typedSubs) {
            if (!subsByUser.has(sub.user_id)) subsByUser.set(sub.user_id, []);
            subsByUser.get(sub.user_id)!.push(sub);
        }

        // 6) Envoi des notifications
        let sentCount = 0;
        const remindersToDisable: string[] = [];

        await Promise.all(
            typedReminders.map(async (reminder) => {
                const userSubs = subsByUser.get(reminder.user_id);
                if (!userSubs || userSubs.length === 0) return;

                const payload = JSON.stringify({
                    title: 'Rappel d’habitude',
                    body: 'Tu as un rappel pour une habitude.',
                    habitId: reminder.habit_id,
                });

                const sendPromises = userSubs.map(async (sub) => {
                    try {
                        await webpush.sendNotification(
                            {
                                endpoint: sub.endpoint,
                                keys: {
                                    p256dh: sub.p256dh,
                                    auth: sub.auth,
                                },
                            } as any,
                            payload
                        );
                        sentCount += 1;
                    } catch (err: any) {
                        console.error('WebPush error for subscription', sub.id, err?.message || err);
                    }
                });

                await Promise.allSettled(sendPromises);

                // Si c'est un rappel "once", on le désactive après envoi
                if (reminder.schedule === 'once') {
                    remindersToDisable.push(reminder.id);
                }
            })
        );

        // 7) Désactiver les rappels "once" envoyés
        if (remindersToDisable.length > 0) {
            const { error: updateError } = await supabase
                .from('reminders')
                .update({ active: false })
                .in('id', remindersToDisable);

            if (updateError) {
                console.error('Error deactivating reminders:', updateError);
            }
        }

        return NextResponse.json({
            sent: sentCount,
            processed: typedReminders.length,
            message:
                sentCount > 0
                    ? `Sent ${sentCount} notifications`
                    : 'Reminders due but no valid subscriptions',
        });
    } catch (err: any) {
        console.error('Unexpected error in /api/process-reminders:', err);
        return NextResponse.json(
            { error: 'Internal error', details: err?.message || String(err) },
            { status: 500 }
        );
    }
}
