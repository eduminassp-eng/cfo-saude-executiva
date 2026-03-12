import { useState, useMemo } from 'react';
import { useHealth } from '@/contexts/HealthContext';
import { ListPageSkeleton } from '@/components/skeletons/DashboardSkeleton';
import { Biomarker, BiomarkerHistoryEntry, Status } from '@/types/health';
import { BiomarkerEditDialog } from '@/components/BiomarkerEditDialog';
import { TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp, Pencil, Trash2, X } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, ReferenceLine, YAxis, XAxis, Tooltip } from 'recharts';
import { PageTransition } from '@/components/motion/PageTransition';
import { StaggerContainer, StaggerItem } from '@/components/motion/StaggerContainer';
import { motion, AnimatePresence } from 'framer-motion';

const statusConfig: Record<Status, { bg: string; text: string; label: string }> = {
  green: { bg: 'bg-status-green', text: 'status-green', label: 'Normal' },
  yellow: { bg: 'bg-status-yellow', text: 'status-yellow', label: 'Atenção' },
  red: { bg: 'bg-status-red', text: 'status-red', label: 'Ação' },
  unknown: { bg: 'bg-secondary', text: 'text-muted-foreground', label: '—' },
};

const categories = ['Todos', 'Cardiovascular', 'Metabolismo', 'Fígado', 'Rins', 'Hormonal', 'Composição Corporal', 'Urologia'];

function getTrend(b: Biomarker): 'up' | 'down' | 'stable' {
  if (!b.value || !b.history || b.history.length === 0) return 'stable';
  const prev = b.history[0].value;
  const diff = b.value - prev;
  if (Math.abs(diff) < prev * 0.02) return 'stable';
  return diff > 0 ? 'up' : 'down';
}

function TrendIcon({ trend, isGoodUp }: { trend: 'up' | 'down' | 'stable'; isGoodUp: boolean }) {
  if (trend === 'stable') return <Minus className="w-3.5 h-3.5 text-muted-foreground" />;
  const isGood = (trend === 'up' && isGoodUp) || (trend === 'down' && !isGoodUp);
  const color = isGood ? 'status-green' : 'status-red';
  return trend === 'up'
    ? <TrendingUp className={`w-3.5 h-3.5 ${color}`} />
    : <TrendingDown className={`w-3.5 h-3.5 ${color}`} />;
}

// For markers where higher = worse (most markers), "up" is bad
const markersWhereUpIsGood = new Set(['hdl', 'vitd', 'vitb12', 'ferritina', 'testosterona']);

