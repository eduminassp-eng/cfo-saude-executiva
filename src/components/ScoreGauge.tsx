import { Status } from '@/types/health';
import { motion } from 'framer-motion';

interface ScoreGaugeProps {
  label: string;
  value: number;
  status: Status;
  subtitle: string;
  colorVar: string;
}

export function ScoreGauge({ label, value, status, subtitle, colorVar }: ScoreGaugeProps) {
  const radius = 50;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const progress = (value / 100) * circumference;
  
  const statusLabel = status === 'green' ? 'Bom' : status === 'yellow' ? 'Atenção' : status === 'red' ? 'Crítico' : 'Sem dados';

  return (
    <div
      className="glass-card p-6 flex flex-col items-center gap-4"
      role="meter"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${label}: ${value} de 100, ${statusLabel}`}
    >
      <div className="relative w-28 h-28">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          {/* Background ring */}
          <circle
            cx="60" cy="60" r={radius}
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Progress ring - Apple Health style thick rounded */}
          <motion.circle
            cx="60" cy="60" r={radius}
            fill="none"
            stroke={`hsl(var(--${colorVar}))`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - progress }}
            transition={{ duration: 1.4, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.15 }}
            className="score-ring"
            style={{ color: `hsl(var(--${colorVar}))` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="display-number text-3xl">{value}</span>
          <span className="text-[10px] text-muted-foreground font-medium tracking-wide">/100</span>
        </div>
      </div>

      <div className="text-center space-y-1.5">
        <p className="text-sm font-semibold tracking-tight">{label}</p>
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${
          status === 'green' ? 'bg-status-green status-green' :
          status === 'yellow' ? 'bg-status-yellow status-yellow' :
          'bg-status-red status-red'
        }`}>
          {statusLabel}
        </span>
        <p className="text-[11px] text-muted-foreground leading-relaxed">{subtitle}</p>
      </div>
    </div>
  );
}
