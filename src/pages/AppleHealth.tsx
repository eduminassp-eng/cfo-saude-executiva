import { useState, useRef, useCallback } from 'react';
import { Upload, Heart, Footprints, Moon, Weight, Timer, CheckCircle2, ArrowRight, X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useHealth } from '@/contexts/HealthContext';
import { toast } from 'sonner';

type Step = 'upload' | 'parsing' | 'review' | 'confirm';

interface HealthMetrics {
  steps: number | null;
  heartRate: number | null;
  sleepHours: number | null;
  weight: number | null;
  activityMinutes: number | null;
  dateRange: string;
}

function parseAppleHealthXML(xmlText: string): HealthMetrics {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, 'text/xml');
  const records = doc.querySelectorAll('Record');

  const steps: number[] = [];
  const heartRates: number[] = [];
  const sleepDurations: number[] = [];
  const weights: number[] = [];
  const activityMinutes: number[] = [];
  let minDate = '';
  let maxDate = '';

  records.forEach(record => {
    const type = record.getAttribute('type') || '';
    const value = parseFloat(record.getAttribute('value') || '0');
    const date = record.getAttribute('startDate')?.split(' ')[0] || record.getAttribute('creationDate')?.split(' ')[0] || '';

    if (date) {
      if (!minDate || date < minDate) minDate = date;
      if (!maxDate || date > maxDate) maxDate = date;
    }

    if (isNaN(value)) return;

    if (type === 'HKQuantityTypeIdentifierStepCount') {
      steps.push(value);
    } else if (type === 'HKQuantityTypeIdentifierHeartRate') {
      heartRates.push(value);
    } else if (type === 'HKQuantityTypeIdentifierBodyMass') {
      weights.push(value);
    } else if (type === 'HKQuantityTypeIdentifierAppleExerciseTime') {
      activityMinutes.push(value);
    } else if (type === 'HKCategoryTypeIdentifierSleepAnalysis') {
      // Sleep records have start/end, calculate duration in hours
      const start = record.getAttribute('startDate');
      const end = record.getAttribute('endDate');
      if (start && end) {
        const ms = new Date(end).getTime() - new Date(start).getTime();
        if (ms > 0 && ms < 24 * 3600000) {
          sleepDurations.push(ms / 3600000);
        }
      }
    }
  });

  const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
  const sum = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) : null;

  // Steps: daily average
  // Group steps by day for accurate daily average
  const stepsByDay = new Map<string, number>();
  let stepIdx = 0;
  records.forEach(record => {
    const type = record.getAttribute('type') || '';
    if (type !== 'HKQuantityTypeIdentifierStepCount') return;
    const value = parseFloat(record.getAttribute('value') || '0');
    const date = record.getAttribute('startDate')?.split(' ')[0] || '';
    if (date && !isNaN(value)) {
      stepsByDay.set(date, (stepsByDay.get(date) || 0) + value);
    }
  });
  const dailyStepsAvg = stepsByDay.size > 0
    ? Math.round([...stepsByDay.values()].reduce((a, b) => a + b, 0) / stepsByDay.size)
    : null;

  // Activity minutes: daily average
  const actByDay = new Map<string, number>();
  records.forEach(record => {
    const type = record.getAttribute('type') || '';
    if (type !== 'HKQuantityTypeIdentifierAppleExerciseTime') return;
    const value = parseFloat(record.getAttribute('value') || '0');
    const date = record.getAttribute('startDate')?.split(' ')[0] || '';
    if (date && !isNaN(value)) {
      actByDay.set(date, (actByDay.get(date) || 0) + value);
    }
  });
  const dailyActAvg = actByDay.size > 0
    ? Math.round([...actByDay.values()].reduce((a, b) => a + b, 0) / actByDay.size)
    : null;

  const dateRange = minDate && maxDate
    ? `${formatDateBR(minDate)} – ${formatDateBR(maxDate)}`
    : 'Sem datas';

  return {
    steps: dailyStepsAvg,
    heartRate: heartRates.length > 0 ? Math.round(avg(heartRates)!) : null,
    sleepHours: sleepDurations.length > 0 ? Math.round(avg(sleepDurations)! * 10) / 10 : null,
    weight: weights.length > 0 ? Math.round(weights[weights.length - 1] * 10) / 10 : null,
    activityMinutes: dailyActAvg,
    dateRange,
  };
}

