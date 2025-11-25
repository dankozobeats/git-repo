'use client'

export default function ViewHabitsButton() {
  function handleClick() {
    const target = document.getElementById('mainScrollArea') ?? document.getElementById('active-habits-section')
    target?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
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
