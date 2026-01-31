'use client'

import { useState, useEffect, useRef } from 'react'
import { Bot, User, Send, Loader2, RefreshCcw, ArrowLeft, X, Plus } from 'lucide-react'
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
    const textareaRef = useRef<HTMLTextAreaElement>(null)
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

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
        }
    }, [input])

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

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
        if (!customMessage) {
            setInput('')
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto'
            }
        }
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
        <div className="flex flex-col h-full bg-white/[0.02] sm:rounded-2xl border-b sm:border border-white/5 overflow-hidden shadow-2xl backdrop-blur-md">
            {/* Header Discussion (Premium Messaging Style) */}
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.04] backdrop-blur-3xl sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="w-12 h-12 bg-sky-500/20 rounded-lg flex items-center justify-center border border-sky-400/30 shadow-[0_8px_20px_rgba(56,189,248,0.2)]">
                            <Bot className="w-6 h-6 text-sky-400" />
                        </div>
                        <div className="absolute -right-1 -bottom-1 w-4 h-4 bg-[#0d0f17] rounded-full flex items-center justify-center border-2 border-[#0d0f17]">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-white tracking-tight">Coach IA</h3>
                            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-1.5 py-0.5 rounded-md">Online</span>
                        </div>
                        <p className="text-[11px] text-white/40 font-medium">Assistant Personnel de Discipline</p>
                    </div>
                </div>
                {!conversationId && (
                    <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] font-black uppercase tracking-widest bg-white/5 text-white/40 px-3 py-1.5 rounded-full border border-white/5">Auto-Reflect</span>
                    </div>
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
                        <div className="flex flex-wrap justify-center gap-2 max-w-sm mx-auto">
                            {quickPrompts.map(p => (
                                <button
                                    key={p.label}
                                    onClick={() => handleSend(undefined, p.text)}
                                    className="px-5 py-2.5 bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 rounded-xl text-xs font-semibold transition-all hover:scale-105 active:scale-95 backdrop-blur-md shadow-lg"
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {messages.map((m, idx) => {
                    const isLastFromRole = idx === messages.length - 1 || messages[idx + 1].role !== m.role
                    const isFirstFromRole = idx === 0 || messages[idx - 1].role !== m.role

                    return (
                        <div
                            key={m.id}
                            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300 ${isLastFromRole ? 'mb-4' : 'mb-1'}`}
                        >
                            <div className={`flex gap-3 max-w-[88%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'} items-end`}>
                                {/* Avatar (only shown on last message of a group for assistant, or first for user if needed, but keeping it clean for now) */}
                                {m.role === 'assistant' && isLastFromRole ? (
                                    <div className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center bg-sky-500/10 text-sky-400 border border-sky-400/20 mb-1">
                                        <Bot size={14} />
                                    </div>
                                ) : (
                                    <div className="w-8 h-8 flex-shrink-0" />
                                )}

                                <div className={`px-4 py-3 rounded-xl text-sm leading-relaxed shadow-xl transition-all ${m.role === 'user'
                                    ? `bg-gradient-to-br from-sky-600 to-indigo-600 text-white shadow-indigo-500/10 ${isLastFromRole ? 'rounded-tr-none' : ''}`
                                    : `bg-white/[0.05] text-white/90 border border-white/10 backdrop-blur-xl ${isLastFromRole ? 'rounded-tl-none' : ''}`
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
                    )
                })}

                {isTyping && (
                    <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex gap-3 items-end max-w-[85%]">
                            <div className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center bg-sky-500/10 text-sky-400 border border-sky-400/20 mb-1">
                                <Bot size={14} />
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-none px-4 py-3.5 flex items-center gap-1.5 backdrop-blur-xl">
                                <span className="w-1.5 h-1.5 bg-sky-400/80 rounded-full animate-bounce [animation-delay:-0.3S]"></span>
                                <span className="w-1.5 h-1.5 bg-sky-400/80 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="w-1.5 h-1.5 bg-sky-400/80 rounded-full animate-bounce"></span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input (Premium Pill Design) */}
            <div className="p-4 sm:p-6 bg-gradient-to-t from-[#0d0f17] via-[#0d0f17]/80 to-transparent pb-10 sm:pb-6">
                <form
                    onSubmit={handleSend}
                    className="relative max-w-2xl mx-auto flex items-end gap-2 bg-white/[0.03] border border-white/10 rounded-2xl p-1.5 pr-2 focus-within:bg-white/[0.05] focus-within:border-white/20 transition-all duration-300 shadow-2xl backdrop-blur-2xl"
                >
                    <button
                        type="button"
                        className="p-3 text-white/30 hover:text-sky-400 transition-colors"
                    >
                        <Plus size={20} />
                    </button>

                    <textarea
                        ref={textareaRef}
                        rows={1}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Message Coach..."
                        className="flex-1 bg-transparent border-none px-2 py-3 text-sm focus:outline-none focus:ring-0 transition-all placeholder:text-white/20 resize-none max-h-32 overflow-y-auto scrollbar-none"
                        disabled={isTyping}
                    />

                    <button
                        type="submit"
                        disabled={!input.trim() || isTyping}
                        className={`p-3 rounded-full transition-all duration-300 shadow-lg active:scale-95 ${input.trim() && !isTyping ? 'bg-sky-500 text-white shadow-sky-500/20 scale-100' : 'bg-white/5 text-white/20 scale-90'
                            }`}
                    >
                        <Send size={18} />
                    </button>
                </form>
                <p className="mt-3 text-[10px] text-center text-white/20 font-medium tracking-wide">
                    IA Discipline · Réponses instantanées
                </p>
            </div>
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
        <div className="bg-white/[0.03] backdrop-blur-2xl border border-sky-500/20 rounded-xl p-5 space-y-4 animate-in fade-in slide-in-from-top-2 shadow-2xl overflow-hidden relative group">
            <div className="absolute top-0 left-0 w-1 h-full bg-sky-500 group-hover:w-2 transition-all" />

            <div className="flex items-center gap-2 text-sky-400">
                <div className="p-1.5 bg-sky-500/20 rounded-lg">
                    <Bot size={16} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Proposition d'Action</span>
            </div>

            <div className="space-y-1">
                <p className="text-sm text-white/90 leading-relaxed font-medium">
                    Programmer un rappel pour <span className="text-sky-400 font-bold">{habitValue}</span> à <span className="text-sky-400 font-bold">{time}</span> ?
                </p>
            </div>

            <button
                onClick={handleConfirm}
                disabled={status === 'loading'}
                className="w-full py-3 bg-sky-500 hover:bg-sky-400 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-lg shadow-sky-500/20 active:scale-[0.98]"
            >
                {status === 'loading' ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                Confirmer le rappel
            </button>
            {status === 'error' && <p className="text-[10px] text-red-400 text-center font-bold">⚠️ Erreur lors de la création</p>}
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
        <div className="bg-white/[0.03] backdrop-blur-2xl border border-red-500/20 rounded-xl p-5 space-y-4 animate-in fade-in slide-in-from-top-2 shadow-2xl overflow-hidden relative group">
            <div className="absolute top-0 left-0 w-1 h-full bg-red-600 group-hover:w-2 transition-all" />

            <div className="flex items-center gap-2 text-red-500">
                <div className="p-1.5 bg-red-500/10 rounded-lg">
                    <Bot size={16} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Action suggérée</span>
            </div>

            <div className="space-y-1">
                <p className="text-sm text-white/90 leading-relaxed font-medium">
                    Voulez-vous vraiment <span className="text-red-500 font-bold uppercase tracking-tight">supprimer</span> ce rappel ?
                </p>
            </div>

            <button
                onClick={handleConfirm}
                disabled={status === 'loading'}
                className="w-full py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-lg shadow-red-500/20 active:scale-[0.98]"
            >
                {status === 'loading' ? <Loader2 className="animate-spin" size={16} /> : <X size={16} />}
                Confirmer la suppression
            </button>
            {status === 'error' && <p className="text-[10px] text-red-400 text-center font-bold">⚠️ Erreur lors de la suppression</p>}
        </div>
    )
}
