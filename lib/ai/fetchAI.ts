const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
const GEMINI_LANGUAGE = process.env.GEMINI_LANGUAGE || 'fr'

const OLLAMA_URL = process.env.OLLAMA_URL
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'phi3:mini'

let ollamaModelLoaded = false

export async function fetchAI(prompt: string) {
  if (GEMINI_API_KEY) {
    return fetchGemini(prompt)
  }

  if (!OLLAMA_URL) {
    throw new Error('Aucune configuration IA disponible (GEMINI_API_KEY ou OLLAMA_URL requis)')
  }

  return fetchOllama(prompt)
}

async function fetchGemini(prompt: string) {
  const instruction =
    GEMINI_LANGUAGE === 'fr'
      ? 'Réponds uniquement en français, avec un ton naturel et professionnel adapté à un coach personnel.'
      : ''

  const finalPrompt = instruction ? `${instruction}\n\n${prompt}` : prompt

  const url = `https://generativelanguage.googleapis.com/v1/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: finalPrompt }],
        },
      ],
    }),
  })

  if (!res.ok) {
    const errorText = await res.text().catch(() => 'Erreur inconnue')
    throw new Error(`Gemini error ${res.status}: ${errorText}`)
  }

  const data = await res.json()
  const text =
    data.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text || '')
      .join('')
      .trim() ||
    data.candidates?.[0]?.content?.parts?.[0]?.text

  if (!text) {
    throw new Error("Réponse Gemini invalide: pas de texte retourné")
  }

  return text
}

async function fetchOllama(prompt: string) {
  if (!OLLAMA_URL) {
    throw new Error('OLLAMA_URL non configuré')
  }

  ensureOllamaModelLoaded().catch(() => {
    // Ignorer silencieusement le warm-up
  })

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 90_000)

  const body = {
    model: OLLAMA_MODEL,
    stream: false,
    keep_alive: '10m',
    prompt,
    options: {
      temperature: 0.85,
      top_p: 0.95,
      num_ctx: 800,
      num_predict: 200,
      top_k: 10,
      repeat_penalty: 1.2,
      num_thread: 4,
      numa: false,
    },
  }

  try {
    const startTime = Date.now()
    console.log(`[fetchAI] Début génération avec modèle ${OLLAMA_MODEL}...`)

    const res = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      keepalive: false,
    })

    clearTimeout(timeout)
    const elapsed = Date.now() - startTime
    console.log(`[fetchAI] Réponse reçue après ${elapsed}ms`)

    if (!res.ok) {
      const errorText = await res.text().catch(() => 'Erreur inconnue')
      throw new Error(`Ollama error ${res.status}: ${errorText}`)
    }

    const json = await res.json()

    if (!json.response) {
      throw new Error("Réponse Ollama invalide: pas de champ 'response'")
    }

    ollamaModelLoaded = true
    return json.response
  } catch (err) {
    clearTimeout(timeout)
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(
        "Timeout IA (>90s) - Le modèle prend trop de temps. Cela peut arriver si le modèle se décharge entre les appels. Réessayez dans quelques secondes."
      )
    }
    throw err
  }
}

async function ensureOllamaModelLoaded(): Promise<void> {
  if (ollamaModelLoaded || !OLLAMA_URL) return

  try {
    const checkController = new AbortController()
    const checkTimeout = setTimeout(() => checkController.abort(), 5000)

    const checkRes = await fetch(`${OLLAMA_URL}/api/show`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: OLLAMA_MODEL }),
      signal: checkController.signal,
    })

    clearTimeout(checkTimeout)

    if (checkRes.ok) {
      ollamaModelLoaded = true
      return
    }
  } catch {
    // Ignorer les erreurs de check
  }

  try {
    const warmupController = new AbortController()
    const warmupTimeout = setTimeout(() => warmupController.abort(), 10_000)

    const warmupRes = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: 'OK',
        stream: false,
        options: { num_predict: 5 },
      }),
      signal: warmupController.signal,
    })

    clearTimeout(warmupTimeout)

    if (warmupRes.ok) {
      ollamaModelLoaded = true
    }
  } catch {
    // Ignorer le warm-up raté
  }
}
