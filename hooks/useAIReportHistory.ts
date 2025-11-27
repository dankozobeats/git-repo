'use client'

/**
 * Description: Orchestrateur de l'historique IA côté client (chargement, état, actions, métriques).
 * Objectif: Exposer une API de page stable, mémoïser les listes dérivées et fiabiliser les callbacks.
 * Utilisation: const history = useAIReportHistory() dans une page client App Router.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'

import { formatDateHuman, formatDateKey } from '@/lib/date-utils'

export type ReportFilterValue = 'all' | '7' | '30' | '90'

export type AIReportRecord = {
  id: string
  created_at: string
  report: string
  archived_at?: string | null
  [key: string]: unknown
}

type ReportsState = {
  data: AIReportRecord[]
  loading: boolean
  error: string | null
}

type SelectionState = {
  date: string | null
  reportId: string | null
}

type AiModalState = {
  open: boolean
  title: string
  content: string | null
}

type UseAIReportHistoryResult = {
  loading: boolean
  error: string | null
  reports: AIReportRecord[]
  filteredReports: AIReportRecord[]
  reportsByDate: Record<string, AIReportRecord[]>
  reportsForSelectedDate: AIReportRecord[]
  filter: ReportFilterValue
  setFilter: (value: ReportFilterValue) => void
  sortAsc: boolean
  toggleSort: () => void
  selectedDate: string | null
  selectedReportId: string | null
  setSelectedReportId: (id: string | null) => void
  handleDayClick: (date: string) => void
  calendarModalOpen: boolean
  closeCalendarModal: () => void
  aiReportModalOpen: boolean
  aiReportModalContent: string | null
  aiReportModalTitle: string
  openAIReportModal: (report: AIReportRecord) => void
  closeAIReportModal: () => void
  requestDelete: (report: AIReportRecord) => void
  confirmDelete: () => Promise<void>
  cancelDelete: () => void
  deleteModalOpen: boolean
  archiveReport: (id: string) => Promise<void>
  loadReports: () => Promise<void>
}

const FILTER_DAY_MAPPING: Record<Exclude<ReportFilterValue, 'all'>, number> = {
  '7': 7,
  '30': 30,
  '90': 90,
}

const INITIAL_REPORTS_STATE: ReportsState = {
  data: [],
  loading: true,
  error: null,
}

const INITIAL_SELECTION: SelectionState = {
  date: null,
  reportId: null,
}

const INITIAL_AI_MODAL_STATE: AiModalState = {
  open: false,
  title: '',
  content: null,
}

export function useAIReportHistory(): UseAIReportHistoryResult {
  const [reportsState, setReportsState] = useState<ReportsState>(INITIAL_REPORTS_STATE)
  const [filter, setFilterState] = useState<ReportFilterValue>('all')
  const [sortAsc, setSortAsc] = useState(false)
  const [selection, setSelection] = useState<SelectionState>(INITIAL_SELECTION)
  const [calendarModalOpen, setCalendarModalOpen] = useState(false)
  const [aiReportModal, setAIReportModal] = useState<AiModalState>(INITIAL_AI_MODAL_STATE)
  const [deleteCandidate, setDeleteCandidate] = useState<AIReportRecord | null>(null)
  const rawReports = reportsState.data

  const loadReports = useCallback(async () => {
    setReportsState(prev => ({ ...prev, loading: true, error: null }))
    try {
      // Sécurité: l'API /api/ai-reports doit toujours valider le user_id côté serveur avant de répondre.
      const response = await fetch('/api/ai-reports')
      if (!response.ok) {
        throw new Error('Impossible de charger les rapports IA.')
      }
      const payload = await response.json()
      setReportsState({ data: Array.isArray(payload.reports) ? payload.reports : [], loading: false, error: null })
    } catch (err) {
      setReportsState(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Erreur inconnue.',
      }))
    }
  }, [])

  useEffect(() => {
    loadReports()
  }, [loadReports])

  const setFilter = useCallback((value: ReportFilterValue) => {
    setFilterState(value)
  }, [])

  const toggleSort = useCallback(() => {
    setSortAsc(prev => !prev)
  }, [])

  const filteredReports = useMemo(() => {
    if (filter === 'all') return rawReports
    const days = FILTER_DAY_MAPPING[filter]
    const minDate = new Date()
    minDate.setDate(minDate.getDate() - days)
    return rawReports.filter(report => new Date(report.created_at) >= minDate)
  }, [rawReports, filter])

  const sortedReports = useMemo(() => {
    return [...filteredReports].sort((a, b) => {
      const aTime = new Date(a.created_at).getTime()
      const bTime = new Date(b.created_at).getTime()
      return sortAsc ? aTime - bTime : bTime - aTime
    })
  }, [filteredReports, sortAsc])

  const reportsByDate = useMemo(() => {
    return sortedReports.reduce<Record<string, AIReportRecord[]>>((acc, report) => {
      const key = formatDateKey(report.created_at)
      if (!acc[key]) acc[key] = []
      acc[key].push(report)
      return acc
    }, {})
  }, [sortedReports])

  const reportsForSelectedDate = useMemo(() => {
    if (!selection.date) return []
    return reportsByDate[selection.date] ?? []
  }, [reportsByDate, selection.date])

  const handleDayClick = useCallback(
    (dateKey: string) => {
      const sameDayReports = reportsByDate[dateKey] ?? []
      setSelection({ date: dateKey, reportId: sameDayReports[0]?.id ?? null })
      setCalendarModalOpen(sameDayReports.length > 0)
    },
    [reportsByDate]
  )

  const closeCalendarModal = useCallback(() => {
    setCalendarModalOpen(false)
    setSelection(INITIAL_SELECTION)
  }, [])

  const setSelectedReportId = useCallback((id: string | null) => {
    setSelection(prev => ({ ...prev, reportId: id }))
  }, [])

  const openAIReportModal = useCallback((report: AIReportRecord) => {
    setAIReportModal({
      open: true,
      title: formatDateHuman(report.created_at, { includeTime: true }),
      content: report.report,
    })
  }, [])

  const closeAIReportModal = useCallback(() => {
    setAIReportModal(INITIAL_AI_MODAL_STATE)
  }, [])

  const archiveReport = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/ai-reports/${id}/archive`, { method: 'PATCH' })
      if (!response.ok) {
        throw new Error('Échec de l’archivage du rapport.')
      }
      setReportsState(prev => ({
        ...prev,
        data: prev.data.map(report => (report.id === id ? { ...report, archived_at: new Date().toISOString() } : report)),
      }))
    } catch (err) {
      setReportsState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Erreur lors de l’archivage.',
      }))
    }
  }, [])

  const requestDelete = useCallback((report: AIReportRecord) => {
    setDeleteCandidate(report)
  }, [])

  const confirmDelete = useCallback(async () => {
    if (!deleteCandidate) return
    try {
      const response = await fetch(`/api/ai-reports/${deleteCandidate.id}`, { method: 'DELETE' })
      if (!response.ok) {
        throw new Error('Impossible de supprimer ce rapport.')
      }
      setReportsState(prev => ({
        ...prev,
        data: prev.data.filter(report => report.id !== deleteCandidate.id),
      }))
    } catch (err) {
      setReportsState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Erreur lors de la suppression.',
      }))
    } finally {
      setDeleteCandidate(null)
    }
  }, [deleteCandidate])

  const cancelDelete = useCallback(() => {
    setDeleteCandidate(null)
  }, [])

  return {
    loading: reportsState.loading,
    error: reportsState.error,
    reports: sortedReports,
    filteredReports,
    reportsByDate,
    reportsForSelectedDate,
    filter,
    setFilter,
    sortAsc,
    toggleSort,
    selectedDate: selection.date,
    selectedReportId: selection.reportId,
    setSelectedReportId,
    handleDayClick,
    calendarModalOpen,
    closeCalendarModal,
    aiReportModalOpen: aiReportModal.open,
    aiReportModalContent: aiReportModal.content,
    aiReportModalTitle: aiReportModal.title,
    openAIReportModal,
    closeAIReportModal,
    requestDelete,
    confirmDelete,
    cancelDelete,
    deleteModalOpen: Boolean(deleteCandidate),
    archiveReport,
    loadReports,
  }
}
