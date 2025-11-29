import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { endpoint, keys } = body;

        if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
            return NextResponse.json({ error: 'Invalid subscription data' }, { status: 400 });
        }

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Upsert subscription
        // We use 'endpoint' as the conflict target because it identifies the device.
        const { error } = await supabase
            .from('push_subscriptions')
            .upsert({
                user_id: user.id,
                endpoint: endpoint,
                p256dh: keys.p256dh,
                auth: keys.auth,
            }, { onConflict: 'endpoint' });

        if (error) {
            console.error('Supabase error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
