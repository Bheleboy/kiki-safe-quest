ALTER TABLE public.progress DROP CONSTRAINT IF EXISTS progress_user_id_lesson_id_key;
ALTER TABLE public.progress ADD CONSTRAINT progress_user_id_child_id_lesson_id_key UNIQUE (user_id, lesson_id, child_id);

ALTER TABLE public.badges DROP CONSTRAINT IF EXISTS badges_user_id_badge_id_key;
ALTER TABLE public.badges ADD CONSTRAINT badges_user_id_child_id_badge_id_key UNIQUE (user_id, badge_id, child_id);