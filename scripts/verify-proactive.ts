import { DateTime } from 'luxon'

function detectTriggers(context: any) {
    const triggers = []

    for (const habit of context.stats) {
        // 1. Streak 7 detection
        if (habit.count_7d === 7) {
            triggers.push({
                type: 'STREAK_7',
                habitId: habit.habit_id,
                habitName: habit.name,
                metadata: { streak: 7 }
            })
        }

        // 2. Slump detection (2 missed days)
        const habitLogs = context.recentLogs
            .filter((l: string) => l.includes(habit.name))
            .map((l: string) => {
                const parts = l.split(': ')
                return parts[1] ? parts[1].trim() : ''
            })
            .filter(Boolean)
            .sort()
            .reverse()

        const yesterday = DateTime.now().minus({ days: 1 }).toISODate()
        const dayBefore = DateTime.now().minus({ days: 2 }).toISODate()

        const hasYesterday = habitLogs.includes(yesterday)
        const hasDayBefore = habitLogs.includes(dayBefore)

        const habitInfo = context.habitsList.find((h: any) => h.id === habit.habit_id)
        if (habitInfo?.type === 'good' && !hasYesterday && !hasDayBefore) {
            triggers.push({
                type: 'SLUMP_DETECTION',
                habitId: habit.habit_id,
                habitName: habit.name,
                metadata: { missed_days: 2 }
            })
        }
    }

    return triggers
}

// Mock Data
const mockContext = {
    stats: [
        { habit_id: 'h1', name: 'Meditation', count_7d: 7, count_30d: 25 },
        { habit_id: 'h2', name: 'Sport', count_7d: 3, count_30d: 12 }
    ],
    recentLogs: [
        `- Meditation: ${DateTime.now().toISODate()}`,
        `- Meditation: ${DateTime.now().minus({ days: 1 }).toISODate()}`,
        `- Meditation: ${DateTime.now().minus({ days: 2 }).toISODate()}`,
        `- Meditation: ${DateTime.now().minus({ days: 3 }).toISODate()}`,
        `- Meditation: ${DateTime.now().minus({ days: 4 }).toISODate()}`,
        `- Meditation: ${DateTime.now().minus({ days: 5 }).toISODate()}`,
        `- Meditation: ${DateTime.now().minus({ days: 6 }).toISODate()}`,
        `- Sport: ${DateTime.now().minus({ days: 3 }).toISODate()}`,
    ],
    habitsList: [
        { id: 'h1', name: 'Meditation', type: 'good' },
        { id: 'h2', name: 'Sport', type: 'good' }
    ]
}

console.log('Testing Proactive Detection...')
const triggers = detectTriggers(mockContext)
console.log('Triggers detected:', JSON.stringify(triggers, null, 2))

const hasStreak = triggers.some(t => t.type === 'STREAK_7' && t.habitId === 'h1')
const hasSlump = triggers.some(t => t.type === 'SLUMP_DETECTION' && t.habitId === 'h2')

if (hasStreak && hasSlump) {
    console.log('✅ Success: Streak and Slump correctly detected!')
} else {
    console.log('❌ Failure: Detection logic missed something.')
    if (!hasStreak) console.log('- Missing Streak for Meditation')
    if (!hasSlump) console.log('- Missing Slump for Sport')
}
