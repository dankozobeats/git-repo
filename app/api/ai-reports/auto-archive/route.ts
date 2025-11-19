import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()

  const threshold = new Date()
  threshold.setDate(threshold.getDate() - 30)

  await supabase
    .from("ai_reports")
    .update({ archived_at: new Date().toISOString() })
    .lte("created_at", threshold.toISOString())
    .is("archived_at", null)

  return NextResponse.json({ success: true })
}

