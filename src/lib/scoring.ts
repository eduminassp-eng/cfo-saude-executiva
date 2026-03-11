import { HealthData, HealthScore, ScoreBreakdown, Status } from '@/types/health';

export interface DomainScore {
  id: string;
  label: string;
  score: number;
  status: Status;
  summary: string;
}

function getBiomarkerValue(data: HealthData, id: string): number | null {
  return data.biomarkers.find(b => b.id === id)?.value ?? null;
}

function getBiomarkerStatus(data: HealthData, id: string): Status {
  return data.biomarkers.find(b => b.id === id)?.status ?? 'unknown';
}

function statusScore(s: Status): number {
  if (s === 'green') return 1;
  if (s === 'yellow') return 0.5;
  if (s === 'red') return 0;
  return 0.3;
}

function examDone(data: HealthData, name: string): boolean {
  const e = data.exams.find(ex => ex.name === name);
  return e?.status === 'Em dia' || e?.status === 'Próximo';
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export function calcCardiacScore(data: HealthData): HealthScore {
  const items: ScoreBreakdown[] = [];
  
  const addItem = (name: string, weight: number, score01: number, detail: string) => {
    items.push({ name, score: Math.round(score01 * weight), maxPoints: weight, detail });
  };

  // PA (15pts)
  const sys = getBiomarkerValue(data, 'pa-sys');
  const dia = getBiomarkerValue(data, 'pa-dia');
  if (sys !== null && dia !== null) {
    const paScore = sys <= 120 && dia <= 80 ? 1 : sys <= 130 && dia <= 85 ? 0.6 : sys <= 140 && dia <= 90 ? 0.3 : 0;
    addItem('Pressão Arterial', 15, paScore, `${sys}/${dia} mmHg`);
  } else addItem('Pressão Arterial', 15, 0.3, 'Sem dados');

  // LDL (15pts)
  addItem('LDL', 15, statusScore(getBiomarkerStatus(data, 'ldl')), `${getBiomarkerValue(data, 'ldl') ?? '?'} mg/dL`);
  
  // HDL (10pts)
  addItem('HDL', 10, statusScore(getBiomarkerStatus(data, 'hdl')), `${getBiomarkerValue(data, 'hdl') ?? '?'} mg/dL`);
  
  // Triglicerídeos (10pts)
  addItem('Triglicerídeos', 10, statusScore(getBiomarkerStatus(data, 'trig')), `${getBiomarkerValue(data, 'trig') ?? '?'} mg/dL`);
  
  // HbA1c (10pts)
  addItem('HbA1c', 10, statusScore(getBiomarkerStatus(data, 'hba1c')), `${getBiomarkerValue(data, 'hba1c') ?? '?'}%`);
  
  // PCR (8pts)
  addItem('PCR Ultrassensível', 8, statusScore(getBiomarkerStatus(data, 'pcr')), `${getBiomarkerValue(data, 'pcr') ?? '?'} mg/L`);

  // ECG (8pts)
  addItem('ECG / Ergométrico', 8, examDone(data, 'Eletrocardiograma') ? 1 : 0, examDone(data, 'Eletrocardiograma') ? 'Realizado' : 'Pendente');
  
  // Score Cálcio (8pts)
  addItem('Score de Cálcio', 8, examDone(data, 'Score de Cálcio Coronariano') ? 1 : 0.3, examDone(data, 'Score de Cálcio Coronariano') ? 'Realizado' : 'Não realizado');
  
  // IMC (8pts)
  const imc = getBiomarkerValue(data, 'imc');
  const imcScore = imc !== null ? (imc < 25 ? 1 : imc < 27 ? 0.6 : imc < 30 ? 0.3 : 0) : 0.3;
  addItem('IMC', 8, imcScore, `${imc ?? '?'} kg/m²`);
  
  // Cintura (8pts)
  const cintura = getBiomarkerValue(data, 'cintura');
  const cinturaScore = cintura !== null ? (cintura < 90 ? 1 : cintura <= 94 ? 0.6 : cintura <= 102 ? 0.3 : 0) : 0.3;
  addItem('Circ. Abdominal', 8, cinturaScore, `${cintura ?? '?'} cm`);

  const total = items.reduce((s, i) => s + i.score, 0);
  const status: Status = total >= 75 ? 'green' : total >= 50 ? 'yellow' : 'red';

  return { value: clamp(total, 0, 100), status, trend: 'stable', breakdown: items };
}

export function calcMetabolicScore(data: HealthData): HealthScore {
  const items: ScoreBreakdown[] = [];
  
  const addItem = (name: string, weight: number, score01: number, detail: string) => {
    items.push({ name, score: Math.round(score01 * weight), maxPoints: weight, detail });
  };

  addItem('Glicemia', 15, statusScore(getBiomarkerStatus(data, 'glicemia')), `${getBiomarkerValue(data, 'glicemia') ?? '?'} mg/dL`);
  addItem('HbA1c', 15, statusScore(getBiomarkerStatus(data, 'hba1c')), `${getBiomarkerValue(data, 'hba1c') ?? '?'}%`);
  addItem('Insulina', 10, statusScore(getBiomarkerStatus(data, 'insulina')), `${getBiomarkerValue(data, 'insulina') ?? '?'} µUI/mL`);
  addItem('Circ. Abdominal', 12, statusScore(getBiomarkerStatus(data, 'cintura')), `${getBiomarkerValue(data, 'cintura') ?? '?'} cm`);
  addItem('IMC', 10, statusScore(getBiomarkerStatus(data, 'imc')), `${getBiomarkerValue(data, 'imc') ?? '?'} kg/m²`);
  addItem('TGO/TGP', 10, Math.min(statusScore(getBiomarkerStatus(data, 'tgo')), statusScore(getBiomarkerStatus(data, 'tgp'))), 'Enzimas hepáticas');
  addItem('GGT', 8, statusScore(getBiomarkerStatus(data, 'ggt')), `${getBiomarkerValue(data, 'ggt') ?? '?'} U/L`);
  addItem('Triglicerídeos', 10, statusScore(getBiomarkerStatus(data, 'trig')), `${getBiomarkerValue(data, 'trig') ?? '?'} mg/dL`);
  
  // Exercise
  const ex = data.lifestyle.exerciseFrequency;
  addItem('Atividade Física', 10, ex >= 5 ? 1 : ex >= 3 ? 0.7 : ex >= 1 ? 0.4 : 0, `${ex}x/semana`);

  const total = items.reduce((s, i) => s + i.score, 0);
  const status: Status = total >= 75 ? 'green' : total >= 50 ? 'yellow' : 'red';

  return { value: clamp(total, 0, 100), status, trend: 'stable', breakdown: items };
}

export function calcLongevityScore(data: HealthData): HealthScore {
  const cardiac = calcCardiacScore(data);
  const metabolic = calcMetabolicScore(data);
  const items: ScoreBreakdown[] = [];
  
  const addItem = (name: string, weight: number, score01: number, detail: string) => {
    items.push({ name, score: Math.round(score01 * weight), maxPoints: weight, detail });
  };

  addItem('Score Cardíaco', 20, cardiac.value / 100, `${cardiac.value}/100`);
  addItem('Score Metabólico', 20, metabolic.value / 100, `${metabolic.value}/100`);
  
  // Preventive adherence
  const overdueExams = data.exams.filter(e => e.status === 'Atrasado').length;
  const pendingExams = data.exams.filter(e => e.status === 'Pendente').length;
  const totalExams = data.exams.length;
  const adherence = 1 - (overdueExams + pendingExams * 0.5) / totalExams;
  addItem('Adesão Preventiva', 15, clamp(adherence, 0, 1), `${overdueExams} atrasados, ${pendingExams} pendentes`);

  // Sleep
  const sleep = data.lifestyle.sleepHours;
  addItem('Sono', 10, sleep >= 7 && sleep <= 9 ? 1 : sleep >= 6 ? 0.6 : 0.3, `${sleep}h/noite`);
  
  // Exercise
  const ex = data.lifestyle.exerciseFrequency;
  addItem('Exercício', 10, ex >= 5 ? 1 : ex >= 3 ? 0.7 : ex >= 1 ? 0.4 : 0, `${ex}x/semana`);
  
  // Smoking
  addItem('Tabagismo', 8, data.lifestyle.smokingStatus === 'never' ? 1 : data.lifestyle.smokingStatus === 'former' ? 0.7 : 0, data.lifestyle.smokingStatus === 'never' ? 'Nunca fumou' : data.lifestyle.smokingStatus === 'former' ? 'Ex-fumante' : 'Fumante');
  
  // Alcohol
  const alc = data.lifestyle.alcoholWeekly;
  addItem('Álcool', 7, alc <= 3 ? 1 : alc <= 7 ? 0.7 : alc <= 14 ? 0.4 : 0, `${alc} doses/semana`);
  
  // Vit D
  addItem('Vitamina D', 5, statusScore(getBiomarkerStatus(data, 'vitd')), `${getBiomarkerValue(data, 'vitd') ?? '?'} ng/mL`);
  
  // Derma + Oftalmo
  addItem('Dermatologia', 2.5, examDone(data, 'Consulta Dermatológica') ? 1 : 0, examDone(data, 'Consulta Dermatológica') ? 'Em dia' : 'Atrasado');
  addItem('Oftalmologia', 2.5, examDone(data, 'Consulta Oftalmológica') ? 1 : 0, examDone(data, 'Consulta Oftalmológica') ? 'Em dia' : 'Atrasado');

  const total = items.reduce((s, i) => s + i.score, 0);
  const status: Status = total >= 75 ? 'green' : total >= 50 ? 'yellow' : 'red';

  return { value: clamp(Math.round(total), 0, 100), status, trend: 'stable', breakdown: items };
}
