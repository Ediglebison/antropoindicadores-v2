import { createContext } from 'react';

export interface User {
  id: string;
  name: string;
  access_code: string;
  role: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (accessCode: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>(null!);
