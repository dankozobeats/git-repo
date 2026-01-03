import { cookies } from 'next/headers'

export type DashboardVersion = 'mobile' | 'classic'

/**
 * Récupère la préférence de version du dashboard depuis les cookies
 * Fallback: 'mobile' par défaut
 */
export async function getDashboardVersion(): Promise<DashboardVersion> {
  const cookieStore = await cookies()
  const version = cookieStore.get('dashboard_version')?.value as DashboardVersion | undefined
  return version || 'mobile'
}
