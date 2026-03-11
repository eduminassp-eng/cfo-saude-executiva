import { HealthData } from '@/types/health';
import { generateActionPlan } from '@/lib/actionPlan';
import { Target, Clock, CalendarDays, CalendarRange } from 'lucide-react';
import { useMemo } from 'react';

interface Props {
  data: HealthData;
}

const priorityStyles: Record<string, { bg: string; text: string }> = {
  alta: { bg: 'bg-status-red/10', text: 'text-status-red' },
  média: { bg: 'bg-status-yellow/10', text: 'text-status-yellow' },
  baixa: { bg: 'bg-status-green/10', text: 'text-status-green' },
};

export function CopilotActionPlan({ data }: Props) {
  const plan = useMemo(() => generateActionPlan(data), [data]);

  const horizons = [
    { key: 'thirtyDays' as const, label: 'Próximos 30 dias', icon: Clock, items: plan.thirtyDays },
    { key: 'ninetyDays' as const, label: 'Próximos 90 dias', icon: CalendarDays, items: plan.ninetyDays },
    { key: 'oneEightyDays' as const, label: 'Próximos 180 dias', icon: CalendarRange, items: plan.oneEightyDays },
  ];

  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex items-center gap-2 mb-5">
        <Target className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">Plano de Ação</h3>
      </div>
      <div className="space-y-5">
        {horizons.map((h, hi) => (
          <div key={h.key}>
            <div className="flex items-center gap-2 mb-3">
              <h.icon className="w-4 h-4 text-muted-foreground" />
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{h.label}</h4>
            </div>
            <div className="space-y-2">
              {h.items.map((item, i) => {
                const style = priorityStyles[item.priority];
                return (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50 border border-border/30 animate-fade-in"
                    style={{ animationDelay: `${(hi * 4 + i) * 50}ms`, animationFillMode: 'backwards' }}
                  >
                    <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${style.bg} ${style.text}`}>
                      {item.priority}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm leading-relaxed">{item.action}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.reason}</p>
                    </div>
                  </div>
                );
              })}
              {h.items.length === 0 && (
                <p className="text-xs text-muted-foreground pl-6">Nenhuma ação pendente neste horizonte.</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
