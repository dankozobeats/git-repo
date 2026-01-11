/**
 * POST /api/reports/ai-insights
 * Génère des insights IA personnalisés basés sur les données utilisateur
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { askAI } from '@/lib/ai'

export async function POST() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Récupérer les données utilisateur
    const [habitsRes, logsRes, eventsRes] = await Promise.all([
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
        .limit(200),
      supabase
        .from('habit_events')
        .select('*')
        .eq('user_id', user.id)
        .order('event_date', { ascending: false })
        .limit(200),
    ])

    const habits = habitsRes.data || []
    const logs = logsRes.data || []
    const events = eventsRes.data || []

    // Préparer le contexte pour l'IA
    const context = prepareContextForAI(habits, logs, events)

    // Préparer le prompt pour l'IA
    const prompt = `Tu es un coach expert en changement de comportement et psychologie des habitudes. Analyse les données suivantes et génère un rapport détaillé et personnalisé.

DONNÉES UTILISATEUR:
${context}

Génère un rapport JSON avec cette structure exacte:
{
  "summary": "Résumé en 2-3 phrases de la situation globale",
  "deepInsights": [
    {
      "title": "Titre de l'insight",
      "description": "Explication détaillée",
      "severity": "high|medium|low",
      "category": "pattern|trigger|motivation|progress"
    }
  ],
  "recommendations": [
    {
      "title": "Titre de la recommandation",
      "description": "Explication de pourquoi c'est important",
      "action": "Action concrète à faire",
      "priority": "high|medium|low",
      "estimatedImpact": "Impact attendu"
    }
  ],
  "predictions": {
    "in30Days": "Prédiction à 30 jours si continue comme ça",
    "in60Days": "Prédiction à 60 jours",
    "in90Days": "Prédiction à 90 jours"
  },
  "whatIf": [
    {
      "scenario": "Si tu fais X...",
      "outcome": "Alors Y va se passer",
      "confidence": 75
    }
  ],
  "motivationalMessage": "Message personnalisé encourageant"
}

IMPORTANT:
- Sois spécifique aux données de l'utilisateur
- Utilise des chiffres concrets
- Sois encourageant mais honnête
- Donne des actions ultra-concrètes
- Réponds UNIQUEMENT avec du JSON valide, sans markdown ni \`\`\`json`

    // Appeler l'IA avec votre système existant
    const aiResponse = await askAI(prompt, user.id)

    // Parser la réponse JSON
    // Nettoyer la réponse au cas où il y aurait du markdown
    let cleanedResponse = aiResponse.trim()
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.replace(/^```json\n?/, '').replace(/\n?```$/, '')
    } else if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/^```\n?/, '').replace(/\n?```$/, '')
    }

    let aiInsights
    try {
      aiInsights = JSON.parse(cleanedResponse)
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      console.error('AI Response:', aiResponse)

      // Fallback avec des données exemple si le parsing échoue
      aiInsights = {
        summary: cleanedResponse.substring(0, 200) + '...',
        deepInsights: [
          {
            title: 'Analyse en cours',
            description: 'L\'IA a généré une réponse mais le format n\'est pas encore optimisé. Voici un extrait: ' + cleanedResponse.substring(0, 150),
            severity: 'medium',
            category: 'progress'
          }
        ],
        recommendations: [
          {
            title: 'Continuez vos efforts',
            description: 'Vos données sont en cours d\'analyse',
            action: 'Réessayez la génération dans quelques instants',
            priority: 'medium',
            estimatedImpact: 'Amélioration de la qualité des insights'
          }
        ],
        predictions: {
          in30Days: 'Analyse en cours...',
          in60Days: 'Analyse en cours...',
          in90Days: 'Analyse en cours...'
        },
        whatIf: [
          {
            scenario: 'Si vous réessayez',
            outcome: 'L\'IA pourra générer un rapport plus détaillé',
            confidence: 80
          }
        ],
        motivationalMessage: 'Vos données sont riches et l\'analyse est en cours. Réessayez pour obtenir un rapport complet!'
      }
    }

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

function prepareContextForAI(habits: any[], logs: any[], events: any[]) {
  // Calculer des stats agrégées
  const goodHabits = habits.filter(h => h.type === 'good')
  const badHabits = habits.filter(h => h.type === 'bad')

  const last30Days = new Date()
  last30Days.setDate(last30Days.getDate() - 30)
  const last30DaysStr = last30Days.toISOString().split('T')[0]

  const recentLogs = logs.filter(l => l.completed_date >= last30DaysStr)
  const recentEvents = events.filter(e => e.event_date >= last30DaysStr)

  // Compter bonnes vs mauvaises actions
  let goodActions = 0
  let badActions = 0

  recentLogs.forEach(log => {
    const habit = habits.find(h => h.id === log.habit_id)
    if (habit?.type === 'bad') badActions++
    else goodActions++
  })

  recentEvents.forEach(event => {
    const habit = habits.find(h => h.id === event.habit_id)
    if (habit?.type === 'bad') badActions++
    else goodActions++
  })

  // Analyser les streaks
  const habitStreaks = habits.map(h => ({
    name: h.name,
    type: h.type,
    tracking_mode: h.tracking_mode,
  }))

  // Analyser patterns temporels
  const hourlyActivity: Record<number, number> = {}
  events.forEach(e => {
    if (e.occurred_at) {
      const hour = new Date(e.occurred_at).getHours()
      hourlyActivity[hour] = (hourlyActivity[hour] || 0) + 1
    }
  })

  const mostActiveHours = Object.entries(hourlyActivity)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([hour]) => `${hour}h`)

  return `
HABITUDES:
- ${goodHabits.length} bonnes habitudes: ${goodHabits.map(h => h.name).join(', ')}
- ${badHabits.length} mauvaises habitudes: ${badHabits.map(h => h.name).join(', ')}

ACTIVITÉ (30 derniers jours):
- ${goodActions} bonnes actions
- ${badActions} mauvaises actions
- Ratio: ${goodActions > 0 ? Math.round((goodActions / (goodActions + badActions)) * 100) : 0}% de succès

PATTERNS TEMPORELS:
- Heures les plus actives: ${mostActiveHours.join(', ') || 'Aucune donnée'}
- Nombre total d'événements enregistrés: ${logs.length + events.length}

HABITUDES DÉTAILLÉES:
${habitStreaks.slice(0, 10).map(h => `- ${h.name} (${h.type}, mode: ${h.tracking_mode})`).join('\n')}
`
}
