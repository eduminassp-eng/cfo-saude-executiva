import { Biomarker, Status } from '@/types/health';
import { ResponsiveContainer, LineChart, Line, Tooltip } from 'recharts';
import { motion } from 'framer-motion';
function statusBadge(status: Status) {
  const map = {
    green: { bg: 'bg-status-green', text: 'status-green', label: 'Normal' },
    yellow: { bg: 'bg-status-yellow', text: 'status-yellow', label: 'Atenção' },
    red: { bg: 'bg-status-red', text: 'status-red', label: 'Ação' },
    unknown: { bg: 'bg-secondary', text: 'text-muted-foreground', label: '—' },
  };
  const s = map[status];
  return <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${s.bg} ${s.text}`}>{s.label}</span>;
}

interface KPICardProps {
  biomarker: Biomarker;
  onClick?: () => void;
}

export function KPICard({ biomarker, onClick }: KPICardProps) {
  const rangeText = biomarker.targetMin !== null && biomarker.targetMax !== null
    ? `${biomarker.targetMin}–${biomarker.targetMax}`
    : biomarker.targetMax !== null
    ? `< ${biomarker.targetMax}`
    : biomarker.targetMin !== null
    ? `> ${biomarker.targetMin}`
    : '';

  // Build sparkline data: history (oldest→newest) + current
  const history = biomarker.history ?? [];
  const sparkData = [
    ...history.slice().reverse().map(h => ({ v: h.value })),
    ...(biomarker.value !== null ? [{ v: biomarker.value }] : []),
  ];

  const statusColor = biomarker.status === 'green' ? 'hsl(var(--status-green))'
    : biomarker.status === 'yellow' ? 'hsl(var(--status-yellow))'
    : biomarker.status === 'red' ? 'hsl(var(--status-red))'
    : 'hsl(var(--muted-foreground))';

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="glass-card-hover rounded-lg p-4 text-left w-full transition-all"
      aria-label={`${biomarker.name}: ${biomarker.value ?? 'sem valor'} ${biomarker.unit}. Status: ${biomarker.status === 'green' ? 'normal' : biomarker.status === 'yellow' ? 'atenção' : biomarker.status === 'red' ? 'crítico' : 'desconhecido'}`}
    >
      <div className="flex items-start justify-between mb-2">
        <p className="text-xs text-muted-foreground font-medium truncate pr-2">{biomarker.name}</p>
        {statusBadge(biomarker.status)}
      </div>
      <div className="flex items-baseline gap-1.5 mb-1">
        <span className="text-2xl font-bold font-mono">{biomarker.value ?? '—'}</span>
        <span className="text-xs text-muted-foreground">{biomarker.unit}</span>
      </div>

      {/* Sparkline */}
      {sparkData.length >= 2 && (
        <div className="h-8 w-full my-1.5 animate-fade-in">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparkData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '11px',
                  padding: '4px 8px',
                  color: 'hsl(var(--foreground))',
                }}
                formatter={(value: number) => [`${value} ${biomarker.unit}`, biomarker.name]}
                labelFormatter={() => ''}
              />
              <Line
                type="monotone"
                dataKey="v"
                stroke={statusColor}
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 4, fill: statusColor, strokeWidth: 2, stroke: 'hsl(var(--card))' }}
                isAnimationActive={true}
                animationDuration={800}
                animationEasing="ease-out"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {rangeText && <p className="text-xs text-muted-foreground">Ref: {rangeText} {biomarker.unit}</p>}
      {biomarker.lastDate && (
        <p className="text-xs text-muted-foreground mt-1.5">
          Último: {new Date(biomarker.lastDate).toLocaleDateString('pt-BR')}
        </p>
      )}
      {biomarker.note && <p className="text-xs text-muted-foreground mt-1 italic">{biomarker.note}</p>}
    </button>
  );
}
