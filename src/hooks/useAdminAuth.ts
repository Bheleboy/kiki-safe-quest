import { useState, useEffect, useCallback } from 'react';
import { sitecheckerSupabase } from '@/integrations/sitechecker/client';
import type { User, Session } from '@supabase/supabase-js';

export function useAdminAuth() {
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [adminSession, setAdminSession] = useState<Session | null>(null);
  const [adminLoading, setAdminLoading] = useState(true);
  const [clientId, setClientId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function checkAdminAccess(userId: string) {
      const { data } = await sitecheckerSupabase
        .from('dashboard_user_clients')
        .select('client_id, role')
        .eq('user_id', userId)
        .eq('client_id', '7a197200-b63e-4a04-80b7-6c3bdcfd93d7')
        .maybeSingle();
      if (mounted && data) setClientId((data as { client_id: string }).client_id);
    }

    (async () => {
      const { data: { session } } = await sitecheckerSupabase.auth.getSession();
      if (!mounted) return;
      setAdminSession(session);
      setAdminUser(session?.user ?? null);
      if (session?.user) {
        await checkAdminAccess(session.user.id);
      }
      setAdminLoading(false);
    })();

    const { data: { subscription } } = sitecheckerSupabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      setAdminSession(session);
      setAdminUser(session?.user ?? null);
      if (session?.user) {
        await checkAdminAccess(session.user.id);
      } else {
        setClientId(null);
      }
      setAdminLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const sendMagicLink = useCallback(async (email: string) => {
    const { error } = await sitecheckerSupabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/admin`,
      },
    });
    return { error };
  }, []);

  const signOut = useCallback(async () => {
    await sitecheckerSupabase.auth.signOut();
    setAdminUser(null);
    setAdminSession(null);
    setClientId(null);
  }, []);

  return { adminUser, adminSession, adminLoading, clientId, sendMagicLink, signOut };
}
