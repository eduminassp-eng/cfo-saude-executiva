import { useState } from 'react';
import { Exam } from '@/types/health';
import { useHealth } from '@/contexts/HealthContext';
import { X } from 'lucide-react';

interface Props {
  onClose: () => void;
}

const defaultExam: Omit<Exam, 'id'> = {
  category: '',
  name: '',
  type: 'Laboratório',
  mainRisk: '',
  importance: 'Média',
  suggestedFrequency: 'Anual',
  lastDate: null,
  nextDate: null,
  status: 'Pendente',
  doctor: '',
  resultSummary: '',
  notes: '',
};

export function ExamCreateDialog({ onClose }: Props) {
  const { updateData } = useHealth();
  const [form, setForm] = useState(defaultExam);

  const set = <K extends keyof typeof form>(key: K, value: typeof form[K]) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const handleSave = () => {
    if (!form.name.trim() || !form.category.trim()) return;
    const newExam: Exam = {
      ...form,
      id: `e-${Date.now()}`,
      lastDate: form.lastDate || null,
      nextDate: form.nextDate || null,
    };
    updateData(prev => ({ ...prev, exams: [...prev.exams, newExam] }));
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="glass-card rounded-xl p-6 w-full max-w-md animate-slide-up max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold">Novo Exame</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-secondary"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground block mb-1.5">Nome do Exame *</label>
            <input type="text" value={form.name} onChange={e => set('name', e.target.value)} maxLength={100}
              placeholder="Ex: Hemograma Completo"
              className="w-full bg-secondary rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground block mb-1.5">Categoria *</label>
            <input type="text" value={form.category} onChange={e => set('category', e.target.value)} maxLength={50}
              placeholder="Ex: Cardiovascular, Metabolismo"
              className="w-full bg-secondary rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-muted-foreground block mb-1.5">Tipo</label>
              <select value={form.type} onChange={e => set('type', e.target.value)}
                className="w-full bg-secondary rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                <option>Laboratório</option>
                <option>Exame</option>
                <option>Consulta</option>
                <option>Medição</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground block mb-1.5">Importância</label>
              <select value={form.importance} onChange={e => set('importance', e.target.value as Exam['importance'])}
                className="w-full bg-secondary rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="Alta">Alta</option>
                <option value="Média">Média</option>
                <option value="Baixa">Baixa</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground block mb-1.5">Perigo Principal</label>
            <input type="text" value={form.mainRisk} onChange={e => set('mainRisk', e.target.value)} maxLength={100}
              placeholder="Ex: Diabetes, Hipertensão"
              className="w-full bg-secondary rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-muted-foreground block mb-1.5">Frequência</label>
              <input type="text" value={form.suggestedFrequency} onChange={e => set('suggestedFrequency', e.target.value)} maxLength={30}
                className="w-full bg-secondary rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground block mb-1.5">Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value as Exam['status'])}
                className="w-full bg-secondary rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="Pendente">Pendente</option>
                <option value="Em dia">Em dia</option>
                <option value="Próximo">Próximo</option>
                <option value="Atrasado">Atrasado</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-muted-foreground block mb-1.5">Última Data</label>
              <input type="date" value={form.lastDate ?? ''} onChange={e => set('lastDate', e.target.value || null)}
                className="w-full bg-secondary rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground block mb-1.5">Próxima Data</label>
              <input type="date" value={form.nextDate ?? ''} onChange={e => set('nextDate', e.target.value || null)}
                className="w-full bg-secondary rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground block mb-1.5">Médico Responsável</label>
            <input type="text" value={form.doctor} onChange={e => set('doctor', e.target.value)} maxLength={100}
              className="w-full bg-secondary rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground block mb-1.5">Observações</label>
            <input type="text" value={form.notes} onChange={e => set('notes', e.target.value)} maxLength={200}
              className="w-full bg-secondary rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg bg-secondary text-sm font-medium hover:bg-accent transition-colors">Cancelar</button>
            <button
              onClick={handleSave}
              disabled={!form.name.trim() || !form.category.trim()}
              className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Adicionar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
