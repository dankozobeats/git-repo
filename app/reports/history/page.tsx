'use client'

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Trash2,
  Archive,
  ArrowLeft,
  LibraryBig,
  ArrowUpDown,
  FileDown,
  GitCompare,
  BarChart3
} from "lucide-react"

import GraphAIStats from "@/components/GraphAIStats"
import AIDisciplineScore from "@/components/AIScoreCard"
import AIHeatmap from "@/components/AIHeatmap"
import AICalendarView from "@/components/AICalendarView"

export default function HistoryPage() {
  const [reports, setReports] = useState<any[]>([])
  const [filter, setFilter] = useState("all")
  const [sortAsc, setSortAsc] = useState(false)
  const [selected, setSelected] = useState<string[]>([])

  async function loadReports() {
    const res = await fetch("/api/ai-reports")
    const data = await res.json()

    let items = data.reports || []

    if (filter !== "all") {
      const days = Number(filter)
      const minDate = new Date()
      minDate.setDate(minDate.getDate() - days)
      items = items.filter((r: any) => new Date(r.created_at) >= minDate)
    }

    items.sort((a: any, b: any) =>
      sortAsc
        ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    setReports(items)
  }

  useEffect(() => {
    loadReports()
  }, [filter, sortAsc])

  return (
    <main>
      <h1>Historique</h1>
    </main>
  )
}
