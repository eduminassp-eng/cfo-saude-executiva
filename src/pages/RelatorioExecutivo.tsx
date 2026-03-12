import { useHealth } from '@/contexts/HealthContext';
import { useMemo, useCallback } from 'react';
import { calcCardiacScore, calcMetabolicScore, calcLongevityScore, calcDomainScores } from '@/lib/scoring';
import { generateExecutiveSummary, generateBiomarkerInsights } from '@/lib/copilot';
import { generateActionPlan } from '@/lib/actionPlan';
import { Printer } from 'lucide-react';
import { PageTransition } from '@/components/motion/PageTransition';
import { StaggerContainer, StaggerItem } from '@/components/motion/StaggerContainer';

const UP_IS_GOOD = new Set(['hdl', 'vitd', 'vitb12', 'ferritina', 'testosterona']);

const RelatorioExecutivo = () => {
  const { data } = useHealth();

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
        const worsening = UP_IS_GOOD.has(b.id) ? !isUp : isUp;
        if (Math.abs(diff / prev) < 0.02) return null;
        return { name: b.name, prev, current: b.value!, pct, worsening };
      })
      .filter(Boolean)
      .slice(0, 6);
  }, [data.biomarkers]);

  const handlePrint = useCallback(() => window.print(), []);

  const statusColor = (s: string) =>
    s === 'green' ? 'text-[hsl(var(--status-green))]' : s === 'yellow' ? 'text-[hsl(var(--status-yellow))]' : 'text-[hsl(var(--status-red))]';

  const statusBg = (s: string) =>
    s === 'green' ? 'hsl(var(--status-green))' : s === 'yellow' ? 'hsl(var(--status-yellow))' : 'hsl(var(--status-red))';

  return (
    <PageTransition>
    <div className="space-y-6 print:space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Relatório Executivo</h1>
          <p className="text-sm text-muted-foreground mt-1 print:text-black">Gerado em {new Date().toLocaleDateString('pt-BR')} • Health CFO</p>
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

      {/* Strengths & Attention */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2">
        <div className="glass-card p-5 print:border print:border-gray-200">
          <h2 className="text-sm font-semibold mb-3 text-[hsl(var(--status-green))]">✅ Pontos Fortes</h2>
          <ul className="space-y-1.5 text-sm">
            {summary.strengths.map((s, i) => <li key={i} className="flex gap-2"><span className="text-[hsl(var(--status-green))]">•</span>{s}</li>)}
            {summary.strengths.length === 0 && <li className="text-muted-foreground">Nenhum identificado.</li>}
          </ul>
        </div>
        <div className="glass-card p-5 print:border print:border-gray-200">
          <h2 className="text-sm font-semibold mb-3 text-[hsl(var(--status-yellow))]">⚠️ Pontos de Atenção</h2>
          <ul className="space-y-1.5 text-sm">
            {summary.attentionPoints.map((s, i) => <li key={i} className="flex gap-2"><span className="text-[hsl(var(--status-yellow))]">•</span>{s}</li>)}
            {summary.attentionPoints.length === 0 && <li className="text-muted-foreground">Nenhum identificado.</li>}
          </ul>
        </div>
      </div>

      {/* Key Biomarkers */}
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

      {/* Risk Alerts */}
      {(redBiomarkers.length > 0 || overdue.length > 0) && (
        <div className="glass-card p-5 border-l-4 border-l-[hsl(var(--status-red))] print:border print:border-gray-200">
          <h2 className="text-sm font-semibold mb-3">🔴 Alertas de Risco</h2>
          <ul className="space-y-1 text-sm">
            {redBiomarkers.map(b => <li key={b.id}>• {b.name}: {b.value} {b.unit} — nível crítico</li>)}
            {overdue.map(e => <li key={e.id}>• {e.name} atrasado — rastreamento de {e.mainRisk.toLowerCase()}</li>)}
          </ul>
        </div>
      )}

      {/* Trend Highlights */}
      {trendHighlights.length > 0 && (
        <div className="glass-card p-5 print:border print:border-gray-200">
          <h2 className="text-sm font-semibold mb-3">📈 Destaques de Tendência</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {trendHighlights.map((t, i) => t && (
              <div key={i} className="flex items-center justify-between text-xs bg-secondary/50 rounded-xl px-3 py-2.5">
                <span className="truncate mr-2">{t.name}</span>
                <span className="font-mono shrink-0 tabular-nums">
                  {t.prev} → {t.current} <span className={t.worsening ? 'text-[hsl(var(--status-red))]' : 'text-[hsl(var(--status-green))]'}>({t.pct}%)</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggested Appointments */}
      <div className="glass-card p-5 print:border print:border-gray-200">
        <h2 className="text-sm font-semibold mb-3">📋 Próximas Consultas Sugeridas</h2>
        <ul className="space-y-1.5 text-sm">
          {summary.suggestedAppointments.map((s, i) => <li key={i}>• {s}</li>)}
          {summary.suggestedAppointments.length === 0 && <li className="text-muted-foreground">Nenhuma sugerida.</li>}
        </ul>
      </div>

      {/* Doctor Questions */}
      <div className="glass-card p-5 print:border print:border-gray-200">
        <h2 className="text-sm font-semibold mb-3">❓ Perguntas para o Médico</h2>
        <ul className="space-y-1.5 text-sm">
          {insights.filter(i => i.biomarker.status !== 'green').slice(0, 6).map((ins, i) => (
            <li key={i}>• {ins.doctorQuestion}</li>
          ))}
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
