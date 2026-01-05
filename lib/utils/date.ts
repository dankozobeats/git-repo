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

/**
 * Formate le temps écoulé depuis une date/heure avec précision
 *
 * Exemples:
 * - < 1h: "Pas fait depuis 30 min"
 * - < 24h: "Pas fait depuis 10h"
 * - 1-2j: "Pas fait depuis 1j 5h"
 * - > 2j: "Pas fait depuis 3j 12h"
 *
 * @param lastDateTime - ISO string de la dernière action (ex: "2026-01-04T14:30:00")
 * @param prefix - Préfixe à ajouter (défaut: "Pas fait depuis")
 */
export function formatTimeSince(lastDateTime: string, prefix: string = 'Pas fait depuis'): string {
  const last = new Date(lastDateTime)
  const now = new Date()
  const diffMs = now.getTime() - last.getTime()
  const diffMinutes = Math.floor(diffMs / (60 * 1000))
  const diffHours = Math.floor(diffMs / (60 * 60 * 1000))
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000))

  // Moins d'une heure
  if (diffHours < 1) {
    if (diffMinutes < 1) return `${prefix} à l'instant`
    return `${prefix} ${diffMinutes} min`
  }

  // Moins de 24 heures
  if (diffHours < 24) {
    return `${prefix} ${diffHours}h`
  }

  // 1 jour ou plus : afficher jours + heures restantes
  const remainingHours = diffHours - (diffDays * 24)
  if (remainingHours === 0) {
    return `${prefix} ${diffDays}j`
  }
  return `${prefix} ${diffDays}j ${remainingHours}h`
}

/**
 * Calcule le temps écoulé depuis une date (sans heure précise, on prend minuit)
 * Utilisé pour les dates stockées en YYYY-MM-DD uniquement
 *
 * @param lastDate - Date au format YYYY-MM-DD
 * @param prefix - Préfixe à ajouter
 */
export function formatDaysSince(lastDate: string, prefix: string = 'Pas fait depuis'): string {
  // Pour une date sans heure, on considère minuit du jour
  const last = new Date(lastDate + 'T00:00:00')
  const now = new Date()
  const diffMs = now.getTime() - last.getTime()
  const diffHours = Math.floor(diffMs / (60 * 60 * 1000))
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000))

  // Même jour
  if (diffDays === 0) {
    if (diffHours === 0) return `${prefix} à l'instant`
    return `${prefix} ${diffHours}h`
  }

  // 1 jour ou plus
  const remainingHours = diffHours - (diffDays * 24)
  if (remainingHours === 0) {
    return `${prefix} ${diffDays}j`
  }
  return `${prefix} ${diffDays}j ${remainingHours}h`
}

/**
 * Formate une date/heure en format lisible français
 *
 * Exemples:
 * - Aujourd'hui : "Aujourd'hui à 14h35"
 * - Hier : "Hier à 09h20"
 * - Cette semaine : "Lun 3 jan à 18h45"
 * - Plus ancien : "15 déc 2025 à 10h30"
 *
 * @param dateTimeString - ISO string avec date et heure (ex: "2026-01-05T14:35:22.000Z")
 * @param prefix - Préfixe optionnel (ex: "Dernière validation :")
 */
export function formatDateTime(dateTimeString: string, prefix?: string): string {
  const date = new Date(dateTimeString)
  const now = new Date()

  // Calculer la différence en jours
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const targetDay = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffDays = Math.floor((today.getTime() - targetDay.getTime()) / (24 * 60 * 60 * 1000))

  // Formater l'heure
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const timeStr = `${hours}h${minutes}`

  let dateStr = ''

  if (diffDays === 0) {
    // Aujourd'hui
    dateStr = `Aujourd'hui à ${timeStr}`
  } else if (diffDays === 1) {
    // Hier
    dateStr = `Hier à ${timeStr}`
  } else if (diffDays < 7) {
    // Cette semaine - afficher jour de la semaine
    const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
    const dayName = dayNames[date.getDay()]
    const day = date.getDate()
    const monthNames = ['jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'juil', 'août', 'sep', 'oct', 'nov', 'déc']
    const month = monthNames[date.getMonth()]
    dateStr = `${dayName} ${day} ${month} à ${timeStr}`
  } else {
    // Plus ancien - date complète
    const day = date.getDate()
    const monthNames = ['jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'juil', 'août', 'sep', 'oct', 'nov', 'déc']
    const month = monthNames[date.getMonth()]
    const year = date.getFullYear()
    const currentYear = now.getFullYear()

    if (year === currentYear) {
      dateStr = `${day} ${month} à ${timeStr}`
    } else {
      dateStr = `${day} ${month} ${year} à ${timeStr}`
    }
  }

  return prefix ? `${prefix} ${dateStr}` : dateStr
}
