'use client'

// Page de comparaison IA rendue côté client avec suspense pour les données asynchrones.

import { Suspense } from 'react'
import CompareContent from './CompareContent'

export default function ComparePage() {
  return (
    // CompareContent charge probablement des données server actions, d'où l'usage de Suspense.
    <Suspense fallback={<div className="text-white p-4">Chargement comparaison...</div>}>
      <CompareContent />
    </Suspense>
  )
}
