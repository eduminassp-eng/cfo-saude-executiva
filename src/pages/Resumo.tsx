import { useHealth } from '@/contexts/HealthContext';
import { calcCardiacScore, calcMetabolicScore, calcLongevityScore } from '@/lib/scoring';
import { Printer } from 'lucide-react';
import { PageTransition } from '@/components/motion/PageTransition';
import { StaggerContainer, StaggerItem } from '@/components/motion/StaggerContainer';

const Resumo = () => {
  const { data } = useHealth();
  const cardiac = calcCardiacScore(data);
  const metabolic = calcMetabolicScore(data);
  const longevity = calcLongevityScore(data);

  const overdueExams = data.exams.filter(e => e.status === 'Atrasado');
  const yellowBiomarkers = data.biomarkers.filter(b => b.status === 'yellow');
  const redBiomarkers = data.biomarkers.filter(b => b.status === 'red');

  const statusColor = (s: string) =>
    s === 'green' ? 'text-[hsl(var(--status-green))]' : s === 'yellow' ? 'text-[hsl(var(--status-yellow))]' : 'text-[hsl(var(--status-red))]';

  return (
    <PageTransition>
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Resumo para Consulta</h1>
          <p className="text-sm text-muted-foreground mt-1">Leve este resumo ao seu médico</p>
        </div>
        <button
          onClick={() => window.print()}
          className="no-print flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Printer className="w-4 h-4" /> Imprimir
        </button>
      </div>

      {/* Scores */}
      <StaggerContainer className="grid grid-cols-3 gap-3">
        {[
          { label: 'Cardíaco', value: cardiac.value, status: cardiac.status },
          { label: 'Metabólico', value: metabolic.value, status: metabolic.status },
          { label: 'Longevidade', value: longevity.value, status: longevity.status },
        ].map(s => (
          <StaggerItem key={s.label}>
            <div className="glass-card p-4 text-center">
              <p className={`display-number text-2xl ${statusColor(s.status)}`}>{s.value}</p>
              <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">{s.label}</p>
            </div>
          </StaggerItem>
        ))}
      </StaggerContainer>

      {/* Red flags */}
      {redBiomarkers.length > 0 && (
        <div className="glass-card p-5 border-l-4 border-l-[hsl(var(--status-red))]">
          <h2 className="text-sm font-semibold mb-3 text-[hsl(var(--status-red))]">Indicadores Críticos</h2>
          <div className="space-y-2">
            {redBiomarkers.map(b => (
              <div key={b.id} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{b.name}</span>
                <span className="font-mono text-xs tabular-nums">{b.value} {b.unit}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attention */}
      {yellowBiomarkers.length > 0 && (
        <div className="glass-card p-5 border-l-4 border-l-[hsl(var(--status-yellow))]">
          <h2 className="text-sm font-semibold mb-3 text-[hsl(var(--status-yellow))]">Indicadores em Atenção</h2>
          <div className="space-y-2">
            {yellowBiomarkers.map(b => (
              <div key={b.id} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{b.name}</span>
                <span className="font-mono text-xs tabular-nums">{b.value} {b.unit} {b.note && <span className="text-muted-foreground">— {b.note}</span>}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Overdue exams */}
      {overdueExams.length > 0 && (
        <div className="glass-card p-5">
          <h2 className="text-sm font-semibold mb-3">Exames Atrasados</h2>
          <div className="space-y-2">
            {overdueExams.map(e => (
              <div key={e.id} className="flex justify-between text-sm">
                <span>{e.name}</span>
                <span className="text-muted-foreground text-xs">{e.nextDate ? `Previsto: ${new Date(e.nextDate).toLocaleDateString('pt-BR')}` : 'Agendar'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All biomarkers */}
      <div className="glass-card p-5">
        <h2 className="text-sm font-semibold mb-3">Todos os Biomarcadores</h2>
        <div className="space-y-0">
          {data.biomarkers.map(b => (
            <div key={b.id} className="flex justify-between text-sm py-2 border-b border-border/20 last:border-0">
              <span className="text-muted-foreground">{b.name}</span>
              <span className="font-mono text-xs tabular-nums">{b.value ?? '—'} {b.unit} {b.lastDate ? <span className="text-muted-foreground">({new Date(b.lastDate).toLocaleDateString('pt-BR')})</span> : ''}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="text-[10px] text-muted-foreground text-center space-y-0.5">
        <p>Gerado em {new Date().toLocaleDateString('pt-BR')} • HealthCFO Dashboard</p>
        <p>Este documento é para fins de organização pessoal. Não substitui orientação médica.</p>
      </div>
    </div>
    </PageTransition>
  );
};

export default Resumo;
