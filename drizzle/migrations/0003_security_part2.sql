CREATE TABLE public.reset_requests (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, device_hash text NOT NULL, expires_at timestamptz NOT NULL, used_at timestamptz, created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX reset_requests_user_idx ON public.reset_requests(user_id);
GRANT ALL ON public.reset_requests TO service_role;
ALTER TABLE public.reset_requests ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.parent_pins (user_id uuid PRIMARY KEY, pin_hash text NOT NULL, failed_attempts int NOT NULL DEFAULT 0, lock_level int NOT NULL DEFAULT 0, locked_until timestamptz, updated_at timestamptz NOT NULL DEFAULT now());
GRANT ALL ON public.parent_pins TO service_role;
ALTER TABLE public.parent_pins ENABLE ROW LEVEL SECURITY;