import { useState, useRef, useCallback } from 'react';
import { Upload, FileText, CheckCircle2, ArrowRight, Sparkles, X, Pencil, Loader2, Table2, Files } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useHealth } from '@/contexts/HealthContext';
import { toast } from 'sonner';

type Step = 'upload' | 'processing' | 'csv-mapping' | 'review' | 'confirm';

interface ExtractedBiomarker {
  name: string;
  value: number;
  unit: string;
  date?: string;
  referenceMin: number | null;
  referenceMax: number | null;
  editing?: boolean;
}

interface CsvMapping {
  name: string;
  value: string;
  unit: string;
  date: string;
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

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };

  // Detect delimiter
  const firstLine = lines[0];
  const delimiter = firstLine.includes(';') ? ';' : ',';

  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (ch === delimiter && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseLine(lines[0]);
  const rows = lines.slice(1).map(parseLine).filter(r => r.some(c => c));
  return { headers, rows };
}

function autoMapColumns(headers: string[]): CsvMapping {
  const mapping: CsvMapping = { name: '', value: '', unit: '', date: '' };
  const lower = headers.map(h => h.toLowerCase().trim());

  const namePatterns = ['nome', 'name', 'biomarcador', 'biomarker', 'exame', 'test', 'analito'];
  const valuePatterns = ['valor', 'value', 'resultado', 'result'];
  const unitPatterns = ['unidade', 'unit', 'un.', 'un'];
  const datePatterns = ['data', 'date', 'dt', 'dia'];

  for (let i = 0; i < lower.length; i++) {
    const h = lower[i];
    if (!mapping.name && namePatterns.some(p => h.includes(p))) mapping.name = headers[i];
    if (!mapping.value && valuePatterns.some(p => h.includes(p))) mapping.value = headers[i];
    if (!mapping.unit && unitPatterns.some(p => h.includes(p))) mapping.unit = headers[i];
    if (!mapping.date && datePatterns.some(p => h.includes(p))) mapping.date = headers[i];
  }

  return mapping;
}

function parseDate(dateStr: string): string | undefined {
  if (!dateStr) return undefined;
  // Try DD/MM/YYYY
  const brMatch = dateStr.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (brMatch) return `${brMatch[3]}-${brMatch[2].padStart(2, '0')}-${brMatch[1].padStart(2, '0')}`;
  // Try YYYY-MM-DD
  const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  return undefined;
}

const NONE_VALUE = '__none__';

