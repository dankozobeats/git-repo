import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { askAI } from '@/lib/ai'
import { getAIUserContext, formatAIContextPrompt } from '@/lib/ai/context'

/**
 * GET: Récupère l'historique des messages d'une conversation.
 * POST: Envoie un nouveau message et génère une réponse IA.
 */
export async function GET(
    _: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
        .from('ai_messages')
        .select('*')
        .eq('conversation_id', id)
        .order('created_at', { ascending: true })

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { message } = await request.json()
    if (!message) {
        return NextResponse.json({ error: 'Message requis' }, { status: 400 })
    }

    // 1. Sauvegarder le message de l'utilisateur
    const { error: userMsgError } = await supabase
        .from('ai_messages')
        .insert({
            conversation_id: id,
            role: 'user',
            content: message,
        })

    if (userMsgError) {
        return NextResponse.json({ error: userMsgError.message }, { status: 500 })
    }

    try {
        // 2. Récupérer le contexte utilisateur
        const contextData = await getAIUserContext(user.id)
        const contextPrompt = formatAIContextPrompt(contextData)

        // 3. Récupérer l'historique récent pour la cohérence
        const fullPrompt = `${contextPrompt}

PERSONNALITÉ DU COACH :
- Tu es le Coach BadHabit. Ton ton est celui d'un ami honnête, motivant et un peu sarcastique mais bienveillant.
- Tu n'es pas un robot : discute normalement avec l'utilisateur. Tu peux "argumenter" et parler de tout et de rien s'il le souhaite.
- Sois flexible : si l'utilisateur défend une habitude (comme aimer le café), ne sois pas obtus. Trouve un terrain d'entente.
- STRUCTURE : Utilise le Markdown (titres, listes) uniquement quand c'est pertinent pour clarifier une réponse complexe ou un rapport. Pour une discussion simple, parle normalement sans forcer les titres.

CONSIGNE SPÉCIFIQUE : Toujours vérifier la date de "Hier" dans le contexte pour répondre aux questions sur la veille.

UTILISATEUR: ${message}
`

        // 4. Appeler l'IA avec instructions Super-Coach
        const habitsContext = contextData.recentLogs.length > 0
            ? `HABITUDES ET LEURS IDs :\n${contextData.recentLogs.map(l => l.split(':')[0]).join('\n')}`
            : ""

        const systemInstructions = `
TU ES LE SUPER-COACH BADHABIT (Mode Action & Mémoire actif).

--- RÉPONSE CONVERSATIONNELLE ---
- Parle normalement, argumente, sois un ami motivant.

--- MÉMOIRE BIOGRAPHIQUE (FACT EXTRACTION) ---
- Si l'utilisateur te dit quelque chose de personnel sur lui, sauvegarde-le : [SAVE_FACT: le contenu]

--- ACTIONS IA (TOOL CALLING) ---
${habitsContext}
- Pour créer un rappel : [ACTION: CREATE_REMINDER | habit: ID_OU_NOM | time: HH:mm]
`
        const aiReply = await askAI(`${systemInstructions}\n\n${fullPrompt}`, user.id)

        // 5. Post-traitement : Extraction des Faits et Actions
        const factMatches = aiReply.match(/\[SAVE_FACT:\s*(.*?)\]/g)
        if (factMatches) {
            for (const match of factMatches) {
                const factContent = match.replace(/\[SAVE_FACT:\s*|\]/g, '').trim()
                if (factContent) {
                    await supabase.from('user_ai_facts').upsert({
                        user_id: user.id,
                        content: factContent,
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'user_id,content' })
                }
            }
        }

        // Nettoyer la réponse pour l'utilisateur (on cache les tags techniques)
        const cleanReply = aiReply.replace(/\[SAVE_FACT:.*?\]/g, '').trim()

        // 6. Sauvegarder la réponse de l'IA
        const { data: aiMsg, error: aiMsgError } = await supabase
            .from('ai_messages')
            .insert({
                conversation_id: id,
                role: 'assistant',
                content: cleanReply,
            })
            .select()
            .single()

        if (aiMsgError) {
            throw new Error(aiMsgError.message)
        }

        // 7. Mettre à jour le timestamp de la conversation
        await supabase
            .from('ai_conversations')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', id)

        return NextResponse.json(aiMsg)
    } catch (error: any) {
        console.error('[Chat API Error]:', error)
        return NextResponse.json({ error: 'Erreur lors de la réponse IA' }, { status: 500 })
    }
}
