CREATE TABLE public.login_throttle (key text PRIMARY KEY, fail_count int NOT NULL DEFAULT 0, window_start timestamptz NOT NULL DEFAULT now(), lock_level int NOT NULL DEFAULT 0, locked_until timestamptz, updated_at timestamptz NOT NULL DEFAULT now());
GRANT ALL ON public.login_throttle TO service_role;
ALTER TABLE public.login_throttle ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.trusted_devices (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, device_hash text NOT NULL, user_agent text, created_at timestamptz NOT NULL DEFAULT now(), last_seen_at timestamptz NOT NULL DEFAULT now(), revoked_at timestamptz, UNIQUE(user_id, device_hash));
GRANT ALL ON public.trusted_devices TO service_role;
ALTER TABLE public.trusted_devices ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_sessions (session_id uuid PRIMARY KEY, user_id uuid NOT NULL, device_hash text NOT NULL, user_agent text, ip text, created_at timestamptz NOT NULL DEFAULT now(), last_seen_at timestamptz NOT NULL DEFAULT now(), revoked_at timestamptz, revoke_reason text);
CREATE INDEX user_sessions_user_idx ON public.user_sessions(user_id);
GRANT ALL ON public.user_sessions TO service_role;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.login_challenges (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, email text NOT NULL, device_hash text NOT NULL, code_hash text NOT NULL, purpose text NOT NULL DEFAULT 'login', attempts int NOT NULL DEFAULT 0, resend_count int NOT NULL DEFAULT 0, last_sent_at timestamptz NOT NULL DEFAULT now(), existing_session_id uuid, expires_at timestamptz NOT NULL, consumed_at timestamptz, created_at timestamptz NOT NULL DEFAULT now());
GRANT ALL ON public.login_challenges TO service_role;
ALTER TABLE public.login_challenges ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.security_events (id bigserial PRIMARY KEY, user_id uuid, email_hash text, ip text, user_agent text, event_type text NOT NULL, details jsonb, created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX security_events_created_idx ON public.security_events(created_at);
CREATE INDEX security_events_user_idx ON public.security_events(user_id);
GRANT ALL ON public.security_events TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.security_events_id_seq TO service_role;
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.security_tokens (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, token_hash text NOT NULL UNIQUE, purpose text NOT NULL, expires_at timestamptz NOT NULL, used_at timestamptz, created_at timestamptz NOT NULL DEFAULT now());
GRANT ALL ON public.security_tokens TO service_role;
ALTER TABLE public.security_tokens ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.revoke_auth_session(_session_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  DELETE FROM auth.sessions WHERE id = _session_id;
$$;
REVOKE ALL ON FUNCTION public.revoke_auth_session(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_auth_session(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.session_is_registered()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_sessions s
    WHERE s.session_id = NULLIF(auth.jwt()->>'session_id','')::uuid
      AND s.user_id = auth.uid()
      AND s.revoked_at IS NULL
  )
$$;
GRANT EXECUTE ON FUNCTION public.session_is_registered() TO authenticated;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['profiles','children','progress','badges','armour_pieces','child_surveys','parent_surveys','notifications','book_purchases'] LOOP
    EXECUTE format('CREATE POLICY require_registered_session ON public.%I AS RESTRICTIVE FOR ALL TO authenticated USING (public.session_is_registered()) WITH CHECK (public.session_is_registered())', t);
  END LOOP;
END $$;