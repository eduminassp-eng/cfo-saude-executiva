import { DomainScore } from '@/lib/scoring';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';
import { useState } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Props {
  domainScores: DomainScore[];
  previousScores?: DomainScore[] | null;
}

const domainLabels: Record<string, string> = {
  cardiovascular: 'Cardio',
  metabolic: 'Metab.',
  liver: 'Fígado',
  kidney: 'Rins',
  hormonal: 'Horm.',
  nutrition: 'Nutri.',
  preventive: 'Prev.',
};

export function HealthRadar({ domainScores, previousScores }: Props) {
  const [showComparison, setShowComparison] = useState(!!previousScores);

  const chartData = domainScores.map(d => {
    const prev = previousScores?.find(p => p.id === d.id);
    return {
      domain: domainLabels[d.id] || d.label,
      score: d.score,
      previous: prev?.score ?? null,
      fullMark: 100,
    };
  });

  const deltas = domainScores.map(d => {
    const prev = previousScores?.find(p => p.id === d.id);
    return { id: d.id, label: domainLabels[d.id] || d.label, delta: prev ? d.score - prev.score : 0 };
  });

  const hasComparison = !!previousScores && previousScores.length > 0;

  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-center flex-1">Health Radar</h3>
        {hasComparison && (
          <button
            onClick={() => setShowComparison(!showComparison)}
            className="text-[10px] px-2.5 py-1 rounded-full font-medium transition-colors"
            style={{
              backgroundColor: showComparison ? 'hsl(var(--primary) / 0.15)' : 'hsl(var(--secondary))',
              color: showComparison ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
            }}
          >
            {showComparison ? 'Comparando' : 'Comparar'}
          </button>
        )}
      </div>

      <div className="w-full aspect-square max-w-[320px] mx-auto">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={chartData} cx="50%" cy="50%" outerRadius="72%">
            <Radar
              name="red-zone"
              dataKey="fullMark"
              fill="hsl(var(--status-red))"
              fillOpacity={0.04}
              stroke="none"
            />

            <PolarGrid
              stroke="hsl(var(--border))"
              strokeOpacity={0.5}
              gridType="polygon"
            />

            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={false}
              axisLine={false}
            />

            <PolarAngleAxis
              dataKey="domain"
              tick={({ x, y, payload }) => {
                const d = domainScores.find(ds => (domainLabels[ds.id] || ds.label) === payload.value);
                const color = d
                  ? d.score >= 75
                    ? 'hsl(var(--status-green))'
                    : d.score >= 50
                    ? 'hsl(var(--status-yellow))'
                    : 'hsl(var(--status-red))'
                  : 'hsl(var(--muted-foreground))';

                return (
                  <text
                    x={x}
                    y={y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill={color}
                    fontSize={11}
                    fontWeight={600}
                  >
                    {payload.value}
                  </text>
                );
              }}
            />

            <Radar
              name="green-ref"
              dataKey={() => 100}
              fill="hsl(var(--status-green))"
              fillOpacity={0.03}
              stroke="hsl(var(--status-green))"
              strokeOpacity={0.15}
              strokeDasharray="3 3"
            />
            <Radar
              name="yellow-ref"
              dataKey={() => 75}
              fill="hsl(var(--status-yellow))"
              fillOpacity={0.03}
              stroke="hsl(var(--status-yellow))"
              strokeOpacity={0.15}
              strokeDasharray="3 3"
            />
            <Radar
              name="red-ref"
              dataKey={() => 50}
              fill="hsl(var(--status-red))"
              fillOpacity={0.04}
              stroke="hsl(var(--status-red))"
              strokeOpacity={0.15}
              strokeDasharray="3 3"
            />

            {/* Previous check-up (dashed, behind) */}
            {showComparison && hasComparison && (
              <Radar
                name="Check-up anterior"
                dataKey="previous"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={1.5}
                strokeDasharray="6 3"
                fill="hsl(var(--muted-foreground))"
                fillOpacity={0.06}
                dot={{
                  r: 2.5,
                  fill: 'hsl(var(--muted-foreground))',
                  strokeWidth: 0,
                }}
              />
            )}

            {/* Current score */}
            <Radar
              name="Atual"
              dataKey="score"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="hsl(var(--primary))"
              fillOpacity={0.15}
              dot={{
                r: 3.5,
                fill: 'hsl(var(--primary))',
                strokeWidth: 0,
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-3 text-[10px]">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-0.5 rounded-full bg-status-green inline-block" />
          <span className="text-muted-foreground">≥ 75 Bom</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-0.5 rounded-full bg-status-yellow inline-block" />
          <span className="text-muted-foreground">50-74 Atenção</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-0.5 rounded-full bg-status-red inline-block" />
          <span className="text-muted-foreground">&lt; 50 Crítico</span>
        </span>
        {showComparison && hasComparison && (
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 rounded-full bg-muted-foreground inline-block border-dashed" />
            <span className="text-muted-foreground">Anterior</span>
          </span>
        )}
      </div>

      {/* Delta indicators */}
      {showComparison && hasComparison && (
        <div className="mt-4 grid grid-cols-2 gap-1.5">
          {deltas.map(d => {
            const isUp = d.delta > 2;
            const isDown = d.delta < -2;
            const Icon = isUp ? TrendingUp : isDown ? TrendingDown : Minus;
            const color = isUp
              ? 'hsl(var(--status-green))'
              : isDown
              ? 'hsl(var(--status-red))'
              : 'hsl(var(--muted-foreground))';

            return (
              <div
                key={d.id}
                className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-[11px]"
                style={{ backgroundColor: 'hsl(var(--secondary) / 0.5)' }}
              >
                <span className="text-muted-foreground truncate mr-1">{d.label}</span>
                <div className="flex items-center gap-1 shrink-0">
                  <Icon className="w-3 h-3" style={{ color }} />
                  <span className="font-mono font-semibold" style={{ color }}>
                    {d.delta > 0 ? '+' : ''}{d.delta}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
