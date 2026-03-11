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

  addItem('Score Cardíaco', 18, cardiac.value / 100, `${cardiac.value}/100`);
  addItem('Score Metabólico', 18, metabolic.value / 100, `${metabolic.value}/100`);
  
  // Preventive adherence
  const overdueExams = data.exams.filter(e => e.status === 'Atrasado').length;
  const pendingExams = data.exams.filter(e => e.status === 'Pendente').length;
  const totalExams = data.exams.length;
  const adherence = 1 - (overdueExams + pendingExams * 0.5) / totalExams;
  addItem('Adesão Preventiva', 12, clamp(adherence, 0, 1), `${overdueExams} atrasados, ${pendingExams} pendentes`);

  // Sleep
  const sleep = data.lifestyle.sleepHours;
  addItem('Sono', 10, sleep >= 7 && sleep <= 9 ? 1 : sleep >= 6 ? 0.6 : 0.3, `${sleep}h/noite`);
  
  // Exercise
  const ex = data.lifestyle.exerciseFrequency;
  addItem('Exercício', 8, ex >= 5 ? 1 : ex >= 3 ? 0.7 : ex >= 1 ? 0.4 : 0, `${ex}x/semana`);

  // Daily Steps (new from Apple Health)
  const steps = data.lifestyle.dailySteps;
  const stepsScore = steps >= 10000 ? 1 : steps >= 7500 ? 0.8 : steps >= 5000 ? 0.6 : steps >= 2500 ? 0.3 : steps > 0 ? 0.1 : 0;
  addItem('Passos Diários', 8, stepsScore, steps > 0 ? `${steps.toLocaleString('pt-BR')} passos/dia` : 'Sem dados');

  // Heart Rate (resting avg from Apple Health)
  const hr = data.lifestyle.avgHeartRate;
  const hrScore = hr > 0 ? (hr < 60 ? 1 : hr <= 70 ? 0.8 : hr <= 80 ? 0.5 : 0.2) : 0;
  addItem('Freq. Cardíaca', 6, hrScore, hr > 0 ? `${hr} bpm` : 'Sem dados');

  // Activity Minutes
  const actMin = data.lifestyle.activityMinutes;
  const actScore = actMin >= 30 ? 1 : actMin >= 20 ? 0.7 : actMin >= 10 ? 0.4 : actMin > 0 ? 0.2 : 0;
  addItem('Min. Atividade', 6, actScore, actMin > 0 ? `${actMin} min/dia` : 'Sem dados');
  
  // Smoking
  addItem('Tabagismo', 5, data.lifestyle.smokingStatus === 'never' ? 1 : data.lifestyle.smokingStatus === 'former' ? 0.7 : 0, data.lifestyle.smokingStatus === 'never' ? 'Nunca fumou' : data.lifestyle.smokingStatus === 'former' ? 'Ex-fumante' : 'Fumante');
  
  // Alcohol
  const alc = data.lifestyle.alcoholWeekly;
  addItem('Álcool', 4, alc <= 3 ? 1 : alc <= 7 ? 0.7 : alc <= 14 ? 0.4 : 0, `${alc} doses/semana`);
  
  // Vit D
  addItem('Vitamina D', 3, statusScore(getBiomarkerStatus(data, 'vitd')), `${getBiomarkerValue(data, 'vitd') ?? '?'} ng/mL`);
  
  // Derma + Oftalmo
  addItem('Dermatologia', 1, examDone(data, 'Consulta Dermatológica') ? 1 : 0, examDone(data, 'Consulta Dermatológica') ? 'Em dia' : 'Atrasado');
  addItem('Oftalmologia', 1, examDone(data, 'Consulta Oftalmológica') ? 1 : 0, examDone(data, 'Consulta Oftalmológica') ? 'Em dia' : 'Atrasado');

  const total = items.reduce((s, i) => s + i.score, 0);
  const status: Status = total >= 75 ? 'green' : total >= 50 ? 'yellow' : 'red';

  return { value: clamp(Math.round(total), 0, 100), status, trend: 'stable', breakdown: items };
}

