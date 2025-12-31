import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },

  // Headers de sécurité pour toutes les routes
  async headers() {
    return [
      {
        // Appliquer à toutes les routes
        source: '/:path*',
        headers: [
          // HSTS - Force HTTPS pendant 2 ans
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          // Empêche le préchargement DNS non désiré
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          // Protection clickjacking (déjà dans middleware mais doublon pour sécurité)
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          // Empêche MIME sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Politique de référent
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Content Security Policy - Politique stricte
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js nécessite unsafe-eval/inline
              "style-src 'self' 'unsafe-inline'", // Tailwind nécessite unsafe-inline
              "img-src 'self' data: https: blob:",
              "font-src 'self' data:",
              "connect-src 'self' https://*.supabase.co https://ai.automationpro.cloud wss://*.supabase.co",
              "frame-ancestors 'self'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
