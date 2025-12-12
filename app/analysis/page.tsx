import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PatternAnalysis } from '@/components/ai/PatternAnalysis'

export default async function AnalysisPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.id) {
    redirect('/login')
  }

  return (
    <main className="min-h-screen bg-[#05070f] px-4 py-10 text-white sm:px-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <header className="space-y-2 border-b border-white/5 pb-4 text-white/80">
          <p className="text-xs uppercase tracking-[0.4em] text-white/50">Coach IA</p>
          <h1 className="text-3xl font-semibold">Analyse de tes patterns</h1>
          <p className="text-sm text-white/60">
            Laisse l'IA décortiquer tes habitudes sur les 30 derniers jours et recevoir des suggestions vraiment
            personnalisées.
          </p>
        </header>
        <PatternAnalysis userId={user.id} />
      </div>
    </main>
  )
}
