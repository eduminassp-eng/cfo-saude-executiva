import { useHealth } from '@/contexts/HealthContext';
import { useMemo, useCallback, useState } from 'react';
import { calcCardiacScore, calcMetabolicScore, calcLongevityScore } from '@/lib/scoring';
import { Printer, AlertTriangle, CheckCircle2, TrendingDown, MessageCircleQuestion, Pill } from 'lucide-react';
import { PageTransition } from '@/components/motion/PageTransition';

const UP_IS_GOOD = new Set(['hdl', 'vitd', 'vitb12', 'ferritina', 'testosterona']);

const ResumoConsulta = () => {
  const { data } = useHealth();
  const [medications, setMedications] = useState(() => localStorage.getItem('health-cfo-medications') || '');

  const cardiac = useMemo(() => calcCardiacScore(data), [data]);
  const metabolic = useMemo(() => calcMetabolicScore(data), [data]);
  const longevity = useMemo(() => calcLongevityScore(data), [data]);

  const overdue = data.exams.filter(e => e.status === 'Atrasado');
  const redBiomarkers = data.biomarkers.filter(b => b.status === 'red');
  const yellowBiomarkers = data.biomarkers.filter(b => b.status === 'yellow');

  const trends = useMemo(() => {
    return data.biomarkers
      .filter(b => b.value !== null && b.history.length > 0)
      .map(b => {
        const prev = b.history[0].value;
        const diff = b.value! - prev;
        if (Math.abs(diff / prev) < 0.02) return null;
        const worsening = UP_IS_GOOD.has(b.id) ? diff < 0 : diff > 0;
        return worsening ? b.name : null;
      })
      .filter(Boolean);
  }, [data.biomarkers]);

  const doctorQuestions = useMemo(() => {
    const qs: string[] = [];
    redBiomarkers.forEach(b => qs.push(`${b.name} está em ${b.value} ${b.unit} — quais exames complementares?`));
    if (overdue.length > 0) qs.push(`Tenho ${overdue.length} exame(s) atrasado(s) — qual priorizar?`);
    if (yellowBiomarkers.length >= 3) qs.push('Vários indicadores no limite — existe padrão entre eles?');
    if (trends.length > 0) qs.push(`${trends.join(', ')} pioraram — devo investigar?`);
    return qs.slice(0, 5);
  }, [redBiomarkers, overdue, yellowBiomarkers, trends]);

  const handlePrint = useCallback(() => window.print(), []);

  const saveMedications = (val: string) => {
    setMedications(val);
    localStorage.setItem('health-cfo-medications', val);
  };

  const statusColor = (s: string) =>
    s === 'green' ? 'hsl(var(--status-green))' : s === 'yellow' ? 'hsl(var(--status-yellow))' : 'hsl(var(--status-red))';

  return (
    <PageTransition>
    <div className="space-y-5 max-w-2xl mx-auto print:space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight">Resumo para Consulta</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{new Date().toLocaleDateString('pt-BR')} • Health CFO</p>
        </div>
        <button
          onClick={handlePrint}
          className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium no-print"
        >
          <Printer className="w-4 h-4" />
          <span className="hidden sm:inline">Imprimir</span>
        </button>
      </div>

      {/* Scores */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Cardíaco', value: cardiac.value, status: cardiac.status },
          { label: 'Metabólico', value: metabolic.value, status: metabolic.status },
          { label: 'Longevidade', value: longevity.value, status: longevity.status },
        ].map(s => (
          <div key={s.label} className="glass-card rounded-xl p-3 text-center">
            <p className="text-xl font-bold font-mono" style={{ color: statusColor(s.status) }}>{s.value}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Major Alerts */}
      {(redBiomarkers.length > 0 || overdue.length > 0) && (
        <div className="glass-card rounded-xl p-4 border-l-4" style={{ borderLeftColor: 'hsl(var(--status-red))' }}>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-status-red" />
            <h2 className="text-sm font-semibold">Alertas Principais</h2>
          </div>
          <ul className="text-sm space-y-1">
            {redBiomarkers.map(b => <li key={b.id}>• <strong>{b.name}</strong>: {b.value} {b.unit}</li>)}
            {overdue.map(e => <li key={e.id}>• <strong>{e.name}</strong> atrasado</li>)}
          </ul>
        </div>
      )}

      {/* Attention */}
      {yellowBiomarkers.length > 0 && (
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-status-yellow" />
            <h2 className="text-sm font-semibold">Em Atenção</h2>
          </div>
          <p className="text-sm text-muted-foreground">{yellowBiomarkers.map(b => `${b.name} (${b.value} ${b.unit})`).join(' • ')}</p>
        </div>
      )}

      {/* Recent Trends */}
      {trends.length > 0 && (
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4 text-status-red" />
            <h2 className="text-sm font-semibold">Tendências de Piora</h2>
          </div>
          <p className="text-sm text-muted-foreground">{trends.join(', ')}</p>
        </div>
      )}

      {/* Medications */}
      <div className="glass-card rounded-xl p-4 no-print">
        <div className="flex items-center gap-2 mb-2">
          <Pill className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold">Medicamentos Atuais</h2>
        </div>
        <textarea
          value={medications}
          onChange={e => saveMedications(e.target.value)}
          placeholder="Liste seus medicamentos atuais aqui..."
          className="w-full bg-secondary rounded-lg px-3 py-2 text-sm min-h-[60px] focus:outline-none focus:ring-2 focus:ring-primary resize-none"
        />
      </div>
      {medications && (
        <div className="glass-card rounded-xl p-4 hidden print:block">
          <div className="flex items-center gap-2 mb-2">
            <Pill className="w-4 h-4" />
            <h2 className="text-sm font-semibold">Medicamentos Atuais</h2>
          </div>
          <p className="text-sm whitespace-pre-wrap">{medications}</p>
        </div>
      )}

      {/* Doctor Questions */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <MessageCircleQuestion className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold">Perguntas para o Médico</h2>
        </div>
        <ol className="text-sm space-y-1.5 list-decimal list-inside">
          {doctorQuestions.map((q, i) => <li key={i}>{q}</li>)}
          {doctorQuestions.length === 0 && <li className="text-muted-foreground list-none">Nenhuma pergunta gerada.</li>}
        </ol>
      </div>

      <p className="text-[10px] text-muted-foreground text-center">
        Documento para uso pessoal em consultas. Não substitui orientação médica.
      </p>
    </div>
  );
};

export default ResumoConsulta;
