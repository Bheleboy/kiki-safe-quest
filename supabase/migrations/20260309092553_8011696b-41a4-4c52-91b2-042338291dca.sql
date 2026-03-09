
CREATE TABLE public.armour_pieces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  child_id uuid REFERENCES public.children(id) ON DELETE CASCADE,
  piece_id text NOT NULL,
  course_id text NOT NULL DEFAULT 'online-safety',
  earned_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, child_id, piece_id)
);

ALTER TABLE public.armour_pieces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own armour pieces"
  ON public.armour_pieces FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own armour pieces"
  ON public.armour_pieces FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
