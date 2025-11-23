'use client'

import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'

type SectionSnapProps = React.ComponentPropsWithoutRef<'section'> & {
  disableSnap?: boolean
}

export default function SectionSnap({ className, children, disableSnap = false, ...props }: SectionSnapProps) {
  const sectionRef = useRef<HTMLElement | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const node = sectionRef.current
    if (!node) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting)
      },
      { threshold: 0.3 }
    )

    observer.observe(node)

    return () => {
      observer.disconnect()
    }
  }, [])

  return (
    <section
      ref={sectionRef}
      {...props}
      className={clsx(
        disableSnap ? 'section-snap-enter' : 'section-snap section-snap-enter',
        isVisible && 'section-snap-visible',
        className
      )}
    >
      {children}
    </section>
  )
}
