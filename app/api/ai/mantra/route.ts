import { NextRequest, NextResponse } from 'next/server'
import { askAI } from '@/lib/ai'

export async function POST(request: NextRequest) {
  try {
    const { habitName, userId } = await request.json()

    if (!habitName || !userId) {
      return NextResponse.json({ error: 'habitName et userId requis' }, { status: 400 })
    }

    const prompt = `Génère un mantra court et puissant (max 10 mots) pour résister à "${habitName}".

Le mantra doit :
- Être positif et affirmatif
- Utiliser "je"
- Être mémorable et facile à répéter
- Donner de la force

Génère maintenant UN seul mantra (pas d'explication, juste le mantra) :`

    const mantra = (await askAI(prompt, userId)).replace(/['"]/g, '').trim()

    return NextResponse.json({ mantra })
  } catch (error) {
    console.error('Mantra error:', error)
    return NextResponse.json({ error: 'Impossible de générer un mantra' }, { status: 500 })
  }
}
