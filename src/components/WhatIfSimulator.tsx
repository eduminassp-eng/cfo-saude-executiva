import { useHealth } from '@/contexts/HealthContext';
import { calcCardiacScore, calcMetabolicScore, calcLongevityScore } from '@/lib/scoring';
import { HealthData, Biomarker, Status } from '@/types/health';
import { useState, useMemo, useCallback } from 'react';
import { Beaker, RotateCcw, Heart, Flame, Activity, ArrowRight } from 'lucide-react';

interface SimParam {
  id: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  type: 'biomarker' | 'lifestyle' | 'compliance';
  getValue: (data: HealthData) => number;
}

const SIM_PARAMS: SimParam[] = [
  { id: 'ldl', label: 'LDL Colesterol', unit: 'mg/dL', min: 50, max: 250, step: 5, type: 'biomarker', getValue: d => d.biomarkers.find(b => b.id === 'ldl')?.value ?? 130 },
  { id: 'hdl', label: 'HDL Colesterol', unit: 'mg/dL', min: 20, max: 100, step: 2, type: 'biomarker', getValue: d => d.biomarkers.find(b => b.id === 'hdl')?.value ?? 45 },
  { id: 'trig', label: 'Triglicerídeos', unit: 'mg/dL', min: 50, max: 400, step: 10, type: 'biomarker', getValue: d => d.biomarkers.find(b => b.id === 'trig')?.value ?? 150 },
  { id: 'hba1c', label: 'HbA1c', unit: '%', min: 4.0, max: 10.0, step: 0.1, type: 'biomarker', getValue: d => d.biomarkers.find(b => b.id === 'hba1c')?.value ?? 5.5 },
  { id: 'glicemia', label: 'Glicemia Jejum', unit: 'mg/dL', min: 60, max: 200, step: 5, type: 'biomarker', getValue: d => d.biomarkers.find(b => b.id === 'glicemia')?.value ?? 95 },
  { id: 'imc', label: 'IMC', unit: 'kg/m²', min: 16, max: 45, step: 0.5, type: 'biomarker', getValue: d => d.biomarkers.find(b => b.id === 'imc')?.value ?? 25 },
  { id: 'cintura', label: 'Circ. Abdominal', unit: 'cm', min: 60, max: 130, step: 1, type: 'biomarker', getValue: d => d.biomarkers.find(b => b.id === 'cintura')?.value ?? 90 },
  { id: 'exerciseFrequency', label: 'Exercício', unit: 'x/sem', min: 0, max: 7, step: 1, type: 'lifestyle', getValue: d => d.lifestyle.exerciseFrequency },
  { id: 'sleepHours', label: 'Sono', unit: 'h/noite', min: 3, max: 12, step: 0.5, type: 'lifestyle', getValue: d => d.lifestyle.sleepHours },
  { id: 'compliance', label: 'Exames em dia', unit: '%', min: 0, max: 100, step: 5, type: 'compliance', getValue: d => {
    const total = d.exams.length;
    if (total === 0) return 100;
    const upToDate = d.exams.filter(e => e.status === 'Em dia' || e.status === 'Próximo').length;
    return Math.round((upToDate / total) * 100);
  }},
];

function recalcStatus(value: number, b: Biomarker): Status {
  if (b.targetMin !== null && b.targetMax !== null) {
    return value >= b.targetMin && value <= b.targetMax ? 'green' : value <= b.targetMax * 1.15 && value >= b.targetMin * 0.85 ? 'yellow' : 'red';
  }
  if (b.targetMax !== null) {
    return value <= b.targetMax ? 'green' : value <= b.targetMax * 1.15 ? 'yellow' : 'red';
  }
  if (b.targetMin !== null) {
    return value >= b.targetMin ? 'green' : value >= b.targetMin * 0.85 ? 'yellow' : 'red';
  }
  return 'unknown';
}

function buildSimData(data: HealthData, overrides: Record<string, number>): HealthData {
  const biomarkerIds = ['ldl', 'hdl', 'trig', 'hba1c', 'glicemia', 'imc', 'cintura'];

  const biomarkers = data.biomarkers.map(b => {
    if (biomarkerIds.includes(b.id) && overrides[b.id] !== undefined) {
      const newVal = overrides[b.id];
      return { ...b, value: newVal, status: recalcStatus(newVal, b) };
    }
    return b;
  });

  const lifestyle = { ...data.lifestyle };
  if (overrides.exerciseFrequency !== undefined) lifestyle.exerciseFrequency = overrides.exerciseFrequency;
  if (overrides.sleepHours !== undefined) lifestyle.sleepHours = overrides.sleepHours;

  // Compliance: adjust exam statuses proportionally
  let exams = [...data.exams];
  if (overrides.compliance !== undefined) {
    const targetPct = overrides.compliance / 100;
    const total = exams.length;
    const targetUpToDate = Math.round(targetPct * total);
    const currentUpToDate = exams.filter(e => e.status === 'Em dia' || e.status === 'Próximo').length;

    if (targetUpToDate > currentUpToDate) {
      // Convert some overdue/pending to "Em dia"
      let toConvert = targetUpToDate - currentUpToDate;
      exams = exams.map(e => {
        if (toConvert > 0 && (e.status === 'Atrasado' || e.status === 'Pendente')) {
          toConvert--;
          return { ...e, status: 'Em dia' as const };
        }
        return e;
      });
    } else if (targetUpToDate < currentUpToDate) {
      let toConvert = currentUpToDate - targetUpToDate;
      exams = exams.map(e => {
        if (toConvert > 0 && (e.status === 'Em dia' || e.status === 'Próximo')) {
          toConvert--;
          return { ...e, status: 'Pendente' as const };
        }
        return e;
      });
    }
  }

  return { ...data, biomarkers, lifestyle, exams };
}

