'use client'

import { Suspense } from 'react'
import CompareContent from './CompareContent'

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="text-white p-4">Chargement comparaison...</div>}>
      <CompareContent />
    </Suspense>
  )
}
