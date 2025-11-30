import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    return NextResponse.json({ ok: true, message: "Push test OK" })
  } catch (err) {
    console.error("test-push error:", err)
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 })
  }
}

