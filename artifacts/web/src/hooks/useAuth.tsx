import { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";

let _currentUserId: string | null = null;

export function getUserIdHeader(): HeadersInit {
  return _currentUserId ? { "x-user-id": _currentUserId } : {};
}

const _originalFetch = window.fetch.bind(window);
window.fetch = (input, init) => {
  if (_currentUserId) {
    const headers = new Headers(init?.headers);
    if (!headers.has("x-user-id")) {
      headers.set("x-user-id", _currentUserId);
    }
    return _originalFetch(input, { ...init, headers });
  }
  return _originalFetch(input, init);
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  role: string | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  role: null,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      _currentUserId = session?.user?.id ?? null;
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      _currentUserId = session?.user?.id ?? null;
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const { data: me } = useGetMe({
    query: {
      enabled: !!user,
      queryKey: getGetMeQueryKey(),
    },
  });

  const role = me?.role ?? user?.user_metadata?.role ?? null;

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, role, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