function formatDateBR(isoDate: string): string {
  const parts = isoDate.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return isoDate;
}

const metricConfig = [
  { key: 'steps' as const, label: 'Passos diários', unit: 'passos/dia', icon: Footprints, color: 'hsl(var(--primary))' },
  { key: 'heartRate' as const, label: 'Freq. Cardíaca média', unit: 'bpm', icon: Heart, color: 'hsl(var(--status-red))' },
  { key: 'sleepHours' as const, label: 'Duração do sono', unit: 'h/noite', icon: Moon, color: 'hsl(var(--status-yellow))' },
  { key: 'weight' as const, label: 'Peso', unit: 'kg', icon: Weight, color: 'hsl(var(--muted-foreground))' },
  { key: 'activityMinutes' as const, label: 'Minutos de atividade', unit: 'min/dia', icon: Timer, color: 'hsl(var(--status-green))' },
];

const AppleHealth = () => {
  const { updateData } = useHealth();
  const [step, setStep] = useState<Step>('upload');
  const [dragOver, setDragOver] = useState(false);
  const [metrics, setMetrics] = useState<HealthMetrics>({
    steps: null, heartRate: null, sleepHours: null, weight: null, activityMinutes: null, dateRange: '',
  });
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [editingMetric, setEditingMetric] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback((file: File) => {
    if (file.size > 200 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 200MB.');
      return;
    }

    setFileName(file.name);
    setStep('parsing');
    setError('');

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        if (!text) throw new Error('Arquivo vazio');

        const parsed = parseAppleHealthXML(text);
        const hasData = parsed.steps !== null || parsed.heartRate !== null ||
          parsed.sleepHours !== null || parsed.weight !== null || parsed.activityMinutes !== null;

        if (!hasData) {
          setError('Nenhum dado de saúde encontrado no XML. Verifique se é um export válido do Apple Health.');
          setStep('upload');
          return;
        }

        setMetrics(parsed);
        setStep('review');
      } catch (err: any) {
        console.error('Apple Health parse error:', err);
        setError('Erro ao processar o arquivo XML.');
        setStep('upload');
        toast.error('Erro ao processar arquivo');
      }
    };
    reader.onerror = () => {
      setError('Erro ao ler o arquivo.');
      setStep('upload');
    };
    reader.readAsText(file);
  }, []);

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

  const updateMetric = (key: keyof HealthMetrics, value: number | null) => {
    setMetrics(prev => ({ ...prev, [key]: value }));
  };

  const confirmAndSave = () => {
    try {
      updateData(prev => {
        const lifestyle = { ...prev.lifestyle };

        if (metrics.steps !== null) lifestyle.dailySteps = metrics.steps;
        if (metrics.heartRate !== null) lifestyle.avgHeartRate = metrics.heartRate;
        if (metrics.sleepHours !== null) lifestyle.sleepHours = metrics.sleepHours;
        if (metrics.activityMinutes !== null) {
          lifestyle.activityMinutes = metrics.activityMinutes;
          // Also estimate exercise frequency from activity minutes
          // 30+ min/day ≈ 7x/week, 20 ≈ 5x, 10 ≈ 3x
          if (metrics.activityMinutes >= 30) lifestyle.exerciseFrequency = 7;
          else if (metrics.activityMinutes >= 20) lifestyle.exerciseFrequency = 5;
          else if (metrics.activityMinutes >= 10) lifestyle.exerciseFrequency = 3;
          else if (metrics.activityMinutes >= 5) lifestyle.exerciseFrequency = 1;
        }
        if (metrics.weight !== null) lifestyle.weight = metrics.weight;

        return { ...prev, lifestyle };
      });

      setStep('confirm');
      toast.success('Dados do Apple Health importados!');
    } catch (err: any) {
      toast.error('Erro ao salvar dados.');
    }
  };

  const resetAll = () => {
    setStep('upload');
    setMetrics({ steps: null, heartRate: null, sleepHours: null, weight: null, activityMinutes: null, dateRange: '' });
    setError('');
    setEditingMetric(null);
  };

  const steps = [
    { id: 'upload' as const, label: 'Upload' },
    { id: 'parsing' as const, label: 'Leitura' },
    { id: 'review' as const, label: 'Revisão' },
    { id: 'confirm' as const, label: 'Salvo' },
  ];
  const currentIdx = steps.findIndex(s => s.id === step);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
          Apple <span className="text-primary">Health</span>
        </h1>
        <p className="text-muted-foreground mt-1">Importe dados de saúde do seu iPhone</p>
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

      <input
        ref={fileInputRef}
        type="file"
        accept=".xml"
        className="hidden"
        onChange={handleFileSelect}
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
            <h3 className="font-semibold text-lg mb-1">Importar export.xml</h3>
            <p className="text-sm text-muted-foreground mb-4">Arraste o arquivo XML exportado do Apple Health</p>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
              <Upload className="w-4 h-4" />
              Selecionar arquivo
            </div>
          </div>

          <div className="glass-card rounded-xl p-4 border-l-4 border-l-primary/50">
            <h4 className="text-sm font-medium mb-2">Como exportar do Apple Health:</h4>
            <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Abra o app <strong>Saúde</strong> no iPhone</li>
              <li>Toque na sua foto de perfil (canto superior direito)</li>
              <li>Role até <strong>Exportar Dados de Saúde</strong></li>
              <li>Confirme e aguarde a exportação</li>
              <li>Descompacte o ZIP e faça upload do <code className="text-primary">export.xml</code></li>
            </ol>
          </div>

          {error && (
            <div className="glass-card rounded-xl p-4 border-l-4 border-l-destructive">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </div>
      )}

      {/* Parsing */}
      {step === 'parsing' && (
        <div className="glass-card rounded-xl p-12 text-center animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Heart className="w-8 h-8 text-primary" />
          </div>
          <h3 className="font-semibold text-lg mb-2">Lendo dados de saúde...</h3>
          <p className="text-sm text-muted-foreground">{fileName}</p>
        </div>
      )}

      {/* Review */}
      {step === 'review' && (
        <div className="space-y-4 animate-fade-in">
          <div className="glass-card rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-status-green" />
                <h3 className="font-semibold">Dados encontrados</h3>
              </div>
              {metrics.dateRange && (
                <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-1 rounded">
                  {metrics.dateRange}
                </span>
              )}
            </div>

            <div className="space-y-2">
              {metricConfig.map(({ key, label, unit, icon: Icon, color }) => {
                const value = metrics[key];
                if (value === null) return null;

                return (
                  <div key={key} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border border-border/30">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}15` }}>
                      <Icon className="w-4 h-4" style={{ color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-[10px] text-muted-foreground">{unit}</p>
                    </div>
                    {editingMetric === key ? (
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          value={value}
                          onChange={e => updateMetric(key, parseFloat(e.target.value) || 0)}
                          className="h-7 w-20 text-sm font-mono"
                          autoFocus
                          onBlur={() => setEditingMetric(null)}
                          onKeyDown={e => e.key === 'Enter' && setEditingMetric(null)}
                        />
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditingMetric(key)}
                        className="text-right shrink-0 hover:opacity-70 transition-opacity"
                      >
                        <p className="font-mono font-bold text-sm">{typeof value === 'number' ? value.toLocaleString('pt-BR') : value}</p>
                      </button>
                    )}
                    <button
                      onClick={() => updateMetric(key, null)}
                      className="p-1 rounded hover:bg-destructive/20 transition-colors shrink-0"
                    >
                      <X className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  </div>
                );
              })}

              {metricConfig.every(m => metrics[m.key] === null) && (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">Nenhum dado selecionado</p>
                </div>
              )}
            </div>
          </div>

          <div className="glass-card rounded-xl p-4 border-l-4" style={{ borderLeftColor: 'hsl(var(--status-yellow))' }}>
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-status-yellow shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                Os valores exibidos são <strong>médias</strong> calculadas do período exportado.
                Toque no valor para ajustar manualmente antes de salvar.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={resetAll}>
              Cancelar
            </Button>
            <Button
              className="flex-1"
              onClick={confirmAndSave}
              disabled={metricConfig.every(m => metrics[m.key] === null)}
            >
              Salvar dados
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
          <h3 className="font-semibold text-lg mb-2">Dados importados com sucesso!</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Seus indicadores de estilo de vida e score de longevidade foram atualizados.
          </p>
          <Button onClick={resetAll}>
            Importar novamente
          </Button>
        </div>
      )}
    </div>
  );
};

export default AppleHealth;
