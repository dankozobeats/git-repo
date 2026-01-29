/**
 * POST /api/reports/ai-insights
 * Génère des insights IA personnalisés basés sur les données utilisateur
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { askAI } from '@/lib/ai'

export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { personality = 'balanced', type = 'general' } = await request.json().catch(() => ({}))

    // Récupérer les données utilisateur
    const [habitsRes, logsRes, eventsRes, trackablesRes, trackableEventsRes, lastReportsRes] = await Promise.all([
      supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_archived', false),
      supabase
        .from('logs')
        .select('*')
        .eq('user_id', user.id)
        .order('completed_date', { ascending: false })
        .limit(100),
      supabase
        .from('habit_events')
        .select('*')
        .eq('user_id', user.id)
        .order('event_date', { ascending: false })
        .limit(100),
      supabase
        .from('trackables')
        .select('*')
        .eq('user_id', user.id)
        .is('archived_at', null),
      supabase
        .from('trackable_events')
        .select('*, trackable:trackables(name, type)')
        .eq('user_id', user.id)
        .order('occurred_at', { ascending: false })
        .limit(100),
      supabase
        .from('ai_reports')
        .select('report, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
    ])

    const habits = habitsRes.data || []
    const logs = logsRes.data || []
    const events = eventsRes.data || []
    const trackables = trackablesRes.data || []
    const trackableEvents = trackableEventsRes.data || []
    const lastReport = lastReportsRes.data?.[0]

    // Préparer le contexte pour l'IA
    const context = prepareContextForAI(habits, logs, events, trackables, trackableEvents, lastReport)

    // Personality definition
    const typePrompts: Record<string, string> = {
      general: "Génère un rapport d'insights profonds sur le comportement.",
      strategic: "Génère un BRIEFING STRATÉGIQUE de haut niveau. Analyse les tendances lourdes et les changements de trajectoire.",
    }

    const personalityPrompts: Record<string, string> = {
      balanced: "Tu es un coach expert en changement de comportement et psychologie des habitudes, factuel et direct.",
      hardcore: "Tu es un sergent instructeur impitoyable. Sois dur, sarcastique, et ne tolère aucune excuse.",
      supportive: "Tu es un mentor bienveillant et empathique. Encourage l'utilisateur.",
      scientist: "Tu es un analyste de données comportementales froid et chirurgical. Utilise des termes techniques.",
    }

    const basePrompt = typePrompts[type] || typePrompts.general
    const systemContext = personalityPrompts[personality] || personalityPrompts.balanced

    // Préparer le prompt pour l'IA
    const prompt = `${systemContext} ${basePrompt}

DONNÉES UTILISATEUR ET CONTEXTE:
${context}

Mode de personnalité demandé : ${personality}

Génère un rapport JSON avec cette structure exacte:
{
  "summary": "Résumé en 2-3 phrases adapté à ta personnalité",
  "deepInsights": [
    {
      "title": "Titre percutant",
      "description": "Analyse fine incluant triggers/contextes",
      "severity": "high|medium|low",
      "category": "pattern|trigger|motivation|progress"
    }
  ],
  "recommendations": [
    {
      "title": "Action ciblée",
      "description": "Pourquoi ça va marcher",
      "action": "Consigne précise",
      "priority": "high|medium|low",
      "estimatedImpact": "Bénéfice attendu"
    }
  ],
  "predictions": {
    "in30Days": "Vision à 30j",
    "in60Days": "Vision à 60j",
    "in90Days": "Vision à 90j"
  },
  "whatIf": [
    {
      "scenario": "Si tu changes X...",
      "outcome": "Résultat Y probable",
      "confidence": 85
    }
  ],
  "motivationalMessage": "Message de fin dans ton style propre"
}

IMPORTANT:
- Réponds UNIQUEMENT avec du JSON valide.
- Inclus des références aux notes et déclencheurs fournis dans le contexte.
- Compare avec le rapport précédent si présent dans le contexte.`

    // Appeler l'IA
    const aiResponse = await askAI(prompt, user.id)

    // Parser la réponse JSON
    let cleanedResponse = aiResponse.trim()
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.replace(/^```json\n?/, '').replace(/\n?```$/, '')
    } else if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/^```\n?/, '').replace(/\n?```$/, '')
    }

    let aiInsights
    try {
      aiInsights = JSON.parse(cleanedResponse)
      if (typeof aiInsights === 'string') {
        aiInsights = JSON.parse(aiInsights)
      }
    } catch (parseError) {
      console.error('JSON parse error, falling back to basic result')
      aiInsights = {
        summary: "Désolé, j'ai eu un problème de formatage. Voici mon analyse brute : " + cleanedResponse.substring(0, 500),
        deepInsights: [],
        recommendations: [],
        predictions: { in30Days: "?", in60Days: "?", in90Days: "?" },
        whatIf: [],
        motivationalMessage: "Réessaie dans un instant."
      }
    }

    // Persister aussi ce type de rapport pour la mémoire future
    await supabase.from('ai_reports').insert({
      user_id: user.id,
      period: 'augmented',
      report: aiInsights.summary + "\n\nInsights: " + aiInsights.deepInsights.map((i: any) => i.title).join(', '),
    })

    return NextResponse.json(aiInsights)
  } catch (error) {
    console.error('Error generating AI insights:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate AI insights',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

function prepareContextForAI(
  habits: any[],
  logs: any[],
  events: any[],
  trackables: any[],
  trackableEvents: any[],
  lastReport?: any
) {
  const last30Days = new Date()
  last30Days.setDate(last30Days.getDate() - 30)
  const last30DaysStr = last30Days.toISOString().split('T')[0]

  const recentLogs = logs.filter(l => l.completed_date >= last30DaysStr)
  const recentEvents = events.filter(e => e.event_date >= last30DaysStr)
  const recentTE = trackableEvents.filter(te => te.occurred_at >= last30DaysStr)

  // Memoire
  const memoryText = lastReport
    ? `Dernière analyse (${new Date(lastReport.created_at).toLocaleDateString()}): ${lastReport.report.substring(0, 300)}`
    : 'Première analyse pour cet utilisateur.'

  // Habitudes et Trackables
  const goodHabits = habits.filter(h => h.type === 'good')
  const badHabits = habits.filter(h => h.type === 'bad')
  const states = trackables.filter(t => t.type === 'state')

  // Statistiques simples
  let goodActions = recentLogs.filter(l => habits.find(h => h.id === l.habit_id)?.type !== 'bad').length
  let badActions = recentLogs.filter(l => habits.find(h => h.id === l.habit_id)?.type === 'bad').length
  badActions += recentEvents.length

  // Inclure les trackables moderns dans le compte
  recentTE.forEach(te => {
    if (te.trackable?.type === 'bad' || te.trackable?.type === 'state') badActions++
    else goodActions++
  })

  // Détails qualitatifs (Notes & Contextes)
  const qualitativeData = [
    ...recentLogs.filter(l => l.notes).map(l => `- Note sur ${habits.find(h => h.id === l.habit_id)?.name}: "${l.notes}"`),
    ...recentTE.filter(te => te.meta_json?.notes || te.meta_json?.trigger || te.meta_json?.context).map(te => {
      const m = te.meta_json
      return `- ${te.trackable?.name}: ${m.context ? `[Context: ${m.context}] ` : ''}${m.trigger ? `[Trigger: ${m.trigger}] ` : ''}${m.notes ? `"${m.notes}"` : ''}`
    })
  ].slice(-20)

  return `
HISTORIQUE RÉCENT :
${memoryText}

TRACKABLES ACTIFS :
- Bonnes habitudes: ${goodHabits.map(h => h.name).join(', ')}
- Mauvaises à limiter: ${badHabits.map(h => h.name).join(', ')}
- États suivis: ${states.map(s => s.name).join(', ')}

VOLUME ACTIVITÉ (30j):
- Réussites: ${goodActions}
- Difficultés/Craquages: ${badActions}
- Taux de succès estimé: ${goodActions + badActions > 0 ? Math.round((goodActions / (goodActions + badActions)) * 100) : 0}%

DÉTAILS QUALITATIFS (Notes, Triggers, Contextes):
${qualitativeData.join('\n') || "Aucune note qualitative ce mois-ci."}
`
}
