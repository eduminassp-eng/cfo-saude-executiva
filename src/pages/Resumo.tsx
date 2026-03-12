import { useHealth } from '@/contexts/HealthContext';
import { calcCardiacScore, calcMetabolicScore, calcLongevityScore } from '@/lib/scoring';
import { Printer } from 'lucide-react';
import { PageTransition } from '@/components/motion/PageTransition';

const Resumo = () => {
  const { data } = useHealth();
  const cardiac = calcCardiacScore(data);
  const metabolic = calcMetabolicScore(data);
  const longevity = calcLongevityScore(data);

  const overdueExams = data.exams.filter(e => e.status === 'Atrasado');
  const yellowBiomarkers = data.biomarkers.filter(b => b.status === 'yellow');
  const redBiomarkers = data.biomarkers.filter(b => b.status === 'red');

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Resumo para Consulta</h1>
          <p className="text-muted-foreground mt-1">Leve este resumo ao seu médico</p>
        </div>
        <button
          onClick={() => window.print()}
          className="no-print flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Printer className="w-4 h-4" /> Imprimir
        </button>
      </div>

      {/* Scores summary */}
      <div className="glass-card rounded-xl p-5">
        <h2 className="font-semibold mb-3">Scores Atuais</h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-muted-foreground">Cardíaco</p>
            <p className="text-2xl font-bold font-mono">{cardiac.value}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Metabólico</p>
            <p className="text-2xl font-bold font-mono">{metabolic.value}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Longevidade</p>
            <p className="text-2xl font-bold font-mono">{longevity.value}</p>
          </div>
        </div>
      </div>

      {/* Red flags */}
      {redBiomarkers.length > 0 && (
        <div className="glass-card rounded-xl p-5">
          <h2 className="font-semibold mb-3 status-red">Indicadores Críticos</h2>
          <div className="space-y-2">
            {redBiomarkers.map(b => (
              <div key={b.id} className="flex justify-between text-sm">
                <span>{b.name}</span>
                <span className="font-mono">{b.value} {b.unit}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attention */}
      {yellowBiomarkers.length > 0 && (
        <div className="glass-card rounded-xl p-5">
          <h2 className="font-semibold mb-3 status-yellow">Indicadores em Atenção</h2>
          <div className="space-y-2">
            {yellowBiomarkers.map(b => (
              <div key={b.id} className="flex justify-between text-sm">
                <span>{b.name}</span>
                <span className="font-mono">{b.value} {b.unit} {b.note && `— ${b.note}`}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Overdue exams */}
      {overdueExams.length > 0 && (
        <div className="glass-card rounded-xl p-5">
          <h2 className="font-semibold mb-3">Exames Atrasados</h2>
          <div className="space-y-2">
            {overdueExams.map(e => (
              <div key={e.id} className="flex justify-between text-sm">
                <span>{e.name}</span>
                <span className="text-muted-foreground">{e.nextDate ? `Previsto: ${new Date(e.nextDate).toLocaleDateString('pt-BR')}` : 'Agendar'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All biomarkers */}
      <div className="glass-card rounded-xl p-5">
        <h2 className="font-semibold mb-3">Todos os Biomarcadores</h2>
        <div className="space-y-1.5">
          {data.biomarkers.map(b => (
            <div key={b.id} className="flex justify-between text-sm py-1 border-b border-border/30">
              <span className="text-muted-foreground">{b.name}</span>
              <span className="font-mono text-xs">{b.value ?? '—'} {b.unit} {b.lastDate ? `(${new Date(b.lastDate).toLocaleDateString('pt-BR')})` : ''}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="text-xs text-muted-foreground text-center">
        <p>Gerado em {new Date().toLocaleDateString('pt-BR')} • HealthCFO Dashboard</p>
        <p className="mt-1">Este documento é para fins de organização pessoal. Não substitui orientação médica.</p>
      </div>
    </div>
  );
};

export default Resumo;
