-- Add request attribution columns to otp_logs
ALTER TABLE public.otp_logs
  ADD COLUMN IF NOT EXISTS status_code int DEFAULT 200,
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'api',
  ADD COLUMN IF NOT EXISTS requested_by text;
