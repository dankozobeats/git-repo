'use client'

import { useState, useEffect, useRef } from 'react'
import { Bot, User, Send, Loader2, RefreshCcw, ArrowLeft, X } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { useRouter } from 'next/navigation'

interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    created_at: string
}

interface CoachChatProps {
    conversationId: string | null
    onNewConversation: () => Promise<string>
}

export default function CoachChat({ conversationId, onNewConversation }: CoachChatProps) {
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isTyping, setIsTyping] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const router = useRouter()

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        if (conversationId) {
            fetchMessages()
        } else {
            setMessages([])
        }
    }, [conversationId])

    useEffect(scrollToBottom, [messages, isTyping])

    const fetchMessages = async () => {
        if (!conversationId) return
        setIsLoading(true)
        try {
            const res = await fetch(`/api/ai/chat/${conversationId}`)
            const data = await res.json()
            if (Array.isArray(data)) {
                setMessages(data)
            }
        } catch (err) {
            console.error('Error fetching messages:', err)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSend = async (e?: React.FormEvent, customMessage?: string) => {
        e?.preventDefault()
        const messageToSend = customMessage || input
        if (!messageToSend.trim() || isTyping) return

        let currentConversationId = conversationId
        if (!currentConversationId) {
            currentConversationId = await onNewConversation()
        }

        const tempUserMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: messageToSend,
            created_at: new Date().toISOString(),
        }

        setMessages(prev => [...prev, tempUserMsg])
        if (!customMessage) setInput('')
        setIsTyping(true)

        try {
            const res = await fetch(`/api/ai/chat/${currentConversationId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: messageToSend }),
            })

            if (!res.ok) throw new Error('Failed to send message')

            const aiMsg = await res.json()
            setMessages(prev => [...prev, aiMsg])
        } catch (err) {
            console.error('Error sending message:', err)
            setMessages(prev => [
                ...prev,
                {
                    id: 'error',
                    role: 'assistant',
                    content: "Désolé, j'ai rencontré une erreur. Peux-tu réessayer ?",
                    created_at: new Date().toISOString(),
                },
            ])
        } finally {
            setIsTyping(false)
        }
    }

    const quickPrompts = [
        { label: "📊 Rapport hebdo", text: "Fais-moi un rapport sur ma semaine" },
        { label: "💡 Conseils", text: "Donne-moi 3 conseils pour améliorer ma discipline" },
        { label: "📉 Analyse rechute", text: "Pourquoi est-ce que je craque le plus souvent ?" },
    ]

    return (
        <div className="flex flex-col h-full bg-white/[0.02] sm:rounded-[32px] border-b sm:border border-white/5 overflow-hidden shadow-2xl backdrop-blur-md">
            {/* Header Discussion */}
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.03]">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-sky-500/20 rounded-xl">
                        <Bot className="w-5 h-5 text-sky-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold">Coach Interactif</h3>
                        <p className="text-[10px] text-white/40 uppercase tracking-widest">IA Discipline Assistant</p>
                    </div>
                </div>
                {!conversationId && (
                    <span className="text-[10px] px-2 py-1 rounded-full bg-white/10 text-white/60">Nouvelle session</span>
                )}
            </div>

            {/* Zone Messages */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 sm:space-y-6 scrollbar-thin scrollbar-thumb-white/10">
                {messages.length === 0 && !isLoading && !isTyping && (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-6">
                        <div className="w-20 h-20 bg-sky-500/10 rounded-full flex items-center justify-center animate-pulse">
                            <Bot className="w-10 h-10 text-sky-500" />
                        </div>
                        <div className="max-w-xs">
                            <h4 className="text-lg font-medium text-white/90">Comment puis-je t'aider aujourd'hui ?</h4>
                            <p className="text-sm text-white/50 mt-2">
                                Je peux analyser tes habitudes, préparer un rapport ou te motiver à garder le cap.
                            </p>
                        </div>
                        <div className="flex flex-wrap justify-center gap-2">
                            {quickPrompts.map(p => (
                                <button
                                    key={p.label}
                                    onClick={() => handleSend(undefined, p.text)}
                                    className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-xs transition-all hover:scale-105 active:scale-95"
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {messages.map((m) => (
                    <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} group animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                        <div className={`flex gap-3 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs ${m.role === 'user' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                                }`}>
                                {m.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                            </div>
                            <div className={`rounded-2xl px-3 py-2 sm:px-4 sm:py-3 text-sm leading-relaxed shadow-lg ${m.role === 'user'
                                ? 'bg-indigo-600 text-white rounded-tr-none'
                                : 'bg-white/5 text-white/90 border border-white/10 rounded-tl-none prose prose-invert max-w-none'
                                }`}>
                                {m.role === 'user' ? (
                                    m.content
                                ) : (
                                    <div className="space-y-4">
                                        <div className="markdown-content space-y-3 prose prose-invert prose-sm max-w-none 
                        [&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4 
                        [&_h2]:text-base [&_h2]:font-bold [&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:text-sky-400
                        [&_p]:mb-2 [&_strong]:text-sky-300">
                                            <ReactMarkdown>
                                                {m.content.replace(/\[ACTION:.*?\]/g, '')}
                                            </ReactMarkdown>
                                        </div>
                                        {/* Action Cards */}
                                        {m.content.includes('[ACTION: CREATE_REMINDER') && (
                                            <ActionReminderCard content={m.content} />
                                        )}
                                        {m.content.includes('[ACTION: DELETE_REMINDER') && (
                                            <ActionDeleteReminderCard content={m.content} />
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {isTyping && (
                    <div className="flex justify-start animate-in fade-in duration-300">
                        <div className="flex gap-3 max-w-[85%]">
                            <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center bg-sky-500/20 text-sky-400 border border-sky-500/30">
                                <Bot size={14} />
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce"></span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-3 sm:p-4 bg-black/20 border-t border-white/5 pb-8 sm:pb-4">
                <div className="relative flex items-center gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Pose-moi une question ou demande un rapport..."
                        className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all placeholder:text-white/20"
                        disabled={isTyping}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isTyping}
                        className="p-3 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 disabled:hover:bg-sky-500 rounded-xl transition-all shadow-lg shadow-sky-500/20 active:scale-95"
                    >
                        <Send size={18} className="text-white" />
                    </button>
                </div>
                <p className="mt-2 text-[10px] text-center text-white/30">
                    L'IA peut faire des erreurs. Vérifie les informations importantes.
                </p>
            </form>
        </div>
    )
}

function ActionReminderCard({ content }: { content: string }) {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
    const actionMatch = content.match(/\[ACTION: CREATE_REMINDER \| habit: (.*?) \| time: (.*?)\]/)

    if (!actionMatch) return null

    const habitValue = actionMatch[1]
    const time = actionMatch[2]

    const handleConfirm = async () => {
        setStatus('loading')
        try {
            const now = new Date()
            const today = now.toISOString().split('T')[0]

            // Si l'IA a mis une date au format DD-MM-YYYY HH:mm ou similaire, on tente de la normaliser
            let finalTimeLocal = ''
            if (time.includes('-') || time.includes('/')) {
                // On essaie de voir si c'est déjà une date complète. 
                // Si ça ressemble à YYYY-MM-DD HH:mm, on garde.
                if (/^\d{4}-\d{2}-\d{2}/.test(time)) {
                    finalTimeLocal = time
                } else if (/^\d{2}-\d{2}-\d{4}/.test(time)) {
                    // Format FR: DD-MM-YYYY -> YYYY-MM-DD
                    const parts = time.split(' ')
                    const dateParts = parts[0].split('-')
                    finalTimeLocal = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]} ${parts[1] || '00:00'}`
                } else {
                    finalTimeLocal = time // Tentative directe
                }
            } else {
                finalTimeLocal = `${today} ${time}`
            }

            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(habitValue)

            const payload = {
                habit_id: isUUID ? habitValue : null,
                time_local: finalTimeLocal,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                schedule: 'daily',
                channel: 'push',
                active: true
            }

            console.log('[CoachChat] Sending Reminder Payload:', payload)

            const res = await fetch('/api/reminders/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })
            if (!res.ok) {
                const errData = await res.json()
                console.error('Reminder API error:', errData)
                throw new Error('Failed')
            }
            setStatus('success')
        } catch (err) {
            console.error('Error creating reminder:', err)
            setStatus('error')
        }
    }

    if (status === 'success') {
        return (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-center gap-2 text-emerald-400 text-xs animate-in zoom-in-95">
                <Bot size={14} />
                <span>Rappel programmé avec succès !</span>
            </div>
        )
    }

    return (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2 text-sky-400">
                <Bot size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">Action suggérée</span>
            </div>
            <p className="text-sm text-white/80">Programmer un rappel pour **{habitValue}** à **{time}** ?</p>
            <button
                onClick={handleConfirm}
                disabled={status === 'loading'}
                className="w-full py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
            >
                {status === 'loading' ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />}
                Confirmer le rappel
            </button>
            {status === 'error' && <p className="text-[10px] text-red-400 text-center">Erreur lors de la création</p>}
        </div>
    )
}

