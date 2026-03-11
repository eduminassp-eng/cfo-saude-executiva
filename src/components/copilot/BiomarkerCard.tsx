import { BiomarkerInsight } from '@/lib/copilot';
import { ChevronDown, ChevronUp, Heart, Zap, Clock, MessageCircleQuestion, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { ResponsiveContainer, LineChart, Line } from 'recharts';

const statusConfig: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  green: { label: 'Normal', bg: 'bg-status-green/10', text: 'text-status-green', dot: 'bg-status-green' },
  yellow: { label: 'Atenção', bg: 'bg-status-yellow/10', text: 'text-status-yellow', dot: 'bg-status-yellow' },
  red: { label: 'Crítico', bg: 'bg-status-red/10', text: 'text-status-red', dot: 'bg-status-red' },
  unknown: { label: 'Sem dados', bg: 'bg-secondary', text: 'text-muted-foreground', dot: 'bg-muted-foreground' },
};

interface Props {
  insight: BiomarkerInsight;
  index: number;
}

export function CopilotBiomarkerCard({ insight, index }: Props) {
  const [expanded, setExpanded] = useState(false);
  const { biomarker: b } = insight;
  const cfg = statusConfig[b.status] ?? statusConfig.unknown;

  const targetRange = b.targetMin !== null && b.targetMax !== null
    ? `${b.targetMin}–${b.targetMax} ${b.unit}`
    : b.targetMax !== null
    ? `≤ ${b.targetMax} ${b.unit}`
    : b.targetMin !== null
    ? `≥ ${b.targetMin} ${b.unit}`
    : '—';

  return (
    <div
      className="glass-card rounded-xl overflow-hidden animate-fade-in"
      style={{ animationDelay: `${index * 40}ms`, animationFillMode: 'backwards' }}
    >
      {/* Header - always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 p-4 text-left hover:bg-accent/30 transition-colors"
      >
        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${cfg.dot}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm">{b.name}</span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{insight.interpretation}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="font-mono text-sm font-semibold">{b.value ?? '—'} <span className="text-xs text-muted-foreground font-normal">{b.unit}</span></p>
          <p className="text-[10px] text-muted-foreground">Meta: {targetRange}</p>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-border/50 p-4 space-y-4 animate-fade-in">
          {/* Score impact */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Impacto nos Scores</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Cardíaco', value: insight.scoreImpact.cardiac, color: 'hsl(var(--score-cardiac))' },
                { label: 'Metabólico', value: insight.scoreImpact.metabolic, color: 'hsl(var(--score-metabolic))' },
                { label: 'Longevidade', value: insight.scoreImpact.longevity, color: 'hsl(var(--score-longevity))' },
              ].map(s => (
                <div key={s.label} className="bg-secondary/50 rounded-lg p-2.5 text-center">
                  <Heart className="w-3 h-3 mx-auto mb-1" style={{ color: s.color }} />
                  <p className="text-[10px] font-medium" style={{ color: s.value === '—' ? undefined : s.color }}>{s.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{s.value}</p>
                </div>
              ))}
            </div>
          </div>

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

          {/* Last date */}
          {b.lastDate && (
            <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              Última medição: {new Date(b.lastDate).toLocaleDateString('pt-BR')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
