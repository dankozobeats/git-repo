// Middleware Next.js pour la sécurité et la protection CSRF
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Liste des origines autorisées
const ALLOWED_ORIGINS = [
  'https://my-badhabit-tracker.vercel.app',
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  // En développement, autoriser localhost
  process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : null,
].filter(Boolean) as string[];

export function middleware(request: NextRequest) {
  const { pathname, origin } = request.nextUrl;

  // 1. Protection CSRF pour les requêtes mutantes (POST, PUT, DELETE, PATCH)
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
    const requestOrigin = request.headers.get('origin');
    const referer = request.headers.get('referer');

    // Vérifier que la requête vient d'une origine autorisée
    const isValidOrigin = requestOrigin && ALLOWED_ORIGINS.some(allowed =>
      requestOrigin.startsWith(allowed)
    );

    const isValidReferer = referer && ALLOWED_ORIGINS.some(allowed =>
      referer.startsWith(allowed)
    );

    // Pour les routes API, vérifier l'origine ou le referer
    if (pathname.startsWith('/api/')) {
      // Exceptions: endpoints CRON qui utilisent Bearer token
      const cronEndpoints = ['/api/process-reminders', '/api/get-due-reminders'];
      const isCronEndpoint = cronEndpoints.some(endpoint => pathname.startsWith(endpoint));

      if (isCronEndpoint) {
        // Les endpoints CRON sont protégés par CRON_SECRET, pas par CSRF
        return NextResponse.next();
      }

      // Vérifier CSRF pour les autres endpoints
      if (!isValidOrigin && !isValidReferer) {
        console.warn('[CSRF Protection] Blocked request from invalid origin:', {
          pathname,
          origin: requestOrigin,
          referer,
        });

        return NextResponse.json(
          { error: 'Invalid request origin' },
          { status: 403 }
        );
      }
    }
  }

  // 2. Headers de sécurité pour toutes les réponses
  const response = NextResponse.next();

  // Protection contre le clickjacking
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');

  // Empêche le sniffing MIME
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // Protection XSS pour les navigateurs anciens
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Politique de référent stricte
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy - Désactive les fonctionnalités inutiles
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );

  return response;
}

// Configuration du matcher pour appliquer le middleware
export const config = {
  matcher: [
    // Appliquer à toutes les routes sauf les fichiers statiques
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)).*)',
  ],
};
