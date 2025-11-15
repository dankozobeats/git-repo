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
