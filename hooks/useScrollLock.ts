import { useEffect } from 'react'

export function useScrollLock(locked: boolean) {
  useEffect(() => {
    const originalOverflow = document.body.style.overflow
    const originalPaddingRight = document.body.style.paddingRight

    if (locked) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
      document.body.style.overflow = 'hidden'
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`
      }
    } else {
      document.body.style.overflow = originalOverflow || ''
      document.body.style.paddingRight = originalPaddingRight || ''
    }

    return () => {
      document.body.style.overflow = originalOverflow || ''
      document.body.style.paddingRight = originalPaddingRight || ''
    }
  }, [locked])
}
