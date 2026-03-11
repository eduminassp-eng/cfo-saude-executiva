import { HealthData } from '@/types/health';
import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Scale } from 'lucide-react';

interface Props {
  data: HealthData;
}

interface BalanceItem {
  label: string;
  detail: string;
  impact: number; // 1-10
}

export function HealthBalanceSheet({ data }: Props) {
  const { assets, liabilities, netPosition } = useMemo(() => {
    const assets: BalanceItem[] = [];
    const liabilities: BalanceItem[] = [];

    // Biomarkers
    data.biomarkers.forEach(b => {
      if (b.value === null) return;
      if (b.status === 'green') {
        assets.push({ label: b.name, detail: `${b.value} ${b.unit} — na faixa ideal`, impact: 3 });
      } else if (b.status === 'red') {
        liabilities.push({ label: b.name, detail: `${b.value} ${b.unit} — fora da faixa`, impact: 5 });
      } else if (b.status === 'yellow') {
        liabilities.push({ label: b.name, detail: `${b.value} ${b.unit} — atenção`, impact: 2 });
      }
    });

    // Exams
    const upToDate = data.exams.filter(e => e.status === 'Em dia');
    const overdue = data.exams.filter(e => e.status === 'Atrasado');

    if (upToDate.length > 0) {
      assets.push({ label: 'Exames em dia', detail: `${upToDate.length} exame(s) preventivo(s) realizados`, impact: upToDate.length });
    }
    overdue.forEach(e => {
      liabilities.push({ label: `${e.name} atrasado`, detail: `Rastreamento de ${e.mainRisk.toLowerCase()}`, impact: e.importance === 'Alta' ? 4 : 2 });
    });

    // Lifestyle
    if (data.lifestyle.exerciseFrequency >= 3) {
      assets.push({ label: 'Atividade física regular', detail: `${data.lifestyle.exerciseFrequency}x/semana`, impact: 4 });
    } else {
      liabilities.push({ label: 'Sedentarismo', detail: `Apenas ${data.lifestyle.exerciseFrequency}x/semana`, impact: 3 });
    }

    if (data.lifestyle.sleepHours >= 7 && data.lifestyle.sleepHours <= 9) {
      assets.push({ label: 'Sono adequado', detail: `${data.lifestyle.sleepHours}h/noite`, impact: 3 });
    } else {
      liabilities.push({ label: 'Sono inadequado', detail: `${data.lifestyle.sleepHours}h/noite`, impact: 2 });
    }

    if (data.lifestyle.smokingStatus === 'never') {
      assets.push({ label: 'Não fumante', detail: 'Sem exposição ao tabaco', impact: 5 });
    } else if (data.lifestyle.smokingStatus === 'current') {
      liabilities.push({ label: 'Tabagismo ativo', detail: 'Principal fator de risco evitável', impact: 8 });
    }

    if (data.lifestyle.alcoholWeekly <= 7) {
      assets.push({ label: 'Consumo moderado de álcool', detail: `${data.lifestyle.alcoholWeekly} doses/semana`, impact: 2 });
    } else {
      liabilities.push({ label: 'Consumo elevado de álcool', detail: `${data.lifestyle.alcoholWeekly} doses/semana`, impact: 4 });
    }

    // Sort by impact
    assets.sort((a, b) => b.impact - a.impact);
    liabilities.sort((a, b) => b.impact - a.impact);

    const totalAssets = assets.reduce((s, a) => s + a.impact, 0);
    const totalLiabilities = liabilities.reduce((s, l) => s + l.impact, 0);
    const netPosition = totalAssets - totalLiabilities;

    return { assets, liabilities, netPosition };
  }, [data]);

  const netColor = netPosition >= 10 ? 'hsl(var(--status-green))' : netPosition >= 0 ? 'hsl(var(--status-yellow))' : 'hsl(var(--status-red))';

  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex items-center gap-2 mb-5">
        <Scale className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">Health Balance Sheet</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        {/* Assets */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-status-green" />
            <h4 className="text-sm font-semibold text-status-green">Health Assets</h4>
            <span className="ml-auto text-xs font-mono text-muted-foreground">+{assets.reduce((s, a) => s + a.impact, 0)} pts</span>
          </div>
          <div className="space-y-1.5">
            {assets.slice(0, 10).map((a, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-status-green/5 border border-status-green/10 text-xs animate-fade-in"
                style={{ animationDelay: `${i * 30}ms`, animationFillMode: 'backwards' }}>
                <div className="w-1 h-1 rounded-full bg-status-green shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{a.label}</p>
                  <p className="text-muted-foreground truncate">{a.detail}</p>
                </div>
                <span className="shrink-0 font-mono text-status-green">+{a.impact}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Liabilities */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown className="w-4 h-4 text-status-red" />
            <h4 className="text-sm font-semibold text-status-red">Health Liabilities</h4>
            <span className="ml-auto text-xs font-mono text-muted-foreground">-{liabilities.reduce((s, l) => s + l.impact, 0)} pts</span>
          </div>
          <div className="space-y-1.5">
            {liabilities.slice(0, 10).map((l, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-status-red/5 border border-status-red/10 text-xs animate-fade-in"
                style={{ animationDelay: `${i * 30}ms`, animationFillMode: 'backwards' }}>
                <div className="w-1 h-1 rounded-full bg-status-red shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{l.label}</p>
                  <p className="text-muted-foreground truncate">{l.detail}</p>
                </div>
                <span className="shrink-0 font-mono text-status-red">-{l.impact}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Net Position */}
      <div className="border-t border-border pt-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Net Health Position</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {netPosition >= 10 ? 'Posição saudável e equilibrada.' : netPosition >= 0 ? 'Equilíbrio com oportunidades de melhoria.' : 'Passivos superam ativos — priorize intervenções.'}
          </p>
        </div>
        <span className="text-2xl font-bold font-mono" style={{ color: netColor }}>
          {netPosition >= 0 ? '+' : ''}{netPosition}
        </span>
      </div>
    </div>
  );
}
