import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET: liste des rappels de l'utilisateur
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const { data, error } = await supabase
    .from("reminders")
    .select("id, habit_id, channel, schedule, time_local, weekday, active")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ reminders: data || [] })
}

// POST: créer/mettre à jour un rappel pour une habitude
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: "Payload invalide" }, { status: 400 })

  const { habitId, channel, schedule, timeLocal, weekday, active = true } = body
  if (!habitId || !channel || !schedule || !timeLocal) {
    return NextResponse.json({ error: "Champs requis: habitId, channel, schedule, timeLocal" }, { status: 400 })
  }

  const upsert = {
    user_id: user.id,
    habit_id: habitId,
    channel,
    schedule,
    time_local: timeLocal,
    weekday: weekday ?? null,
    active,
  }

  const { data, error } = await supabase
    .from("reminders")
    .upsert(upsert, { onConflict: "user_id,habit_id,channel" })
    .select("id")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, id: data?.id })
}
