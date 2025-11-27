/**
 * Description: Utilitaires partagés pour normaliser et formatter les dates côté client.
 * Objectif: Centraliser les conversions ISO et affichages humains cohérents dans toute l'app.
 * Utilisation: Importer { formatDateKey, formatDateHuman } depuis '@/lib/date-utils' dans composants/hooks.
 */
export type FormatDateHumanOptions = {
  includeTime?: boolean
  timeOnly?: boolean
}

/**
 * Description: Génère une clé date AAAA-MM-JJ stable pour les regroupements.
 * Objectif: Réduire les duplications dans les hooks manipulant des séries temporelles.
 * Utilisation: const key = formatDateKey(report.created_at)
 */
export function formatDateKey(date: string | Date) {
  const value = date instanceof Date ? date : new Date(date)
  return value.toISOString().split('T')[0]
}

/**
 * Description: Produit une version lisible d'une date selon les besoins.
 * Objectif: Garantir une apparence homogène (locale fr-FR) des labels temporels.
 * Utilisation: formatDateHuman(new Date(), { includeTime: true })
 */
export function formatDateHuman(date: string | Date, options: FormatDateHumanOptions = {}) {
  const value = date instanceof Date ? date : new Date(date)
  const locale = 'fr-FR'

  if (options.timeOnly) {
    return value.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
  }

  const datePart = value.toLocaleDateString(locale, {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  })

  if (options.includeTime) {
    const timePart = value.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
    return `${datePart} · ${timePart}`
  }

  return datePart
}

/**
 * Description: Retourne l'ISO string AAAA-MM-JJ de la date du jour en local time.
 * Objectif: Simplifier l'accès au jour courant sans répéter la logique Date partout.
 * Utilisation: const today = getTodayDateISO()
 */
export function getTodayDateISO() {
  return formatDateKey(new Date())
}

/**
 * Description: Indique si une date est strictement dans le futur (comparaison jour calendrier).
 * Objectif: Empêcher les interactions sur des jours non commencés dans les calendriers hebdo/mensuels.
 * Utilisation: const disabled = isFutureDate(dateString)
 */
export function isFutureDate(date: string | Date) {
  const candidate = date instanceof Date ? date : new Date(date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const normalized = new Date(candidate)
  normalized.setHours(0, 0, 0, 0)
  return normalized.getTime() > today.getTime()
}

/**
 * Description: Convertit une date arbitraire vers un objet Date normalisé UTC (00:00).
 * Objectif: Offrir un référentiel unique pour les calculs statistiques côté client/serveur.
 * Utilisation: const utc = toUtcDate(dateString)
 */
export function toUtcDate(date: string | Date) {
  const value = date instanceof Date ? date : new Date(date)
  return new Date(Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()))
}
