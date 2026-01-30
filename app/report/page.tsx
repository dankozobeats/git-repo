'use client'

/**
 * Premium Coach IA page transformed into a stateful interactive chat experience.
 * Users can chat with the AI and trigger reports directly from the discussion.
 */

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, Bot, History, PlusCircle, MessageSquare, Trash2 } from 'lucide-react'
import CoachChat from '@/components/coach/CoachChat'

interface Conversation {
  id: string
  title: string
  updated_at: string
}

export default function ReportPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/ai/chat')
      const data = await res.json()
      if (Array.isArray(data)) {
        setConversations(data)
        // Auto-select latest if none active
        if (!activeConversationId && data.length > 0) {
          setActiveConversationId(data[0].id)
        }
      }
    } catch (err) {
      console.error('Error fetching conversations:', err)
    } finally {
      setIsLoading(false)
    }
  }, [activeConversationId])

  useEffect(() => {
    fetchConversations()
  }, [])

  const handleNewConversation = async () => {
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: `Discussion du ${new Date().toLocaleDateString()}` }),
      })
      const newConv = await res.json()
      setConversations(prev => [newConv, ...prev])
      setActiveConversationId(newConv.id)
      return newConv.id
    } catch (err) {
      console.error('Error creating conversation:', err)
      return ''
    }
  }

  const handleDeleteConversation = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!confirm('Supprimer cette conversation définitivement ?')) return

    try {
      const res = await fetch(`/api/ai/chat/${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setConversations(prev => prev.filter(c => c.id !== id))
        if (activeConversationId === id) {
          setActiveConversationId(null)
        }
      }
    } catch (err) {
      console.error('Error deleting conversation:', err)
    }
  }

  return (
    <main className="relative h-screen flex flex-col bg-[#020712] text-white overflow-hidden">
      {/* Background radial effects */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.1),transparent_45%),radial-gradient(circle_at_bottom,_rgba(236,72,153,0.06),transparent_40%)]" />

      {/* Header compact */}
      <header className="relative border-b border-white/5 bg-white/[0.02] backdrop-blur-3xl shrink-0">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2 rounded-full border border-white/10 text-white/60 hover:text-white hover:border-white/30 transition-all"
            >
              <ArrowLeft size={18} />
            </Link>
            <div className="flex items-center gap-3">
              <div className="bg-white/10 p-2 rounded-xl">
                <Bot className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h1 className="text-lg font-semibold tracking-tight">Coach IA</h1>
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/30">Interactive Discipline Suite</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/reports/history"
              className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs font-medium text-white/70 hover:bg-white/10 transition-all"
            >
              <History size={14} />
              Bibliothèque
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content (Dashboard style) */}
      <div className="relative flex-1 flex overflow-hidden max-w-7xl mx-auto w-full px-4 py-6 gap-6">

        {/* Sidebar Historique Chat */}
        <aside className="hidden lg:flex flex-col w-72 shrink-0 gap-4">
          <button
            onClick={handleNewConversation}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold transition-all shadow-lg shadow-indigo-600/20"
          >
            <PlusCircle size={18} />
            Nouvelle discussion
          </button>

          <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-white/5">
            <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest px-2 mb-2">Historique récent</p>
            {isLoading ? (
              [1, 2, 3].map(i => <div key={i} className="h-12 w-full bg-white/5 animate-pulse rounded-xl" />)
            ) : conversations.length > 0 ? (
              conversations.map(conv => (
                <div
                  key={conv.id}
                  className="group relative"
                >
                  <button
                    onClick={() => setActiveConversationId(conv.id)}
                    className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-left transition-all pr-12 ${activeConversationId === conv.id
                      ? 'bg-white/10 text-white ring-1 ring-white/20'
                      : 'text-white/40 hover:bg-white/5 hover:text-white/70'
                      }`}
                  >
                    <MessageSquare size={16} className={activeConversationId === conv.id ? 'text-indigo-400' : 'text-white/20'} />
                    <span className="text-xs font-medium truncate">{conv.title}</span>
                  </button>
                  <button
                    onClick={(e) => handleDeleteConversation(e, conv.id)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 opacity-0 group-hover:opacity-100 hover:text-red-400 text-white/20 transition-all"
                    title="Supprimer la conversation"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            ) : (
              <p className="text-xs text-white/20 text-center py-4">Aucune discussion</p>
            )}
          </div>
        </aside>

        {/* Chat Section */}
        <section className="flex-1 flex flex-col h-full overflow-hidden">
          <CoachChat
            conversationId={activeConversationId}
            onNewConversation={handleNewConversation}
          />
        </section>
      </div>
    </main>
  )
}
