'use client'

/**
 * Description: Page premium listant l'historique des rapports IA avec filtres, insights et actions rapides.
 * Objectif: Offrir une expérience Linear-like performante grâce aux hooks mémoïsés et aux composants optimisés.
 * Utilisation: Route client App Router /reports/history intégrant useAIReportHistory et les visualisations IA.
 */
import Link from 'next/link'
import {
  ArrowLeft,
  BarChart3,
  LibraryBig,
  LifeBuoy,
  Mail,
  MessageSquare,
  CalendarDays,
  CircleHelp,
  type LucideIcon,
} from 'lucide-react'
import { Suspense, lazy, useEffect, useMemo, useRef } from 'react'

import AIReportCard from '@/components/AIReportCard'
import AIReportFilters from '@/components/AIReportFilters'
import AIReportModal from '@/components/AIReportModal'
import DeleteConfirmModal from '@/components/DeleteConfirmModal'
import ReportModal from '@/components/ReportModal'
import { useAIReportHistory } from '@/hooks/useAIReportHistory'

const AIDisciplineScore = lazy(() => import('@/components/AIScoreCard'))
const GraphAIStats = lazy(() => import('@/components/GraphAIStats'))
const AIHeatmap = lazy(() => import('@/components/AIHeatmap'))
const AICalendarView = lazy(() => import('@/components/AICalendarView'))

type SupportCard = {
  title: string
  description: string
  badge: string
  actionLabel: string
  href: string
  icon: LucideIcon
}

const SUPPORT_CARDS: SupportCard[] = [
  {
    title: 'Assistance prioritaire',
    description: 'Escalade un incident critique ou signale un bug bloquant. Notre équipe te répond en moins de 2h ouvrées.',
    badge: 'Temps moyen : 1h47',
    actionLabel: 'Ouvrir un ticket',
    href: 'mailto:support@badhabit.app',
    icon: Mail,
  },
  {
    title: 'Chat temps réel',
    description: 'Discute avec un coach produit directement depuis Slack pour un accompagnement tactique.',
    badge: 'Lun → Ven · 9h - 19h',
    actionLabel: 'Rejoindre le Slack',
    href: 'https://slack.com/app_redirect?channel=badhabit-support',
    icon: MessageSquare,
  },
  {
    title: 'Session guidée',
    description: 'Planifie un créneau visio de 20 minutes pour revoir ta stratégie d’habitudes ou faire un audit.',
    badge: 'Créneaux quotidiens',
    actionLabel: 'Planifier un call',
    href: 'https://cal.com/badhabit/support',
    icon: CalendarDays,
  },
]

const FAQ_ITEMS: Array<{ question: string; answer: string; bullets?: string[] }> = [
  {
    question: 'Comment récupérer un rapport archivé ?',
    answer:
      'Depuis la bibliothèque, clique sur « Archivés » puis sélectionne le rapport à restaurer. Il sera réinjecté dans les dashboards instantanément.',
    bullets: ['Historique > Filtres > Etat = Archivés', 'Sélectionne le rapport', 'Clique sur « Restaurer »'],
  },
  {
    question: 'Mes données ne se synchronisent plus, que faire ?',
    answer:
      'Assure-toi que la session Supabase est active. Tu peux ouvrir /reports/dashboard dans un nouvel onglet, puis forcer un refresh. Si le problème persiste, contacte le support pour une régénération.',
  },
  {
    question: 'Puis-je exporter mes rapports en PDF ?',
    answer:
      'Oui. Clique sur « Exporter » depuis la carte d’un rapport pour générer un PDF signé. Tu peux aussi utiliser l’API /api/reports/pdf/[id] pour automatiser.',
  },
  {
    question: 'Comment changer la période analysée par défaut ?',
    answer:
      'Rends-toi dans Paramètres > Habitudes IA et définis la plage préférée. Les prochains rapports prendront automatiquement cette période.',
  },
]

