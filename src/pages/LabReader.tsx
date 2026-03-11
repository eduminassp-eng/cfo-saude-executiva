import { useState, useRef, useCallback } from 'react';
import { Upload, FileText, CheckCircle2, ArrowRight, Sparkles, X, Pencil, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useHealth } from '@/contexts/HealthContext';
import { toast } from 'sonner';

type Step = 'upload' | 'processing' | 'review' | 'confirm';

interface ExtractedBiomarker {
  name: string;
  value: number;
  unit: string;
  referenceMin: number | null;
  referenceMax: number | null;
  editing?: boolean;
}

// Map known biomarker names to IDs
const BIOMARKER_ID_MAP: Record<string, string> = {
  'glicemia em jejum': 'glicemia',
  'hemoglobina glicada (hba1c)': 'hba1c',
  'hemoglobina glicada': 'hba1c',
  'hba1c': 'hba1c',
  'ldl colesterol': 'ldl',
  'ldl': 'ldl',
  'hdl colesterol': 'hdl',
  'hdl': 'hdl',
  'triglicerídeos': 'trig',
  'triglicerideos': 'trig',
  'creatinina': 'creatinina',
  'ureia': 'ureia',
  'tsh': 'tsh',
  't4 livre': 't4-livre',
  'hemoglobina': 'hemoglobina',
  'hematócrito': 'hematocrito',
  'hematocrito': 'hematocrito',
  'leucócitos': 'leucocitos',
  'leucocitos': 'leucocitos',
  'plaquetas': 'plaquetas',
  'tgo (ast)': 'tgo',
  'tgo': 'tgo',
  'ast': 'tgo',
  'tgp (alt)': 'tgp',
  'tgp': 'tgp',
  'alt': 'tgp',
  'gama gt': 'ggt',
  'ácido úrico': 'acido-urico',
  'acido urico': 'acido-urico',
  'pcr': 'pcr',
  'vitamina d': 'vit-d',
  'vitamina b12': 'vit-b12',
  'ferro sérico': 'ferro',
  'ferro serico': 'ferro',
  'ferritina': 'ferritina',
  'psa total': 'psa',
  'psa': 'psa',
  'testosterona total': 'testosterona',
  'testosterona': 'testosterona',
  'insulina em jejum': 'insulina',
  'insulina': 'insulina',
  'pressão arterial (sistólica)': 'pa-sys',
  'pressão arterial (diastólica)': 'pa-dia',
  'colesterol total': 'col-total',
};

function getBiomarkerId(name: string): string {
  const lower = name.toLowerCase().trim();
  return BIOMARKER_ID_MAP[lower] || lower.replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
}

function getStatus(value: number, min: number | null, max: number | null): 'green' | 'yellow' | 'red' | 'unknown' {
  if (min === null && max === null) return 'unknown';
  if (max !== null && value > max * 1.2) return 'red';
  if (min !== null && value < min * 0.8) return 'red';
  if (max !== null && value > max) return 'yellow';
  if (min !== null && value < min) return 'yellow';
  return 'green';
}

