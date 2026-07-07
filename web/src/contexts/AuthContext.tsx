import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../services/api';

interface User {
  id: string;
  name: string;
  access_code: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (accessCode: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>(null!);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/auth/me')
      .then(res => setUser(res.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  async function login(accessCode: string, password: string) {
    await api.post('/auth/login', { access_code: accessCode, password });
    try {
      const me = await api.get('/auth/me');
      setUser(me.data);
    } catch (err) {
      await api.post('/auth/logout').catch(() => {});
      setUser(null);
      throw err;
    }
  }

  async function logout() {
    try {
      await api.post('/auth/logout');
    } finally {
      setUser(null);
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