export default function HistoryPage() {
  const pageRef = useRef<HTMLElement | null>(null)
  const {
    loading,
    error,
    reports,
    filter,
    setFilter,
    sortAsc,
    toggleSort,
    handleDayClick,
    calendarModalOpen,
    closeCalendarModal,
    selectedDate,
    reportsForSelectedDate,
    selectedReportId,
    setSelectedReportId,
    aiReportModalOpen,
    aiReportModalContent,
    aiReportModalTitle,
    openAIReportModal,
    closeAIReportModal,
    requestDelete,
    confirmDelete,
    cancelDelete,
    deleteModalOpen,
    archiveReport,
  } = useAIReportHistory()

  useEffect(() => {
    const node = pageRef.current
    if (!node) return
    node.classList.add('opacity-100', 'translate-y-0')
    node.classList.remove('opacity-0', 'translate-y-4')
  }, [])

  const showEmptyState = useMemo(() => !loading && reports.length === 0, [loading, reports.length])
  const heroStatus = loading ? 'Synchronisation en cours…' : 'Historique actualisé'

  // 🔥 NORMALISATION (Correction TS)

  // 🔥 Normalisation robuste – compatible tous cas Supabase
  const reportsNormalized = useMemo(
    () =>
      reports.map(r => {
        const stats = (r.stats as any) || {};

        return {
          created_at: r.created_at,
          stats: {
            goodLogs: typeof stats.goodLogs === 'number' ? stats.goodLogs : 0,
            discipline_score: typeof stats.discipline_score === 'number' ? stats.discipline_score : 0,
            currentStreak: typeof stats.currentStreak === 'number' ? stats.currentStreak : 0,
          },
        };
      }),
    [reports]
  );


  return (
    <main
      ref={pageRef}
      className="min-h-screen bg-gradient-to-br from-[#030511] via-[#050914] to-[#020308] text-white opacity-0 translate-y-4 transition-all duration-700"
    >
      <div className="mx-auto w-full max-w-6xl space-y-10 px-4 py-12 sm:px-6 lg:px-10">
        <header className="rounded-[40px] border border-white/10 bg-white/5 px-6 py-8 shadow-[0_30px_86px_rgba(1,3,10,0.45)] backdrop-blur-2xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link
              href="/report"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 transition hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Rapport en cours
            </Link>
            <Link
              href="/reports/dashboard"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-gradient-to-r from-[#4C6EF5]/80 to-[#A179FF]/80 px-5 py-2 text-sm font-semibold text-white transition hover:shadow-[0_12px_30px_rgba(76,110,245,0.35)]"
            >
              <BarChart3 className="h-4 w-4" />
              Dashboard IA
            </Link>
          </div>

          <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.55em] text-white/50">Historique IA</p>
              <h1 className="mt-3 flex items-center gap-3 text-4xl font-semibold tracking-tight text-white">
                <LibraryBig className="h-9 w-9 text-[#9C5CFF]" />
                Bibliothèque intelligente
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-white/70">
                Toutes tes analyses générées par l’assistant IA, filtrées et classées en temps réel avec actions rapides
                d’archivage, suppression et relecture.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white/70">
              {heroStatus}
            </div>
          </div>

          {error && (
            <p className="mt-6 rounded-3xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </p>
          )}
        </header>

        {/* ----- INSIGHTS ----- */}
        <section className="rounded-[36px] border border-white/8 bg-white/5 p-6 shadow-[0_25px_80px_rgba(1,4,12,0.4)] backdrop-blur-2xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.45em] text-white/50">Aperçu global</p>
              <h2 className="mt-2 text-2xl font-semibold">Insights automatiques</h2>
            </div>
            {loading && <span className="text-sm text-white/60">Chargement des métriques…</span>}
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="space-y-6">

              {/* SCORE */}
              <Suspense fallback={<ScoreSkeleton />}>
                <AIDisciplineScore reports={reportsNormalized} />
              </Suspense>

              {/* HEATMAP */}
              <Suspense fallback={<HeatmapSkeleton />}>
                <AIHeatmap reports={reportsNormalized} />
              </Suspense>

            </div>

            {/* CALENDRIER */}
            <div className="rounded-[30px] border border-white/8 bg-black/20 p-4">
              <Suspense fallback={<CalendarSkeleton />}>
                <AICalendarView reports={reportsNormalized} onDayClick={handleDayClick} />
              </Suspense>
            </div>
          </div>
        </section>

        {/* ----- GRAPH ----- */}
        <section className="space-y-6">
          <AIReportFilters filter={filter} onFilterChange={setFilter} sortAsc={sortAsc} onToggleSort={toggleSort} total={reports.length} />
          <div className="rounded-[32px] border border-white/8 bg-white/5 p-6 shadow-[0_20px_70px_rgba(1,3,10,0.45)] backdrop-blur-2xl">
            <Suspense fallback={<GraphSkeleton />}>
              <GraphAIStats reports={reportsNormalized} />
            </Suspense>
          </div>
        </section>

        {/* ----- LISTE DES RAPPORTS ----- */}
        <section className="space-y-4">

          {showEmptyState && (
            <div className="rounded-[32px] border border-dashed border-white/15 bg-white/5 px-6 py-10 text-center text-white/65">
              Aucun rapport ne correspond à ce filtre pour le moment.
            </div>
          )}

          {loading && !showEmptyState && <ReportCardSkeletonList />}

          {!loading &&
            reports.map(report => (
              <AIReportCard
                key={report.id}
                report={report}
                onArchive={archiveReport}
                onDelete={requestDelete}
                onPreview={openAIReportModal}
              />
            ))}
        </section>

        {/* ----- FAQ ----- */}
        <section
          id="faq"
          className="rounded-[40px] border border-white/10 bg-gradient-to-br from-white/5 via-white/3 to-transparent px-6 py-10 shadow-[0_25px_90px_rgba(2,5,18,0.55)] backdrop-blur-2xl"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.55em] text-white/60">Help & Support</p>
              <h2 className="mt-3 flex items-center gap-3 text-3xl font-semibold">
                <LifeBuoy className="h-7 w-7 text-[#5D8BFF]" />
                Assistance & FAQ
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-white/70">
                Trouve immédiatement la réponse à tes questions ou contacte notre équipe sans repasser par le coach.
              </p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-white/60">
              <CircleHelp className="h-4 w-4" />
              FAQ actualisée
            </span>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="space-y-4">
              {SUPPORT_CARDS.map(card => {
                const Icon = card.icon
                const isExternal = card.href.startsWith('http')

                return (
                  <a
                    key={card.title}
                    href={card.href}
                    target={isExternal ? '_blank' : undefined}
                    rel={isExternal ? 'noreferrer' : undefined}
                    className="group block rounded-[32px] border border-white/10 bg-white/[0.04] p-5 transition hover:-translate-y-1 hover:border-white/30"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-white/60">
                        {card.badge}
                      </span>
                      <Icon className="h-5 w-5 text-white/70" />
                    </div>
                    <p className="mt-4 text-lg font-semibold text-white">{card.title}</p>
                    <p className="mt-2 text-sm text-white/70">{card.description}</p>
                    <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-white">
                      {card.actionLabel}
                      <ArrowLeft className="h-4 w-4 rotate-180 transition group-hover:translate-x-1" />
                    </span>
                  </a>
                )
              })}
            </div>

            <div className="space-y-4">
              {FAQ_ITEMS.map(item => (
                <details
                  key={item.question}
                  className="group rounded-[28px] border border-white/10 bg-white/[0.03] p-5 text-white/80 transition open:border-white/30 open:bg-white/[0.06]"
                >
                  <summary className="flex cursor-pointer items-center justify-between gap-3 text-base font-semibold text-white">
                    {item.question}
                    <span className="rounded-full border border-white/15 bg-white/5 p-1.5">
                      <ArrowLeft className="h-4 w-4 rotate-180 transition group-open:-rotate-90" />
                    </span>
                  </summary>
                  <p className="mt-4 text-sm text-white/70">{item.answer}</p>
                  {item.bullets && (
                    <ul className="mt-3 space-y-1 text-sm text-white/60">
                      {item.bullets.map(step => (
                        <li key={step} className="flex items-start gap-2">
                          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-white/60" />
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </details>
              ))}
              <div className="rounded-[28px] border border-dashed border-white/15 bg-white/[0.02] p-5 text-sm text-white/70">
                Besoin d’une réponse personnalisée ? Écris-nous sur{' '}
                <a href="mailto:support@badhabit.app" className="text-white underline decoration-white/40 hover:decoration-white">
                  support@badhabit.app
                </a>{' '}
                ou déclenche un ticket prioritaire depuis l’appli mobile.
              </div>
            </div>
          </div>
        </section>
      </div>

      <ReportModal
        open={calendarModalOpen}
        date={selectedDate}
        reports={reportsForSelectedDate}
        selectedReportId={selectedReportId}
        onSelectReport={setSelectedReportId}
        onClose={closeCalendarModal}
      />

      <AIReportModal open={aiReportModalOpen} report={aiReportModalContent} title={aiReportModalTitle} onClose={closeAIReportModal} />

      <DeleteConfirmModal open={deleteModalOpen} onConfirm={confirmDelete} onCancel={cancelDelete} />
    </main>
  )
}

function ScoreSkeleton() {
  return (
    <div className="h-44 rounded-[30px] border border-white/10 bg-white/5 p-5 animate-pulse">
      <div className="h-5 w-32 rounded-full bg-white/10" />
      <div className="mt-6 h-10 w-24 rounded-full bg-white/15" />
      <div className="mt-4 h-3 w-3/4 rounded-full bg-white/10" />
    </div>
  )
}

function HeatmapSkeleton() {
  return (
    <div className="h-64 rounded-[30px] border border-white/10 bg-white/5 p-5 animate-pulse">
      <div className="grid h-full grid-cols-7 gap-2">
        {Array.from({ length: 35 }).map((_, index) => (
          <div key={index} className="h-6 w-full rounded-xl bg-white/10" />
        ))}
      </div>
    </div>
  )
}

function CalendarSkeleton() {
  return (
    <div className="flex h-full flex-col gap-4 animate-pulse">
      <div className="h-5 w-28 rounded-full bg-white/10" />
      <div className="flex-1 rounded-[24px] border border-white/10 bg-white/5" />
    </div>
  )
}

function GraphSkeleton() {
  return (
    <div className="h-72 animate-pulse">
      <div className="mb-4 h-6 w-48 rounded-full bg-white/10" />
      <div className="h-full rounded-[28px] border border-white/10 bg-white/5" />
    </div>
  )
}

function ReportCardSkeletonList() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="rounded-[30px] border border-white/10 bg-white/5 p-6 animate-pulse">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="h-4 w-32 rounded-full bg-white/10" />
            <div className="h-4 w-20 rounded-full bg-white/10" />
          </div>
          <div className="mt-5 space-y-3">
            <div className="h-3 w-full rounded-full bg-white/10" />
            <div className="h-3 w-3/4 rounded-full bg-white/10" />
            <div className="h-3 w-4/5 rounded-full bg-white/10" />
          </div>
          <div className="mt-6 flex gap-3">
            <div className="h-10 flex-1 rounded-2xl bg-white/10" />
            <div className="h-10 flex-1 rounded-2xl bg-white/10" />
            <div className="h-10 flex-1 rounded-2xl bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  )
}
