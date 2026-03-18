
-- Add parent approval columns to child_surveys
ALTER TABLE public.child_surveys ADD COLUMN IF NOT EXISTS parent_approved boolean DEFAULT null;
ALTER TABLE public.child_surveys ADD COLUMN IF NOT EXISTS parent_approved_at timestamp with time zone DEFAULT null;
ALTER TABLE public.child_surveys ADD COLUMN IF NOT EXISTS parent_notified boolean DEFAULT false;

-- Create notifications table for parents
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL DEFAULT 'survey_review',
  title text NOT NULL,
  message text NOT NULL,
  child_id uuid REFERENCES public.children(id) ON DELETE CASCADE,
  related_id uuid,
  read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notifications" ON public.notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Allow parents to update child_surveys (for approval)
CREATE POLICY "Parents can update own child surveys" ON public.child_surveys FOR UPDATE TO authenticated USING (auth.uid() = user_id);
