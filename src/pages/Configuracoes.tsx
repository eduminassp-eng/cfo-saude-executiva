import { useHealth } from '@/contexts/HealthContext';
import { Download, RotateCcw, FileJson, FileText, FileSpreadsheet, Upload, Settings2 } from 'lucide-react';
import { PageTransition } from '@/components/motion/PageTransition';
import { StaggerContainer, StaggerItem } from '@/components/motion/StaggerContainer';
import { useMemo, useCallback, useRef, useState } from 'react';
import { calcCardiacScore, calcMetabolicScore, calcLongevityScore, calcDomainScores } from '@/lib/scoring';
import { HealthData, Biomarker, Exam } from '@/types/health';
import { toast } from 'sonner';
import { z } from 'zod';

const biomarkerSchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().min(1).max(200),
  value: z.number().nullable(),
  unit: z.string().max(50),
  targetMin: z.number().nullable(),
  targetMax: z.number().nullable(),
  status: z.enum(['green', 'yellow', 'red', 'unknown']),
  lastDate: z.string().nullable(),
  note: z.string().max(500).default(''),
  category: z.string().max(100).default(''),
  history: z.array(z.object({
    value: z.number(),
    date: z.string(),
    note: z.string().max(500).default(''),
  })).default([]),
});

const examSchema = z.object({
  id: z.string().min(1).max(100),
  category: z.string().max(100).default(''),
  name: z.string().min(1).max(200),
  type: z.string().max(100).default(''),
  mainRisk: z.string().max(200).default(''),
  importance: z.enum(['Alta', 'Média', 'Baixa']),
  suggestedFrequency: z.string().max(100).default(''),
  lastDate: z.string().nullable(),
  nextDate: z.string().nullable(),
  status: z.enum(['Em dia', 'Próximo', 'Atrasado', 'Pendente']),
  doctor: z.string().max(200).default(''),
  resultSummary: z.string().max(1000).default(''),
  notes: z.string().max(1000).default(''),
});

const importSchema = z.object({
  biomarkers: z.array(biomarkerSchema).optional(),
  exams: z.array(examSchema).optional(),
  lifestyle: z.object({
    exerciseFrequency: z.number().min(0).max(7),
    sleepHours: z.number().min(0).max(24),
    smokingStatus: z.enum(['never', 'former', 'current']),
    alcoholWeekly: z.number().min(0).max(100),
  }).optional(),
  lastUpdated: z.string().optional(),
});

