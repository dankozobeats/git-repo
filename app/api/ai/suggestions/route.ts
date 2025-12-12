import { NextRequest, NextResponse } from 'next/server'
import { askAI } from '@/lib/ai'

export async function POST(request: NextRequest) {
  try {
    const { habitName, recentCount, userId } = await request.json()

    if (!habitName || typeof recentCount !== 'number' || !userId) {
      return NextResponse.json({ error: 'habitName, recentCount et userId requis' }, { status: 400 })
    }

    const prompt = `L'utilisateur lutte contre "${habitName}" et a cédé ${recentCount} fois cette semaine.

Génère 3 suggestions courtes et actionnables pour l'aider :
1. Une technique de distraction immédiate
2. Une stratégie à long terme
3. Un mantra ou phrase motivante

Format : Liste numérotée, chaque suggestion max 1-2 phrases.`

    const suggestions = await askAI(prompt, userId)

    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error('Suggestions error:', error)
    return NextResponse.json({ error: 'Impossible de générer des suggestions' }, { status: 500 })
  }
}
