import { createClient } from '@supabase/supabase-js';

const SITECHECKER_URL = import.meta.env.VITE_SITECHECKER_SUPABASE_URL;
const SITECHECKER_KEY = import.meta.env.VITE_SITECHECKER_SUPABASE_KEY;

export const sitecheckerSupabase = createClient(SITECHECKER_URL, SITECHECKER_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'sitechecker-admin-auth',
  },
});
