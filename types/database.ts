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
          type: 'good' | 'bad' | string
          created_at: string
          updated_at: string
          tracking_mode: 'binary' | 'counter' | null
          daily_goal_value: number | null
          daily_goal_type: 'minimum' | 'maximum' | null
          goal_value: number | null
          goal_type: 'daily' | 'weekly' | 'monthly' | null
          goal_description: string | null
          category_id: string | null
          is_focused: boolean
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          icon?: string | null
          color?: string
          is_archived?: boolean
          type?: 'good' | 'bad' | string
          tracking_mode?: 'binary' | 'counter' | null
          daily_goal_value?: number | null
          daily_goal_type?: 'minimum' | 'maximum' | null
          goal_value?: number | null
          goal_type?: 'daily' | 'weekly' | 'monthly' | null
          goal_description?: string | null
          category_id?: string | null
          is_focused?: boolean
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
      habit_events: {
        Row: {
          id: string
          habit_id: string
          user_id: string
          event_date: string
          occurred_at: string
        }
        Insert: {
          id?: string
          habit_id: string
          user_id: string
          event_date: string
          occurred_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          user_id: string
          name: string
          color: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          color?: string | null
        }
      }
      agenda_items: {
        Row: {
          id: string
          user_id: string
          habit_id: string | null
          title: string
          description: string | null
          scheduled_date: string
          scheduled_time: string | null
          reminder_enabled: boolean
          reminder_offset_minutes: number | null
          is_completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          habit_id?: string | null
          title: string
          description?: string | null
          scheduled_date: string
          scheduled_time?: string | null
          reminder_enabled?: boolean
          reminder_offset_minutes?: number | null
          is_completed?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
