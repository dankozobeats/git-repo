import { createClient } from '@/lib/supabase/server';
import { NextResponse } from "next/server";
import webpush from 'web-push';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    // Configuration VAPID
    webpush.setVapidDetails(
      'mailto:admin@badhabit-tracker.app',
      process.env.VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!
    );

    // Récupérer les subscriptions de l'utilisateur
    const { data: subs, error: subsError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', user.id);

    if (subsError || !subs || subs.length === 0) {
      return NextResponse.json({ ok: false, error: "No subscription found in DB", details: subsError });
    }

    const reports = [];
    const toDelete: string[] = [];

    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth }
          },
          JSON.stringify({
            title: "Test de Notification",
            body: "Si vous voyez ceci, les notifications fonctionnent ! 🔥",
            url: "/"
          })
        );
        reports.push({ endpoint: sub.id, status: "sent" });
      } catch (err: any) {
        reports.push({ endpoint: sub.id, status: "error", message: err.message, code: err.statusCode });
        if (err.statusCode === 410) {
          toDelete.push(sub.id);
        }
      }
    }

    if (toDelete.length > 0) {
      await supabase.from('push_subscriptions').delete().in('id', toDelete);
    }

    return NextResponse.json({ ok: true, reports });
  } catch (err: any) {
    console.error("test-push error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

