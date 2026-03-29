-- Add age_verified_at column if missing
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS age_verified_at timestamptz;

-- Backfill any null age_verified to false
UPDATE public.profiles
  SET age_verified = false
  WHERE age_verified IS NULL;