import { useHealth } from '@/contexts/HealthContext';
import { useMemo, useState } from 'react';
import {
  generateBiomarkerInsights,
  generateExamInsights,
} from '@/lib/copilot';
import { calcCardiacScore, calcMetabolicScore, calcLongevityScore } from '@/lib/scoring';
import { CopilotBiomarkerCard } from '@/components/copilot/BiomarkerCard';
import { CopilotExamCard } from '@/components/copilot/ExamCard';
import { HealthChat } from '@/components/copilot/HealthChat';
import { HealthAlerts } from '@/components/HealthAlerts';
import { generateHealthAlerts } from '@/lib/healthAlerts';
import { ShieldAlert, Search, Activity, ClipboardList, Bell, MessageCircle, FileBarChart, BrainCircuit, Sparkles } from 'lucide-react';
import { PageTransition } from '@/components/motion/PageTransition';
import { StaggerContainer, StaggerItem } from '@/components/motion/StaggerContainer';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const Copilot = () => {
  const { data } = useHealth();
  const [tab, setTab] = useState<'chat' | 'alerts' | 'biomarkers' | 'exams'>('chat');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const biomarkerInsights = useMemo(() => generateBiomarkerInsights(data), [data]);
  const examInsights = useMemo(() => generateExamInsights(data), [data]);
  const healthAlerts = useMemo(() => generateHealthAlerts(data), [data]);
  const scores = useMemo(() => ({
    cardiac: calcCardiacScore(data),
    metabolic: calcMetabolicScore(data),
    longevity: calcLongevityScore(data),
  }), [data]);

  const filteredBiomarkers = useMemo(() => {
    return biomarkerInsights.filter(i => {
      if (search && !i.biomarker.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter && i.biomarker.status !== statusFilter) return false;
      return true;
    });
  }, [biomarkerInsights, search, statusFilter]);

  const filteredExams = useMemo(() => {
    return examInsights.filter(i => {
      if (search && !i.exam.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter) {
        const statusMap: Record<string, string> = { green: 'Em dia', yellow: 'Próximo', red: 'Atrasado' };
        if (statusMap[statusFilter] && i.exam.status !== statusMap[statusFilter]) return false;
      }
      return true;
    });
  }, [examInsights, search, statusFilter]);

  const alertCount = healthAlerts.filter(a => a.severity === 'critical').length;
  const warningCount = healthAlerts.filter(a => a.severity === 'warning').length;

  const tabs = [
    { id: 'chat' as const, label: 'Chat IA', icon: MessageCircle, badge: 0 },
    { id: 'alerts' as const, label: 'Alertas', icon: Bell, badge: alertCount + warningCount },
    { id: 'biomarkers' as const, label: 'Bio', icon: Activity, badge: 0 },
    { id: 'exams' as const, label: 'Exames', icon: ClipboardList, badge: 0 },
  ];

  const overallScore = Math.round((scores.cardiac.value + scores.metabolic.value + scores.longevity.value) / 3);

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Hero Header */}
        <div className="flex items-start justify-between gap-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-9 h-9 rounded-xl bg-primary/12 flex items-center justify-center">
                <BrainCircuit className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight">
                  AI Health <span className="liquid-text">Copilot</span>
                </h1>
              </div>
            </div>
            <p className="text-sm text-muted-foreground font-medium mt-1">
              Interpretação inteligente dos seus dados de saúde
            </p>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
            <Link
              to="/relatorio"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all btn-press"
            >
              <FileBarChart className="w-4 h-4" />
              <span className="hidden sm:inline">Relatório</span>
            </Link>
          </motion.div>
        </div>

        {/* Score Mini Cards */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <StaggerContainer className="grid grid-cols-3 gap-3">
            {[
              { label: 'Cardíaco', value: scores.cardiac.value, colorVar: '--score-cardiac' },
              { label: 'Metabólico', value: scores.metabolic.value, colorVar: '--score-metabolic' },
              { label: 'Longevidade', value: scores.longevity.value, colorVar: '--score-longevity' },
            ].map(s => (
              <StaggerItem key={s.label}>
                <div className="glass-card rounded-xl p-4 text-center relative overflow-hidden">
                  <div
                    className="absolute inset-0 opacity-[0.04]"
                    style={{
                      background: `radial-gradient(circle at 50% 0%, hsl(var(${s.colorVar})), transparent 70%)`,
                    }}
                  />
                  <p className="display-number text-2xl lg:text-3xl relative z-10" style={{ color: `hsl(var(${s.colorVar}))` }}>
                    {s.value}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 font-medium relative z-10">{s.label}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </motion.div>

        {/* Tabs — Liquid Glass pill style */}
        <div className="flex gap-1.5 bg-secondary/40 rounded-2xl p-1.5 overflow-x-auto scrollbar-none">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setSearch(''); setStatusFilter(''); }}
              className={`relative flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                tab === t.id
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
              }`}
              style={tab === t.id ? {
                boxShadow: '0 4px 20px -4px hsl(var(--primary) / 0.3)',
              } : undefined}
            >
              <t.icon className="w-4 h-4 shrink-0" />
              {t.label}
              {t.badge > 0 && (
                <span
                  className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center"
                  style={{
                    backgroundColor: tab === t.id ? 'hsl(var(--primary-foreground) / 0.2)' : 'hsl(var(--status-red) / 0.15)',
                    color: tab === t.id ? 'hsl(var(--primary-foreground))' : 'hsl(var(--status-red))',
                  }}
                >
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Filters for biomarkers/exams tabs */}
        {(tab === 'biomarkers' || tab === 'exams') && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-wrap gap-2.5"
          >
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={tab === 'biomarkers' ? 'Buscar biomarcador...' : 'Buscar exame...'}
                className="w-full bg-secondary/80 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>
            <div className="flex gap-1.5">
              {['', 'green', 'yellow', 'red'].map(s => {
                const labels: Record<string, string> = { '': 'Todos', green: 'Normal', yellow: 'Atenção', red: 'Crítico' };
                const colorVars: Record<string, string> = { green: '--status-green', yellow: '--status-yellow', red: '--status-red' };
                return (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      statusFilter === s
                        ? s ? 'ring-1' : 'bg-primary/15 text-primary ring-1 ring-primary/30'
                        : 'bg-secondary/80 text-muted-foreground hover:text-foreground'
                    }`}
                    style={statusFilter === s && s ? {
                      backgroundColor: `hsl(var(${colorVars[s]}) / 0.12)`,
                      color: `hsl(var(${colorVars[s]}))`,
                      borderColor: `hsl(var(${colorVars[s]}) / 0.3)`,
                    } : undefined}
                  >
                    {labels[s]}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Content */}
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {tab === 'chat' && <HealthChat />}

          {tab === 'alerts' && <HealthAlerts alerts={healthAlerts} maxVisible={20} />}

          {tab === 'biomarkers' && (
            <StaggerContainer className="space-y-3">
              {filteredBiomarkers.map((insight, i) => (
                <StaggerItem key={insight.biomarker.id}>
                  <CopilotBiomarkerCard insight={insight} index={i} />
                </StaggerItem>
              ))}
              {filteredBiomarkers.length === 0 && (
                <div className="glass-card rounded-2xl p-12 text-center">
                  <Activity className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-sm font-medium">Nenhum biomarcador encontrado</p>
                </div>
              )}
            </StaggerContainer>
          )}

          {tab === 'exams' && (
            <StaggerContainer className="space-y-3">
              {filteredExams.map((insight, i) => (
                <StaggerItem key={insight.exam.id}>
                  <CopilotExamCard insight={insight} index={i} />
                </StaggerItem>
              ))}
              {filteredExams.length === 0 && (
                <div className="glass-card rounded-2xl p-12 text-center">
                  <ClipboardList className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-sm font-medium">Nenhum exame encontrado</p>
                </div>
              )}
            </StaggerContainer>
          )}
        </motion.div>

        {/* Disclaimer */}
        <div className="glass-card rounded-xl p-4">
          <p className="text-xs text-muted-foreground leading-relaxed text-center">
            <ShieldAlert className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5 opacity-60" />
            Este painel é apenas para organização e acompanhamento preventivo. Não substitui avaliação, diagnóstico ou orientação médica.
          </p>
        </div>
      </div>
    </PageTransition>
  );
};

export default Copilot;