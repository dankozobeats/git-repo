-- Add timezone column if it doesn't exist
ALTER TABLE reminders 
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Europe/Paris';

-- Convert time_local to TIMESTAMPTZ if it's not already
-- Note: If it was TEXT, this will try to parse it. If it was already TIMESTAMPTZ, this is a no-op.
-- We assume existing data might need care, but for this task we just enforce the type.
ALTER TABLE reminders 
ALTER COLUMN time_local TYPE TIMESTAMPTZ USING time_local::timestamptz;
