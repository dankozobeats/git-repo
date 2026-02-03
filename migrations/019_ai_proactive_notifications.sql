-- Tracking proactive notifications sent by AI to avoid spam
CREATE TABLE IF NOT EXISTS ai_proactive_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- e.g., 'STREAK_7', 'STREAK_30', 'SLUMP_DETECTION', 'PERSONAL_CHECKIN'
    habit_id UUID REFERENCES habits(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraint to avoid sending the same type of milestone too often
    -- For streaks, we can check if it was already sent for that specific habit/milestone
    metadata_json JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_ai_proactive_user ON ai_proactive_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_proactive_sent_at ON ai_proactive_notifications(sent_at);

-- RLS
ALTER TABLE ai_proactive_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own proactive notifications"
    ON ai_proactive_notifications FOR SELECT
    USING (auth.uid() = user_id);
