interface AIResponse {
  reply: string
  memories?: unknown[]
}

export async function askAI(prompt: string, userId: string): Promise<string> {
  const baseUrl = process.env.AI_API_URL
  const apiKey = process.env.AI_API_KEY

  if (!baseUrl || !apiKey) {
    throw new Error('Connexion à l\'IA indisponible (AI_API_URL ou AI_API_KEY manquants)')
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 60000) // 60s timeout

    const response = await fetch(`${baseUrl}/chat`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        userId,
        message: prompt,
      }),
    })

    clearTimeout(timeout)

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Erreur inconnue')
      throw new Error(`Erreur IA (${response.status}): ${errorText}`)
    }

    const data: AIResponse = await response.json()

    if (!data.reply) {
      throw new Error('Réponse IA invalide: aucun contenu')
    }

    return data.reply.trim()
  } catch (error) {
    console.error('[askAI] erreur', error)
    throw error
  }
}
