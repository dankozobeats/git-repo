import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'

type StatsPayload = {
  totalCount?: number
  last7DaysCount?: number
  currentStreak?: number
  todayCount?: number
  monthPercentage?: number
}

const openai =
  process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== ''
    ? new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      })
    : null

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const { data: habit } = await supabase
    .from('habits')
    .select('id, name, type, goal_value, goal_type, goal_description')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!habit) {
    return NextResponse.json({ error: 'Habitude introuvable' }, { status: 404 })
  }

  let body: {
    tone?: 'gentle' | 'balanced' | 'direct'
    focus?: 'mindset' | 'strategy' | 'celebration'
    stats?: StatsPayload
  } = {}

  try {
    body = await request.json()
  } catch {
    body = {}
  }

  const { tone = 'balanced', focus = 'mindset', stats = {} } = body

  const messages = buildPrompt({
    habitName: habit.name,
    habitType: habit.type as 'good' | 'bad',
    stats,
    goalDescription: habit.goal_description,
    goalType: habit.goal_type,
    goalValue: habit.goal_value,
    tone,
    focus,
  })

  if (!openai) {
    return NextResponse.json({
      message:
        "Pas d'API OpenAI configurée. Imagine un coach virtuel qui dirait : respire, fais un point en 5 minutes et relance la dynamique. (Configure OPENAI_API_KEY pour un vrai message ✨)",
      tone,
      focus,
      stats,
      fallback: true,
    })
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.7,
    })

    const coachMessage =
      response.choices?.[0]?.message?.content?.trim() ||
      "Le coach n'a rien trouvé à dire 🤐"

    return NextResponse.json({
      message: coachMessage,
      tone,
      focus,
      stats,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('coach:openai', error)
    return NextResponse.json(
      {
        error: 'Impossible de contacter le coach IA',
        details: error instanceof Error ? error.message : undefined,
      },
      { status: 500 }
    )
  }
}

function buildPrompt({
  habitName,
  habitType,
  stats,
  goalDescription,
  goalType,
  goalValue,
  tone,
  focus,
}: {
  habitName: string
  habitType: 'good' | 'bad'
  stats: StatsPayload
  goalDescription: string | null
  goalType: string | null
  goalValue: number | null
  tone: 'gentle' | 'balanced' | 'direct'
  focus: 'mindset' | 'strategy' | 'celebration'
}) {
  const toneLabel =
    tone === 'gentle'
      ? 'Ton doux, rassurant et encourageant.'
      : tone === 'direct'
        ? 'Ton direct, franc-parler mais toujours bienveillant.'
        : 'Ton motivateur, équilibré.'

  const focusLabel =
    focus === 'strategy'
      ? 'Propose des actions concrètes et tactiques.'
      : focus === 'celebration'
        ? 'Met l’accent sur les victoires et la fierté.'
        : 'Travaille surtout sur le mindset et la motivation.'

  const goalLine = goalDescription
    ? `Objectif: ${goalDescription} (${goalType || 'non défini'} ${
        goalValue ?? ''
      })`
    : 'Pas de description d’objectif.'

  const statLines = [
    `Habitude: ${habitName} (${habitType === 'good' ? 'bonne' : 'mauvaise'})`,
    `Total 28j: ${stats.totalCount ?? 0}`,
    `7 derniers jours: ${stats.last7DaysCount ?? 0}`,
    `Streak actuel: ${stats.currentStreak ?? 0}`,
    `Aujourd’hui: ${stats.todayCount ?? 0}`,
    `Progression mensuelle: ${stats.monthPercentage ?? 0}%`,
  ].join('\n')

  const context = `${toneLabel}\n${focusLabel}\n${goalLine}\n${statLines}`

  return [
    {
      role: 'system',
      content:
        "Tu es un coach personnel francophone spécialisé dans les habitudes. Tu donnes des conseils courts (70-120 mots), structurés en 2-3 phrases maximum. Termine par une action concrète ou un mantra.",
    },
    { role: 'user', content: context },
  ]
}
