import AgendaClient from '@/components/agenda/AgendaClient'

export default function AgendaPage() {
  return (
    <main className="min-h-screen bg-[#01030a] text-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        <AgendaClient />
      </div>
    </main>
  )
}
