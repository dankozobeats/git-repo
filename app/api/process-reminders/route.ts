// app/api/process-reminders/route.ts
import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { createClient } from '@/lib/supabase/server';
import { DateTime } from 'luxon';

export const runtime = 'nodejs';

type ReminderRow = {
    id: string;
    user_id: string;
    habit_id: string | null;
    channel: string | null;
    schedule: string | null;
    time_local: string; // timestamptz (UTC)
    timezone: string | null;
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

        // 3) Récupération de TOUS les rappels actifs
        // On ne filtre pas par date SQL ici car on veut faire une comparaison précise en local avec Luxon
        // (Sauf si la table est énorme, auquel cas on filtrerait grossièrement +/- 24h)
        const { data: reminders, error: remindersError } = await supabase
            .from('reminders')
            .select('*')
            .eq('active', true)
            .eq('channel', 'push')
            .in('schedule', ['once', 'daily']);

        if (remindersError) {
            console.error('Supabase reminders error:', remindersError);
            return NextResponse.json(
                { error: 'Error loading reminders', details: remindersError.message },
                { status: 500 }
            );
        }

        if (!reminders || reminders.length === 0) {
            return NextResponse.json({ sent: 0, message: 'No active reminders' });
        }

        const typedReminders = reminders as ReminderRow[];
        const remindersToSend: ReminderRow[] = [];

        // 4) Filtrage précis avec Luxon
        for (const r of typedReminders) {
            const tz = r.timezone || 'Europe/Paris'; // Fallback

            // L'heure cible (stockée en UTC, mais on la remet dans son contexte timezone)
            // time_local est un ISO UTC (ex: 2025-11-30T03:00:00Z)
            // On le convertit en DateTime Luxon
            const reminderTime = DateTime.fromISO(r.time_local).setZone(tz);

            // L'heure actuelle dans la timezone de l'utilisateur
            const nowLocal = DateTime.now().setZone(tz);

            // On vérifie si l'heure est passée (avec une tolérance de 2 minutes pour ne pas spammer les vieux trucs)
            // Condition : reminderTime <= nowLocal && reminderTime > nowLocal - 2 minutes
            const diffInMinutes = nowLocal.diff(reminderTime, 'minutes').minutes;

            if (diffInMinutes >= 0 && diffInMinutes < 2) {
                remindersToSend.push(r);
            }
        }

        if (remindersToSend.length === 0) {
            return NextResponse.json({ sent: 0, message: 'No reminders due now' });
        }

        // 5) Récupérer les subscriptions
        const userIds = Array.from(new Set(remindersToSend.map((r) => r.user_id)));

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

        const typedSubs = (subs || []) as PushSubscriptionRow[];

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
            remindersToSend.map(async (reminder) => {
                const userSubs = subsByUser.get(reminder.user_id);
                if (!userSubs || userSubs.length === 0) return;

                const payload = JSON.stringify({
                    title: 'Rappel d’habitude',
                    body: 'C’est l’heure de votre habitude !',
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
                        if (err.statusCode === 410) {
                            // Subscription invalide, on pourrait la supprimer ici
                        }
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
            processed: remindersToSend.length,
            message: `Processed ${remindersToSend.length} due reminders, sent ${sentCount} notifications`,
        });
    } catch (err: any) {
        console.error('Unexpected error in /api/process-reminders:', err);
        return NextResponse.json(
            { error: 'Internal error', details: err?.message || String(err) },
            { status: 500 }
        );
    }
}
