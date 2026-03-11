import { HealthAlert, AlertSeverity } from '@/lib/healthAlerts';
import { AlertTriangle, AlertCircle, TrendingDown, CalendarClock, Activity, Info } from 'lucide-react';
import { useState } from 'react';

interface Props {
  alerts: HealthAlert[];
  maxVisible?: number;
  compact?: boolean;
}

const severityConfig: Record<AlertSeverity, { icon: typeof AlertTriangle; colorVar: string; label: string }> = {
  critical: { icon: AlertTriangle, colorVar: '--status-red', label: 'Crítico' },
  warning: { icon: AlertCircle, colorVar: '--status-yellow', label: 'Atenção' },
  info: { icon: Info, colorVar: '--primary', label: 'Info' },
};

const typeIcons = {
  biomarker_critical: Activity,
  biomarker_warning: Activity,
  exam_overdue: CalendarClock,
  exam_upcoming: CalendarClock,
  trend_worsening: TrendingDown,
};

export function HealthAlerts({ alerts, maxVisible = 5, compact = false }: Props) {
  const [expanded, setExpanded] = useState(false);

  if (alerts.length === 0) return null;

  const visible = expanded ? alerts : alerts.slice(0, maxVisible);
  const criticalCount = alerts.filter(a => a.severity === 'critical').length;
  const warningCount = alerts.filter(a => a.severity === 'warning').length;

  return (
    <div className="space-y-3 animate-fade-in">
      {/* Summary bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <h2 className="text-lg font-semibold">Alertas de Saúde</h2>
        <div className="flex gap-2 ml-auto">
          {criticalCount > 0 && (
            <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ backgroundColor: 'hsl(var(--status-red) / 0.12)', color: 'hsl(var(--status-red))' }}>
              <AlertTriangle className="w-3 h-3" />
              {criticalCount} crítico{criticalCount > 1 ? 's' : ''}
            </span>
          )}
          {warningCount > 0 && (
            <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ backgroundColor: 'hsl(var(--status-yellow) / 0.12)', color: 'hsl(var(--status-yellow))' }}>
              <AlertCircle className="w-3 h-3" />
              {warningCount} atenção
            </span>
          )}
        </div>
      </div>

      {/* Alert cards */}
      <div className={compact ? 'space-y-2' : 'space-y-3'}>
        {visible.map((alert, i) => {
          const config = severityConfig[alert.severity];
          const TypeIcon = typeIcons[alert.type];
          return (
            <div
              key={alert.id}
              className="glass-card rounded-xl border-l-4 animate-fade-in"
              style={{
                borderLeftColor: `hsl(var(${config.colorVar}))`,
                padding: compact ? '0.625rem 0.875rem' : '0.875rem 1rem',
                animationDelay: `${i * 60}ms`,
                animationFillMode: 'backwards',
              }}
            >
              <div className="flex items-start gap-3">
                <TypeIcon
                  className="w-4 h-4 shrink-0 mt-0.5"
                  style={{ color: `hsl(var(${config.colorVar}))` }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-medium ${compact ? 'text-xs' : 'text-sm'}`}>{alert.title}</span>
                    <span
                      className="text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0"
                      style={{
                        backgroundColor: `hsl(var(${config.colorVar}) / 0.12)`,
                        color: `hsl(var(${config.colorVar}))`,
                      }}
                    >
                      {config.label}
                    </span>
                  </div>
                  {!compact && (
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{alert.description}</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Show more/less */}
      {alerts.length > maxVisible && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-primary hover:underline font-medium"
        >
          {expanded ? 'Mostrar menos' : `Ver todos os ${alerts.length} alertas`}
        </button>
      )}
    </div>
  );
}
