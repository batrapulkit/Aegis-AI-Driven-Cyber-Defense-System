-- Create scan_logs table for storing security scan results
CREATE TABLE public.scan_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  prompt_text TEXT NOT NULL,
  verdict TEXT NOT NULL CHECK (verdict IN ('SAFE', 'BLOCKED')),
  risk_score INTEGER NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100)
);

-- Enable Row Level Security
ALTER TABLE public.scan_logs ENABLE ROW LEVEL SECURITY;

-- Allow public read/insert for MVP (no auth required for demo)
CREATE POLICY "Allow public read access"
ON public.scan_logs
FOR SELECT
USING (true);

CREATE POLICY "Allow public insert access"
ON public.scan_logs
FOR INSERT
WITH CHECK (true);

-- Enable realtime for live feed
ALTER PUBLICATION supabase_realtime ADD TABLE public.scan_logs;