'use client'

/**
 * Description: Modale destructive premium avec glassmorphism et animation douce.
 * Objectif: Rassurer avant suppression grâce à une hiérarchie claire et des CTA explicites.
 * Utilisation: <DeleteConfirmModal open={state} onConfirm={...} onCancel={...} />
 */
import { memo, useEffect, useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'

type DeleteConfirmModalProps = {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
}

function DeleteConfirmModalComponent({ open, onConfirm, onCancel }: DeleteConfirmModalProps) {
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    const frame = requestAnimationFrame(() => setEntered(open))
    return () => cancelAnimationFrame(frame)
  }, [open])

  if (!open) return null

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8 transition-opacity duration-300 ${
        entered ? 'opacity-100' : 'opacity-0'
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
    >
      <div
        className={`relative w-full max-w-lg rounded-[32px] border border-white/10 bg-white/5 p-7 text-white shadow-[0_35px_120px_rgba(3,4,8,0.65)] backdrop-blur-2xl transition-all duration-300 ${
          entered ? 'scale-100 translate-y-0 opacity-100' : 'scale-95 translate-y-4 opacity-0'
        }`}
      >
        <button
          type="button"
          onClick={onCancel}
          className="absolute right-4 top-4 rounded-full border border-white/10 bg-white/5 p-2 text-white/60 transition hover:text-white"
          aria-label="Fermer la modale de confirmation"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 text-red-300">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.4em] text-white/50">Confirmation</p>
            <h2 id="delete-modal-title" className="mt-1 text-2xl font-semibold text-white">
              Supprimer ce rapport ?
            </h2>
          </div>
        </div>

        <p className="mt-5 text-sm text-white/70">
          L’opération est définitive et retirera immédiatement le rapport de ton historique IA. Assure-toi d’avoir
          sauvegardé le contenu important avant de continuer.
        </p>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-2xl bg-gradient-to-r from-[#FF5E5B] to-[#FF3D71] px-4 py-3 text-sm font-semibold text-white shadow-[0_15px_45px_rgba(255,61,113,0.35)] transition hover:translate-y-0.5"
          >
            Supprimer définitivement
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white/85 transition hover:text-white"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  )
}

const DeleteConfirmModal = memo(DeleteConfirmModalComponent)
export default DeleteConfirmModal
