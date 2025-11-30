// Page d'aide et support - Fournit documentation et FAQ pour les utilisateurs.

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { HelpCircle, Mail, MessageCircle, Book, Zap } from 'lucide-react'

export const metadata = {
    title: 'Aide & Support | BadHabit Tracker',
    description: 'Documentation, FAQ et support pour BadHabit Tracker',
}

export default async function AidePage() {
    // Vérifie l'authentification
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    return (
        <main className="min-h-screen bg-[#0c0f1a] text-[#E0E0E0]">
            <div className="mx-auto max-w-5xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-4 py-2 text-sm font-semibold text-white/70 transition hover:border-white/40 hover:text-white"
                    >
                        <span aria-hidden>←</span>
                        Retour au Dashboard
                    </Link>
                    <h1 className="text-3xl font-bold text-white">Aide & Support</h1>
                </div>

                {/* Cartes d'aide rapide */}
                <div className="grid gap-6 md:grid-cols-3">
                    <QuickHelpCard
                        icon={<Book className="h-6 w-6" />}
                        title="Documentation"
                        description="Guides complets pour utiliser BadHabit Tracker"
                        href="#documentation"
                    />
                    <QuickHelpCard
                        icon={<MessageCircle className="h-6 w-6" />}
                        title="FAQ"
                        description="Réponses aux questions fréquentes"
                        href="#faq"
                    />
                    <QuickHelpCard
                        icon={<Mail className="h-6 w-6" />}
                        title="Contact"
                        description="Besoin d'aide personnalisée ?"
                        href="#contact"
                    />
                </div>

                {/* Section Documentation */}
                <section id="documentation" className="scroll-mt-6 space-y-6">
                    <h2 className="text-2xl font-bold text-white">📚 Documentation</h2>

                    <DocSection
                        title="Comment créer une habitude ?"
                        content={
                            <>
                                <p>1. Cliquez sur le bouton <strong>"+ Ajouter une habitude"</strong> dans le dashboard</p>
                                <p>2. Choisissez le type : <strong>Bonne habitude</strong> (à encourager) ou <strong>Mauvaise habitude</strong> (à réduire)</p>
                                <p>3. Donnez un nom clair et une description (optionnel)</p>
                                <p>4. Sélectionnez une icône et une couleur pour la reconnaître facilement</p>
                                <p>5. Choisissez le mode de suivi :</p>
                                <ul className="ml-6 list-disc space-y-1">
                                    <li><strong>Binaire</strong> : Fait / Pas fait (ex: méditation quotidienne)</li>
                                    <li><strong>Compteur</strong> : Nombre d'occurrences (ex: 8 verres d'eau par jour)</li>
                                </ul>
                            </>
                        }
                    />

                    <DocSection
                        title="Comment logger une habitude ?"
                        content={
                            <>
                                <p>Depuis le dashboard, cliquez sur le bouton <strong>"Valider"</strong> à côté de l'habitude.</p>
                                <p>Pour les compteurs, vous pouvez incrémenter plusieurs fois jusqu'à atteindre votre objectif quotidien.</p>
                                <p className="mt-2 text-sm text-[#4DD0FB]">💡 Astuce : Les stats se mettent à jour en temps réel !</p>
                            </>
                        }
                    />

                    <DocSection
                        title="Comment configurer des rappels ?"
                        content={
                            <>
                                <p>1. Ouvrez la page de détails d'une habitude</p>
                                <p>2. Dans la section <strong>"Rappels"</strong>, activez les notifications push</p>
                                <p>3. Configurez l'heure et la récurrence (une fois, quotidien, hebdomadaire)</p>
                                <p>4. Cliquez sur <strong>"Créer le rappel"</strong></p>
                                <p className="mt-2 text-sm text-yellow-400">⚠️ Vous devez autoriser les notifications dans votre navigateur</p>
                            </>
                        }
                    />

                    <DocSection
                        title="Comment voir mes statistiques ?"
                        content={
                            <>
                                <p>Plusieurs façons de consulter vos stats :</p>
                                <ul className="ml-6 list-disc space-y-1">
                                    <li><strong>Dashboard</strong> : Vue d'ensemble quotidienne (bonnes actions vs craquages)</li>
                                    <li><strong>Historique</strong> : Calendrier complet de vos logs</li>
                                    <li><strong>Stats détaillées</strong> : Graphiques et tendances par habitude</li>
                                    <li><strong>Page habitude</strong> : Streak actuel, total de logs, historique</li>
                                </ul>
                            </>
                        }
                    />
                </section>

                {/* Section FAQ */}
                <section id="faq" className="scroll-mt-6 space-y-6">
                    <h2 className="text-2xl font-bold text-white">❓ Questions Fréquentes</h2>

                    <FAQItem
                        question="Pourquoi mes rappels ne fonctionnent pas ?"
                        answer="Vérifiez que vous avez autorisé les notifications dans les paramètres de votre navigateur. Sur mobile, assurez-vous que l'application web est ajoutée à l'écran d'accueil (PWA)."
                    />

                    <FAQItem
                        question="Puis-je modifier une habitude après création ?"
                        answer="Oui ! Cliquez sur l'habitude pour accéder à sa page de détails, puis utilisez le bouton 'Modifier' pour changer le nom, l'icône, la couleur ou le mode de suivi."
                    />

                    <FAQItem
                        question="Comment archiver une habitude ?"
                        answer="Dans la page de détails de l'habitude, cliquez sur 'Archiver'. L'habitude n'apparaîtra plus dans le dashboard mais ses données seront conservées dans l'historique."
                    />

                    <FAQItem
                        question="Que signifie le 'streak' ?"
                        answer="Le streak représente le nombre de jours consécutifs où vous avez validé une habitude. C'est un excellent indicateur de constance !"
                    />

                    <FAQItem
                        question="Puis-je exporter mes données ?"
                        answer="Cette fonctionnalité est en développement. Vous pourrez bientôt exporter vos données au format CSV ou JSON."
                    />

                    <FAQItem
                        question="L'application fonctionne-t-elle hors ligne ?"
                        answer="Partiellement. Vous pouvez consulter vos habitudes hors ligne, mais la synchronisation nécessite une connexion internet."
                    />
                </section>

                {/* Section Contact */}
                <section id="contact" className="scroll-mt-6 space-y-4">
                    <h2 className="text-2xl font-bold text-white">📧 Besoin d'aide ?</h2>
                    <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 text-center">
                        <Mail className="mx-auto mb-4 h-12 w-12 text-[#4DD0FB]" />
                        <h3 className="mb-2 text-xl font-semibold text-white">Contactez le support</h3>
                        <p className="mb-4 text-white/70">
                            Une question qui n'est pas dans la FAQ ? Envoyez-nous un email.
                        </p>
                        <a
                            href="mailto:noreply@automationpro.cloud"
                            className="inline-flex items-center gap-2 rounded-2xl bg-[#4DD0FB] px-6 py-3 font-semibold text-[#0c0f1a] transition hover:bg-[#3DBFEB]"
                        >
                            <Mail className="h-5 w-5" />
                            noreply@automationpro.cloud
                        </a>
                    </div>
                </section>

                {/* Section Raccourcis */}
                <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#1E1E1E] via-[#1A1A1A] to-[#151515] p-6">
                    <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                        <Zap className="h-5 w-5 text-yellow-400" />
                        Raccourcis utiles
                    </h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <ShortcutLink href="/habits/new" label="Créer une habitude" />
                        <ShortcutLink href="/reports/history" label="Voir l'historique" />
                        <ShortcutLink href="/habits/stats" label="Stats détaillées" />
                        <ShortcutLink href="/settings" label="Paramètres" />
                    </div>
                </section>
            </div>
        </main>
    )
}

