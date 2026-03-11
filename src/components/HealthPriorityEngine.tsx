import { useMemo } from 'react';
import { HealthData } from '@/types/health';
import { generatePriorities, HealthPriority } from '@/lib/priorityEngine';
import {
  Target, CalendarCheck, Activity, Stethoscope,
  ArrowRight, Clock, Crosshair, Lightbulb, TrendingUp,
} from 'lucide-react';

const typeConfig: Record<HealthPriority['type'], { icon: typeof Target; label: string }> = {
  exam: { icon: CalendarCheck, label: 'Exame preventivo' },
  biomarker: { icon: Crosshair, label: 'Biomarcador' },
  lifestyle: { icon: Activity, label: 'Estilo de vida' },
  specialist: { icon: Stethoscope, label: 'Especialista' },
};

interface Props {
  data: HealthData;
}

export function HealthPriorityEngine({ data }: Props) {
  const priorities = useMemo(() => generatePriorities(data), [data]);

  if (priorities.length === 0) return null;

  const main = priorities[0];
  const secondary = priorities.slice(1, 3);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
          <Target className="w-5 h-5" style={{ color: 'hsl(var(--primary))' }} />
          Prioridades de Saúde
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Ações recomendadas com base nos seus dados, tendências e projeções
        </p>
      </div>

      {/* Main Priority */}
      <MainPriorityCard priority={main} />

      {/* Secondary Priorities */}
      {secondary.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {secondary.map((p, i) => (
            <SecondaryPriorityCard key={p.id} priority={p} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

function MainPriorityCard({ priority }: { priority: HealthPriority }) {
  const cfg = typeConfig[priority.type];
  const Icon = cfg.icon;

  return (
    <div
      className="glass-card rounded-xl overflow-hidden animate-fade-in"
      style={{ borderLeft: '4px solid hsl(var(--primary))' }}
    >
      <div className="p-5 space-y-4">
        {/* Top badge + title */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span
                className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
                style={{
                  color: 'hsl(var(--primary))',
                  backgroundColor: 'hsl(var(--primary) / 0.12)',
                }}
              >
                Prioridade #1
              </span>
              <span className="text-[10px] font-medium text-muted-foreground px-1.5 py-0.5 rounded-full bg-secondary">
                {cfg.label}
              </span>
            </div>
            <h3 className="text-base font-semibold leading-tight">{priority.title}</h3>
          </div>
          <div
            className="p-2.5 rounded-xl shrink-0"
            style={{ backgroundColor: 'hsl(var(--primary) / 0.1)' }}
          >
            <Icon className="w-5 h-5" style={{ color: 'hsl(var(--primary))' }} />
          </div>
        </div>

        {/* Why it matters */}
        <div className="space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Por que importa</p>
          <p className="text-sm text-muted-foreground leading-relaxed">{priority.whyItMatters}</p>
        </div>

        {/* Impact + Action grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-lg p-3 space-y-1.5" style={{ backgroundColor: 'hsl(var(--status-green) / 0.04)', border: '1px solid hsl(var(--status-green) / 0.1)' }}>
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-3 h-3" style={{ color: 'hsl(var(--status-green))' }} />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Impacto esperado</span>
            </div>
            <p className="text-xs font-medium leading-relaxed">{priority.expectedImpact}</p>
          </div>
          <div className="rounded-lg p-3 space-y-1.5" style={{ backgroundColor: 'hsl(var(--primary) / 0.04)', border: '1px solid hsl(var(--primary) / 0.1)' }}>
            <div className="flex items-center gap-1.5">
              <Lightbulb className="w-3 h-3" style={{ color: 'hsl(var(--primary))' }} />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Próximo passo</span>
            </div>
            <p className="text-xs font-medium leading-relaxed">{priority.nextAction}</p>
          </div>
        </div>

        {/* Footer meta */}
        <div className="flex items-center justify-between pt-1 border-t border-border/20">
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {priority.timeHorizon}
            </span>
            <span className="flex items-center gap-1">
              <ArrowRight className="w-3 h-3" />
              {priority.domain}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SecondaryPriorityCard({ priority, index }: { priority: HealthPriority; index: number }) {
  const cfg = typeConfig[priority.type];
  const Icon = cfg.icon;

  return (
    <div
      className="glass-card rounded-xl p-4 space-y-3 animate-fade-in"
      style={{ animationDelay: `${(index + 1) * 80}ms`, animationFillMode: 'backwards' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-medium text-muted-foreground px-1.5 py-0.5 rounded-full bg-secondary">
              #{index + 2}
            </span>
            <span className="text-[10px] text-muted-foreground">{cfg.label}</span>
          </div>
          <h4 className="text-sm font-semibold leading-tight">{priority.title}</h4>
        </div>
        <div className="p-1.5 rounded-lg bg-secondary shrink-0">
          <Icon className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
      </div>

      {/* Why */}
      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{priority.whyItMatters}</p>

      {/* Action */}
      <div className="rounded-lg p-2.5 bg-secondary/50 space-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Próximo passo</p>
        <p className="text-xs font-medium leading-relaxed">{priority.nextAction}</p>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {priority.timeHorizon}
        </span>
        <span className="flex items-center gap-1">
          <ArrowRight className="w-3 h-3" />
          {priority.domain}
        </span>
      </div>
    </div>
  );
}