const LabReader = () => {
  const { user } = useAuth();
  const { data: healthData, updateData } = useHealth();
  const [step, setStep] = useState<Step>('upload');
  const [dragOver, setDragOver] = useState(false);
  const [extractedBiomarkers, setExtractedBiomarkers] = useState<ExtractedBiomarker[]>([]);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    if (!user) { toast.error('Faça login primeiro'); return; }

    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Formato não suportado. Use PDF, JPG ou PNG.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 10MB.');
      return;
    }

    setFileName(file.name);
    setStep('processing');
    setError('');

    try {
      // Upload to storage
      const ext = file.name.split('.').pop() || 'pdf';
      const filePath = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from('lab-reports')
        .upload(filePath, file);
      if (uploadErr) throw new Error('Erro no upload: ' + uploadErr.message);

      // Call edge function
      const { data, error: fnErr } = await supabase.functions.invoke('extract-biomarkers', {
        body: { filePath },
      });

      if (fnErr) throw new Error('Erro na extração: ' + fnErr.message);
      if (data?.error) throw new Error(data.error);

      const biomarkers = data?.biomarkers || [];
      if (biomarkers.length === 0) {
        setError('Nenhum biomarcador encontrado. Tente com outro arquivo.');
        setStep('upload');
        return;
      }

      setExtractedBiomarkers(biomarkers);
      setStep('review');
    } catch (err: any) {
      console.error('Lab reader error:', err);
      setError(err.message || 'Erro ao processar arquivo');
      setStep('upload');
      toast.error(err.message || 'Erro ao processar arquivo');
    }
  }, [user]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  }, [processFile]);

  const updateBiomarker = (index: number, field: keyof ExtractedBiomarker, value: any) => {
    setExtractedBiomarkers(prev => prev.map((b, i) =>
      i === index ? { ...b, [field]: value } : b
    ));
  };

  const removeBiomarker = (index: number) => {
    setExtractedBiomarkers(prev => prev.filter((_, i) => i !== index));
  };

  const confirmAndSave = async () => {
    if (extractedBiomarkers.length === 0) return;
    const today = new Date().toISOString().split('T')[0];

    try {
      updateData(prev => {
        const updatedBiomarkers = [...prev.biomarkers];

        for (const ext of extractedBiomarkers) {
          const id = getBiomarkerId(ext.name);
          const existingIdx = updatedBiomarkers.findIndex(b => b.id === id);
          const status = getStatus(ext.value, ext.referenceMin, ext.referenceMax);

          if (existingIdx >= 0) {
            const existing = updatedBiomarkers[existingIdx];
            // Push current value to history
            const newHistory = [...existing.history];
            if (existing.value !== null && existing.lastDate) {
              newHistory.unshift({ value: existing.value, date: existing.lastDate, note: '' });
            }
            updatedBiomarkers[existingIdx] = {
              ...existing,
              value: ext.value,
              unit: ext.unit,
              targetMin: ext.referenceMin ?? existing.targetMin,
              targetMax: ext.referenceMax ?? existing.targetMax,
              status,
              lastDate: today,
              history: newHistory,
            };
          } else {
            updatedBiomarkers.push({
              id,
              name: ext.name,
              value: ext.value,
              unit: ext.unit,
              targetMin: ext.referenceMin,
              targetMax: ext.referenceMax,
              status,
              lastDate: today,
              note: '',
              category: 'Importado',
              history: [],
            });
          }
        }

        return { ...prev, biomarkers: updatedBiomarkers };
      });

      setStep('confirm');
      toast.success(`${extractedBiomarkers.length} biomarcadores importados!`);
    } catch (err: any) {
      toast.error('Erro ao salvar: ' + (err.message || 'Erro desconhecido'));
    }
  };

  const statusColor = (value: number, min: number | null, max: number | null) => {
    const s = getStatus(value, min, max);
    return s === 'green' ? 'hsl(var(--status-green))' :
      s === 'yellow' ? 'hsl(var(--status-yellow))' :
      s === 'red' ? 'hsl(var(--status-red))' : 'hsl(var(--muted-foreground))';
  };

  const steps = [
    { id: 'upload' as const, label: 'Upload' },
    { id: 'processing' as const, label: 'IA' },
    { id: 'review' as const, label: 'Revisão' },
    { id: 'confirm' as const, label: 'Salvo' },
  ];
  const currentIdx = steps.findIndex(s => s.id === step);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
          AI Lab <span className="text-primary">Reader</span>
        </h1>
        <p className="text-muted-foreground mt-1">Importe resultados de exames automaticamente</p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2 text-xs">
        {steps.map((s, i, arr) => (
          <div key={s.id} className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              step === s.id ? 'bg-primary text-primary-foreground' :
              currentIdx > i ? 'bg-status-green text-primary-foreground' :
              'bg-secondary text-muted-foreground'
            }`}>
              {currentIdx > i ? '✓' : i + 1}
            </div>
            <span className={step === s.id ? 'font-medium' : 'text-muted-foreground'}>{s.label}</span>
            {i < arr.length - 1 && <ArrowRight className="w-3 h-3 text-muted-foreground" />}
          </div>
        ))}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Upload */}
      {step === 'upload' && (
        <div className="space-y-4">
          <div
            className={`glass-card rounded-xl p-10 lg:p-12 text-center border-2 border-dashed transition-colors cursor-pointer ${
              dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
            }`}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold text-lg mb-2">Arraste seu exame aqui</h3>
            <p className="text-sm text-muted-foreground mb-4">Suporta PDF, JPG, PNG (máx. 10MB)</p>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
              <FileText className="w-4 h-4" />
              Selecionar arquivo
            </div>
            <p className="text-[10px] text-muted-foreground mt-4">
              <Sparkles className="w-3 h-3 inline mr-1" />
              Extração inteligente de biomarcadores via IA
            </p>
          </div>
          {error && (
            <div className="glass-card rounded-xl p-4 border-l-4 border-l-destructive">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </div>
      )}

      {/* Processing */}
      {step === 'processing' && (
        <div className="glass-card rounded-xl p-12 text-center animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
          <h3 className="font-semibold text-lg mb-2">Processando exame...</h3>
          <p className="text-sm text-muted-foreground mb-1">Identificando biomarcadores e valores com IA</p>
          <p className="text-xs text-muted-foreground">{fileName}</p>
        </div>
      )}

      {/* Review */}
      {step === 'review' && (
        <div className="space-y-4 animate-fade-in">
          <div className="glass-card rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-5 h-5 text-status-green" />
              <h3 className="font-semibold">{extractedBiomarkers.length} biomarcadores detectados</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-3">Revise os valores antes de salvar. Toque no lápis para editar.</p>
            <div className="space-y-2">
              {extractedBiomarkers.map((b, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border border-border/30">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{
                    backgroundColor: statusColor(b.value, b.referenceMin, b.referenceMax)
                  }} />
                  <div className="flex-1 min-w-0">
                    {b.editing ? (
                      <div className="space-y-1">
                        <Input
                          value={b.name}
                          onChange={e => updateBiomarker(i, 'name', e.target.value)}
                          className="h-7 text-sm"
                          placeholder="Nome"
                        />
                        <div className="flex gap-1">
                          <Input
                            type="number"
                            value={b.value}
                            onChange={e => updateBiomarker(i, 'value', parseFloat(e.target.value) || 0)}
                            className="h-7 text-sm w-20"
                            placeholder="Valor"
                          />
                          <Input
                            value={b.unit}
                            onChange={e => updateBiomarker(i, 'unit', e.target.value)}
                            className="h-7 text-sm w-20"
                            placeholder="Unidade"
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm font-medium truncate">{b.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          Ref: {b.referenceMin ?? '–'} – {b.referenceMax ?? '–'} {b.unit}
                        </p>
                      </>
                    )}
                  </div>
                  {!b.editing && (
                    <div className="text-right shrink-0">
                      <p className="font-mono font-bold text-sm">{b.value}</p>
                      <p className="text-[10px] text-muted-foreground">{b.unit}</p>
                    </div>
                  )}
                  <div className="flex flex-col gap-1 shrink-0">
                    <button
                      onClick={() => updateBiomarker(i, 'editing', !b.editing)}
                      className="p-1 rounded hover:bg-accent transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => removeBiomarker(i)}
                      className="p-1 rounded hover:bg-destructive/20 transition-colors"
                    >
                      <X className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => { setStep('upload'); setExtractedBiomarkers([]); setError(''); }}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1"
              onClick={confirmAndSave}
              disabled={extractedBiomarkers.length === 0}
            >
              Confirmar e Salvar
            </Button>
          </div>
        </div>
      )}

      {/* Confirm */}
      {step === 'confirm' && (
        <div className="glass-card rounded-xl p-12 text-center animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-status-green/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-status-green" />
          </div>
          <h3 className="font-semibold text-lg mb-2">Valores importados com sucesso!</h3>
          <p className="text-sm text-muted-foreground mb-6">
            {extractedBiomarkers.length} biomarcadores atualizados no seu perfil.
          </p>
          <Button onClick={() => { setStep('upload'); setExtractedBiomarkers([]); setError(''); }}>
            Importar outro exame
          </Button>
        </div>
      )}
    </div>
  );
};

export default LabReader;
