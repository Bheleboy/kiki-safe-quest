ALTER TABLE public.parent_surveys
  ADD COLUMN IF NOT EXISTS share_publicly boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS display_name text NULL,
  ADD COLUMN IF NOT EXISTS approved boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz NULL;

ALTER TABLE public.parent_surveys
  ADD CONSTRAINT parent_surveys_display_name_len CHECK (display_name IS NULL OR char_length(display_name) <= 60);

CREATE OR REPLACE FUNCTION public.protect_parent_survey_approval()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role' THEN
    RETURN NEW;
  END IF;
  IF auth.uid() IS NULL OR NOT public.is_admin(auth.uid()) THEN
    IF TG_OP = 'INSERT' THEN
      NEW.approved := false;
      NEW.approved_at := NULL;
    ELSE
      NEW.approved := OLD.approved;
      NEW.approved_at := OLD.approved_at;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER tr_protect_parent_survey_approval
BEFORE INSERT OR UPDATE ON public.parent_surveys
FOR EACH ROW EXECUTE FUNCTION public.protect_parent_survey_approval();

CREATE POLICY "Admins can read all parent surveys" ON public.parent_surveys
FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update parent surveys" ON public.parent_surveys
FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.get_public_parent_reviews()
RETURNS TABLE(id uuid, display_name text, overall_rating integer, feedback text, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT s.id, s.display_name, s.overall_rating, s.feedback, s.created_at
  FROM public.parent_surveys s
  WHERE s.share_publicly = true AND s.approved = true AND s.feedback IS NOT NULL
  ORDER BY s.created_at DESC
  LIMIT 12
$$;

REVOKE ALL ON FUNCTION public.get_public_parent_reviews() FROM public;
GRANT EXECUTE ON FUNCTION public.get_public_parent_reviews() TO anon, authenticated;