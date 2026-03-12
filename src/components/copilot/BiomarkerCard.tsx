import { BiomarkerInsight } from '@/lib/copilot';
import { ChevronRight, Heart, Clock, MessageCircleQuestion, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { ResponsiveContainer, LineChart, Line } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

const statusConfig: Record<string, { label: string; colorVar: string }> = {
  green: { label: 'Normal', colorVar: '--status-green' },
  yellow: { label: 'Atenção', colorVar: '--status-yellow' },
  red: { label: 'Crítico', colorVar: '--status-red' },
  unknown: { label: 'Sem dados', colorVar: '--muted-foreground' },
};

interface Props {
  insight: BiomarkerInsight;
  index: number;
}

export function CopilotBiomarkerCard({ insight, index }: Props) {
  const [expanded, setExpanded] = useState(false);
  const { biomarker: b } = insight;
  const cfg = statusConfig[b.status] ?? statusConfig.unknown;
  const statusColor = `hsl(var(${cfg.colorVar}))`;

  const targetRange = b.targetMin !== null && b.targetMax !== null
    ? `${b.targetMin}–${b.targetMax} ${b.unit}`
    : b.targetMax !== null
    ? `≤ ${b.targetMax} ${b.unit}`
    : b.targetMin !== null
    ? `≥ ${b.targetMin} ${b.unit}`
    : '—';

  const glowStyle = b.status === 'red' ? {
    borderColor: `hsl(var(--status-red) / 0.25)`,
    boxShadow: `0 0 24px -6px hsl(var(--status-red) / 0.12)`,
  } : b.status === 'yellow' ? {
    borderColor: `hsl(var(--status-yellow) / 0.2)`,
    boxShadow: `0 0 20px -6px hsl(var(--status-yellow) / 0.1)`,
  } : {};

  return (
    <motion.div
      layout
      className={`glass-card rounded-xl overflow-hidden transition-all ${expanded ? 'ring-1 ring-primary/30' : ''}`}
      style={glowStyle}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 p-4 lg:p-5 text-left hover:bg-accent/30 transition-colors"
      >
        {/* Status indicator */}
        <div
          className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${statusColor.replace(')', ' / 0.12)')}` }}
        >
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: statusColor }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm">{b.name}</span>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
              style={{
                backgroundColor: `${statusColor.replace(')', ' / 0.12)')}`,
                color: statusColor,
              }}
            >
              {cfg.label}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 truncate leading-relaxed">{insight.interpretation}</p>
        </div>

        <div className="text-right shrink-0">
          <p className="font-mono text-sm font-bold">{b.value ?? '—'} <span className="text-xs text-muted-foreground font-normal">{b.unit}</span></p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Ref: {targetRange}</p>
        </div>

        <motion.div animate={{ rotate: expanded ? 90 : 0 }} transition={{ duration: 0.2 }} className="shrink-0">
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </motion.div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-border/40 p-4 lg:p-5 space-y-4">
              {/* Sparkline trend */}
              {(() => {
                const history = b.history ?? [];
                const sparkData = [
                  ...history.slice().reverse().map(h => ({ v: h.value })),
                  ...(b.value !== null ? [{ v: b.value }] : []),
                ];
                return sparkData.length >= 2 ? (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Tendência Histórica</p>
                    <div className="h-16 w-full bg-secondary/30 rounded-xl p-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={sparkData} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
                          <Line type="monotone" dataKey="v" stroke={statusColor} strokeWidth={2} dot={{ r: 2, fill: statusColor }} activeDot={false} isAnimationActive />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                ) : null;
              })()}

              {/* Score impact */}
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Impacto nos Scores</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Cardíaco', value: insight.scoreImpact.cardiac, colorVar: '--score-cardiac' },
                    { label: 'Metabólico', value: insight.scoreImpact.metabolic, colorVar: '--score-metabolic' },
                    { label: 'Longevidade', value: insight.scoreImpact.longevity, colorVar: '--score-longevity' },
                  ].map(s => (
                    <div key={s.label} className="bg-secondary/50 rounded-xl p-2.5 text-center">
                      <Heart className="w-3 h-3 mx-auto mb-1" style={{ color: `hsl(var(${s.colorVar}))` }} />
                      <p className="text-[10px] font-semibold" style={{ color: s.value === '—' ? undefined : `hsl(var(${s.colorVar}))` }}>{s.label}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{s.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Next step */}
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-primary/5 border border-primary/10">
                <ArrowRight className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-primary font-semibold mb-1">Próximo passo</p>
                  <p className="text-sm leading-relaxed">{insight.nextStep}</p>
                </div>
              </div>

              {/* Doctor question */}
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-secondary/50 border border-border/30">
                <MessageCircleQuestion className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Pergunta para o médico</p>
                  <p className="text-sm leading-relaxed italic">"{insight.doctorQuestion}"</p>
                </div>
              </div>

              {b.lastDate && (
                <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  Última medição: {new Date(b.lastDate).toLocaleDateString('pt-BR')}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}