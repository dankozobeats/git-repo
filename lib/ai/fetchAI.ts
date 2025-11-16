const OLLAMA_URL = process.env.OLLAMA_URL;
// Utiliser phi3:mini par défaut (beaucoup plus rapide que phi3:3.8b-instruct)
// Si phi3:3.8b-instruct est utilisé, il sera plus lent mais donnera de meilleures réponses
const MODEL = process.env.OLLAMA_MODEL || "phi3:mini";

// Cache pour vérifier si le modèle est déjà chargé
let modelLoaded = false;

/**
 * Précharge le modèle pour éviter le délai du premier appel
 */
async function ensureModelLoaded(): Promise<void> {
  if (modelLoaded || !OLLAMA_URL) return;
  
  try {
    // Vérifier si le modèle existe et est accessible
    const checkController = new AbortController();
    const checkTimeout = setTimeout(() => checkController.abort(), 5000);
    
    const checkRes = await fetch(`${OLLAMA_URL}/api/show`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: MODEL }),
      signal: checkController.signal,
    });
    
    clearTimeout(checkTimeout);
    
    if (checkRes.ok) {
      modelLoaded = true;
      return;
    }
  } catch {
    // Ignorer les erreurs de check, on essaiera quand même de générer
  }
  
  // Si le check échoue, faire un warm-up avec un prompt très court
  try {
    const warmupController = new AbortController();
    const warmupTimeout = setTimeout(() => warmupController.abort(), 10000);
    
    const warmupRes = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        prompt: "OK",
        stream: false,
        options: { num_predict: 5 }, // Réponse ultra-courte
      }),
      signal: warmupController.signal,
    });
    
    clearTimeout(warmupTimeout);
    
    if (warmupRes.ok) {
      modelLoaded = true;
    }
  } catch {
    // Ignorer les erreurs de warm-up, on essaiera quand même
  }
}

export async function fetchAI(prompt: string) {
  if (!OLLAMA_URL) {
    throw new Error("OLLAMA_URL non configuré");
  }

  // Précharger le modèle en arrière-plan (ne bloque pas si ça échoue)
  ensureModelLoaded().catch(() => {
    // Ignorer silencieusement
  });

  const controller = new AbortController();

  // Timeout : 90 secondes (le modèle peut être lent, surtout s'il se décharge entre appels)
  const timeout = setTimeout(() => {
    controller.abort();
  }, 90000);

  const body = {
    model: MODEL,
    stream: false,
    keep_alive: "10m",     // Garder le modèle en mémoire plus longtemps (10 minutes)
    prompt: prompt,
    options: {
      temperature: 0.85,   // légèrement plus élevé = réponses plus rapides
      top_p: 0.95,         // plus permissif = plus rapide
      num_ctx: 800,        // contexte encore plus réduit = beaucoup plus rapide
      num_predict: 200,    // réponse plus courte = beaucoup plus rapide (optimisé pour JSON compact)
      top_k: 10,           // réduit encore plus l'espace de recherche = plus rapide
      repeat_penalty: 1.2,
      num_thread: 4,       // utilise plus de threads si disponible
      numa: false,         // désactiver NUMA pour plus de simplicité
    },
  };

  try {
    const startTime = Date.now();
    console.log(`[fetchAI] Début génération avec modèle ${MODEL}...`);
    
    const res = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      // Ajouter des options pour gérer les timeouts réseau
      keepalive: false,
    });

    clearTimeout(timeout);
    const elapsed = Date.now() - startTime;
    console.log(`[fetchAI] Réponse reçue après ${elapsed}ms`);

    if (!res.ok) {
      const errorText = await res.text().catch(() => "Erreur inconnue");
      throw new Error(`Ollama error ${res.status}: ${errorText}`);
    }

    const json = await res.json();
    
    if (!json.response) {
      throw new Error("Réponse Ollama invalide: pas de champ 'response'");
    }

    modelLoaded = true; // Marquer comme chargé après un succès
    return json.response;
  } catch (err) {
    clearTimeout(timeout);
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("Timeout IA (>90s) - Le modèle prend trop de temps. Cela peut arriver si le modèle se décharge entre les appels. Réessayez dans quelques secondes.");
    }
    // Relancer les erreurs réseau telles quelles pour gestion dans route.ts
    throw err;
  }
}

