CREATE TABLE public.security_flags (
  user_id uuid PRIMARY KEY,
  password_reset_required boolean NOT NULL DEFAULT false,
  reason text,
  set_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.security_flags TO service_role;
ALTER TABLE public.security_flags ENABLE ROW LEVEL SECURITY;
-- No policies: server-only table, accessed by edge functions with the service role.