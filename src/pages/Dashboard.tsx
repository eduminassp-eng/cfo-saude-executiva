import { useHealth } from '@/contexts/HealthContext';
import { calcCardiacScore, calcMetabolicScore, calcLongevityScore, calcDomainScores, DomainScore } from '@/lib/scoring';
import { calcPreviousDomainScores } from '@/lib/historicalScoring';
import { ScoreGauge } from '@/components/ScoreGauge';
import { KPICard } from '@/components/KPICard';
import { AlertTriangle, CheckCircle2, Info, TrendingDown, Heart, Flame, Droplets, Bean, Zap, Apple, ShieldCheck, CalendarClock, ArrowRight } from 'lucide-react';
import { useState, useMemo } from 'react';
import { BiomarkerEditDialog } from '@/components/BiomarkerEditDialog';
import { Biomarker, HealthData } from '@/types/health';
import { ScoreDetailPanel } from '@/components/ScoreDetailPanel';
import { DomainDetailPanel } from '@/components/DomainDetailPanel';
import { HealthRadar } from '@/components/HealthRadar';
import { PreventiveComplianceScore } from '@/components/PreventiveCompliance';
import { HealthBalanceSheet } from '@/components/HealthBalanceSheet';
import { HealthAlerts } from '@/components/HealthAlerts';
import { generateHealthAlerts } from '@/lib/healthAlerts';
import { LongevityForecast } from '@/components/LongevityForecast';
import { generateForecast } from '@/lib/forecast';
import { WhatIfSimulator } from '@/components/WhatIfSimulator';
import { HealthRiskMap } from '@/components/HealthRiskMap';
import { HealthPriorityEngine } from '@/components/HealthPriorityEngine';
import { PageTransition } from '@/components/motion/PageTransition';
import { StaggerContainer, StaggerItem } from '@/components/motion/StaggerContainer';
import { AnimatedCard } from '@/components/motion/AnimatedCard';

