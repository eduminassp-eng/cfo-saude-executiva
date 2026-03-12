import { useHealth } from '@/contexts/HealthContext';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardSkeleton } from '@/components/skeletons/DashboardSkeleton';
import { ErrorState } from '@/components/ErrorState';
import { calcCardiacScore, calcMetabolicScore, calcLongevityScore, calcDomainScores, DomainScore } from '@/lib/scoring';
import { calcPreviousDomainScores } from '@/lib/historicalScoring';
import { Heart, Flame, Droplets, Bean, Zap, Apple, ShieldCheck, ArrowRight } from 'lucide-react';
import { useState, useMemo, lazy, Suspense, useTransition, useCallback } from 'react';
import { BiomarkerEditDialog } from '@/components/BiomarkerEditDialog';
import { Biomarker, HealthData } from '@/types/health';
import { generateHealthAlerts } from '@/lib/healthAlerts';
import { AlertsDrawer } from '@/components/AlertsDrawer';
import { PageTransition } from '@/components/motion/PageTransition';
import { StaggerContainer, StaggerItem } from '@/components/motion/StaggerContainer';
import { motion } from 'framer-motion';

import { Skeleton } from '@/components/ui/skeleton';

const ScoreGauge = lazy(() => import('@/components/ScoreGauge').then(m => ({ default: m.ScoreGauge })));
const KPICard = lazy(() => import('@/components/KPICard').then(m => ({ default: m.KPICard })));
const ScoreDetailPanel = lazy(() => import('@/components/ScoreDetailPanel').then(m => ({ default: m.ScoreDetailPanel })));
const DomainDetailPanel = lazy(() => import('@/components/DomainDetailPanel').then(m => ({ default: m.DomainDetailPanel })));
const HealthRadar = lazy(() => import('@/components/HealthRadar').then(m => ({ default: m.HealthRadar })));

