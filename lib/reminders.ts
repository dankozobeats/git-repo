import { createClient } from '@/lib/supabase/server';

export async function getDueReminders() {
    const supabase = await createClient();

    // Get current time and weekday
    // Note: This relies on the server's timezone. 
    // Ideally, we should handle user timezones, but for now we assume server time or UTC matching user expectation.
    // The user prompt implies "time_local" matches the server check or we check against a specific timezone.
    // Since the prompt doesn't specify timezone handling, we'll use the server's current time.

    const now = new Date();
    const currentWeekday = now.getDay(); // 0 (Sunday) to 6 (Saturday)

    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const currentTime = `${hours}:${minutes}`;

    console.log(`Checking reminders for Weekday: ${currentWeekday}, Time: ${currentTime}`);

    const { data: reminders, error } = await supabase
        .from('reminders')
        .select(`
      id,
      user_id,
      habit_id,
      time_local,
      channel,
      habits (
        name,
        description
      )
    `)
        .eq('active', true)
        .eq('channel', 'push')
        .eq('weekday', currentWeekday)
        .eq('time_local', currentTime);

    if (error) {
        console.error('Error fetching reminders:', error);
        throw new Error(error.message);
    }

    return reminders || [];
}