const Dashboard = () => {
  const { data, loading } = useHealth();
  const cardiac = calcCardiacScore(data);
  const metabolic = calcMetabolicScore(data);
  const longevity = calcLongevityScore(data);
  const domainScores = useMemo(() => calcDomainScores(data), [data]);
  const previousDomainScores = useMemo(() => calcPreviousDomainScores(data), [data]);
  const healthAlerts = useMemo(() => generateHealthAlerts(data), [data]);
  const forecast = useMemo(() => generateForecast(data), [data]);
  const [editingBiomarker, setEditingBiomarker] = useState<Biomarker | null>(null);
  const [showScoreDetail, setShowScoreDetail] = useState<string | null>(null);
  const [showDomainDetail, setShowDomainDetail] = useState<string | null>(null);

  const overdueCount = data.exams.filter(e => e.status === 'Atrasado').length;
  const yellowCount = data.biomarkers.filter(b => b.status === 'yellow').length;
  const redCount = data.biomarkers.filter(b => b.status === 'red').length;

  // Markers where higher = better (worsening = going down)
  const upIsGood = new Set(['hdl', 'vitd', 'vitb12', 'ferritina', 'testosterona']);

  const worsenedBiomarkers = useMemo(() => {
    return data.biomarkers.filter(b => {
      if (b.value === null || !b.history || b.history.length === 0) return false;
      const prev = b.history[0].value;
      const diff = b.value - prev;
      if (Math.abs(diff) < Math.abs(prev) * 0.02) return false; // ignore tiny changes
      const isUp = diff > 0;
      // For most markers, going up is bad; for upIsGood set, going down is bad
      if (upIsGood.has(b.id)) return !isUp; // dropped = worsened
      return isUp; // increased = worsened
    });
  }, [data.biomarkers]);

  const keyBiomarkers = data.biomarkers.filter(b => 
    ['pa-sys', 'glicemia', 'hba1c', 'ldl', 'hdl', 'trig', 'creatinina', 'tsh', 'tgo', 'tgp', 'ggt', 'vitd', 'ferritina', 'imc', 'cintura', 'psa'].includes(b.id)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse text-muted-foreground">Carregando dados...</div>
      </div>
    );
  }

  return (
    <PageTransition>
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Painel Executivo de Saúde</h1>
        <p className="text-muted-foreground mt-1">Última atualização: {new Date(data.lastUpdated).toLocaleDateString('pt-BR')}</p>
      </div>

      {/* Overdue & Upcoming Exam Alert Cards */}
      {(() => {
        const overdueExams = data.exams.filter(e => e.status === 'Atrasado');
        const upcomingExams = data.exams.filter(e => e.status === 'Próximo');
        const alertExams = [...overdueExams, ...upcomingExams];
        if (alertExams.length === 0 && redCount === 0) return null;
        return (
          <div className="space-y-3">
            {redCount > 0 && (
              <div className="glass-card rounded-xl p-4 flex items-start gap-3 border-l-4" style={{ borderLeftColor: 'hsl(var(--status-red))' }}>
                <AlertTriangle className="w-5 h-5 status-red shrink-0 mt-0.5" />
                <p className="text-sm"><strong>{redCount} indicador(es)</strong> requerem ação imediata.</p>
              </div>
            )}
            {alertExams.length > 0 && (
              <div className="glass-card rounded-xl p-4 border-l-4" style={{ borderLeftColor: overdueExams.length > 0 ? 'hsl(var(--status-red))' : 'hsl(var(--status-yellow))' }}>
                <div className="flex items-start gap-3 mb-3">
                  <CalendarClock className="w-5 h-5 shrink-0 mt-0.5" style={{ color: overdueExams.length > 0 ? 'hsl(var(--status-red))' : 'hsl(var(--status-yellow))' }} />
                  <p className="text-sm font-medium">
                    {overdueExams.length > 0 && <span><strong>{overdueExams.length} exame(s) atrasado(s)</strong></span>}
                    {overdueExams.length > 0 && upcomingExams.length > 0 && ' • '}
                    {upcomingExams.length > 0 && <span>{upcomingExams.length} próximo(s) do vencimento</span>}
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 ml-8">
                  {alertExams.map(e => {
                    const isOverdue = e.status === 'Atrasado';
                    return (
                      <div key={e.id} className="flex items-center justify-between text-xs rounded-lg px-3 py-2.5 animate-fade-in"
                        style={{ backgroundColor: isOverdue ? 'hsl(var(--status-red) / 0.08)' : 'hsl(var(--status-yellow) / 0.08)' }}>
                        <div className="min-w-0 mr-2">
                          <p className="font-medium truncate">{e.name}</p>
                          <p className="text-muted-foreground">{e.category}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${isOverdue ? 'bg-status-red status-red' : 'bg-status-yellow status-yellow'}`}>
                            {e.status}
                          </span>
                          <ArrowRight className="w-3 h-3 text-muted-foreground" />
                          <span className="text-muted-foreground">Agendar</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* Worsened biomarkers alert */}
      {worsenedBiomarkers.length > 0 && (
        <div className="glass-card rounded-xl p-4 border-l-4" style={{ borderLeftColor: 'hsl(var(--destructive))' }}>
          <div className="flex items-start gap-3 mb-3">
            <TrendingDown className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <p className="text-sm font-medium"><strong>{worsenedBiomarkers.length} indicador(es)</strong> pioraram em relação ao último registro</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 ml-8">
            {worsenedBiomarkers.map(b => {
              const prev = b.history[0].value;
              const diff = b.value! - prev;
              const pct = ((diff / prev) * 100).toFixed(1);
              const isUp = diff > 0;
              return (
                <div key={b.id} className="flex items-center justify-between text-xs bg-secondary/50 rounded-lg px-3 py-2">
                  <span className="text-muted-foreground truncate mr-2">{b.name}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="font-mono font-medium">{prev}</span>
                    <span className="text-muted-foreground">→</span>
                    <span className="font-mono font-bold">{b.value}</span>
                    <span className={`text-xs font-medium ${isUp ? 'status-red' : 'status-red'}`}>
                      ({isUp ? '+' : ''}{pct}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {yellowCount > 0 && redCount === 0 && (
        <div className="glass-card rounded-xl p-4 flex items-start gap-3 border-l-4" style={{ borderLeftColor: 'hsl(var(--status-yellow))' }}>
          <Info className="w-5 h-5 status-yellow shrink-0 mt-0.5" />
          <p className="text-sm"><strong>{yellowCount} indicador(es)</strong> merecem atenção nas próximas consultas.</p>
        </div>
      )}

      {overdueCount === 0 && redCount === 0 && yellowCount === 0 && (
        <div className="glass-card rounded-xl p-4 flex items-start gap-3 border-l-4" style={{ borderLeftColor: 'hsl(var(--status-green))' }}>
          <CheckCircle2 className="w-5 h-5 status-green shrink-0 mt-0.5" />
          <p className="text-sm">Todos os indicadores estão dentro da faixa adequada.</p>
        </div>
      )}

      {/* Health Priority Engine */}
      <HealthPriorityEngine data={data} />

      {/* Health Alerts */}
      <HealthAlerts alerts={healthAlerts} maxVisible={4} />

      {/* Scores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button onClick={() => setShowScoreDetail('cardiac')} className="text-left">
          <ScoreGauge
            label="Risco Cardíaco"
            value={cardiac.value}
            status={cardiac.status}
            subtitle="Pressão, lipídios, inflamação"
            colorVar="score-cardiac"
          />
        </button>
        <button onClick={() => setShowScoreDetail('metabolic')} className="text-left">
          <ScoreGauge
            label="Score Metabólico"
            value={metabolic.value}
            status={metabolic.status}
            subtitle="Glicemia, composição, fígado"
            colorVar="score-metabolic"
          />
        </button>
        <button onClick={() => setShowScoreDetail('longevity')} className="text-left">
          <ScoreGauge
            label="Score de Longevidade"
            value={longevity.value}
            status={longevity.status}
            subtitle="Saúde global + hábitos"
            colorVar="score-longevity"
          />
        </button>
      </div>

      {/* Score detail panel */}
      {showScoreDetail && (
        <ScoreDetailPanel
          type={showScoreDetail as 'cardiac' | 'metabolic' | 'longevity'}
          score={showScoreDetail === 'cardiac' ? cardiac : showScoreDetail === 'metabolic' ? metabolic : longevity}
          onClose={() => setShowScoreDetail(null)}
        />
      )}

      {/* Health Radar + Domain Grid */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Saúde por Domínio</h2>
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-4">
          <HealthRadar domainScores={domainScores} previousScores={previousDomainScores} />
          <DomainGrid
            domainScores={domainScores}
            showDomainDetail={showDomainDetail}
            setShowDomainDetail={setShowDomainDetail}
            data={data}
          />
        </div>
      </div>

      {/* KPIs */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Indicadores-Chave</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {keyBiomarkers.map(b => (
            <KPICard key={b.id} biomarker={b} onClick={() => setEditingBiomarker(b)} />
          ))}
        </div>
      </div>

      {/* Longevity Forecast */}
      <LongevityForecast forecast={forecast} />

      {/* What-If Simulator */}
      <WhatIfSimulator />

      {/* Health Risk Map */}
      <HealthRiskMap data={data} />

      {/* Preventive Compliance & Balance Sheet */}
      <PreventiveComplianceScore data={data} />
      <HealthBalanceSheet data={data} />

      {/* Disclaimer */}
      <div className="glass-card rounded-xl p-4 text-xs text-muted-foreground">
        <p><strong>Aviso:</strong> Este painel é uma ferramenta de organização e acompanhamento preventivo. 
        Não substitui diagnóstico ou orientação médica profissional. Os scores são heurísticas simplificadas 
        para auxiliar no planejamento de saúde.</p>
      </div>

      {editingBiomarker && (
        <BiomarkerEditDialog
          biomarker={editingBiomarker}
          onClose={() => setEditingBiomarker(null)}
        />
      )}
    </div>
  );
};

export default Dashboard;

// Inline grid that inserts detail panel below the clicked card's row

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
        return (
          <div key={d.id} className="contents">
            <button
              onClick={() => setShowDomainDetail(isActive ? null : d.id)}
              className={`glass-card rounded-xl p-4 text-left hover:bg-accent/30 transition-all ${isActive ? 'ring-1 ring-primary' : ''}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-secondary">
                    <Icon className="w-4 h-4" style={{ color: `hsl(var(--status-${d.status === 'unknown' ? 'yellow' : d.status}))` }} />
                  </div>
                  <span className="text-sm font-medium">{d.label}</span>
                </div>
                <span
                  className="px-2 py-0.5 rounded-full text-xs font-bold font-mono"
                  style={{
                    color: `hsl(var(--status-${d.status}))`,
                    backgroundColor: `hsl(var(--status-${d.status}) / 0.15)`,
                  }}
                >
                  {d.score}
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-secondary mb-2.5">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${d.score}%`, backgroundColor: `hsl(var(--status-${d.status}))` }}
                />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{d.summary}</p>
            </button>
            {isActive && (
              <div className="col-span-full">
                <DomainDetailPanel
                  domainId={d.id}
                  label={d.label}
                  score={d.score}
                  status={d.status}
                  summary={d.summary}
                  data={data}
                  onClose={() => setShowDomainDetail(null)}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
