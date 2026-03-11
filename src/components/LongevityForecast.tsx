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
  const summary = useMemo(() => buildForecastSummary(forecast), [forecast]);

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

      {/* Forecast Summary Card */}
      <ForecastSummaryCard summary={summary} />

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

      {/* Forecast Logic Explanation */}
      <ForecastExplanation />
    </div>
  );
}

function ForecastExplanation() {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-border/30 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <span>Como funciona esta projeção?</span>
        <ArrowRight className={`w-3 h-3 transition-transform duration-200 ${open ? 'rotate-90' : ''}`} />
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 animate-fade-in text-xs text-muted-foreground leading-relaxed">
          <div className="space-y-2">
            <p className="font-medium text-foreground">Modelo de Planejamento Preventivo</p>
            <p>
              Esta projeção é um <strong>modelo de planejamento</strong>, não uma previsão médica. 
              Ela estima como seus scores de saúde podem evoluir nos próximos meses com base em três pilares:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              { title: 'Dados Atuais', desc: 'Seus biomarcadores, estilo de vida e exames preventivos de hoje formam a base de cálculo.' },
              { title: 'Tendências Históricas', desc: 'A direção e velocidade de mudança dos seus indicadores ao longo do tempo são usadas para projetar o futuro.' },
              { title: 'Regras Preventivas', desc: 'Heurísticas baseadas em diretrizes de saúde preventiva estimam o impacto de hábitos e adesão a exames.' },
            ].map((item, i) => (
              <div key={i} className="rounded-lg border border-border/20 p-3 space-y-1" style={{ backgroundColor: 'hsl(var(--secondary) / 0.4)' }}>
                <p className="font-medium text-foreground text-[11px]">{item.title}</p>
                <p className="text-[10px]">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="rounded-lg p-3 space-y-1.5" style={{ backgroundColor: 'hsl(var(--status-yellow) / 0.06)', border: '1px solid hsl(var(--status-yellow) / 0.15)' }}>
            <p className="font-medium text-foreground text-[11px]">⚠️ Limitações Importantes</p>
            <ul className="space-y-1 text-[10px] list-disc list-inside">
              <li>As projeções <strong>não diagnosticam</strong> doenças nem preveem resultados clínicos.</li>
              <li>Fatores genéticos, ambientais e eventos imprevistos não são considerados.</li>
              <li>Os scores são aproximações simplificadas e podem não refletir toda a complexidade do seu quadro de saúde.</li>
              <li>Esta ferramenta <strong>não substitui</strong> avaliação, diagnóstico ou acompanhamento médico profissional.</li>
            </ul>
          </div>

          <p className="text-[10px] text-center text-muted-foreground/60">
            Use estas projeções como apoio ao planejamento de saúde, sempre em conjunto com orientação do seu médico.
          </p>
        </div>
      )}
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

function ForecastSummaryCard({ summary }: { summary: ReturnType<typeof buildForecastSummary> }) {
  const trajectoryStyle = {
    improving: { colorVar: '--status-green', icon: TrendingUp },
    stable: { colorVar: '--status-yellow', icon: Minus },
    declining: { colorVar: '--status-red', icon: TrendingDown },
  }[summary.trajectory];

  const TrajectoryIcon = trajectoryStyle.icon;

  return (
    <div
      className="rounded-xl border border-border/40 p-5 space-y-4 animate-fade-in"
      style={{ background: `linear-gradient(135deg, hsl(var(${trajectoryStyle.colorVar}) / 0.05), transparent)` }}
    >
      {/* Trajectory */}
      <div className="flex items-start gap-3">
        <div
          className="p-2 rounded-lg shrink-0"
          style={{ backgroundColor: `hsl(var(${trajectoryStyle.colorVar}) / 0.12)` }}
        >
          <TrajectoryIcon className="w-5 h-5" style={{ color: `hsl(var(${trajectoryStyle.colorVar}))` }} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">Trajetória:</h3>
            <span
              className="text-sm font-bold"
              style={{ color: `hsl(var(${trajectoryStyle.colorVar}))` }}
            >
              {summary.trajectoryLabel}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{summary.trajectoryDescription}</p>
        </div>
      </div>

      {/* Risk & Opportunity */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-lg border border-border/30 p-3 space-y-1.5" style={{ backgroundColor: 'hsl(var(--status-red) / 0.04)' }}>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5" style={{ color: 'hsl(var(--status-red))' }} />
            <span className="text-xs font-semibold">Principal Risco Futuro</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{summary.mainRisk}</p>
        </div>
        <div className="rounded-lg border border-border/30 p-3 space-y-1.5" style={{ backgroundColor: 'hsl(var(--status-green) / 0.04)' }}>
          <div className="flex items-center gap-2">
            <Lightbulb className="w-3.5 h-3.5" style={{ color: 'hsl(var(--status-green))' }} />
            <span className="text-xs font-semibold">Maior Oportunidade</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{summary.mainOpportunity}</p>
        </div>
      </div>

      {/* Drivers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {summary.topNegativeDrivers.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Fatores de Risco</span>
            {summary.topNegativeDrivers.map((d, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: 'hsl(var(--status-red))' }} />
                <span>{d}</span>
              </div>
            ))}
          </div>
        )}
        {summary.topPositiveDrivers.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Fatores Protetores</span>
            {summary.topPositiveDrivers.map((d, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: 'hsl(var(--status-green))' }} />
                <span>{d}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
