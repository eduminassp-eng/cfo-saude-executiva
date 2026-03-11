import { useHealth } from '@/contexts/HealthContext';
import { calcCardiacScore, calcMetabolicScore, calcLongevityScore } from '@/lib/scoring';
import { ScoreGauge } from '@/components/ScoreGauge';
import { KPICard } from '@/components/KPICard';
import { AlertTriangle, CheckCircle2, Info, TrendingUp, TrendingDown } from 'lucide-react';
import { useState, useMemo } from 'react';
import { BiomarkerEditDialog } from '@/components/BiomarkerEditDialog';
import { Biomarker } from '@/types/health';
import { ScoreDetailPanel } from '@/components/ScoreDetailPanel';

const Dashboard = () => {
  const { data } = useHealth();
  const cardiac = calcCardiacScore(data);
  const metabolic = calcMetabolicScore(data);
  const longevity = calcLongevityScore(data);
  const [editingBiomarker, setEditingBiomarker] = useState<Biomarker | null>(null);
  const [showScoreDetail, setShowScoreDetail] = useState<string | null>(null);

  const overdueCount = data.exams.filter(e => e.status === 'Atrasado').length;
  const yellowCount = data.biomarkers.filter(b => b.status === 'yellow').length;
  const redCount = data.biomarkers.filter(b => b.status === 'red').length;

  const keyBiomarkers = data.biomarkers.filter(b => 
    ['pa-sys', 'glicemia', 'hba1c', 'ldl', 'hdl', 'trig', 'creatinina', 'tsh', 'tgo', 'tgp', 'ggt', 'vitd', 'ferritina', 'imc', 'cintura', 'psa'].includes(b.id)
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Painel Executivo de Saúde</h1>
        <p className="text-muted-foreground mt-1">Última atualização: {new Date(data.lastUpdated).toLocaleDateString('pt-BR')}</p>
      </div>

      {/* Alerts */}
      {(overdueCount > 0 || redCount > 0) && (
        <div className="glass-card rounded-xl p-4 flex items-start gap-3 border-l-4" style={{ borderLeftColor: 'hsl(var(--status-red))' }}>
          <AlertTriangle className="w-5 h-5 status-red shrink-0 mt-0.5" />
          <div className="text-sm">
            {overdueCount > 0 && <p><strong>{overdueCount} exame(s) atrasado(s)</strong> necessitam agendamento.</p>}
            {redCount > 0 && <p><strong>{redCount} indicador(es)</strong> requerem ação imediata.</p>}
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

      {/* KPIs */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Indicadores-Chave</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {keyBiomarkers.map(b => (
            <KPICard key={b.id} biomarker={b} onClick={() => setEditingBiomarker(b)} />
          ))}
        </div>
      </div>

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
