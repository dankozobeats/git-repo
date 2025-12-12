// Route API Next.js qui génère une réponse coach IA pour une habitude donnée.
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { askAI } from "@/lib/ai"
import type { CoachFocus, CoachResult, CoachStatsPayload, CoachTone } from "@/types/coach"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

// Paramètres utilisés pour limiter l'horizon de logs et le volume envoyé à l'IA.
const LOOKBACK_DAYS = 30
const MAX_ACTIVITY_ENTRIES = 14

type HabitRow = {
  id: string
  name: string
  type: "good" | "bad" | string
  goal_value: number | null
  goal_type: "daily" | "weekly" | "monthly" | null
  goal_description: string | null
  tracking_mode: "binary" | "counter" | null
}

type CoachRequestBody = {
  habitId?: string
  tone?: CoachTone
  focus?: CoachFocus
  stats?: Partial<CoachStatsPayload>
}

type ActivityEntry = {
  date: string
  count: number
  notes?: string[]
}

// ===============================================
// ============== ROUTE API PRINCIPALE ===========
// ===============================================

// Traite les requêtes POST entrantes pour générer une analyse coach d'une habitude.
export async function POST(request: NextRequest) {
  try {
    // Auth
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // Parse le corps JSON pour extraire habitId et préférences IA.
    let payload: CoachRequestBody
    try {
      payload = await request.json()
    } catch {
      return NextResponse.json({ error: "Payload JSON invalide" }, { status: 400 })
    }

    const { habitId, tone = "balanced", focus = "mindset", stats: incomingStats } = payload
    if (!habitId) return NextResponse.json({ error: "habitId requis" }, { status: 400 })

    // 1. Charger habitude
    const { data: habit, error: habitError } = await supabase
      .from("habits")
      .select("id, name, type, goal_value, goal_type, goal_description, tracking_mode")
      .eq("id", habitId)
      .eq("user_id", user.id)
      .single()

    if (habitError || !habit) {
      return NextResponse.json({ error: "Habitude introuvable" }, { status: 404 })
    }

    // 2. Activité récente
    let activity: ActivityEntry[] = []
    try {
      activity = await fetchRecentActivity({
        supabase,
        habitId,
        userId: user.id,
        trackingMode: habit.tracking_mode,
      })
    } catch {
      return NextResponse.json({ error: "Impossible de récupérer les logs" }, { status: 500 })
    }

    // Normalise les statistiques fournies afin de garantir des nombres cohérents.
    const stats = normalizeStats(incomingStats)

    // 3. Construire prompt
    const prompt = buildCoachPrompt({
      habit,
      tone,
      focus,
      stats,
      activity: activity.slice(0, MAX_ACTIVITY_ENTRIES),
    })

    // 4. Envoyer la requête au coach IA VPS
    let aiResponse: string
    try {
      aiResponse = await askAI(prompt, user.id)
    } catch (error: any) {
      return NextResponse.json(
        {
          error: "Erreur IA",
          details: error?.message || "unknown",
        },
        { status: 503 }
      )
    }

    // 5. PARSER ROBUSTE (style Claude)
    const parsedResult = parseAI(aiResponse)

    return NextResponse.json({
      success: true,
      result: parsedResult,
      habit: { id: habit.id, name: habit.name, type: habit.type },
      stats,
      activity,
      timestamp: new Date().toISOString(),
    })

  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Erreur interne API Coach",
        details: error?.message || "unknown",
      },
      { status: 500 }
    )
  }
}

//
// =============================================================
// =============== PARSING ROBUSTE (VERSION CLAUDE) ============
// =============================================================
//

// Nettoie une réponse texte de l'IA et extrait les champs attendus.
function parseAI(raw: string): CoachResult {
  const clean = raw
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .replace(/\r/g, "")
    .trim()

  const extract = (field: string) => {
    const r = new RegExp(`${field}\\s*:\\s*"(.*?)"`, "i")
    return clean.match(r)?.[1]?.trim() || ""
  }

  const extractNum = (field: string) => {
    const r = new RegExp(`${field}\\s*:\\s*(\\d+(?:\\.\\d+)?)`, "i")
    const v = clean.match(r)?.[1]
    const n = v ? parseFloat(v) : 0.5
    return isNaN(n) ? 0.5 : n
  }

  return {
    summary: extract("summary") || "Analyse indisponible.",
    analysis: extract("analysis") || "Analyse en cours.",
    patterns: extract("patterns") || "Aucun pattern détecté.",
    advice: extract("advice") || "Aucun conseil disponible.",
    risk_score: Math.min(1, Math.max(0, extractNum("risk_score"))),
  }
}

