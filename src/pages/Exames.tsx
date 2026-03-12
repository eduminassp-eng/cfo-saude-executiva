import { useHealth } from '@/contexts/HealthContext';
import { ListPageSkeleton } from '@/components/skeletons/DashboardSkeleton';
import { ErrorState } from '@/components/ErrorState';
import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Search, Plus, ClipboardCheck, AlertTriangle, Clock, CalendarClock, ChevronRight, Stethoscope, ShieldAlert, CalendarDays, FileText } from 'lucide-react';
import { PageTransition } from '@/components/motion/PageTransition';
import { StaggerContainer, StaggerItem } from '@/components/motion/StaggerContainer';
import { Exam } from '@/types/health';
import { ExamEditDialog } from '@/components/ExamEditDialog';
import { ExamCreateDialog } from '@/components/ExamCreateDialog';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

const statusConfig: Record<string, { colorVar: string; label: string; icon: typeof ClipboardCheck }> = {
  'Em dia': { colorVar: '--status-green', label: 'Em dia', icon: ClipboardCheck },
  'Próximo': { colorVar: '--status-yellow', label: 'Próximo', icon: Clock },
  'Atrasado': { colorVar: '--status-red', label: 'Atrasado', icon: AlertTriangle },
  'Pendente': { colorVar: '--muted-foreground', label: 'Pendente', icon: CalendarClock },
};

const importanceConfig: Record<string, { colorVar: string }> = {
  'Alta': { colorVar: '--status-red' },
  'Média': { colorVar: '--status-yellow' },
  'Baixa': { colorVar: '--status-green' },
};

