import { ExamInsight } from '@/lib/copilot';
import { ChevronDown, ChevronUp, ArrowRight, MessageCircleQuestion, Clock } from 'lucide-react';
import { useState } from 'react';

const examStatusConfig: Record<string, { bg: string; text: string; dot: string }> = {
  'Em dia': { bg: 'bg-status-green/10', text: 'text-status-green', dot: 'bg-status-green' },
  'Próximo': { bg: 'bg-status-yellow/10', text: 'text-status-yellow', dot: 'bg-status-yellow' },
  'Atrasado': { bg: 'bg-status-red/10', text: 'text-status-red', dot: 'bg-status-red' },
  'Pendente': { bg: 'bg-secondary', text: 'text-muted-foreground', dot: 'bg-muted-foreground' },
};

interface Props {
  insight: ExamInsight;
  index: number;
}

export function CopilotExamCard({ insight, index }: Props) {
  const [expanded, setExpanded] = useState(false);
  const { exam: e } = insight;
  const cfg = examStatusConfig[e.status] ?? examStatusConfig['Pendente'];

  return (
    <div
      className="glass-card rounded-xl overflow-hidden animate-fade-in"
      style={{ animationDelay: `${index * 40}ms`, animationFillMode: 'backwards' }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 p-4 text-left hover:bg-accent/30 transition-colors"
      >
        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${cfg.dot}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm">{e.name}</span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${cfg.bg} ${cfg.text}`}>{e.status}</span>
            <span className="text-[10px] text-muted-foreground">{e.category}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{insight.interpretation}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-muted-foreground">{e.importance}</p>
          <p className="text-[10px] text-muted-foreground">{e.suggestedFrequency}</p>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
      </button>

      {expanded && (
        <div className="border-t border-border/50 p-4 space-y-4 animate-fade-in">
          {/* Details */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-secondary/50 rounded-lg p-2.5">
              <p className="text-muted-foreground">Tipo</p>
              <p className="font-medium mt-0.5">{e.type}</p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-2.5">
              <p className="text-muted-foreground">Perigo Principal</p>
              <p className="font-medium mt-0.5">{e.mainRisk}</p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-2.5">
              <p className="text-muted-foreground">Última Data</p>
              <p className="font-mono font-medium mt-0.5">{e.lastDate ? new Date(e.lastDate).toLocaleDateString('pt-BR') : '—'}</p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-2.5">
              <p className="text-muted-foreground">Próxima Data</p>
              <p className="font-mono font-medium mt-0.5">{e.nextDate ? new Date(e.nextDate).toLocaleDateString('pt-BR') : '—'}</p>
            </div>
          </div>

          {e.resultSummary && (
            <div className="bg-secondary/50 rounded-lg p-2.5 text-xs">
              <p className="text-muted-foreground">Resultado</p>
              <p className="font-medium mt-0.5">{e.resultSummary}</p>
            </div>
          )}

          {/* Next step */}
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-primary/5 border border-primary/10">
            <ArrowRight className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-primary mb-0.5">Próximo passo sugerido</p>
              <p className="text-sm leading-relaxed">{insight.nextStep}</p>
            </div>
          </div>

          {/* Doctor question */}
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-secondary/50 border border-border/30">
            <MessageCircleQuestion className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-0.5">Pergunta para o médico</p>
              <p className="text-sm leading-relaxed italic">"{insight.doctorQuestion}"</p>
            </div>
          </div>

          {e.doctor && (
            <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              Médico: {e.doctor}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
