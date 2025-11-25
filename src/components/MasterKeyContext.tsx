'use client';
import { createContext, useContext, useState, ReactNode } from 'react';

type MasterKeyContextType = {
  masterKey: CryptoKey | null;
  setMasterKey: (key: CryptoKey | null) => void;
};

const MasterKeyContext = createContext<MasterKeyContextType | undefined>(undefined);

export function MasterKeyProvider({ children }: { children: ReactNode }) {
  const [masterKey, setMasterKey] = useState<CryptoKey | null>(null);

  return (
    <MasterKeyContext.Provider value={{ masterKey, setMasterKey }}>
      {children}
    </MasterKeyContext.Provider>
  );
}

export function useMasterKey() {
  const ctx = useContext(MasterKeyContext);
  if (!ctx) throw new Error('useMasterKey must be used within MasterKeyProvider');
  return ctx;
}
