import { Biomarker, Status } from '@/types/health';
import { ResponsiveContainer, LineChart, Line, Tooltip } from 'recharts';
import { motion } from 'framer-motion';

function statusBadge(status: Status) {
  const map = {
    green: { label: 'Normal', className: 'bg-status-green status-green' },
    yellow: { label: 'Atenção', className: 'bg-status-yellow status-yellow' },
    red: { label: 'Ação', className: 'bg-status-red status-red' },
    unknown: { label: '—', className: 'bg-secondary text-muted-foreground' },
  };
  const s = map[status];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${s.className}`}>
      {s.label}
    </span>
  );
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

  const history = biomarker.history ?? [];
  const sparkData = [
    ...history.slice().reverse().map(h => ({ v: h.value })),
    ...(biomarker.value !== null ? [{ v: biomarker.value }] : []),
  ];

  const statusColorMap = {
    green: 'var(--status-green)',
    yellow: 'var(--status-yellow)',
    red: 'var(--status-red)',
    unknown: 'var(--muted-foreground)',
  };
  const statusVar = statusColorMap[biomarker.status];
  const statusColor = `hsl(${statusVar})`;

  const glowStyle = biomarker.status !== 'unknown' ? {
    borderColor: `hsl(${statusVar} / 0.25)`,
    boxShadow: `0 0 16px -4px hsl(${statusVar} / 0.15), inset 0 1px 0 hsl(${statusVar} / 0.06)`,
  } : {};

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -4, scale: 1.02, transition: { duration: 0.2, ease: 'easeOut' } }}
      whileTap={{ scale: 0.97, y: 0, transition: { duration: 0.1 } }}
      transition={{ duration: 0.2 }}
      className="glass-card-hover p-4 text-left w-full border"
      style={glowStyle}
      aria-label={`${biomarker.name}: ${biomarker.value ?? 'sem valor'} ${biomarker.unit}. Status: ${biomarker.status === 'green' ? 'normal' : biomarker.status === 'yellow' ? 'atenção' : biomarker.status === 'red' ? 'crítico' : 'desconhecido'}`}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs text-muted-foreground font-medium truncate pr-2">{biomarker.name}</p>
        {statusBadge(biomarker.status)}
      </div>
      <div className="flex items-baseline gap-1.5 mb-1">
        <span className="display-number text-2xl">{biomarker.value ?? '—'}</span>
        <span className="text-xs text-muted-foreground font-medium">{biomarker.unit}</span>
      </div>

      {/* Sparkline */}
      {sparkData.length >= 2 && (
        <div className="h-10 w-full my-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparkData} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '10px',
                  fontSize: '11px',
                  padding: '6px 10px',
                  color: 'hsl(var(--foreground))',
                  boxShadow: '0 4px 12px hsl(var(--background) / 0.4)',
                }}
                formatter={(value: number) => [`${value} ${biomarker.unit}`, biomarker.name]}
                labelFormatter={() => ''}
              />
              <Line
                type="monotone"
                dataKey="v"
                stroke={statusColor}
                strokeWidth={2}
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

      {rangeText && <p className="text-[11px] text-muted-foreground mt-1">Ref: {rangeText} {biomarker.unit}</p>}
      {biomarker.lastDate && (
        <p className="text-[11px] text-muted-foreground mt-1">
          Último: {new Date(biomarker.lastDate).toLocaleDateString('pt-BR')}
        </p>
      )}
      {biomarker.note && <p className="text-[11px] text-muted-foreground mt-1 italic">{biomarker.note}</p>}
    </motion.button>
  );
}
