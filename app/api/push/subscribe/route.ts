import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Enregistre une subscription Web Push pour l'utilisateur courant
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: "Payload invalide" }, { status: 400 })

  const { endpoint, keys } = body || {}
  const p256dh = keys?.p256dh
  const auth = keys?.auth
  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: "Subscription manquante (endpoint, p256dh, auth)" }, { status: 400 })
  }

  const { error } = await supabase
    .from("push_subscriptions")
    .upsert({ user_id: user.id, endpoint, p256dh, auth }, { onConflict: "user_id,endpoint" })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
