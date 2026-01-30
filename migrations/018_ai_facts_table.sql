-- Migration: Table for persistent AI-learned facts about the user
-- Description: Stores personal details, preferences, and anecdotes to provide long-term memory.

CREATE TABLE IF NOT EXISTS user_ai_facts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  fact_category text DEFAULT 'general',
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, content)
);

-- Enable RLS
ALTER TABLE user_ai_facts ENABLE ROW LEVEL SECURITY;

-- Policy
CREATE POLICY "Users can manage their own facts" 
ON user_ai_facts FOR ALL 
USING (auth.uid() = user_id);

-- Index
CREATE INDEX IF NOT EXISTS idx_user_ai_facts_user_id ON user_ai_facts(user_id);
