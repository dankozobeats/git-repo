'use client'

// Composant client qui gère un menu flottant Next.js et ses interactions utilisateur.
import { type ReactNode, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Plus, Sparkles, Search } from 'lucide-react'
import { HABIT_SEARCH_EVENT } from '@/lib/ui/scroll'

// Définit la variation minimale de scroll avant d'appliquer les animations de masquage.
const SCROLL_THRESHOLD = 10

export default function FloatingQuickActions() {
  // Verrouille l'affichage tant que le token n'est pas trouvé dans le storage.
  const [menuLocked, setMenuLocked] = useState(true)
  // Flag d'hydratation pour aligner la classe initiale entre SSR et client.
  const [isHydrated, setIsHydrated] = useState(false)
  // Indique si le menu doit être momentanément caché pendant le scroll.
  const [temporarilyHidden, setTemporarilyHidden] = useState(false)
  // Conserve la dernière position verticale connue pour mesurer les déplacements.
  const lastScrollYRef = useRef(0)
  // Stocke l'identifiant du timeout qui réaffiche le menu après une pause.
  const scrollTimeoutRef = useRef<number | null>(null)

  // Vérifie la présence du token dans localStorage et attache les réactions au scroll.
  useEffect(() => {
    setIsHydrated(true)
    if (typeof window === 'undefined') return
    let hasToken = false
    // Try/catch nécessaire car l'accès au localStorage peut échouer selon l'environnement.
    try {
      hasToken = Boolean(window.localStorage.getItem('auth_token'))
    } catch {
      hasToken = false
    }

    if (!hasToken) {
      document.getElementById('floatingMenu')?.classList.add('hidden')
      setMenuLocked(true)
      return
    }

    setMenuLocked(false)
    lastScrollYRef.current = window.scrollY
    // Gère le scroll : détecte les mouvements significatifs et masque ou affiche le menu.
    const handleScroll = () => {
      const currentY = window.scrollY
      const delta = Math.abs(currentY - lastScrollYRef.current)
      if (delta < SCROLL_THRESHOLD) return
      lastScrollYRef.current = currentY
      if (document.documentElement.classList.contains('no-hide-menu')) return
      hideFloatingMenu()
      if (scrollTimeoutRef.current) {
        window.clearTimeout(scrollTimeoutRef.current)
      }
      scrollTimeoutRef.current = window.setTimeout(() => {
        showFloatingMenu()
      }, 200)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (scrollTimeoutRef.current) {
        window.clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [])

  // Empêche le masquage automatique pendant un clic pour éviter les disparitions brusques.
  const preventHideDuringClick = () => {
    document.documentElement.classList.add('no-hide-menu')
    window.setTimeout(() => {
      document.documentElement.classList.remove('no-hide-menu')
    }, 300)
  }

  // Force le passage en mode caché si aucune protection n'est active.
  const hideFloatingMenu = () => {
    if (document.documentElement.classList.contains('no-hide-menu')) return
    setTemporarilyHidden(true)
  }

  // Réinitialise l'état pour réafficher les actions flottantes.
  const showFloatingMenu = () => {
    setTemporarilyHidden(false)
  }

  // Classes utilitaires Next/Tailwind pour positionner le menu selon le viewport.
  const positionClass = 'bottom-6 right-4 sm:right-8'
  const shouldHideMenu = !isHydrated || menuLocked

  // Rend le menu flottant avec trois actions principales (recherche, création, rapport).
  return (
    <div
      id="floatingMenu"
      suppressHydrationWarning
      className={`${shouldHideMenu ? 'hidden ' : ''}fixed ${positionClass} z-[1500] flex flex-col items-center gap-3 transition-all duration-200 ${
        temporarilyHidden ? 'translate-x-20 opacity-0' : 'translate-x-0 opacity-100'
      }`}
    >
      <FloatingActionButton
        onClick={() => {
          // Émet un événement personnalisé pour déclencher le panneau de recherche global.
          window.dispatchEvent(new CustomEvent(HABIT_SEARCH_EVENT))
        }}
        ariaLabel="Recherche"
        icon={<Search className="h-5 w-5" />}
        className="border border-white/15 bg-[#050915]/85 text-white"
        preventHideDuringClick={preventHideDuringClick}
      />
      <FloatingIconLink
        href="/habits/new"
        label="Créer une habitude"
        icon={<Plus className="h-5 w-5" />}
        className="bg-gradient-to-r from-[#FF4D4D] to-[#F58CA5] text-white shadow-[0_20px_45px_rgba(255,77,77,0.45)]"
        preventHideDuringClick={preventHideDuringClick}
      />
      <FloatingIconLink
        href="/report"
        label="Coach IA"
        icon={<Sparkles className="h-5 w-5" />}
        className="bg-[#050915]/85 text-[#4DA6FF] border border-white/15 shadow-lg shadow-black/40"
        preventHideDuringClick={preventHideDuringClick}
      />
    </div>
  )
}

// Rend un lien icône carré qui applique blur et animations sur hover.
function FloatingIconLink({ href, label, icon, className, preventHideDuringClick }: { href: string; label: string; icon: ReactNode; className?: string; preventHideDuringClick: () => void }) {
  return (
    <Link
      href={href}
      title={label}
      aria-label={label}
      // Bloque la dissimulation du menu lorsque l'utilisateur initie le clic.
      onPointerDown={preventHideDuringClick}
      className={`group flex h-14 w-14 items-center justify-center rounded-2xl backdrop-blur-sm transition hover:-translate-y-1 hover:scale-105 ${className}`}
    >
      {icon}
    </Link>
  )
}

type FloatingActionButtonProps = {
  onClick?: () => void
  icon: ReactNode
  className?: string
  ariaLabel: string
  preventHideDuringClick: () => void
}

// Bouton générique utilisé pour les actions rapides déclenchées sans navigation.
function FloatingActionButton({
  onClick,
  icon,
  className,
  ariaLabel,
  preventHideDuringClick,
}: FloatingActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      // Empêche le menu de disparaître entre press et release sur mobile.
      onPointerDown={preventHideDuringClick}
      aria-label={ariaLabel}
      className={`flex h-14 w-14 items-center justify-center rounded-2xl backdrop-blur-sm transition hover:-translate-y-1 hover:scale-105 touch-manipulation ${className}`}
    >
      {icon}
    </button>
  )
}