const Exames = () => {
  const { data, loading, error, retry } = useHealth();
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { toast } = useToast();
  const toastFired = useRef(false);

  const categories = [...new Set(data.exams.map(e => e.category))].sort();
  const statuses = ['Em dia', 'Próximo', 'Atrasado', 'Pendente'];

  const filtered = useMemo(() => {
    let result = data.exams.filter(e => {
      if (categoryFilter && e.category !== categoryFilter) return false;
      if (statusFilter && e.status !== statusFilter) return false;
      if (search && !e.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });

    // Sort: Atrasado first, then Próximo, Em dia, Pendente
    const order: Record<string, number> = { Atrasado: 0, Próximo: 1, 'Em dia': 2, Pendente: 3 };
    result = [...result].sort((a, b) => (order[a.status] ?? 4) - (order[b.status] ?? 4));
    return result;
  }, [data.exams, categoryFilter, statusFilter, search]);

  const stats = useMemo(() => ({
    total: data.exams.length,
    emDia: data.exams.filter(e => e.status === 'Em dia').length,
    proximo: data.exams.filter(e => e.status === 'Próximo').length,
    atrasado: data.exams.filter(e => e.status === 'Atrasado').length,
  }), [data.exams]);

  useEffect(() => {
    if (toastFired.current) return;
    toastFired.current = true;
    const overdue = data.exams.filter(e => e.status === 'Atrasado');
    const upcoming = data.exams.filter(e => e.status === 'Próximo');
    if (overdue.length > 0) {
      toast({ variant: 'destructive', title: `${overdue.length} exame(s) atrasado(s)`, description: overdue.map(e => e.name).join(', ') });
    }
    if (upcoming.length > 0) {
      setTimeout(() => {
        toast({ title: `${upcoming.length} exame(s) próximo(s)`, description: upcoming.map(e => e.name).join(', ') });
      }, overdue.length > 0 ? 1500 : 0);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleExpand = useCallback((id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  }, []);

  if (loading) return <ListPageSkeleton cards={6} />;
  if (error) return <ErrorState type={error === 'network' ? 'network' : 'error'} onRetry={retry} />;

  const completionRate = stats.total > 0 ? Math.round((stats.emDia / stats.total) * 100) : 0;

  return (
    <PageTransition>
      <div className="space-y-8">
        {/* Hero Header */}
        <div className="flex items-start justify-between gap-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight">Exames e Avaliações</h1>
            <p className="text-sm text-muted-foreground mt-1 font-medium">Acompanhamento preventivo completo</p>
          </motion.div>
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all no-print btn-press"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Novo Exame</span>
          </motion.button>
        </div>

        {/* Hero Stats Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="glass-card rounded-2xl p-6 lg:p-8"
        >
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Completion Ring */}
            <div className="relative w-28 h-28 lg:w-36 lg:h-36 shrink-0">
              <div
                className="absolute inset-0 rounded-full blur-3xl opacity-15"
                style={{ background: `hsl(var(--status-green))` }}
              />
              <svg className="w-full h-full -rotate-90 relative z-10" viewBox="0 0 120 120">
                <defs>
                  <linearGradient id="exam-ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="hsl(var(--liquid-violet))" />
                    <stop offset="50%" stopColor="hsl(var(--primary))" />
                    <stop offset="100%" stopColor="hsl(var(--liquid-blue))" />
                  </linearGradient>
                </defs>
                <circle cx="60" cy="60" r="50" fill="none" stroke="hsl(var(--border))" strokeWidth="10" strokeLinecap="round" opacity={0.4} />
                <motion.circle
                  cx="60" cy="60" r="50" fill="none"
                  stroke="url(#exam-ring-grad)"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 50}
                  initial={{ strokeDashoffset: 2 * Math.PI * 50 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 50 * (1 - completionRate / 100) }}
                  transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
                  style={{ filter: 'drop-shadow(0 0 10px hsl(var(--primary) / 0.3))' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                <motion.span
                  className="display-number text-4xl lg:text-5xl"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                >
                  {completionRate}%
                </motion.span>
                <span className="text-xs text-muted-foreground font-medium">em dia</span>
              </div>
            </div>

            {/* Summary */}
            <div className="flex-1 text-center sm:text-left space-y-3">
              <div>
                <h2 className="text-lg font-bold tracking-tight">Cobertura Preventiva</h2>
                <p className="text-sm text-muted-foreground leading-relaxed mt-1">
                  {completionRate >= 80 ? 'Excelente adesão! Seus exames preventivos estão em dia.' :
                   completionRate >= 50 ? 'Boa cobertura, mas alguns exames precisam de atualização.' :
                   'Atenção: vários exames estão pendentes ou atrasados.'}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                {stats.atrasado > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: 'hsl(var(--status-red) / 0.1)', color: 'hsl(var(--status-red))' }}>
                    <AlertTriangle className="w-3 h-3" />
                    {stats.atrasado} atrasado{stats.atrasado > 1 ? 's' : ''}
                  </span>
                )}
                {stats.proximo > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: 'hsl(var(--status-yellow) / 0.1)', color: 'hsl(var(--status-yellow))' }}>
                    <Clock className="w-3 h-3" />
                    {stats.proximo} próximo{stats.proximo > 1 ? 's' : ''}
                  </span>
                )}
                {stats.emDia > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: 'hsl(var(--status-green) / 0.1)', color: 'hsl(var(--status-green))' }}>
                    <ClipboardCheck className="w-3 h-3" />
                    {stats.emDia} em dia
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Filters — pill style */}
        <div className="flex flex-wrap gap-2 no-print">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar exame..."
              className="w-full bg-secondary/80 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setStatusFilter('')}
              className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                !statusFilter ? 'bg-primary/15 text-primary ring-1 ring-primary/30' : 'bg-secondary/80 text-muted-foreground hover:text-foreground'
              }`}
            >
              Todos ({stats.total})
            </button>
            {statuses.map(s => {
              const config = statusConfig[s];
              const count = data.exams.filter(e => e.status === s).length;
              if (count === 0) return null;
              return (
                <button
                  key={s}
                  onClick={() => setStatusFilter(statusFilter === s ? '' : s)}
                  className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                    statusFilter === s ? 'ring-1' : 'bg-secondary/80 text-muted-foreground hover:text-foreground'
                  }`}
                  style={statusFilter === s ? {
                    backgroundColor: `hsl(${config.colorVar} / 0.12)`,
                    color: `hsl(${config.colorVar})`,
                    borderColor: `hsl(${config.colorVar} / 0.3)`,
                  } : undefined}
                >
                  {config.label} ({count})
                </button>
              );
            })}
          </div>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="bg-secondary/80 rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="">Todas categorias</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Exam Cards */}
        <StaggerContainer className="space-y-3">
          {filtered.map((exam) => (
            <StaggerItem key={exam.id}>
              <ExamRow
                exam={exam}
                isExpanded={expandedId === exam.id}
                onToggle={() => toggleExpand(exam.id)}
                onEdit={() => setEditingExam(exam)}
              />
            </StaggerItem>
          ))}
        </StaggerContainer>

        {filtered.length === 0 && (
          <div className="glass-card rounded-2xl p-12 text-center">
            <CalendarClock className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-sm font-medium">Nenhum exame encontrado</p>
            <p className="text-xs text-muted-foreground mt-1">Tente ajustar os filtros</p>
          </div>
        )}

        {/* Footer */}
        <p className="text-xs text-muted-foreground">{filtered.length} exame(s) encontrado(s)</p>

        {editingExam && <ExamEditDialog exam={editingExam} onClose={() => setEditingExam(null)} />}
        {showCreate && <ExamCreateDialog onClose={() => setShowCreate(false)} />}
      </div>
    </PageTransition>
  );
};

