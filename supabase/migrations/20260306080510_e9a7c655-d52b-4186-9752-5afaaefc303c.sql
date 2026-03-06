CREATE TABLE public.book_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id text NOT NULL,
  book_title text NOT NULL,
  store_name text NOT NULL,
  store_url text NOT NULL,
  purchased_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.book_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own book purchases"
ON public.book_purchases FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own book purchases"
ON public.book_purchases FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
