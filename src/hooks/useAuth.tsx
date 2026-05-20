import { useState, useEffect, useCallback, useRef, createContext, useContext } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getProductionOrigin } from "@/lib/domain";
import type { User, Session } from "@supabase/supabase-js";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, firstName: string, ageBand: string) => Promise<{ error: { message: string } | null }>;
  signIn: (email: string, password: string) => Promise<{ error: { message: string } | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: { message: string } | null }>;
  updatePassword: (password: string) => Promise<{ error: { message: string } | null }>;
  fetchProfile: (userId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const lastAuthAttempt = useRef<number>(0);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();
      if (error) {
        console.warn("[useAuth] fetchProfile error:", error.message);
        return;
      }
      setProfile(data ?? null);
    } catch (e) {
      console.warn("[useAuth] fetchProfile threw:", e);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    // Belt-and-braces hard timeout: never leave the app stuck on a spinner.
    // If anything below stalls (Safari/iOS storage throttling, network hiccup,
    // Supabase listener deadlock), we still flip loading=false within 10s.
    const safetyTimer = window.setTimeout(() => {
      if (mounted) setLoading(false);
    }, 10000);

    const finish = (session: Session | null) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        // CRITICAL: never await Supabase calls inside the auth listener.
        // Defer with setTimeout(0) to avoid the documented deadlock where the
        // auth subsystem holds an internal lock while a query is in flight.
        setTimeout(() => {
          if (!mounted) return;
          fetchProfile(session.user.id).finally(() => {
            if (mounted) setLoading(false);
          });
        }, 0);
      } else {
        setProfile(null);
        setLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => finish(session)
    );

    // Fallback in case INITIAL_SESSION never fires (rare, but seen on iOS Safari).
    supabase.auth.getSession().then(({ data: { session } }) => {
      // Only act if listener hasn't already populated state.
      if (mounted && loading) finish(session);
    }).catch(() => {
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
      window.clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchProfile]);

  const signUp = async (email: string, password: string, firstName: string, ageBand: string) => {
    const now = Date.now();
    if (now - lastAuthAttempt.current < 2000) {
      return { error: { message: "Please wait before trying again." } };
    }
    lastAuthAttempt.current = now;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { first_name: firstName, age_band: ageBand },
        emailRedirectTo: getProductionOrigin(),
      },
    });
    return { error: error ? { message: error.message } : null };
  };

  const signIn = async (email: string, password: string) => {
    const now = Date.now();
    if (now - lastAuthAttempt.current < 2000) {
      return { error: { message: "Please wait before trying again." } };
    }
    lastAuthAttempt.current = now;

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? { message: error.message } : null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${getProductionOrigin()}/reset-password`,
    });
    return { error: error ? { message: error.message } : null };
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    return { error: error ? { message: error.message } : null };
  };

  return (
    <AuthContext.Provider value={{
      user, profile, session, loading,
      signUp, signIn, signOut, resetPassword, updatePassword, fetchProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