function LazyFallback() {
  return <div className="glass-card p-6"><Skeleton className="h-40 w-full rounded-xl" /></div>;
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

function getOverallScore(cardiac: number, metabolic: number, longevity: number): number {
  return Math.round((cardiac + metabolic + longevity) / 3);
}

const Dashboard = () => {
  const { data, loading, error, retry } = useHealth();
  const { user } = useAuth();
  const cardiac = calcCardiacScore(data);
  const metabolic = calcMetabolicScore(data);
  const longevity = calcLongevityScore(data);
  const domainScores = useMemo(() => calcDomainScores(data), [data]);
  const previousDomainScores = useMemo(() => calcPreviousDomainScores(data), [data]);
  const healthAlerts = useMemo(() => generateHealthAlerts(data), [data]);
  const [editingBiomarker, setEditingBiomarker] = useState<Biomarker | null>(null);
  const [showScoreDetail, setShowScoreDetail] = useState<string | null>(null);
  const [showDomainDetail, setShowDomainDetail] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const handleShowScore = useCallback((id: string) => {
    startTransition(() => setShowScoreDetail(id));
  }, []);

  const handleShowDomain = useCallback((id: string | null) => {
    startTransition(() => setShowDomainDetail(id));
  }, []);

  const overallScore = getOverallScore(cardiac.value, metabolic.value, longevity.value);
  const overallStatus = overallScore >= 75 ? 'green' : overallScore >= 50 ? 'yellow' : 'red';

  const keyBiomarkers = data.biomarkers.filter(b =>
    ['pa-sys', 'glicemia', 'hba1c', 'ldl', 'hdl', 'trig', 'creatinina', 'tsh', 'tgo', 'tgp', 'ggt', 'vitd', 'ferritina', 'imc', 'cintura', 'psa'].includes(b.id)
  );

  const redBiomarkers = data.biomarkers.filter(b => b.status === 'red');
  const yellowBiomarkers = data.biomarkers.filter(b => b.status === 'yellow');
  const overdueExams = data.exams.filter(e => e.status === 'Atrasado');

  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || '';

  if (loading) return <DashboardSkeleton />;
  if (error) return <ErrorState type={error === 'network' ? 'network' : 'error'} onRetry={retry} />;

  return (
    <PageTransition>
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="flex items-start justify-between gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-sm text-muted-foreground font-medium mb-1">
            {new Date(data.lastUpdated).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight">
            {getGreeting()}{displayName ? `, ${displayName}` : ''}
          </h1>
        </motion.div>
        <AlertsDrawer alerts={healthAlerts} />
      </div>

      {/* Overall Health Score - Hero */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="glass-card rounded-2xl p-6 lg:p-8"
      >
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Large ring */}
          <div className="relative w-32 h-32 lg:w-40 lg:h-40 shrink-0">
            <div
              className="absolute inset-0 rounded-full blur-3xl opacity-15"
              style={{ background: `hsl(var(--status-${overallStatus}))` }}
            />
            <svg className="w-full h-full -rotate-90 relative z-10" viewBox="0 0 120 120">
              <defs>
                <linearGradient id="hero-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="hsl(var(--liquid-violet))" />
                  <stop offset="50%" stopColor="hsl(var(--primary))" />
                  <stop offset="100%" stopColor="hsl(var(--liquid-blue))" />
                </linearGradient>
              </defs>
              <circle cx="60" cy="60" r="50" fill="none" stroke="hsl(var(--border))" strokeWidth="10" strokeLinecap="round" opacity={0.4} />
              <motion.circle
                cx="60" cy="60" r="50" fill="none"
                stroke="url(#hero-grad)"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 50}
                initial={{ strokeDashoffset: 2 * Math.PI * 50 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 50 * (1 - overallScore / 100) }}
                transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
                style={{ filter: 'drop-shadow(0 0 10px hsl(var(--primary) / 0.3))' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
              <motion.span
                className="display-number text-5xl lg:text-6xl"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                {overallScore}
              </motion.span>
              <span className="text-xs text-muted-foreground font-medium">/100</span>
            </div>
          </div>

          {/* Summary text */}
          <div className="flex-1 text-center sm:text-left space-y-3">
            <div>
              <h2 className="text-lg font-bold tracking-tight">Saúde Geral</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mt-1">
                {overallScore >= 80 ? 'Seus indicadores estão em ótimo estado. Continue com seus hábitos atuais.' :
                 overallScore >= 60 ? 'A maioria dos indicadores está boa, mas alguns pontos precisam de atenção.' :
                 'Vários indicadores requerem atenção. Consulte seu médico para um plano de ação.'}
              </p>
            </div>

            {/* Quick stats */}
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
              {redBiomarkers.length > 0 && (
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: 'hsl(var(--status-red) / 0.1)', color: 'hsl(var(--status-red))' }}>
                  {redBiomarkers.length} crítico{redBiomarkers.length > 1 ? 's' : ''}
                </span>
              )}
              {yellowBiomarkers.length > 0 && (
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: 'hsl(var(--status-yellow) / 0.1)', color: 'hsl(var(--status-yellow))' }}>
                  {yellowBiomarkers.length} em atenção
                </span>
              )}
              {overdueExams.length > 0 && (
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: 'hsl(var(--status-red) / 0.1)', color: 'hsl(var(--status-red))' }}>
                  {overdueExams.length} exame{overdueExams.length > 1 ? 's' : ''} atrasado{overdueExams.length > 1 ? 's' : ''}
                </span>
              )}
              {redBiomarkers.length === 0 && yellowBiomarkers.length === 0 && overdueExams.length === 0 && (
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: 'hsl(var(--status-green) / 0.1)', color: 'hsl(var(--status-green))' }}>
                  ✓ Tudo em ordem
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Three Score Cards */}
      <Suspense fallback={<LazyFallback />}>
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StaggerItem>
            <button onClick={() => handleShowScore('cardiac')} className="text-left w-full" aria-label="Ver detalhes do risco cardíaco">
              <ScoreGauge label="Risco Cardíaco" value={cardiac.value} status={cardiac.status} subtitle="Pressão, lipídios, inflamação" colorVar="score-cardiac" />
            </button>
          </StaggerItem>
          <StaggerItem>
            <button onClick={() => handleShowScore('metabolic')} className="text-left w-full" aria-label="Ver detalhes do score metabólico">
              <ScoreGauge label="Score Metabólico" value={metabolic.value} status={metabolic.status} subtitle="Glicemia, composição, fígado" colorVar="score-metabolic" />
            </button>
          </StaggerItem>
          <StaggerItem>
            <button onClick={() => handleShowScore('longevity')} className="text-left w-full" aria-label="Ver detalhes do score de longevidade">
              <ScoreGauge label="Score de Longevidade" value={longevity.value} status={longevity.status} subtitle="Saúde global + hábitos" colorVar="score-longevity" />
            </button>
          </StaggerItem>
        </StaggerContainer>
      </Suspense>

      {/* Score detail panel */}
      {showScoreDetail && (
        <Suspense fallback={<LazyFallback />}>
          <ScoreDetailPanel
            type={showScoreDetail as 'cardiac' | 'metabolic' | 'longevity'}
            score={showScoreDetail === 'cardiac' ? cardiac : showScoreDetail === 'metabolic' ? metabolic : longevity}
            onClose={() => startTransition(() => setShowScoreDetail(null))}
          />
        </Suspense>
      )}

      {/* Health Radar + Domain Grid */}
      <div>
        <h2 className="section-header mb-4">Saúde por Domínio</h2>
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-4">
          <Suspense fallback={<LazyFallback />}>
            <HealthRadar domainScores={domainScores} previousScores={previousDomainScores} />
          </Suspense>
          <DomainGrid
            domainScores={domainScores}
            showDomainDetail={showDomainDetail}
            setShowDomainDetail={handleShowDomain}
            data={data}
          />
        </div>
      </div>

      {/* KPIs */}
      <div>
        <h2 className="section-header mb-4">Indicadores-Chave</h2>
        <Suspense fallback={<LazyFallback />}>
          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {keyBiomarkers.map(b => (
              <StaggerItem key={b.id}>
                <KPICard biomarker={b} onClick={() => setEditingBiomarker(b)} />
              </StaggerItem>
            ))}
          </StaggerContainer>
        </Suspense>
      </div>

      {/* Disclaimer */}
      <div className="glass-card rounded-xl p-4 text-xs text-muted-foreground">
        <p><strong>Aviso:</strong> Este painel é uma ferramenta de organização e acompanhamento preventivo. 
        Não substitui diagnóstico ou orientação médica profissional.</p>
      </div>

      {editingBiomarker && (
        <BiomarkerEditDialog
          biomarker={editingBiomarker}
          onClose={() => setEditingBiomarker(null)}
        />
      )}
    </div>
    </PageTransition>
  );
};

