import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useHealth } from '@/contexts/HealthContext';
import { ListPageSkeleton } from '@/components/skeletons/DashboardSkeleton';
import { Biomarker, BiomarkerHistoryEntry, Status } from '@/types/health';
import { BiomarkerEditDialog } from '@/components/BiomarkerEditDialog';
import { ErrorState } from '@/components/ErrorState';
import { TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp, Pencil, Trash2, X, Activity, AlertTriangle, CheckCircle2, CircleDot } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, ReferenceLine, YAxis, XAxis, Tooltip } from 'recharts';
import { PageTransition } from '@/components/motion/PageTransition';
import { StaggerContainer, StaggerItem } from '@/components/motion/StaggerContainer';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendPanel } from '@/components/TrendPanel';

const categories = ['Todos', 'Cardiovascular', 'Metabolismo', 'Fígado', 'Rins', 'Hormonal', 'Composição Corporal', 'Urologia'];

const markersWhereUpIsGood = new Set(['hdl', 'vitd', 'vitb12', 'ferritina', 'testosterona']);

function getTrend(b: Biomarker): 'up' | 'down' | 'stable' {
  if (!b.value || !b.history || b.history.length === 0) return 'stable';
  const prev = b.history[0].value;
  const diff = b.value - prev;
  if (Math.abs(diff) < prev * 0.02) return 'stable';
  return diff > 0 ? 'up' : 'down';
}

function TrendIcon({ trend, isGoodUp }: { trend: 'up' | 'down' | 'stable'; isGoodUp: boolean }) {
  if (trend === 'stable') return <Minus className="w-4 h-4 text-muted-foreground" />;
  const isGood = (trend === 'up' && isGoodUp) || (trend === 'down' && !isGoodUp);
  const colorVar = isGood ? 'var(--status-green)' : 'var(--status-red)';
  return trend === 'up'
    ? <TrendingUp className="w-4 h-4" style={{ color: `hsl(${colorVar})` }} />
    : <TrendingDown className="w-4 h-4" style={{ color: `hsl(${colorVar})` }} />;
}

function getStatusConfig(status: Status) {
  const map = {
    green: { label: 'Normal', colorVar: 'var(--status-green)', icon: CheckCircle2 },
    yellow: { label: 'Atenção', colorVar: 'var(--status-yellow)', icon: AlertTriangle },
    red: { label: 'Ação', colorVar: 'var(--status-red)', icon: AlertTriangle },
    unknown: { label: '—', colorVar: 'var(--muted-foreground)', icon: CircleDot },
  };
  return map[status];
}

