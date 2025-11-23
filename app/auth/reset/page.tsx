import Link from 'next/link'
import ResetForm from './ResetForm'

export default function ResetPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-950 px-4 py-8">
      <div className="w-full max-w-sm space-y-6 rounded-2xl border border-white/10 bg-[#11131c] p-6 text-white shadow-2xl shadow-black/40">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold">Réinitialiser le mot de passe</h1>
          <p className="text-sm text-white/60">Entre ton email pour recevoir un lien sécurisé.</p>
        </div>
        <ResetForm />
        <p className="text-center text-xs text-white/60">
          <Link href="/auth/sign-in" className="font-semibold text-white">
            Retour à la connexion
          </Link>
        </p>
      </div>
    </main>
  )
}
