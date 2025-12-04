'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'

export type ThemeName = 'dark' | 'rose' | 'light' | 'gold'

const THEME_CLASSES: Record<ThemeName, string> = {
  dark: 'theme-dark',
  rose: 'theme-rose',
  light: 'theme-light',
  gold: 'theme-gold',
}

type ThemeContextValue = {
  theme: ThemeName
  setTheme: (value: ThemeName) => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeName>('dark')

  useEffect(() => {
    if (typeof window === 'undefined') return
    const saved = window.localStorage.getItem('bh-theme') as ThemeName | null
    if (saved && THEME_CLASSES[saved]) {
      setTheme(saved)
    }
  }, [])

  useEffect(() => {
    if (typeof document === 'undefined') return
    const body = document.body
    Object.values(THEME_CLASSES).forEach(cls => body.classList.remove(cls))
    body.classList.add(THEME_CLASSES[theme])
    window.localStorage.setItem('bh-theme', theme)
  }, [theme])

  const value = useMemo(() => ({ theme, setTheme }), [theme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useThemeSwitcher() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useThemeSwitcher must be used within ThemeProvider')
  return ctx
}
