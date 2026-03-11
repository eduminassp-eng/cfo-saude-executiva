ALTER TABLE public.lifestyle_data
  ADD COLUMN IF NOT EXISTS daily_steps integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS avg_heart_rate numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS activity_minutes integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS weight numeric NULL;