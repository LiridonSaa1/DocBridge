import { createContext, useContext, useEffect, useState } from "react";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";

export interface AuthUser {
  id: string;
  email: string | null;
  firstName?: string | null;
  lastName?: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  role: string | null;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  role: null,
  signOut: () => {},
});

async function fetchSession(): Promise<AuthUser | null> {
  try {
    const res = await fetch("/api/auth/user", { credentials: "include" });
    if (res.status === 401) return null;
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.id) return null;
    return { id: data.id, email: data.email ?? null, firstName: data.firstName, lastName: data.lastName };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSession().then((u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  const { data: me } = useGetMe({
    query: {
      enabled: !!user,
      queryKey: getGetMeQueryKey(),
    },
  });

  const role = me?.role ?? null;

  const signOut = () => {
    window.location.href = "/api/logout";
  };

  return (
    <AuthContext.Provider value={{ user, loading, role, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
