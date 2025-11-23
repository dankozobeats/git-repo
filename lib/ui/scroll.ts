'use client'

let snapTimeout: number | null = null
export const HABIT_SEARCH_EVENT = 'habit-search-open'

function scrollWithSnapControl(element: HTMLElement | null) {
  if (typeof window === 'undefined' || !element) return
  const container = document.scrollingElement
  if (!container) return

  container.classList.add('no-snap')
  const rect = element.getBoundingClientRect()
  const targetY = window.scrollY + rect.top - window.innerHeight / 2 + rect.height / 2
  const targetX = window.scrollX + rect.left - window.innerWidth / 2 + rect.width / 2

  window.scrollTo({
    top: Math.max(0, targetY),
    left: Math.max(0, targetX),
    behavior: 'smooth',
  })

  if (snapTimeout) {
    window.clearTimeout(snapTimeout)
  }

  snapTimeout = window.setTimeout(() => {
    container.classList.remove('no-snap')
    snapTimeout = null
  }, 450)
}

export function animateAndCenterCategoryAccordion(element: HTMLElement | null) {
  scrollWithSnapControl(element)
}

export function scrollToSearchSection() {
  const section = document.getElementById('search-section')
  scrollWithSnapControl(section)
}

export default animateAndCenterCategoryAccordion