export default Exames;

/* ── Exam Row Card ── */

function ExamRow({ exam, isExpanded, onToggle, onEdit }: {
  exam: Exam;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
}) {
  const config = statusConfig[exam.status] || statusConfig['Pendente'];
  const impConfig = importanceConfig[exam.importance] || importanceConfig['Baixa'];
  const StatusIcon = config.icon;
  const statusColor = `hsl(var(${config.colorVar}))`;

  const glowStyle = exam.status === 'Atrasado' ? {
    borderColor: `hsl(var(--status-red) / 0.25)`,
    boxShadow: `0 0 24px -6px hsl(var(--status-red) / 0.12)`,
  } : exam.status === 'Próximo' ? {
    borderColor: `hsl(var(--status-yellow) / 0.2)`,
    boxShadow: `0 0 20px -6px hsl(var(--status-yellow) / 0.1)`,
  } : {};

  return (
    <motion.div
      layout
      className={`glass-card rounded-xl overflow-hidden transition-all ${isExpanded ? 'ring-1 ring-primary/30' : ''}`}
      style={glowStyle}
    >
      {/* Main row */}
      <button
        onClick={onToggle}
        className="w-full text-left p-4 lg:p-5 flex items-center gap-4 hover:bg-accent/30 transition-colors"
      >
        {/* Status icon */}
        <div
          className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${statusColor.replace(')', ' / 0.12)')}` }}
        >
          <StatusIcon className="w-5 h-5" style={{ color: statusColor }} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm truncate">{exam.name}</span>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 uppercase tracking-wider"
              style={{
                backgroundColor: `${statusColor.replace(')', ' / 0.12)')}`,
                color: statusColor,
              }}
            >
              {config.label}
            </span>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 hidden sm:inline"
              style={{
                backgroundColor: `hsl(var(${impConfig.colorVar}) / 0.1)`,
                color: `hsl(var(${impConfig.colorVar}))`,
              }}
            >
              {exam.importance}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            <span>{exam.category}</span>
            <span className="opacity-40">•</span>
            <span className="font-mono">
              {exam.lastDate ? new Date(exam.lastDate).toLocaleDateString('pt-BR') : 'Sem registro'}
            </span>
            {exam.nextDate && (
              <>
                <span className="opacity-40">→</span>
                <span className="font-mono">{new Date(exam.nextDate).toLocaleDateString('pt-BR')}</span>
              </>
            )}
          </div>
        </div>

        {/* Chevron */}
        <motion.div
          animate={{ rotate: isExpanded ? 90 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0"
        >
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </motion.div>
      </button>

      {/* Expanded detail */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 lg:px-5 pb-5 pt-1 border-t border-border/40">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                <DetailItem icon={Stethoscope} label="Médico" value={exam.doctor || 'Não informado'} />
                <DetailItem icon={ShieldAlert} label="Perigo Principal" value={exam.mainRisk || '—'} />
                <DetailItem icon={CalendarDays} label="Frequência" value={exam.suggestedFrequency} />
                <DetailItem icon={FileText} label="Tipo" value={exam.type} />
                {exam.resultSummary && (
                  <div className="sm:col-span-2">
                    <DetailItem icon={ClipboardCheck} label="Resultado" value={exam.resultSummary} />
                  </div>
                )}
              </div>
              {exam.notes && (
                <div className="mt-3 p-3 rounded-xl bg-secondary/50 text-xs text-muted-foreground leading-relaxed">
                  <span className="font-semibold text-foreground/70">Observações:</span> {exam.notes}
                </div>
              )}
              <div className="mt-4 flex justify-end">
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(); }}
                  className="px-4 py-2 rounded-xl bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
                >
                  Editar Exame
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function DetailItem({ icon: Icon, label, value }: { icon: typeof Stethoscope; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="shrink-0 w-7 h-7 rounded-lg bg-secondary/80 flex items-center justify-center mt-0.5">
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</p>
        <p className="text-sm font-medium mt-0.5 leading-snug">{value}</p>
      </div>
    </div>
  );
}