import { ReactNode, createContext, useContext } from 'react';
import { useHealthData } from '@/hooks/useHealthData';
import { HealthData } from '@/types/health';

interface HealthContextType {
  data: HealthData;
  updateData: (updater: (prev: HealthData) => HealthData) => void;
  resetData: () => void;
  exportJSON: () => void;
  exportCSV: () => void;
}

const HealthContext = createContext<HealthContextType | null>(null);

export function HealthProvider({ children }: { children: ReactNode }) {
  const health = useHealthData();
  return <HealthContext.Provider value={health}>{children}</HealthContext.Provider>;
}

export function useHealth() {
  const ctx = useContext(HealthContext);
  if (!ctx) throw new Error('useHealth must be used within HealthProvider');
  return ctx;
}
