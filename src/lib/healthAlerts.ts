import { HealthData, Biomarker, Exam, Status } from '@/types/health';
import { detectTrendPatterns, TrendPattern } from './copilot';

export type AlertType = 'biomarker_critical' | 'biomarker_warning' | 'exam_overdue' | 'exam_upcoming' | 'trend_worsening';
export type AlertSeverity = 'critical' | 'warning' | 'info';

export interface HealthAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  category: string;
  timestamp: string;
}

export function generateHealthAlerts(data: HealthData): HealthAlert[] {
  const alerts: HealthAlert[] = [];
  const now = new Date().toISOString();

  // 1. Biomarker alerts
  for (const b of data.biomarkers) {
    if (b.value === null) continue;
    if (b.status === 'red') {
      alerts.push({
        id: `bio-red-${b.id}`,
        type: 'biomarker_critical',
        severity: 'critical',
        title: `${b.name} fora da faixa segura`,
        description: `Valor atual: ${b.value} ${b.unit}${b.targetMax ? ` (ref: ${b.targetMin ?? '–'}–${b.targetMax})` : ''}. Ação imediata recomendada.`,
        category: b.category,
        timestamp: now,
      });
    } else if (b.status === 'yellow') {
      alerts.push({
        id: `bio-yellow-${b.id}`,
        type: 'biomarker_warning',
        severity: 'warning',
        title: `${b.name} requer atenção`,
        description: `Valor atual: ${b.value} ${b.unit}. Próximo da faixa de risco — monitorar nas próximas consultas.`,
        category: b.category,
        timestamp: now,
      });
    }
  }

  // 2. Exam alerts
  for (const e of data.exams) {
    if (e.status === 'Atrasado') {
      alerts.push({
        id: `exam-overdue-${e.id}`,
        type: 'exam_overdue',
        severity: 'critical',
        title: `Exame atrasado: ${e.name}`,
        description: `${e.category} — ${e.mainRisk || 'Preventivo'}. Agende o mais breve possível.`,
        category: e.category,
        timestamp: now,
      });
    } else if (e.status === 'Próximo') {
      alerts.push({
        id: `exam-upcoming-${e.id}`,
        type: 'exam_upcoming',
        severity: 'warning',
        title: `Exame próximo do vencimento: ${e.name}`,
        description: `${e.category}${e.nextDate ? ` — vence em ${new Date(e.nextDate).toLocaleDateString('pt-BR')}` : ''}. Agende com antecedência.`,
        category: e.category,
        timestamp: now,
      });
    }
  }

  // 3. Trend worsening alerts
  const patterns = detectTrendPatterns(data);
  for (const p of patterns) {
    if (p.severity === 'negative' && Math.abs(p.changePercent) >= 5) {
      alerts.push({
        id: `trend-${p.biomarkerId}`,
        type: 'trend_worsening',
        severity: Math.abs(p.changePercent) >= 15 ? 'critical' : 'warning',
        title: `${p.biomarkerName} piorando (${p.changePercent > 0 ? '+' : ''}${p.changePercent.toFixed(1)}%)`,
        description: p.insight,
        category: 'Tendência',
        timestamp: now,
      });
    }
  }

  // Sort: critical first, then warning, then info
  const severityOrder: Record<AlertSeverity, number> = { critical: 0, warning: 1, info: 2 };
  alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return alerts;
}
