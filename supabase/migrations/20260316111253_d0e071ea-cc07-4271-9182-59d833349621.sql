
-- Child surveys (after course completion)
CREATE TABLE public.child_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  child_id UUID REFERENCES public.children(id) ON DELETE CASCADE NOT NULL,
  stream_id TEXT NOT NULL,
  age_band TEXT NOT NULL,
  was_fun BOOLEAN,
  was_easy BOOLEAN,
  videos_helpful BOOLEAN,
  learned_something BOOLEAN,
  would_recommend BOOLEAN,
  favorite_part TEXT,
  what_to_improve TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Parent surveys
CREATE TABLE public.parent_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  child_id UUID REFERENCES public.children(id) ON DELETE CASCADE,
  stream_id TEXT,
  helped_child BOOLEAN,
  child_more_aware BOOLEAN,
  easy_to_use BOOLEAN,
  would_recommend BOOLEAN,
  overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
  feedback TEXT,
  reviewed_child_survey_id UUID REFERENCES public.child_surveys(id),
  google_review_clicked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS for child_surveys
ALTER TABLE public.child_surveys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own child surveys" ON public.child_surveys
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own child surveys" ON public.child_surveys
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- RLS for parent_surveys
ALTER TABLE public.parent_surveys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own parent surveys" ON public.parent_surveys
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own parent surveys" ON public.parent_surveys
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can update own parent surveys" ON public.parent_surveys
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
