import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Activity, ClipboardList, BrainCircuit,
  FileBarChart, FlaskConical, Heart, ChevronRight, ChevronLeft, X, Sparkles
} from 'lucide-react';

const ONBOARDING_KEY = 'health-cfo-onboarding-done';

interface Step {
  icon: typeof LayoutDashboard;
  title: string;
  description: string;
  color: string;
}

const steps: Step[] = [
  {
    icon: Sparkles,
    title: 'Bem-vindo ao HealthCFO',
    description: 'Seu painel executivo de saúde preventiva. Acompanhe biomarcadores, exames e tendências — tudo em um só lugar.',
    color: 'hsl(var(--primary))',
  },
  {
    icon: LayoutDashboard,
    title: 'Dashboard',
    description: 'Visão geral da sua saúde: scores cardíaco, metabólico e de longevidade, alertas e indicadores-chave em tempo real.',
    color: 'hsl(var(--primary))',
  },
  {
    icon: Activity,
    title: 'Biomarcadores & Tendências',
    description: 'Todos os seus indicadores laboratoriais com histórico, gráficos de tendência e classificação por status (normal, atenção, ação).',
    color: 'hsl(var(--status-green))',
  },
  {
    icon: ClipboardList,
    title: 'Exames',
    description: 'Controle completo dos exames preventivos: status, frequência sugerida, alertas de atraso e agendamento.',
    color: 'hsl(var(--status-yellow))',
  },
  {
    icon: BrainCircuit,
    title: 'AI Copilot',
    description: 'Converse com a IA sobre seus dados de saúde, receba alertas inteligentes e recomendações personalizadas.',
    color: 'hsl(160, 60%, 55%)',
  },
  {
    icon: FileBarChart,
    title: 'Relatório Executivo',
    description: 'Relatório consolidado para levar ao seu médico: plano de ação priorizado, metas e evolução dos indicadores.',
    color: 'hsl(220, 70%, 60%)',
  },
  {
    icon: FlaskConical,
    title: 'Lab Reader',
    description: 'Envie fotos ou PDFs dos seus exames e a IA extrai automaticamente os biomarcadores para o seu painel.',
    color: 'hsl(280, 60%, 60%)',
  },
  {
    icon: Heart,
    title: 'Pronto para começar!',
    description: 'Explore o app, adicione seus dados e acompanhe sua saúde de forma inteligente. Você pode rever este tour nas Configurações.',
    color: 'hsl(var(--status-red))',
  },
];

export function OnboardingTour({ onComplete }: { onComplete: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const step = steps[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;
  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
    if (isLast) {
      localStorage.setItem(ONBOARDING_KEY, 'true');
      onComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    onComplete();
  };

  const StepIcon = step.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/90 backdrop-blur-md" onClick={handleSkip} />

      {/* Card */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="relative w-full max-w-md glass-card rounded-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Progress bar */}
        <div className="h-1 bg-secondary">
          <motion.div
            className="h-full rounded-r-full"
            style={{ backgroundColor: step.color }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </div>

        {/* Skip button */}
        {!isLast && (
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Pular tour"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Content */}
        <div className="p-8 pt-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col items-center text-center"
            >
              {/* Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.1 }}
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
                style={{ backgroundColor: `${step.color}20` }}
              >
                <StepIcon className="w-8 h-8" style={{ color: step.color }} />
              </motion.div>

              {/* Title */}
              <h2 className="text-xl font-bold tracking-tight mb-3">{step.title}</h2>

              {/* Description */}
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                {step.description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-8 pb-6 flex items-center justify-between">
          {/* Dots */}
          <div className="flex gap-1.5">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentStep(i)}
                className="w-2 h-2 rounded-full transition-all duration-300"
                style={{
                  backgroundColor: i === currentStep ? step.color : 'hsl(var(--muted))',
                  transform: i === currentStep ? 'scale(1.3)' : 'scale(1)',
                }}
                aria-label={`Ir para passo ${i + 1}`}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2">
            {!isFirst && (
              <button
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Voltar
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
              style={{
                backgroundColor: step.color,
                color: isLast ? 'hsl(var(--primary-foreground))' : 'hsl(var(--primary-foreground))',
              }}
            >
              {isLast ? 'Começar' : 'Próximo'}
              {!isLast && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function useOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const done = localStorage.getItem(ONBOARDING_KEY);
    if (!done) {
      // Small delay so the app loads first
      const timer = setTimeout(() => setShowOnboarding(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const resetOnboarding = () => {
    localStorage.removeItem(ONBOARDING_KEY);
    setShowOnboarding(true);
  };

  return { showOnboarding, setShowOnboarding, resetOnboarding };
}
