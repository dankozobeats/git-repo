import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/api/ratelimit';

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    // 1. Rate Limiting
    const rateLimit = await checkRateLimit(request as any, 'WRITE');
    if (!rateLimit.allowed) {
        return NextResponse.json(
            { error: 'Too many requests', retryAfter: rateLimit.reset },
            { status: 429 }
        );
    }

    try {
        const supabase = await createClient();

        // 2. Auth Check
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log(`[API Reminders] Attempting to delete reminder ${id} for user ${user.id}`);

        // 3. Delete with user_id check (security)
        const { error, count } = await supabase
            .from('reminders')
            .delete({ count: 'exact' })
            .eq('id', id)
            .eq('user_id', user.id);

        if (error) {
            console.error('Delete reminder error:', error);
            return NextResponse.json({ error: error.message, details: error.details }, { status: 500 });
        }

        console.log(`[API Reminders] Deleted ${count} rows`);

        return NextResponse.json({ success: true, count });

    } catch (err: any) {
        console.error('API Error:', err);
        return NextResponse.json({ error: err.message || 'Internal Error' }, { status: 500 });
    }
}