//
// =============================================================
// =============== UTILITAIRES SUPABASE ========================
// =============================================================
//

// Récupère les logs utilisateurs sur une fenêtre glissante pour alimenter l'analyse.
async function fetchRecentActivity({
  supabase,
  habitId,
  userId,
  trackingMode,
}: {
  supabase: SupabaseClient<Database>
  habitId: string
  userId: string
  trackingMode: "binary" | "counter" | null
}): Promise<ActivityEntry[]> {
  
  // Calcule la date limite de récupération (N jours en arrière).
  const since = new Date()
  since.setDate(since.getDate() - LOOKBACK_DAYS)
  const sinceDate = since.toISOString().split("T")[0]

  if (trackingMode === "counter") {
    const { data, error } = await supabase
      .from("habit_events")
      .select("event_date")
      .eq("habit_id", habitId)
      .eq("user_id", userId)
      .gte("event_date", sinceDate)
      .order("event_date", { ascending: false })

    if (error) throw new Error(error.message)
    return aggregateCounterEvents(data || [])
  }

  const { data, error } = await supabase
    .from("logs")
    .select("completed_date, value, notes")
    .eq("habit_id", habitId)
    .eq("user_id", userId)
    .gte("completed_date", sinceDate)
    .order("completed_date", { ascending: false })

  if (error) throw new Error(error.message)
  return aggregateLogRows(data || [])
}

// Agrège les événements "counter" en regroupant par date et en comptant les occurrences.
function aggregateCounterEvents(
  rows: Array<{ event_date: string | null }>
): ActivityEntry[] {
  const map = new Map<string, ActivityEntry>()
  for (const row of rows) {
    if (!row.event_date) continue
    const entry = map.get(row.event_date) || { date: row.event_date, count: 0 }
    entry.count++
    map.set(row.event_date, entry)
  }
  return [...map.values()].sort((a, b) => (a.date < b.date ? 1 : -1))
}

// Agrège les logs classiques en sommant les valeurs et en conservant jusqu'à 3 notes par jour.
function aggregateLogRows(
  rows: Array<{ completed_date: string | null; value: number | null; notes: string | null }>
): ActivityEntry[] {
  const map = new Map<string, ActivityEntry>()
  for (const row of rows) {
    if (!row.completed_date) continue
    const entry = map.get(row.completed_date) || {
      date: row.completed_date,
      count: 0,
      notes: [],
    }
    entry.count += row.value ?? 1
    if (row.notes && entry.notes!.length < 3) {
      entry.notes!.push(row.notes.trim())
    }
    map.set(row.completed_date, entry)
  }
  return [...map.values()].sort((a, b) => (a.date < b.date ? 1 : -1))
}

// Convertit les statistiques partiellement fournies en nombres sûrs avec défaut à 0.
function normalizeStats(stats?: Partial<CoachStatsPayload>): CoachStatsPayload {
  return {
    totalCount: Number(stats?.totalCount) || 0,
    last7DaysCount: Number(stats?.last7DaysCount) || 0,
    currentStreak: Number(stats?.currentStreak) || 0,
    todayCount: Number(stats?.todayCount) || 0,
    monthPercentage: Number(stats?.monthPercentage) || 0,
  }
}

//
// =============================================================
// ===================== PROMPT BUILDER ========================
// =============================================================
//

// Construit un prompt textuel minimaliste que askAI enverra au modèle choisi.
function buildCoachPrompt({
  habit,
  tone,
  focus,
  stats,
  activity,
}: {
  habit: HabitRow
  tone: CoachTone
  focus: CoachFocus
  stats: CoachStatsPayload
  activity: ActivityEntry[]
}) {
  const limited = activity.slice(0, 5)
  // Réduit la liste d'activité en format compact "jour:valeur" pour limiter le prompt.
  const compact = limited.length
    ? limited.map(a => `${a.date.split("-")[2]}:${a.count}`).join(",")
    : "aucune"

  return `
Réponds en FORMAT TEXTE, PAS JSON.
Structure EXACTE :

summary: "..."
analysis: "..."
patterns: "..."
advice: "..."
risk_score: 0.5

Habit: ${habit.name} (${habit.type})
Tone: ${tone}
Focus: ${focus}
Stats: total=${stats.totalCount}, streak=${stats.currentStreak}, month=${stats.monthPercentage}
Activity: ${compact}

RÉGLE : Pas de markdown. Pas de JSON complet. Seulement les champs ci-dessus.
`.trim()
}
