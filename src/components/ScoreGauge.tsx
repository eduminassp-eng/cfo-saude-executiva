import { Status } from '@/types/health';
import { motion } from 'framer-motion';
import { useId } from 'react';

interface ScoreGaugeProps {
  label: string;
  value: number;
  status: Status;
  subtitle: string;
  colorVar: string;
  size?: 'default' | 'hero';
}

const gradientStops: Record<string, [string, string]> = {
  'score-cardiac': ['0 85% 65%', '15 75% 50%'],
  'score-metabolic': ['30 100% 55%', '45 85% 45%'],
  'score-longevity': ['145 70% 50%', '170 65% 42%'],
};

export function ScoreGauge({ label, value, status, subtitle, colorVar, size = 'default' }: ScoreGaugeProps) {
  const id = useId();
  const isHero = size === 'hero';
  const radius = 50;
  const strokeWidth = isHero ? 12 : 10;
  const circumference = 2 * Math.PI * radius;
  const progress = (value / 100) * circumference;

  const statusLabel = status === 'green' ? 'Bom' : status === 'yellow' ? 'Atenção' : status === 'red' ? 'Crítico' : 'Sem dados';
  const [stop1, stop2] = gradientStops[colorVar] ?? ['160 60% 45%', '180 55% 38%'];

  return (
    <div
      className={`glass-card flex flex-col items-center gap-3 transition-all ${isHero ? 'p-8' : 'p-5'}`}
      role="meter"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${label}: ${value} de 100, ${statusLabel}`}
    >
      <div className={`relative ${isHero ? 'w-36 h-36' : 'w-28 h-28'}`}>
        {/* Glow effect behind the ring */}
        <div
          className="absolute inset-0 rounded-full blur-2xl opacity-20"
          style={{ background: `hsl(${stop1})` }}
        />

        <svg className="w-full h-full -rotate-90 relative z-10" viewBox="0 0 120 120">
          <defs>
            <linearGradient id={`grad-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={`hsl(${stop1})`} />
              <stop offset="100%" stopColor={`hsl(${stop2})`} />
            </linearGradient>
          </defs>

          {/* Background ring */}
          <circle
            cx="60" cy="60" r={radius}
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            opacity={0.5}
          />

          {/* Progress ring with gradient */}
          <motion.circle
            cx="60" cy="60" r={radius}
            fill="none"
            stroke={`url(#grad-${id})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - progress }}
            transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            style={{
              filter: `drop-shadow(0 0 8px hsl(${stop1} / 0.4))`,
            }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
          <motion.span
            className={`display-number ${isHero ? 'text-5xl' : 'text-3xl'}`}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            {value}
          </motion.span>
          <span className={`text-muted-foreground font-medium tracking-wide ${isHero ? 'text-xs' : 'text-[10px]'}`}>/100</span>
        </div>
      </div>

      <div className="text-center space-y-1.5">
        <p className={`font-semibold tracking-tight ${isHero ? 'text-base' : 'text-sm'}`}>{label}</p>
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