export function calcDomainScores(data: HealthData): DomainScore[] {
  const ss = (id: string) => statusScore(getBiomarkerStatus(data, id));
  const val = (id: string) => getBiomarkerValue(data, id);
  const ed = (name: string) => examDone(data, name);
  const toStatus = (s: number): Status => s >= 75 ? 'green' : s >= 50 ? 'yellow' : 'red';

  // Cardiovascular
  const cardioFactors = [ss('pa-sys'), ss('pa-dia'), ss('ldl'), ss('hdl'), ss('trig'), ss('pcr'), ss('apob')];
  const cardioExams = [ed('Eletrocardiograma'), ed('Teste Ergométrico'), ed('Score de Cálcio Coronariano')];
  const cardioExamScore = cardioExams.filter(Boolean).length / cardioExams.length;
  const cardioScore = clamp(Math.round((avg(cardioFactors) * 0.75 + cardioExamScore * 0.25) * 100), 0, 100);
  const cardioIssues = ['pa-sys', 'pa-dia', 'ldl', 'trig', 'pcr', 'apob'].filter(id => getBiomarkerStatus(data, id) !== 'green');
  const cardioSummary = cardioScore >= 75
    ? 'Perfil cardiovascular dentro dos parâmetros adequados.'
    : cardioIssues.length > 0
    ? `Atenção em ${cardioIssues.length} marcador(es): ${cardioIssues.map(id => data.biomarkers.find(b => b.id === id)?.name?.split(' ')[0]).join(', ')}.`
    : 'Exames cardiovasculares pendentes.';

  // Metabolic
  const metabFactors = [ss('glicemia'), ss('hba1c'), ss('insulina'), ss('imc'), ss('cintura'), ss('trig')];
  const metabScore = clamp(Math.round(avg(metabFactors) * 100), 0, 100);
  const metabIssues = ['glicemia', 'hba1c', 'imc', 'cintura'].filter(id => getBiomarkerStatus(data, id) !== 'green');
  const metabSummary = metabScore >= 75
    ? 'Metabolismo equilibrado, sem sinais de resistência insulínica.'
    : `${metabIssues.length} indicador(es) metabólico(s) requerem acompanhamento.`;

  // Liver
  const liverFactors = [ss('tgo'), ss('tgp'), ss('ggt')];
  const liverExam = ed('Ultrassom Abdominal');
  const liverScore = clamp(Math.round((avg(liverFactors) * 0.8 + (liverExam ? 1 : 0) * 0.2) * 100), 0, 100);
  const liverSummary = liverScore >= 75
    ? 'Enzimas hepáticas normais, função preservada.'
    : 'Enzimas hepáticas elevadas — considerar ultrassom e revisão de hábitos.';

  // Kidney
  const kidneyFactors = [ss('creatinina'), ss('ureia')];
  const kidneyExams = [ed('Urina Tipo 1'), ed('Microalbuminúria')];
  const kidneyExamScore = kidneyExams.filter(Boolean).length / kidneyExams.length;
  const kidneyScore = clamp(Math.round((avg(kidneyFactors) * 0.7 + kidneyExamScore * 0.3) * 100), 0, 100);
  const kidneySummary = kidneyScore >= 75
    ? 'Função renal preservada, creatinina e ureia normais.'
    : 'Indicadores renais merecem atenção — acompanhar com nefrologista.';

  // Hormonal
  const hormonalFactors = [ss('tsh'), ss('t4livre'), ss('testosterona')];
  const hormonalScore = clamp(Math.round(avg(hormonalFactors) * 100), 0, 100);
  const hormonalSummary = hormonalScore >= 75
    ? 'Tireoide e testosterona dentro da faixa ideal.'
    : 'Perfil hormonal com alterações — revisar com endocrinologista.';

  // Nutrition
  const nutritionFactors = [ss('vitd'), ss('vitb12'), ss('ferritina')];
  const nutritionScore = clamp(Math.round(avg(nutritionFactors) * 100), 0, 100);
  const nutritionIssues = ['vitd', 'vitb12', 'ferritina'].filter(id => getBiomarkerStatus(data, id) !== 'green');
  const nutritionSummary = nutritionScore >= 75
    ? 'Vitaminas e minerais em níveis adequados.'
    : `Deficiência em ${nutritionIssues.map(id => data.biomarkers.find(b => b.id === id)?.name?.split(' ')[0]).join(', ')} — avaliar suplementação.`;

  // Preventive care
  const totalExams = data.exams.length;
  const upToDate = data.exams.filter(e => e.status === 'Em dia' || e.status === 'Próximo').length;
  const overdue = data.exams.filter(e => e.status === 'Atrasado').length;
  const preventiveScore = clamp(Math.round((upToDate / totalExams) * 100), 0, 100);
  const preventiveSummary = preventiveScore >= 85
    ? 'Check-up em dia, excelente adesão preventiva.'
    : overdue > 0
    ? `${overdue} exame(s) atrasado(s) — agendar o quanto antes.`
    : 'Alguns exames ainda não realizados.';

  return [
    { id: 'cardiovascular', label: 'Cardiovascular', score: cardioScore, status: toStatus(cardioScore), summary: cardioSummary },
    { id: 'metabolic', label: 'Metabólico', score: metabScore, status: toStatus(metabScore), summary: metabSummary },
    { id: 'liver', label: 'Fígado', score: liverScore, status: toStatus(liverScore), summary: liverSummary },
    { id: 'kidney', label: 'Rins', score: kidneyScore, status: toStatus(kidneyScore), summary: kidneySummary },
    { id: 'hormonal', label: 'Hormonal', score: hormonalScore, status: toStatus(hormonalScore), summary: hormonalSummary },
    { id: 'nutrition', label: 'Nutrição', score: nutritionScore, status: toStatus(nutritionScore), summary: nutritionSummary },
    { id: 'preventive', label: 'Prevenção', score: preventiveScore, status: toStatus(preventiveScore), summary: preventiveSummary },
  ];
}

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}
