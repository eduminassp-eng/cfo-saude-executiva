import { DomainScore } from '@/lib/scoring';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

interface Props {
  domainScores: DomainScore[];
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

export function HealthRadar({ domainScores }: Props) {
  const chartData = domainScores.map(d => ({
    domain: domainLabels[d.id] || d.label,
    score: d.score,
    fullMark: 100,
  }));

  return (
    <div className="glass-card rounded-xl p-5">
      <h3 className="font-semibold mb-4 text-center">Health Radar</h3>
      <div className="w-full aspect-square max-w-[320px] mx-auto">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={chartData} cx="50%" cy="50%" outerRadius="72%">
            {/* Zone backgrounds rendered as reference radars */}
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

            {/* Green zone reference (75-100) */}
            <Radar
              name="green-ref"
              dataKey={() => 100}
              fill="hsl(var(--status-green))"
              fillOpacity={0.03}
              stroke="hsl(var(--status-green))"
              strokeOpacity={0.15}
              strokeDasharray="3 3"
            />

            {/* Yellow zone reference (50) */}
            <Radar
              name="yellow-ref"
              dataKey={() => 75}
              fill="hsl(var(--status-yellow))"
              fillOpacity={0.03}
              stroke="hsl(var(--status-yellow))"
              strokeOpacity={0.15}
              strokeDasharray="3 3"
            />

            {/* Red zone reference (below 50) */}
            <Radar
              name="red-ref"
              dataKey={() => 50}
              fill="hsl(var(--status-red))"
              fillOpacity={0.04}
              stroke="hsl(var(--status-red))"
              strokeOpacity={0.15}
              strokeDasharray="3 3"
            />

            {/* Actual score */}
            <Radar
              name="Score"
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
      </div>
    </div>
  );
}
