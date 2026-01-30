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

        const VAPID_PUBLIC_KEY = assertEnv('VAPID_PUBLIC_KEY');
        const VAPID_PRIVATE_KEY = assertEnv('VAPID_PRIVATE_KEY');

        webpush.setVapidDetails(
            'mailto:admin@badhabit-tracker.app',
            VAPID_PUBLIC_KEY,
            VAPID_PRIVATE_KEY
        );

        // 3) Récupération de TOUS les rappels actifs
        const { data: reminders, error: remindersError } = await supabase
            .from('reminders')
            .select('*')
            .eq('active', true)
            .eq('channel', 'push');

        if (remindersError) {
            console.error('Supabase reminders error:', remindersError);
            return NextResponse.json(
                { error: 'Error loading reminders', details: remindersError.message },
                { status: 500 }
            );
        }

        if (!reminders || reminders.length === 0) {
            return NextResponse.json({ sent: 0, processed: 0, message: 'No active reminders' });
        }

        const typedReminders = reminders as ReminderRow[];
        const remindersToSend: ReminderRow[] = [];

        // 4) Filtrage précis avec Luxon
        for (const r of typedReminders) {
            const tz = r.timezone || 'Europe/Paris';
            const nowLocal = DateTime.now().setZone(tz);
            const reminderStored = DateTime.fromISO(r.time_local).setZone(tz);

            let reminderTime = reminderStored;

            if (r.schedule === 'daily') {
                // Pour le quotidien, on prend l'heure/minute stockée et on l'applique au jour actuel
                reminderTime = nowLocal.set({
                    hour: reminderStored.hour,
                    minute: reminderStored.minute,
                    second: 0,
                    millisecond: 0
                });
            } else if (r.schedule === 'weekly' && r.weekday !== null) {
                // Pour l'hebdo, on vérifie si c'est le bon jour
                if (nowLocal.weekday !== r.weekday) continue;
                reminderTime = nowLocal.set({
                    hour: reminderStored.hour,
                    minute: reminderStored.minute,
                    second: 0,
                    millisecond: 0
                });
            }
            // Pour 'once', on utilise la date/heure exacte stockée

            // Vérification si l'heure est venue (fenêtre de 2 minutes)
            const diffInMinutes = nowLocal.diff(reminderTime, 'minutes').minutes;

            if (diffInMinutes >= 0 && diffInMinutes < 2) {
                remindersToSend.push(r);
            }
        }

        if (remindersToSend.length === 0) {
            return NextResponse.json({ sent: 0, processed: 0, message: 'No reminders due now' });
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

        // 5b) Récupérer les habitudes concernées pour enrichir le message
        const habitIds = Array.from(
            new Set(
                remindersToSend
                    .map((r) => r.habit_id)
                    .filter((id): id is string => Boolean(id))
            )
        );
        const habitMap = new Map<string, { id: string; name: string }>();
        if (habitIds.length > 0) {
            const { data: habitsData, error: habitsError } = await supabase
                .from('habits')
                .select('id, name')
                .in('id', habitIds);

            if (!habitsError && habitsData) {
                habitsData.forEach((h) => habitMap.set(h.id, h));
            }
        }

        // Map user_id → liste de subscriptions
        const subsByUser = new Map<string, PushSubscriptionRow[]>();
        for (const sub of typedSubs) {
            if (!subsByUser.has(sub.user_id)) subsByUser.set(sub.user_id, []);
            subsByUser.get(sub.user_id)!.push(sub);
        }

        // 6) Envoi des notifications
        let sentCount = 0;
        const remindersToDisable: string[] = [];
        const debugLogs: string[] = [];

        await Promise.all(
            remindersToSend.map(async (reminder) => {
                const userSubs = subsByUser.get(reminder.user_id);
                if (!userSubs || userSubs.length === 0) {
                    debugLogs.push(`User ${reminder.user_id} has no subscriptions`);
                    return;
                }

                const habitName = reminder.habit_id ? habitMap.get(reminder.habit_id)?.name : null;
                const tz = reminder.timezone || 'Europe/Paris';
                const reminderTime = DateTime.fromISO(reminder.time_local).setZone(tz);
                const timeLabel = reminderTime.toFormat('HH:mm');

                const payload = JSON.stringify({
                    title: habitName ? `Rappel: ${habitName}` : 'Rappel d’habitude',
                    body: habitName
                        ? `C’est l’heure de "${habitName}" (${timeLabel}).`
                        : `C’est l’heure de votre habitude (${timeLabel}).`,
                    habitId: reminder.habit_id,
                    url: reminder.habit_id ? `/habits/${reminder.habit_id}` : '/',
                    timeLabel,
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
                        const msg = `WebPush error for sub ${sub.id.slice(0, 5)}...: ${err?.message || err}`;
                        console.error(msg);
                        debugLogs.push(msg);
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
            debug: debugLogs // Info précieuse pour le debug
        });
    } catch (err: any) {
        console.error('Unexpected error in /api/process-reminders:', err);
        return NextResponse.json(
            { error: 'Internal error', details: err?.message || String(err) },
            { status: 500 }
        );
    }
}
