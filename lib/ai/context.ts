import { createClient } from '@/lib/supabase/server'

export interface AIContextData {
    period: string
    today: string
    yesterday: string
    yesterdayLogs: string[]
    userFacts: string[]
    habitsCount: { good: number; bad: number }
    recentLogs: string[]
    recentEvents: string[]
    trackables: string[]
    trackableEvents: string[]
    previousReportSummary: string
    habitsList: { id: string; name: string; type: string }[]
}

/**
 * Gathers user data to provide context for AI responses.
 */
export async function getAIUserContext(userId: string, days: number = 30): Promise<AIContextData> {
    const supabase = await createClient()

    // 1. Memory / Meta
    const { data: lastReports } = await supabase
        .from('ai_reports')
        .select('report, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)

    const previousReportSummary = lastReports?.[0]
        ? `Résumé du précédent rapport (${new Date(lastReports[0].created_at).toLocaleDateString()}): ${lastReports[0].report.substring(0, 400)}...`
        : 'Aucun rapport précédent.'

    const now = new Date()
    const todayStr = now.toISOString().split('T')[0]
    const yesterday = new Date(now)
    yesterday.setDate(now.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    const startDateStr = startDate.toISOString().split('T')[0]

    // 2. Habits & Logs
    const { data: habits } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', userId)
        .eq('is_archived', false)

    const goodHabits = habits?.filter(h => h.type === 'good') || []
    const badHabits = habits?.filter(h => h.type === 'bad') || []

    const { data: logs } = await supabase
        .from('logs')
        .select('*')
        .eq('user_id', userId)
        .gte('completed_date', startDateStr)

    const { data: events } = await supabase
        .from('habit_events')
        .select('*')
        .eq('user_id', userId)
        .gte('event_date', startDateStr)

    const goodLogsList = logs?.filter(l => goodHabits.find(h => h.id === l.habit_id)) || []
    const badLogsList = (events || []).filter(e => badHabits.find(h => h.id === e.habit_id))

    const yesterdayLogs = [
        ...goodLogsList.filter(l => l.completed_date === yesterdayStr).map(l => `[SUCCESS] ${goodHabits.find(h => h.id === l.habit_id)?.name}`),
        ...badLogsList.filter(e => e.event_date === yesterdayStr).map(e => `[CRAQUAGE] ${badHabits.find(h => h.id === e.habit_id)?.name}`),
    ]

    // 3. Trackables
    const { data: trackables } = await supabase
        .from('trackables')
        .select('*')
        .eq('user_id', userId)
        .is('archived_at', null)

    const { data: trackableEvents } = await supabase
        .from('trackable_events')
        .select('*, trackable:trackables(name, type)')
        .eq('user_id', userId)
        .gte('occurred_at', startDateStr)
        .order('occurred_at', { ascending: true })

    // 4. Facts
    const { data: facts } = await supabase
        .from('user_ai_facts')
        .select('content')
        .eq('user_id', userId)
        .limit(20)

    const userFacts = facts?.map(f => f.content) || []

    return {
        period: `${days}j`,
        today: todayStr,
        yesterday: yesterdayStr,
        yesterdayLogs,
        userFacts,
        habitsCount: {
            good: goodHabits.length,
            bad: badHabits.length,
        },
        recentLogs: goodLogsList.slice(-10).map(l =>
            `- ${goodHabits.find(h => h.id === l.habit_id)?.name}: ${l.completed_date}`
        ),
        recentEvents: badLogsList.slice(-10).map(e =>
            `- ${badHabits.find(h => h.id === e.habit_id)?.name}: ${e.event_date}`
        ),
        trackables: trackables?.map(t => `- [${t.type.toUpperCase()}] ${t.name}`) || [],
        trackableEvents: (trackableEvents || []).slice(-15).map(te => {
            const meta = te.meta_json as any || {}
            return `- ${(te as any).trackable?.name} (${te.kind}): ${new Date(te.occurred_at).toLocaleDateString()}`
        }),
        previousReportSummary,
        habitsList: (habits || []).map(h => ({ id: h.id, name: h.name, type: h.type })),
    }
}

export function formatAIContextPrompt(data: AIContextData): string {
    return `
--- MÉMOIRE BIOGRAPHIQUE ---
${data.userFacts.length > 0 ? data.userFacts.map(f => `- ${f}`).join('\n') : "Aucun fait connu."}

--- CONTEXTE TEMPOREL ---
Aujourd'hui: ${data.today}
Hier: ${data.yesterday}

--- BILAN DE HIER (${data.yesterday}) ---
${data.yesterdayLogs.length > 0 ? data.yesterdayLogs.join('\n') : "Rien à signaler."}

--- DONNÉES GLOBALES (${data.period}) ---
Habitudes actives:
${data.habitsList.map(h => `- ${h.name} (${h.type === 'good' ? 'Bonne' : 'Mauvaise'}) [ID: ${h.id}]`).join('\n')}

Statistiques: ${data.habitsCount.good} bonnes, ${data.habitsCount.bad} mauvaises.
Succès récents:
${data.recentLogs.slice(0, 5).join('\n') || 'Aucun'}
Craquages récents:
${data.recentEvents.slice(0, 5).join('\n') || 'Aucun'}
`
}
