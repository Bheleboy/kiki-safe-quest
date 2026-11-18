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
    let sessionRevision = 0;
    let currentUserId: string | null = null;
    const pendingChecks = new Map<string, Promise<string | null>>();
    const deferredChecks = new Set<ReturnType<typeof setTimeout>>();
    const safetyTimeout = setTimeout(() => {
      if (mounted) setAdminLoading(false);
    }, 8000);

    async function checkAdminAccess(userId: string, revision: number) {
      if (!mounted || revision !== sessionRevision) return;
      try {
        let pending = pendingChecks.get(userId);
        if (!pending) {
          pending = (async () => {
            const { data, error } = await sitecheckerSupabase
              .from('dashboard_user_clients')
              .select('client_id, role')
              .eq('user_id', userId)
              .eq('client_id', '7a197200-b63e-4a04-80b7-6c3bdcfd93d7')
              .maybeSingle();
            if (error) throw error;
            return data ? (data as { client_id: string }).client_id : null;
          })();
          pendingChecks.set(userId, pending);
          void pending.finally(() => {
            if (pendingChecks.get(userId) === pending) pendingChecks.delete(userId);
          }).catch(() => {});
        }
        const allowedClientId = await pending;
        if (mounted && revision === sessionRevision) setClientId(allowedClientId);
      } catch (error) {
        console.error('Admin access check failed:', error);
        if (mounted && revision === sessionRevision) setClientId(null);
      } finally {
        if (mounted && revision === sessionRevision) setAdminLoading(false);
      }
    }

    function updateSession(session: Session | null) {
      const userId = session?.user.id ?? null;
      const revision = ++sessionRevision;
      if (userId !== currentUserId) setClientId(null);
      currentUserId = userId;
      setAdminSession(session);
      setAdminUser(session?.user ?? null);
      if (!userId) setAdminLoading(false);
      return revision;
    }

    (async () => {
      const initialRevision = sessionRevision;
      let revision = initialRevision;
      try {
        const { data: { session }, error } = await sitecheckerSupabase.auth.getSession();
        if (error) throw error;
        if (!mounted || initialRevision !== sessionRevision) return;
        revision = updateSession(session);
        if (session?.user) await checkAdminAccess(session.user.id, revision);
      } catch (error) {
        console.error('Admin session load failed:', error);
      } finally {
        if (mounted && revision === sessionRevision) setAdminLoading(false);
      }
    })();

    const { data: { subscription } } = sitecheckerSupabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      const revision = updateSession(session);
      if (session?.user) {
        const userId = session.user.id;
        const timer = setTimeout(() => {
          deferredChecks.delete(timer);
          void checkAdminAccess(userId, revision);
        }, 0);
        deferredChecks.add(timer);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
      deferredChecks.forEach(clearTimeout);
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
