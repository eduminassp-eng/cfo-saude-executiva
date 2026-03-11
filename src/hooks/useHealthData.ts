import { useState, useEffect, useCallback } from 'react';
import { HealthData } from '@/types/health';
import { sampleData } from '@/data/sampleData';

const STORAGE_KEY = 'health-cfo-data';

export function useHealthData() {
  const [data, setData] = useState<HealthData>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}
    return sampleData;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const updateData = useCallback((updater: (prev: HealthData) => HealthData) => {
    setData(prev => {
      const next = updater(prev);
      next.lastUpdated = new Date().toISOString().split('T')[0];
      return next;
    });
  }, []);

  const resetData = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setData(sampleData);
  }, []);

  const exportJSON = useCallback(() => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `health-cfo-${data.lastUpdated}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [data]);

  const exportCSV = useCallback(() => {
    const headers = ['Nome', 'Valor', 'Unidade', 'Status', 'Última Data', 'Nota'];
    const rows = data.biomarkers.map(b => [
      b.name, b.value?.toString() ?? '', b.unit, b.status, b.lastDate ?? '', b.note
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `health-cfo-${data.lastUpdated}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [data]);

  return { data, updateData, resetData, exportJSON, exportCSV };
}