// Composants utilitaires

function QuickHelpCard({ icon, title, description, href }: { icon: React.ReactNode; title: string; description: string; href: string }) {
    return (
        <a
            href={href}
            className="group flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-6 transition hover:border-white/20 hover:bg-white/[0.04]"
        >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#4DD0FB]/10 text-[#4DD0FB] transition group-hover:bg-[#4DD0FB]/20">
                {icon}
            </div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <p className="text-sm text-white/60">{description}</p>
        </a>
    )
}

function DocSection({ title, content }: { title: string; content: React.ReactNode }) {
    return (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
            <h3 className="mb-4 text-xl font-semibold text-white">{title}</h3>
            <div className="space-y-2 text-white/80">{content}</div>
        </div>
    )
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
    return (
        <details className="group rounded-2xl border border-white/10 bg-white/[0.02] p-6 transition hover:bg-white/[0.04]">
            <summary className="cursor-pointer text-lg font-semibold text-white marker:text-[#4DD0FB]">
                {question}
            </summary>
            <p className="mt-3 text-white/70">{answer}</p>
        </details>
    )
}

function ShortcutLink({ href, label }: { href: string; label: string }) {
    return (
        <Link
            href={href}
            className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm font-medium text-white/80 transition hover:bg-white/[0.06] hover:text-white"
        >
            {label}
            <span className="text-white/40">→</span>
        </Link>
    )
}
