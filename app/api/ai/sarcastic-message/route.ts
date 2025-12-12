import { NextRequest, NextResponse } from 'next/server'
import { askAI } from '@/lib/ai'

export async function POST(request: NextRequest) {
  try {
    const { habitName, count, userId } = await request.json()

    if (!habitName || !userId) {
      return NextResponse.json({ error: 'habitName et userId requis' }, { status: 400 })
    }

    const safeCount = typeof count === 'number' ? count : 1

    const prompt = `Tu es un coach sarcastique mais bienveillant. L'utilisateur vient de céder à sa mauvaise habitude "${habitName}" pour la ${safeCount}ème fois.

Génère un message court (max 2 phrases) qui soit :
- Sarcastique mais pas méchant
- Motivant malgré tout
- Drôle si possible
- En français

Exemples de ton :
- "Bravo champion ! ${safeCount} fois, c'est presque un record personnel ! 🏆"
- "Encore ? Tu vises le podium ou quoi ? Allez, on se ressaisit ! 💪"
- "${safeCount} fois... À ce rythme, tu vas finir par battre tous tes records ! 😅"

Génère maintenant ton message sarcastique :`

    const message = await askAI(prompt, userId)

    return NextResponse.json({ message })
  } catch (error) {
    console.error('Sarcastic message error:', error)
    return NextResponse.json({ error: 'Impossible de générer le message sarcastique' }, { status: 500 })
  }
}
