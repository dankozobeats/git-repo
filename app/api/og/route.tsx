import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

/**
 * API Route - Génération d'Images OpenGraph Dynamiques
 * 
 * Génère des images OG 1200×630 avec style glassmorphism pour le partage social.
 * 
 * @example
 * /api/og?title=Faire du sport
 * /api/og?title=Méditation&subtitle=Habitude positive
 * 
 * @param title - Titre principal (défaut: "BadHabit Tracker")
 * @param subtitle - Sous-titre (défaut: "Track, Improve, Evolve")
 * 
 * @returns ImageResponse - Image PNG 1200×630
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)

        // Extraction des paramètres avec valeurs par défaut
        const title = searchParams.get('title') || 'BadHabit Tracker'
        const subtitle = searchParams.get('subtitle') || 'Track • Improve • Evolve'

        // Génération de l'image avec ImageResponse (Vercel OG)
        return new ImageResponse(
            (
                <div
                    style={{
                        height: '100%',
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#0c0f1a',
                        backgroundImage: 'linear-gradient(135deg, #0c0f1a 0%, #1a1a2e 100%)',
                        position: 'relative',
                    }}
                >
                    {/* Effet glassmorphism - Blob bleu */}
                    <div
                        style={{
                            position: 'absolute',
                            top: '10%',
                            left: '10%',
                            width: '400px',
                            height: '400px',
                            background: 'radial-gradient(circle, rgba(77, 208, 251, 0.15) 0%, transparent 70%)',
                            borderRadius: '50%',
                            filter: 'blur(60px)',
                        }}
                    />

                    {/* Effet glassmorphism - Blob rouge */}
                    <div
                        style={{
                            position: 'absolute',
                            bottom: '10%',
                            right: '10%',
                            width: '350px',
                            height: '350px',
                            background: 'radial-gradient(circle, rgba(255, 77, 77, 0.12) 0%, transparent 70%)',
                            borderRadius: '50%',
                            filter: 'blur(60px)',
                        }}
                    />

                    {/* Contenu principal */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '80px',
                            zIndex: 1,
                        }}
                    >
                        {/* Logo/Emoji */}
                        <div
                            style={{
                                fontSize: '120px',
                                marginBottom: '40px',
                            }}
                        >
                            🔥
                        </div>

                        {/* Titre principal */}
                        <div
                            style={{
                                fontSize: title.length > 30 ? '56px' : '72px',
                                fontWeight: 'bold',
                                color: '#ffffff',
                                textAlign: 'center',
                                marginBottom: '20px',
                                maxWidth: '1000px',
                                lineHeight: 1.2,
                                textShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
                            }}
                        >
                            {title}
                        </div>

                        {/* Sous-titre */}
                        <div
                            style={{
                                fontSize: '36px',
                                color: '#4DD0FB',
                                textAlign: 'center',
                                fontWeight: '500',
                                maxWidth: '800px',
                            }}
                        >
                            {subtitle}
                        </div>

                        {/* Badge branding */}
                        <div
                            style={{
                                marginTop: '60px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '16px 32px',
                                background: 'rgba(255, 255, 255, 0.05)',
                                borderRadius: '100px',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                backdropFilter: 'blur(10px)',
                            }}
                        >
                            <div style={{ fontSize: '24px', color: '#ffffff' }}>
                                BadHabit Tracker
                            </div>
                        </div>
                    </div>
                </div>
            ),
            {
                width: 1200,
                height: 630,
            }
        )
    } catch (error) {
        console.error('[OG API] Error generating image:', error)
        return new Response('Failed to generate OpenGraph image', { status: 500 })
    }
}