const Configuracoes = () => {
  const { data, updateData, resetData, exportJSON, exportCSV } = useHealth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  const scores = useMemo(() => ({
    cardiac: calcCardiacScore(data),
    metabolic: calcMetabolicScore(data),
    longevity: calcLongevityScore(data),
    domains: calcDomainScores(data),
  }), [data]);

  const compliance = useMemo(() => {
    const total = data.exams.length;
    if (total === 0) return 0;
    const upToDate = data.exams.filter(e => e.status === 'Em dia').length;
    const upcoming = data.exams.filter(e => e.status === 'Próximo').length;
    return Math.round(((upToDate + upcoming * 0.75) / total) * 100);
  }, [data.exams]);

  const exportFullJSON = useCallback(() => {
    const exportData = {
      ...data,
      scores: {
        cardiac: scores.cardiac.value,
        metabolic: scores.metabolic.value,
        longevity: scores.longevity.value,
        preventiveCompliance: compliance,
        domains: scores.domains.map(d => ({ id: d.id, label: d.label, score: d.score, status: d.status })),
      },
      exportDate: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `health-cfo-completo-${data.lastUpdated}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [data, scores, compliance]);

  const exportFullCSV = useCallback(() => {
    const lines: string[][] = [];
    lines.push(['=== SCORES ===', '', '', '', '']);
    lines.push(['Score', 'Valor', 'Status', '', '']);
    lines.push(['Cardíaco', String(scores.cardiac.value), scores.cardiac.status, '', '']);
    lines.push(['Metabólico', String(scores.metabolic.value), scores.metabolic.status, '', '']);
    lines.push(['Longevidade', String(scores.longevity.value), scores.longevity.status, '', '']);
    lines.push(['Compliance Preventivo', String(compliance), '', '', '']);
    lines.push(['', '', '', '', '']);
    lines.push(['=== BIOMARCADORES ===', '', '', '', '']);
    lines.push(['Nome', 'Valor', 'Unidade', 'Status', 'Última Data']);
    data.biomarkers.forEach(b => lines.push([b.name, String(b.value ?? ''), b.unit, b.status, b.lastDate ?? '']));
    lines.push(['', '', '', '', '']);
    lines.push(['=== EXAMES ===', '', '', '', '']);
    lines.push(['Nome', 'Categoria', 'Status', 'Importância', 'Próxima Data']);
    data.exams.forEach(e => lines.push([e.name, e.category, e.status, e.importance, e.nextDate ?? '']));
    const csv = lines.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `health-cfo-completo-${data.lastUpdated}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [data, scores, compliance]);

  const handleLifestyleChange = (field: string, value: string | number) => {
    updateData(prev => ({
      ...prev,
      lifestyle: { ...prev.lifestyle, [field]: value },
    }));
  };

  return (
    <PageTransition>
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-sm text-muted-foreground mt-1">Gerencie seus dados e hábitos</p>
      </div>

      {/* Lifestyle */}
      <div className="glass-card p-5">
        <h2 className="text-sm font-semibold mb-4">Estilo de Vida</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: 'Exercício (dias/semana)', field: 'exerciseFrequency', type: 'number', min: 0, max: 7, step: 1, value: data.lifestyle.exerciseFrequency },
            { label: 'Sono (horas/noite)', field: 'sleepHours', type: 'number', min: 0, max: 14, step: 0.5, value: data.lifestyle.sleepHours },
          ].map(item => (
            <div key={item.field}>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5 uppercase tracking-wider">{item.label}</label>
              <input
                type={item.type}
                min={item.min}
                max={item.max}
                step={item.step}
                value={item.value}
                onChange={e => handleLifestyleChange(item.field, item.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
                className="w-full bg-secondary/60 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>
          ))}
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5 uppercase tracking-wider">Tabagismo</label>
            <select
              value={data.lifestyle.smokingStatus}
              onChange={e => handleLifestyleChange('smokingStatus', e.target.value)}
              className="w-full bg-secondary/60 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            >
              <option value="never">Nunca fumou</option>
              <option value="former">Ex-fumante</option>
              <option value="current">Fumante</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5 uppercase tracking-wider">Álcool (doses/semana)</label>
            <input
              type="number" min="0" max="50"
              value={data.lifestyle.alcoholWeekly}
              onChange={e => handleLifestyleChange('alcoholWeekly', parseInt(e.target.value) || 0)}
              className="w-full bg-secondary/60 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Import */}
      <div className="glass-card p-5">
        <h2 className="text-sm font-semibold mb-2">Importar Dados</h2>
        <p className="text-xs text-muted-foreground mb-3">
          Importe um arquivo JSON exportado anteriormente. Os dados importados <strong>substituirão</strong> os dados atuais.
          O arquivo deve conter pelo menos <code className="bg-secondary/80 px-1 py-0.5 rounded text-[10px]">biomarkers</code> ou <code className="bg-secondary/80 px-1 py-0.5 rounded text-[10px]">exams</code>.
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            if (file.size > 5 * 1024 * 1024) {
              toast.error('Arquivo muito grande (máx. 5 MB)');
              return;
            }
            setImporting(true);
            try {
              const text = await file.text();
              const raw = JSON.parse(text);
              const parsed = importSchema.parse(raw);
              
              if (!parsed.biomarkers?.length && !parsed.exams?.length) {
                throw new Error('O arquivo deve conter pelo menos biomarcadores ou exames.');
              }

              if (!confirm(`Importar ${parsed.biomarkers?.length ?? 0} biomarcador(es) e ${parsed.exams?.length ?? 0} exame(s)? Os dados atuais serão substituídos.`)) {
                return;
              }

              updateData(prev => ({
                biomarkers: (parsed.biomarkers as Biomarker[]) ?? prev.biomarkers,
                exams: (parsed.exams as Exam[]) ?? prev.exams,
                lifestyle: parsed.lifestyle ? { ...prev.lifestyle, ...parsed.lifestyle } : prev.lifestyle,
                lastUpdated: parsed.lastUpdated ?? new Date().toISOString().split('T')[0],
              }));
              toast.success('Dados importados com sucesso!');
            } catch (err: any) {
              if (err instanceof z.ZodError) {
                const issues = err.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('\n');
                toast.error(`Formato inválido:\n${issues}`);
              } else if (err instanceof SyntaxError) {
                toast.error('Arquivo JSON inválido');
              } else {
                toast.error(err.message || 'Erro ao importar');
              }
            } finally {
              setImporting(false);
              if (fileInputRef.current) fileInputRef.current.value = '';
            }
          }}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={importing}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary/80 text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50"
        >
          <Upload className="w-4 h-4" />
          {importing ? 'Importando...' : 'Importar JSON'}
        </button>
      </div>

      {/* Export */}
      <div className="glass-card p-5">
        <h2 className="text-sm font-semibold mb-2">Exportar Dados</h2>
        <p className="text-xs text-muted-foreground mb-4">Exportação simples (biomarcadores) ou completa (com scores, exames e compliance).</p>
        <StaggerContainer className="flex flex-wrap gap-3">
          {[
            { onClick: exportJSON, icon: FileJson, label: 'JSON Básico', primary: false },
            { onClick: exportCSV, icon: FileText, label: 'CSV Básico', primary: false },
            { onClick: exportFullJSON, icon: FileJson, label: 'JSON Completo', primary: true },
            { onClick: exportFullCSV, icon: FileSpreadsheet, label: 'CSV Completo', primary: true },
          ].map(btn => (
            <StaggerItem key={btn.label}>
              <button
                onClick={btn.onClick}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  btn.primary
                    ? 'bg-primary text-primary-foreground hover:opacity-90'
                    : 'bg-secondary/80 hover:bg-accent'
                }`}
              >
                <btn.icon className="w-4 h-4" /> {btn.label}
              </button>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>

      {/* Reset */}
      <div className="glass-card p-5">
        <h2 className="text-sm font-semibold mb-2">Redefinir Dados</h2>
        <p className="text-xs text-muted-foreground mb-4">Restaura todos os dados para o exemplo inicial. Esta ação não pode ser desfeita.</p>
        <button onClick={() => { if (confirm('Tem certeza? Todos os dados serão substituídos pelo exemplo inicial.')) resetData(); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-destructive text-destructive-foreground text-sm font-medium hover:opacity-90 transition-opacity">
          <RotateCcw className="w-4 h-4" /> Redefinir para Dados Iniciais
        </button>
      </div>

      <div className="glass-card p-4 text-[10px] text-muted-foreground">
        <p><strong>HealthCFO Dashboard v1.0</strong></p>
        <p className="mt-1">Ferramenta de organização pessoal para acompanhamento preventivo de saúde. 
        Não constitui diagnóstico ou recomendação médica. Consulte sempre profissionais de saúde qualificados.</p>
      </div>
    </div>
    </PageTransition>
  );
};

export default Configuracoes;
