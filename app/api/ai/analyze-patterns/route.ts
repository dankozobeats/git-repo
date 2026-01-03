import { NextRequest, NextResponse } from 'next/server'
import { askAI } from '@/lib/ai'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/api/ratelimit'

const DAY_MS = 1000 * 60 * 60 * 24

export async function POST(request: NextRequest) {
  // 1. Rate Limiting (AI)
  const rateLimit = await checkRateLimit(request as any, 'AI')
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests', retryAfter: rateLimit.reset },
      { status: 429, headers: { 'Retry-After': rateLimit.reset.toString() } }
    )
  }

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = user.id
    // Note: userId from body is ignored for security

    const startDate = new Date(Date.now() - 30 * DAY_MS)
    const startDateStr = startDate.toISOString().split('T')[0]

    const { data: habits } = await supabase
      .from('habits')
      .select('id, name')
      .eq('user_id', userId)
      .eq('is_archived', false)

    const nameById = new Map((habits || []).map((habit: any) => [habit.id, habit.name]))

    const { data: logs } = await supabase
      .from('logs')
      .select('habit_id, completed_date, created_at')
      .eq('user_id', userId)
      .gte('completed_date', startDateStr)
      .order('completed_date', { ascending: false })

    const { data: events } = await supabase
      .from('habit_events')
      .select('habit_id, event_date, occurred_at')
      .eq('user_id', userId)
      .gte('event_date', startDateStr)
      .order('event_date', { ascending: false })

    const entries = [
      ...(logs || []).map((entry: any) => ({
        habitName: nameById.get(entry.habit_id) || 'Habitude inconnue',
        timestamp: entry.completed_date || entry.created_at,
      })),
      ...(events || []).map((entry: any) => ({
        habitName: nameById.get(entry.habit_id) || 'Habitude inconnue',
        timestamp: entry.event_date || entry.occurred_at,
      })),
    ].filter(
      (item): item is { habitName: string; timestamp: string } =>
        Boolean(item.timestamp && item.timestamp.toString().trim())
    )

    if (entries.length === 0) {
      return NextResponse.json({
        analysis: 'Pas assez de données pour analyser tes patterns. Continue de tracker !',
      })
    }

    const habitSummary = entries.reduce<Record<string, number>>((acc, entry) => {
      acc[entry.habitName] = (acc[entry.habitName] || 0) + 1
      return acc
    }, {})

    const daysSummary = entries.reduce<Record<string, number>>((acc, entry) => {
      const weekday = new Date(entry.timestamp).toLocaleDateString('fr-FR', { weekday: 'long' })
      acc[weekday] = (acc[weekday] || 0) + 1
      return acc
    }, {})

    const habitSummaryText = Object.entries(habitSummary)
      .map(([habit, qty]) => `- ${habit}: ${qty} fois`)
      .join('\n') || '- (pas encore de logs)'

    const daysSummaryText = Object.entries(daysSummary)
      .map(([day, qty]) => `- ${day}: ${qty} fois`)
      .join('\n') || '- (aucun jour récurrent)'

    const prompt = `Tu es un psychologue spécialisé dans l'analyse comportementale. Analyse ces données sur les 30 derniers jours :

Habitudes et fréquences :
${habitSummaryText}

Jours de la semaine les plus problématiques :
${daysSummaryText}

Génère une analyse en 3 paragraphes courts :
1. Patterns identifiés (jours, moments, fréquences)
2. Possible causes ou déclencheurs
3. Suggestions concrètes pour améliorer

Reste bienveillant, constructif, et motivant. Utilise "tu" pour t'adresser à l'utilisateur.`

    const analysis = await askAI(prompt, userId)

    return NextResponse.json({ analysis })
  } catch (error) {
    console.error('Pattern analysis error:', error)
    return NextResponse.json({ error: 'Impossible d\'analyser les patterns' }, { status: 500 })
  }
}
