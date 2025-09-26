import React, { createContext, useEffect, useState, useMemo } from 'react';
import { loadToken, saveToken, clearToken } from './AuthStore';
import { apiLogin } from '../components/api/client';

type AuthContextType = {
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  restoring: boolean;
};

export const AuthContext = createContext<AuthContextType>({
  token: null, login: async () => {}, logout: async () => {}, restoring: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(true);

  useEffect(() => {
    (async () => {
      try { setToken(await loadToken()); } finally { setRestoring(false); }
    })();
  }, []);

  const value = useMemo(() => ({
    token,
    restoring,
    login: async (email: string, password: string) => {
      const t = await apiLogin(email, password);
      await saveToken(t);
      setToken(t);
    },
    logout: async () => {
      await clearToken();
      setToken(null);
    }
  }), [token, restoring]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}