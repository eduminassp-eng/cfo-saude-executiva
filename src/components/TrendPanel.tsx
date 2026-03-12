import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine } from 'recharts';
import { StaggerContainer, StaggerItem } from '@/components/motion/StaggerContainer';
import { HIGHER_IS_BETTER } from '@/lib/scoring';
import { HealthData } from '@/types/health';

const TRACKED_IDS = ['ldl', 'hdl', 'trig', 'glicemia', 'hba1c', 'creatinina', 'ggt', 'vitd', 'imc', 'cintura'];

interface TrendData {
  id: string;
  name: string;
  unit: string;
  current: number | null;
  targetMax: number | null;
  targetMin: number | null;
  status: string;
  direction: 'improving' | 'stable' | 'worsening';
  points: { date: string; value: number }[];
  insight: string;
}

function getTrendInsight(name: string, direction: string, current: number | null, unit: string): string {
  const v = current !== null ? `${current} ${unit}` : '';
  if (direction === 'improving') return `${name} em tendência de melhora (${v}). Continue com os hábitos atuais.`;
  if (direction === 'worsening') return `${name} piorando (${v}). Reavalie hábitos e discuta com seu médico.`;
  return `${name} estável (${v}). Manter acompanhamento regular.`;
}

export function TrendPanel({ data }: { data: HealthData }) {
  const trends = useMemo<TrendData[]>(() => {
    return TRACKED_IDS
      .map(id => {
        const b = data.biomarkers.find(bm => bm.id === id);
        if (!b) return null;

        const points = [
          ...(b.history || []).map(h => ({ date: h.date, value: h.value })).reverse(),
          ...(b.value !== null && b.lastDate ? [{ date: b.lastDate, value: b.value }] : []),
        ];

        let direction: TrendData['direction'] = 'stable';
        if (points.length >= 2) {
          const last = points[points.length - 1].value;
          const prev = points[points.length - 2].value;
          const diff = last - prev;
          const pct = Math.abs(diff / prev);
          if (pct > 0.02) {
            const isUp = diff > 0;
            if (HIGHER_IS_BETTER.has(id)) {
              direction = isUp ? 'improving' : 'worsening';
            } else {
              direction = isUp ? 'worsening' : 'improving';
            }
          }
        }

        return {
          id,
          name: b.name,
          unit: b.unit,
          current: b.value,
          targetMax: b.targetMax,
          targetMin: b.targetMin,
          status: b.status,
          direction,
          points,
          insight: getTrendInsight(b.name, direction, b.value, b.unit),
        };
      })
      .filter(Boolean) as TrendData[];
  }, [data]);

  const directionConfig = {
    improving: { icon: TrendingUp, label: 'Melhorando', color: 'hsl(var(--status-green))', bg: 'bg-status-green/10', text: 'text-status-green' },
    stable: { icon: Minus, label: 'Estável', color: 'hsl(var(--muted-foreground))', bg: 'bg-secondary', text: 'text-muted-foreground' },
    worsening: { icon: TrendingDown, label: 'Piorando', color: 'hsl(var(--status-red))', bg: 'bg-status-red/10', text: 'text-status-red' },
  };

  return (
    <div className="space-y-6">
      <StaggerContainer className="grid grid-cols-3 gap-3">
        {(['improving', 'stable', 'worsening'] as const).map(d => {
          const count = trends.filter(t => t.direction === d).length;
          const cfg = directionConfig[d];
          return (
            <StaggerItem key={d}>
              <div className="glass-card p-3 text-center">
                <cfg.icon className="w-5 h-5 mx-auto mb-1" style={{ color: cfg.color }} />
                <p className="display-number text-xl" style={{ color: cfg.color }}>{count}</p>
                <p className="text-xs text-muted-foreground">{cfg.label}</p>
              </div>
            </StaggerItem>
          );
        })}
      </StaggerContainer>

      <div className="space-y-4">
        {trends.map((t, i) => {
          const cfg = directionConfig[t.direction];
          const DirIcon = cfg.icon;
          return (
            <div
              key={t.id}
              className="glass-card rounded-xl p-5 animate-fade-in"
              style={{ animationDelay: `${i * 40}ms`, animationFillMode: 'backwards' }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-sm">{t.name}</h3>
                  <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${cfg.bg} ${cfg.text}`}>
                    <DirIcon className="w-3 h-3" />
                    {cfg.label}
                  </span>
                </div>
                {t.current !== null && (
                  <span className="font-mono font-bold text-sm">{t.current} <span className="text-xs text-muted-foreground font-normal">{t.unit}</span></span>
                )}
              </div>

              {t.points.length >= 2 && (
                <div className="h-32 mb-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={t.points}>
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                        tickFormatter={d => new Date(d).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                        domain={['auto', 'auto']}
                        width={40}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--popover))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px',
                          color: 'hsl(var(--foreground))',
                        }}
                        labelFormatter={d => new Date(d).toLocaleDateString('pt-BR')}
                        formatter={(v: number) => [`${v} ${t.unit}`, t.name]}
                      />
                      {t.targetMax && (
                        <ReferenceLine y={t.targetMax} stroke="hsl(var(--status-yellow))" strokeDasharray="4 4" strokeOpacity={0.5} />
                      )}
                      {t.targetMin && (
                        <ReferenceLine y={t.targetMin} stroke="hsl(var(--status-yellow))" strokeDasharray="4 4" strokeOpacity={0.5} />
                      )}
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke={cfg.color}
                        strokeWidth={2}
                        dot={{ r: 3.5, fill: cfg.color, strokeWidth: 0 }}
                        activeDot={{ r: 5, strokeWidth: 0 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              <p className="text-xs text-muted-foreground leading-relaxed italic">{t.insight}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
