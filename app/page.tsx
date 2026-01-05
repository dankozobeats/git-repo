/**
 * Dashboard principal - Redirige vers le dashboard approprié selon préférence
 * Par défaut: dashboard classique (/dashboard-old)
 */

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardRedirect from '@/components/dashboard/DashboardRedirect'

export default async function Home() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return <DashboardRedirect />
}
