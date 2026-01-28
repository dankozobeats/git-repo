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

    // Récupère la période demandée et la personnalité.
    const { period = '30j', personality = 'balanced' } = await request.json()

    // ---- Fetch Memory ----
    const { data: lastReports } = await supabase
      .from('ai_reports')
      .select('report, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)

    const previousReportSummary = lastReports?.[0]
      ? `Résumé du précédent rapport (${new Date(lastReports[0].created_at).toLocaleDateString()}): ${lastReports[0].report.substring(0, 500)}...`
      : 'Aucun rapport précédent.'

    const daysMap: Record<string, number> = { '7j': 7, '30j': 30, '90j': 90 }
    const days = daysMap[period] || 30
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    const startDateStr = startDate.toISOString().split('T')[0]

    // ---- Fetch Data (Legacy & Modern) ----
    // 1. Habits (Legacy)
    const { data: habits } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_archived', false)

    const goodHabits = habits?.filter(h => h.type === 'good') || []
    const badHabits = habits?.filter(h => h.type === 'bad') || []

    const { data: logs } = await supabase
      .from('logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('completed_date', startDateStr)
      .order('completed_date', { ascending: true })

    const { data: events } = await supabase
      .from('habit_events')
      .select('*')
      .eq('user_id', user.id)
      .gte('event_date', startDateStr)
      .order('event_date', { ascending: true })

    // 2. Trackables (Modern)
    const { data: trackables } = await supabase
      .from('trackables')
      .select('*')
      .eq('user_id', user.id)
      .is('archived_at', null)

    const { data: trackableEvents } = await supabase
      .from('trackable_events')
      .select('*, trackable:trackables(name, type)')
      .eq('user_id', user.id)
      .gte('occurred_at', startDateStr)
      .order('occurred_at', { ascending: true })

    const goodLogs = logs?.filter(l => goodHabits.find(h => h.id === l.habit_id)) || []
    const badLogs = (events || []).filter(e => badHabits.find(h => h.id === e.habit_id))

    // ---- Personality definition ----
    const personalityPrompts: Record<string, string> = {
      balanced: "Tu es un coach en discipline personnelle, factuel et direct.",
      hardcore: "Tu es un sergent instructeur impitoyable. Sois dur, sarcastique, et ne tolère aucune excuse. Pousse l'utilisateur dans ses retranchements.",
      supportive: "Tu es un mentor bienveillant et empathique. Encourage l'utilisateur, célèbre les petites victoires et propose des solutions douces.",
      scientist: "Tu es un analyste de données comportementales. Sois froid, analytique, utilise des termes techniques et base-toi uniquement sur les corrélations statistiques observées.",
    }

    const systemContext = personalityPrompts[personality] || personalityPrompts.balanced

    // ---- Prompt construction ----
    const prompt = `${systemContext} Analyse ces données et génère un rapport de haute qualité.

--- MÉMOIRE DU PRÉCÉDENT RAPPORT ---
${previousReportSummary}

--- DONNÉES DE LA PÉRIODE (${period}) ---

HABILES CLASSIQUES :
Good Habits: ${goodHabits.length} actifs.
Bad Habits: ${badHabits.length} actifs.

LOGS CLASSIQUES :
Réussites: ${goodLogs.length}
${goodLogs.slice(-15).map(l => `- ${goodHabits.find(h => h.id === l.habit_id)?.name}: ${l.completed_date} ${l.notes ? `(Note: ${l.notes})` : ''}`).join('\n')}

Craquages: ${badLogs.length}
${badLogs.slice(-15).map(e => `- ${badHabits.find(h => h.id === e.habit_id)?.name}: ${e.event_date}`).join('\n')}

TRACKABLES MODERNES :
${trackables?.map(t => `- [${t.type.toUpperCase()}] ${t.name}`).join('\n') || 'Aucun'}

ÉVÉNEMENTS RÉCENTS (Trackables) :
${trackableEvents?.slice(-20).map(te => {
      const meta = te.meta_json as any || {}
      return `- ${te.trackable?.name} (${te.kind}): ${new Date(te.occurred_at).toLocaleDateString()} ${meta.context ? `[Context: ${meta.context}]` : ''} ${meta.trigger ? `[Trigger: ${meta.trigger}]` : ''} ${meta.notes ? `[Notes: ${meta.notes}]` : ''}`
    }).join('\n') || 'Aucun'}

CONSIGNES DE RÉDACTION :
1. Compare les performances actuelles par rapport aux tendances passées mentionnées dans la mémoire.
2. Identifie des corrélations spécifiques (ex: "Tu craques souvent sur X quand tu notes du stress sur Y").
3. Sois extrêmement précis sur les conseils.
4. Utilise le ton défini dans ta personnalité : ${personality}.

Génère un rapport en Markdown structuré avec des titres (##), des listes et des tableaux si pertinent.`

    // ---- Appel IA VPS via askAI ----
    const report = await askAI(prompt, user.id)

    // Persiste le rapport généré.
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
        trackables: trackables?.length || 0,
        period,
        days,
      }
    })

  } catch (error) {
    console.error('Erreur serveur:', error)
    return NextResponse.json({ error: 'Erreur serveur interne' }, { status: 500 })
  }
}
