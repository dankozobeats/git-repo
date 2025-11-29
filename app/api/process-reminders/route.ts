import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import webPush from 'web-push';
import { getDueReminders } from '@/lib/reminders'; // Using shared logic for efficiency

// Initialize Web Push
webPush.setVapidDetails(
    'mailto:contact@badhabit-tracker.com',
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
);

export async function POST(request: Request) {
    // 1. Authorization Check
    const authHeader = request.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    try {
        // 2. Get Due Reminders
        // We can call the internal function directly instead of fetching the API route to save overhead
        const reminders = await getDueReminders();

        if (!reminders || reminders.length === 0) {
            return NextResponse.json({ sent: 0, message: 'No reminders due' });
        }

        let sentCount = 0;

        // 3. Process Loop
        for (const reminder of reminders) {
            // Get subscriptions for this user
            const { data: subs } = await supabase
                .from('push_subscriptions')
                .select('*')
                .eq('user_id', reminder.user_id);

            if (!subs || subs.length === 0) continue;

            const payload = JSON.stringify({
                title: 'Bad Habit Tracker',
                body: `Rappel : ${reminder.habits?.name || 'Une habitude vous attend !'}`,
            });

            // 4. Send Notifications
            for (const sub of subs) {
                try {
                    await webPush.sendNotification({
                        endpoint: sub.endpoint,
                        keys: { p256dh: sub.p256dh, auth: sub.auth }
                    }, payload);
                    sentCount++;
                } catch (err: any) {
                    console.error(`Failed to send to ${sub.endpoint}`, err);
                    if (err.statusCode === 410 || err.statusCode === 404) {
                        await supabase.from('push_subscriptions').delete().eq('id', sub.id);
                    }
                }
            }

            // 5. Update Timestamp
            await supabase
                .from('reminders')
                .update({ updated_at: new Date().toISOString() })
                .eq('id', reminder.id);
        }

        return NextResponse.json({ sent: sentCount });

    } catch (error: any) {
        console.error('Process error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
