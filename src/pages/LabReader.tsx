import { useState } from 'react';
import { Upload, FileText, CheckCircle2, AlertTriangle, ArrowRight, Sparkles } from 'lucide-react';

type Step = 'upload' | 'processing' | 'review' | 'confirm';

const LabReader = () => {
  const [step, setStep] = useState<Step>('upload');
  const [dragOver, setDragOver] = useState(false);

  const mockResults = [
    { name: 'Glicemia em Jejum', value: '98', unit: 'mg/dL', confidence: 95, status: 'green' },
    { name: 'HbA1c', value: '5.6', unit: '%', confidence: 92, status: 'yellow' },
    { name: 'LDL Colesterol', value: '142', unit: 'mg/dL', confidence: 88, status: 'red' },
    { name: 'HDL Colesterol', value: '45', unit: 'mg/dL', confidence: 90, status: 'green' },
    { name: 'Triglicerídeos', value: '168', unit: 'mg/dL', confidence: 87, status: 'yellow' },
    { name: 'Creatinina', value: '1.1', unit: 'mg/dL', confidence: 94, status: 'green' },
  ];

  const statusColor = (s: string) =>
    s === 'green' ? 'hsl(var(--status-green))' : s === 'yellow' ? 'hsl(var(--status-yellow))' : 'hsl(var(--status-red))';

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
        {[
          { id: 'upload' as const, label: 'Upload' },
          { id: 'processing' as const, label: 'Processando' },
          { id: 'review' as const, label: 'Revisão' },
          { id: 'confirm' as const, label: 'Confirmar' },
        ].map((s, i, arr) => (
          <div key={s.id} className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              step === s.id ? 'bg-primary text-primary-foreground' :
              arr.findIndex(x => x.id === step) > i ? 'bg-status-green text-primary-foreground' :
              'bg-secondary text-muted-foreground'
            }`}>
              {arr.findIndex(x => x.id === step) > i ? '✓' : i + 1}
            </div>
            <span className={step === s.id ? 'font-medium' : 'text-muted-foreground'}>{s.label}</span>
            {i < arr.length - 1 && <ArrowRight className="w-3 h-3 text-muted-foreground" />}
          </div>
        ))}
      </div>

      {/* Upload */}
      {step === 'upload' && (
        <div
          className={`glass-card rounded-xl p-12 text-center border-2 border-dashed transition-colors cursor-pointer ${
            dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
          }`}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); setStep('processing'); setTimeout(() => setStep('review'), 2000); }}
          onClick={() => { setStep('processing'); setTimeout(() => setStep('review'), 2000); }}
        >
          <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-semibold text-lg mb-2">Arraste seu exame aqui</h3>
          <p className="text-sm text-muted-foreground mb-4">Suporta PDF, JPG, PNG de laudos laboratoriais</p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
            <FileText className="w-4 h-4" />
            Selecionar arquivo
          </div>
          <p className="text-[10px] text-muted-foreground mt-4">
            <Sparkles className="w-3 h-3 inline mr-1" />
            Extração inteligente de biomarcadores via IA (em breve)
          </p>
        </div>
      )}

      {/* Processing */}
      {step === 'processing' && (
        <div className="glass-card rounded-xl p-12 text-center animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <h3 className="font-semibold text-lg mb-2">Processando exame...</h3>
          <p className="text-sm text-muted-foreground">Identificando biomarcadores e valores</p>
          <div className="w-48 h-1.5 rounded-full bg-secondary mx-auto mt-6 overflow-hidden">
            <div className="h-full rounded-full bg-primary animate-pulse" style={{ width: '60%' }} />
          </div>
        </div>
      )}

      {/* Review */}
      {step === 'review' && (
        <div className="space-y-4 animate-fade-in">
          <div className="glass-card rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-5 h-5 text-status-green" />
              <h3 className="font-semibold">{mockResults.length} biomarcadores detectados</h3>
            </div>
            <div className="space-y-2">
              {mockResults.map((r, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border border-border/30">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: statusColor(r.status) }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{r.name}</p>
                    <p className="text-xs text-muted-foreground">Confiança: {r.confidence}%</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono font-bold text-sm">{r.value}</p>
                    <p className="text-[10px] text-muted-foreground">{r.unit}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-xl p-4 border-l-4" style={{ borderLeftColor: 'hsl(var(--status-yellow))' }}>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-status-yellow" />
              <p className="text-xs text-muted-foreground">
                <strong>Demonstração:</strong> Esta é uma prévia do fluxo. A extração automática via IA estará disponível em breve.
                Revise os valores antes de confirmar.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep('upload')}
              className="flex-1 px-4 py-2.5 rounded-lg bg-secondary text-sm font-medium hover:bg-accent transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => setStep('confirm')}
              className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
            >
              Confirmar Valores
            </button>
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
          <p className="text-sm text-muted-foreground mb-6">{mockResults.length} biomarcadores atualizados no seu perfil.</p>
          <button
            onClick={() => setStep('upload')}
            className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
          >
            Importar outro exame
          </button>
          <p className="text-[10px] text-muted-foreground mt-4">
            Nota: Na versão atual, os valores não são salvos automaticamente. Este é um protótipo do fluxo.
          </p>
        </div>
      )}
    </div>
  );
};

export default LabReader;
