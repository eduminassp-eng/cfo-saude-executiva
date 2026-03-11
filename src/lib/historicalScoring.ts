import { HealthData } from '@/types/health';
import { calcDomainScores, DomainScore } from './scoring';

/**
 * Build a synthetic HealthData using the Nth historical entry (0 = most recent previous)
 * to recalculate domain scores for a past check-up.
 */
export function calcPreviousDomainScores(data: HealthData, historyIndex = 0): DomainScore[] | null {
  const hasPrevious = data.biomarkers.some(b => b.history && b.history.length > historyIndex);
  if (!hasPrevious) return null;

  const previousData: HealthData = {
    ...data,
    biomarkers: data.biomarkers.map(b => {
      if (!b.history || b.history.length <= historyIndex) return b;
      const prev = b.history[historyIndex];
      // Recalculate status based on previous value
      let status = b.status;
      if (prev.value !== null && b.targetMin !== null && b.targetMax !== null) {
        status = prev.value >= b.targetMin && prev.value <= b.targetMax ? 'green' : 'yellow';
      } else if (prev.value !== null && b.targetMax !== null) {
        status = prev.value <= b.targetMax ? 'green' : prev.value <= b.targetMax * 1.15 ? 'yellow' : 'red';
      } else if (prev.value !== null && b.targetMin !== null) {
        status = prev.value >= b.targetMin ? 'green' : prev.value >= b.targetMin * 0.85 ? 'yellow' : 'red';
      }
      return { ...b, value: prev.value, status };
    }),
  };

  return calcDomainScores(previousData);
}

export function getDomainDelta(current: DomainScore[], previous: DomainScore[]): Record<string, number> {
  const deltas: Record<string, number> = {};
  current.forEach(d => {
    const prev = previous.find(p => p.id === d.id);
    deltas[d.id] = prev ? d.score - prev.score : 0;
  });
  return deltas;
}
