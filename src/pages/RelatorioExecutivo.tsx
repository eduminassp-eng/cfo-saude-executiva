import { useHealth } from '@/contexts/HealthContext';
import { useMemo, useCallback } from 'react';
import { calcCardiacScore, calcMetabolicScore, calcLongevityScore, calcDomainScores } from '@/lib/scoring';
import { generateExecutiveSummary, generateBiomarkerInsights } from '@/lib/copilot';
import { Printer, Download } from 'lucide-react';

const UP_IS_GOOD = new Set(['hdl', 'vitd', 'vitb12', 'ferritina', 'testosterona']);

const RelatorioExecutivo = () => {
  const { data } = useHealth();

  const cardiac = useMemo(() => calcCardiacScore(data), [data]);
  const metabolic = useMemo(() => calcMetabolicScore(data), [data]);
  const longevity = useMemo(() => calcLongevityScore(data), [data]);
  const domains = useMemo(() => calcDomainScores(data), [data]);
  const summary = useMemo(() => generateExecutiveSummary(data), [data]);
  const insights = useMemo(() => generateBiomarkerInsights(data), [data]);

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
    s === 'green' ? 'hsl(var(--status-green))' : s === 'yellow' ? 'hsl(var(--status-yellow))' : 'hsl(var(--status-red))';

  return (
    <div className="space-y-6 print:space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Relatório Executivo de Saúde</h1>
          <p className="text-muted-foreground mt-1 print:text-black">Gerado em {new Date().toLocaleDateString('pt-BR')} • Health CFO</p>
        </div>
        <button
          onClick={handlePrint}
          className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors no-print"
        >
          <Printer className="w-4 h-4" />
          <span className="hidden sm:inline">Imprimir / PDF</span>
        </button>
      </div>

      {/* Scores */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:grid-cols-4">
        {[
          { label: 'Cardíaco', value: cardiac.value, status: cardiac.status },
          { label: 'Metabólico', value: metabolic.value, status: metabolic.status },
          { label: 'Longevidade', value: longevity.value, status: longevity.status },
          { label: 'Compliance', value: compliance, status: compliance >= 75 ? 'green' : compliance >= 50 ? 'yellow' : 'red' },
        ].map(s => (
          <div key={s.label} className="glass-card rounded-xl p-4 text-center print:border print:border-gray-200">
            <p className="text-2xl font-bold font-mono" style={{ color: statusColor(s.status) }}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Domains */}
      <div className="glass-card rounded-xl p-5 print:border print:border-gray-200">
        <h2 className="font-semibold mb-3">Domínios de Saúde</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {domains.map(d => (
            <div key={d.id} className="text-center p-2 rounded-lg bg-secondary/50">
              <p className="font-bold font-mono text-lg" style={{ color: statusColor(d.status) }}>{d.score}</p>
              <p className="text-xs text-muted-foreground">{d.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Strengths & Attention */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2">
        <div className="glass-card rounded-xl p-5 print:border print:border-gray-200">
          <h2 className="font-semibold mb-3 text-status-green">✅ Pontos Fortes</h2>
          <ul className="space-y-1.5 text-sm">
            {summary.strengths.map((s, i) => <li key={i} className="flex gap-2"><span className="text-status-green">•</span>{s}</li>)}
            {summary.strengths.length === 0 && <li className="text-muted-foreground">Nenhum identificado.</li>}
          </ul>
        </div>
        <div className="glass-card rounded-xl p-5 print:border print:border-gray-200">
          <h2 className="font-semibold mb-3 text-status-yellow">⚠️ Pontos de Atenção</h2>
          <ul className="space-y-1.5 text-sm">
            {summary.attentionPoints.map((s, i) => <li key={i} className="flex gap-2"><span className="text-status-yellow">•</span>{s}</li>)}
            {summary.attentionPoints.length === 0 && <li className="text-muted-foreground">Nenhum identificado.</li>}
          </ul>
        </div>
      </div>

      {/* Key Biomarkers */}
      <div className="glass-card rounded-xl p-5 print:border print:border-gray-200">
        <h2 className="font-semibold mb-3">Biomarcadores-Chave</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="pb-2 pr-4">Biomarcador</th>
                <th className="pb-2 pr-4">Valor</th>
                <th className="pb-2 pr-4">Faixa</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.biomarkers.filter(b => b.value !== null).slice(0, 16).map(b => (
                <tr key={b.id} className="border-b border-border/30">
                  <td className="py-1.5 pr-4 font-medium">{b.name}</td>
                  <td className="py-1.5 pr-4 font-mono">{b.value} {b.unit}</td>
                  <td className="py-1.5 pr-4 text-muted-foreground text-xs">
                    {b.targetMin ?? '—'} – {b.targetMax ?? '—'}
                  </td>
                  <td className="py-1.5">
                    <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: statusColor(b.status) }} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Risk Alerts */}
      {(redBiomarkers.length > 0 || overdue.length > 0) && (
        <div className="glass-card rounded-xl p-5 border-l-4 print:border print:border-gray-200" style={{ borderLeftColor: 'hsl(var(--status-red))' }}>
          <h2 className="font-semibold mb-3">🔴 Alertas de Risco</h2>
          <ul className="space-y-1 text-sm">
            {redBiomarkers.map(b => <li key={b.id}>• {b.name}: {b.value} {b.unit} — nível crítico</li>)}
            {overdue.map(e => <li key={e.id}>• {e.name} atrasado — rastreamento de {e.mainRisk.toLowerCase()}</li>)}
          </ul>
        </div>
      )}

      {/* Trend Highlights */}
      {trendHighlights.length > 0 && (
        <div className="glass-card rounded-xl p-5 print:border print:border-gray-200">
          <h2 className="font-semibold mb-3">📈 Destaques de Tendência</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {trendHighlights.map((t, i) => t && (
              <div key={i} className="flex items-center justify-between text-xs bg-secondary/50 rounded-lg px-3 py-2">
                <span className="truncate mr-2">{t.name}</span>
                <span className="font-mono shrink-0">
                  {t.prev} → {t.current} <span className={t.worsening ? 'text-status-red' : 'text-status-green'}>({t.pct}%)</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggested Appointments */}
      <div className="glass-card rounded-xl p-5 print:border print:border-gray-200">
        <h2 className="font-semibold mb-3">📋 Próximas Consultas Sugeridas</h2>
        <ul className="space-y-1.5 text-sm">
          {summary.suggestedAppointments.map((s, i) => <li key={i}>• {s}</li>)}
          {summary.suggestedAppointments.length === 0 && <li className="text-muted-foreground">Nenhuma sugerida.</li>}
        </ul>
      </div>

      {/* Doctor Questions */}
      <div className="glass-card rounded-xl p-5 print:border print:border-gray-200">
        <h2 className="font-semibold mb-3">❓ Perguntas para o Médico</h2>
        <ul className="space-y-1.5 text-sm">
          {insights.filter(i => i.biomarker.status !== 'green').slice(0, 6).map((ins, i) => (
            <li key={i}>• {ins.doctorQuestion}</li>
          ))}
        </ul>
      </div>

      <div className="glass-card rounded-xl p-4 text-xs text-muted-foreground text-center print:border print:border-gray-200">
        Este relatório é para organização e acompanhamento preventivo. Não substitui avaliação, diagnóstico ou orientação médica.
      </div>
    </div>
  );
};

export default RelatorioExecutivo;
