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
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const progress = (value / 100) * circumference;
  
  const statusLabel = status === 'green' ? 'Bom' : status === 'yellow' ? 'Atenção' : status === 'red' ? 'Crítico' : 'Sem dados';

  return (
    <div className="glass-card rounded-xl p-5 flex flex-col items-center gap-3" role="meter" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100} aria-label={`${label}: ${value} de 100, ${statusLabel}`}>
      <p className="text-sm font-medium text-muted-foreground tracking-wide uppercase">{label}</p>
      <div className="relative w-32 h-32">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="hsl(var(--border))" strokeWidth="8" />
          <circle
            cx="60" cy="60" r={radius}
            fill="none"
            stroke={`hsl(var(--${colorVar}))`}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            className="transition-all duration-1000 ease-out score-ring"
            style={{ color: `hsl(var(--${colorVar}))` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-mono font-mono">{value}</span>
          <span className="text-xs text-muted-foreground">/100</span>
        </div>
      </div>
      <div className="text-center">
        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
          status === 'green' ? 'bg-status-green status-green' :
          status === 'yellow' ? 'bg-status-yellow status-yellow' :
          'bg-status-red status-red'
        }`}>
          {statusLabel}
        </span>
        <p className="text-xs text-muted-foreground mt-1.5">{subtitle}</p>
      </div>
    </div>
  );
}
