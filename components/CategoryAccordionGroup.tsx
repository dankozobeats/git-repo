'use client'

// Gestionnaire client qui coordonne l'ouverture d'un seul accordéon de catégorie à la fois.

import { useState } from 'react'

type CategoryAccordionGroupProps = {
  initialOpenId?: string | null
  children: (params: { openId: string | null; handleToggle: (id: string) => void }) => React.ReactNode
}

export default function CategoryAccordionGroup({ initialOpenId = null, children }: CategoryAccordionGroupProps) {
  const [openId, setOpenId] = useState<string | null>(initialOpenId)

  // Alterne entre ouvrir un identifiant spécifique et tout fermer.
  const handleToggle = (id: string) => {
    setOpenId(prev => (prev === id ? null : id))
  }

  // Rend la fonction enfant avec l'ID ouvert courant et la callback associée.
  return <>{children({ openId, handleToggle })}</>
}
