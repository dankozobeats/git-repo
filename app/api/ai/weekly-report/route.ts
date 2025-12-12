import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { askAI } from '@/lib/ai'

const DAY_MS = 1000 * 60 * 60 * 24

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'userId requis' }, { status: 400 })
    }

    const supabase = await createClient()
    const now = Date.now()
    const weekAgo = new Date(now - 7 * DAY_MS)
    const twoWeeksAgo = new Date(now - 14 * DAY_MS)
    const minDate = twoWeeksAgo.toISOString().split('T')[0]

    const { data: events } = await supabase
      .from('habit_events')
      .select('event_date')
      .eq('user_id', userId)
      .gte('event_date', minDate)
      .order('event_date', { ascending: true })

    const thisWeekEvents = (events || []).filter(event => new Date(event.event_date) >= weekAgo)
    const lastWeekEvents = (events || []).filter(event => {
      const date = new Date(event.event_date)
      return date >= twoWeeksAgo && date < weekAgo
    })

    const delta = thisWeekEvents.length - lastWeekEvents.length
    const trend = delta > 0 ? 'augmentation' : 'diminution'

    const prompt = `Génère un rapport hebdomadaire motivant basé sur ces données :

Cette semaine : ${thisWeekEvents.length} rechutes
Semaine dernière : ${lastWeekEvents.length} rechutes
Évolution : ${trend}

Structure du rapport (4 sections courtes) :
1. 📊 Résumé des chiffres (1-2 phrases)
2. 💪 Points positifs identifiés
3. 🎯 Axes d'amélioration
4. 🚀 Objectif pour la semaine prochaine

Reste positif, même si les chiffres ne sont pas bons. Utilise des émojis.`

    const report = await askAI(prompt, userId)

    return NextResponse.json({ report })
  } catch (error) {
    console.error('Weekly report error:', error)
    return NextResponse.json({ error: 'Impossible de générer le rapport hebdomadaire' }, { status: 500 })
  }
}
