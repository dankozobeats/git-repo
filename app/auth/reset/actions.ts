'use server'

import { createClient } from '@/lib/supabase/server'

export type FormState = {
  error?: string
  success?: string
}

export const initialState: FormState = {}

export async function resetAction(_: FormState, formData: FormData): Promise<FormState> {
  const email = formData.get('email')?.toString().trim() ?? ''

  if (!email) {
    return { error: 'Email requis.' }
  }

  const supabase = await createClient()
  const redirectTo =
    process.env.NEXT_PUBLIC_SUPABASE_REDIRECT_URL ||
    `${process.env.NEXT_PUBLIC_SITE_URL}/auth/update-password`

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: 'Un email de réinitialisation vient de t’être envoyé.' }
}
