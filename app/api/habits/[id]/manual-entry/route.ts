import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { checkRateLimit } from "@/lib/api/ratelimit"
import { z } from "zod"

type RouteContext = { params: Promise<{ id: string }> }

const IdSchema = z.string().uuid()

const ManualEntrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  value: z.number().int().min(1).optional().default(1),
})

const resolveCounterRequirement = (
  trackingMode: "binary" | "counter" | null,
  dailyGoal: number | null
) => {
  if (trackingMode === "counter" && typeof dailyGoal === "number" && dailyGoal > 0) {
    return dailyGoal
  }
  return 1
}

/**
 * POST /api/habits/[id]/manual-entry
 * Permet d'ajouter une entrée pour une date passée ou future
 */
export async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  const rateLimit = await checkRateLimit(request, "WRITE")
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests", retryAfter: rateLimit.reset },
      { status: 429, headers: { "Retry-After": rateLimit.reset.toString() } }
    )
  }

  const { id: habitId } = await params

  if (!IdSchema.safeParse(habitId).success) {
    return NextResponse.json({ error: "ID invalide" }, { status: 400 })
  }

  // Valider le body
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Body JSON invalide" }, { status: 400 })
  }

  const validation = ManualEntrySchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json(
      { error: "Données invalides", details: validation.error.issues },
      { status: 400 }
    )
  }

  const { date, time, value } = validation.data

  // Construire le timestamp occurred_at
  const occurredAt = time
    ? new Date(`${date}T${time}:00`).toISOString()
    : new Date(`${date}T12:00:00`).toISOString()

  const supabase = await createClient()
  const { data: auth, error: authError } = await supabase.auth.getUser()

  if (authError || !auth?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  }

  const user = auth.user

  // Récupérer l'habitude
  const { data: habit, error: habitError } = await supabase
    .from("habits")
    .select("id, type, tracking_mode, goal_value, daily_goal_value")
    .eq("id", habitId)
    .eq("user_id", user.id)
    .single()

  if (habitError || !habit) {
    return NextResponse.json({ error: "Habitude non trouvée" }, { status: 404 })
  }

  const isCounter = habit.tracking_mode === "counter"
  const usesEvents = habit.type === "bad" || isCounter
  const counterRequired = resolveCounterRequirement(
    habit.tracking_mode,
    habit.daily_goal_value
  )

  // Cas 1: Habitudes qui utilisent la table habit_events (bad habits ou counters)
  if (usesEvents) {
    // Pour les binaires (bad habits), vérifier qu'il n'existe pas déjà
    if (!isCounter) {
      const { data: existingEvent } = await supabase
        .from("habit_events")
        .select("id")
        .eq("habit_id", habitId)
        .eq("user_id", user.id)
        .eq("event_date", date)
        .maybeSingle()

      if (existingEvent) {
        return NextResponse.json(
          {
            success: false,
            error: "Une entrée existe déjà pour cette date",
          },
          { status: 400 }
        )
      }

      // Insérer l'événement
      const { error: insertError } = await supabase.from("habit_events").insert({
        habit_id: habitId,
        user_id: user.id,
        event_date: date,
        occurred_at: occurredAt,
      })

      if (insertError) {
        return NextResponse.json(
          { error: "Impossible d'enregistrer l'entrée" },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        count: 1,
        goalReached: true,
        counterRequired: 1,
        remaining: 0,
      })
    }

    // Pour les counters, vérifier le nombre actuel
    const { count: currentCount, error: preCheckError } = await supabase
      .from("habit_events")
      .select("id", { count: "exact", head: true })
      .eq("habit_id", habitId)
      .eq("user_id", user.id)
      .eq("event_date", date)

    if (preCheckError) {
      return NextResponse.json(
        { error: "Impossible de vérifier le compteur" },
        { status: 500 }
      )
    }

    const currentTotal = currentCount ?? 0
    const newTotal = currentTotal + value

    // Vérifier si on dépasse l'objectif
    if (newTotal > counterRequired) {
      return NextResponse.json(
        {
          success: false,
          error: `L'ajout de ${value} dépasserait l'objectif (${currentTotal}/${counterRequired})`,
          count: currentTotal,
          goalReached: currentTotal >= counterRequired,
          counterRequired,
          remaining: Math.max(0, counterRequired - currentTotal),
        },
        { status: 400 }
      )
    }

    // Insérer les événements (un par unité)
    const eventsToInsert = Array.from({ length: value }, () => ({
      habit_id: habitId,
      user_id: user.id,
      event_date: date,
      occurred_at: occurredAt,
    }))

    const { error: insertError } = await supabase
      .from("habit_events")
      .insert(eventsToInsert)

    if (insertError) {
      return NextResponse.json(
        { error: "Impossible d'enregistrer les entrées" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      count: newTotal,
      goalReached: newTotal >= counterRequired,
      counterRequired,
      remaining: Math.max(0, counterRequired - newTotal),
    })
  }

  // Cas 2: Habitudes binaires "good" qui utilisent la table logs
  const { data: existingLog } = await supabase
    .from("logs")
    .select("id")
    .eq("habit_id", habitId)
    .eq("user_id", user.id)
    .eq("completed_date", date)
    .maybeSingle()

  if (existingLog) {
    return NextResponse.json(
      {
        success: false,
        error: "Une entrée existe déjà pour cette date",
      },
      { status: 400 }
    )
  }

  const { error: insertError } = await supabase.from("logs").insert({
    habit_id: habitId,
    user_id: user.id,
    completed_date: date,
    value: 1,
    notes: null,
  })

  if (insertError) {
    return NextResponse.json(
      { error: "Impossible d'enregistrer l'entrée" },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    count: 1,
    goalReached: true,
    counterRequired,
    remaining: 0,
  })
}
