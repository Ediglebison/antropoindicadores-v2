import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { api } from '../services/api';
import { AuthContext } from './auth-context';
import type { User } from './auth-context';

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
