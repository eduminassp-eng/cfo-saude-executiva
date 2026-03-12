import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  actionTo?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, description, actionLabel, actionTo, onAction }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="flex flex-col items-center justify-center text-center py-16 px-6"
    >
      <div className="w-16 h-16 rounded-2xl bg-secondary/80 flex items-center justify-center mb-5 text-muted-foreground">
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">{description}</p>
      {actionLabel && actionTo && (
        <Link
          to={actionTo}
          className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity btn-press"
        >
          {actionLabel}
        </Link>
      )}
      {actionLabel && onAction && !actionTo && (
        <button
          onClick={onAction}
          className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity btn-press"
        >
          {actionLabel}
        </button>
      )}
    </motion.div>
  );
}
