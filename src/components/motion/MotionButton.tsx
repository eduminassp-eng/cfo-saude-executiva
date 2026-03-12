import { motion, HTMLMotionProps } from 'framer-motion';
import { forwardRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface MotionButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children: ReactNode;
  className?: string;
}

export const MotionButton = forwardRef<HTMLButtonElement, MotionButtonProps>(
  ({ children, className, ...props }, ref) => (
    <motion.button
      ref={ref}
      whileHover={{ scale: 1.03, transition: { duration: 0.15 } }}
      whileTap={{ scale: 0.96, transition: { duration: 0.1 } }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.button>
  )
);
MotionButton.displayName = 'MotionButton';
