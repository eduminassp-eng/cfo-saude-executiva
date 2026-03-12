import { motion, HTMLMotionProps } from 'framer-motion';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface MotionCardProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
}

export function MotionCard({ children, className, interactive = false, ...props }: MotionCardProps) {
  return (
    <motion.div
      whileHover={interactive ? { y: -3, scale: 1.01, transition: { duration: 0.2, ease: 'easeOut' } } : undefined}
      whileTap={interactive ? { scale: 0.985, transition: { duration: 0.1 } } : undefined}
      className={cn('glass-card', className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}
