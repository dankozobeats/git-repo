import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { fetchAI } from "@/lib/ai/fetchAI"
import type { CoachFocus, CoachResult, CoachStatsPayload, CoachTone } from "@/types/coach"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

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

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    let payload: CoachRequestBody
    try {
      payload = await request.json()
    } catch {
      return NextResponse.json(
        { error: "Payload JSON invalide" },
        { status: 400 }
      )
    }

    const {
      habitId,
      tone = "balanced",
      focus = "mindset",
      stats: incomingStats,
    } = payload

    if (!habitId) {
      return NextResponse.json(
        { error: "habitId requis" },
        { status: 400 }
      )
    }

    // --------------------------
    // 1) Charger l’habitude
    // --------------------------
    const { data: habit, error: habitError } = await supabase
      .from("habits")
      .select(
        "id, name, type, goal_value, goal_type, goal_description, tracking_mode"
      )
      .eq("id", habitId)
      .eq("user_id", user.id)
      .single()

    if (habitError || !habit) {
      return NextResponse.json(
        { error: "Habitude introuvable" },
        { status: 404 }
      )
    }

    // --------------------------
    // 2) Récupérer activité
    // --------------------------
    let activity: ActivityEntry[] = []
    try {
      activity = await fetchRecentActivity({
        supabase,
        habitId,
        userId: user.id,
        trackingMode: habit.tracking_mode,
      })
    } catch {
      return NextResponse.json(
        { error: "Impossible de récupérer les logs" },
        { status: 500 }
      )
    }

    const stats = normalizeStats(incomingStats)

    // --------------------------
    // 3) Construire le prompt IA
    // --------------------------
    const prompt = buildCoachPrompt({
      habit,
      tone,
      focus,
      stats,
      activity: activity.slice(0, MAX_ACTIVITY_ENTRIES),
    })

    // --------------------------
    // 4) Envoyer à Ollama
    // --------------------------
    let aiResponse: string
    try {
      aiResponse = await fetchAI(prompt)
    } catch (error) {
      console.error("Erreur fetchAI:", error)
      
      // Gérer les erreurs réseau spécifiques
      const errorMessage = error instanceof Error ? error.message : "unknown"
      if (errorMessage.includes("ECONNRESET") || errorMessage.includes("SocketError")) {
        return NextResponse.json(
          {
            error: "Erreur de connexion réseau avec le serveur IA",
            details: "La connexion a été interrompue. Réessayez dans quelques secondes.",
          },
          { status: 503 } // Service Unavailable
        )
      }
      
      return NextResponse.json(
        {
          error: "Erreur lors de l'appel à l'IA",
          details: errorMessage,
        },
        { status: 500 }
      )
    }

    // --------------------------
    // 5) Parser et valider la réponse JSON
    // --------------------------
    let parsedResult: CoachResult
    try {
      // Nettoyer la réponse : retirer markdown, backticks, etc.
      let cleanedResponse = aiResponse
        .replace(/```json\s*/gi, "") // Retirer ```json
        .replace(/```\s*/g, "") // Retirer ```
        .trim()

      // Extraire le JSON (peut contenir du texte avant/après)
      // Chercher le premier { et le dernier } pour capturer le JSON même s'il est tronqué
      const firstBrace = cleanedResponse.indexOf('{')
      const lastBrace = cleanedResponse.lastIndexOf('}')
      
      if (firstBrace === -1) {
        throw new Error("Aucun JSON trouvé dans la réponse IA (pas d'accolade ouvrante)")
      }
      
      // Si pas de } fermante, la réponse est tronquée - on essaie de récupérer ce qu'on peut
      let jsonMatch: RegExpMatchArray | null = null
      if (lastBrace > firstBrace) {
        jsonMatch = [cleanedResponse.substring(firstBrace, lastBrace + 1)]
      } else {
        // Réponse tronquée, on prend ce qu'on peut
        jsonMatch = [cleanedResponse.substring(firstBrace)]
        console.warn("[coach] Réponse IA tronquée, tentative de récupération partielle")
      }
      
      if (!jsonMatch || !jsonMatch[0]) {
        throw new Error("Aucun JSON trouvé dans la réponse IA")
      }

      let jsonString = jsonMatch[0]

      // Si plusieurs objets JSON séparés, les fusionner ou prendre le premier
      if (jsonString.includes('}{') || jsonString.match(/\}\s*\{/g)) {
        console.warn("[coach] Plusieurs objets JSON détectés, tentative de fusion...")
        // Extraire tous les objets
        const objects = jsonString.split(/\}\s*\{/).map((obj, idx, arr) => {
          if (idx === 0) return obj + '}'
          if (idx === arr.length - 1) return '{' + obj
          return '{' + obj + '}'
        })
        
        // Fusionner les objets en un seul (prendre les champs de tous)
        let merged = '{'
        const allFields = new Set<string>()
        for (const obj of objects) {
          // Extraire les champs de chaque objet
          const fields = obj.match(/(?:["']?(\w+)["']?\s*:)/g) || []
          for (const field of fields) {
            const fieldName = field.replace(/["']?\s*:/g, '')
            if (!allFields.has(fieldName)) {
              allFields.add(fieldName)
              // Extraire la valeur du champ
              const valueMatch = obj.match(new RegExp(`${field.replace(/[:"']/g, '\\$&')}\\s*:\\s*([^,}]+)`, 'i'))
              if (valueMatch) {
                merged += (merged !== '{' ? ', ' : '') + `"${fieldName}": ${valueMatch[1]}`
              }
            }
          }
        }
        merged += '}'
        jsonString = merged
      }

      // Retirer les commentaires JSON (// et /* */)
      jsonString = jsonString
        .replace(/\/\/.*$/gm, "") // Commentaires sur une ligne
        .replace(/\/\*[\s\S]*?\*\//g, "") // Commentaires multi-lignes
        .trim()

      // Protéger les apostrophes dans les mots (d'étude, l'analyse) AVANT de traiter les guillemets
      jsonString = jsonString.replace(/([a-zA-Z])'([a-zA-Z])/g, "$1__APOSTROPHE__$2")
      
      // Protéger les guillemets doubles littéraux dans les strings avec guillemets simples
      // On parcourt caractère par caractère pour détecter correctement les strings
      let protectedString = ""
      let inSingleQuote = false
      let inDoubleQuote = false
      let escapeNext = false
      
      for (let i = 0; i < jsonString.length; i++) {
        const char = jsonString[i]
        const nextChar = i < jsonString.length - 1 ? jsonString[i + 1] : ""
        
        if (escapeNext) {
          protectedString += char
          escapeNext = false
          continue
        }
        
        if (char === "\\") {
          escapeNext = true
          protectedString += char
          continue
        }
        
        if (char === "'" && !inDoubleQuote) {
          inSingleQuote = !inSingleQuote
          protectedString += char
        } else if (char === '"' && !inSingleQuote) {
          inDoubleQuote = !inDoubleQuote
          protectedString += char
        } else if (char === '"' && inSingleQuote) {
          // Guillemet double littéral dans une string avec guillemets simples
          protectedString += "__QUOTE__"
        } else {
          protectedString += char
        }
      }
      
      jsonString = protectedString
      
      // Ajouter des guillemets aux clés non-quotées
      jsonString = jsonString
        .replace(/([{,]\s*)(\w+)(\s*):/g, '$1"$2"$3:')
        
      // Convertir les guillemets simples en guillemets doubles (pour les strings)
      jsonString = jsonString
        .replace(/:\s*'([^']*)'/g, ': "$1"') // Pattern : 'texte'
        .replace(/,\s*'([^']*)'/g, ', "$1"') // Pattern , 'texte'
        .replace(/\['([^']*)'\]/g, '["$1"]') // Pattern ['texte']
        .replace(/"\s*:\s*'([^']*)'/g, '": "$1"') // Pattern "key": 'value'
        .replace(/'([^']*)':/g, '"$1":') // Pattern 'key':
        
      // Restaurer les guillemets doubles protégés (en les échappant)
      jsonString = jsonString.replace(/__QUOTE__/g, '\\"')
      
      // Restaurer les apostrophes dans les mots
      jsonString = jsonString.replace(/__APOSTROPHE__/g, "'")
      
      // Nettoyer les espaces multiples mais garder ceux dans les strings
      jsonString = jsonString.replace(/\s+/g, ' ')

      // Si le JSON semble tronqué, essayer de le fermer
      const openBraces = (jsonString.match(/\{/g) || []).length
      const closeBraces = (jsonString.match(/\}/g) || []).length
      if (openBraces > closeBraces) {
        // JSON tronqué, essayer de le fermer proprement
        // Chercher le dernier champ valide avant la troncature
        const lastColon = jsonString.lastIndexOf(":")
        if (lastColon > -1) {
          const afterColon = jsonString.substring(lastColon + 1).trim()
          // Si c'est une valeur incomplète, retirer tout après le dernier champ complet
          const lastCompleteField = jsonString.lastIndexOf('",')
          if (lastCompleteField > -1) {
            jsonString = jsonString.substring(0, lastCompleteField + 1)
          }
        }
        // Ajouter les accolades manquantes
        jsonString += "}".repeat(openBraces - closeBraces)
      }

      // Essayer de parser, si ça échoue, essayer une approche plus permissive
      try {
        parsedResult = JSON.parse(jsonString)
      } catch (parseError) {
        // Si le parsing échoue, essayer de réparer les problèmes communs
        console.warn("[coach] Premier essai de parsing échoué, tentative de réparation...")
        
        // Retirer les virgules en fin de ligne avant }
        jsonString = jsonString.replace(/,\s*}/g, ' }')
        jsonString = jsonString.replace(/,\s*]/g, ' ]')
        
        // Essayer de nouveau
        try {
          parsedResult = JSON.parse(jsonString)
        } catch (secondError) {
          // Si ça échoue encore, extraire manuellement les champs essentiels avec regex
          console.warn("[coach] Parsing JSON échoué, extraction manuelle des champs...")
          console.warn("[coach] JSON problématique:", jsonString.substring(0, 200))
          
          // Extraction manuelle avec regex permissives
          const extractField = (fieldName: string): string => {
            // Chercher le champ avec différents patterns
            const patterns = [
              new RegExp(`"${fieldName}"\\s*:\\s*"([^"]*)"`, 'i'),
              new RegExp(`'${fieldName}'\\s*:\\s*"([^"]*)"`, 'i'),
              new RegExp(`"${fieldName}"\\s*:\\s*'([^']*)'`, 'i'),
              new RegExp(`'${fieldName}'\\s*:\\s*'([^']*)'`, 'i'),
              new RegExp(`${fieldName}\\s*:\\s*"([^"]*)"`, 'i'),
              new RegExp(`${fieldName}\\s*:\\s*'([^']*)'`, 'i'),
            ]
            
            for (const pattern of patterns) {
              const match = jsonString.match(pattern)
              if (match && match[1]) {
                return match[1].trim()
              }
            }
            return ""
          }
          
          const extractNumber = (fieldName: string): number => {
            const patterns = [
              new RegExp(`"${fieldName}"\\s*:\\s*(\\d+(?:\\.\\d+)?)`, 'i'),
              new RegExp(`'${fieldName}'\\s*:\\s*(\\d+(?:\\.\\d+)?)`, 'i'),
              new RegExp(`${fieldName}\\s*:\\s*(\\d+(?:\\.\\d+)?)`, 'i'),
            ]
            
            for (const pattern of patterns) {
              const match = jsonString.match(pattern)
              if (match && match[1]) {
                const num = parseFloat(match[1])
                if (!isNaN(num)) return num
              }
            }
            return 0.5
          }
          
          // Extraire les champs manuellement
          const manualResult: any = {
            summary: extractField("summary") || "Analyse en cours...",
            analysis: extractField("analysis") || "Analyse détaillée...",
            patterns: extractField("patterns") || "Patterns observés...",
            advice: extractField("advice") || "Conseils à venir...",
            risk_score: extractNumber("risk_score"),
          }
          
          // Si on a au moins un champ, utiliser le résultat manuel
          if (manualResult.summary || manualResult.analysis || manualResult.patterns || manualResult.advice) {
            parsedResult = manualResult
            console.warn("[coach] Extraction manuelle réussie")
          } else {
            throw new Error(`Impossible de parser le JSON et extraction manuelle échouée : ${secondError instanceof Error ? secondError.message : 'unknown'}`)
          }
        }
      }

      // Normaliser la structure : l'IA peut retourner des structures variées
      const normalized: CoachResult = {
        summary: typeof parsedResult.summary === "string" 
          ? parsedResult.summary.trim()
          : String(parsedResult.summary || "Analyse en cours..."),
        analysis: typeof parsedResult.analysis === "string"
          ? parsedResult.analysis.trim()
          : typeof parsedResult.analysis === "object"
          ? JSON.stringify(parsedResult.analysis, null, 2)
          : String(parsedResult.analysis || "Analyse détaillée..."),
        patterns: typeof parsedResult.patterns === "string"
          ? parsedResult.patterns.trim()
          : typeof parsedResult.patterns === "object"
          ? Array.isArray(parsedResult.patterns)
          ? parsedResult.patterns.map((p: any) => typeof p === "string" ? p : JSON.stringify(p)).join(", ")
          : JSON.stringify(parsedResult.patterns, null, 2)
          : String(parsedResult.patterns || "Patterns observés..."),
        advice: typeof parsedResult.advice === "string"
          ? parsedResult.advice.trim()
          : String(parsedResult.advice || "Conseils à venir..."),
        risk_score: typeof parsedResult.risk_score === "number"
          ? parsedResult.risk_score
          : typeof parsedResult.risk_score === "string"
          ? parseFloat(parsedResult.risk_score) || 0.5
          : 0.5,
      }

      // Valider que les champs essentiels ne sont pas vides
      if (!normalized.summary || !normalized.analysis || !normalized.patterns || !normalized.advice) {
        throw new Error("Structure JSON incomplète")
      }

      // Normaliser risk_score entre 0 et 1
      normalized.risk_score = Math.max(0, Math.min(1, normalized.risk_score))
      
      parsedResult = normalized
    } catch (error) {
      console.error("Erreur parsing JSON:", error)
      console.error("Réponse IA brute:", aiResponse.substring(0, 500))
      return NextResponse.json(
        {
          error: "Réponse IA invalide",
          details: error instanceof Error ? error.message : "unknown",
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      result: parsedResult,
      habit: {
        id: habit.id,
        name: habit.name,
        type: habit.type,
      },
      stats,
      activity,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Erreur interne API Coach",
        details: error instanceof Error ? error.message : "unknown",
      },
      { status: 500 }
    )
  }
}

// -------------------------------------------------
// UTILITAIRES
// -------------------------------------------------

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
      .limit(LOOKBACK_DAYS * 4)

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
    .limit(LOOKBACK_DAYS * 2)

  if (error) throw new Error(error.message)
  return aggregateLogRows(data || [])
}

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

function normalizeStats(stats?: Partial<CoachStatsPayload>): CoachStatsPayload {
  return {
    totalCount: Number(stats?.totalCount) || 0,
    last7DaysCount: Number(stats?.last7DaysCount) || 0,
    currentStreak: Number(stats?.currentStreak) || 0,
    todayCount: Number(stats?.todayCount) || 0,
    monthPercentage: Number(stats?.monthPercentage) || 0,
  }
}

function describeTone(tone: CoachTone) {
  switch (tone) {
    case "gentle":
      return "Ton doux, rassurant."
    case "direct":
      return "Ton cash et orienté résultats."
    case "aggressive":
      return "Style agressif, motivation extrême type David Goggins."
    default:
      return "Ton équilibré."
  }
}

function describeFocus(focus: CoachFocus) {
  switch (focus) {
    case "strategy":
      return "Conseils concrets et plans d'action."
    case "celebration":
      return "Met l’accent sur les progrès accomplis."
    default:
      return "Concentré sur le Mindset."
  }
}

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
  // Limiter l'activité à 5 entrées max pour prompt ultra-court
  const limitedActivity = activity.slice(0, 5)
  
  // Format ultra-compact : seulement les dates récentes avec count
  const activityCompact = limitedActivity.length > 0
    ? limitedActivity.map(a => `${a.date.split('-')[2]}:${a.count}`).join(',') // Format: "16:3,15:2"
    : 'aucune'
  
  // Calculer des indicateurs clés pour réduire les stats
  const streakStatus = stats.currentStreak > 0 ? `+${stats.currentStreak}` : '0'
  const monthStatus = stats.monthPercentage > 50 ? 'OK' : stats.monthPercentage > 25 ? 'FAIBLE' : 'CRITIQUE'
  
  return `Coach expert. JSON uniquement, sans texte avant/après, sans commentaires.

Habit: ${habit.name} (${habit.type})
Ton: ${tone.substring(0, 3)} | Focus: ${focus.substring(0, 3)}
Stats: ${stats.totalCount} total, ${stats.last7DaysCount}/7j, ${streakStatus} streak, ${monthStatus}
Act: ${activityCompact}

JSON (remplace "..." par réponses courtes, max 50 mots/champ):
{"summary":"...","analysis":"...","patterns":"...","risk_score":0.5,"advice":"..."}

Règles: strings uniquement (pas d'objets), risk_score 0-1 (nombre), JSON valide.`
}

