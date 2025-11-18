import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  try {
    await supabase.auth.signOut()
  } catch (error) {
    console.error('[auth/signout]', error)
  }

  const redirectUrl = new URL('/login', request.url)
  return NextResponse.redirect(redirectUrl, { status: 302 })
}
