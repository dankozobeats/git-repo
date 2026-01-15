/**
 * Types pour le nouveau système Trackables + Events + Decisions
 * Basé sur le modèle proposé par ChatGPT
 */

export type TrackableType = 'habit' | 'state'

export type EventKind = 'check' | 'observe'

export type DecisionType = 'resist' | 'relapse' | 'delay' | 'replace' | 'other'

// ============================================
// 1. TRACKABLE (Habitude ou État)
// ============================================

export interface Trackable {
  id: string
  user_id: string
  type: TrackableType
  name: string
  description?: string | null
  icon?: string | null
  color?: string | null
  is_priority: boolean
  target_per_day?: number | null
  unit?: string | null
  tags?: string[] | null
  created_at: string
  updated_at: string
  archived_at?: string | null
}

export interface CreateTrackablePayload {
  type: TrackableType
  name: string
  description?: string
  icon?: string
  color?: string
  is_priority?: boolean
  target_per_day?: number
  unit?: string
  tags?: string[]
}

// ============================================
// 2. TRACKABLE EVENT (Log)
// ============================================

export interface TrackableEvent {
  id: string
  user_id: string
  trackable_id: string
  kind: EventKind
  occurred_at: string
  value_int?: number | null
  value_float?: number | null
  meta_json?: Record<string, any>
  created_at: string
}

export interface CreateEventPayload {
  trackable_id: string
  kind: EventKind
  occurred_at?: string
  value_int?: number
  value_float?: number
  meta_json?: Record<string, any>
}

// Métadonnées spécifiques pour les états
export interface StateEventMeta {
  intensity?: number // 1-5
  context?: string // "stress" | "ennui" | "fatigue" | "promo" | "social" | "autre"
  trigger?: string
  notes?: string
}

// Métadonnées spécifiques pour les habitudes
export interface HabitEventMeta {
  duration_minutes?: number
  quality?: number // 1-5
  notes?: string
}

// ============================================
// 3. DECISION (Réponse à un état)
// ============================================

export interface Decision {
  id: string
  user_id: string
  state_event_id: string
  decision: DecisionType
  amount?: number | null
  delay_minutes?: number | null
  replacement_action?: string | null
  meta_json?: Record<string, any>
  created_at: string
}

export interface CreateDecisionPayload {
  state_event_id: string
  decision: DecisionType
  amount?: number
  delay_minutes?: number
  replacement_action?: string
  meta_json?: Record<string, any>
}

// ============================================
// 4. VUES AGRÉGÉES
// ============================================

export interface DailyStats {
  user_id: string
  date: string
  habits_completed: number
  resistances: number
  relapses: number
  total_amount_spent: number
}

// Stats pour le dashboard
export interface DashboardStats {
  today: {
    habits_completed: number
    habits_target: number
    resistances: number
    relapses: number
    total_amount_spent: number
  }
  week: {
    habits_completed: number
    resistances: number
    relapses: number
    avg_resistance_rate: number
  }
}

// ============================================
// 5. TYPES COMBINÉS (pour l'UI)
// ============================================

// Trackable avec ses events du jour
export interface TrackableWithToday extends Trackable {
  today_events: TrackableEvent[]
  today_decisions: Decision[]
  today_progress: number // 0-100 (pour habitudes)
  today_count: number
}

// Event avec sa décision (si applicable)
export interface EventWithDecision extends TrackableEvent {
  decision?: Decision | null
  trackable?: Trackable
}

// Pour la vue "Priorités"
export interface PriorityItem {
  trackable: Trackable
  progress: number
  status: 'completed' | 'in_progress' | 'not_started' | 'failed'
  today_events: TrackableEvent[]
  today_decisions: Decision[]
}
