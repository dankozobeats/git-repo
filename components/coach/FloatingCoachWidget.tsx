'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Bot, X, MessageSquare, Maximize2, Minimize2 } from 'lucide-react'
import CoachChat from './CoachChat'

export default function FloatingCoachWidget() {
    const pathname = usePathname()
    const [isOpen, setIsOpen] = useState(false)
    const [isMinimized, setIsMinimized] = useState(false)
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null)

    // Persist open/closed state
    useEffect(() => {
        const saved = localStorage.getItem('coach-widget-open')
        if (saved === 'true') setIsOpen(true)

        // Also try to find the latest conversation if it exists
        const fetchLatest = async () => {
            try {
                const res = await fetch('/api/ai/chat')
                const data = await res.json()
                if (Array.isArray(data) && data.length > 0) {
                    setActiveConversationId(data[0].id)
                }
            } catch (e) {
                console.error('Error fetching latest conversation for widget:', e)
            }
        }
        fetchLatest()
    }, [])

    const toggleOpen = () => {
        const next = !isOpen
        setIsOpen(next)
        localStorage.setItem('coach-widget-open', String(next))
        if (!next) setIsMinimized(false)
    }

    const handleNewConversation = async () => {
        try {
            const res = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: `Discussion du ${new Date().toLocaleDateString()}` }),
            })
            const newConv = await res.json()
            setActiveConversationId(newConv.id)
            return newConv.id
        } catch (err) {
            console.error('Error creating conversation:', err)
            return ''
        }
    }

    // Hide if on dashboard-old
    if (pathname === '/dashboard-old') {
        return null
    }

    if (!isOpen) {
        return (
            <button
                onClick={toggleOpen}
                className="fixed bottom-6 right-6 z-[2000] p-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-2xl shadow-indigo-600/40 transition-all hover:scale-110 active:scale-95 group"
                aria-label="Ouvrir le Coach IA"
            >
                <MessageSquare className="w-6 h-6 group-hover:hidden" />
                <Bot className="w-6 h-6 hidden group-hover:block animate-bounce" />
            </button>
        )
    }

    return (
        <div
            className={`fixed z-[2000] flex flex-col transition-all duration-300 ease-out shadow-[0_20px_60px_rgba(0,0,0,0.5)] border-white/10 bg-[#020712] overflow-hidden 
                ${isMinimized
                    ? 'bottom-6 right-6 h-16 w-64 border rounded-3xl'
                    : 'bottom-0 right-0 h-full w-full sm:bottom-6 sm:right-6 sm:h-[600px] sm:w-[400px] sm:max-w-[calc(100vw-3rem)] sm:border sm:rounded-[32px]'
                }`}
        >
            {/* Widget Header */}
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.03] backdrop-blur-3xl shrink-0 cursor-pointer" onClick={() => isMinimized && setIsMinimized(false)}>
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/20 rounded-xl">
                        <Bot className="w-4 h-4 text-indigo-400" />
                    </div>
                    <span className="text-sm font-semibold">Coach IA</span>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}
                        className="p-2 text-white/40 hover:text-white transition-colors"
                    >
                        {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); toggleOpen(); }}
                        className="p-2 text-white/40 hover:text-red-400 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>

            {/* Chat Content */}
            <div className={`flex-1 overflow-hidden transition-opacity duration-200 ${isMinimized ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                <CoachChat
                    conversationId={activeConversationId}
                    onNewConversation={handleNewConversation}
                />
            </div>
        </div>
    )
}
