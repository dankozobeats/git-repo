'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'

type DashboardHeaderProps = {
  email: string
  avatarInitial: string
}

export default function DashboardHeader({ email, avatarInitial }: DashboardHeaderProps) {
  const [open, setOpen] = useState(false)

  const closeMenu = () => setOpen(false)

  const actionButtons = (
    <>
      <Link
        href="/habits/new"
        className="w-full rounded-2xl bg-[#FF4D4D] px-4 py-3 text-center text-base font-semibold text-white transition hover:bg-[#e04343]"
        onClick={closeMenu}
      >
        + Nouvelle habitude
      </Link>
      <Link
        href="/report"
        className="w-full rounded-2xl border border-white/15 px-4 py-3 text-center text-base font-semibold text-white/90 transition hover:border-white/40 hover:text-white"
        onClick={closeMenu}
      >
        Rapport rapide
      </Link>
      <Link
        href="/habits/stats"
        className="w-full rounded-2xl border border-white/15 px-4 py-3 text-center text-base font-semibold text-white/90 transition hover:border-white/40 hover:text-white"
        onClick={closeMenu}
      >
        Stats détaillées
      </Link>
      <form action="/auth/signout" method="post" className="w-full">
        <button className="w-full rounded-2xl border border-white/15 px-4 py-3 text-base font-semibold text-white/90 transition hover:border-white/40 hover:text-white">
          Déconnexion
        </button>
      </form>
    </>
  )

  return (
    <header className="rounded-3xl border border-white/10 bg-[#11131c] p-4 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#4DA6FF]/20 text-2xl font-semibold text-white">
            {avatarInitial}
          </div>
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.35em] text-white/50">Tableau de bord</p>
            <h1 className="text-2xl font-bold text-white sm:text-3xl">BadHabit Tracker</h1>
            <p className="text-sm text-white/60">{email}</p>
          </div>
        </div>
        <button
          type="button"
          aria-label="Ouvrir le menu principal"
          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-white transition hover:border-white/40 sm:hidden"
          onClick={() => setOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-4 hidden gap-3 sm:grid sm:grid-cols-4">{actionButtons}</div>

      {open && (
        <div className="fixed inset-0 z-50 sm:hidden">
          <button
            aria-label="Fermer le menu"
            className="absolute inset-0 bg-black/70"
            onClick={closeMenu}
          />
            <div className="absolute inset-y-0 right-0 w-full max-w-xs bg-[#0d111c] p-6 shadow-2xl">
              <div className="flex items-center justify-between">
                <span className="text-sm uppercase tracking-[0.25em] text-white/40">Menu</span>
                <button
                  type="button"
                  aria-label="Fermer le menu"
                  className="rounded-xl border border-white/15 p-2 text-white/80"
                  onClick={closeMenu}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-4 flex flex-col gap-3">{actionButtons}</div>
            </div>
        </div>
      )}
    </header>
  )
}
