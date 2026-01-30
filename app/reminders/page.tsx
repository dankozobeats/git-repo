import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import ReminderList from '@/components/reminders/ReminderList';
import PushEnableButton from '@/components/PushEnableButton';
import PushDiagnostic from '@/components/reminders/PushDiagnostic';
import { DateTime } from 'luxon';

const isPastReminder = (reminder: any) => {
    if (reminder.schedule !== 'once') return false;
    const tz = reminder.timezone || 'Europe/Paris';
    const reminderTime = DateTime.fromISO(reminder.time_local).setZone(tz);
    const now = DateTime.now().setZone(tz);
    return reminderTime < now;
};

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

    const allReminders = reminders || [];
    const upcomingActive = allReminders.filter(r => r.active && !isPastReminder(r));
    const pastOrInactive = allReminders.filter(r => !r.active || isPastReminder(r));

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
                        <div className="mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="flex h-2 w-2 rounded-full bg-green-400"></span>
                                <h2 className="text-lg font-semibold text-green-400">À venir / Aujourd’hui</h2>
                            </div>
                            <span className="text-xs uppercase tracking-[0.3em] text-white/50">{upcomingActive.length} rappel{upcomingActive.length > 1 ? 's' : ''}</span>
                        </div>
                        <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-6">
                            <ReminderList reminders={upcomingActive} emptyLabel="Aucun rappel à venir." accent="green" />
                        </div>
                    </section>

                    <section>
                        <div className="mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="flex h-2 w-2 rounded-full bg-white/20"></span>
                                <h2 className="text-lg font-semibold text-white/60">Passés / Inactifs</h2>
                            </div>
                            <span className="text-xs uppercase tracking-[0.3em] text-white/40">{pastOrInactive.length} rappel{pastOrInactive.length > 1 ? 's' : ''}</span>
                        </div>
                        <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-6 opacity-80">
                            <ReminderList reminders={pastOrInactive} emptyLabel="Aucun rappel passé ou inactif." accent="neutral" />
                        </div>
                    </section>
                </div>

                <div className="mt-8 pt-8 border-t border-white/5 flex flex-col items-center gap-4">
                    <PushDiagnostic />
                </div>
            </div>
        </main>
    );
}
