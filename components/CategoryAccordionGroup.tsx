'use client'

import { useState } from 'react'

type CategoryAccordionGroupProps = {
  initialOpenId?: string | null
  children: (params: { openId: string | null; handleToggle: (id: string) => void }) => React.ReactNode
}

export default function CategoryAccordionGroup({ initialOpenId = null, children }: CategoryAccordionGroupProps) {
  const [openId, setOpenId] = useState<string | null>(initialOpenId)

  const handleToggle = (id: string) => {
    setOpenId(prev => (prev === id ? null : id))
  }

  return <>{children({ openId, handleToggle })}</>
}