const scoreConfigs = [
  { key: 'cardiac' as const, label: 'Cardíaco', icon: Heart, colorVar: '--score-cardiac', calc: calcCardiacScore },
  { key: 'metabolic' as const, label: 'Metabólico', icon: Flame, colorVar: '--score-metabolic', calc: calcMetabolicScore },
  { key: 'longevity' as const, label: 'Longevidade', icon: Activity, colorVar: '--score-longevity', calc: calcLongevityScore },
];

export function WhatIfSimulator() {
  const { data } = useHealth();

  // Initialize overrides from current data
  const defaults = useMemo(() => {
    const d: Record<string, number> = {};
    SIM_PARAMS.forEach(p => { d[p.id] = p.getValue(data); });
    return d;
  }, [data]);

  const [overrides, setOverrides] = useState<Record<string, number>>(defaults);
  const [active, setActive] = useState(false);

  const hasChanges = useMemo(() =>
    SIM_PARAMS.some(p => overrides[p.id] !== defaults[p.id]),
    [overrides, defaults]
  );

  const simData = useMemo(() => buildSimData(data, overrides), [data, overrides]);

  const currentScores = useMemo(() => scoreConfigs.map(c => ({ ...c, value: c.calc(data).value })), [data]);
  const simScores = useMemo(() => scoreConfigs.map(c => ({ ...c, value: c.calc(simData).value })), [simData]);

  const handleChange = useCallback((id: string, value: number) => {
    setOverrides(prev => ({ ...prev, [id]: value }));
  }, []);

  const reset = useCallback(() => setOverrides(defaults), [defaults]);

  if (!active) {
    return (
      <button
        onClick={() => setActive(true)}
        className="glass-card rounded-xl p-5 w-full text-left hover:bg-accent/30 transition-all group"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-secondary group-hover:bg-primary/10 transition-colors">
            <Beaker className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Simulador What-If</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Simule mudanças nos seus indicadores e veja o impacto nos scores</p>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto group-hover:translate-x-1 transition-transform" />
        </div>
      </button>
    );
  }

  return (
    <div className="glass-card rounded-xl p-5 space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Beaker className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Simulador What-If</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Ajuste os parâmetros e veja o impacto projetado</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <button onClick={reset} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-secondary">
              <RotateCcw className="w-3 h-3" />
              Resetar
            </button>
          )}
          <button onClick={() => { setActive(false); reset(); }} className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover:bg-secondary transition-colors">
            Fechar
          </button>
        </div>
      </div>

      {/* Score comparison */}
      <div className="grid grid-cols-3 gap-3">
        {scoreConfigs.map((cfg, idx) => {
          const current = currentScores[idx].value;
          const sim = simScores[idx].value;
          const delta = sim - current;
          const Icon = cfg.icon;
          return (
            <div
              key={cfg.key}
              className="rounded-xl border border-border/40 p-4 text-center space-y-2"
              style={{ background: `linear-gradient(135deg, hsl(var(${cfg.colorVar}) / 0.04), transparent)` }}
            >
              <Icon className="w-4 h-4 mx-auto" style={{ color: `hsl(var(${cfg.colorVar}))` }} />
              <p className="text-[10px] text-muted-foreground font-medium">{cfg.label}</p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-lg font-mono font-bold text-muted-foreground">{current}</span>
                {hasChanges && (
                  <>
                    <ArrowRight className="w-3 h-3 text-muted-foreground/40" />
                    <span className="text-lg font-mono font-bold" style={{ color: `hsl(var(${cfg.colorVar}))` }}>{sim}</span>
                  </>
                )}
              </div>
              {hasChanges && delta !== 0 && (
                <span
                  className="inline-block text-xs font-mono font-bold px-2 py-0.5 rounded-full"
                  style={{
                    color: delta > 0 ? 'hsl(var(--status-green))' : 'hsl(var(--status-red))',
                    backgroundColor: delta > 0 ? 'hsl(var(--status-green) / 0.12)' : 'hsl(var(--status-red) / 0.12)',
                  }}
                >
                  {delta > 0 ? '+' : ''}{delta}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Sliders */}
      <div className="space-y-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
          {SIM_PARAMS.map(p => {
            const currentVal = defaults[p.id];
            const simVal = overrides[p.id];
            const changed = currentVal !== simVal;
            return (
              <div key={p.id} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium">{p.label}</label>
                  <div className="flex items-center gap-1.5">
                    {changed && (
                      <span className="text-[10px] text-muted-foreground line-through font-mono">{formatVal(currentVal, p.step)}</span>
                    )}
                    <span
                      className={`text-xs font-mono font-bold ${changed ? 'text-primary' : 'text-muted-foreground'}`}
                    >
                      {formatVal(simVal, p.step)} {p.unit}
                    </span>
                  </div>
                </div>
                <input
                  type="range"
                  min={p.min}
                  max={p.max}
                  step={p.step}
                  value={simVal}
                  onChange={e => handleChange(p.id, parseFloat(e.target.value))}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-primary bg-secondary"
                  style={{
                    background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${((simVal - p.min) / (p.max - p.min)) * 100}%, hsl(var(--secondary)) ${((simVal - p.min) / (p.max - p.min)) * 100}%, hsl(var(--secondary)) 100%)`,
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Hint */}
      <p className="text-[10px] text-muted-foreground/60 text-center leading-relaxed">
        Simulação hipotética para fins de planejamento. Não constitui recomendação médica.
      </p>
    </div>
  );
}

function formatVal(v: number, step: number): string {
  return step < 1 ? v.toFixed(1) : String(Math.round(v));
}
