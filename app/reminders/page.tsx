import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import ReminderList from '@/components/reminders/ReminderList';
import PushEnableButton from '@/components/PushEnableButton';

export default async function RemindersPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { data: reminders } = await supabase
        .from('reminders')
        .select(`
            *,
            habits (
                name,
                icon,
                color,
                description
            )
        `)
        .eq('user_id', user.id)
        .order('time_local', { ascending: true });

    const activeReminders = reminders?.filter(r => r.active) || [];
    const inactiveReminders = reminders?.filter(r => !r.active) || [];

    return (
        <main className="min-h-screen bg-[#050505] text-[#F8FAFC]">
            <div className="mx-auto flex max-w-4xl flex-col gap-8 px-4 pb-16 pt-8 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-4 py-2 text-sm font-semibold text-white/70 transition hover:border-white/40 hover:text-white"
                    >
                        <span aria-hidden>←</span>
                        Retour
                    </Link>
                    <h1 className="text-2xl font-bold text-white">Mes Rappels</h1>
                </div>

                <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-6">
                    <div className="mb-6 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-white">État des notifications</h2>
                        <PushEnableButton userId={user.id} />
                    </div>
                </div>

                <div className="grid gap-8 md:grid-cols-2">
                    <section>
                        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-green-400">
                            <span className="flex h-2 w-2 rounded-full bg-green-400"></span>
                            Actifs ({activeReminders.length})
                        </h2>
                        <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-6">
                            <ReminderList reminders={activeReminders} />
                        </div>
                    </section>

                    <section>
                        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white/40">
                            <span className="flex h-2 w-2 rounded-full bg-white/20"></span>
                            Inactifs ({inactiveReminders.length})
                        </h2>
                        <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-6 opacity-60">
                            <ReminderList reminders={inactiveReminders} />
                        </div>
                    </section>
                </div>
            </div>
        </main>
    );
}
