import { useHealth } from '@/contexts/HealthContext';
import { useState } from 'react';
import { Search, Filter } from 'lucide-react';
import { Exam } from '@/types/health';
import { ExamEditDialog } from '@/components/ExamEditDialog';

const statusColors: Record<string, string> = {
  'Em dia': 'bg-status-green status-green',
  'Próximo': 'bg-status-yellow status-yellow',
  'Atrasado': 'bg-status-red status-red',
  'Pendente': 'bg-secondary text-muted-foreground',
};

const Exames = () => {
  const { data } = useHealth();
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [editingExam, setEditingExam] = useState<Exam | null>(null);

  const categories = [...new Set(data.exams.map(e => e.category))].sort();
  const statuses = ['Em dia', 'Próximo', 'Atrasado', 'Pendente'];

  const filtered = data.exams.filter(e => {
    if (categoryFilter && e.category !== categoryFilter) return false;
    if (statusFilter && e.status !== statusFilter) return false;
    if (search && !e.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Exames e Avaliações</h1>
        <p className="text-muted-foreground mt-1">Acompanhamento completo de exames preventivos</p>
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
                <th className="px-4 py-3 font-medium text-muted-foreground">Categoria</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Exame</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Tipo</th>
                <th className="px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Perigo</th>
                <th className="px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Frequência</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Última</th>
                <th className="px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Próxima</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Resultado</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(exam => (
                <tr
                  key={exam.id}
                  onClick={() => setEditingExam(exam)}
                  className="border-b border-border/50 hover:bg-accent/50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 text-xs text-muted-foreground">{exam.category}</td>
                  <td className="px-4 py-3 font-medium">{exam.name}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{exam.type}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell">{exam.mainRisk}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell">{exam.suggestedFrequency}</td>
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
                  <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell truncate max-w-[150px]">{exam.resultSummary || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">Nenhum exame encontrado.</div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">{filtered.length} exame(s) • Clique para editar</p>

      {editingExam && <ExamEditDialog exam={editingExam} onClose={() => setEditingExam(null)} />}
    </div>
  );
};

export default Exames;
