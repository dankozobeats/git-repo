'use client'

import { Brain, Sparkles, TrendingUp, ChevronRight } from 'lucide-react'

type StrategyBriefingProps = {
    briefing: string | null
    isLoading?: boolean
}

export function StrategyBriefing({ briefing, isLoading }: StrategyBriefingProps) {
    if (isLoading) {
        return (
            <div className="animate-pulse rounded-3xl border border-white/10 bg-white/5 p-6">
                <div className="mb-4 h-6 w-48 rounded bg-white/10" />
                <div className="space-y-2">
                    <div className="h-4 w-full rounded bg-white/5" />
                    <div className="h-4 w-5/6 rounded bg-white/5" />
                    <div className="h-4 w-4/6 rounded bg-white/5" />
                </div>
            </div>
        )
    }

    if (!briefing) return null

    return (
        <div className="relative overflow-hidden rounded-3xl border border-blue-500/20 bg-gradient-to-br from-blue-600/10 via-transparent to-purple-600/10 p-6 shadow-xl backdrop-blur-sm">
            <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl" />

            <div className="relative">
                <div className="mb-4 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400">
                        <Brain className="h-5 w-5" />
                    </div>
                    <h2 className="text-xl font-bold text-white">Strategy Briefing</h2>
                    <span className="ml-auto rounded-full bg-blue-500/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-300 border border-blue-500/20">
                        Powered by AI Intelligence
                    </span>
                </div>

                <div className="prose prose-invert max-w-none">
                    <p className="text-lg leading-relaxed text-blue-50/90 italic">
                        "{briefing}"
                    </p>
                </div>

                <div className="mt-6 flex items-center gap-4 border-t border-white/5 pt-4">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                        <TrendingUp className="h-3.5 w-3.5" />
                        Analyse de trajectoire confirmée
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-400/60">
                        <Sparkles className="h-3.5 w-3.5" />
                        Basé sur vos notes & déclencheurs
                    </div>
                </div>
            </div>
        </div>
    )
}
