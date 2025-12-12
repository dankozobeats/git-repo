// Route API qui génère un rapport détaillé en interrogeant l'IA VPS.
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { askAI } from '@/lib/ai'

// Traite une demande de génération de rapport IA sur une période donnée.
export async function POST(request: NextRequest) {
  try {
    // Client Supabase pour vérifier l'authentification server-side.
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Récupère la période demandée (7/30/90 jours par défaut).
    const { period = '30j' } = await request.json()

    const daysMap: Record<string, number> = { '7j': 7, '30j': 30, '90j': 90 }
    const days = daysMap[period] || 30
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    const startDateStr = startDate.toISOString().split('T')[0]

    // ---- Fetch data ----
    // Récupère toutes les habitudes actives pour distinguer bonnes/mauvaises.
    const { data: habits } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_archived', false)

    const goodHabits = habits?.filter(h => h.type === 'good') || []
    const badHabits = habits?.filter(h => h.type === 'bad') || []

    // Logs "good" issus de la table principale.
    const { data: logs } = await supabase
      .from('logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('completed_date', startDateStr)
      .order('completed_date', { ascending: true })

    // Évènements "bad" qui peuvent contenir plusieurs occurrences par jour.
    const { data: events } = await supabase
      .from('habit_events')
      .select('*')
      .eq('user_id', user.id)
      .gte('event_date', startDateStr)
      .order('event_date', { ascending: true })

    const goodLogs = logs?.filter(l => goodHabits.find(h => h.id === l.habit_id)) || []
    const badLogs = (events || []).filter(e => badHabits.find(h => h.id === e.habit_id))

    // ---- Prompt texte envoyé à l'IA VPS ----
    const prompt = `Tu es un coach en discipline personnelle. Analyse ces données et génère un rapport factuel, direct, sans flatterie.

Période : ${period} (${days} jours)

Good Habits (${goodHabits.length}) :
${goodHabits.map(h => `- ${h.name} (objectif: ${h.daily_goal_value || 'non défini'}/${h.daily_goal_type || 'jour'})`).join('\n') || '(aucune)'}

Bad Habits (${badHabits.length}) :
${badHabits.map(h => `- ${h.name}`).join('\n') || '(aucune)'}

Good Logs (${goodLogs.length} validations) :
${goodLogs.map(l => {
  const habit = goodHabits.find(h => h.id === l.habit_id)
  const time = new Date(l.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  return `- ${habit?.name}: ${l.completed_date} à ${time}`
}).join('\n') || '(aucun)'}

Bad Logs (${badLogs.length} craquages) :
${badLogs.map(e => {
  const habit = badHabits.find(h => h.id === e.habit_id)
  const time = new Date(e.occurred_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  return `- ${habit?.name}: ${e.event_date} à ${time}`
}).join('\n') || '(aucun)'}

Génère un rapport en Markdown avec :
## 1. Synthèse globale
## 2. Analyse Good Habits
## 3. Analyse Bad Habits
## 4. Corrélations Good ↔ Bad
## 5. Insights avancés
## 6. Plan d'action (7 jours)
## 7. Conclusion`

    // ---- Appel IA VPS via askAI ----
    const report = await askAI(prompt, user.id)

    // Persiste le rapport généré pour pouvoir lister l'historique côté UI.
    await supabase.from('ai_reports').insert({
      user_id: user.id,
      period,
      report,
    })


    return NextResponse.json({
      report,
      stats: {
        goodHabits: goodHabits.length,
        badHabits: badHabits.length,
        goodLogs: goodLogs.length,
        badLogs: badLogs.length,
        period,
        days,
      }
    })

  } catch (error) {
    console.error('Erreur serveur:', error)
    return NextResponse.json({ error: 'Erreur serveur interne' }, { status: 500 })
  }
}
