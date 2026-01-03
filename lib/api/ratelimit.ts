import { NextRequest } from 'next/server';

/**
 * Configuration du rate limiter
 */
interface RateLimitConfig {
    /** Nombre maximum de requêtes autorisées */
    maxRequests: number;
    /** Fenêtre de temps en millisecondes */
    windowMs: number;
}

/**
 * Entrée dans le cache de rate limiting
 */
interface RateLimitEntry {
    count: number;
    resetTime: number;
}

/**
 * Cache en mémoire pour le rate limiting
 * Note: En production, utilisez Redis (Upstash) pour un rate limiting distribué
 */
const rateLimitCache = new Map<string, RateLimitEntry>();

/**
 * Nettoie les entrées expirées du cache toutes les minutes
 */
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitCache.entries()) {
        if (entry.resetTime < now) {
            rateLimitCache.delete(key);
        }
    }
}, 60000); // Nettoyage toutes les 60 secondes

/**
 * Extrait l'identifiant du client depuis la requête
 * Utilise l'IP ou un header personnalisé
 */
function getClientIdentifier(request: NextRequest): string {
    // En production Vercel, utiliser x-forwarded-for
    const forwardedFor = request.headers.get('x-forwarded-for');
    if (forwardedFor) {
        return forwardedFor.split(',')[0].trim();
    }

    // En développement, utiliser x-real-ip ou une valeur par défaut
    const realIp = request.headers.get('x-real-ip');
    if (realIp) {
        return realIp;
    }

    // Fallback pour le développement local
    return 'dev-client';
}

/**
 * Vérifie si une requête dépasse la limite de taux
 * 
 * @param request - La requête Next.js
 * @param config - Configuration du rate limiter
 * @returns true si la limite est dépassée, false sinon
 * 
 * @example
 * ```typescript
 * export async function POST(request: NextRequest) {
 *   if (await isRateLimited(request, { maxRequests: 10, windowMs: 60000 })) {
 *     return NextResponse.json(
 *       { error: 'Too many requests' },
 *       { status: 429 }
 *     );
 *   }
 *   // ... logique métier
 * }
 * ```
 */
export async function isRateLimited(
    request: NextRequest,
    config: RateLimitConfig = { maxRequests: 10, windowMs: 10000 }
): Promise<boolean> {
    const identifier = getClientIdentifier(request);
    const now = Date.now();
    const key = `${identifier}:${request.nextUrl.pathname}`;

    const entry = rateLimitCache.get(key);

    if (!entry || entry.resetTime < now) {
        // Nouvelle fenêtre de temps
        rateLimitCache.set(key, {
            count: 1,
            resetTime: now + config.windowMs,
        });
        return false;
    }

    if (entry.count >= config.maxRequests) {
        // Limite dépassée
        return true;
    }

    // Incrémenter le compteur
    entry.count++;
    rateLimitCache.set(key, entry);
    return false;
}

/**
 * Obtient les informations de rate limiting pour une requête
 * Utile pour ajouter des headers de rate limiting
 */
export function getRateLimitInfo(
    request: NextRequest,
    config: RateLimitConfig = { maxRequests: 10, windowMs: 10000 }
): {
    limit: number;
    remaining: number;
    reset: number;
} {
    const identifier = getClientIdentifier(request);
    const now = Date.now();
    const key = `${identifier}:${request.nextUrl.pathname}`;

    const entry = rateLimitCache.get(key);

    if (!entry || entry.resetTime < now) {
        return {
            limit: config.maxRequests,
            remaining: config.maxRequests - 1,
            reset: now + config.windowMs,
        };
    }

    return {
        limit: config.maxRequests,
        remaining: Math.max(0, config.maxRequests - entry.count),
        reset: entry.resetTime,
    };
}

/**
 * Configurations prédéfinies pour différents types d'endpoints
 */
export const RATE_LIMITS = {
    /** Pour les endpoints de lecture (GET) */
    READ: { maxRequests: 30, windowMs: 10000 }, // 30 requêtes / 10 secondes

    /** Pour les endpoints d'écriture (POST, PUT, DELETE) */
    WRITE: { maxRequests: 10, windowMs: 10000 }, // 10 requêtes / 10 secondes

    /** Pour les endpoints sensibles (auth, paiement) */
    SENSITIVE: { maxRequests: 5, windowMs: 60000 }, // 5 requêtes / 1 minute

    /** Pour les endpoints d'AI/Coach */
    AI: { maxRequests: 3, windowMs: 60000 }, // 3 requêtes / 1 minute
} as const;

/**
 * Vérifie le rate limit et retourne un objet détaillé
 */
export async function checkRateLimit(
    request: NextRequest,
    type: keyof typeof RATE_LIMITS = 'WRITE'
): Promise<{ allowed: boolean; limit: number; remaining: number; reset: number }> {
    const config = RATE_LIMITS[type];
    const identifier = getClientIdentifier(request);
    const now = Date.now();
    const key = `${identifier}:${request.nextUrl.pathname}`;

    let entry = rateLimitCache.get(key);

    if (!entry || entry.resetTime < now) {
        entry = {
            count: 1,
            resetTime: now + config.windowMs,
        };
        rateLimitCache.set(key, entry);
        return {
            allowed: true,
            limit: config.maxRequests,
            remaining: config.maxRequests - 1,
            reset: entry.resetTime,
        };
    }

    if (entry.count >= config.maxRequests) {
        return {
            allowed: false,
            limit: config.maxRequests,
            remaining: 0,
            reset: entry.resetTime,
        };
    }

    entry.count++;
    rateLimitCache.set(key, entry);

    return {
        allowed: true,
        limit: config.maxRequests,
        remaining: config.maxRequests - entry.count,
        reset: entry.resetTime,
    };
}
