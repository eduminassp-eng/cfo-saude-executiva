import { motion } from 'framer-motion';
import { WifiOff, RefreshCw, AlertTriangle } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  type?: 'network' | 'error';
}

export function ErrorState({ 
  title, 
  message, 
  onRetry,
  type = 'error' 
}: ErrorStateProps) {
  const Icon = type === 'network' ? WifiOff : AlertTriangle;
  const defaultTitle = type === 'network' ? 'Sem conexão' : 'Algo deu errado';
  const defaultMessage = type === 'network' 
    ? 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.'
    : 'Ocorreu um erro ao carregar os dados. Tente novamente.';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center text-center py-16 px-6"
    >
      <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-5">
        <Icon className="w-7 h-7 text-destructive" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title ?? defaultTitle}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">{message ?? defaultMessage}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity btn-press"
        >
          <RefreshCw className="w-4 h-4" />
          Tentar novamente
        </button>
      )}
    </motion.div>
  );
}
