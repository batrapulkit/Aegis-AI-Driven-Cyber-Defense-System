-- Add threat_type column to scan_logs
ALTER TABLE public.scan_logs ADD COLUMN threat_type text NOT NULL DEFAULT 'None';