
-- Create a security definer function to check admin status without recursion
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _user_id AND is_admin = true
  )
$$;

-- Fix profiles admin policy (was causing infinite recursion)
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
CREATE POLICY "Admins can read all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- Fix children admin policy
DROP POLICY IF EXISTS "Admins can read all children" ON public.children;
CREATE POLICY "Admins can read all children"
  ON public.children FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- Fix progress admin policy
DROP POLICY IF EXISTS "Admins can read all progress" ON public.progress;
CREATE POLICY "Admins can read all progress"
  ON public.progress FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));