const LabReader = () => {
  const { user } = useAuth();
  const { data: healthData, updateData } = useHealth();
  const [step, setStep] = useState<Step>('upload');
  const [dragOver, setDragOver] = useState(false);
  const [extractedBiomarkers, setExtractedBiomarkers] = useState<ExtractedBiomarker[]>([]);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  // Batch state
  const [batchFiles, setBatchFiles] = useState<{ file: File; status: 'pending' | 'processing' | 'done' | 'error'; count: number; error?: string }[]>([]);
  const [batchProgress, setBatchProgress] = useState(0);

  // CSV state
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<string[][]>([]);
  const [csvMapping, setCsvMapping] = useState<CsvMapping>({ name: '', value: '', unit: '', date: '' });

  const processFile = useCallback(async (file: File): Promise<ExtractedBiomarker[]> => {
    if (!user) throw new Error('Faça login primeiro');

    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) throw new Error('Formato não suportado');
    if (file.size > 10 * 1024 * 1024) throw new Error('Arquivo muito grande');

    const ext = file.name.split('.').pop() || 'pdf';
    const filePath = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error: uploadErr } = await supabase.storage.from('lab-reports').upload(filePath, file);
    if (uploadErr) throw new Error('Erro no upload: ' + uploadErr.message);

    const { data, error: fnErr } = await supabase.functions.invoke('extract-biomarkers', { body: { filePath } });
    if (fnErr) throw new Error('Erro na extração: ' + fnErr.message);
    if (data?.error) throw new Error(data.error);

    return data?.biomarkers || [];
  }, [user]);

  const processBatch = useCallback(async (files: File[]) => {
    if (!user) { toast.error('Faça login primeiro'); return; }

    const batch = files.map(f => ({ file: f, status: 'pending' as const, count: 0 }));
    setBatchFiles(batch);
    setStep('processing');
    setError('');
    setBatchProgress(0);

    const allBiomarkers: ExtractedBiomarker[] = [];
    const updatedBatch = [...batch];

    for (let i = 0; i < files.length; i++) {
      updatedBatch[i] = { ...updatedBatch[i], status: 'processing' };
      setBatchFiles([...updatedBatch]);

      try {
        const biomarkers = await processFile(files[i]);
        updatedBatch[i] = { ...updatedBatch[i], status: 'done', count: biomarkers.length };
        allBiomarkers.push(...biomarkers);
      } catch (err: any) {
        updatedBatch[i] = { ...updatedBatch[i], status: 'error', error: err.message };
      }

      setBatchFiles([...updatedBatch]);
      setBatchProgress(Math.round(((i + 1) / files.length) * 100));
    }

    if (allBiomarkers.length === 0) {
      setError('Nenhum biomarcador encontrado em nenhum arquivo.');
      setStep('upload');
      return;
    }

    // Deduplicate: keep latest value per biomarker name
    const deduped = new Map<string, ExtractedBiomarker>();
    allBiomarkers.forEach(b => {
      const key = b.name.toLowerCase().trim();
      const existing = deduped.get(key);
      if (!existing || (b.date && (!existing.date || b.date > existing.date))) {
        deduped.set(key, b);
      }
    });

    setExtractedBiomarkers(Array.from(deduped.values()));
    setFileName(`${files.length} arquivos`);
    setStep('review');
  }, [user, processFile]);

  const handleSingleFile = useCallback(async (file: File) => {
    if (!user) { toast.error('Faça login primeiro'); return; }
    setFileName(file.name);
    setBatchFiles([{ file, status: 'processing', count: 0 }]);
    setStep('processing');
    setError('');
    setBatchProgress(50);

    try {
      const biomarkers = await processFile(file);
      setBatchProgress(100);
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
  }, [user, processFile]);

  const processCSV = useCallback((file: File) => {
    if (!user) { toast.error('Faça login primeiro'); return; }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 5MB.');
      return;
    }

    setFileName(file.name);
    setError('');

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) { setError('Arquivo vazio'); return; }

      const { headers, rows } = parseCSV(text);
      if (headers.length === 0 || rows.length === 0) {
        setError('CSV inválido. Verifique se há cabeçalhos e dados.');
        toast.error('CSV inválido');
        return;
      }

      setCsvHeaders(headers);
      setCsvRows(rows);
      setCsvMapping(autoMapColumns(headers));
      setStep('csv-mapping');
    };
    reader.onerror = () => { setError('Erro ao ler arquivo'); toast.error('Erro ao ler CSV'); };
    reader.readAsText(file);
  }, [user]);

  const applyCsvMapping = () => {
    if (!csvMapping.name || !csvMapping.value) {
      toast.error('Selecione ao menos as colunas "Nome" e "Valor".');
      return;
    }

    const nameIdx = csvHeaders.indexOf(csvMapping.name);
    const valueIdx = csvHeaders.indexOf(csvMapping.value);
    const unitIdx = csvMapping.unit ? csvHeaders.indexOf(csvMapping.unit) : -1;
    const dateIdx = csvMapping.date ? csvHeaders.indexOf(csvMapping.date) : -1;

    const biomarkers: ExtractedBiomarker[] = [];

    for (const row of csvRows) {
      const name = row[nameIdx]?.trim();
      const rawValue = row[valueIdx]?.trim().replace(',', '.');
      const value = parseFloat(rawValue);
      if (!name || isNaN(value)) continue;

      const unit = unitIdx >= 0 ? (row[unitIdx]?.trim() || '') : '';
      const date = dateIdx >= 0 ? parseDate(row[dateIdx]?.trim() || '') : undefined;

      biomarkers.push({
        name,
        value,
        unit,
        date,
        referenceMin: null,
        referenceMax: null,
      });
    }

    if (biomarkers.length === 0) {
      toast.error('Nenhum biomarcador válido encontrado no CSV.');
      return;
    }

    setExtractedBiomarkers(biomarkers);
    setStep('review');
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    if (file.name.toLowerCase().endsWith('.csv') || file.type === 'text/csv') {
      processCSV(file);
    } else {
      processFile(file);
    }
  }, [processFile, processCSV]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  }, [processFile]);

  const handleCsvSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processCSV(file);
    e.target.value = '';
  }, [processCSV]);

  const updateBiomarker = (index: number, field: keyof ExtractedBiomarker, value: any) => {
    setExtractedBiomarkers(prev => prev.map((b, i) =>
      i === index ? { ...b, [field]: value } : b
    ));
  };

  const removeBiomarker = (index: number) => {
    setExtractedBiomarkers(prev => prev.filter((_, i) => i !== index));
  };

  const resetAll = () => {
    setStep('upload');
    setExtractedBiomarkers([]);
    setError('');
    setCsvHeaders([]);
    setCsvRows([]);
    setCsvMapping({ name: '', value: '', unit: '', date: '' });
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
          const dateToUse = ext.date || today;

          if (existingIdx >= 0) {
            const existing = updatedBiomarkers[existingIdx];
            const newHistory = [...existing.history];
            if (existing.value !== null && existing.lastDate) {
              newHistory.unshift({ value: existing.value, date: existing.lastDate, note: '' });
            }
            updatedBiomarkers[existingIdx] = {
              ...existing,
              value: ext.value,
              unit: ext.unit || existing.unit,
              targetMin: ext.referenceMin ?? existing.targetMin,
              targetMax: ext.referenceMax ?? existing.targetMax,
              status,
              lastDate: dateToUse,
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
              lastDate: dateToUse,
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
    { id: 'processing' as const, label: 'Mapear' },
    { id: 'review' as const, label: 'Revisão' },
    { id: 'confirm' as const, label: 'Salvo' },
  ];
  const displayStep = step === 'csv-mapping' ? 'processing' : step;
  const currentIdx = steps.findIndex(s => s.id === displayStep);

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
              displayStep === s.id ? 'bg-primary text-primary-foreground' :
              currentIdx > i ? 'bg-status-green text-primary-foreground' :
              'bg-secondary text-muted-foreground'
            }`}>
              {currentIdx > i ? '✓' : i + 1}
            </div>
            <span className={displayStep === s.id ? 'font-medium' : 'text-muted-foreground'}>{s.label}</span>
            {i < arr.length - 1 && <ArrowRight className="w-3 h-3 text-muted-foreground" />}
          </div>
        ))}
      </div>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        className="hidden"
        onChange={handleFileSelect}
      />
      <input
        ref={csvInputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleCsvSelect}
      />

      {/* Upload */}
      {step === 'upload' && (
        <div className="space-y-4">
          <div
            className={`glass-card rounded-xl p-8 lg:p-10 text-center border-2 border-dashed transition-colors cursor-pointer ${
              dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
            }`}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
            <h3 className="font-semibold text-lg mb-1">Arraste seu exame aqui</h3>
            <p className="text-sm text-muted-foreground mb-4">PDF, JPG, PNG (máx. 10MB)</p>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
              <FileText className="w-4 h-4" />
              Selecionar arquivo
            </div>
            <p className="text-[10px] text-muted-foreground mt-3">
              <Sparkles className="w-3 h-3 inline mr-1" />
              Extração inteligente via IA
            </p>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">ou</span>
            </div>
          </div>

          <div
            className="glass-card rounded-xl p-6 text-center border border-border hover:border-primary/50 transition-colors cursor-pointer"
            onClick={() => csvInputRef.current?.click()}
          >
            <Table2 className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <h3 className="font-semibold mb-1">Importar CSV</h3>
            <p className="text-xs text-muted-foreground">
              Arquivo CSV com colunas: nome, valor, unidade, data
            </p>
          </div>

          {error && (
            <div className="glass-card rounded-xl p-4 border-l-4 border-l-destructive">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </div>
      )}

      {/* Processing (AI) */}
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

      {/* CSV Column Mapping */}
      {step === 'csv-mapping' && (
        <div className="space-y-4 animate-fade-in">
          <div className="glass-card rounded-xl p-5">
            <div className="flex items-center gap-2 mb-1">
              <Table2 className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Mapear colunas do CSV</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              {fileName} — {csvRows.length} linhas encontradas. Associe as colunas abaixo.
            </p>

            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'name' as const, label: 'Nome do biomarcador', required: true },
                { key: 'value' as const, label: 'Valor', required: true },
                { key: 'unit' as const, label: 'Unidade', required: false },
                { key: 'date' as const, label: 'Data do exame', required: false },
              ].map(col => (
                <div key={col.key} className="space-y-1">
                  <label className="text-xs font-medium">
                    {col.label} {col.required && <span className="text-destructive">*</span>}
                  </label>
                  <Select
                    value={csvMapping[col.key] || NONE_VALUE}
                    onValueChange={v => setCsvMapping(prev => ({ ...prev, [col.key]: v === NONE_VALUE ? '' : v }))}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Selecionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE_VALUE}>— Nenhuma —</SelectItem>
                      {csvHeaders.map(h => (
                        <SelectItem key={h} value={h}>{h}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            {/* Preview first 3 rows */}
            {csvRows.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-muted-foreground mb-2">Prévia das primeiras linhas:</p>
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-secondary/50">
                        {csvHeaders.map(h => (
                          <th key={h} className="px-2 py-1.5 text-left font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {csvRows.slice(0, 3).map((row, ri) => (
                        <tr key={ri} className="border-t border-border/30">
                          {row.map((cell, ci) => (
                            <td key={ci} className="px-2 py-1.5 whitespace-nowrap">{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={resetAll}>
              Cancelar
            </Button>
            <Button
              className="flex-1"
              onClick={applyCsvMapping}
              disabled={!csvMapping.name || !csvMapping.value}
            >
              Aplicar e Revisar
            </Button>
          </div>
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
                          {b.date ? b.date : (b.referenceMin !== null || b.referenceMax !== null
                            ? `Ref: ${b.referenceMin ?? '–'} – ${b.referenceMax ?? '–'} ${b.unit}`
                            : b.unit)}
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
            <Button variant="secondary" className="flex-1" onClick={resetAll}>
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
          <Button onClick={resetAll}>
            Importar outro exame
          </Button>
        </div>
      )}
    </div>
  );
};

export default LabReader;
