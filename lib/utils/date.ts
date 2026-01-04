/**
 * Utilitaires de gestion des dates en timezone locale
 *
 * IMPORTANT: Utiliser ces fonctions au lieu de .toISOString().split('T')[0]
 * pour éviter les problèmes de timezone (UTC vs local)
 */

import { formatDateKey, getTodayDateISO } from '@/lib/date-utils'

/**
 * Retourne la date locale au format YYYY-MM-DD
 * Exemple: Si on est le 5 janvier 2026 à 00h42 CET (UTC+1),
 * cette fonction retourne '2026-01-05' au lieu de '2026-01-04'
 */
export function getLocalDate(date: Date = new Date()): string {
  return formatDateKey(date)
}

/**
 * Retourne la date locale il y a N jours
 */
export function getLocalDateDaysAgo(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return getLocalDate(date)
}
