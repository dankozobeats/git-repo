'use client'

/**
 * Onglet Récap - Preview + checklist SMART + boutons d'action
 */

import { Check, X } from 'lucide-react'
import Link from 'next/link'

type SummaryTabProps = {
  mode: 'create' | 'edit'
  habitType: 'good' | 'bad'
  name: string
  icon: string
  color: string
  description: string
  trackingMode: 'binary' | 'counter'
  dailyGoalValue: number
  categoryId: string
  vagueKeywords: string[]
  isLoading: boolean
  onSubmit: () => void
}

export default function SummaryTab({
  mode,
  habitType,
  name,
  icon,
  color,
  description,
  trackingMode,
  dailyGoalValue,
  categoryId,
  vagueKeywords,
  isLoading,
  onSubmit,
}: SummaryTabProps) {
  const trimmedName = name.trim()
  const trimmedDescription = description.trim()

  // SMART Checklist validation
  const checks = {
    nameLength: trimmedName.length >= 4,
    nameNotVague: !vagueKeywords.some(keyword => trimmedName.toLowerCase().includes(keyword)),
    trackingDefined: trackingMode === 'binary' || trackingMode === 'counter',
    descriptionEnough: trackingMode === 'binary' ? trimmedDescription.length >= 10 : true,
    goalValid: trackingMode === 'counter' ? dailyGoalValue >= 1 && dailyGoalValue <= 20 : true,
    categorySet: categoryId.length > 0,
  }

  const allValid = Object.values(checks).every(Boolean)

  return (
    <div className="space-y-6 p-6">
      {/* Preview Card */}
      <div className="space-y-3">
        <h3 className="text-xs uppercase tracking-[0.35em] text-white/60">
          Aperçu
        </h3>
        <div
          className="rounded-2xl border p-5 shadow-lg"
          style={{
            backgroundColor: `${color}10`,
            borderColor: `${color}40`,
          }}
        >
          <div className="flex items-start gap-4">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border text-3xl"
              style={{
                backgroundColor: `${color}15`,
                borderColor: `${color}30`,
              }}
            >
              {icon || (habitType === 'bad' ? '🔥' : '✨')}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="rounded-full px-3 py-0.5 text-xs font-semibold"
                  style={{ backgroundColor: `${color}20`, color: `${color}` }}
                >
                  {habitType === 'bad' ? 'Mauvaise' : 'Bonne'}
                </span>
                {trackingMode === 'counter' && (
                  <span className="rounded-full border border-white/10 px-3 py-0.5 text-xs text-white/70">
                    Compteur
                  </span>
                )}
              </div>
              <h4 className="text-lg font-semibold text-white">
                {name || 'Nom de l\'habitude'}
              </h4>
              {description && (
                <p className="mt-2 text-sm text-white/60 line-clamp-2">{description}</p>
              )}
              {trackingMode === 'counter' && dailyGoalValue > 0 && (
                <p className="mt-2 text-xs text-white/50">
                  Objectif: {dailyGoalValue} fois/{habitType === 'good' ? 'minimum' : 'maximum'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SMART Checklist */}
      <div className="space-y-3">
        <h3 className="text-xs uppercase tracking-[0.35em] text-white/60">
          Checklist SMART
        </h3>
        <div className="rounded-2xl border border-white/10 bg-black/30 p-5 space-y-2">
          <CheckItem
            valid={checks.nameLength}
            label="Nom précis (minimum 4 caractères)"
          />
          <CheckItem
            valid={checks.nameNotVague}
            label="Nom sans mots vagues (habitude, truc, chose...)"
          />
          <CheckItem
            valid={checks.trackingDefined}
            label="Mode de suivi défini (Binary ou Counter)"
          />
          {trackingMode === 'binary' && (
            <CheckItem
              valid={checks.descriptionEnough}
              label="Description claire (minimum 10 caractères)"
            />
          )}
          {trackingMode === 'counter' && (
            <CheckItem
              valid={checks.goalValid}
              label="Objectif mesurable (entre 1 et 20)"
            />
          )}
          <CheckItem
            valid={checks.categorySet}
            label="Catégorie assignée"
          />
        </div>

        {!allValid && (
          <div className="rounded-xl bg-orange-500/10 border border-orange-500/20 p-4 text-sm text-orange-300">
            ⚠️ Certains critères SMART ne sont pas remplis. Retourne aux onglets précédents pour compléter.
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/"
          className="flex-1 rounded-2xl border border-white/10 bg-black/30 px-6 py-3 text-center text-sm font-semibold text-white/70 transition hover:border-white/30 hover:text-white"
        >
          Annuler
        </Link>
        <button
          type="button"
          onClick={onSubmit}
          disabled={isLoading || !allValid}
          className="flex-1 rounded-2xl bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 px-6 py-3 text-center text-sm font-semibold text-white shadow-[0_20px_60px_rgba(168,85,247,0.45)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isLoading ? 'Enregistrement...' : mode === 'create' ? 'Créer cette habitude' : 'Sauvegarder les modifications'}
        </button>
      </div>
    </div>
  )
}

function CheckItem({ valid, label }: { valid: boolean; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
          valid ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
        }`}
      >
        {valid ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
      </div>
      <p className={`text-sm ${valid ? 'text-white/80' : 'text-white/50'}`}>{label}</p>
    </div>
  )
}
