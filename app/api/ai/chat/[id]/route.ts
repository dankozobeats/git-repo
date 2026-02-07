import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { askAI } from '@/lib/ai'
import { getAIUserContext, formatAIContextPrompt } from '@/lib/ai/context'
import { getTodayDateISO } from '@/lib/date-utils'

// Vercel Hobby max = 10s, Pro = 60s
export const maxDuration = 10

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

export async function DELETE(
    _: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Since we have ON DELETE CASCADE in the database, 
    // deleting the conversation will auto-delete messages.
    const { error } = await supabase
        .from('ai_conversations')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
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
        const habitsContext = contextData.habitsList.length > 0
            ? `HABITUDES DISPONIBLES (Utilise STRICTEMENT ces IDs pour les rappels) :\n${contextData.habitsList.map(h => `- ${h.name} : ${h.id}`).join('\n')}`
            : "Aucune habitude configurée."

        const systemInstructions = `
TU ES LE SUPER-COACH BADHABIT (Mode Action & Mémoire actif).

--- RÉPONSE CONVERSATIONNELLE ---
- Parle normalement, argumente, sois un ami motivant.
- PRIORITÉ À L'ACTION : Si l'utilisateur demande de loguer, annuler, ou créer quelque chose, EXECUTE l'action immédiatement via un tag [ACTION:...]. Ne refuse jamais une demande de tracking direct.

--- MÉMOIRE BIOGRAPHIQUE (FACT EXTRACTION) ---
- Si l'utilisateur te dit quelque chose de personnel sur lui, sauvegarde-le : [SAVE_FACT: le contenu]

--- ACTIONS IA (TOOL CALLING) ---
${habitsContext}

- Pour créer un rappel : [ACTION: CREATE_REMINDER | habit: ID_UUID_DE_L_HABITUDE | time: HH:mm]
  *IMPORTANT: Utilise toujours l'UUID fourni ci-dessus pour le champ 'habit'. Ne mets JAMAIS le nom.*

- Pour supprimer un rappel : [ACTION: DELETE_REMINDER | id: ID_UUID_DU_RAPPEL]
  *Utilise l'UUID du rappel trouvé dans la section 'Rappels programmés' du contexte. INTERDIT d'inventer un ID ou d'utiliser le placeholder.*

- Pour logger une habitude (Succès ou Craquage) : [ACTION: LOG_HABIT | habit: ID_UUID | type: success/craquage]
  *IMPORTANT: Utilise 'success' pour les bonnes habitudes et 'craquage' pour les mauvaises.*

- Pour créer une nouvelle habitude : [ACTION: CREATE_HABIT | name: TEXT | type: good/bad | color: HEX_OU_NOM]
  *Exemple: [ACTION: CREATE_HABIT | name: Sport matinal | type: good | color: #4f46e5]*

- Pour annuler/archiver une habitude : [ACTION: ARCHIVE_HABIT | habit: ID_UUID]
- Pour supprimer la trace d'aujourd'hui (dé-logger) : [ACTION: UNLOG_HABIT | habit: ID_UUID]
- Pour afficher la carte d'une habitude (détails, stats) : [ACTION: SHOW_HABIT | habit: ID_UUID]

--- DISCRETION TECHNIQUE (CRITIQUE) ---
- INTERDICTION ABSOLUE de mentionner des IDs (UUID), des noms de fonctions, ou des tags techniques [ACTION:...] dans ta réponse.
- Ne décris pas techniquement ce que tu fais (ex: évite "Je vais logger...", "J'utilise l'outil..."). Contente-toi de confirmer le résultat de manière naturelle.

CONSIGNE CRITIQUE : Toujours prioriser les faits de la "MÉMOIRE BIOGRAPHIQUE" pour personnaliser la réponse (prénom, goûts, dates importantes).
`
        const aiReply = await askAI(`${systemInstructions}\n\n${fullPrompt}`, user.id)

        // 5. Post-traitement : Extraction des Faits et Actions
        // On utilise un regex plus souple qui accepte "ACTION:" optionnel et des espaces variables
        const tagRegex = /\[\s*(?:ACTION:\s*)?([A-Z_]+)\s*(?::|\|)\s*(.*?)\]/gi
        let match
        const actionsToExcludeFromCleaning: string[] = []

        while ((match = tagRegex.exec(aiReply)) !== null) {
            const fullTag = match[0]
            const type = match[1].toUpperCase()
            const rawParams = match[2]

            if (type === 'SAVE_FACT') {
                const factContent = rawParams.replace(/\]$/, '').trim()
                if (factContent) {
                    await supabase.from('user_ai_facts').upsert({
                        user_id: user.id,
                        content: factContent,
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'user_id,content' })
                }
            } else {
                // Parse params: habit: ID | type: success etc.
                const params: Record<string, string> = {}
                rawParams.split('|').forEach(p => {
                    const [k, v] = p.split(':').map(s => s.trim())
                    if (k && v) params[k] = v
                })

                try {
                    if (type === 'CREATE_REMINDER') {
                        const { habit, time } = params
                        if (habit && time) {
                            await supabase.from('reminders').insert({
                                user_id: user.id,
                                habit_id: habit,
                                time_local: time,
                                channel: 'push',
                                active: true,
                                weekday: new Date().getDay()
                            })
                        }
                    } else if (type === 'DELETE_REMINDER') {
                        const { id: reminderId } = params
                        if (reminderId) {
                            await supabase.from('reminders').delete().eq('id', reminderId).eq('user_id', user.id)
                        }
                    } else if (type === 'LOG_HABIT') {
                        const { habit: habitId, type: logType } = params
                        if (habitId && logType) {
                            const date = getTodayDateISO()
                            if (logType === 'success') {
                                await supabase.from('logs').upsert({
                                    user_id: user.id,
                                    habit_id: habitId,
                                    completed_date: date,
                                    value: 1
                                }, { onConflict: 'habit_id,completed_date' })
                            } else if (logType === 'craquage') {
                                await supabase.from('habit_events').insert({
                                    user_id: user.id,
                                    habit_id: habitId,
                                    event_date: date,
                                    occurred_at: new Date().toISOString()
                                })
                            }
                        }
                    } else if (type === 'CREATE_HABIT') {
                        const { name, type: habitType, color = '#4f46e5' } = params
                        if (name && habitType) {
                            await supabase.from('habits').insert({
                                user_id: user.id,
                                name,
                                type: habitType === 'good' ? 'good' : 'bad',
                                color,
                                is_archived: false
                            })
                        }
                    } else if (type === 'ARCHIVE_HABIT') {
                        const { habit: habitId } = params
                        if (habitId) {
                            await supabase.from('habits').update({ is_archived: true }).eq('id', habitId).eq('user_id', user.id)
                        }
                    } else if (type === 'UNLOG_HABIT') {
                        const { habit: habitId } = params
                        if (habitId) {
                            const date = getTodayDateISO()
                            await supabase.from('logs').delete().eq('habit_id', habitId).eq('user_id', user.id).eq('completed_date', date)
                            await supabase.from('habit_events').delete().eq('habit_id', habitId).eq('user_id', user.id).eq('event_date', date)
                        }
                    } else if (type === 'SHOW_HABIT') {
                        // Pour SHOW_HABIT, on ne supprime pas le tag mais on le normalise pour l'UI
                        const habitId = params.habit || rawParams.trim()
                        if (habitId) {
                            const normalizedTag = `[ACTION: SHOW_HABIT | habit: ${habitId}]`
                            actionsToExcludeFromCleaning.push(normalizedTag)
                        }
                    }
                } catch (err) {
                    console.error(`[AI Action Error] ${type}:`, err)
                }
            }
        }

        // Nettoyer la réponse pour l'utilisateur
        let cleanReply = aiReply
            // D'abord on remplace tous les tags détectés (on les cache temporairement s'ils doivent rester)
            .replace(tagRegex, (match, type, params) => {
                const normalizedType = type.toUpperCase()
                if (normalizedType === 'SHOW_HABIT') {
                    // Extraire l'ID peu importe le format
                    const idMatch = params.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)
                    return idMatch ? `__KEEP_SHOW_HABIT_${idMatch[0]}__` : ''
                }
                return ''
            })

        // Supprimer les UUIDs qui auraient pu fuiter
        cleanReply = cleanReply.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '')

        // Supprimer les phrases techniques types et nettoyer les espaces
        cleanReply = cleanReply
            .replace(/(avec l'id|l'uuid est|tool:|action:|\[.*?\])/gi, '')
            .replace(/\s+/g, ' ')
            .trim()

        // Restaurer les tags à garder dans un format propre
        cleanReply = cleanReply.replace(/__KEEP_SHOW_HABIT_(.*?)__/g, '[ACTION: SHOW_HABIT | habit: $1]')

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
        console.error('[Chat API Error]:', error?.message || error)

        // Message d'erreur plus utile pour le debugging
        let errorMessage = 'Erreur lors de la réponse IA'
        if (error?.message?.includes('AI_API_URL') || error?.message?.includes('AI_API_KEY')) {
            errorMessage = 'Configuration IA manquante (AI_API_URL ou AI_API_KEY)'
        } else if (error?.message?.includes('timeout') || error?.message?.includes('Timeout') || error?.name === 'AbortError') {
            errorMessage = 'Timeout - Le serveur IA met trop de temps à répondre'
        } else if (error?.message?.includes('fetch')) {
            errorMessage = 'Impossible de contacter le serveur IA'
        } else if (error?.message) {
            errorMessage = error.message
        }

        return NextResponse.json({ error: errorMessage }, { status: 500 })
    }
}
