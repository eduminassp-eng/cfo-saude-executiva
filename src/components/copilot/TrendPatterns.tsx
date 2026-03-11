import { TrendPattern } from '@/lib/copilot';
import { TrendingUp, TrendingDown, Minus, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface Props {
  patterns: TrendPattern[];
}

export function CopilotTrendPatterns({ patterns }: Props) {
  if (patterns.length === 0) {
    return (
      <div className="glass-card rounded-xl p-5">
        <h3 className="font-semibold mb-2">Padrões de Tendência</h3>
        <p className="text-sm text-muted-foreground">Dados históricos insuficientes para detectar padrões.</p>
      </div>
    );
  }

  const negative = patterns.filter(p => p.severity === 'negative');
  const positive = patterns.filter(p => p.severity === 'positive');
  const neutral = patterns.filter(p => p.severity === 'neutral');

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Negative trends */}
      {negative.length > 0 && (
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-status-red" />
            <h3 className="font-semibold">Tendências de Piora</h3>
            <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full ml-auto">
              {negative.length}
            </span>
          </div>
          <div className="space-y-2.5">
            {negative.map((p, i) => (
              <TrendCard key={p.biomarkerId} pattern={p} delay={i * 80} />
            ))}
          </div>
        </div>
      )}

      {/* Positive trends */}
      {positive.length > 0 && (
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="w-5 h-5 text-status-green" />
            <h3 className="font-semibold">Tendências de Melhora</h3>
            <span className="text-xs bg-status-green/10 text-status-green px-2 py-0.5 rounded-full ml-auto">
              {positive.length}
            </span>
          </div>
          <div className="space-y-2.5">
            {positive.map((p, i) => (
              <TrendCard key={p.biomarkerId} pattern={p} delay={i * 80} />
            ))}
          </div>
        </div>
      )}

      {/* Stable */}
      {neutral.length > 0 && (
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Minus className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-semibold">Estáveis</h3>
            <span className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded-full ml-auto">
              {neutral.length}
            </span>
          </div>
          <div className="space-y-2.5">
            {neutral.map((p, i) => (
              <TrendCard key={p.biomarkerId} pattern={p} delay={i * 80} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TrendCard({ pattern: p, delay }: { pattern: TrendPattern; delay: number }) {
  const borderColor =
    p.severity === 'negative' ? 'border-status-red/10 bg-status-red/5' :
    p.severity === 'positive' ? 'border-status-green/10 bg-status-green/5' :
    'border-border/30 bg-secondary/30';

  const dotColor =
    p.severity === 'negative' ? 'bg-status-red' :
    p.severity === 'positive' ? 'bg-status-green' :
    'bg-muted-foreground';

  const changeColor =
    p.severity === 'negative' ? 'text-status-red' :
    p.severity === 'positive' ? 'text-status-green' :
    'text-muted-foreground';

  const Arrow = p.direction === 'rising' ? ArrowUpRight :
    p.direction === 'falling' ? ArrowDownRight : Minus;

  return (
    <div
      className={`p-3 rounded-lg border ${borderColor} animate-fade-in`}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'backwards' }}
    >
      <div className="flex items-start gap-3">
        <div className={`w-1.5 h-1.5 rounded-full ${dotColor} mt-2 shrink-0`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium">{p.biomarkerName}</span>
            <span className={`inline-flex items-center gap-0.5 text-xs font-mono font-bold ${changeColor}`}>
              <Arrow className="w-3 h-3" />
              {p.direction !== 'stable' ? `${Math.abs(p.changePercent)}%` : '~'}
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{p.insight}</p>
          <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
            <span className="font-mono">{p.previousValue} → {p.currentValue} {p.unit}</span>
            <span>•</span>
            <span>{p.dataPoints} medições</span>
          </div>
        </div>
      </div>
    </div>
  );
}
