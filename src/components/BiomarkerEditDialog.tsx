import { useState } from 'react';
import { Biomarker, Status } from '@/types/health';
import { useHealth } from '@/contexts/HealthContext';
import { X } from 'lucide-react';

interface Props {
  biomarker: Biomarker;
  onClose: () => void;
}

function computeStatus(value: number | null, min: number | null, max: number | null): Status {
  if (value === null) return 'unknown';
  if (max !== null && value > max * 1.2) return 'red';
  if (min !== null && value < min * 0.8) return 'red';
  if (max !== null && value > max) return 'yellow';
  if (min !== null && value < min) return 'yellow';
  return 'green';
}

export function BiomarkerEditDialog({ biomarker, onClose }: Props) {
  const { updateData } = useHealth();
  const [value, setValue] = useState(biomarker.value?.toString() ?? '');
  const [date, setDate] = useState(biomarker.lastDate ?? '');
  const [note, setNote] = useState(biomarker.note);

  const handleSave = () => {
    const numVal = value ? parseFloat(value) : null;
    updateData(prev => ({
      ...prev,
      biomarkers: prev.biomarkers.map(b =>
        b.id === biomarker.id
          ? { ...b, value: numVal, lastDate: date || b.lastDate, note, status: computeStatus(numVal, b.targetMin, b.targetMax) }
          : b
      ),
    }));
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="glass-card rounded-xl p-6 w-full max-w-md animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold">{biomarker.name}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-secondary"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground block mb-1.5">Valor ({biomarker.unit})</label>
            <input
              type="number"
              step="any"
              value={value}
              onChange={e => setValue(e.target.value)}
              className="w-full bg-secondary rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Ex: 120"
            />
            {biomarker.targetMin !== null || biomarker.targetMax !== null ? (
              <p className="text-xs text-muted-foreground mt-1">
                Referência: {biomarker.targetMin !== null ? biomarker.targetMin : ''}{biomarker.targetMin !== null && biomarker.targetMax !== null ? '–' : ''}{biomarker.targetMax !== null ? (biomarker.targetMin === null ? `< ${biomarker.targetMax}` : biomarker.targetMax) : ''} {biomarker.unit}
              </p>
            ) : null}
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground block mb-1.5">Data do Exame</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full bg-secondary rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground block mb-1.5">Observação</label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full bg-secondary rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Opcional"
              maxLength={200}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg bg-secondary text-sm font-medium hover:bg-accent transition-colors">
              Cancelar
            </button>
            <button onClick={handleSave} className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
              Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
