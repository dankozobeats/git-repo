'use client'

import { useRef, useState } from 'react'
import { Search } from 'lucide-react'

type SearchBarProps = {
  onSearch: (value: string) => void
  placeholder?: string
  delay?: number
}

export default function SearchBar({ onSearch, placeholder = 'Rechercher une habitude…', delay = 150 }: SearchBarProps) {
  const [value, setValue] = useState('')
  const timerRef = useRef<number | null>(null)

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value
    setValue(nextValue)
    if (delay === 0) {
      onSearch(nextValue)
      return
    }
    if (timerRef.current) {
      window.clearTimeout(timerRef.current)
    }
    timerRef.current = window.setTimeout(() => {
      onSearch(nextValue)
      timerRef.current = null
    }, delay)
  }

  return (
    <div className="relative w-full" data-mobile-search="true">
      <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-white/10 bg-[#12121A]/80 px-12 py-3 text-sm text-white placeholder:text-white/50 shadow-inner shadow-black/40 focus:border-[#FF4D4D]/60 focus:outline-none focus:ring-2 focus:ring-[#FF4D4D]/20"
      />
    </div>
  )
}
