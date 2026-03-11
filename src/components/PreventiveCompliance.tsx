import { HealthData } from '@/types/health';
import { useMemo } from 'react';
import { ShieldCheck } from 'lucide-react';

interface Props {
  data: HealthData;
}

export function PreventiveComplianceScore({ data }: Props) {
  const { score, explanation, status } = useMemo(() => {
    const total = data.exams.length;
    if (total === 0) return { score: 0, explanation: 'Nenhum exame cadastrado.', status: 'unknown' as const };

    const upToDate = data.exams.filter(e => e.status === 'Em dia').length;
    const upcoming = data.exams.filter(e => e.status === 'Próximo').length;
    const overdue = data.exams.filter(e => e.status === 'Atrasado').length;
    const pending = data.exams.filter(e => e.status === 'Pendente').length;

    const s = Math.round(((upToDate * 1 + upcoming * 0.75 + pending * 0.25) / total) * 100);

    let exp = '';
    if (s >= 85) exp = `Excelente adesão preventiva. ${upToDate} de ${total} exames em dia.`;
    else if (s >= 60) exp = `Boa adesão, mas ${overdue + pending} exame(s) pendente(s) ou atrasado(s).`;
    else exp = `Adesão preventiva baixa. ${overdue} atrasado(s), ${pending} pendente(s). Agende seus exames.`;

    const st = s >= 75 ? 'green' : s >= 50 ? 'yellow' : 'red';
    return { score: s, explanation: exp, status: st };
  }, [data.exams]);

  const colorVar = `var(--status-${status})`;

  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-secondary">
          <ShieldCheck className="w-5 h-5" style={{ color: `hsl(${colorVar})` }} />
        </div>
        <div>
          <h3 className="font-semibold text-sm">Compliance Preventivo</h3>
          <p className="text-xs text-muted-foreground">Adesão aos exames recomendados</p>
        </div>
        <span
          className="ml-auto text-2xl font-bold font-mono"
          style={{ color: `hsl(${colorVar})` }}
        >
          {score}
        </span>
      </div>
      <div className="w-full h-2 rounded-full bg-secondary mb-3">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${score}%`, backgroundColor: `hsl(${colorVar})` }}
        />
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{explanation}</p>
    </div>
  );
}