// --- Hero Stats Component ---
function HeroStats({ stats }: { stats: { green: number; yellow: number; red: number; total: number } }) {
  const items = [
    { value: stats.total, label: 'Total', colorVar: 'var(--primary)', icon: Activity },
    { value: stats.green, label: 'Normal', colorVar: 'var(--status-green)', icon: CheckCircle2 },
    { value: stats.yellow, label: 'Atenção', colorVar: 'var(--status-yellow)', icon: AlertTriangle },
    { value: stats.red, label: 'Ação', colorVar: 'var(--status-red)', icon: AlertTriangle },
  ];

  return (
    <StaggerContainer className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {items.map(s => {
        const Icon = s.icon;
        return (
          <StaggerItem key={s.label}>
            <div className="glass-card p-5 text-center relative overflow-hidden group">
              <div
                className="absolute inset-0 opacity-[0.04] transition-opacity group-hover:opacity-[0.08]"
                style={{ background: `radial-gradient(circle at 50% 0%, hsl(${s.colorVar}), transparent 70%)` }}
              />
              <div className="relative z-10">
                <Icon className="w-5 h-5 mx-auto mb-2" style={{ color: `hsl(${s.colorVar})` }} />
                <p className="display-number text-3xl" style={{ color: `hsl(${s.colorVar})` }}>{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1.5 font-medium">{s.label}</p>
              </div>
            </div>
          </StaggerItem>
        );
      })}
    </StaggerContainer>
  );
}

// --- Biomarker Row Component ---
function BiomarkerRow({
  b, index, isExpanded, onToggle, onEdit, onDeleteHistory, onEditHistory,
}: {
  b: Biomarker; index: number; isExpanded: boolean;
  onToggle: () => void; onEdit: () => void;
  onDeleteHistory: (idx: number) => void;
  onEditHistory: (idx: number, entry: BiomarkerHistoryEntry) => void;
}) {
  const trend = getTrend(b);
  const isGoodUp = markersWhereUpIsGood.has(b.id);
  const config = getStatusConfig(b.status);
  const statusColor = `hsl(${config.colorVar})`;

  const chartData = [
    ...(b.history ?? []).slice().reverse().map(h => ({ date: h.date, value: h.value })),
    ...(b.value !== null && b.lastDate ? [{ date: b.lastDate, value: b.value }] : []),
  ];

  const glowStyle = b.status !== 'unknown' ? {
    borderColor: `hsl(${config.colorVar} / 0.2)`,
    boxShadow: `0 0 20px -6px hsl(${config.colorVar} / 0.12)`,
  } : {};

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="glass-card overflow-hidden border"
      style={glowStyle}
    >
      <button
        onClick={onToggle}
        className="w-full p-4 sm:p-5 flex items-center gap-4 text-left hover:bg-accent/20 transition-colors"
      >
        {/* Status indicator */}
        <div
          className="w-3 h-3 rounded-full shrink-0 ring-4"
          style={{
            backgroundColor: statusColor,
            ringColor: `hsl(${config.colorVar} / 0.15)`,
            boxShadow: `0 0 8px hsl(${config.colorVar} / 0.3)`,
          }}
        />

        {/* Name + category */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{b.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{b.category}</p>
        </div>

        {/* Value + trend */}
        <div className="text-right shrink-0 flex items-center gap-3">
          <div>
            <div className="flex items-center gap-1.5 justify-end">
              <span className="display-number text-xl">{b.value ?? '—'}</span>
              <span className="text-xs text-muted-foreground font-medium">{b.unit}</span>
            </div>
            {b.lastDate && (
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {new Date(b.lastDate).toLocaleDateString('pt-BR')}
              </p>
            )}
          </div>
          <TrendIcon trend={trend} isGoodUp={isGoodUp} />
        </div>

        {/* Badge */}
        <span
          className="px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0"
          style={{
            color: statusColor,
            backgroundColor: `hsl(${config.colorVar} / 0.12)`,
          }}
        >
          {config.label}
        </span>

        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-0 border-t border-border/50 space-y-5">
              {/* Info + Edit */}
              <div className="flex items-center justify-between pt-4">
                <div className="text-xs text-muted-foreground font-medium">
                  Referência: {b.targetMin !== null ? b.targetMin : ''}{b.targetMin !== null && b.targetMax !== null ? '–' : ''}{b.targetMax !== null ? (b.targetMin === null ? `< ${b.targetMax}` : b.targetMax) : (b.targetMin !== null ? `> ${b.targetMin}` : '—')} {b.unit}
                </div>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={(e) => { e.stopPropagation(); onEdit(); }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Editar
                </motion.button>
              </div>

              {b.note && (
                <p className="text-xs text-muted-foreground italic bg-secondary/50 rounded-lg px-3 py-2">{b.note}</p>
              )}

              {/* Chart */}
              {chartData.length >= 2 && (
                <div className="h-36 w-full bg-secondary/30 rounded-xl p-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                        tickFormatter={d => new Date(d).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })}
                        axisLine={false} tickLine={false}
                      />
                      <YAxis
                        domain={['auto', 'auto']}
                        tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                        axisLine={false} tickLine={false} width={45}
                      />
                      <Tooltip
                        contentStyle={{
                          background: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '12px',
                          fontSize: '12px',
                          padding: '8px 12px',
                          color: 'hsl(var(--foreground))',
                          boxShadow: '0 8px 24px hsl(var(--background) / 0.5)',
                        }}
                        labelFormatter={d => new Date(d).toLocaleDateString('pt-BR')}
                        formatter={(val: number) => [`${val} ${b.unit}`, b.name]}
                      />
                      {b.targetMax !== null && (
                        <ReferenceLine y={b.targetMax} stroke="hsl(var(--status-yellow))" strokeDasharray="4 4" strokeOpacity={0.5} />
                      )}
                      {b.targetMin !== null && (
                        <ReferenceLine y={b.targetMin} stroke="hsl(var(--status-yellow))" strokeDasharray="4 4" strokeOpacity={0.5} />
                      )}
                      <Line
                        type="monotone" dataKey="value"
                        stroke={statusColor} strokeWidth={2.5}
                        dot={{ r: 3.5, fill: statusColor, strokeWidth: 0 }}
                        activeDot={{ r: 5, fill: statusColor, stroke: 'hsl(var(--card))', strokeWidth: 2 }}
                        isAnimationActive animationDuration={800} animationEasing="ease-out"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* History */}
              {b.history && b.history.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2.5 uppercase tracking-wider">Histórico</p>
                  <div className="space-y-1.5">
                    {b.history.map((h, i) => (
                      <div key={i} className="flex items-center justify-between text-xs py-2 px-3 rounded-lg bg-secondary/40 group hover:bg-secondary/70 transition-colors">
                        <span className="text-muted-foreground font-medium">{new Date(h.date).toLocaleDateString('pt-BR')}</span>
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono font-semibold">{h.value} {b.unit}</span>
                          {h.note && <span className="text-muted-foreground italic max-w-[120px] truncate">{h.note}</span>}
                          <button
                            onClick={(e) => { e.stopPropagation(); onEditHistory(i, { ...h }); }}
                            className="p-1 rounded-md hover:bg-accent opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Pencil className="w-3 h-3 text-muted-foreground" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); onDeleteHistory(i); }}
                            className="p-1 rounded-md hover:bg-destructive/20 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-3 h-3 text-destructive" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// --- Main Page ---
const Biomarcadores = () => {
  const { data, loading, error, retry, updateData } = useHealth();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'tendencias' ? 'tendencias' : 'indicadores';
  const [activeTab, setActiveTab] = useState<'indicadores' | 'tendencias'>(initialTab);
  const [categoryFilter, setCategoryFilter] = useState('Todos');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingBiomarker, setEditingBiomarker] = useState<Biomarker | null>(null);
  const [editingHistory, setEditingHistory] = useState<{ biomarkerId: string; index: number; entry: BiomarkerHistoryEntry } | null>(null);

  const handleDeleteHistory = (biomarkerId: string, index: number) => {
    updateData(prev => ({
      ...prev,
      biomarkers: prev.biomarkers.map(b =>
        b.id === biomarkerId
          ? { ...b, history: b.history.filter((_, i) => i !== index) }
          : b
      ),
    }));
  };

  const handleSaveHistory = (biomarkerId: string, index: number, entry: BiomarkerHistoryEntry) => {
    updateData(prev => ({
      ...prev,
      biomarkers: prev.biomarkers.map(b =>
        b.id === biomarkerId
          ? { ...b, history: b.history.map((h, i) => i === index ? entry : h) }
          : b
      ),
    }));
    setEditingHistory(null);
  };

  const filtered = useMemo(() => {
    if (categoryFilter === 'Todos') return data.biomarkers;
    return data.biomarkers.filter(b => b.category === categoryFilter);
  }, [data.biomarkers, categoryFilter]);

  const stats = useMemo(() => {
    const green = data.biomarkers.filter(b => b.status === 'green').length;
    const yellow = data.biomarkers.filter(b => b.status === 'yellow').length;
    const red = data.biomarkers.filter(b => b.status === 'red').length;
    return { green, yellow, red, total: data.biomarkers.length };
  }, [data.biomarkers]);

  if (loading) return <ListPageSkeleton cards={8} />;
  if (error) return <ErrorState type={error === 'network' ? 'network' : 'error'} onRetry={retry} />;

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight">Biomarcadores</h1>
          <p className="text-muted-foreground mt-1 text-sm">Indicadores de saúde e tendências de risco</p>
        </motion.div>

        {/* Tab switcher — pill style */}
        <div className="inline-flex bg-secondary/60 rounded-xl p-1 gap-1">
          {([
            { key: 'indicadores' as const, label: 'Indicadores' },
            { key: 'tendencias' as const, label: 'Tendências' },
          ]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeTab === tab.key
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'tendencias' ? (
          <TrendPanel data={data} />
        ) : (
          <>
            {/* Hero Stats */}
            <HeroStats stats={stats} />

            {/* Category filter — horizontal scroll on mobile */}
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
              {categories.map(cat => (
                <motion.button
                  key={cat}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                    categoryFilter === cat
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'bg-secondary/60 text-secondary-foreground hover:bg-accent'
                  }`}
                >
                  {cat}
                </motion.button>
              ))}
            </div>

            {/* Biomarker list */}
            <div className="space-y-3">
              {filtered.map((b, i) => (
                <BiomarkerRow
                  key={b.id}
                  b={b}
                  index={i}
                  isExpanded={expandedId === b.id}
                  onToggle={() => setExpandedId(expandedId === b.id ? null : b.id)}
                  onEdit={() => setEditingBiomarker(b)}
                  onDeleteHistory={(idx) => handleDeleteHistory(b.id, idx)}
                  onEditHistory={(idx, entry) => setEditingHistory({ biomarkerId: b.id, index: idx, entry })}
                />
              ))}
            </div>

            {editingBiomarker && (
              <BiomarkerEditDialog
                biomarker={editingBiomarker}
                onClose={() => setEditingBiomarker(null)}
              />
            )}

            {editingHistory && (
              <HistoryEditDialog
                entry={editingHistory.entry}
                unit={data.biomarkers.find(b => b.id === editingHistory.biomarkerId)?.unit ?? ''}
                onSave={(entry) => handleSaveHistory(editingHistory.biomarkerId, editingHistory.index, entry)}
                onClose={() => setEditingHistory(null)}
              />
            )}
          </>
        )}
      </div>
    </PageTransition>
  );
};

// --- History Edit Dialog ---
function HistoryEditDialog({ entry, unit, onSave, onClose }: {
  entry: BiomarkerHistoryEntry;
  unit: string;
  onSave: (entry: BiomarkerHistoryEntry) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState(entry.value.toString());
  const [date, setDate] = useState(entry.date);
  const [note, setNote] = useState(entry.note);

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        className="glass-card rounded-2xl p-6 w-full max-w-sm border"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-bold">Editar Registro Histórico</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Valor ({unit})</label>
            <input type="number" step="any" value={value} onChange={e => setValue(e.target.value)}
              className="w-full bg-secondary rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary transition-shadow" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Data</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full bg-secondary rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-shadow" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Observação</label>
            <input type="text" value={note} onChange={e => setNote(e.target.value)} maxLength={200}
              className="w-full bg-secondary rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-shadow" placeholder="Opcional" />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl bg-secondary text-sm font-semibold hover:bg-accent transition-colors">Cancelar</button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => { const v = parseFloat(value); if (!isNaN(v) && date) onSave({ value: v, date, note }); }}
              className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Salvar
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default Biomarcadores;
