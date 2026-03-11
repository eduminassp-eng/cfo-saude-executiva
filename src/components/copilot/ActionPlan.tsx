import { HealthData } from '@/types/health';
import { Target, Clock, CalendarDays, CalendarRange } from 'lucide-react';
import { useMemo } from 'react';

interface Props {
  data: HealthData;
}

interface ActionItem {
  action: string;
  reason: string;
  priority: 'alta' | 'média' | 'baixa';
}

interface ActionPlan {
  thirtyDays: ActionItem[];
  ninetyDays: ActionItem[];
  oneEightyDays: ActionItem[];
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

function generateActionPlan(data: HealthData): ActionPlan {
  const thirtyDays: ActionItem[] = [];
  const ninetyDays: ActionItem[] = [];
  const oneEightyDays: ActionItem[] = [];

  // 30 days: Urgent overdue exams
  const overdueHigh = data.exams.filter(e => e.status === 'Atrasado' && e.importance === 'Alta');
  overdueHigh.forEach(e => {
    thirtyDays.push({
      action: `Agendar ${e.name} com urgência`,
      reason: `Atrasado — rastreamento de ${e.mainRisk.toLowerCase()}`,
      priority: 'alta',
    });
  });

  // 30 days: Critical biomarkers
  const redBiomarkers = data.biomarkers.filter(b => b.status === 'red');
  redBiomarkers.forEach(b => {
    thirtyDays.push({
      action: `Consultar especialista sobre ${b.name} (${b.value} ${b.unit})`,
      reason: 'Valor em faixa crítica — requer avaliação imediata',
      priority: 'alta',
    });
  });

  // 30 days: Upcoming exams
  const upcoming = data.exams.filter(e => e.status === 'Próximo');
  upcoming.forEach(e => {
    thirtyDays.push({
      action: `Agendar ${e.name} antes do vencimento`,
      reason: `Vence em breve — manter adesão preventiva`,
      priority: 'média',
    });
  });

  // 90 days: Other overdue exams
  const overdueOther = data.exams.filter(e => e.status === 'Atrasado' && e.importance !== 'Alta');
  overdueOther.forEach(e => {
    ninetyDays.push({
      action: `Realizar ${e.name}`,
      reason: `Atrasado — importância ${e.importance.toLowerCase()}`,
      priority: 'média',
    });
  });

  // 90 days: Yellow biomarkers - lifestyle changes
  const yellowBiomarkers = data.biomarkers.filter(b => b.status === 'yellow');
  if (yellowBiomarkers.length > 0) {
    const metabolic = yellowBiomarkers.filter(b => ['glicemia', 'hba1c', 'insulina', 'imc', 'cintura', 'trig'].includes(b.id));
    if (metabolic.length > 0) {
      ninetyDays.push({
        action: 'Iniciar programa de reeducação alimentar e atividade física regular',
        reason: `${metabolic.length} marcador(es) metabólico(s) em faixa de atenção`,
        priority: 'média',
      });
    }

    const cardiac = yellowBiomarkers.filter(b => ['pa-sys', 'pa-dia', 'ldl', 'pcr'].includes(b.id));
    if (cardiac.length > 0) {
      ninetyDays.push({
        action: 'Agendar consulta cardiológica para reavaliação',
        reason: `${cardiac.length} marcador(es) cardiovascular(es) alterado(s)`,
        priority: 'média',
      });
    }
  }

  // 90 days: Repeat critical biomarkers
  if (redBiomarkers.length > 0) {
    ninetyDays.push({
      action: `Repetir exames de ${redBiomarkers.map(b => b.name).slice(0, 3).join(', ')} para avaliar evolução`,
      reason: 'Confirmar melhora após intervenção',
      priority: 'alta',
    });
  }

  // 90 days: Lifestyle adjustments
  if (data.lifestyle.exerciseFrequency < 3) {
    ninetyDays.push({
      action: 'Atingir mínimo de 150 min/semana de atividade física moderada',
      reason: `Frequência atual: ${data.lifestyle.exerciseFrequency}x/semana`,
      priority: 'média',
    });
  }

  if (data.lifestyle.sleepHours < 7) {
    ninetyDays.push({
      action: 'Otimizar higiene do sono para atingir 7-8h por noite',
      reason: `Sono atual: ${data.lifestyle.sleepHours}h`,
      priority: 'baixa',
    });
  }

  // 180 days: Pending exams
  const pending = data.exams.filter(e => e.status === 'Pendente');
  pending.slice(0, 4).forEach(e => {
    oneEightyDays.push({
      action: `Discutir necessidade de ${e.name} com médico`,
      reason: `Exame nunca realizado — importância: ${e.importance.toLowerCase()}`,
      priority: e.importance === 'Alta' ? 'média' : 'baixa',
    });
  });

  // 180 days: General check-up
  oneEightyDays.push({
    action: 'Realizar check-up completo com todos os biomarcadores',
    reason: 'Manter acompanhamento semestral de saúde',
    priority: 'média',
  });

  // 180 days: Supplement review if needed
  const nutritionIssues = data.biomarkers.filter(b => ['vitd', 'vitb12', 'ferritina'].includes(b.id) && b.status !== 'green');
  if (nutritionIssues.length > 0) {
    oneEightyDays.push({
      action: `Reavaliar níveis de ${nutritionIssues.map(b => b.name).join(', ')} após suplementação`,
      reason: 'Verificar eficácia da suplementação',
      priority: 'média',
    });
  }

  return { thirtyDays: thirtyDays.slice(0, 5), ninetyDays: ninetyDays.slice(0, 5), oneEightyDays: oneEightyDays.slice(0, 5) };
}