const Biomarcadores = () => {
  const { data, updateData } = useHealth();
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

  return (
    <PageTransition>
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Biomarcadores</h1>
        <p className="text-muted-foreground mt-1">Acompanhamento completo dos seus indicadores de saúde</p>
      </div>

      {/* Summary cards */}
      <StaggerContainer className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { value: stats.total, label: 'Total', className: '' },
          { value: stats.green, label: 'Normal', className: 'status-green' },
          { value: stats.yellow, label: 'Atenção', className: 'status-yellow' },
          { value: stats.red, label: 'Ação', className: 'status-red' },
        ].map(s => (
          <StaggerItem key={s.label}>
            <div className="glass-card p-4 text-center">
              <p className={`display-number text-2xl ${s.className}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </div>
          </StaggerItem>
        ))}
      </StaggerContainer>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              categoryFilter === cat
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-accent'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Biomarker list */}
      <div className="space-y-2">
        {filtered.map((b, i) => {
          const trend = getTrend(b);
          const isGoodUp = markersWhereUpIsGood.has(b.id);
          const isExpanded = expandedId === b.id;
          const config = statusConfig[b.status];

          const chartData = [
            ...(b.history ?? []).slice().reverse().map(h => ({ date: h.date, value: h.value })),
            ...(b.value !== null && b.lastDate ? [{ date: b.lastDate, value: b.value }] : []),
          ];

          return (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03, duration: 0.3 }}
              className="glass-card overflow-hidden"
            >
              <button
                onClick={() => setExpandedId(isExpanded ? null : b.id)}
                className="w-full p-4 flex items-center gap-3 text-left hover:bg-accent/30 transition-colors"
              >
                {/* Status dot */}
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: `hsl(var(--status-${b.status === 'unknown' ? 'yellow' : b.status}))` }}
                />

                {/* Name + category */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{b.name}</p>
                  <p className="text-xs text-muted-foreground">{b.category}</p>
                </div>

                {/* Value */}
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-lg font-bold font-mono">{b.value ?? '—'}</span>
                    <span className="text-xs text-muted-foreground">{b.unit}</span>
                    <TrendIcon trend={trend} isGoodUp={isGoodUp} />
                  </div>
                  {b.lastDate && (
                    <p className="text-xs text-muted-foreground">
                      {new Date(b.lastDate).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>

                {/* Badge */}
                <span className={`px-2 py-0.5 rounded text-xs font-medium shrink-0 ${config.bg} ${config.text}`}>
                  {config.label}
                </span>

                {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
              </button>

              <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                <div className="px-4 pb-4 pt-0 border-t border-border space-y-4">
                  {/* Info row */}
                  <div className="flex items-center justify-between pt-3">
                    <div className="text-xs text-muted-foreground">
                      Referência: {b.targetMin !== null ? b.targetMin : ''}{b.targetMin !== null && b.targetMax !== null ? '–' : ''}{b.targetMax !== null ? (b.targetMin === null ? `< ${b.targetMax}` : b.targetMax) : (b.targetMin !== null ? `> ${b.targetMin}` : '—')} {b.unit}
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingBiomarker(b); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity"
                    >
                      <Pencil className="w-3 h-3" />
                      Editar
                    </button>
                  </div>

                  {b.note && <p className="text-xs text-muted-foreground italic">{b.note}</p>}

                  {/* Sparkline chart */}
                  {chartData.length >= 2 && (
                    <div className="h-32 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                          <XAxis
                            dataKey="date"
                            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                            tickFormatter={d => new Date(d).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            domain={['auto', 'auto']}
                            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                            axisLine={false}
                            tickLine={false}
                            width={45}
                          />
                          <Tooltip
                            contentStyle={{
                              background: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px',
                              fontSize: '12px',
                            }}
                            labelFormatter={d => new Date(d).toLocaleDateString('pt-BR')}
                            formatter={(val: number) => [`${val} ${b.unit}`, b.name]}
                          />
                          {b.targetMax !== null && (
                            <ReferenceLine y={b.targetMax} stroke="hsl(var(--status-yellow))" strokeDasharray="4 4" strokeOpacity={0.6} />
                          )}
                          {b.targetMin !== null && (
                            <ReferenceLine y={b.targetMin} stroke="hsl(var(--status-yellow))" strokeDasharray="4 4" strokeOpacity={0.6} />
                          )}
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2}
                            dot={{ r: 3, fill: 'hsl(var(--primary))' }}
                            activeDot={{ r: 5 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* History table */}
                  {b.history && b.history.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">Histórico</p>
                      <div className="space-y-1">
                        {b.history.map((h, i) => (
                          <div key={i} className="flex items-center justify-between text-xs py-1.5 px-2 rounded bg-secondary/50 group">
                            <span className="text-muted-foreground">{new Date(h.date).toLocaleDateString('pt-BR')}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-medium">{h.value} {b.unit}</span>
                              {h.note && <span className="text-muted-foreground italic">{h.note}</span>}
                              <button
                                onClick={(e) => { e.stopPropagation(); setEditingHistory({ biomarkerId: b.id, index: i, entry: { ...h } }); }}
                                className="p-1 rounded hover:bg-accent opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Editar"
                              >
                                <Pencil className="w-3 h-3 text-muted-foreground" />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteHistory(b.id, i); }}
                                className="p-1 rounded hover:bg-destructive/20 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Excluir"
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
        })}
      </div>

      {editingBiomarker && (
        <BiomarkerEditDialog
          biomarker={editingBiomarker}
          onClose={() => setEditingBiomarker(null)}
        />
      )}

      {/* Edit history entry dialog */}
      {editingHistory && (
        <HistoryEditDialog
          entry={editingHistory.entry}
          unit={data.biomarkers.find(b => b.id === editingHistory.biomarkerId)?.unit ?? ''}
          onSave={(entry) => handleSaveHistory(editingHistory.biomarkerId, editingHistory.index, entry)}
          onClose={() => setEditingHistory(null)}
        />
      )}
    </div>
    </PageTransition>
  );
};

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
      <div className="glass-card rounded-xl p-6 w-full max-w-sm animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-semibold">Editar Registro Histórico</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-secondary"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Valor ({unit})</label>
            <input type="number" step="any" value={value} onChange={e => setValue(e.target.value)}
              className="w-full bg-secondary rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Data</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full bg-secondary rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Observação</label>
            <input type="text" value={note} onChange={e => setNote(e.target.value)} maxLength={200}
              className="w-full bg-secondary rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Opcional" />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg bg-secondary text-sm font-medium hover:bg-accent transition-colors">Cancelar</button>
            <button onClick={() => { const v = parseFloat(value); if (!isNaN(v) && date) onSave({ value: v, date, note }); }}
              className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">Salvar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Biomarcadores;
