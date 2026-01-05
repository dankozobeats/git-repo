'use client'

/**
 * Client formulaire création/édition habitude - Système d'onglets
 * Mode: 'create' ou 'edit'
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import HabitFormHeader from './HabitFormHeader'
import EssentialTab from './form/EssentialTab'
import AdvancedTab from './form/AdvancedTab'
import SummaryTab from './form/SummaryTab'
import CoachModal from './form/CoachModal'

type TabType = 'essential' | 'advanced' | 'summary'

type Category = {
  id: string
  name: string
  color: string | null
}

type HabitFormClientProps = {
  mode: 'create' | 'edit'
  initialHabit?: {
    id: string
    name: string
    icon: string | null
    color: string
    description: string | null
    type: 'good' | 'bad'
    tracking_mode: 'binary' | 'counter' | null
    daily_goal_value: number | null
    daily_goal_type: 'minimum' | 'maximum' | null
    category_id: string | null
    is_suspended: boolean | null
  }
  categories?: Category[]
}

const BAD_PRESETS = [
  { name: 'Fast-food du soir', icon: '🍔', color: '#ef4444' },
  { name: 'Scroll réseaux', icon: '📱', color: '#f97316' },
  { name: 'Snooze interminable', icon: '⏰', color: '#eab308' },
  { name: 'Procrastination', icon: '🛋️', color: '#a855f7' },
  { name: 'Cigarette impulsive', icon: '🚬', color: '#6b7280' },
  { name: 'Apéro quotidien', icon: '🍺', color: '#f59e0b' },
]

const GOOD_PRESETS = [
  { name: 'Session sport', icon: '💪', color: '#10b981' },
  { name: 'Lecture focus', icon: '📚', color: '#3b82f6' },
  { name: 'Méditation 10 min', icon: '🧘', color: '#8b5cf6' },
  { name: 'Eau (8 verres)', icon: '💧', color: '#06b6d4' },
  { name: 'Sommeil 8h', icon: '😴', color: '#6366f1' },
  { name: 'Fruits & légumes', icon: '🥗', color: '#22c55e' },
]

export default function HabitFormClient({
  mode,
  initialHabit,
  categories: initialCategories = [],
}: HabitFormClientProps) {
  const router = useRouter()

  // Tab state avec localStorage
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    if (typeof window !== 'undefined') {
      const storageKey = mode === 'create' ? 'habit-form-create-tab' : `habit-form-edit-tab-${initialHabit?.id}`
      const saved = localStorage.getItem(storageKey)
      if (saved === 'essential' || saved === 'advanced' || saved === 'summary') {
        return saved
      }
    }
    return 'essential'
  })

  // Habit state
  const [habitType, setHabitType] = useState<'bad' | 'good'>(initialHabit?.type || 'bad')
  const [name, setName] = useState(initialHabit?.name || '')
  const [icon, setIcon] = useState(initialHabit?.icon || '')
  const [color, setColor] = useState(initialHabit?.color || '#ef4444')
  const [description, setDescription] = useState(initialHabit?.description || '')
  const [trackingMode, setTrackingMode] = useState<'binary' | 'counter'>(
    initialHabit?.tracking_mode || 'binary'
  )
  const [dailyGoalValue, setDailyGoalValue] = useState(initialHabit?.daily_goal_value || 3)
  const [categoryId, setCategoryId] = useState(initialHabit?.category_id || '')
  const [isSuspended, setIsSuspended] = useState(initialHabit?.is_suspended || false)

  // Categories + Coach
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [isCoachModalOpen, setIsCoachModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const vagueKeywords = useMemo(
    () => ['habitude', 'truc', 'chose', 'améliorer', 'meilleur', 'projet'],
    []
  )
  const presets = habitType === 'bad' ? BAD_PRESETS : GOOD_PRESETS

  // Fetch categories si mode create (edit les reçoit déjà en props)
  useEffect(() => {
    if (mode === 'create') {
      const fetchCategories = async () => {
        const res = await fetch('/api/categories')
        if (!res.ok) return
        const data = await res.json()
        setCategories(data.categories || [])
      }
      fetchCategories()
    }
  }, [mode])

  // Persist activeTab dans localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storageKey = mode === 'create' ? 'habit-form-create-tab' : `habit-form-edit-tab-${initialHabit?.id}`
      localStorage.setItem(storageKey, activeTab)
    }
  }, [activeTab, mode, initialHabit?.id])

  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab)
  }, [])

  const handlePresetSelect = useCallback(
    (preset: typeof BAD_PRESETS[number]) => {
      setName(preset.name)
      setIcon(preset.icon)
      setColor(preset.color)
    },
    []
  )

  const handleCoachImprove = useCallback(
    (data: { name: string; description: string }) => {
      setName(data.name)
      setDescription(data.description)
    },
    []
  )

  const handleSubmit = useCallback(async () => {
    setIsLoading(true)

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setIsLoading(false)
      return
    }

    const habitData: Record<string, unknown> = {
      name,
      icon: icon || null,
      color,
      description: description || null,
      type: habitType,
      tracking_mode: trackingMode,
      category_id: categoryId || null,
    }

    if (trackingMode === 'counter') {
      habitData.daily_goal_type = habitType === 'good' ? 'minimum' : 'maximum'
      habitData.daily_goal_value = dailyGoalValue
    }

    if (mode === 'create') {
      habitData.user_id = user.id

      const { data, error } = await supabase.from('habits').insert(habitData).select('id').single()
      if (error || !data) {
        console.error('Error creating habit:', error)
        setIsLoading(false)
        return
      }

      router.push(`/?highlight=${data.id}#habit-card-${data.id}`)
      router.refresh()
    } else if (mode === 'edit' && initialHabit) {
      habitData.is_suspended = isSuspended

      const { error } = await supabase.from('habits').update(habitData).eq('id', initialHabit.id)
      if (error) {
        console.error('Error updating habit:', error)
        setIsLoading(false)
        return
      }

      router.push(`/habits/${initialHabit.id}`)
      router.refresh()
    }
  }, [
    mode,
    initialHabit,
    name,
    icon,
    color,
    description,
    habitType,
    trackingMode,
    dailyGoalValue,
    categoryId,
    isSuspended,
    router,
  ])

  return (
    <main className="min-h-screen bg-[#01030a] text-white">
      <HabitFormHeader
        mode={mode}
        habitName={mode === 'edit' ? initialHabit?.name : undefined}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onOpenCoach={() => setIsCoachModalOpen(true)}
      />

      <div className="mx-auto max-w-4xl">
        {activeTab === 'essential' && (
          <EssentialTab
            habitType={habitType}
            name={name}
            icon={icon}
            color={color}
            description={description}
            presets={presets}
            onHabitTypeChange={setHabitType}
            onNameChange={setName}
            onIconChange={setIcon}
            onColorChange={setColor}
            onDescriptionChange={setDescription}
            onPresetSelect={handlePresetSelect}
          />
        )}

        {activeTab === 'advanced' && (
          <AdvancedTab
            mode={mode}
            trackingMode={trackingMode}
            dailyGoalValue={dailyGoalValue}
            habitType={habitType}
            categoryId={categoryId}
            categories={categories}
            isSuspended={isSuspended}
            onTrackingModeChange={setTrackingMode}
            onDailyGoalValueChange={setDailyGoalValue}
            onCategoryIdChange={setCategoryId}
            onSuspendedChange={setIsSuspended}
          />
        )}

        {activeTab === 'summary' && (
          <SummaryTab
            mode={mode}
            habitType={habitType}
            name={name}
            icon={icon}
            color={color}
            description={description}
            trackingMode={trackingMode}
            dailyGoalValue={dailyGoalValue}
            categoryId={categoryId}
            vagueKeywords={vagueKeywords}
            isLoading={isLoading}
            onSubmit={handleSubmit}
          />
        )}
      </div>

      {/* Coach Modal */}
      <CoachModal
        isOpen={isCoachModalOpen}
        onClose={() => setIsCoachModalOpen(false)}
        name={name}
        description={description}
        trackingMode={trackingMode}
        dailyGoalValue={dailyGoalValue}
        onImprove={handleCoachImprove}
      />
    </main>
  )
}
