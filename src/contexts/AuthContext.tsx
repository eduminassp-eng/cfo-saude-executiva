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
    let isMounted = true;
    let subscription: { unsubscribe: () => void } | null = null;

    const restoreSession = async () => {
      try {
        const { data: sessionData, error } = await supabase.auth.getSession();

        if (error) {
          const isRefreshTokenError =
            error.message?.includes('Refresh Token Not Found') ||
            error.message?.includes('Invalid Refresh Token');

          if (isRefreshTokenError) {
            await supabase.auth.signOut({ scope: 'local' });
          }

          if (isMounted) setSession(null);
        } else if (isMounted) {
          setSession(sessionData.session ?? null);
        }
      } catch {
        if (isMounted) setSession(null);
      } finally {
        if (!isMounted) return;

        setLoading(false);

        const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
          if (!isMounted) return;
          setSession(nextSession);
        });

        subscription = data.subscription;
      }
    };

    restoreSession();

    const timeout = setTimeout(() => {
      if (isMounted) setLoading(false);
    }, 5000);

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const signOut = async () => {
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
