'use client'

export default function ViewHabitsButton() {
  function handleClick() {
    const bad = document.getElementById('bad-habits-section')
    const good = document.getElementById('good-habits-section')
    const top = document.getElementById('active-habits-section')

    const bothOpen = bad?.getAttribute('open') !== null && good?.getAttribute('open') !== null

    if (bothOpen) {
      bad?.removeAttribute('open')
      good?.removeAttribute('open')
      return
    }

    if (bad) bad.setAttribute('open', 'true')
    if (good) good.setAttribute('open', 'true')

    if (top) {
      top.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="bg-gray-600 px-4 py-2 rounded-lg hover:bg-gray-700 transition text-sm font-medium text-white"
    >
      Voir les habitudes actives
    </button>
  )
}
