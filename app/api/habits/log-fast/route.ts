import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { getTodayDateISO } from "@/lib/date-utils"
import { z } from "zod"

const RequestSchema = z.object({ habitId: z.string().uuid() })

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { habitId } = RequestSchema.parse(body)
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const { data: habit } = await supabase.from("habits").select("id, type, tracking_mode").eq("id", habitId).eq("user_id", user.id).single()
        if (!habit) return NextResponse.json({ error: "Not found" }, { status: 404 })

        const date = getTodayDateISO()
        if (habit.type === "bad" || habit.tracking_mode === "counter") {
            await supabase.from("habit_events").insert({
                habit_id: habitId,
                user_id: user.id,
                event_date: date,
                occurred_at: new Date().toISOString()
            })
        } else {
            await supabase.from("logs").upsert({
                habit_id: habitId,
                user_id: user.id,
                completed_date: date,
                value: 1
            }, { onConflict: "habit_id,completed_date" })
        }
        return NextResponse.json({ success: true })
    } catch (err) {
        console.error("log-fast error:", err)
        return NextResponse.json({ error: "Error" }, { status: 500 })
    }
}
