export type Database = {
  public: {
    Tables: {
      habits: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          icon: string | null
          color: string
          is_archived: boolean
          type: string
          created_at: string
          updated_at: string
          // Goal tracking (for good habits only)
          goal_value: number | null
          goal_type: 'daily' | 'weekly' | 'monthly' | null
          goal_description: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          icon?: string | null
          color?: string
          is_archived?: boolean
          type?: string
          goal_value?: number | null
          goal_type?: 'daily' | 'weekly' | 'monthly' | null
          goal_description?: string | null
        }
      }
      logs: {
        Row: {
          id: string
          habit_id: string
          user_id: string
          completed_date: string
          value: number | null
          notes: string | null
          created_at: string
          type?: string
        }
        Insert: {
          id?: string
          habit_id: string
          user_id: string
          completed_date: string
          value?: number | null
          notes?: string | null
          type?: string
        }
      }
    }
  }
}
