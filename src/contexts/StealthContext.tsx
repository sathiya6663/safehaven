import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface StealthContextType {
  stealthActive: boolean;
  enableStealth: () => void;
  disableStealth: () => void;
}

const StealthContext = createContext<StealthContextType | undefined>(undefined);

const STORAGE_KEY = 'safehaven_stealth_active';

export function StealthProvider({ children }: { children: ReactNode }) {
  const [stealthActive, setStealthActive] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(stealthActive));
    } catch {
      // ignore
    }
    // Hide page title when stealth is active
    if (stealthActive) {
      document.title = 'Calculator';
    }
  }, [stealthActive]);

  const enableStealth = () => setStealthActive(true);
  const disableStealth = () => setStealthActive(false);

  return (
    <StealthContext.Provider value={{ stealthActive, enableStealth, disableStealth }}>
      {children}
    </StealthContext.Provider>
  );
}

export function useStealth() {
  const ctx = useContext(StealthContext);
  if (!ctx) throw new Error('useStealth must be used within StealthProvider');
  return ctx;
}
