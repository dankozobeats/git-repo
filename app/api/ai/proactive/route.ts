import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import webpush from 'web-push'
import { askAI } from '@/lib/ai'
import { getAIUserContext, formatAIContextPrompt } from '@/lib/ai/context'
import { DateTime } from 'luxon'

export const runtime = 'nodejs'
// Vercel Hobby max = 10s, Pro = 60s
export const maxDuration = 10

function assertEnv(name: string): string {
    const value = process.env[name]
    if (!value) throw new Error(`Missing env var: ${name}`)
    return value
}

/**
 * Endpoint for proactive AI coaching.
 * Analyzes user patterns (streaks/slumps) and sends push notifications.
 */
export async function POST(req: Request) {
    try {
        // 1. Security Check
        const authHeader = req.headers.get('authorization') ?? ''
        const token = authHeader.replace('Bearer ', '').trim()
        const CRON_SECRET = assertEnv('CRON_SECRET')

        if (!token || token !== CRON_SECRET) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // 2. Setup
        const supabase = await createClient()
        const VAPID_PUBLIC_KEY = assertEnv('VAPID_PUBLIC_KEY')
        const VAPID_PRIVATE_KEY = assertEnv('VAPID_PRIVATE_KEY')

        webpush.setVapidDetails(
            'mailto:admin@badhabit-tracker.app',
            VAPID_PUBLIC_KEY,
            VAPID_PRIVATE_KEY
        )

        // 3. Get all active users with push subscriptions
        const { data: subs, error: subsError } = await supabase
            .from('push_subscriptions')
            .select('user_id, endpoint, p256dh, auth')

        if (subsError) throw subsError

        const userIds = Array.from(new Set(subs.map(s => s.user_id)))
        const results = []

        const body = await req.json().catch(() => ({}))
        const isForced = body.force === true
        const isMock = body.mock === true
        const shouldForceTrigger = body.forceTrigger === true
        console.log(`[PROACTIVE] Engine started. Users: ${userIds.length}. Forced: ${isForced}. Mock: ${isMock}. ForceTrigger: ${shouldForceTrigger}`)

        for (const userId of userIds) {
            console.log(`[PROACTIVE] Analyzing User: ${userId}`)
            // Get context for this user and inject userId
            const context = { ...(await getAIUserContext(userId)), userId }

            // Detection Logic
            let triggers = detectTriggers(context)

            // Debug: Force triggers if requested
            if (shouldForceTrigger && triggers.length === 0) {
                console.log(`[PROACTIVE] DEBUG: Forcing triggers for ${userId}`)
                triggers = [
                    {
                        type: 'STREAK_7',
                        habitId: 'debug-streak',
                        habitName: 'Habitude Test (Série)',
                        userId,
                        metadata: { streak: 7 } as any
                    },
                    {
                        type: 'SLUMP_DETECTION',
                        habitId: 'debug-slump',
                        habitName: 'Habitude Test (Relance)',
                        userId,
                        metadata: { missed_days: 2 } as any
                    }
                ]
            }

            console.log(`[PROACTIVE] Found ${triggers.length} triggers for ${userId}`)

            for (const trigger of triggers) {
                // Check if already sent in the last 24h to avoid spam (unless forced or mock)
                if (!isForced && !isMock) {
                    const { data: existing } = await supabase
                        .from('ai_proactive_notifications')
                        .select('id')
                        .eq('user_id', userId)
                        .eq('type', trigger.type)
                        .eq('habit_id', trigger.habitId)
                        .gte('sent_at', DateTime.now().minus({ hours: 24 }).toISO())
                        .limit(1)

                    if (existing && existing.length > 0) {
                        console.log(`[PROACTIVE] Skip ${trigger.type} for ${userId} (Already sent recent)`)
                        continue
                    }
                }

                // Generate AI Message
                console.log(`[PROACTIVE] Generating ${isMock ? 'MOCK' : 'AI'} message for ${trigger.type}...`)
                const message = await generateProactiveMessage(context, trigger, isMock)
                console.log(`[PROACTIVE] AI Message generated: "${message.substring(0, 30)}..."`)

                // Track in DB
                const { data: record, error: logError } = await supabase
                    .from('ai_proactive_notifications')
                    .insert({
                        user_id: userId,
                        type: trigger.type,
                        habit_id: trigger.habitId,
                        message: message,
                        metadata_json: trigger.metadata
                    })
                    .select()
                    .single()

                if (logError) {
                    console.error('Error logging proactive notification:', logError)
                    continue
                }

                // Send Push
                const userSubs = subs.filter(s => s.user_id === userId)
                console.log(`[PROACTIVE] Sending push to ${userSubs.length} devices for ${userId}`)
                const payload = JSON.stringify({
                    title: 'Message du Coach',
                    body: message,
                    url: '/coach',
                    type: 'proactive'
                })

                for (const sub of userSubs) {
                    try {
                        await webpush.sendNotification(
                            {
                                endpoint: sub.endpoint,
                                keys: { p256dh: sub.p256dh, auth: sub.auth }
                            } as any,
                            payload
                        )
                    } catch (err: any) {
                        if (err.statusCode === 410 || err.statusCode === 404) {
                            await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
                        }
                    }
                }

                results.push({ userId, trigger: trigger.type, status: 'sent' })
            }
        }

        return NextResponse.json({ processed: userIds.length, results })
    } catch (err: any) {
        console.error('Proactive Engine Error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

function detectTriggers(context: any) {
    const triggers = []
    const today = DateTime.now().toISODate()

    for (const habit of context.stats) {
        // 1. Streak 7 detection
        // count_7d === 7 means every day in the last 7 days was logged
        if (habit.count_7d === 7) {
            triggers.push({
                type: 'STREAK_7',
                habitId: habit.habit_id,
                habitName: habit.name,
                userId: context.userId || context.user_id, // Pass user id
                metadata: { streak: 7 }
            })
        }

        // 2. Slump detection (2 missed days)
        // Check recent logs for this specific habit
        const habitLogs = context.recentLogs
            .filter((l: string) => l.includes(habit.name))
            .map((l: string) => l.split(': ')[1])
            .sort()
            .reverse()

        const yesterday = DateTime.now().minus({ days: 1 }).toISODate()
        const dayBefore = DateTime.now().minus({ days: 2 }).toISODate()

        const hasYesterday = habitLogs.includes(yesterday)
        const hasDayBefore = habitLogs.includes(dayBefore)

        // If it's a good habit and missed 2 days
        const habitInfo = context.habitsList.find((h: any) => h.id === habit.habit_id)
        if (habitInfo?.type === 'good' && !hasYesterday && !hasDayBefore) {
            triggers.push({
                type: 'SLUMP_DETECTION',
                habitId: habit.habit_id,
                habitName: habit.name,
                userId: context.userId || context.user_id, // Pass user id
                metadata: { missed_days: 2 }
            })
        }
    }

    return triggers
}

async function generateProactiveMessage(context: any, trigger: any, isMock: boolean = false) {
    const bios = context.userFacts.join(', ') || 'utilisateur'

    if (isMock) {
        if (trigger.type === 'STREAK_7') return `MOCK: Bravo pour tes 7 jours sur "${trigger.habitName}" ! Ta discipline est exemplaire.`
        if (trigger.type === 'SLUMP_DETECTION') return `MOCK: J'ai vu que tu as manqué "${trigger.habitName}" ces 2 derniers jours. On s'y remet ?`
        return "MOCK: Message de soutien automatique."
    }

    let prompt = ''
    if (trigger.type === 'STREAK_7') {
        prompt = `Félicite l'utilisateur pour sa série incroyable de 7 jours sur l'habitude "${trigger.habitName}". 
        Sois court (max 120 caractères), motivant, et utilise les faits suivants pour personnaliser : ${bios}. 
        Ne mentionne pas d'IDs techniques.`
    } else if (trigger.type === 'SLUMP_DETECTION') {
        prompt = `L'utilisateur a manqué son habitude "${trigger.habitName}" ces 2 derniers jours. 
        Envoie un message de soutien court (max 120 caractères) pour l'encourager à s'y remettre aujourd'hui. 
        Sois bienveillant mais ferme. Personnalise avec : ${bios}.`
    }

    const contextPrompt = formatAIContextPrompt(context)
    const instructions = "Tu es un coach de discipline personnel. Tes réponses pour les notifications push doivent être percutantes, courtes et sans jargon technique."

    const message = await askAI(`${instructions}\n\n${contextPrompt}\n\n${prompt}`, trigger.userId)
    return message.trim().replace(/^"|"$/g, '') // Clean quotes if AI added them
}
