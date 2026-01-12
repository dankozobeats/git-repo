-- Add focus mode to habits table
ALTER TABLE habits
ADD COLUMN IF NOT EXISTS is_focused boolean NOT NULL DEFAULT false;

-- Create index for quick lookup of focused habit
CREATE INDEX IF NOT EXISTS habits_is_focused_idx ON habits (is_focused) WHERE is_focused = true;

-- Add constraint to ensure only one habit can be focused at a time per user
-- This will be enforced at the application level since we need to check user_id
COMMENT ON COLUMN habits.is_focused IS 'Indicates if this habit is currently in focus mode. Only one habit per user should be focused at a time.';
