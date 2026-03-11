import { useHealth } from '@/contexts/HealthContext';
import { useState, useMemo, useEffect, useRef } from 'react';
import { Search, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { Exam } from '@/types/health';
import { ExamEditDialog } from '@/components/ExamEditDialog';
import { ExamCreateDialog } from '@/components/ExamCreateDialog';
import { useToast } from '@/hooks/use-toast';

const statusColors: Record<string, string> = {
  'Em dia': 'bg-status-green status-green',
  'Próximo': 'bg-status-yellow status-yellow',
  'Atrasado': 'bg-status-red status-red',
  'Pendente': 'bg-secondary text-muted-foreground',
};

const importanceColors: Record<string, string> = {
  'Alta': 'bg-status-red status-red',
  'Média': 'bg-status-yellow status-yellow',
  'Baixa': 'bg-status-green status-green',
};

type SortKey = 'category' | 'name' | 'importance' | 'lastDate' | 'nextDate' | 'status';

const Exames = () => {
  const { data } = useHealth();
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('category');
  const [sortAsc, setSortAsc] = useState(true);
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

    result = [...result].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'category') cmp = a.category.localeCompare(b.category);
      else if (sortKey === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortKey === 'importance') {
        const order = { Alta: 0, Média: 1, Baixa: 2 };
        cmp = order[a.importance] - order[b.importance];
      } else if (sortKey === 'lastDate') cmp = (a.lastDate ?? '').localeCompare(b.lastDate ?? '');
      else if (sortKey === 'nextDate') cmp = (a.nextDate ?? '').localeCompare(b.nextDate ?? '');
      else if (sortKey === 'status') {
        const order = { Atrasado: 0, Pendente: 1, Próximo: 2, 'Em dia': 3 };
        cmp = (order[a.status] ?? 4) - (order[b.status] ?? 4);
      }
      return sortAsc ? cmp : -cmp;
    });

    return result;
  }, [data.exams, categoryFilter, statusFilter, search, sortKey, sortAsc]);

  const stats = useMemo(() => ({
    total: data.exams.length,
    emDia: data.exams.filter(e => e.status === 'Em dia').length,
    proximo: data.exams.filter(e => e.status === 'Próximo').length,
    atrasado: data.exams.filter(e => e.status === 'Atrasado').length,
    pendente: data.exams.filter(e => e.status === 'Pendente').length,
  }), [data.exams]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return null;
    return sortAsc ? <ChevronUp className="w-3 h-3 inline ml-0.5" /> : <ChevronDown className="w-3 h-3 inline ml-0.5" />;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Exames e Avaliações</h1>
        <p className="text-muted-foreground mt-1">Acompanhamento completo de exames preventivos</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="glass-card rounded-xl p-3 text-center">
          <p className="text-xl font-bold font-mono">{stats.total}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </div>
        <div className="glass-card rounded-xl p-3 text-center">
          <p className="text-xl font-bold font-mono status-green">{stats.emDia}</p>
          <p className="text-xs text-muted-foreground">Em dia</p>
        </div>
        <div className="glass-card rounded-xl p-3 text-center">
          <p className="text-xl font-bold font-mono status-yellow">{stats.proximo}</p>
          <p className="text-xs text-muted-foreground">Próximo</p>
        </div>
        <div className="glass-card rounded-xl p-3 text-center">
          <p className="text-xl font-bold font-mono status-red">{stats.atrasado}</p>
          <p className="text-xs text-muted-foreground">Atrasado</p>
        </div>
        <div className="glass-card rounded-xl p-3 text-center">
          <p className="text-xl font-bold font-mono">{stats.pendente}</p>
          <p className="text-xs text-muted-foreground">Pendente</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 no-print">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar exame..."
            className="w-full bg-secondary rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="bg-secondary rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Todas categorias</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="bg-secondary rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Todos status</option>
          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 font-medium text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => handleSort('category')}>
                  Categoria<SortIcon col="category" />
                </th>
                <th className="px-4 py-3 font-medium text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => handleSort('name')}>
                  Exame<SortIcon col="name" />
                </th>
                <th className="px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Tipo</th>
                <th className="px-4 py-3 font-medium text-muted-foreground hidden xl:table-cell">Perigo Principal</th>
                <th className="px-4 py-3 font-medium text-muted-foreground hidden md:table-cell cursor-pointer hover:text-foreground" onClick={() => handleSort('importance')}>
                  Importância<SortIcon col="importance" />
                </th>
                <th className="px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Frequência</th>
                <th className="px-4 py-3 font-medium text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => handleSort('lastDate')}>
                  Última Data<SortIcon col="lastDate" />
                </th>
                <th className="px-4 py-3 font-medium text-muted-foreground hidden md:table-cell cursor-pointer hover:text-foreground" onClick={() => handleSort('nextDate')}>
                  Próxima Data<SortIcon col="nextDate" />
                </th>
                <th className="px-4 py-3 font-medium text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => handleSort('status')}>
                  Status<SortIcon col="status" />
                </th>
                <th className="px-4 py-3 font-medium text-muted-foreground hidden xl:table-cell">Médico</th>
                <th className="px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Resultado</th>
                <th className="px-4 py-3 font-medium text-muted-foreground hidden xl:table-cell">Observações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((exam, i) => (
                <tr
                  key={exam.id}
                  onClick={() => setEditingExam(exam)}
                  className="border-b border-border/50 hover:bg-accent/50 cursor-pointer transition-colors animate-fade-in"
                  style={{ animationDelay: `${i * 20}ms`, animationFillMode: 'backwards' }}
                >
                  <td className="px-4 py-3 text-xs text-muted-foreground">{exam.category}</td>
                  <td className="px-4 py-3 font-medium">{exam.name}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell">{exam.type}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground hidden xl:table-cell">{exam.mainRisk}</td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${importanceColors[exam.importance]}`}>
                      {exam.importance}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell">{exam.suggestedFrequency}</td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {exam.lastDate ? new Date(exam.lastDate).toLocaleDateString('pt-BR') : '—'}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs hidden md:table-cell">
                    {exam.nextDate ? new Date(exam.nextDate).toLocaleDateString('pt-BR') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${statusColors[exam.status]}`}>
                      {exam.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground hidden xl:table-cell">{exam.doctor || '—'}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell truncate max-w-[150px]">{exam.resultSummary || '—'}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground hidden xl:table-cell truncate max-w-[120px]">{exam.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">Nenhum exame encontrado.</div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">{filtered.length} exame(s) • Clique para editar • Colunas ordenáveis</p>

      {editingExam && <ExamEditDialog exam={editingExam} onClose={() => setEditingExam(null)} />}
    </div>
  );
};

export default Exames;
