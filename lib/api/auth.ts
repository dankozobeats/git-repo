import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { User } from '@supabase/supabase-js';

/**
 * Interface pour le résultat de l'authentification
 */
export interface AuthResult {
    user: User;
    supabase: Awaited<ReturnType<typeof createClient>>;
}

/**
 * Helper pour vérifier l'authentification dans les routes API
 * 
 * @throws Error si l'utilisateur n'est pas authentifié
 * @returns L'utilisateur authentifié et le client Supabase
 * 
 * @example
 * ```typescript
 * export async function POST(request: Request) {
 *   try {
 *     const { user, supabase } = await requireAuth();
 *     // ... logique métier
 *   } catch (error) {
 *     return NextResponse.json({ error: error.message }, { status: 401 });
 *   }
 * }
 * ```
 */
export async function requireAuth(): Promise<AuthResult> {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        throw new Error('Non authentifié');
    }

    return { user, supabase };
}

/**
 * Helper pour créer une réponse d'erreur standardisée
 * 
 * @param message - Message d'erreur
 * @param status - Code de statut HTTP (défaut: 400)
 * @returns NextResponse avec l'erreur
 */
export function errorResponse(message: string, status: number = 400) {
    return NextResponse.json({ error: message }, { status });
}

/**
 * Helper pour créer une réponse de succès standardisée
 * 
 * @param data - Données à retourner
 * @param status - Code de statut HTTP (défaut: 200)
 * @returns NextResponse avec les données
 */
export function successResponse<T>(data: T, status: number = 200) {
    return NextResponse.json(data, { status });
}

/**
 * Helper pour vérifier que l'utilisateur possède une ressource
 * 
 * @param userId - ID de l'utilisateur authentifié
 * @param resourceUserId - ID de l'utilisateur propriétaire de la ressource
 * @throws Error si l'utilisateur n'est pas le propriétaire
 */
export function requireOwnership(userId: string, resourceUserId: string) {
    if (userId !== resourceUserId) {
        throw new Error('Accès non autorisé à cette ressource');
    }
}
