import { HealthData } from '@/types/health';
import { generateActionPlan } from '@/lib/actionPlan';
import { Target, Clock, CalendarDays, CalendarRange, Printer } from 'lucide-react';
import { useMemo, useRef, useCallback } from 'react';

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
  const contentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useCallback(() => {
    if (!contentRef.current) return;
    const printWin = window.open('', '_blank');
    if (!printWin) return;
    printWin.document.write(`
      <html><head><title>Plano de Ação — Health CFO</title>
      <style>
        body { font-family: system-ui, sans-serif; padding: 2rem; color: #1a1a1a; }
        h2 { font-size: 1.25rem; margin-bottom: 1rem; }
        h3 { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: #666; margin: 1.25rem 0 0.5rem; }
        .item { display: flex; gap: 0.5rem; align-items: flex-start; margin-bottom: 0.5rem; font-size: 0.875rem; }
        .badge { font-size: 0.625rem; font-weight: 700; text-transform: uppercase; padding: 2px 6px; border-radius: 4px; }
        .alta { background: #fee; color: #c00; }
        .media { background: #fff8e1; color: #b8860b; }
        .baixa { background: #e8f5e9; color: #2e7d32; }
        .reason { font-size: 0.75rem; color: #888; margin-left: 0.25rem; }
        .footer { margin-top: 2rem; font-size: 0.7rem; color: #999; text-align: center; border-top: 1px solid #eee; padding-top: 1rem; }
      </style></head><body>
      <h2>🎯 Plano de Ação — Health CFO</h2>
    `);
    const horizonLabels = ['Próximos 30 dias', 'Próximos 90 dias', 'Próximos 180 dias'];
    const horizonData = [plan.thirtyDays, plan.ninetyDays, plan.oneEightyDays];
    horizonData.forEach((items, i) => {
      printWin.document.write(`<h3>${horizonLabels[i]}</h3>`);
      if (items.length === 0) {
        printWin.document.write('<p style="font-size:0.8rem;color:#999">Nenhuma ação pendente.</p>');
      }
      items.forEach(item => {
        const cls = item.priority === 'alta' ? 'alta' : item.priority === 'média' ? 'media' : 'baixa';
        printWin.document.write(`<div class="item"><span class="badge ${cls}">${item.priority}</span><span>${item.action} <span class="reason">— ${item.reason}</span></span></div>`);
      });
    });
    printWin.document.write('<div class="footer">Gerado em ' + new Date().toLocaleDateString('pt-BR') + ' • Este documento é para acompanhamento preventivo.</div>');
    printWin.document.write('</body></html>');
    printWin.document.close();
    printWin.print();
  }, [plan]);

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