function ActionDeleteReminderCard({ content }: { content: string }) {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
    const actionMatch = content.match(/\[ACTION: DELETE_REMINDER \| id: (.*?)\]/)

    if (!actionMatch) return null

    const reminderId = actionMatch[1]
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(reminderId)

    if (!isUUID) return null

    const handleConfirm = async () => {
        setStatus('loading')
        try {
            const res = await fetch(`/api/reminders/${reminderId}`, {
                method: 'DELETE',
            })
            if (!res.ok) {
                const errData = await res.json()
                console.error('Delete API error:', errData)
                throw new Error('Failed')
            }
            setStatus('success')
        } catch (err) {
            console.error(err)
            setStatus('error')
        }
    }

    if (status === 'success') {
        return (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center gap-2 text-red-400 text-xs animate-in zoom-in-95">
                <Bot size={14} />
                <span>Rappel supprimé avec succès.</span>
            </div>
        )
    }

    return (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2 text-red-400">
                <Bot size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">Action suggérée</span>
            </div>
            <p className="text-sm text-white/80">Voulez-vous vraiment **supprimer** ce rappel ?</p>
            <button
                onClick={handleConfirm}
                disabled={status === 'loading'}
                className="w-full py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
            >
                {status === 'loading' ? <Loader2 className="animate-spin" size={14} /> : <X size={14} />}
                Confirmer la suppression
            </button>
            {status === 'error' && <p className="text-[10px] text-red-400 text-center">Erreur lors de la suppression</p>}
        </div>
    )
}
