import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { HealthAlert, AlertSeverity } from '@/lib/healthAlerts';
import { AlertTriangle, AlertCircle, Info, Activity, CalendarClock, TrendingDown, Bell } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  alerts: HealthAlert[];
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

export function AlertsDrawer({ alerts }: Props) {
  const criticalCount = alerts.filter(a => a.severity === 'critical').length;
  const warningCount = alerts.filter(a => a.severity === 'warning').length;
  const totalUrgent = criticalCount + warningCount;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="relative flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary/80 hover:bg-accent transition-colors text-sm font-medium">
          <Bell className="w-4 h-4" />
          <span className="hidden sm:inline">Alertas</span>
          {totalUrgent > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1.5 -right-1.5 flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold"
              style={{
                backgroundColor: criticalCount > 0 ? 'hsl(var(--status-red))' : 'hsl(var(--status-yellow))',
                color: 'hsl(var(--background))',
              }}
            >
              {totalUrgent}
            </motion.span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-3">
            Alertas de Saúde
            <div className="flex gap-2">
              {criticalCount > 0 && (
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: 'hsl(var(--status-red) / 0.12)', color: 'hsl(var(--status-red))' }}>
                  {criticalCount} crítico{criticalCount > 1 ? 's' : ''}
                </span>
              )}
              {warningCount > 0 && (
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: 'hsl(var(--status-yellow) / 0.12)', color: 'hsl(var(--status-yellow))' }}>
                  {warningCount} atenção
                </span>
              )}
            </div>
          </SheetTitle>
        </SheetHeader>

        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-status-green/10 flex items-center justify-center mb-3">
              <Bell className="w-6 h-6 text-status-green" />
            </div>
            <p className="text-sm font-medium">Tudo em ordem!</p>
            <p className="text-xs text-muted-foreground mt-1">Nenhum alerta ativo no momento.</p>
          </div>
        ) : (
          <div className="space-y-3 mt-4">
            {alerts.map((alert, i) => {
              const config = severityConfig[alert.severity];
              const TypeIcon = typeIcons[alert.type];
              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                  className="glass-card rounded-xl border-l-4 p-4"
                  style={{ borderLeftColor: `hsl(var(${config.colorVar}))` }}
                >
                  <div className="flex items-start gap-3">
                    <TypeIcon
                      className="w-4 h-4 shrink-0 mt-0.5"
                      style={{ color: `hsl(var(${config.colorVar}))` }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{alert.title}</span>
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
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{alert.description}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
