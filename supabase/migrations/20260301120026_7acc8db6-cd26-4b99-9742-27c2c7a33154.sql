
-- Children table: parents add child profiles
CREATE TABLE public.children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  first_name TEXT NOT NULL DEFAULT '',
  age_band TEXT NOT NULL DEFAULT '6-9',
  avatar_color TEXT NOT NULL DEFAULT '#D2691E',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;

-- Parents can CRUD their own children
CREATE POLICY "Parents can read own children"
  ON public.children FOR SELECT
  TO authenticated
  USING (auth.uid() = parent_id);

CREATE POLICY "Parents can insert own children"
  ON public.children FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = parent_id);

CREATE POLICY "Parents can update own children"
  ON public.children FOR UPDATE
  TO authenticated
  USING (auth.uid() = parent_id);

CREATE POLICY "Parents can delete own children"
  ON public.children FOR DELETE
  TO authenticated
  USING (auth.uid() = parent_id);

-- Update progress table to optionally reference a child
ALTER TABLE public.progress ADD COLUMN child_id UUID REFERENCES public.children(id) ON DELETE CASCADE;

-- Update badges table to optionally reference a child
ALTER TABLE public.badges ADD COLUMN child_id UUID REFERENCES public.children(id) ON DELETE CASCADE;
