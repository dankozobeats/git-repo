'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FileBarChart2,
  History,
  Sparkles,
  Columns3,
  BarChart3,
  HelpCircle,
  Target,
  Menu,
  X,
  LogOut,
  Settings,
} from 'lucide-react'

const iconMap = {
  dashboard: LayoutDashboard,
  report: FileBarChart2,
  history: History,
  coach: Sparkles,
  compare: Columns3,
  stats: BarChart3,
  target: Target,
  help: HelpCircle,
  settings: Settings,
  logout: LogOut,
}

export type SidebarIcon = keyof typeof iconMap

export type SidebarNavItem = {
  href: string
  label: string
  icon: SidebarIcon
  isActive?: boolean
}

type DashboardSidebarProps = {
  mainNav: SidebarNavItem[]
  utilityNav: SidebarNavItem[]
  userEmail: string
  avatarInitial: string
}

export default function DashboardSidebar({ mainNav, utilityNav, userEmail, avatarInitial }: DashboardSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-40 flex items-center gap-2 rounded-2xl border border-white/20 bg-[#050915]/90 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:border-white/40 md:hidden"
        aria-label="Ouvrir le menu"
      >
        <Menu className="h-4 w-4" />
        Menu
      </button>

      <aside className="fixed left-0 top-0 hidden h-full w-64 flex-col border-r border-white/5 bg-[#050915] p-5 text-sm text-white/70 shadow-[4px_0_30px_rgba(0,0,0,0.35)] md:flex">
        <SidebarContent
          mainNav={mainNav}
          utilityNav={utilityNav}
          userEmail={userEmail}
          avatarInitial={avatarInitial}
          onNavigate={() => setMobileOpen(false)}
        />
      </aside>

      <div
        className={`fixed inset-0 z-50 bg-black/70 transition-opacity duration-300 md:hidden ${
          mobileOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setMobileOpen(false)}
      />

      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-white/10 bg-[#050915] p-5 text-sm text-white/70 shadow-[4px_0_30px_rgba(0,0,0,0.35)] transition-transform duration-300 md:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-start justify-between">
          <MiniProfile userEmail={userEmail} avatarInitial={avatarInitial} />
          <button
            type="button"
            aria-label="Fermer le menu"
            className="rounded-2xl border border-white/15 p-2 text-white/70 transition hover:text-white"
            onClick={() => setMobileOpen(false)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-6 flex flex-col gap-6">
          <NavLinks items={mainNav} onNavigate={() => setMobileOpen(false)} />
          <div className="border-t border-white/10 pt-4">
            <NavLinks items={utilityNav} onNavigate={() => setMobileOpen(false)} />
            <form action="/auth/signout" method="post" className="mt-3">
              <button className="flex w-full items-center gap-3 rounded-2xl bg-[#111827] px-3 py-2 text-left text-sm font-semibold text-white/70 transition hover:bg-[#1f2937] hover:text-white">
                <LogOut className="h-4 w-4" />
                Déconnexion
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}

function SidebarContent({
  mainNav,
  utilityNav,
  userEmail,
  avatarInitial,
  onNavigate,
}: {
  mainNav: SidebarNavItem[]
  utilityNav: SidebarNavItem[]
  userEmail: string
  avatarInitial: string
  onNavigate?: () => void
}) {
  return (
    <div className="flex h-full flex-col">
      <MiniProfile userEmail={userEmail} avatarInitial={avatarInitial} />
      <div className="mt-4 flex-1 overflow-y-auto">
        <div aria-label="Navigation principale">
          <NavLinks items={mainNav} onNavigate={onNavigate} />
        </div>
        <div className="mt-6 border-t border-white/5 pt-4" aria-label="Navigation secondaire">
          <NavLinks items={utilityNav} onNavigate={onNavigate} />
        </div>
      </div>
      <form action="/auth/signout" method="post" className="mt-6">
        <button className="flex w-full items-center gap-3 rounded-2xl bg-[#111827] px-3 py-2 text-left text-sm font-semibold text-white/70 transition hover:bg-[#1f2937] hover:text-white">
          <LogOut className="h-4 w-4" />
          Déconnexion
        </button>
      </form>
    </div>
  )
}

function NavLinks({ items, onNavigate }: { items: SidebarNavItem[]; onNavigate?: () => void }) {
  const pathname = usePathname()

  const isLinkActive = (href: string, provided?: boolean) => {
    if (typeof provided !== 'undefined') return provided

    const [baseHref] = href.split('#')
    if (baseHref === '/') {
      return pathname === '/'
    }

    const normalizedBase = baseHref.endsWith('/') ? baseHref.slice(0, -1) : baseHref
    const normalizedPath = pathname.endsWith('/') && pathname !== '/' ? pathname.slice(0, -1) : pathname

    if (normalizedPath === normalizedBase) return true
    return normalizedPath.startsWith(`${normalizedBase}/`)
  }

  return (
    <nav className="space-y-1">
      {items.map(item => {
        const Icon = iconMap[item.icon]
        const isActive = isLinkActive(item.href, item.isActive)
        return (
          <Link
            key={item.label}
            href={item.href}
            className={`group relative flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-semibold transition ${
              isActive ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'
            }`}
            aria-current={isActive ? 'page' : undefined}
            onClick={onNavigate}
          >
            <span
              className={`absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full transition ${
                isActive ? 'bg-[#4DA6FF]' : 'bg-transparent group-hover:bg-white/20'
              }`}
              aria-hidden="true"
            />
            <Icon className="h-4 w-4 flex-shrink-0" />
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

function MiniProfile({ userEmail, avatarInitial }: { userEmail: string; avatarInitial: string }) {
  return (
    <div>
      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#4DA6FF]/25 text-lg font-semibold text-white">
          {avatarInitial}
        </div>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.35em] text-white/40">BadHabit</p>
          <p className="text-sm font-semibold text-white">Control Room</p>
        </div>
      </div>
      <p className="mt-2 text-xs text-white/60 truncate">{userEmail}</p>
    </div>
  )
}
