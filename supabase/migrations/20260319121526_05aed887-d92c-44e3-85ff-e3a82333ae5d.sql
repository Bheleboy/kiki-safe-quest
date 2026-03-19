
-- Security definer function: verify parent owns a child
CREATE OR REPLACE FUNCTION public.is_parent_of_child(_user_id uuid, _child_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.children
    WHERE id = _child_id AND parent_id = _user_id
  )
$$;

-- Progress: tighten INSERT to verify child ownership
DROP POLICY IF EXISTS "Users can insert own progress" ON public.progress;
CREATE POLICY "Users can insert own progress" ON public.progress
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND (child_id IS NULL OR public.is_parent_of_child(auth.uid(), child_id))
);

-- Progress: tighten SELECT to verify child ownership
DROP POLICY IF EXISTS "Users can read own progress" ON public.progress;
CREATE POLICY "Users can read own progress" ON public.progress
FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  AND (child_id IS NULL OR public.is_parent_of_child(auth.uid(), child_id))
);

-- Progress: tighten UPDATE
DROP POLICY IF EXISTS "Users can update own progress" ON public.progress;
CREATE POLICY "Users can update own progress" ON public.progress
FOR UPDATE TO authenticated
USING (
  auth.uid() = user_id
  AND (child_id IS NULL OR public.is_parent_of_child(auth.uid(), child_id))
);

-- Badges: tighten INSERT
DROP POLICY IF EXISTS "Users can insert own badges" ON public.badges;
CREATE POLICY "Users can insert own badges" ON public.badges
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND (child_id IS NULL OR public.is_parent_of_child(auth.uid(), child_id))
);

-- Badges: tighten SELECT
DROP POLICY IF EXISTS "Users can read own badges" ON public.badges;
CREATE POLICY "Users can read own badges" ON public.badges
FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  AND (child_id IS NULL OR public.is_parent_of_child(auth.uid(), child_id))
);

-- Armour pieces: tighten INSERT
DROP POLICY IF EXISTS "Users can insert own armour pieces" ON public.armour_pieces;
CREATE POLICY "Users can insert own armour pieces" ON public.armour_pieces
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND (child_id IS NULL OR public.is_parent_of_child(auth.uid(), child_id))
);

-- Armour pieces: tighten SELECT
DROP POLICY IF EXISTS "Users can read own armour pieces" ON public.armour_pieces;
CREATE POLICY "Users can read own armour pieces" ON public.armour_pieces
FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  AND (child_id IS NULL OR public.is_parent_of_child(auth.uid(), child_id))
);

-- Child surveys: tighten all policies with child ownership
DROP POLICY IF EXISTS "Users can insert own child surveys" ON public.child_surveys;
CREATE POLICY "Users can insert own child surveys" ON public.child_surveys
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND public.is_parent_of_child(auth.uid(), child_id)
);

DROP POLICY IF EXISTS "Users can read own child surveys" ON public.child_surveys;
CREATE POLICY "Users can read own child surveys" ON public.child_surveys
FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  AND public.is_parent_of_child(auth.uid(), child_id)
);

DROP POLICY IF EXISTS "Parents can update own child surveys" ON public.child_surveys;
CREATE POLICY "Parents can update own child surveys" ON public.child_surveys
FOR UPDATE TO authenticated
USING (
  auth.uid() = user_id
  AND public.is_parent_of_child(auth.uid(), child_id)
);

-- Notifications: tighten with child ownership where applicable
DROP POLICY IF EXISTS "Users can read own notifications" ON public.notifications;
CREATE POLICY "Users can read own notifications" ON public.notifications
FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  AND (child_id IS NULL OR public.is_parent_of_child(auth.uid(), child_id))
);

DROP POLICY IF EXISTS "Users can insert own notifications" ON public.notifications;
CREATE POLICY "Users can insert own notifications" ON public.notifications
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND (child_id IS NULL OR public.is_parent_of_child(auth.uid(), child_id))
);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications
FOR UPDATE TO authenticated
USING (
  auth.uid() = user_id
  AND (child_id IS NULL OR public.is_parent_of_child(auth.uid(), child_id))
);

DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
CREATE POLICY "Users can delete own notifications" ON public.notifications
FOR DELETE TO authenticated
USING (
  auth.uid() = user_id
  AND (child_id IS NULL OR public.is_parent_of_child(auth.uid(), child_id))
);

-- Parent surveys: tighten with child ownership
DROP POLICY IF EXISTS "Users can insert own parent surveys" ON public.parent_surveys;
CREATE POLICY "Users can insert own parent surveys" ON public.parent_surveys
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND (child_id IS NULL OR public.is_parent_of_child(auth.uid(), child_id))
);

DROP POLICY IF EXISTS "Users can read own parent surveys" ON public.parent_surveys;
CREATE POLICY "Users can read own parent surveys" ON public.parent_surveys
FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  AND (child_id IS NULL OR public.is_parent_of_child(auth.uid(), child_id))
);

DROP POLICY IF EXISTS "Users can update own parent surveys" ON public.parent_surveys;
CREATE POLICY "Users can update own parent surveys" ON public.parent_surveys
FOR UPDATE TO authenticated
USING (
  auth.uid() = user_id
  AND (child_id IS NULL OR public.is_parent_of_child(auth.uid(), child_id))
);
