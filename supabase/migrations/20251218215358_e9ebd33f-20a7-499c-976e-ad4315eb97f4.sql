-- Add attack_category column to scan_logs
ALTER TABLE public.scan_logs 
ADD COLUMN attack_category text DEFAULT 'None';

-- Add an index for filtering by category
CREATE INDEX idx_scan_logs_attack_category ON public.scan_logs(attack_category);