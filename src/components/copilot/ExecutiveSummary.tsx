import { ExecutiveSummary } from '@/lib/copilot';
import { HealthScore } from '@/types/health';
import { CheckCircle2, AlertTriangle, CalendarClock, Stethoscope } from 'lucide-react';

interface Props {
  summary: ExecutiveSummary;
  scores: { cardiac: HealthScore; metabolic: HealthScore; longevity: HealthScore };
}

export function CopilotExecutiveSummary({ summary }: Props) {
  return (
    <div className="space-y-4 animate-fade-in">
      {/* Strengths */}
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 className="w-5 h-5 text-status-green" />
          <h3 className="font-semibold">Pontos Fortes</h3>
        </div>
        <div className="space-y-2.5">
          {summary.strengths.map((s, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-3 rounded-lg bg-status-green/5 border border-status-green/10 animate-fade-in"
              style={{ animationDelay: `${i * 80}ms`, animationFillMode: 'backwards' }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-status-green mt-2 shrink-0" />
              <p className="text-sm leading-relaxed">{s}</p>
            </div>
          ))}
          {summary.strengths.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum ponto forte identificado com os dados atuais.</p>
          )}
        </div>
      </div>

      {/* Attention points */}
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-status-yellow" />
          <h3 className="font-semibold">Pontos de Atenção</h3>
        </div>
        <div className="space-y-2.5">
          {summary.attentionPoints.map((s, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-3 rounded-lg bg-status-yellow/5 border border-status-yellow/10 animate-fade-in"
              style={{ animationDelay: `${(i + 3) * 80}ms`, animationFillMode: 'backwards' }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-status-yellow mt-2 shrink-0" />
              <p className="text-sm leading-relaxed">{s}</p>
            </div>
          ))}
          {summary.attentionPoints.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum ponto de atenção identificado.</p>
          )}
        </div>
      </div>

      {/* Overdue exams */}
      {summary.overdueExams.length > 0 && (
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <CalendarClock className="w-5 h-5 text-status-red" />
            <h3 className="font-semibold">Exames Atrasados</h3>
          </div>
          <div className="space-y-2.5">
            {summary.overdueExams.map((e, i) => (
              <div
                key={e.id}
                className="flex items-center justify-between p-3 rounded-lg bg-status-red/5 border border-status-red/10 animate-fade-in"
                style={{ animationDelay: `${(i + 6) * 80}ms`, animationFillMode: 'backwards' }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-status-red shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{e.name}</p>
                    <p className="text-xs text-muted-foreground">{e.category} • {e.mainRisk}</p>
                  </div>
                </div>
                <span className="text-xs font-mono text-muted-foreground">
                  {e.nextDate ? new Date(e.nextDate).toLocaleDateString('pt-BR') : '—'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggested appointments */}
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Stethoscope className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Próximas Consultas Sugeridas</h3>
        </div>
        <div className="space-y-2.5">
          {summary.suggestedAppointments.map((s, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10 animate-fade-in"
              style={{ animationDelay: `${(i + 8) * 80}ms`, animationFillMode: 'backwards' }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
              <p className="text-sm leading-relaxed">{s}</p>
            </div>
          ))}
          {summary.suggestedAppointments.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhuma consulta adicional sugerida no momento.</p>
          )}
        </div>
      </div>
    </div>
  );
}
