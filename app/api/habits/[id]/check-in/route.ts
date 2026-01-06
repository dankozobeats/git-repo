import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { getTodayDateISO } from "@/lib/date-utils"
import { checkRateLimit } from "@/lib/api/ratelimit"
import { z } from "zod"

type RouteContext = { params: Promise<{ id: string }> }

const getToday = () => getTodayDateISO()

const IdSchema = z.string().uuid()

const resolveCounterRequirement = (
  trackingMode: "binary" | "counter" | null,
  dailyGoal: number | null
) => {
  if (trackingMode === "counter" && typeof dailyGoal === "number" && dailyGoal > 0) {
    return dailyGoal
  }
  return 1
}

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

  const supabase = await createClient()
  const { data: auth, error: authError } = await supabase.auth.getUser()

  if (authError || !auth?.user) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 })
  }

  const user = auth.user

  const { data: habit, error: habitError } = await supabase
    .from("habits")
    .select("id, type, tracking_mode, goal_value, daily_goal_value")
    .eq("id", habitId)
    .eq("user_id", user.id)
    .single()

  if (habitError || !habit) {
    return NextResponse.json({ error: "Habitude non trouvee" }, { status: 404 })
  }

  const completedDate = getToday()
  const isCounter = habit.tracking_mode === "counter"
  const counterRequired = resolveCounterRequirement(
    habit.tracking_mode,
    habit.daily_goal_value
  )

  if (isCounter) {
    const { count: currentCount, error: preCheckError } = await supabase
      .from("habit_events")
      .select("id", { count: "exact", head: true })
      .eq("habit_id", habitId)
      .eq("user_id", user.id)
      .eq("event_date", completedDate)

    if (preCheckError) {
      return NextResponse.json(
        { error: "Impossible de verifier le compteur" },
        { status: 500 }
      )
    }

    if ((currentCount ?? 0) >= counterRequired) {
      return NextResponse.json(
        {
          success: false,
          error: "Objectif quotidien deja atteint",
          count: currentCount ?? 0,
          goalReached: true,
          counterRequired,
          remaining: 0,
        },
        { status: 400 }
      )
    }

    const { error: insertError } = await supabase.from("habit_events").insert({
      habit_id: habitId,
      user_id: user.id,
      event_date: completedDate,
      occurred_at: new Date().toISOString(),
    })

    if (insertError) {
      return NextResponse.json(
        { error: "Impossible d enregistrer le check-in" },
        { status: 500 }
      )
    }

    const { count: newCount } = await supabase
      .from("habit_events")
      .select("id", { count: "exact", head: true })
      .eq("habit_id", habitId)
      .eq("user_id", user.id)
      .eq("event_date", completedDate)

    const finalCount = newCount ?? 0

    return NextResponse.json({
      success: true,
      count: finalCount,
      goalReached: finalCount >= counterRequired,
      counterRequired,
      remaining: Math.max(0, counterRequired - finalCount),
    })
  }

  const { error: upsertError } = await supabase
    .from("logs")
    .upsert(
      {
        habit_id: habitId,
        user_id: user.id,
        completed_date: completedDate,
        value: 1,
        notes: null,
      },
      {
        onConflict: "habit_id,completed_date",
        ignoreDuplicates: true,
      }
    )

  if (upsertError) {
    return NextResponse.json(
      { error: "Impossible d enregistrer le check-in" },
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