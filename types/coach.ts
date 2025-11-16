export type CoachTone = 'gentle' | 'balanced' | 'direct'

export type CoachFocus = 'mindset' | 'strategy' | 'celebration'

export type CoachStatsPayload = {
  totalCount: number
  last7DaysCount: number
  currentStreak: number
  todayCount: number
  monthPercentage: number
}

export type CoachResult = {
  summary: string
  analysis: string
  patterns: string
  risk_score: number
  advice: string
}
