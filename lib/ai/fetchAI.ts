// Variables d'environnement pour choisir le fournisseur IA actif côté serveur.
const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-5'
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
const OPENAI_ENABLE = String(process.env.OPENAI_ENABLE || '').toLowerCase() === 'true'
const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
const GEMINI_LANGUAGE = process.env.GEMINI_LANGUAGE || 'fr'

const OLLAMA_URL = process.env.OLLAMA_URL
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'phi3:mini'

// Flag interne pour éviter de réchauffer Ollama à chaque requête.
let ollamaModelLoaded = false

// Route d'accès unique : choisit Gemini si la clé existe sinon bascule sur Ollama.
export async function fetchAI(prompt: string) {
  // Priorité: OpenAI (GPT-5) → Gemini → Ollama, mais OpenAI activé uniquement si OPENAI_ENABLE=true
  if (OPENAI_ENABLE && OPENAI_API_KEY) {
    return fetchOpenAI(prompt)
  }
  if (GEMINI_API_KEY) {
    return fetchGemini(prompt)
  }

  if (!OLLAMA_URL) {
    throw new Error('Aucune configuration IA disponible (GEMINI_API_KEY ou OLLAMA_URL requis)')
  }

  return fetchOllama(prompt)
}

// Enveloppe l'appel REST à OpenAI (GPT-5) avec gestion d'erreurs.
async function fetchOpenAI(prompt: string) {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY non configuré')
  }

  const url = `${OPENAI_BASE_URL}/chat/completions`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        { role: 'system', content: 'Tu es un coach IA francophone, concis et utile.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.8,
    }),
  })

  if (!res.ok) {
    const errorText = await res.text().catch(() => 'Erreur inconnue')
    throw new Error(`OpenAI error ${res.status}: ${errorText}`)
  }

  const data = await res.json()
  const text = data.choices?.[0]?.message?.content?.trim()
  if (!text) {
    throw new Error("Réponse OpenAI invalide: pas de texte retourné")
  }
  return text
}

// Enveloppe l'appel REST à Gemini en gérant la langue et les erreurs HTTP.
async function fetchGemini(prompt: string) {
  const instruction =
    GEMINI_LANGUAGE === 'fr'
      ? 'Réponds uniquement en français, avec un ton naturel et professionnel adapté à un coach personnel.'
      : ''

  // Préfixe optionnel pour forcer la langue avant de passer l'invite réelle.
  const finalPrompt = instruction ? `${instruction}\n\n${prompt}` : prompt

  const url = `https://generativelanguage.googleapis.com/v1/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`

  // Requête JSON standard attendue par l'API Google Generative Language.
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
  // Certaines réponses peuvent arriver segmentées : concatène chaque partie textuelle.
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

// Appelle l'API Ollama locale/distante avec options de génération et gestion du timeout.
async function fetchOllama(prompt: string) {
  if (!OLLAMA_URL) {
    throw new Error('OLLAMA_URL non configuré')
  }

  ensureOllamaModelLoaded().catch(() => {
    // Ignorer silencieusement le warm-up
  })

  // AbortController utilisé pour empêcher les requêtes bloquées (>90s).
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

// Vérifie que le modèle Ollama est prêt et tente un warm-up si nécessaire.
async function ensureOllamaModelLoaded(): Promise<void> {
  if (ollamaModelLoaded || !OLLAMA_URL) return

  try {
    const checkController = new AbortController()
    const checkTimeout = setTimeout(() => checkController.abort(), 5000)

    // Vérifie via /api/show si le modèle est déjà chargé côté Ollama.
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

    // Sinon, joue une courte génération "OK" pour forcer le chargement en mémoire.
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