export default Dashboard;

// Domain Grid Component

function DomainGrid({ domainScores, showDomainDetail, setShowDomainDetail, data }: {
  domainScores: DomainScore[];
  showDomainDetail: string | null;
  setShowDomainDetail: (id: string | null) => void;
  data: HealthData;
}) {
  const icons: Record<string, typeof Heart> = {
    cardiovascular: Heart, metabolic: Flame, liver: Droplets,
    kidney: Bean, hormonal: Zap, nutrition: Apple, preventive: ShieldCheck,
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {domainScores.map(d => {
        const Icon = icons[d.id] || Heart;
        const isActive = showDomainDetail === d.id;
        const statusColor = `hsl(var(--status-${d.status === 'unknown' ? 'yellow' : d.status}))`;
        return (
          <div key={d.id} className="contents">
            <motion.button
              onClick={() => setShowDomainDetail(isActive ? null : d.id)}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              className={`glass-card rounded-xl p-4 text-left transition-all ${isActive ? 'ring-1 ring-primary' : ''}`}
              style={isActive ? {} : undefined}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${statusColor.replace(')', ' / 0.12)')}` }}>
                    <Icon className="w-4 h-4" style={{ color: statusColor }} />
                  </div>
                  <span className="text-sm font-medium">{d.label}</span>
                </div>
                <span
                  className="px-2 py-0.5 rounded-full text-xs font-bold font-mono"
                  style={{
                    color: statusColor,
                    backgroundColor: `${statusColor.replace(')', ' / 0.15)')}`,
                  }}
                >
                  {d.score}
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-secondary mb-2.5 overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${d.score}%` }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  style={{ backgroundColor: statusColor }}
                />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{d.summary}</p>
            </motion.button>
            {isActive && (
              <div className="col-span-full">
                <Suspense fallback={<div className="glass-card p-6"><div className="h-40 w-full rounded-xl bg-secondary animate-pulse" /></div>}>
                  <DomainDetailPanel
                    domainId={d.id}
                    label={d.label}
                    score={d.score}
                    status={d.status}
                    summary={d.summary}
                    data={data}
                    onClose={() => setShowDomainDetail(null)}
                  />
                </Suspense>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
