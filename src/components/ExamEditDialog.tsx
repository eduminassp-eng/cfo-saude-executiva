import { useState } from 'react';
import { Exam } from '@/types/health';
import { useHealth } from '@/contexts/HealthContext';
import { X, Trash2 } from 'lucide-react';

interface Props {
  exam: Exam;
  onClose: () => void;
}

export function ExamEditDialog({ exam, onClose }: Props) {
  const { updateData } = useHealth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [lastDate, setLastDate] = useState(exam.lastDate ?? '');
  const [nextDate, setNextDate] = useState(exam.nextDate ?? '');
  const [doctor, setDoctor] = useState(exam.doctor);
  const [resultSummary, setResultSummary] = useState(exam.resultSummary);
  const [notes, setNotes] = useState(exam.notes);
  const [status, setStatus] = useState(exam.status);

  const handleSave = () => {
    updateData(prev => ({
      ...prev,
      exams: prev.exams.map(e =>
        e.id === exam.id
          ? { ...e, lastDate: lastDate || null, nextDate: nextDate || null, doctor, resultSummary, notes, status }
          : e
      ),
    }));
    onClose();
  };

  const handleDelete = () => {
    updateData(prev => ({
      ...prev,
      exams: prev.exams.filter(e => e.id !== exam.id),
    }));
    onClose();
  };

  if (showDeleteConfirm) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="glass-card rounded-xl p-6 w-full max-w-sm animate-slide-up" onClick={e => e.stopPropagation()}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Excluir exame</h3>
              <p className="text-sm text-muted-foreground">Esta ação não pode ser desfeita</p>
            </div>
          </div>
          <p className="text-sm mb-5">Tem certeza que deseja excluir <strong>{exam.name}</strong>?</p>
          <div className="flex gap-3">
            <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 px-4 py-2.5 rounded-lg bg-secondary text-sm font-medium hover:bg-accent transition-colors">Cancelar</button>
            <button onClick={handleDelete} className="flex-1 px-4 py-2.5 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:opacity-90 transition-opacity">Excluir</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="glass-card rounded-xl p-6 w-full max-w-md animate-slide-up max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold">{exam.name}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-secondary"><X className="w-4 h-4" /></button>
        </div>
        <p className="text-xs text-muted-foreground mb-4">{exam.category} • {exam.type} • {exam.mainRisk}</p>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground block mb-1.5">Status</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as Exam['status'])}
              className="w-full bg-secondary rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="Em dia">Em dia</option>
              <option value="Próximo">Próximo</option>
              <option value="Atrasado">Atrasado</option>
              <option value="Pendente">Pendente</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground block mb-1.5">Última Data</label>
            <input type="date" value={lastDate} onChange={e => setLastDate(e.target.value)}
              className="w-full bg-secondary rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground block mb-1.5">Próxima Data</label>
            <input type="date" value={nextDate} onChange={e => setNextDate(e.target.value)}
              className="w-full bg-secondary rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground block mb-1.5">Médico Responsável</label>
            <input type="text" value={doctor} onChange={e => setDoctor(e.target.value)} maxLength={100}
              className="w-full bg-secondary rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground block mb-1.5">Resultado Resumido</label>
            <input type="text" value={resultSummary} onChange={e => setResultSummary(e.target.value)} maxLength={200}
              className="w-full bg-secondary rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground block mb-1.5">Observações</label>
            <input type="text" value={notes} onChange={e => setNotes(e.target.value)} maxLength={200}
              className="w-full bg-secondary rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button onClick={() => setShowDeleteConfirm(true)} className="p-2.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors" title="Excluir exame">
              <Trash2 className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg bg-secondary text-sm font-medium hover:bg-accent transition-colors">Cancelar</button>
            <button onClick={handleSave} className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">Salvar</button>
          </div>
        </div>
      </div>
    </div>
  );
}
