import { useHealth } from '@/contexts/HealthContext';
import { useMemo, useCallback, useState } from 'react';
import { calcCardiacScore, calcMetabolicScore, calcLongevityScore, calcDomainScores, HIGHER_IS_BETTER } from '@/lib/scoring';
import { generateExecutiveSummary, generateBiomarkerInsights } from '@/lib/copilot';
import { generateActionPlan } from '@/lib/actionPlan';
import { Printer, Pill, MessageCircleQuestion, TrendingDown, AlertTriangle, CheckCircle2, CalendarClock, Stethoscope } from 'lucide-react';
import { PageTransition } from '@/components/motion/PageTransition';
import { StaggerContainer, StaggerItem } from '@/components/motion/StaggerContainer';

const RelatorioExecutivo = () => {
  const { data } = useHealth();
  const [medications, setMedications] = useState(() => localStorage.getItem('health-cfo-medications') || '');

  const cardiac = useMemo(() => calcCardiacScore(data), [data]);
  const metabolic = useMemo(() => calcMetabolicScore(data), [data]);
  const longevity = useMemo(() => calcLongevityScore(data), [data]);
  const domains = useMemo(() => calcDomainScores(data), [data]);
  const summary = useMemo(() => generateExecutiveSummary(data), [data]);
  const insights = useMemo(() => generateBiomarkerInsights(data), [data]);
  const actionPlan = useMemo(() => generateActionPlan(data), [data]);

  const compliance = useMemo(() => {
    const total = data.exams.length;
    if (total === 0) return 0;
    const upToDate = data.exams.filter(e => e.status === 'Em dia').length;
    const upcoming = data.exams.filter(e => e.status === 'Próximo').length;
    return Math.round(((upToDate + upcoming * 0.75) / total) * 100);
  }, [data.exams]);

  const overdue = data.exams.filter(e => e.status === 'Atrasado');
  const redBiomarkers = data.biomarkers.filter(b => b.status === 'red');
  const yellowBiomarkers = data.biomarkers.filter(b => b.status === 'yellow');

  const trendHighlights = useMemo(() => {
    return data.biomarkers
      .filter(b => b.value !== null && b.history.length > 0)
      .map(b => {
        const prev = b.history[0].value;
        const diff = b.value! - prev;
        const pct = ((diff / prev) * 100).toFixed(1);
        const isUp = diff > 0;
        const worsening = HIGHER_IS_BETTER.has(b.id) ? !isUp : isUp;
        if (Math.abs(diff / prev) < 0.02) return null;
        return { name: b.name, prev, current: b.value!, pct, worsening };
      })
      .filter(Boolean)
      .slice(0, 6);
  }, [data.biomarkers]);

  const doctorQuestions = useMemo(() => {
    const qs: string[] = [];
    redBiomarkers.forEach(b => qs.push(`${b.name} está em ${b.value} ${b.unit} — quais exames complementares?`));
    if (overdue.length > 0) qs.push(`Tenho ${overdue.length} exame(s) atrasado(s) — qual priorizar?`);
    if (yellowBiomarkers.length >= 3) qs.push('Vários indicadores no limite — existe padrão entre eles?');
    const worseningNames = trendHighlights.filter(t => t && t.worsening).map(t => t!.name);
    if (worseningNames.length > 0) qs.push(`${worseningNames.join(', ')} pioraram — devo investigar?`);
    // Add AI-generated questions from insights
    insights.filter(i => i.biomarker.status !== 'green').slice(0, 3).forEach(ins => {
      if (!qs.some(q => q.includes(ins.biomarker.name))) {
        qs.push(ins.doctorQuestion);
      }
    });
    return qs.slice(0, 6);
  }, [redBiomarkers, overdue, yellowBiomarkers, trendHighlights, insights]);

  const handlePrint = useCallback(() => window.print(), []);

  const saveMedications = (val: string) => {
    setMedications(val);
    localStorage.setItem('health-cfo-medications', val);
  };

  const statusColor = (s: string) =>
    s === 'green' ? 'text-status-green' : s === 'yellow' ? 'text-status-yellow' : 'text-status-red';

  const statusBg = (s: string) =>
    s === 'green' ? 'hsl(var(--status-green))' : s === 'yellow' ? 'hsl(var(--status-yellow))' : 'hsl(var(--status-red))';

  return (
    <PageTransition>
    <div className="space-y-6 max-w-3xl mx-auto print:space-y-4 print:max-w-none">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Relatório de Saúde</h1>
          <p className="text-[10px] text-muted-foreground mt-0.5">{new Date().toLocaleDateString('pt-BR')} • Health CFO</p>
        </div>
        <button
          onClick={handlePrint}
          className="shrink-0 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity no-print"
        >
          <Printer className="w-4 h-4" />
          <span className="hidden sm:inline">Imprimir / PDF</span>
        </button>
      </div>

      {/* Scores */}
      <StaggerContainer className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:grid-cols-4">
        {[
          { label: 'Cardíaco', value: cardiac.value, status: cardiac.status },
          { label: 'Metabólico', value: metabolic.value, status: metabolic.status },
          { label: 'Longevidade', value: longevity.value, status: longevity.status },
          { label: 'Compliance', value: compliance, status: compliance >= 75 ? 'green' : compliance >= 50 ? 'yellow' : 'red' },
        ].map(s => (
          <StaggerItem key={s.label}>
            <div className="glass-card p-4 text-center print:border print:border-gray-200">
              <p className={`display-number text-2xl ${statusColor(s.status)}`}>{s.value}</p>
              <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">{s.label}</p>
            </div>
          </StaggerItem>
        ))}
      </StaggerContainer>

      {/* Domains */}
      <div className="glass-card p-5 print:border print:border-gray-200">
        <h2 className="text-sm font-semibold mb-3">Domínios de Saúde</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {domains.map(d => (
            <div key={d.id} className="text-center p-3 rounded-xl bg-secondary/50">
              <p className={`display-number text-lg ${statusColor(d.status)}`}>{d.score}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{d.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Risk Alerts */}
      {(redBiomarkers.length > 0 || overdue.length > 0) && (
        <div className="glass-card p-5 border-l-4 border-l-destructive print:border print:border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-status-red" />
            <h2 className="text-sm font-semibold">Alertas Principais</h2>
          </div>
          <ul className="space-y-1 text-sm">
            {redBiomarkers.map(b => <li key={b.id}>• <strong>{b.name}</strong>: {b.value} {b.unit} — nível crítico</li>)}
            {overdue.map(e => <li key={e.id}>• <strong>{e.name}</strong> atrasado — rastreamento de {e.mainRisk.toLowerCase()}</li>)}
          </ul>
        </div>
      )}

      {/* Strengths & Attention */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2">
        <div className="glass-card p-5 print:border print:border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-status-green" />
            <h2 className="text-sm font-semibold">Pontos Fortes</h2>
          </div>
          <ul className="space-y-1.5 text-sm">
            {summary.strengths.map((s, i) => <li key={i} className="flex gap-2"><span className="text-status-green">•</span>{s}</li>)}
            {summary.strengths.length === 0 && <li className="text-muted-foreground">Nenhum identificado.</li>}
          </ul>
        </div>
        <div className="glass-card p-5 print:border print:border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-status-yellow" />
            <h2 className="text-sm font-semibold">Pontos de Atenção</h2>
          </div>
          <ul className="space-y-1.5 text-sm">
            {summary.attentionPoints.map((s, i) => <li key={i} className="flex gap-2"><span className="text-status-yellow">•</span>{s}</li>)}
            {summary.attentionPoints.length === 0 && <li className="text-muted-foreground">Nenhum identificado.</li>}
          </ul>
        </div>
      </div>

      {/* Attention biomarkers inline */}
      {yellowBiomarkers.length > 0 && (
        <div className="glass-card p-4 print:border print:border-gray-200">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Em atenção:</span>{' '}
            {yellowBiomarkers.map(b => `${b.name} (${b.value} ${b.unit})`).join(' • ')}
          </p>
        </div>
      )}

      {/* Trend Highlights */}
      {trendHighlights.length > 0 && (
        <div className="glass-card p-5 print:border print:border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown className="w-4 h-4 text-status-red" />
            <h2 className="text-sm font-semibold">Destaques de Tendência</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {trendHighlights.map((t, i) => t && (
              <div key={i} className="flex items-center justify-between text-xs bg-secondary/50 rounded-xl px-3 py-2.5">
                <span className="truncate mr-2">{t.name}</span>
                <span className="font-mono shrink-0 tabular-nums">
                  {t.prev} → {t.current} <span className={t.worsening ? 'text-status-red' : 'text-status-green'}>({t.pct}%)</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Biomarkers Table */}
      <div className="glass-card p-5 print:border print:border-gray-200">
        <h2 className="text-sm font-semibold mb-3">Biomarcadores-Chave</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[10px] text-muted-foreground uppercase tracking-wider">
                <th className="pb-2 pr-4">Biomarcador</th>
                <th className="pb-2 pr-4">Valor</th>
                <th className="pb-2 pr-4">Faixa</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.biomarkers.filter(b => b.value !== null).slice(0, 16).map(b => (
                <tr key={b.id} className="border-b border-border/20">
                  <td className="py-2 pr-4 text-xs font-medium">{b.name}</td>
                  <td className="py-2 pr-4 font-mono text-xs tabular-nums">{b.value} {b.unit}</td>
                  <td className="py-2 pr-4 text-muted-foreground text-[10px]">
                    {b.targetMin ?? '—'} – {b.targetMax ?? '—'}
                  </td>
                  <td className="py-2">
                    <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: statusBg(b.status) }} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Medications */}
      <div className="glass-card p-4 no-print">
        <div className="flex items-center gap-2 mb-2">
          <Pill className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold">Medicamentos Atuais</h2>
        </div>
        <textarea
          value={medications}
          onChange={e => saveMedications(e.target.value)}
          placeholder="Liste seus medicamentos atuais aqui..."
          className="w-full bg-secondary/60 rounded-xl px-3 py-2.5 text-sm min-h-[60px] focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none transition-all"
        />
      </div>
      {medications && (
        <div className="glass-card p-4 hidden print:block print:border print:border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Pill className="w-4 h-4" />
            <h2 className="text-sm font-semibold">Medicamentos Atuais</h2>
          </div>
          <p className="text-sm whitespace-pre-wrap">{medications}</p>
        </div>
      )}

      {/* Doctor Questions */}
      <div className="glass-card p-5 print:border print:border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <MessageCircleQuestion className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold">Perguntas para o Médico</h2>
        </div>
        <ol className="text-sm space-y-1.5 list-decimal list-inside">
          {doctorQuestions.map((q, i) => <li key={i}>{q}</li>)}
          {doctorQuestions.length === 0 && <li className="text-muted-foreground list-none">Nenhuma pergunta gerada.</li>}
        </ol>
      </div>

      {/* Suggested Appointments */}
      <div className="glass-card p-5 print:border print:border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <Stethoscope className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold">Próximas Consultas Sugeridas</h2>
        </div>
        <ul className="space-y-1.5 text-sm">
          {summary.suggestedAppointments.map((s, i) => <li key={i}>• {s}</li>)}
          {summary.suggestedAppointments.length === 0 && <li className="text-muted-foreground">Nenhuma sugerida.</li>}
        </ul>
      </div>

      {/* Action Plan */}
      <div className="glass-card p-5 print:border print:border-gray-200 print:break-before-page">
        <h2 className="text-sm font-semibold mb-4">🎯 Plano de Ação</h2>
        <div className="space-y-4">
          {[
            { label: 'Próximos 30 dias', items: actionPlan.thirtyDays },
            { label: 'Próximos 90 dias', items: actionPlan.ninetyDays },
            { label: 'Próximos 180 dias', items: actionPlan.oneEightyDays },
          ].map(horizon => (
            <div key={horizon.label}>
              <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">{horizon.label}</h3>
              {horizon.items.length > 0 ? (
                <ul className="space-y-1.5 text-sm">
                  {horizon.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span
                        className="shrink-0 mt-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider"
                        style={{
                          backgroundColor: item.priority === 'alta' ? 'hsl(var(--status-red) / 0.1)' : item.priority === 'média' ? 'hsl(var(--status-yellow) / 0.1)' : 'hsl(var(--status-green) / 0.1)',
                          color: item.priority === 'alta' ? 'hsl(var(--status-red))' : item.priority === 'média' ? 'hsl(var(--status-yellow))' : 'hsl(var(--status-green))',
                        }}
                      >
                        {item.priority}
                      </span>
                      <div>
                        <span>{item.action}</span>
                        <span className="text-xs text-muted-foreground ml-1">— {item.reason}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">Nenhuma ação pendente.</p>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card p-4 text-[10px] text-muted-foreground text-center print:border print:border-gray-200">
        Este relatório é para organização e acompanhamento preventivo. Não substitui avaliação, diagnóstico ou orientação médica.
      </div>
    </div>
    </PageTransition>
  );
};

export default RelatorioExecutivo;
