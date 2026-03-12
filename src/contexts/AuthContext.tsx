import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null;

    // 1. Restore session from storage FIRST
    supabase.auth.getSession().then(({ data: { session: restored } }) => {
      console.log('[Auth] getSession resolved:', restored ? `user=${restored.user.email}` : 'no session');
      setSession(restored);
      setLoading(false);

      // 2. ONLY AFTER hydration, start listening for changes
      const { data } = supabase.auth.onAuthStateChange((event, nextSession) => {
        console.log('[Auth] onAuthStateChange:', event, nextSession ? `user=${nextSession.user.email}` : 'no session');
        setSession(nextSession);
      });
      subscription = data.subscription;
    });

    // Safety timeout
    const timeout = setTimeout(() => {
      console.warn('[Auth] Timeout reached — forcing loading=false');
      setLoading(false);
    }, 5000);

    return () => {
      subscription?.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const signOut = async () => {
    console.log('[Auth] signOut called');
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
