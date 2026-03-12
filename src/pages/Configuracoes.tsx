import { useHealth } from '@/contexts/HealthContext';
import { Download, RotateCcw, FileJson, FileText, FileSpreadsheet, Upload, Settings2, BookOpen, Dumbbell, Moon, Wine, Cigarette, ChevronRight, Shield } from 'lucide-react';
import { PageTransition } from '@/components/motion/PageTransition';
import { StaggerContainer, StaggerItem } from '@/components/motion/StaggerContainer';
import { useMemo, useCallback, useRef, useState } from 'react';
import { calcCardiacScore, calcMetabolicScore, calcLongevityScore, calcDomainScores } from '@/lib/scoring';
import { HealthData, Biomarker, Exam } from '@/types/health';
import { toast } from 'sonner';
import { z } from 'zod';
import { motion } from 'framer-motion';

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

  const smokingLabels: Record<string, string> = { never: 'Nunca fumou', former: 'Ex-fumante', current: 'Fumante' };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Arquivo muito grande (máx. 5 MB)'); return; }
    setImporting(true);
    try {
      const text = await file.text();
      const raw = JSON.parse(text);
      const parsed = importSchema.parse(raw);
      if (!parsed.biomarkers?.length && !parsed.exams?.length) throw new Error('O arquivo deve conter pelo menos biomarcadores ou exames.');
      if (!confirm(`Importar ${parsed.biomarkers?.length ?? 0} biomarcador(es) e ${parsed.exams?.length ?? 0} exame(s)? Os dados atuais serão substituídos.`)) return;
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
  };

  return (
    <PageTransition>
      <div className="space-y-8">
        {/* Hero Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-9 h-9 rounded-xl bg-primary/12 flex items-center justify-center">
              <Settings2 className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight">Configurações</h1>
          </div>
          <p className="text-sm text-muted-foreground font-medium mt-1">Gerencie seus dados, hábitos e preferências</p>
        </motion.div>

        {/* Lifestyle Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <SectionCard title="Estilo de Vida" subtitle="Hábitos que impactam seus scores de saúde" icon={Dumbbell}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FieldCard
                icon={Dumbbell}
                label="Exercício"
                sublabel="dias por semana"
                colorVar="--status-green"
              >
                <input
                  type="number" min="0" max="7" step="1"
                  value={data.lifestyle.exerciseFrequency}
                  onChange={e => handleLifestyleChange('exerciseFrequency', parseFloat(e.target.value) || 0)}
                  className="w-full bg-secondary/50 rounded-xl px-4 py-2.5 text-sm font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </FieldCard>
              <FieldCard
                icon={Moon}
                label="Sono"
                sublabel="horas por noite"
                colorVar="--liquid-blue"
              >
                <input
                  type="number" min="0" max="14" step="0.5"
                  value={data.lifestyle.sleepHours}
                  onChange={e => handleLifestyleChange('sleepHours', parseFloat(e.target.value) || 0)}
                  className="w-full bg-secondary/50 rounded-xl px-4 py-2.5 text-sm font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </FieldCard>
              <FieldCard
                icon={Cigarette}
                label="Tabagismo"
                sublabel={smokingLabels[data.lifestyle.smokingStatus]}
                colorVar="--status-yellow"
              >
                <select
                  value={data.lifestyle.smokingStatus}
                  onChange={e => handleLifestyleChange('smokingStatus', e.target.value)}
                  className="w-full bg-secondary/50 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                >
                  <option value="never">Nunca fumou</option>
                  <option value="former">Ex-fumante</option>
                  <option value="current">Fumante</option>
                </select>
              </FieldCard>
              <FieldCard
                icon={Wine}
                label="Álcool"
                sublabel="doses por semana"
                colorVar="--liquid-violet"
              >
                <input
                  type="number" min="0" max="50"
                  value={data.lifestyle.alcoholWeekly}
                  onChange={e => handleLifestyleChange('alcoholWeekly', parseInt(e.target.value) || 0)}
                  className="w-full bg-secondary/50 rounded-xl px-4 py-2.5 text-sm font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </FieldCard>
            </div>
          </SectionCard>
        </motion.div>

        {/* Data Management */}
        <StaggerContainer className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Import */}
          <StaggerItem>
            <SectionCard title="Importar Dados" subtitle="Carregue um arquivo JSON exportado anteriormente" icon={Upload}>
              <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                Os dados importados <strong className="text-foreground/80">substituirão</strong> os dados atuais. O arquivo deve conter <code className="bg-secondary/80 px-1.5 py-0.5 rounded-md text-[10px] font-mono">biomarkers</code> ou <code className="bg-secondary/80 px-1.5 py-0.5 rounded-md text-[10px] font-mono">exams</code>.
              </p>
              <input ref={fileInputRef} type="file" accept=".json,application/json" className="hidden" onChange={handleImport} />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
                className="flex items-center gap-2.5 px-5 py-3 rounded-xl bg-secondary/80 text-sm font-semibold hover:bg-accent transition-all disabled:opacity-50 w-full justify-center btn-press"
              >
                <Upload className="w-4 h-4" />
                {importing ? 'Importando...' : 'Selecionar Arquivo JSON'}
              </button>
            </SectionCard>
          </StaggerItem>

          {/* Export */}
          <StaggerItem>
            <SectionCard title="Exportar Dados" subtitle="Baixe seus dados em diferentes formatos" icon={Download}>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { onClick: exportJSON, icon: FileJson, label: 'JSON Básico', primary: false },
                  { onClick: exportCSV, icon: FileText, label: 'CSV Básico', primary: false },
                  { onClick: exportFullJSON, icon: FileJson, label: 'JSON Completo', primary: true },
                  { onClick: exportFullCSV, icon: FileSpreadsheet, label: 'CSV Completo', primary: true },
                ].map(btn => (
                  <button
                    key={btn.label}
                    onClick={btn.onClick}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-semibold transition-all btn-press ${
                      btn.primary
                        ? 'bg-primary text-primary-foreground hover:opacity-90'
                        : 'bg-secondary/80 hover:bg-accent text-foreground'
                    }`}
                  >
                    <btn.icon className="w-4 h-4 shrink-0" />
                    {btn.label}
                  </button>
                ))}
              </div>
            </SectionCard>
          </StaggerItem>
        </StaggerContainer>

        {/* Actions */}
        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StaggerItem>
            <ActionCard
              icon={BookOpen}
              title="Tour do App"
              description="Reveja o tour de apresentação do HealthCFO"
              buttonLabel="Rever Tour Guiado"
              colorVar="--primary"
              onClick={() => { localStorage.removeItem('health-cfo-onboarding-done'); window.location.reload(); }}
            />
          </StaggerItem>
          <StaggerItem>
            <ActionCard
              icon={RotateCcw}
              title="Redefinir Dados"
              description="Restaura todos os dados para o exemplo inicial"
              buttonLabel="Redefinir Dados"
              colorVar="--destructive"
              destructive
              onClick={() => { if (confirm('Tem certeza? Todos os dados serão substituídos pelo exemplo inicial.')) resetData(); }}
            />
          </StaggerItem>
        </StaggerContainer>

        {/* Footer */}
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-2.5 mb-2">
            <Shield className="w-4 h-4 text-muted-foreground opacity-60" />
            <p className="text-xs font-bold text-foreground/70">HealthCFO Dashboard v1.0</p>
          </div>
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Ferramenta de organização pessoal para acompanhamento preventivo de saúde.
            Não constitui diagnóstico ou recomendação médica. Consulte sempre profissionais de saúde qualificados.
          </p>
        </div>
      </div>
    </PageTransition>
  );
};

export default Configuracoes;

/* ── Reusable Sub-Components ── */

function SectionCard({ title, subtitle, icon: Icon, children }: {
  title: string;
  subtitle: string;
  icon: typeof Settings2;
  children: React.ReactNode;
}) {
  return (
    <div className="glass-card rounded-2xl p-5 lg:p-6 h-full">
      <div className="flex items-center gap-2.5 mb-1">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-3.5 h-3.5 text-primary" />
        </div>
        <h2 className="text-sm font-bold">{title}</h2>
      </div>
      <p className="text-xs text-muted-foreground mb-4 ml-[38px]">{subtitle}</p>
      {children}
    </div>
  );
}

function FieldCard({ icon: Icon, label, sublabel, colorVar, children }: {
  icon: typeof Dumbbell;
  label: string;
  sublabel: string;
  colorVar: string;
  children: React.ReactNode;
}) {
  const color = `hsl(var(${colorVar}))`;
  return (
    <div className="rounded-xl bg-secondary/30 p-4 space-y-2.5">
      <div className="flex items-center gap-2.5">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color.replace(')', ' / 0.12)')}` }}
        >
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <div>
          <p className="text-xs font-bold">{label}</p>
          <p className="text-[10px] text-muted-foreground">{sublabel}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function ActionCard({ icon: Icon, title, description, buttonLabel, colorVar, destructive, onClick }: {
  icon: typeof BookOpen;
  title: string;
  description: string;
  buttonLabel: string;
  colorVar: string;
  destructive?: boolean;
  onClick: () => void;
}) {
  const color = `hsl(var(${colorVar}))`;
  return (
    <div className="glass-card rounded-2xl p-5 lg:p-6 flex flex-col h-full">
      <div className="flex items-center gap-2.5 mb-1">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color.replace(')', ' / 0.1)')}` }}
        >
          <Icon className="w-3.5 h-3.5" style={{ color }} />
        </div>
        <h2 className="text-sm font-bold">{title}</h2>
      </div>
      <p className="text-xs text-muted-foreground mb-4 ml-[38px] leading-relaxed flex-1">{description}</p>
      <button
        onClick={onClick}
        className={`flex items-center justify-center gap-2.5 w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all btn-press ${
          destructive
            ? 'bg-destructive text-destructive-foreground hover:opacity-90'
            : 'bg-primary text-primary-foreground hover:opacity-90'
        }`}
      >
        <Icon className="w-4 h-4" />
        {buttonLabel}
      </button>
    </div>
  );
}