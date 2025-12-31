// Utilitaire de validation pour les API routes
import { NextResponse } from 'next/server';
import { ZodSchema, ZodError } from 'zod';

/**
 * Valide les données avec un schéma Zod et retourne une réponse d'erreur si la validation échoue
 * @param schema - Le schéma Zod à utiliser pour la validation
 * @param data - Les données à valider
 * @returns Les données validées ou une réponse d'erreur NextResponse
 */
export function validateRequest<T>(
  schema: ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; response: NextResponse } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof ZodError) {
      const formattedErrors = error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      return {
        success: false,
        response: NextResponse.json(
          {
            error: 'Validation failed',
            details: formattedErrors,
          },
          { status: 400 }
        ),
      };
    }

    // Erreur inattendue
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      ),
    };
  }
}

/**
 * Parse le corps JSON d'une requête de manière sécurisée
 * @param request - La requête Next.js
 * @returns Le corps parsé ou une réponse d'erreur
 */
export async function parseRequestBody(
  request: Request
): Promise<{ success: true; data: unknown } | { success: false; response: NextResponse }> {
  try {
    const body = await request.json();
    return { success: true, data: body };
  } catch {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      ),
    };
  }
}
