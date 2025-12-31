
-- Add missing columns to scan_logs for map visualization and detailed reporting
ALTER TABLE public.scan_logs
ADD COLUMN IF NOT EXISTS threat_type TEXT DEFAULT 'None',
ADD COLUMN IF NOT EXISTS attack_category TEXT DEFAULT 'None',
ADD COLUMN IF NOT EXISTS latitude FLOAT,
ADD COLUMN IF NOT EXISTS longitude FLOAT;

-- Ensure RLS policies still apply (they are on the table, so new columns are covered)
