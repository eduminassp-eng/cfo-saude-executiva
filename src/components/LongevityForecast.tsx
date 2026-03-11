import { ForecastResult, ScoreForecast, buildForecastSummary } from '@/lib/forecast';
import { TrendingUp, TrendingDown, Minus, ArrowRight, Activity, Heart, Flame, ShieldCheck, AlertTriangle, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';
import { useState, useMemo } from 'react';

interface Props {
  forecast: ForecastResult;
}

const scoreConfig = [
  { key: 'cardiac' as const, label: 'Cardíaco', icon: Heart, colorVar: '--score-cardiac' },
  { key: 'metabolic' as const, label: 'Metabólico', icon: Flame, colorVar: '--score-metabolic' },
  { key: 'longevity' as const, label: 'Longevidade', icon: Activity, colorVar: '--score-longevity' },
  { key: 'compliance' as const, label: 'Compliance Preventivo', icon: ShieldCheck, colorVar: '--primary' },
];

const trendConfig = {
  improving: { icon: TrendingUp, label: 'Melhorando', colorVar: '--status-green' },
  stable: { icon: Minus, label: 'Estável', colorVar: '--status-yellow' },
  declining: { icon: TrendingDown, label: 'Declinando', colorVar: '--status-red' },
};

export function LongevityForecast({ forecast }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="glass-card rounded-xl p-5 space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Projeção de Longevidade</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Estimativa baseada em tendências, estilo de vida e adesão preventiva
          </p>
        </div>
        <div className="text-[10px] text-muted-foreground font-mono">
          {new Date(forecast.generatedAt).toLocaleDateString('pt-BR')}
        </div>
      </div>

      {/* Score Projections */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {scoreConfig.map(({ key, label, icon: Icon, colorVar }, idx) => {
          const f = forecast[key];
          const trend = trendConfig[f.trend];
          const TrendIcon = trend.icon;
          return (
            <div
              key={key}
              className="rounded-xl border border-border/40 p-4 space-y-3 animate-fade-in"
              style={{
                background: `linear-gradient(135deg, hsl(var(${colorVar}) / 0.04), hsl(var(${colorVar}) / 0.01))`,
                animationDelay: `${idx * 80}ms`,
                animationFillMode: 'backwards',
              }}
            >
              {/* Title row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" style={{ color: `hsl(var(${colorVar}))` }} />
                  <span className="text-sm font-medium">{label}</span>
                </div>
                <span
                  className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                  style={{
                    color: `hsl(var(${trend.colorVar}))`,
                    backgroundColor: `hsl(var(${trend.colorVar}) / 0.12)`,
                  }}
                >
                  <TrendIcon className="w-3 h-3" />
                  {trend.label}
                </span>
              </div>

              {/* Timeline */}
              <div className="flex items-center justify-between gap-1">
                <ScoreNode label="Atual" value={f.current} colorVar={colorVar} highlight />
                <ArrowRight className="w-3 h-3 text-muted-foreground/40 shrink-0" />
                <ScoreNode label="3m" value={f.month3} colorVar={colorVar} />
                <ArrowRight className="w-3 h-3 text-muted-foreground/40 shrink-0" />
                <ScoreNode label="6m" value={f.month6} colorVar={colorVar} />
                <ArrowRight className="w-3 h-3 text-muted-foreground/40 shrink-0" />
                <ScoreNode label="12m" value={f.month12} colorVar={colorVar} />
              </div>

              {/* Progress bar showing projected 12m */}
              <div className="w-full h-1.5 rounded-full bg-secondary/60">
                <div
                  className="h-full rounded-full transition-all duration-700 relative"
                  style={{
                    width: `${f.month12}%`,
                    backgroundColor: `hsl(var(${colorVar}))`,
                  }}
                >
                  {/* Current position marker */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-0.5 h-3 rounded-full bg-foreground/40"
                    style={{ left: `${(f.current / Math.max(f.month12, 1)) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Factors */}
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <span>{expanded ? 'Ocultar' : 'Ver'} fatores da projeção ({forecast.factors.length})</span>
          <ArrowRight className={`w-3 h-3 transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </button>

        {expanded && (
          <div className="mt-3 space-y-2 animate-fade-in">
            {forecast.factors.map((f, i) => {
              const impactColor = f.impact === 'positive' ? '--status-green' : f.impact === 'negative' ? '--status-red' : '--status-yellow';
              return (
                <div
                  key={i}
                  className="flex items-start gap-3 text-xs p-2.5 rounded-lg border border-border/30 animate-fade-in"
                  style={{
                    backgroundColor: `hsl(var(${impactColor}) / 0.04)`,
                    animationDelay: `${i * 50}ms`,
                    animationFillMode: 'backwards',
                  }}
                >
                  <div
                    className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5"
                    style={{ backgroundColor: `hsl(var(${impactColor}))` }}
                  />
                  <div>
                    <span className="font-medium">{f.label}</span>
                    <p className="text-muted-foreground mt-0.5 leading-relaxed">{f.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <p className="text-[10px] text-muted-foreground/60 text-center leading-relaxed">
        Projeções heurísticas baseadas em dados atuais. Não constituem previsão médica.
      </p>
    </div>
  );
}

function ScoreNode({ label, value, colorVar, highlight = false }: {
  label: string;
  value: number;
  colorVar: string;
  highlight?: boolean;
}) {
  return (
    <div className="text-center min-w-0">
      <p
        className={`font-mono font-bold ${highlight ? 'text-lg' : 'text-sm'}`}
        style={{ color: `hsl(var(${colorVar}))` }}
      >
        {value}
      </p>
      <p className={`text-muted-foreground ${highlight ? 'text-[10px] font-medium' : 'text-[9px]'}`}>{label}</p>
    </div>
  );
}
