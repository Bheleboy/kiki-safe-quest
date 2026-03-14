ALTER TABLE public.profiles DROP CONSTRAINT profiles_age_band_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_age_band_check CHECK (age_band IN ('6-9', '10-13', 'parent'));