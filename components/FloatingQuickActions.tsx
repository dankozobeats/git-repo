'use client'

import { type ReactNode, useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Sparkles } from 'lucide-react'

export default function FloatingQuickActions() {
  const [hiddenOnMobile, setHiddenOnMobile] = useState(false)

  useEffect(() => {
    let lastScrollY = window.scrollY
    let timeout: ReturnType<typeof setTimeout>

    const handleScroll = () => {
      const currentY = window.scrollY
      const isScrollingDown = currentY > lastScrollY
      lastScrollY = currentY

      if (window.innerWidth >= 768) return

      if (isScrollingDown && currentY > 20) {
        setHiddenOnMobile(true)
      } else {
        setHiddenOnMobile(false)
      }

      clearTimeout(timeout)
      timeout = setTimeout(() => {
        if (window.innerWidth < 768) {
          setHiddenOnMobile(false)
        }
      }, 250)
    }

    window.addEventListener('scroll', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
      clearTimeout(timeout)
    }
  }, [])

  return (
    <div
      className={`fixed bottom-6 right-4 z-40 flex flex-col items-center gap-3 transition-all duration-200 sm:right-8 ${
        hiddenOnMobile ? 'translate-x-16 opacity-0' : 'translate-x-0 opacity-100'
      }`}
    >
      <FloatingIconLink
        href="/habits/new"
        label="Créer une habitude"
        icon={<Plus className="h-5 w-5" />}
        className="bg-gradient-to-r from-[#FF4D4D] to-[#F58CA5] text-white shadow-[0_20px_45px_rgba(255,77,77,0.45)]"
      />
      <FloatingIconLink
        href="/report"
        label="Coach IA"
        icon={<Sparkles className="h-5 w-5" />}
        className="bg-[#050915]/85 text-[#4DA6FF] border border-white/15 shadow-lg shadow-black/40"
      />
    </div>
  )
}

function FloatingIconLink({ href, label, icon, className }: { href: string; label: string; icon: ReactNode; className?: string }) {
  return (
    <Link
      href={href}
      title={label}
      aria-label={label}
      className={`group flex h-14 w-14 items-center justify-center rounded-2xl backdrop-blur-sm transition hover:-translate-y-1 hover:scale-105 ${className}`}
    >
      {icon}
    </Link>
  )
}
