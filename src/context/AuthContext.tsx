'use client';
import { createContext, useContext, useState, ReactNode } from 'react';

type AuthContextType = {
  privateKey: Uint8Array | null;
  setPrivateKey: (key: Uint8Array | null) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [privateKey, setPrivateKey] = useState<Uint8Array | null>(null);

  return (
    <AuthContext.Provider value={{ privateKey, setPrivateKey }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
