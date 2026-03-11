import { useHealth } from '@/contexts/HealthContext';
import { useMemo, useState, useEffect, useCallback } from 'react';
import {
  generateBiomarkerInsights,
  generateExamInsights,
  generateExecutiveSummary,
  BiomarkerInsight,
  ExamInsight,
} from '@/lib/copilot';
import { calcCardiacScore, calcMetabolicScore, calcLongevityScore } from '@/lib/scoring';
import { CopilotExecutiveSummary } from '@/components/copilot/ExecutiveSummary';
import { CopilotBiomarkerCard } from '@/components/copilot/BiomarkerCard';
import { CopilotExamCard } from '@/components/copilot/ExamCard';
import { ShieldAlert, Search, Activity, ClipboardList, Download } from 'lucide-react';
import { toast } from 'sonner';

const Copilot = () => {
  const { data } = useHealth();
  const [tab, setTab] = useState<'summary' | 'biomarkers' | 'exams'>('summary');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const biomarkerInsights = useMemo(() => generateBiomarkerInsights(data), [data]);
  const examInsights = useMemo(() => generateExamInsights(data), [data]);
  const summary = useMemo(() => generateExecutiveSummary(data), [data]);
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

  const tabs = [
    { id: 'summary' as const, label: 'Resumo Executivo', icon: ShieldAlert },
    { id: 'biomarkers' as const, label: 'Biomarcadores', icon: Activity },
    { id: 'exams' as const, label: 'Exames', icon: ClipboardList },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
          AI Health <span className="text-primary">Copilot</span>
        </h1>
        <p className="text-muted-foreground mt-1">
          Interpretação inteligente dos seus biomarcadores e exames preventivos
        </p>
      </div>

      {/* Score summary bar */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Cardíaco', value: scores.cardiac.value, color: 'hsl(var(--score-cardiac))' },
          { label: 'Metabólico', value: scores.metabolic.value, color: 'hsl(var(--score-metabolic))' },
          { label: 'Longevidade', value: scores.longevity.value, color: 'hsl(var(--score-longevity))' },
        ].map(s => (
          <div key={s.label} className="glass-card rounded-xl p-4 text-center">
            <p className="text-2xl font-bold font-mono" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary/50 rounded-lg p-1">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setSearch(''); setStatusFilter(''); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all flex-1 justify-center ${
              tab === t.id
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <t.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Filters for biomarkers/exams tabs */}
      {tab !== 'summary' && (
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={tab === 'biomarkers' ? 'Buscar biomarcador...' : 'Buscar exame...'}
              className="w-full bg-secondary rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-secondary rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Todos os status</option>
            <option value="green">Normal</option>
            <option value="yellow">Atenção</option>
            <option value="red">Crítico</option>
          </select>
        </div>
      )}

      {/* Content */}
      {tab === 'summary' && <CopilotExecutiveSummary summary={summary} scores={scores} />}

      {tab === 'biomarkers' && (
        <div className="space-y-4">
          {filteredBiomarkers.map((insight, i) => (
            <CopilotBiomarkerCard key={insight.biomarker.id} insight={insight} index={i} />
          ))}
          {filteredBiomarkers.length === 0 && (
            <p className="text-center py-8 text-muted-foreground text-sm">Nenhum biomarcador encontrado.</p>
          )}
        </div>
      )}

      {tab === 'exams' && (
        <div className="space-y-4">
          {filteredExams.map((insight, i) => (
            <CopilotExamCard key={insight.exam.id} insight={insight} index={i} />
          ))}
          {filteredExams.length === 0 && (
            <p className="text-center py-8 text-muted-foreground text-sm">Nenhum exame encontrado.</p>
          )}
        </div>
      )}

      {/* Disclaimer */}
      <div className="glass-card rounded-xl p-4 border border-border/50">
        <p className="text-xs text-muted-foreground leading-relaxed text-center">
          <ShieldAlert className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5 text-status-yellow" />
          Este painel é apenas para organização e acompanhamento preventivo. Não substitui avaliação, diagnóstico ou orientação médica.
        </p>
      </div>
    </div>
  );
};

export default Copilot;
